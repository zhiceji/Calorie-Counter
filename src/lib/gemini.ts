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
    return JSON.parse(saved);
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
  
  const systemInstruction = `你是一位全能营养与运动专家，逻辑极其严密。

核心逻辑约束（自我审查）：
1. 能量守恒审查（针对食物）：总热量(cal) 必须满足 (carb*4 + pro*4 + fat*9) 的计算结果，允许误差范围 ±10%。如果原始数据不符，必须以宏量元素为准重新修正 cal。
2. 带骨肉类特殊处理：排骨、酱大骨、鸡腿、鸭腿、猪蹄等带骨肉类，name 中必须注明"带骨"或"可食部分"，热量按可食部分计算（不含骨头）。示例：
   - "排骨" -> "排骨(带骨)"
   - "鸡腿" -> "鸡腿(可食部分)"
   - "酱大骨" -> "酱大骨(可食部分)"
3. 运动属性审查：
   - 凡涉及体力活动（跑步、健身、球类等），type 强制为 'exercise'。
   - cal 必须为负数（消耗），carb/pro/fat 强制归零。
4. 自动时段归类：根据当前时间 (${timeStr}) 判定：
   - [05:00-10:00]: 'breakfast' | [10:00-11:00]: 'morning_snack' 
   - [11:00-15:00]: 'lunch' | [15:00-17:00]: 'afternoon_snack'
   - [17:00-21:00]: 'dinner' | [21:00-05:00]: 'evening_snack'

输出规范：
- 严禁任何解释性文字，仅输出标准的 JSON 数组。
- 数值要求：所有数值必须为整数（Integer）。
- 格式：[{"name":"项目","cal":数值,"carb":数值,"pro":数值,"fat":数值,"type":"类型"}]

示例：
- 输入"苹果" -> [{"name":"苹果(约200g)","cal":104,"carb":27,"pro":1,"fat":0,"type":"breakfast"}]
- 输入"慢跑30分钟" -> [{"name":"慢跑(30分钟)","cal":-300,"carb":0,"pro":0,"fat":0,"type":"exercise"}]`;

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
      ]
    })
  });
  
  if (!response.ok) {
    let errMsg = `API 错误 (${response.status})`;
    try {
      const errBody = await response.text();
      errMsg = `${response.status}: ${errBody.slice(0, 200)}`;
    } catch {}
    throw new Error(errMsg);
  }
  
  const data = await response.json();
  let content = data.choices[0].message.content;
  
  // 清理可能的多余内容，只提取 JSON 数组
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('API 返回格式错误，无法解析');
  
  const parsed = JSON.parse(jsonMatch[0]);
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
