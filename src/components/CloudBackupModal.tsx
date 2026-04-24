import React, { useState, useEffect } from 'react';
import { X, Cloud, CheckCircle2, AlertCircle, Upload, Download, RefreshCw, Folder } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  WebDAVConfig, 
  getWebDAVConfig, 
  saveWebDAVConfig, 
  testWebDAVConnection,
  backupToWebDAV,
  downloadFromWebDAV,
  restoreFromBackup
} from '../lib/webdav';

interface CloudBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CloudBackupModal({ isOpen, onClose }: CloudBackupModalProps) {
  const [config, setConfig] = useState<WebDAVConfig>({
    username: '',
    password: '',
    basePath: '/CalorieCounter'
  });
  const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({ loading: false });
  const [backupStatus, setBackupStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({ loading: false });
  const [restoreStatus, setRestoreStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({ loading: false });
  const [restoreFilename, setRestoreFilename] = useState('');

  useEffect(() => {
    if (isOpen) {
      setConfig(getWebDAVConfig());
      setTestStatus({ loading: false });
      setBackupStatus({ loading: false });
      setRestoreStatus({ loading: false });
      setRestoreFilename('');
    }
  }, [isOpen]);

  const handleSave = () => {
    saveWebDAVConfig(config);
  };

  const handleTest = async () => {
    setTestStatus({ loading: true });
    const result = await testWebDAVConnection(config);
    setTestStatus({ loading: false, success: result.success, message: result.message });
  };

  const handleBackup = async () => {
    saveWebDAVConfig(config);
    setBackupStatus({ loading: true });
    const result = await backupToWebDAV();
    setBackupStatus({ loading: false, success: result.success, message: result.message });
  };

  const handleRestore = async () => {
    if (!restoreFilename.trim()) {
      setRestoreStatus({ loading: false, success: false, message: '请输入备份文件名' });
      return;
    }
    
    saveWebDAVConfig(config);
    setRestoreStatus({ loading: true });
    const result = await restoreFromBackup(restoreFilename.trim());
    setRestoreStatus({ loading: false, success: result.success, message: result.message });
    
    if (result.success) {
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 pointer-events-auto">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl z-10 overflow-hidden pointer-events-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                    <Cloud size={20} />
                  </div>
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">坚果云备份</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                {/* 账号 */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">坚果云账号</label>
                  <input 
                    type="text"
                    value={config.username}
                    onChange={(e) => setConfig({ ...config, username: e.target.value })}
                    placeholder="您的坚果云注册邮箱"
                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>

                {/* 密码 */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">应用密码</label>
                  <input 
                    type="password"
                    value={config.password}
                    onChange={(e) => setConfig({ ...config, password: e.target.value })}
                    placeholder="坚果云 > 安全设置 > 应用密码"
                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>

                {/* 文件夹路径 */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                    备份文件夹
                    <span className="ml-2 text-slate-300 font-normal normal-case tracking-normal">（需手动创建）</span>
                  </label>
                  <input 
                    type="text"
                    value={config.basePath}
                    onChange={(e) => setConfig({ ...config, basePath: e.target.value })}
                    placeholder="/CalorieCounter"
                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    请先在坚果云中创建此文件夹
                  </p>
                </div>

                {/* 状态消息 */}
                {testStatus.message && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl text-xs font-bold",
                      testStatus.success ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}
                  >
                    {testStatus.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {testStatus.message}
                  </motion.div>
                )}

                {backupStatus.message && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl text-xs font-bold",
                      backupStatus.success ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}
                  >
                    {backupStatus.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {backupStatus.message}
                  </motion.div>
                )}

                {restoreStatus.message && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl text-xs font-bold",
                      restoreStatus.success ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}
                  >
                    {restoreStatus.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {restoreStatus.message}
                  </motion.div>
                )}

                {/* 按钮行1 */}
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={handleTest}
                    disabled={testStatus.loading}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5"
                  >
                    {testStatus.loading ? <RefreshCw size={12} className="animate-spin" /> : <Folder size={12} />}
                    测试连接
                  </button>
                  <button 
                    onClick={handleSave}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl text-xs font-black shadow-lg shadow-blue-200 transition-all"
                  >
                    保存
                  </button>
                </div>

                {/* 备份按钮 */}
                <button 
                  onClick={handleBackup}
                  disabled={backupStatus.loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-xs font-black shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-1.5"
                >
                  {backupStatus.loading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                  备份到云端
                </button>

                {/* 恢复区域 */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">恢复备份（输入文件名）</label>
                  <input 
                    type="text"
                    value={restoreFilename}
                    onChange={(e) => setRestoreFilename(e.target.value)}
                    placeholder="backup_2026-04-24.json"
                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                  <button 
                    onClick={handleRestore}
                    disabled={restoreStatus.loading || !restoreFilename.trim()}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {restoreStatus.loading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                    恢复备份
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
