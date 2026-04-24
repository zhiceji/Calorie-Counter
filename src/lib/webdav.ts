/**
 * 坚果云 WebDAV 备份工具
 * 使用 CapacitorHttp 绕过跨域限制
 */

import { CapacitorHttp, HttpResponse } from '@capacitor/core';

const WEBDAV_CONFIG_KEY = 'nutri_webdav_config';

export interface WebDAVConfig {
  username: string;
  password: string;
  basePath: string;
}

export interface WebDAVTestResult {
  success: boolean;
  message: string;
}

// 获取保存的配置
export function getWebDAVConfig(): WebDAVConfig {
  const saved = localStorage.getItem(WEBDAV_CONFIG_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return {
    username: '',
    password: '',
    basePath: '/CalorieCounter'
  };
}

// 保存配置
export function saveWebDAVConfig(config: WebDAVConfig): void {
  localStorage.setItem(WEBDAV_CONFIG_KEY, JSON.stringify(config));
}

// 基础认证 Header
function getAuthHeader(username: string, password: string): string {
  const user = username.trim();
  const pwd = password.trim();
  const credentials = btoa(`${user}:${pwd}`);
  return `Basic ${credentials}`;
}

// 构建完整路径（确保路径正确拼接）
function buildPath(basePath: string, filename: string): string {
  // 移除 basePath 开头和末尾的斜杠
  const base = basePath.replace(/^\/+|\/+$/g, '');
  // 移除 filename 开头的斜杠
  const path = filename.replace(/^\/+/, '');
  return `/${base}/${path}`;
}

// 获取坚果云根目录 URL（末尾不带斜杠，由 buildPath 处理）
function getRootUrl(): string {
  return 'https://dav.jianguoyun.com/dav';
}

// 测试连接（使用 OPTIONS 方法检查 WebDAV 支持）
export async function testWebDAVConnection(config: WebDAVConfig): Promise<WebDAVTestResult> {
  if (!config.username || !config.password) {
    return { success: false, message: '请输入账号和密码' };
  }

  const user = config.username.trim();
  const pass = config.password.trim();
  const authHeader = 'Basic ' + btoa(`${user}:${pass}`);

  try {
    const rootUrl = getRootUrl();
    
    console.log('WebDAV Test URL:', rootUrl);
    
    // 使用 OPTIONS 方法测试（检查服务器支持的 HTTP 方法）
    const response = await CapacitorHttp.request({
      url: rootUrl,
      method: 'OPTIONS',
      headers: {
        'Authorization': authHeader,
        'Accept': '*/*'
      }
    });

    console.log('WebDAV OPTIONS Response:', response.status);

    if (response.status === 401) {
      return { success: false, message: '账号或应用密码错误' };
    }

    if (response.status === 403) {
      return { success: false, message: 'WebDAV 未开启: 请到坚果云设置 → 第三方应用管理 开启 WebDAV 权限' };
    }

    // OPTIONS 成功：200 或 207 都说明能连通
    if (response.status === 200 || response.status === 207) {
      return { success: true, message: '连接成功！' };
    }

    return { success: false, message: `连接失败: 状态码 ${response.status}` };
  } catch (error: any) {
    console.error('WebDAV Error:', error);
    return { success: false, message: `网络错误: ${error.message || error}` };
  }
}

// 上传文件（直接上传，不预先检查文件夹）
export async function uploadToWebDAV(
  config: WebDAVConfig, 
  filename: string, 
  data: string
): Promise<WebDAVTestResult> {
  if (!config.username || !config.password) {
    return { success: false, message: '请先配置账号密码' };
  }

  const filePath = buildPath(config.basePath, filename);
  const uploadUrl = `${getRootUrl()}${filePath}`;
  
  console.log('WebDAV Upload URL:', uploadUrl);
  
  try {
    const response = await CapacitorHttp.put({
      url: uploadUrl,
      headers: {
        'Authorization': getAuthHeader(config.username, config.password),
        'Content-Type': 'application/octet-stream',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 12; DietApp)',
      },
      data: data
    });

    console.log('Upload Response:', response.status);

    if (response.status === 200 || response.status === 201 || response.status === 204) {
      return { success: true, message: '上传成功！' };
    } else if (response.status === 401) {
      return { success: false, message: '账号或密码错误' };
    } else if (response.status === 409) {
      return { success: false, message: '文件夹不存在，请先在坚果云网页版创建该文件夹' };
    } else if (response.status === 403 || response.status === 410) {
      return { success: false, message: `WebDAV 权限问题 (${response.status}): 请检查坚果云第三方应用管理` };
    } else {
      return { success: false, message: `上传失败: 状态码 ${response.status}` };
    }
  } catch (error: any) {
    console.error('Upload Error:', error);
    return { success: false, message: `上传失败: ${error.message || error}` };
  }
}

