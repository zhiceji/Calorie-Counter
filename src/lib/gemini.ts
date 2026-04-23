import { GoogleGenAI, Type } from "@google/genai";
import { MealRecord } from "../types";

export interface ApiConfig {
  engine: 'gemini' | 'openai';
  apiKey: string;
  baseUrl: string;
  model: string;
}

const DEFAULT_CONFIG: ApiConfig = {
  engine: 'openai',
  apiKey: '',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat'
};

function getConfig(): ApiConfig {
  const saved = localStorage.getItem('nutri_api_config');
  if (!saved) return DEFAULT_CONFIG;
  try {
    const parsed = JSON.parse(saved);
    // Migration: if it was gemini, nudge to deepseek as per new request
    return parsed.engine === 'openai' ? parsed : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function testApiConnection(config: ApiConfig): Promise<{ success: boolean; message: string }> {
  try {
    if (config.engine === 'gemini') {
      const apiKey = config.apiKey || (process.env.GEMINI_API_KEY as string);
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: config.model || "gemini-1.5-flash",
        contents: ["hi"],
        config: { maxOutputTokens: 5 }
      });
      return { success: true, message: "Gemini 连接成功！" };
    } else {
      const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model || 'deepseek-chat',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 5
        })
      });
      if (response.ok) return { success: true, message: "DeepSeek 连接成功！" };
      const err = await response.json();
      return { success: false, message: err.error?.message || "连接失败 (" + response.status + ")" };
    }
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "未知错误" };
  }
}

const MEAL_PARSER_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, description: "breakfast, morning_snack, lunch, afternoon_snack, dinner, evening_snack, or exercise." },
      name: { type: Type.STRING },
      cal: { type: Type.NUMBER, description: "食物为正数，运动为负数" },
      carb: { type: Type.NUMBER },
      pro: { type: Type.NUMBER },
      fat: { type: Type.NUMBER },
    },
    required: ["type", "name", "cal", "carb", "pro", "fat"],
  },
};

export async function parseFoodInput(input: string, currentTime: Date): Promise<Partial<MealRecord>[]> {
  const config = getConfig();
  const timeStr = currentTime.toLocaleTimeString();
  
  const systemInstruction = `你是一位全能营养与运动专家。
核心规则（优先级最高）：
1. 凡是涉及“运动”、“健身”、“跑步”、“快走”等体力活动，必须归类为 type: 'exercise'。
2. 运动类的热量 (cal) 必须为负数（代表消耗），且碳水、蛋白、脂肪为 0。
3. 非运动条目（食物）根据当前时间 (${timeStr}) 归类：
   - 05:00-10:00 -> 'breakfast' (早餐)
   - 10:00-11:00 -> 'morning_snack' (早加餐)
   - 11:00-15:00 -> 'lunch' (午餐)
   - 15:00-17:00 -> 'afternoon_snack' (午加餐)
   - 17:00-21:00 -> 'dinner' (晚餐)
   - 21:00-05:00 -> 'evening_snack' (晚加餐)

输出规范：
- 仅输出 JSON。格式：[{"name":"项目","cal":数值,"carb":0,"pro":0,"fat":0,"type":"类型"}]
- 示例：[{"name":"慢跑","cal":-300,"carb":0,"pro":0,"fat":0,"type":"exercise"}]`;

  if (config.engine === 'openai') {
    const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'deepseek-chat',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: input }
        ],
        response_format: { type: 'json_object' }
      })
    });
    const data = await response.json();
    let content = data.choices[0].message.content;
    const parsed = JSON.parse(content);
    const rawItems = Array.isArray(parsed) ? parsed : (parsed.items || parsed.records || []);
    
    // 强制纠正：如果包含关键词或是被识别为 exercise，强制其热量为负
    return rawItems.map((item: any) => {
      const isExerciseKeyword = /运动|跑步|健身|快走|游泳|骑行/.test(item.name);
      if (item.type === 'exercise' || isExerciseKeyword) {
        item.type = 'exercise';
        item.cal = -Math.abs(item.cal);
        item.carb = 0;
        item.pro = 0;
        item.fat = 0;
      }
      return item;
    });
  }

  const apiKey = config.apiKey || (process.env.GEMINI_API_KEY as string);
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: config.model || "gemini-1.5-flash",
    contents: [input],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: MEAL_PARSER_SCHEMA,
    },
  });

  return JSON.parse(response.text || "[]");
}

export async function parseFoodImage(base64Image: string, currentTime: Date): Promise<Partial<MealRecord>[]> {
  const config = getConfig();
  if (config.engine === 'openai') {
    throw new Error("图像识别目前仅支持 Gemini 引擎。");
  }

  const apiKey = config.apiKey || (process.env.GEMINI_API_KEY as string);
  const ai = new GoogleGenAI({ apiKey });
  const timeStr = currentTime.toLocaleTimeString();
  const systemInstruction = `你是一位营养专家。分析图片以识别食物。
估算热量、碳水、蛋白质、脂肪。
当前时间: ${timeStr}。
如果图片中包含运动、健身相关的场景，type 设为 'exercise'。
餐食类型根据时间推断: breakfast (5-10点), morning_snack (10-11点), lunch (11-15点), afternoon_snack (15-17点), dinner (17-21点), evening_snack (21-5点)。
所有输出必须为中文。
返回符合 Schema 的 JSON 数组。`;

  const response = await ai.models.generateContent({
    model: config.model || "gemini-1.5-flash",
    contents: [
      {
        parts: [
          { text: "Breakdown nutrition items in this image." },
          { inlineData: { mimeType: "image/jpeg", data: base64Image } }
        ]
      }
    ],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: MEAL_PARSER_SCHEMA,
    },
  });

  return JSON.parse(response.text || "[]");
}
