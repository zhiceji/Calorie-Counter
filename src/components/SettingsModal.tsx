import React, { useState, useEffect } from 'react';
import { X, Settings, Database, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ApiConfig, testApiConnection } from '../lib/gemini';
import { cn } from '../lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [config, setConfig] = useState<ApiConfig>({
    engine: 'gemini',
    apiKey: '',
    baseUrl: 'https://generativelanguage.googleapis.com',
    model: 'gemini-1.5-flash'
  });
  const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({ loading: false });

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 pointer-events-auto"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-[32px] shadow-2xl z-[60] overflow-hidden pointer-events-auto"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                    <Settings size={20} />
                  </div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">账户与 API 设置</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">AI 引擎选择</label>
                  <div className="grid grid-cols-2 gap-3 p-1 bg-slate-50 rounded-2xl">
                    <button 
                      onClick={() => setConfig({ ...config, engine: 'gemini', baseUrl: 'https://generativelanguage.googleapis.com', model: 'gemini-1.5-flash' })}
                      className={cn(
                        "py-3 px-4 rounded-xl text-sm font-bold transition-all",
                        config.engine === 'gemini' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      Google Gemini
                    </button>
                    <button 
                      onClick={() => setConfig({ ...config, engine: 'openai', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' })}
                      className={cn(
                        "py-3 px-4 rounded-xl text-sm font-bold transition-all",
                        config.engine === 'openai' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      DeepSeek (OpenAI)
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">API 密钥</label>
                    <input 
                      type="password"
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      placeholder={config.engine === 'gemini' ? "可选 (默认使用系统内置)" : "请输入您的 DeepSeek Key"}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                  </div>

                  {config.engine === 'openai' && (
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
                  )}

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
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
