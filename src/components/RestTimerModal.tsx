import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, RotateCcw, Timer, History, Bell } from 'lucide-react';
import { cn } from '../lib/utils';

interface RestTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TimerStatus = 'idle' | 'running' | 'finished';

export function RestTimerModal({ isOpen, onClose }: RestTimerModalProps) {
  // State
  const [duration, setDuration] = useState(() => {
    return parseInt(localStorage.getItem('last_rest_timer') || '60');
  });
  const [timeLeft, setTimeLeft] = useState(duration);
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [overtime, setOvertime] = useState(0);
  const [stats, setStats] = useState({ count: 0, startTime: '' });

  // Refs for timer and audio
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const overtimeRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize stats and persist duration
  useEffect(() => {
    localStorage.setItem('last_rest_timer', duration.toString());
    const today = new Date().toLocaleDateString();
    const stored = JSON.parse(localStorage.getItem(`timer_stats_${today}`) || '{"count": 0, "startTime": ""}');
    setStats(stored);
  }, [duration]);

  // Handle Visibility/WakeLock
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && status === 'running') {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.error('WakeLock failed:', err);
      }
    };

    if (status === 'running') {
      requestWakeLock();
    } else {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    }
  }, [status]);

  // Audio Beeps Helper
  const playBeep = (freq: number, dur: number) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + dur);
  };

  // Timer Logic
  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setStatus('finished');
            playBeep(880, 0.5); // Final high beep
            updateStats();
            return 0;
          }
          // Warning beeps for last 3 seconds
          if (prev <= 4) {
            playBeep(440, 0.1);
          }
          return prev - 1;
        });
      }, 1000);
    } else if (status === 'finished') {
      overtimeRef.current = setInterval(() => {
        setOvertime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (overtimeRef.current) clearInterval(overtimeRef.current);
    };
  }, [status]);

  const updateStats = () => {
    const today = new Date().toLocaleDateString();
    const newStats = {
      count: stats.count + 1,
      startTime: stats.startTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setStats(newStats);
    localStorage.setItem(`timer_stats_${today}`, JSON.stringify(newStats));
  };

  const handleResetStats = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering any underlying clicks
    const today = new Date().toLocaleDateString();
    const newStats = { count: 0, startTime: '' };
    setStats(newStats);
    localStorage.setItem(`timer_stats_${today}`, JSON.stringify(newStats));
    if (window.navigator.vibrate) window.navigator.vibrate(50);
  };

  const handleStart = () => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    setStatus('running');
    setOvertime(0);
    setTimeLeft(duration);
  };

  const handleReset = () => {
    setStatus('idle');
    setOvertime(0);
    setTimeLeft(duration);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (overtimeRef.current) clearInterval(overtimeRef.current);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (window.navigator.vibrate) window.navigator.vibrate(10);
    setDuration(val);
    if (status === 'idle') setTimeLeft(val);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 pointer-events-auto overflow-hidden">
          {/* Background overlay with flashing for finished state */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ 
                opacity: 1,
                backgroundColor: status === 'finished' ? ['#0f172a', '#9f1239', '#0f172a'] : '#0f172a'
            }} 
            transition={{
                backgroundColor: status === 'finished' ? { repeat: Infinity, duration: 1 } : { duration: 0.3 }
            }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 backdrop-blur-2xl"
            onClick={status === 'idle' ? onClose : undefined}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              paddingTop: status === 'idle' ? 32 : 24,
              paddingBottom: status === 'idle' ? 32 : 20,
            }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
                "relative w-full max-w-xl bg-slate-900/40 rounded-[48px] border border-white/5 shadow-2xl overflow-hidden z-10 p-8 flex flex-col items-center",
                status === 'running' && "border-emerald-500/30 shadow-emerald-500/10",
                status === 'finished' && "border-rose-500/50 shadow-rose-500/20"
            )}
          >

            {/* Daily Stats Badge */}
            <div className="flex gap-4 mb-4">
                <div className="px-3 py-1 bg-white/5 rounded-full flex items-center gap-2 border border-white/5">
                    <History size={12} className="text-white/40" />
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{stats.startTime || '--:--'} 开练</span>
                </div>
                <div className="group relative px-3 py-1 bg-white/5 rounded-full flex items-center gap-2 border border-white/5 pr-8">
                    <Timer size={12} className="text-white/40" />
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">已计组: {stats.count}</span>
                    <button 
                        onClick={handleResetStats}
                        className="absolute right-1 p-1 text-white/20 hover:text-rose-400 transition-colors bg-white/5 rounded-md"
                        title="重置组数"
                    >
                        <RotateCcw size={10} />
                    </button>
                </div>
            </div>

            {/* Main Timer Display */}
            <motion.div 
                className={cn(
                    "w-full flex flex-col items-center justify-center transition-colors duration-500",
                    status === 'idle' ? "text-slate-500 min-h-[180px]" : status === 'running' ? "text-emerald-400 min-h-[140px]" : "text-rose-500 min-h-[140px]"
                )}
                animate={{ minHeight: status === 'idle' ? 180 : 140 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
                {status === 'finished' ? (
                    <div className="text-center">
                        <motion.div 
                            animate={{ scale: [1, 1.05, 1] }} 
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="font-mono text-8xl sm:text-9xl font-black tracking-tighter"
                        >
                            +{formatTime(overtime)}
                        </motion.div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] mt-2 opacity-60">组间休息超时</p>
                    </div>
                ) : (
                    <div className="font-mono text-8xl sm:text-9xl font-black tracking-tighter tabular-nums">
                        {formatTime(timeLeft)}
                    </div>
                )}
            </motion.div>

            {/* Slider Section */}
            <AnimatePresence mode="wait">
                {status === 'idle' && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 32, marginBottom: 48 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="w-full overflow-hidden"
                    >
                         <div className="flex justify-between mb-4 px-2">
                             <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">休息时长调节</p>
                             <p className="text-xs font-black text-emerald-500">{duration}s</p>
                         </div>
                         <div className="relative h-12 flex items-center group">
                            <input 
                                type="range" 
                                min="15" max="180" step="15" 
                                value={duration}
                                onChange={handleSliderChange}
                                className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-emerald-500 group-hover:bg-white/10 transition-all [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:shadow-[0_0_20px_rgba(16,185,129,0.5)] [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white/10"
                            />
                            {/* Tick marks */}
                            <div className="absolute inset-0 flex justify-between items-center px-1 pointer-events-none -z-10">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className="w-0.5 h-1.5 bg-white/10 rounded-full" />
                                ))}
                            </div>
                         </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Action Area */}
            <motion.div 
              className="w-full flex flex-col gap-4"
              animate={{ marginTop: status === 'idle' ? 'auto' : 8 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
                <div className="flex gap-6 w-full h-32">
                    {/* Reset Button */}
                    <button 
                        onClick={handleReset}
                        disabled={status === 'idle'}
                        className="flex-1 bg-white/10 rounded-[32px] flex items-center justify-center text-white/40 hover:bg-white/20 disabled:opacity-20 transition-all active:scale-95"
                    >
                        <RotateCcw size={32} />
                    </button>
                    
                    {/* Start/Repeat Call to action */}
                    <button 
                        onClick={handleStart}
                        className={cn(
                            "flex-[3] rounded-[32px] flex items-center justify-center gap-4 text-slate-900 font-black text-xl transition-all active:scale-95 shadow-xl",
                            status === 'idle' ? "bg-emerald-400 shadow-emerald-500/20" : 
                            status === 'running' ? "bg-emerald-500 opacity-20 pointer-events-none" : "bg-white shadow-white/10"
                        )}
                    >
                        {status === 'finished' ? (
                            <>
                                <RotateCcw size={24} /> 再次计时
                            </>
                        ) : (
                            <>
                                <Play size={24} fill="currentColor" /> 开始休息
                            </>
                        )}
                    </button>
                </div>
                
                {/* Close Button at Bottom */}
                <button 
                    onClick={onClose} 
                    className="w-full mt-2 py-3 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white/60 transition-colors text-xs font-bold uppercase tracking-widest"
                >
                    关闭
                </button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
