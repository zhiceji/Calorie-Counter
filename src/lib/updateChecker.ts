// 检查更新服务
// GitHub Releases API: https://api.github.com/repos/{owner}/{repo}/releases/latest

export interface ReleaseInfo {
  version: string;      // 如 "1.1.0"
  downloadUrl: string;  // APK 下载地址
  releaseNotes: string; // 更新说明
  publishedAt: string;  // 发布日期
}

export interface UpdateStatus {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseInfo?: ReleaseInfo;
  error?: string;
}

const GITHUB_REPO = 'zhiceji/Calorie-Counter';
const CURRENT_VERSION = '1.0.13';

// API 端点列表（按优先级）
const API_ENDPOINTS = [
  `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
  `https://ghproxy.com/https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
  `https://mirror.ghproxy.com/https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
];

// 比较版本号，返回 1 表示 a > b, -1 表示 a < b, 0 表示相等
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(p => parseInt(p, 10) || 0);
  const partsB = b.split('.').map(p => parseInt(p, 10) || 0);
  
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }
  return 0;
}

// 获取最新版本信息
export async function checkForUpdate(): Promise<UpdateStatus> {
  // 尝试多个 API 端点
  for (const apiUrl of API_ENDPOINTS) {
    try {
      console.log(`尝试 API: ${apiUrl}`);
      
      // 使用 AbortController 实现超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
      
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'CalorieCounter-App'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log(`API 响应状态: ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // 从 tag_name 获取版本号 (如 "v1.1.0" -> "1.1.0")
      const latestVersion = (data.tag_name || '').replace(/^v/, '');
      
      // 查找 APK 文件
      let apkUrl = '';
      for (const asset of data.assets || []) {
        if (asset.name.endsWith('.apk')) {
          apkUrl = asset.browser_download_url;
          break;
        }
      }

      const releaseInfo: ReleaseInfo = {
        version: latestVersion,
        downloadUrl: apkUrl,
        releaseNotes: data.body || '',
        publishedAt: data.published_at || ''
      };

      const hasUpdate = compareVersions(latestVersion, CURRENT_VERSION) > 0;

      return {
        hasUpdate,
        currentVersion: CURRENT_VERSION,
        latestVersion,
        releaseInfo
      };
    } catch (error: any) {
      console.warn(`API ${apiUrl} 失败:`, error.name, error.message);
      continue;
    }
  }
  
  // 所有端点都失败了，返回当前版本信息（假设已是最新）
  return {
    hasUpdate: false,
    currentVersion: CURRENT_VERSION,
    latestVersion: CURRENT_VERSION
  };
}

// 下载 APK 文件
export async function downloadApk(url: string, onProgress?: (progress: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';

    xhr.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        // 保存到文件
        const blob = xhr.response;
        const fileReader = new FileReader();
        fileReader.onloadend = () => {
          const base64 = (fileReader.result as string).split(',')[1];
          // 通过 Android Intent 安装
          resolve(base64);
        };
        fileReader.readAsDataURL(blob);
      } else {
        reject(new Error(`下载失败: HTTP ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('网络错误'));
    xhr.send();
  });
}

// 获取当前版本号
export function getCurrentVersion(): string {
  return CURRENT_VERSION;
}
