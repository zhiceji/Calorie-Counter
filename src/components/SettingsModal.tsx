import React, { useState, useEffect } from 'react';
import { X, Settings, Activity, CheckCircle2, AlertCircle, Download, RefreshCw, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ApiConfig, testApiConnection } from '../lib/gemini';
import { cn } from '../lib/utils';
import { checkForUpdate, getCurrentVersion, UpdateStatus, ReleaseInfo, downloadApk } from '../lib/updateChecker';
import { installApkFromBase64, openUrlInBrowser } from '../lib/nativeBridge';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [config, setConfig] = useState<ApiConfig>({
    apiKey: '',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat'
  });
  const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({ loading: false });
  
  // 更新检查状态
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [checkUpdateLoading, setCheckUpdateLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('nutri_api_config');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {}
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('nutri_api_config', JSON.stringify(config));
    onClose();
  };

  const handleTest = async () => {
    setTestStatus({ loading: true });
    const result = await testApiConnection(config);
    setTestStatus({ loading: false, success: result.success, message: result.message });
  };

  const handleCheckUpdate = async () => {
    setCheckUpdateLoading(true);
    setUpdateStatus(null);
    setDownloadProgress(null);
    const status = await checkForUpdate();
    setUpdateStatus(status);
    setCheckUpdateLoading(false);
  };

  const handleDownloadUpdate = async () => {
    if (!updateStatus?.releaseInfo?.downloadUrl) return;
    
    setDownloadProgress(0);
    try {
      const base64 = await downloadApk(updateStatus.releaseInfo.downloadUrl, (progress) => {
        setDownloadProgress(progress);
      });
      await installApkFromBase64(base64);
      setDownloadProgress(null);
    } catch (error) {
      console.error('下载失败:', error);
      setDownloadProgress(null);
      // 下载失败则用浏览器打开
      openUrlInBrowser(updateStatus.releaseInfo.downloadUrl);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 pointer-events-auto">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl z-10 overflow-hidden pointer-events-auto"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                    <Settings size={20} />
                  </div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">API 设置</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">DeepSeek API 密钥</label>
                    <input 
                      type="password"
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      placeholder="请输入您的 DeepSeek API Key"
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">代理地址 (Base URL)</label>
                    <input 
                      type="text"
                      value={config.baseUrl}
                      onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                      placeholder="https://api.deepseek.com"
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">模型名称</label>
                    <input 
                      type="text"
                      value={config.model}
                      onChange={(e) => setConfig({ ...config, model: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                  </div>
                </div>

                {testStatus.message && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl text-xs font-bold",
                      testStatus.success ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}
                  >
                    {testStatus.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {testStatus.message}
                  </motion.div>
                )}

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={handleTest}
                    disabled={testStatus.loading}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2"
                  >
                    {testStatus.loading ? "测试中..." : (
                      <>
                        <Activity size={16} />
                        测试连通性
                      </>
                    )}
                  </button>
                  <button 
                    onClick={handleSave}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl text-sm font-black shadow-lg shadow-emerald-200 transition-all"
                  >
                    保存并应用
                  </button>
                </div>

                {/* 检查更新区域 */}
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-slate-400" />
                      <span className="text-xs font-bold text-slate-500">应用版本 {getCurrentVersion()}</span>
                    </div>
                    <button 
                      onClick={handleCheckUpdate}
                      disabled={checkUpdateLoading}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold rounded-lg transition-all"
                    >
                      {checkUpdateLoading ? (
                        <RefreshCw size={12} className="animate-spin" />
                      ) : (
                        <RefreshCw size={12} />
                      )}
                      检查更新
                    </button>
                  </div>

                  {/* 更新状态显示 */}
                  {updateStatus && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "rounded-2xl p-4",
                        updateStatus.hasUpdate 
                          ? "bg-emerald-50 border border-emerald-100" 
                          : "bg-slate-50"
                      )}
                    >
                      {updateStatus.hasUpdate ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                              <CheckCircle2 size={14} />
                            </div>
                            <span className="text-sm font-black text-emerald-700">
                              发现新版本 v{updateStatus.latestVersion}
                            </span>
                          </div>
                          
                          {updateStatus.releaseInfo?.releaseNotes && (
                            <div className="text-xs text-slate-500 bg-white/50 rounded-lg p-2 max-h-20 overflow-y-auto">
                              {updateStatus.releaseInfo.releaseNotes.slice(0, 200)}
                              {updateStatus.releaseInfo.releaseNotes.length > 200 && '...'}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <button 
                              onClick={handleDownloadUpdate}
                              disabled={downloadProgress !== null}
                              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 disabled:opacity-70"
                            >
                              {downloadProgress !== null ? (
                                <>
                                  <div className="w-16 h-1.5 bg-emerald-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-white transition-all"
                                      style={{ width: `${downloadProgress}%` }}
                                    />
                                  </div>
                                  <span>{downloadProgress}%</span>
                                </>
                              ) : (
                                <>
                                  <Download size={12} />
                                  下载安装
                                </>
                              )}
                            </button>
                            <button 
                              onClick={() => openUrlInBrowser(`https://github.com/zhiceji/Calorie-Counter/releases`)}
                              className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-xl text-xs font-bold transition-all"
                            >
                              GitHub
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <CheckCircle2 size={14} className="text-slate-400" />
                          已是最新版本
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
