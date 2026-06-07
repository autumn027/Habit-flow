import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Circle, 
  Settings, 
  Trophy,
  Calendar as CalendarIcon,
  X,
  Plus,
  Trash2,
  Sparkles,
  Crown,
  Sun,
  Moon,
  GraduationCap,
  Linkedin,
  ExternalLink,
  User
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { HabitHistory } from './types';
import { formatDate, getDaysInMonth, getFirstDayOfMonth } from './utils/dateHelpers';
import { audioEngine } from './utils/audio';
import Companion from './components/Companion';

export default function App() {
  // --- State Management ---
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [companionType, setCompanionType] = useState<'auto' | 'white_cat' | 'black_witch_cat' | 'wise_owl'>('auto');
  
  // Start with 3 tasks for 1st use, as requested
  const [tasks, setTasks] = useState<string[]>([
    "Morning Meditation", 
    "Drink 2L Water", 
    "Exercise 30 mins"
  ]);
  
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [history, setHistory] = useState<HabitHistory>({});
  const [viewDate, setViewDate] = useState<Date>(new Date()); // For Calendar Navigation
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [showDevInfo, setShowDevInfo] = useState<boolean>(false);
  const [isRecentlyCompleted, setIsRecentlyCompleted] = useState<boolean>(false);
  const [companionAction, setCompanionAction] = useState<{ type: 'check' | 'uncheck' | 'complete_all'; timestamp: number } | null>(null);

  // --- Daily Completion Percentage for Shih Tzu Happiness ---
  const currentDateCompletionPercentage = useMemo(() => {
    if (!tasks || tasks.length === 0) return 0;
    const currentDayHistory = history[selectedDate] || [];
    return Math.round((currentDayHistory.length / tasks.length) * 100);
  }, [history, selectedDate, tasks]);

  // --- Streaks Calculator ---
  const currentStreak = useMemo(() => {
    let streakCount = 0;
    const checkDate = new Date();
    const todayStr = formatDate(checkDate);
    const todayHistory = history[todayStr] || [];
    const isTodayComplete = tasks.length > 0 && todayHistory.length === tasks.length;

    // Start checking backwards
    let currentCheck = new Date();
    if (!isTodayComplete) {
      currentCheck.setDate(currentCheck.getDate() - 1);
    }

    while (true) {
      const checkStr = formatDate(currentCheck);
      const dayHistory = history[checkStr] || [];
      if (tasks.length > 0 && dayHistory.length === tasks.length) {
        streakCount++;
        currentCheck.setDate(currentCheck.getDate() - 1);
      } else {
        break;
      }
    }
    return streakCount;
  }, [history, tasks.length]);

  // --- Local Storage Logic ---
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('habit-tracker-data');
      if (savedData) {
        const { 
          tasks: savedTasks, 
          history: savedHistory, 
          hasStarted: savedStarted, 
          darkMode: savedDarkMode,
          companionType: savedCompanionType
        } = JSON.parse(savedData);
        if (Array.isArray(savedTasks) && savedTasks.length >= 1 && savedTasks.length <= 10) {
          setTasks(savedTasks);
        }
        if (savedHistory && typeof savedHistory === 'object') {
          setHistory(savedHistory);
        }
        if (typeof savedStarted === 'boolean') {
          setHasStarted(savedStarted);
        }
        if (typeof savedDarkMode === 'boolean') {
          setDarkMode(savedDarkMode);
        }
        if (savedCompanionType && ['auto', 'white_cat', 'black_witch_cat', 'wise_owl'].includes(savedCompanionType)) {
          setCompanionType(savedCompanionType);
        }
      }
    } catch (e) {
      console.error("Error reading habit data from localStorage", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('habit-tracker-data', JSON.stringify({ 
      tasks, 
      history, 
      hasStarted, 
      darkMode, 
      companionType 
    }));
  }, [tasks, history, hasStarted, darkMode, companionType]);

  // --- Logic Handlers ---
  const toggleTask = (taskIndex: number) => {
    const currentDayHistory = history[selectedDate] || [];
    const isChecking = !currentDayHistory.includes(taskIndex);
    let newDayHistory: number[];

    if (currentDayHistory.includes(taskIndex)) {
      newDayHistory = currentDayHistory.filter(i => i !== taskIndex);
    } else {
      newDayHistory = [...currentDayHistory, taskIndex];
    }

    const updatedHistory = { ...history, [selectedDate]: newDayHistory };
    setHistory(updatedHistory);

    // Audio check pop or damp uncheck bong depending on state
    if (isChecking) {
      audioEngine.playCheckPop();
    } else {
      audioEngine.playUncheckBong();
    }

    // Companion dialogue trigger
    if (isChecking) {
      if (newDayHistory.length === tasks.length && tasks.length > 0) {
        setCompanionAction({ type: 'complete_all', timestamp: Date.now() });
      } else {
        setCompanionAction({ type: 'check', timestamp: Date.now() });
      }
    } else {
      setCompanionAction({ type: 'uncheck', timestamp: Date.now() });
    }

    // Celebration Trigger: If all current tasks are completed
    if (newDayHistory.length === tasks.length && tasks.length > 0) {
      audioEngine.playSuccessChime();
      triggerCelebration();
    }
  };

  const triggerCelebration = () => {
    setShowCelebration(true);
    setIsRecentlyCompleted(true);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: darkMode ? ['#22d3ee', '#a78bfa', '#f59e0b'] : ['#3b82f6', '#10b981', '#f59e0b']
    });
    
    // Clear overlay celebration
    setTimeout(() => {
      setShowCelebration(false);
    }, 3000);

    // Turn off active container pulse after exactly 2 seconds
    setTimeout(() => {
      setIsRecentlyCompleted(false);
    }, 2000);
  };

  // --- Settings Handlers ---
  const removeTaskInSettings = (indexToRemove: number) => {
    if (tasks.length <= 1) return; // Must keep at least one habit
    
    // Update tasks
    const newTasks = tasks.filter((_, idx) => idx !== indexToRemove);
    setTasks(newTasks);

    // Shift indexes in history map to prevent wrong tasks from staying finished
    const updatedHistory: HabitHistory = {};
    Object.keys(history).forEach((dateStr) => {
      const dayHistory = history[dateStr] || [];
      const newDayHistory = dayHistory
        .filter((idx) => idx !== indexToRemove)
        .map((idx) => (idx > indexToRemove ? idx - 1 : idx));
      updatedHistory[dateStr] = newDayHistory;
    });
    setHistory(updatedHistory);
  };

  const addTaskInSettings = () => {
    if (tasks.length >= 10) return;
    setTasks([...tasks, `New Habit ${tasks.length + 1}`]);
  };

  // --- Calendar Month Navigation ---
  const handlePrevMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // --- Calendar Rendering Logic ---
  const days = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysCount = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const dayArray: (Date | null)[] = [];

    // Padding for start of month
    for (let i = 0; i < firstDay; i++) {
      dayArray.push(null);
    }
    // Actual days
    for (let d = 1; d <= daysCount; d++) {
      dayArray.push(new Date(year, month, d));
    }
    return dayArray;
  }, [viewDate]);

  return (
    <div id="content-layout" className={`min-h-screen font-sans selection:bg-blue-100 selection:text-blue-800 transition-colors duration-300 ${
      darkMode 
        ? 'bg-slate-950 text-slate-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-neutral-950' 
        : 'bg-slate-50 text-slate-900'
    }`}>
      
      <AnimatePresence mode="wait">
        {!hasStarted ? (
          /* Landing Screen */
          <motion.div 
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 flex items-center justify-center p-4 z-45 transition-colors duration-300 ${
              darkMode ? 'bg-slate-950' : 'bg-slate-50'
            }`}
          >
            {/* Decorative Grid Background Accent */}
            <div className={`absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60 pointer-events-none ${
              darkMode ? 'opacity-15 invert' : 'opacity-60'
            }`} />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
              className={`relative max-w-lg w-full rounded-[32px] p-8 md:p-12 text-center z-10 overflow-hidden border ${
                darkMode 
                  ? 'bg-slate-900/90 border-slate-800 shadow-[0_24px_60px_rgba(0,0,0,0.6)] shadow-cyan-500/10' 
                  : 'bg-white border-slate-100 shadow-[0_24px_60px_rgba(148,163,184,0.18)]'
              }`}
            >
              {/* Distinctive Top Line Accent */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cyan-400 via-indigo-500 to-amber-400 animate-[pulse_3s_infinite]" />
              
              {/* Dark mode switcher on landing page */}
              <div className="absolute top-6 right-6">
                <button 
                  id="btn-landing-toggle-theme"
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    darkMode 
                      ? 'bg-slate-850 border-slate-800 text-yellow-400 hover:bg-slate-800' 
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                  }`}
                  aria-label="Toggle Theme"
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>

              <div className="mb-6 flex justify-center">
                <div id="landing-icon-container" className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-sm ${
                  darkMode ? 'bg-indigo-950/50 border-indigo-900' : 'bg-blue-50 border-blue-100'
                }`}>
                  <Sparkles className={`w-8 h-8 animate-[pulse_2s_infinite] ${
                    darkMode ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 'text-blue-500'
                  }`} />
                </div>
              </div>

              <h1 id="landing-title" className={`text-4xl md:text-5xl font-black tracking-tight leading-none mb-4 lowercase transition-all ${
                darkMode 
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]' 
                  : 'text-slate-800'
              }`}>
                let's get to work
              </h1>
              
              <p id="landing-subtitle" className={`font-medium text-sm md:text-base mb-8 max-w-sm mx-auto leading-relaxed ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Welcome to <span className={darkMode ? "text-cyan-400" : "text-slate-850 font-semibold"}>HabitFlow</span>. Track habits, unlock neon milestones, and master your routines.
              </p>

              <motion.button
                id="btn-enter-app"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setHasStarted(true)}
                className={`w-full text-base font-bold py-4 rounded-2xl transition-all cursor-pointer select-none border ${
                  darkMode 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_4px_20px_rgba(34,211,238,0.25)] border-transparent' 
                    : 'bg-slate-800 hover:bg-slate-900 text-white shadow-lg shadow-slate-800/15 border-slate-700'
                }`}
              >
                Enter Habit Flow
              </motion.button>
            </motion.div>
          </motion.div>
        ) : (
          /* Main Workspace Flow */
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="p-4 md:p-8 pt-16 md:pt-20"
          >
            <div className="max-w-6xl mx-auto">
              
              {/* Header with relative container for absolute positioning of top-center Shih Tzu companion */}
              <header id="app-header" className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 relative">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className={`text-3xl font-extrabold tracking-tight transition-all duration-300 ${
                      darkMode 
                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]' 
                        : 'text-slate-800'
                    }`}>HabitFlow</h1>
                    <span id="streak-badge" className={`text-xs font-bold px-2.5 py-1 rounded-md border flex items-center gap-1 transition-all duration-300 ${
                      darkMode 
                        ? 'bg-amber-950/40 text-amber-400 border-amber-800/60 shadow-[0_0_8px_rgba(245,158,11,0.25)]' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      Streaks 🔥: {currentStreak}
                    </span>
                  </div>
                  <p className={`font-medium text-xs md:text-sm mt-0.5 ${
                    darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>Track your consistency, master your life.</p>
                </div>

                {/* Standalone Companion centrally aligned (Cat for light theme, Owl for dark theme, or custom chosen partner) */}
                <div id="companion-positioner" className="sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:top-[-20.5px] z-20">
                  <Companion 
                    tasksCompleted={history[selectedDate]?.length || 0} 
                    totalTasks={tasks.length} 
                    theme={darkMode ? 'dark' : 'light'} 
                    companionType={companionType}
                    companionAction={companionAction}
                  />
                </div>

                <div className="flex gap-2 items-center">
                  {/* About Dev Dropdown Component */}
                  <div className="relative">
                    <button 
                      id="btn-dev-info-toggle"
                      onClick={() => setShowDevInfo(!showDevInfo)}
                      className={`px-3.5 py-2.5 text-sm font-semibold rounded-2xl shadow-sm border transition-all cursor-pointer flex items-center gap-1.5 ${
                        darkMode 
                          ? 'bg-slate-900 border-slate-800 text-indigo-400 hover:text-indigo-300 hover:bg-slate-850' 
                          : 'bg-white border-slate-200 text-slate-600 hover:text-slate-50 hover:text-slate-800'
                      }`}
                      aria-label="About Developer"
                    >
                      <User className="w-4 h-4 text-indigo-400" />
                      <span className="hidden sm:inline">About Dev</span>
                    </button>

                    <AnimatePresence>
                      {showDevInfo && (
                        <>
                          {/* Backdrop to close the popup */}
                          <div 
                            className="fixed inset-0 z-40 cursor-default" 
                            onClick={() => setShowDevInfo(false)} 
                          />
                          
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={`absolute right-0 mt-3 w-85 rounded-3xl p-5 border z-50 shadow-2xl transition-all duration-300 ${
                              darkMode 
                                ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.6)]' 
                                : 'bg-white border-slate-100 text-slate-900 shadow-[0_12px_40px_rgba(148,163,184,0.18)]'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-indigo-400">Developer Profile</h4>
                              <button 
                                onClick={() => setShowDevInfo(false)}
                                className={`text-slate-400 hover:text-slate-350 transition-colors cursor-pointer`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="flex items-center gap-3.5 mb-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border font-black text-base select-none shadow-sm ${
                                darkMode ? 'bg-indigo-950/60 border-indigo-800 text-indigo-350 overflow-hidden' : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                              }`}>
                                AS
                              </div>
                              <div className="flex-1">
                                <h3 id="dev-name" className="font-extrabold text-base leading-tight">Aditya Shrivastava</h3>
                                <p className={`text-[11px] font-semibold flex items-center gap-1 mt-0.5 ${
                                  darkMode ? 'text-indigo-400' : 'text-slate-500'
                                }`}>
                                  <GraduationCap className="w-3.5 h-3.5" />
                                  <span>Student Innovator</span>
                                </p>
                              </div>
                            </div>
                            
                            <p id="dev-description" className={`text-xs leading-relaxed mb-4 font-medium p-3.5 rounded-2xl border ${
                              darkMode 
                                ? 'bg-slate-950/50 border-slate-800 text-slate-300' 
                                : 'bg-slate-50 border-slate-100 text-slate-600'
                            }`}>
                              Student of BITS Pilani and IIT, Madras, designing modern software experiences.
                            </p>
                            
                            <a 
                              id="dev-linkedin-link"
                              href="https://www.linkedin.com/in/aditya-s-96905b373/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                                darkMode 
                                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/15' 
                                  : 'bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700'
                              }`}
                            >
                              <Linkedin className="w-4 h-4 shrink-0 fill-current" />
                              <span>Connect on LinkedIn</span>
                              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                            </a>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  <button 
                    id="btn-return-landing"
                    onClick={() => setHasStarted(false)}
                    className={`px-4 py-2 text-sm font-semibold rounded-2xl shadow-sm border transition-all cursor-pointer ${
                      darkMode 
                        ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    Landing
                  </button>
                  <button 
                    id="btn-header-toggle-dark"
                    onClick={() => setDarkMode(!darkMode)}
                    className={`p-3 rounded-2xl border shadow-sm hover:shadow transition-all cursor-pointer ${
                      darkMode 
                        ? 'bg-slate-900 border-slate-800 text-yellow-400 hover:text-yellow-300 hover:bg-slate-800' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                    aria-label="Toggle Theme"
                  >
                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
                  <button 
                    id="btn-settings-open"
                    onClick={() => setShowSettings(true)}
                    aria-label="Settings"
                    className={`p-3 rounded-2xl shadow-sm hover:shadow transition-all border cursor-pointer ${
                      darkMode 
                        ? 'bg-slate-900 border-slate-800 text-indigo-400 hover:text-indigo-300 hover:bg-slate-850' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
              </header>

              <div id="main-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column: Calendar */}
                <section id="calendar-section" className={`rounded-3xl p-6 border transition-all duration-300 lg:col-span-7 ${
                  darkMode 
                    ? 'bg-slate-900/40 border-slate-800/80 shadow-[0_12px_40px_rgba(0,0,0,0.5)] shadow-indigo-950/10' 
                    : 'bg-white border-slate-100 shadow-xl shadow-slate-200/60'
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <CalendarIcon className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-blue-500'}`} />
                      <span className={darkMode ? 'text-indigo-200' : 'text-slate-800'}>
                        {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </span>
                    </h2>
                    <div className="flex gap-1">
                      <button 
                        id="btn-prev-month"
                        onClick={handlePrevMonth} 
                        className={`p-2 rounded-xl transition-colors cursor-pointer ${
                          darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                        }`}
                        aria-label="Previous Month"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button 
                        id="btn-next-month"
                        onClick={handleNextMonth} 
                        className={`p-2 rounded-xl transition-colors cursor-pointer ${
                          darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                        }`}
                        aria-label="Next Month"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <div key={d} className={`text-center text-xs font-bold uppercase tracking-wider mb-2 ${
                        darkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}>{d}</div>
                    ))}
                    {days.map((date, i) => {
                      if (!date) return <div key={`empty-${i}`} className="aspect-square" />;
                      const dateStr = formatDate(date);
                      const dayHistory = history[dateStr] || [];
                      const completedCount = dayHistory.length;
                      const isSelected = selectedDate === dateStr;
                      const isToday = formatDate(new Date()) === dateStr;
                      const hasGoals = tasks.length > 0;
                      const isFullyCompleted = hasGoals && completedCount === tasks.length;

                      return (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          key={dateStr}
                          id={`btn-date-${dateStr}`}
                          onClick={() => setSelectedDate(dateStr)}
                          className={`
                            relative aspect-square rounded-2xl flex flex-col items-center justify-between p-1.5 pb-2.5 transition-all border cursor-pointer select-none
                            ${isSelected 
                              ? darkMode 
                                ? 'border-cyan-500 ring-4 ring-cyan-500/10 bg-cyan-950/20 shadow-[0_0_12px_rgba(34,211,238,0.25)]' 
                                : 'border-blue-500 ring-4 ring-blue-100/60 bg-blue-50/20' 
                              : darkMode
                                ? 'border-slate-800'
                                : 'border-slate-100'
                            }
                            ${isToday 
                              ? darkMode 
                                ? 'bg-indigo-950/40 font-bold border-indigo-700/60 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.25)]' 
                                : 'bg-blue-50/50 font-bold border-blue-200 text-blue-700' 
                              : darkMode
                                ? 'bg-slate-900/50 text-slate-300 hover:bg-slate-800/80 shadow-inner'
                                : 'bg-slate-50/80 hover:bg-slate-100'
                            }
                            ${isFullyCompleted 
                              ? darkMode
                                ? 'bg-gradient-to-b from-amber-950/40 via-amber-950/20 to-slate-900 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.45)] ring-2 ring-amber-500/20'
                                : 'bg-gradient-to-b from-amber-50 to-amber-100/60 border-amber-400 shadow-[0_3px_10px_rgba(245,158,11,0.2)] ring-2 ring-amber-200/50'
                              : ''
                            } 
                          `}
                        >
                          {/* FLOATING CROWN ICON SIT ELEGANTLY ON TOP FOR COMPLETED DAYS */}
                          {isFullyCompleted && (
                            <div className="absolute -top-[11px] left-1/2 transform -translate-x-1/2 z-10 drop-shadow-[0_2px_4px_rgba(245,158,11,0.5)]">
                              <Crown className="w-5.5 h-5.5 text-amber-400 fill-amber-300 animate-[bounce_3s_infinite]" />
                            </div>
                          )}

                          <span className={`text-xs md:text-sm ${
                            isSelected 
                              ? darkMode ? 'text-cyan-400 font-bold' : 'text-blue-600 font-bold' 
                              : isFullyCompleted
                                ? 'text-amber-500 font-extrabold'
                                : darkMode ? 'text-slate-300' : 'text-slate-700 font-semibold'
                          }`}>{date.getDate()}</span>
                          
                          {/* Visual Progress Indicators (Dots) */}
                          <div className="flex flex-wrap justify-center gap-0.5 mt-1 px-1 max-w-[90%] mx-auto">
                            {tasks.map((_, dotIdx) => {
                              const isCompleted = dayHistory.includes(dotIdx);
                              return (
                                <div 
                                  key={dotIdx}
                                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                                    isCompleted 
                                      ? isFullyCompleted
                                        ? 'bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.5)]'
                                        : darkMode 
                                          ? 'bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)]' 
                                          : 'bg-emerald-500' 
                                      : darkMode 
                                        ? 'bg-slate-800' 
                                        : 'bg-slate-200'
                                  }`}
                                />
                              );
                            })}
                          </div>
                          
                          {/* Full Completion Gold Inner Halo */}
                          {isFullyCompleted && (
                            <div className="absolute inset-0 rounded-2xl border border-amber-400/30 pointer-events-none" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </section>

                {/* Right Column: Task List */}
                <section id="tasks-section" className="lg:col-span-5 flex flex-col gap-6">
                  <div className={`rounded-3xl p-6 border transition-all duration-300 flex-1 relative ${
                    isRecentlyCompleted
                      ? darkMode
                        ? 'bg-slate-900/60 border-cyan-500 shadow-[0_0_25px_rgba(34,211,238,0.35)] animate-[pulse_1s_infinite]'
                        : 'bg-emerald-50/60 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.25)] animate-[pulse_1s_infinite]'
                      : darkMode 
                        ? 'bg-slate-900/40 border-slate-800/80 shadow-[0_12px_40px_rgba(0,0,0,0.5)] shadow-indigo-950/10' 
                        : 'bg-white border-slate-100 shadow-xl shadow-slate-200/60'
                  }`}>
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <h2 className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>Daily Tasks</h2>
                        <p className={`font-medium text-xs md:text-sm mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {new Date(selectedDate.replace(/-/g, '/')).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-3xl font-black ${darkMode ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]' : 'text-blue-600'}`}>
                          {(history[selectedDate]?.length || 0)}
                        </span>
                        <span className={`font-bold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>/{tasks.length}</span>
                      </div>
                    </div>

                    {/* Progress Bar with neon colors and glows */}
                    <div className={`w-full h-2.5 rounded-full mb-6 overflow-hidden ${
                      darkMode ? 'bg-slate-800' : 'bg-slate-100'
                    }`}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${tasks.length > 0 ? ((history[selectedDate]?.length || 0) / tasks.length) * 100 : 0}%` }}
                        className={`h-full transition-colors duration-500 ${
                          (history[selectedDate]?.length || 0) === tasks.length && tasks.length > 0 
                            ? 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' 
                            : darkMode 
                              ? 'bg-gradient-to-r from-cyan-450 to-blue-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                              : 'bg-emerald-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-3">
                      {tasks.map((task, idx) => {
                        const isDone = history[selectedDate]?.includes(idx);
                        return (
                          <motion.div
                            key={idx}
                            id={`task-item-${idx}`}
                            initial={false}
                            animate={{ 
                              backgroundColor: isDone 
                                ? darkMode ? '#0f2d2b' : '#f0fdf4' 
                                : darkMode ? '#1e293b' : '#ffffff',
                              borderColor: isDone
                                ? darkMode ? '#115e59' : '#bbf7d0'
                                : darkMode ? '#334155' : '#f1f5f9'
                            }}
                            onClick={() => toggleTask(idx)}
                            className={`
                              group flex items-center p-4 rounded-2xl border cursor-pointer transition-all select-none
                              ${isDone 
                                ? 'shadow-sm' 
                                : darkMode 
                                  ? 'hover:border-slate-600 hover:shadow-[0_0_12px_rgba(148,163,184,0.1)]' 
                                  : 'hover:border-blue-200 hover:shadow-sm'
                              }
                            `}
                          >
                            {/* Tactile Checkbox: whileTap scale down, spring pulse draw */}
                            <motion.div 
                              whileTap={{ scale: 0.8 }}
                              className="mr-4 shrink-0 cursor-pointer"
                              animate={{ 
                                scale: isDone ? [1, 1.15, 1] : 1,
                              }}
                              transition={{ duration: 0.25 }}
                            >
                              {isDone ? (
                                <CheckCircle2 className={`w-6 h-6 transition-all ${
                                  darkMode 
                                    ? 'text-cyan-455 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] fill-cyan-950/40' 
                                    : 'text-emerald-500 fill-emerald-50'
                                }`} />
                              ) : (
                                <Circle className={`w-6 h-6 transition-all ${
                                  darkMode 
                                    ? 'text-slate-600 group-hover:text-cyan-400 group-hover:drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]' 
                                    : 'text-slate-300 group-hover:text-blue-400'
                                }`} />
                              )}
                            </motion.div>
                            
                            <span 
                              style={{ 
                                transition: "all 0.3s cubic-bezier(0.25, 1, 0.5, 1)" 
                              }}
                              className={`font-medium text-sm md:text-base ${
                                isDone 
                                  ? darkMode 
                                    ? 'text-cyan-350 line-through decoration-cyan-900/60 font-semibold opacity-50' 
                                    : 'text-emerald-700 line-through decoration-emerald-250 opacity-50' 
                                  : darkMode 
                                    ? 'text-slate-200 opacity-100' 
                                    : 'text-slate-700 opacity-100'
                              }`}
                            >
                              {task}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Settings Modal */}
            <AnimatePresence>
              {showSettings && (
                <motion.div 
                  id="settings-modal-backdrop"
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                >
                  <motion.div 
                    id="settings-modal-content"
                    initial={{ scale: 0.9, y: 20 }} 
                    animate={{ scale: 1, y: 0 }} 
                    exit={{ scale: 0.9, y: 20 }}
                    className={`rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto border ${
                      darkMode 
                        ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-cyan-500/5' 
                        : 'bg-white border-slate-100 text-slate-900'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-xl font-bold">Your Routine Goals</h3>
                        <p className={`text-xs font-semibold mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          Configure 1 to 10 daily habits
                        </p>
                      </div>
                      <button 
                        id="btn-settings-close"
                        onClick={() => setShowSettings(false)}
                        className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                          darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                        }`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Dark Mode Switcher Option (Neon colors and glow) */}
                    <div className={`p-4 rounded-2xl border flex items-center justify-between mb-6 transition-all ${
                      darkMode 
                        ? 'bg-slate-800/40 border-slate-700/60 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        {darkMode ? (
                          <div className="w-8 h-8 rounded-lg bg-indigo-950/60 flex items-center justify-center border border-indigo-700">
                            <Moon className="w-4 h-4 text-indigo-400 drop-shadow-[0_0_5px_rgba(129,140,248,0.8)]" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-200">
                            <Sun className="w-4 h-4 text-amber-500" />
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-xs md:text-sm block">Neon Dark Mode</span>
                          <span className="text-[10px] text-slate-400 font-semibold">Toggles glow accents</span>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        id="btn-toggle-darkmode"
                        onClick={() => setDarkMode(!darkMode)}
                        aria-label="Toggle neon mode"
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          darkMode ? 'bg-indigo-500' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            darkMode ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Focus Companion Selector Option */}
                    <div className={`p-4 rounded-2xl border mb-6 transition-all ${
                      darkMode 
                        ? 'bg-slate-800/40 border-slate-700/60 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="mb-3">
                        <span className="font-bold text-xs md:text-sm block">Focus Companion</span>
                        <span className="text-[10px] text-slate-400 font-semibold">Choose your daily routine partner</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'auto', label: 'Auto (Default) ✨' },
                          { id: 'white_cat', label: 'White Cat 🐾' },
                          { id: 'black_witch_cat', label: 'Witch Cat 🔮' },
                          { id: 'wise_owl', label: 'Wise Owl 🦉' }
                        ].map((companion) => (
                          <button
                            key={companion.id}
                            type="button"
                            id={`btn-select-companion-${companion.id}`}
                            onClick={() => {
                              setCompanionType(companion.id as any);
                              audioEngine?.playCheckPop?.();
                            }}
                            className={`px-3 py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                              companionType === companion.id
                                ? darkMode
                                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.25)]'
                                  : 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : darkMode
                                  ? 'bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                            }`}
                          >
                            {companion.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
                      {tasks.map((t, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <span className={`text-xs font-mono font-bold w-5 text-center ${
                            darkMode ? 'text-indigo-400' : 'text-slate-400'
                          }`}>{(i + 1).toString().padStart(2, '0')}</span>
                          <input
                            id={`input-habit-${i}`}
                            value={t}
                            onChange={(e) => {
                              const newTasks = [...tasks];
                              newTasks[i] = e.target.value;
                              setTasks(newTasks);
                            }}
                            className={`flex-1 px-4 py-2.5 border rounded-xl focus:ring-2 focus:bg-white outline-none transition-all text-sm font-semibold ${
                              darkMode 
                                ? 'bg-slate-800/80 border-slate-705 text-slate-100 focus:text-slate-900 focus:ring-cyan-500' 
                                : 'bg-slate-50 hover:bg-slate-100/50 border-slate-200 text-slate-700 focus:ring-blue-500'
                            }`}
                            placeholder={`Habit name`}
                          />
                          {tasks.length > 1 && (
                            <button
                              type="button"
                              id={`btn-remove-habit-${i}`}
                              onClick={() => removeTaskInSettings(i)}
                              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                darkMode ? 'text-slate-500 hover:text-red-400 hover:bg-slate-800' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                              }`}
                              title="Delete Habit"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {tasks.length < 10 && (
                      <button
                        type="button"
                        id="btn-add-habit"
                        onClick={addTaskInSettings}
                        className={`w-full mt-4 border-2 border-dashed font-bold py-2.5 rounded-xl transition-all cursor-pointer text-sm flex items-center justify-center gap-1.5 ${
                          darkMode 
                            ? 'border-slate-800 hover:border-cyan-500 shadow-inner hover:text-cyan-400 text-slate-400 bg-slate-950/40 hover:bg-slate-900/40' 
                            : 'border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-500 bg-slate-50/50 hover:bg-white'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add New Habit</span>
                        <span className="text-xs font-normal opacity-70">({tasks.length}/10)</span>
                      </button>
                    )}
                    
                    <button 
                      id="btn-settings-save"
                      onClick={() => setShowSettings(false)}
                      className={`w-full mt-6 font-bold py-3.5 rounded-xl transition-all cursor-pointer text-sm border-0 ${
                        darkMode 
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/10 hover:brightness-110' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
                      }`}
                    >
                      Save Goals
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Celebration Overlay */}
            <AnimatePresence>
              {showCelebration && (
                <motion.div 
                  id="celebration-overlay"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4"
                >
                  <div className={`border-4 p-8 md:p-12 rounded-[40px] shadow-2xl flex flex-col items-center max-w-sm w-full backdrop-blur-md ${
                    darkMode 
                      ? 'bg-slate-900/95 border-amber-400 shadow-amber-500/10' 
                      : 'bg-white/95 border-amber-400'
                  }`}>
                    <Trophy className="w-16 h-16 text-amber-500 mb-4 animate-bounce" />
                    <h2 className={`text-3xl md:text-4xl font-black text-center tracking-tight ${
                      darkMode 
                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]' 
                        : 'text-slate-800'
                    }`}>PERFECT DAY!</h2>
                    <p className={`mt-2 font-semibold text-center ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      You've crushed all your routine goals!
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