// 备份到云端
export async function backupToWebDAV(): Promise<WebDAVTestResult> {
  const config = getWebDAVConfig();
  
  if (!config.username || !config.password) {
    return { success: false, message: '请先配置坚果云账号' };
  }

  // 获取所有本地数据
  const backupData: Record<string, string> = {};
  
  // 遍历 localStorage 收集所有 nutri_ 开头数据
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('nutri_')) {
      backupData[key] = localStorage.getItem(key) || '';
    }
  }

  // 添加元数据
  backupData['_meta'] = JSON.stringify({
    version: '1.0',
    timestamp: new Date().toISOString(),
    keys: Object.keys(backupData).filter(k => k !== '_meta')
  });

  const jsonData = JSON.stringify(backupData, null, 2);
  const filename = `backup_${new Date().toISOString().slice(0, 10)}.json`;
  
  return uploadToWebDAV(config, filename, jsonData);
}

// 下载备份
export async function downloadFromWebDAV(filename: string): Promise<{ success: boolean; data?: string; message: string }> {
  const config = getWebDAVConfig();
  
  if (!config.username || !config.password) {
    return { success: false, message: '请先配置坚果云账号' };
  }

  const filePath = buildPath(config.basePath, filename);
  const downloadUrl = `${getRootUrl()}${filePath}`;
  
  try {
    const response = await CapacitorHttp.get({
      url: downloadUrl,
      headers: {
        'Authorization': getAuthHeader(config.username, config.password),
        'User-Agent': 'Mozilla/5.0 (Linux; Android 12; DietApp)',
        'Accept': '*/*',
        'Depth': '1'
      }
    });

    if (response.status === 200) {
      const data = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      return { success: true, data, message: '下载成功' };
    } else if (response.status === 404) {
      return { success: false, message: '文件不存在' };
    } else {
      return { success: false, message: `下载失败: 状态码 ${response.status}` };
    }
  } catch (error: any) {
    return { success: false, message: `下载失败: ${error.message || error}` };
  }
}

// 列出备份文件
export async function listBackups(): Promise<{ success: boolean; files?: string[]; message: string }> {
  const config = getWebDAVConfig();
  
  if (!config.username || !config.password) {
    return { success: false, message: '请先配置坚果云账号' };
  }

  // 尝试常见的备份文件名模式
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const patterns = [
    `backup_${today}.json`,
    `backup_${yesterday}.json`,
  ];

  const foundFiles: string[] = [];
  
  for (const filename of patterns) {
    const filePath = buildPath(config.basePath, filename);
    try {
      const response = await CapacitorHttp.request({
        method: 'HEAD',
        url: `${getRootUrl()}${filePath}`,
        headers: {
          'Authorization': getAuthHeader(config.username, config.password),
          'User-Agent': 'Mozilla/5.0 (Linux; Android 12; DietApp)',
          'Depth': '1'
        }
      });
      
      if (response.status === 200) {
        foundFiles.push(filename);
      }
    } catch (e) {}
  }

  return { success: true, files: foundFiles, message: `找到 ${foundFiles.length} 个备份` };
}

// 从备份恢复数据
export async function restoreFromBackup(filename: string): Promise<WebDAVTestResult> {
  const result = await downloadFromWebDAV(filename);
  
  if (!result.success || !result.data) {
    return { success: false, message: result.message };
  }

  try {
    const backupData = JSON.parse(result.data);
    
    // 恢复所有数据
    let count = 0;
    for (const [key, value] of Object.entries(backupData)) {
      if (key !== '_meta' && typeof value === 'string') {
        localStorage.setItem(key, value);
        count++;
      }
    }
    
    return { success: true, message: `恢复成功！共 ${count} 条数据` };
  } catch (error: any) {
    return { success: false, message: `解析备份失败: ${error.message || error}` };
  }
}
