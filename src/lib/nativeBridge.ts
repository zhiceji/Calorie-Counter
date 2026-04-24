import { Capacitor } from '@capacitor/core';

// 原生接口定义
interface NativeResult {
  success?: boolean;
  error?: string;
}

interface ICalorieCounterPlugin {
  installApk(base64: string): Promise<NativeResult>;
  openUrl(url: string): Promise<NativeResult>;
}

// 获取原生插件
function getPlugin(): ICalorieCounterPlugin {
  if (Capacitor.isNativePlatform()) {
    return (Capacitor as any).Platforms?.Android?.bridge?.plugins?.CalorieCounter || {
      async installApk(base64: string): Promise<NativeResult> {
        // 直接调用 MainActivity 的方法
        const activity = (Capacitor as any).Platforms?.Android?.bridge?.activity;
        if (activity?.installApkFromBase64) {
          activity.installApkFromBase64(base64);
          return { success: true };
        }
        return { error: 'Native method not found' };
      },
      async openUrl(url: string): Promise<NativeResult> {
        const activity = (Capacitor as any).Platforms?.Android?.bridge?.activity;
        if (activity?.openInBrowser) {
          activity.openInBrowser(url);
          return { success: true };
        }
        return { error: 'Native method not found' };
      }
    };
  }
  return {
    async installApk(): Promise<NativeResult> {
      return { error: 'Not on native platform' };
    },
    async openUrl(): Promise<NativeResult> {
      return { error: 'Not on native platform' };
    }
  };
}

// 在浏览器中打开 URL（用于 Web 平台）
export function openUrlInBrowser(url: string): void {
  if (Capacitor.isNativePlatform()) {
    getPlugin().openUrl(url);
  } else {
    window.open(url, '_blank');
  }
}

// 安装 APK（从 Base64 数据）
export async function installApkFromBase64(base64: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.warn('installApkFromBase64 only works on native platform');
    return false;
  }
  
  const result = await getPlugin().installApk(base64);
  return result.success === true;
}

// 安装 APK（从文件 URL）
export async function downloadAndInstall(url: string, onProgress?: (progress: number) => void): Promise<boolean> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';

    xhr.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        // 转换为 Base64
        const bytes = new Uint8Array(xhr.response);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        
        // 调用原生安装
        installApkFromBase64(base64).then(resolve);
      } else {
        resolve(false);
      }
    };

    xhr.onerror = () => resolve(false);
    xhr.send();
  });
}
