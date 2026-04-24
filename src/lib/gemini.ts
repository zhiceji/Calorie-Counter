import { MealRecord } from "../types";

export interface ApiConfig {
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
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "未知错误" };
  }
}



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
