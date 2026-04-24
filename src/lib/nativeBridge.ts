import { Capacitor } from '@capacitor/core';

// 原生接口定义
interface NativeResult {
  success?: boolean;
  error?: string;
}

// 直接调用 Android MainActivity 的方法
function getAndroidActivity(): any {
  if (Capacitor.isNativePlatform()) {
    return (Capacitor as any).Platforms?.Android?.bridge?.activity;
  }
  return null;
}

// 在浏览器中打开 URL
export function openUrlInBrowser(url: string): void {
  const activity = getAndroidActivity();
  if (activity?.openInBrowser) {
    activity.openInBrowser(url);
  } else {
    window.open(url, '_blank');
  }
}

// 安装 APK（从 Base64 数据）
export async function installApkFromBase64(base64: string): Promise<boolean> {
  const activity = getAndroidActivity();
  if (activity?.installApkFromBase64) {
    activity.installApkFromBase64(base64);
    return true;
  }
  console.warn('installApkFromBase64 not available');
  return false;
}
