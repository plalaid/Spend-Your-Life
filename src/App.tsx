import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, AlertTriangle, CheckCircle, ArrowRight, RotateCcw, Clock, Moon, Sun
} from 'lucide-react';
import { ALL_ACTIVITIES, UNIT_MULTIPLIERS, Unit, ActivityDef } from './constants';

const SOUNDS = {
  click: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
  checkout: new Audio('https://assets.mixkit.co/active_storage/sfx/2015/2015-preview.mp3'),
  warning: new Audio('https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3'),
};

const playSound = (sound: HTMLAudioElement) => {
  sound.currentTime = 0;
  sound.play().catch(() => {
    // Ignore errors for browsers that block autoplay or have loading issues
  });
};

function formatTime(units: number) {
  if (units === 0) return '0s';
  const years = Math.floor(units / 31536000);
  const days = Math.floor((units % 31536000) / 86400);
  const hours = Math.floor((units % 86400) / 3600);
  const mins = Math.floor((units % 3600) / 60);
  const secs = Math.floor(units % 60);
  
  const parts = [];
  if (years > 0) parts.push(`${years}y`);
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

const SKEUO_SELECT_OPTIONS: { value: Unit; label: string; icon: string }[] = [
  { value: 'seconds', label: 'sec', icon: '⏱️' },
  { value: 'minutes', label: 'min', icon: '⏱️' },
  { value: 'hours', label: 'hrs', icon: '⏱️' },
  { value: 'days', label: 'days', icon: '📅' },
  { value: 'years', label: 'yrs', icon: '📅' },
  { value: 'hours/day', label: 'hrs/day', icon: '⚡' },
  { value: 'minutes/day', label: 'min/day', icon: '⚡' },
];

const SkeuoSelect: React.FC<{
  value: Unit;
  onChange: (unit: Unit) => void;
}> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = SKEUO_SELECT_OPTIONS.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-1 px-2 py-2 rounded-xl skeuo-button text-[10px] sm:text-[11px] font-black text-indigo-600 dark:text-indigo-400 active:scale-95 transition-all whitespace-nowrap min-h-[44px]"
      >
        <span>{selectedOption?.icon} {selectedOption?.label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-32 skeuo-card rounded-2xl z-50 overflow-hidden p-1"
            >
              {SKEUO_SELECT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    playSound(SOUNDS.click);
                  }}
                  className={`w-full text-left px-3 py-3 sm:py-2.5 text-[11px] font-black rounded-xl transition-all ${
                    value === option.value 
                      ? 'text-indigo-600 dark:text-indigo-400 bg-black/5 dark:bg-white/10 shadow-inner' 
                      : 'text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {option.icon} {option.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const ActivityCard: React.FC<{ 
  activity: ActivityDef, 
  cartItem?: { value: number, unit: Unit }, 
  onUpdate: (id: string, value: number, unit: Unit) => void,
  slowdownFactor: number,
  totalLifeSeconds: number
}> = ({ 
  activity, 
  cartItem, 
  onUpdate, 
  slowdownFactor,
  totalLifeSeconds
}) => {
  const value = cartItem?.value || 0;
  const unit = cartItem?.unit || 'hours';

  const handleIncrement = () => { playSound(SOUNDS.click); onUpdate(activity.id, value + 1, unit); };
  const handleDecrement = () => { if (value > 0) { playSound(SOUNDS.click); onUpdate(activity.id, value - 1, unit); } };
  const handleUnitChange = (newUnit: Unit) => onUpdate(activity.id, value, newUnit);
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    onUpdate(activity.id, isNaN(val) ? 0 : Math.max(0, val), unit);
  };

  const impactSeconds = useMemo(() => {
    if (value <= 0) return 0;
    if (unit === 'hours/day' || unit === 'minutes/day') {
      const fraction = value / (unit === 'hours/day' ? 24 : 1440);
      return totalLifeSeconds * Math.min(1, fraction);
    }
    return value * UNIT_MULTIPLIERS[unit];
  }, [value, unit, totalLifeSeconds]);

  const Icon = activity.icon;

  return (
    <motion.div 
      layout 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ 
        opacity: 1, 
        y: 0,
        borderColor: activity.isBad && value > 0 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.2)'
      }} 
      whileHover={{ y: -4 }}
      className={`skeuo-card rounded-[2rem] sm:rounded-[2.5rem] p-3 sm:p-5 flex flex-col items-center justify-between min-h-[15rem] sm:min-h-[16rem] relative overflow-hidden border-2 transition-all duration-300 ${activity.isBad && value > 0 ? 'bg-red-50/50 dark:bg-red-900/20' : ''}`}
    >
      {activity.isBad && (
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
          <AlertTriangle className={`w-4 h-4 sm:w-5 sm:h-5 ${value > 0 ? 'text-red-500 animate-pulse' : 'text-gray-400 dark:text-gray-500'}`} />
        </div>
      )}
      
      <div className="w-full flex flex-col items-center sm:items-start gap-1 text-center sm:text-left mt-2 sm:mt-0">
        <span className="text-[9px] sm:text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">
          {activity.category}
        </span>
        <h3 className={`text-sm sm:text-base font-black leading-tight ${activity.isBad && value > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}`}>
          {activity.name}
        </h3>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 w-full my-2">
        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-2 skeuo-card-inner transition-colors duration-500 ${activity.isBad && value > 0 ? 'bg-red-100/50 dark:bg-red-900/30' : ''}`}>
          <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${activity.isBad && value > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`} strokeWidth={1.5} />
        </div>
        {impactSeconds > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-full uppercase tracking-wider"
          >
            -{formatTime(impactSeconds)}
          </motion.div>
        )}
      </div>

      <div className="w-full rounded-2xl p-1.5 flex items-center justify-between mt-auto skeuo-card-inner">
        <button 
          onClick={handleDecrement} 
          className="w-11 h-11 sm:w-12 sm:h-12 skeuo-button flex items-center justify-center rounded-xl text-gray-600 dark:text-gray-400 active:scale-90 text-xl font-medium shrink-0"
        >
          -
        </button>
        <div className="flex-1 flex items-center justify-center gap-1 px-1 min-w-0">
          <input 
            type="number" 
            value={value || ''} 
            onChange={handleValueChange} 
            className="w-8 sm:w-12 text-center bg-transparent font-black tabular-nums focus:outline-none text-gray-900 dark:text-gray-100 text-sm sm:text-base" 
            placeholder="0"
          />
          <SkeuoSelect value={unit} onChange={handleUnitChange} />
        </div>
        <button 
          onClick={handleIncrement} 
          className="w-11 h-11 sm:w-12 sm:h-12 skeuo-button flex items-center justify-center rounded-xl text-gray-600 dark:text-gray-400 active:scale-90 text-xl font-medium shrink-0"
        >
          +
        </button>
      </div>
    </motion.div>
  );
};

export default function App() {
  useMemo(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('app_version') !== '4') {
      localStorage.clear();
      localStorage.setItem('app_version', '4');
    }
  }, []);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const [lifespan, setLifespan] = useState(() => Number(localStorage.getItem('lifespan')) || 80);
  const totalLifeSeconds = useMemo(() => lifespan * 31536000, [lifespan]);

  const [spent, setSpent] = useState(() => Number(localStorage.getItem('spent')) || 0);
  const [remaining, setRemaining] = useState(() => {
    const saved = localStorage.getItem('remaining');
    if (saved) return Number(saved);
    return totalLifeSeconds;
  });

  const [cart, setCart] = useState<Record<string, { value: number, unit: Unit }>>({});
  const [screen, setScreen] = useState<'loading' | 'main' | 'bill'>('loading');
  const [lastBill, setLastBill] = useState<any>(null);

  useEffect(() => {
    setRemaining(prev => {
      const expectedRemaining = totalLifeSeconds - spent;
      if (Math.abs(prev + spent - totalLifeSeconds) > 1) {
        return Math.max(0, expectedRemaining);
      }
      return prev;
    });
  }, [totalLifeSeconds, spent]);

  useEffect(() => {
    const timer = setTimeout(() => setScreen('main'), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('remaining', remaining.toString());
    localStorage.setItem('spent', spent.toString());
    localStorage.setItem('lifespan', lifespan.toString());
  }, [remaining, spent, lifespan]);

  const handleReset = () => {
    playSound(SOUNDS.warning);
    
    // Preserve theme
    const currentTheme = localStorage.getItem('theme');
    
    // Clear storage first
    localStorage.clear();
    localStorage.setItem('app_version', '4');
    if (currentTheme) {
      localStorage.setItem('theme', currentTheme);
    }
    
    // Reset all states in one batch
    const defaultLifespan = 80;
    const defaultTotalSeconds = defaultLifespan * 31536000;
    
    setLifespan(defaultLifespan);
    setSpent(0);
    setRemaining(defaultTotalSeconds);
    setCart({});
    setScreen('main');
  };

  const handleUpdateCart = (id: string, value: number, unit: Unit) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (value <= 0) delete newCart[id];
      else newCart[id] = { value, unit };
      return newCart;
    });
  };

  const { totalSelectedSeconds, totalDailyHours } = useMemo(() => {
    let totalSecs = 0;
    let dailyHrs = 0;
    Object.entries(cart).forEach(([id, item]: [string, { value: number, unit: Unit }]) => {
      let seconds = item.value * UNIT_MULTIPLIERS[item.unit];
      if (item.unit === 'hours/day' || item.unit === 'minutes/day') {
        // Calculate based on total lifespan to make 24h/day = 100% of life
        const fraction = item.value / (item.unit === 'hours/day' ? 24 : 1440);
        seconds = totalLifeSeconds * fraction;
        dailyHrs += item.unit === 'hours/day' ? item.value : item.value / 60;
      }
      totalSecs += seconds;
    });
    return { totalSelectedSeconds: totalSecs, totalDailyHours: dailyHrs };
  }, [cart, totalLifeSeconds]);

  const isOverBudget = totalSelectedSeconds > remaining;
  const isOverDaily = totalDailyHours > 24;
  const canCheckout = totalSelectedSeconds > 0 && !isOverBudget && !isOverDaily;
  const needsRestart = remaining < 10000;
  const isBalanceLow = remaining > 0 && remaining < 3600; // Less than 1 hour left

  const handleCheckout = () => {
    if (!canCheckout) return;
    playSound(SOUNDS.checkout);
    const actualSpent = Math.min(totalSelectedSeconds, remaining);
    setRemaining(prev => Math.max(0, prev - actualSpent));
    setSpent(prev => prev + actualSpent);
    setLastBill({ cart, totalSelectedSeconds, actualSpent });
    setScreen('bill');
  };

  if (screen === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-8 transition-colors duration-300">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="skeuo-card p-12 flex flex-col items-center gap-6"
        >
          <div className="w-20 h-20 rounded-full flex items-center justify-center skeuo-card-inner">
            <Clock className="w-10 h-10 text-gray-400 dark:text-gray-500 animate-spin-slow" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-gray-700 dark:text-gray-200 mb-2">Initializing Lifespan...</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">Calculating your timeline</p>
          </div>
          <div className="w-48 h-2 rounded-full overflow-hidden skeuo-card-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  if (screen === 'bill') {
    const percentageSpent = ((lastBill.totalSelectedSeconds / totalLifeSeconds) * 100).toFixed(4);
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] p-4 sm:p-8 flex flex-col items-center justify-center font-mono transition-colors duration-300">
        <motion.div 
          initial={{ opacity: 0, y: 50, rotateX: 20 }} 
          animate={{ opacity: 1, y: 0, rotateX: 0 }} 
          className="w-full max-w-md bg-[#fdfbf7] dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-8 sm:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.2)] relative"
          style={{
            backgroundImage: isDarkMode ? 'linear-gradient(transparent 95%, #374151 95%)' : 'linear-gradient(transparent 95%, #f3f4f6 95%)',
            backgroundSize: '100% 2.5rem',
            clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), 98% 100%, 96% calc(100% - 15px), 94% 100%, 92% calc(100% - 15px), 90% 100%, 88% calc(100% - 15px), 86% 100%, 84% calc(100% - 15px), 82% 100%, 80% calc(100% - 15px), 78% 100%, 76% calc(100% - 15px), 74% 100%, 72% calc(100% - 15px), 70% 100%, 68% calc(100% - 15px), 66% 100%, 64% calc(100% - 15px), 62% 100%, 60% calc(100% - 15px), 58% 100%, 56% calc(100% - 15px), 54% 100%, 52% calc(100% - 15px), 50% 100%, 48% calc(100% - 15px), 46% 100%, 44% calc(100% - 15px), 42% 100%, 40% calc(100% - 15px), 38% 100%, 36% calc(100% - 15px), 34% 100%, 32% calc(100% - 15px), 30% 100%, 28% calc(100% - 15px), 26% 100%, 24% calc(100% - 15px), 22% 100%, 20% calc(100% - 15px), 18% 100%, 16% calc(100% - 15px), 14% 100%, 12% calc(100% - 15px), 10% 100%, 8% calc(100% - 15px), 6% 100%, 4% calc(100% - 15px), 2% 100%, 0 calc(100% - 15px))'
          }}
        >
          <div className="text-center mb-10 border-b-4 border-double border-gray-300 dark:border-gray-600 pb-8">
            <h2 className="text-4xl font-black tracking-[0.3em] mb-2">RECEIPT</h2>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-[0.4em]">Life-Time Transaction</p>
            <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-2">ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
          </div>
          
          <div className="space-y-4 mb-10 border-b-2 border-dashed border-gray-200 dark:border-gray-700 pb-8">
            {Object.entries(lastBill.cart).map(([id, item]: [string, any]) => {
              const activity = ALL_ACTIVITIES.find(a => a.id === id);
              return activity && (
                <div key={id} className="flex justify-between items-baseline gap-4">
                  <div className="flex flex-col">
                    <span className="font-black text-sm uppercase tracking-wider">{activity.name}</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">{activity.category}</span>
                  </div>
                  <div className="flex-1 border-b border-dotted border-gray-300 dark:border-gray-600 mb-1" />
                  <span className="font-bold text-sm">{item.value} {item.unit}</span>
                </div>
              );
            })}
          </div>
          
          <div className="mb-10">
            <div className="flex justify-between items-end mb-4">
              <span className="text-sm font-black uppercase tracking-widest">SUBTOTAL</span>
              <span className="text-lg font-bold">{formatTime(lastBill.totalSelectedSeconds)}</span>
            </div>
            <div className="flex justify-between items-end border-t-4 border-double border-gray-800 dark:border-gray-200 pt-4">
              <span className="text-2xl font-black tracking-tighter">TOTAL LIFE</span>
              <span className="text-2xl font-black tracking-tighter">-{percentageSpent}%</span>
            </div>
          </div>
          
          {Object.entries(lastBill.cart).some(([id, item]: [string, any]) => ALL_ACTIVITIES.find(a => a.id === id)?.isBad) && (
            <div className="p-5 bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-900/50 rounded-2xl text-red-800 dark:text-red-300 text-xs mb-10 flex items-start gap-4 shadow-inner">
              <AlertTriangle className="w-6 h-6 shrink-0 text-red-500" />
              <div>
                <strong className="block text-sm font-black uppercase tracking-widest mb-1">Regret Warning</strong>
                <p className="leading-relaxed opacity-80">
                  You've permanently traded {formatTime(lastBill.totalSelectedSeconds)} for activities that may not serve your future self.
                </p>
              </div>
            </div>
          )}

          <div className="text-center text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] mb-10">
            *** THANK YOU FOR EXISTING ***
          </div>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => { setCart({}); setScreen('main'); }} 
              className="w-full py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-black tracking-[0.2em] uppercase text-xs hover:bg-black dark:hover:bg-white transition-all active:scale-95 shadow-xl"
            >
              Continue Journey
            </button>
            {needsRestart && (
              <button 
                onClick={handleReset} 
                className="w-full py-4 bg-red-600 text-white font-black tracking-[0.2em] uppercase text-xs hover:bg-red-700 transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Live Again
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans pb-32 transition-colors duration-300">
      <div className="fixed inset-0 bg-gradient-to-br from-transparent via-transparent to-black/5 dark:to-white/5 -z-10" />
      
      <header className="sticky top-0 z-30 bg-[var(--bg-primary)]/90 backdrop-blur-md border-b border-white/20 dark:border-white/5 py-3 sm:py-6 px-4 shadow-sm">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex items-center justify-between mb-3 sm:mb-6">
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-xl font-black tracking-tighter text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
                TIMELINE
              </h1>
              <p className="text-[8px] sm:text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Spend your life wisely</p>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 sm:p-3 skeuo-button rounded-lg sm:rounded-xl text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                title="Toggle Dark Mode"
              >
                {isDarkMode ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>
              
              <div className="flex items-center gap-1 sm:gap-2 bg-black/5 dark:bg-white/5 p-1 sm:p-1.5 rounded-lg sm:rounded-xl skeuo-card-inner">
                <span className="hidden sm:inline text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase px-2">Lifespan</span>
                <div className="flex items-center gap-1 bg-white/40 dark:bg-black/20 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg">
                  <input 
                    type="number" 
                    value={lifespan} 
                    onChange={(e) => setLifespan(Math.max(1, Number(e.target.value)))} 
                    className="w-8 sm:w-10 bg-transparent text-center font-black text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 focus:outline-none" 
                  />
                  <span className="text-[8px] sm:text-[10px] font-bold text-gray-500 dark:text-gray-400">YRS</span>
                </div>
              </div>
              
              <button 
                onClick={handleReset} 
                className="p-2 sm:p-3 skeuo-button rounded-lg sm:rounded-xl text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors group"
                title="Reset Timeline"
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-active:rotate-180 transition-transform duration-500" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 items-end">
            <div className="space-y-1 sm:space-y-2">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[8px] sm:text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Existence Pool</span>
                  <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300">{formatTime(totalLifeSeconds)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[8px] sm:text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Spent</span>
                  <span className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400">{((spent / totalLifeSeconds) * 100).toFixed(2)}%</span>
                </div>
              </div>
              <div className="h-3 sm:h-4 rounded-full overflow-hidden skeuo-card-inner p-0.5 sm:p-1">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(spent / totalLifeSeconds) * 100}%` }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                />
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end">
              <div className="flex flex-col items-center md:items-end">
                <span className="text-[8px] sm:text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-0.5 sm:mb-1">Remaining Balance</span>
                <motion.div 
                  animate={isBalanceLow || needsRestart ? { scale: [1, 1.02, 1], color: isDarkMode ? ['#f3f4f6', '#ef4444', '#f3f4f6'] : ['#1f2937', '#ef4444', '#1f2937'] } : {}}
                  transition={{ repeat: isBalanceLow || needsRestart ? Infinity : 0, duration: 1 }}
                  className="text-3xl sm:text-5xl font-black tracking-tighter tabular-nums text-gray-800 dark:text-gray-100 font-mono"
                >
                  {remaining.toLocaleString()}
                </motion.div>
                <span className="text-[8px] sm:text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em] mt-0.5">Seconds</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-6 mt-4 sm:mt-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {ALL_ACTIVITIES.map(activity => (
            <ActivityCard 
              key={activity.id} 
              activity={activity} 
              cartItem={cart[activity.id]} 
              onUpdate={handleUpdateCart} 
              slowdownFactor={0} 
              totalLifeSeconds={totalLifeSeconds}
            />
          ))}
        </div>
      </main>

      <AnimatePresence>
        {(totalSelectedSeconds > 0 || needsRestart) && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 p-3 sm:p-6 z-40"
          >
            <div className="max-w-4xl mx-auto glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
              <div className="flex flex-col w-full sm:w-auto text-center sm:text-left">
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 dark:text-white/60 mb-0.5">Transaction Total</span>
                <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                  <span className={`text-2xl sm:text-3xl font-black tabular-nums text-gray-900 dark:text-white ${isOverBudget ? 'text-red-500 dark:text-red-400' : ''}`}>
                    {formatTime(totalSelectedSeconds)}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-white/40 uppercase">to be spent</span>
                </div>
                
                <div className="mt-1 space-y-0.5">
                  {isOverDaily && (
                    <div className="flex items-center gap-1.5 text-red-500 dark:text-red-400 text-[8px] sm:text-[10px] font-black uppercase tracking-wider justify-center sm:justify-start">
                      <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      Exceeds 24hr/day limit
                    </div>
                  )}
                  {isOverBudget && !isOverDaily && (
                    <div className="flex items-center gap-1.5 text-red-500 dark:text-red-400 text-[8px] sm:text-[10px] font-black uppercase tracking-wider justify-center sm:justify-start">
                      <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      Insufficient lifespan
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {needsRestart ? (
                  <button 
                    onClick={handleReset} 
                    className="w-full sm:w-auto px-6 py-3 sm:px-10 sm:py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Live Again
                  </button>
                ) : (
                  <button 
                    onClick={handleCheckout} 
                    disabled={!canCheckout}
                    className={`w-full sm:w-auto px-8 py-3 sm:px-12 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${
                      !canCheckout 
                        ? 'bg-black/5 dark:bg-white/10 text-gray-400 dark:text-white/20 cursor-not-allowed' 
                        : 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 active:scale-95 shadow-black/5 dark:shadow-white/5'
                    }`}
                  >
                    Checkout
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
