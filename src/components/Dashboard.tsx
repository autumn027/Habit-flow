import { useMemo, useState, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  TrendingUp, 
  Award, 
  Volume2, 
  VolumeX, 
  Zap, 
  Target, 
  BarChart2, 
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { HabitHistory } from '../types';
import { calculateStatsAndMilestones, MILESTONES, Milestone } from '../utils/achievementService';
import { formatDate } from '../utils/dateHelpers';
import { audioEngine } from '../utils/audio';

interface DashboardProps {
  history: HabitHistory;
  tasks: string[];
  darkMode: boolean;
  soundMuted: boolean;
  monthlyGoal: number;
  onToggleSound: () => void;
  onBackToTracker: () => void;
}

export default function Dashboard({
  history,
  tasks,
  darkMode,
  soundMuted,
  monthlyGoal,
  onToggleSound,
  onBackToTracker
}: DashboardProps) {
  // --- Calculate Achievement Metrics & Stats ---
  const stats = useMemo(() => {
    return calculateStatsAndMilestones(history, tasks.length);
  }, [history, tasks.length]);

  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number; rate: number; x: number; y: number } | null>(null);

  // --- Past 14-days completion data for line chart ---
  const lineChartData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = formatDate(d);
      const completed = history[dateStr] || [];
      const rate = tasks.length > 0 ? Math.min(100, Math.round((completed.length / tasks.length) * 100)) : 0;
      data.push({
        dateLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dateStr,
        completedCount: completed.length,
        rate
      });
    }
    return data;
  }, [history, tasks.length]);

  // --- Monthly Review Card Insights ---
  const monthlyReview = useMemo(() => {
    const today = new Date();
    const currentMonthNum = today.getMonth(); // 0-indexed
    const currentYearNum = today.getFullYear();
    const daysInMonth = new Date(currentYearNum, currentMonthNum + 1, 0).getDate();
    
    let completedInMonth = 0;

    // Track for completed tasks within the entire calendar month
    for (let idx = 1; idx <= daysInMonth; idx++) {
      const d = new Date(currentYearNum, currentMonthNum, idx);
      const dateStr = formatDate(d);
      const dayCompletions = history[dateStr] || [];
      completedInMonth += dayCompletions.length;
    }

    const percentage = monthlyGoal > 0 ? Math.round((completedInMonth / monthlyGoal) * 100) : 0;
    const monthName = today.toLocaleString('default', { month: 'long' });

    let message = `You have completed ${completedInMonth} tasks out of your monthly target of ${monthlyGoal}!`;
    if (percentage >= 100) {
      message = `Incredible! You have officially conquered your target monthly goal of ${monthlyGoal} completions! ⭐`;
    } else if (percentage > 80) {
      message = "So close to your target! Let's keep checking those habits to finish strong.";
    } else if (percentage > 50) {
      message = "Over halfway to your target goal! Keep showing up every single day.";
    } else if (percentage < 30 && percentage > 0) {
      message = "Every small choice adds up. Stay consistent to power towards your target.";
    }

    return {
      monthName,
      completedInMonth,
      monthlyGoal,
      percentage,
      message
    };
  }, [history, monthlyGoal]);

  // --- SVG Chart Calculations & Coordinate Generators ---
  const lineChartPath = useMemo(() => {
    if (lineChartData.length === 0) {
      return { line: '', area: '', points: [] };
    }
    const width = 500;
    const height = 140;
    const paddingX = 40;
    const paddingY = 20;

    const chartWidth = width - (paddingX * 2);
    const chartHeight = height - (paddingY * 2);

    const points = lineChartData.map((data, index) => {
      const x = paddingX + (index * (chartWidth / (lineChartData.length - 1)));
      // Map the completion rate percentage from 0 to 100. 100% should be at top (paddingY), 0% at bottom (height - paddingY)
      const y = (height - paddingY) - ((data.rate / 100) * chartHeight);
      return { x, y };
    });

    // Create standard line command
    const pathCommand = points.reduce((acc, point, index) => {
      return index === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
    }, '');

    // Create filled gradient area command
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const areaCommand = pathCommand 
      ? `${pathCommand} L ${lastPoint.x} ${height - paddingY} L ${firstPoint.x} ${height - paddingY} Z` 
      : '';

    return {
      line: pathCommand,
      area: areaCommand,
      points
    };
  }, [lineChartData]);

  // Handle cell hover tooltips safely
  const handleCellHover = (e: MouseEvent<HTMLButtonElement>, dateStr: string, count: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipX = rect.left + window.scrollX + rect.width / 2;
    const tooltipY = rect.top + window.scrollY - 36;
    setHoveredCell({
      date: new Date(dateStr.replace(/-/g, '/')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      count,
      x: tooltipX,
      y: tooltipY
    });
  };

  return (
    <div id="dashboard-root" className="space-y-8 pb-16">
      
      {/* Top Controls Header Segment */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className={`text-2xl md:text-3xl font-black ${
            darkMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]' : 'text-slate-800'
          }`}>Consistency Hub</h2>
          <p className={`text-xs md:text-sm font-semibold mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Comprehensive logs, dynamic streaks, and gamified achievements
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Mute Setting tactile toggle */}
          <button
            id="btn-toggle-mute-dash"
            onClick={onToggleSound}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 font-bold text-xs ${
              soundMuted 
                ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                : darkMode 
                  ? 'bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title={soundMuted ? "Unmute sound effects" : "Mute sound effects"}
          >
            {soundMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>Sounds: Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sounds: Active</span>
              </>
            )}
          </button>

          <button
            id="btn-back-to-tracker"
            onClick={onBackToTracker}
            className={`py-2.5 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer border flex items-center gap-1.5 ${
              darkMode 
                ? 'bg-slate-900 border-slate-800 text-cyan-400 hover:text-cyan-300 hover:bg-slate-850 shadow-inner' 
                : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-900 shadow-md'
            }`}
          >
            <span>Back to Tracker</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Analytics Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Streak Counters and Stats Widget Header */}
        <section className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              title: "Current Streak",
              value: `${stats.currentStreak} Days`,
              icon: Zap,
              color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
              glow: 'shadow-amber-500/5 dark:shadow-amber-500/10',
              label: "Daily routines maintained"
            },
            {
              title: "Longest Streak",
              value: `${stats.longestStreak} Days`,
              icon: Trophy,
              color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
              glow: 'shadow-yellow-500/5 dark:shadow-yellow-500/10',
              label: "All-time personal record"
            },
            {
              title: "Total Completed",
              value: `${stats.totalCompletedCount} Tasks`,
              icon: Target,
              color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
              glow: 'shadow-cyan-500/5 dark:shadow-cyan-500/10',
              label: "Total habit ticks checked"
            },
            {
              title: "Badges Unlocked",
              value: `${stats.unlockedList.length} / ${MILESTONES.length}`,
              icon: Award,
              color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
              glow: 'shadow-emerald-500/5 dark:shadow-emerald-500/10',
              label: "Milestone achievements met"
            }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`rounded-2xl border p-4 shadow-sm flex flex-col justify-between transition-all ${item.glow} ${
                darkMode ? 'bg-slate-900/50 border-slate-800/80 shadow-[0_12px_40px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {item.title}
                </span>
                <div className={`p-1.5 rounded-lg border ${item.color}`}>
                  <item.icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className={`text-2xl font-extrabold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  {item.value}
                </span>
                <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">
                  {item.label}
                </span>
              </div>
            </motion.div>
          ))}
        </section>

        {/* 14-Day Tasks Completed Trend Widget */}
        <section id="completion-trend-card" className={`rounded-3xl p-6 border transition-all duration-300 lg:col-span-6 min-h-[290px] flex flex-col justify-between ${
          darkMode 
            ? 'bg-slate-900/40 border-slate-800/80 shadow-[0_12px_40px_rgba(0,0,0,0.5)] shadow-indigo-950/10' 
            : 'bg-white border-slate-100 shadow-xl shadow-slate-200/60'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Tasks Completed Trend
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
              }`}>
                Past 14 Days
              </span>
            </div>
            <p className={`text-xs font-semibold mb-4 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Daily completion percentage of habits relative to active list (Y-axis scaled from 0% to 100%)
            </p>
          </div>

          {/* SVG Vector Line Chart */}
          <div className="relative w-full h-36 flex items-end">
            <svg viewBox="0 0 500 140" className="w-full h-full overflow-visible">
              <defs>
                {/* Neon Area Gradients */}
                <linearGradient id="areaGlowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="lineColors" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="50%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Horizontal Reference Grid Lines */}
              <line x1="40" y1="20" x2="460" y2="20" stroke={darkMode ? "#334155" : "#e2e8f0"} strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="70" x2="460" y2="70" stroke={darkMode ? "#1e293b" : "#f1f5f9"} strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="120" x2="460" y2="120" stroke={darkMode ? "#334155" : "#e2e8f0"} strokeWidth="1" />

              {lineChartPath.line ? (
                <>
                  {/* Glowing Fill Area */}
                  <path d={lineChartPath.area} fill="url(#areaGlowGradient)" />
                  {/* Beautiful Main Line */}
                  <path d={lineChartPath.line} fill="none" stroke="url(#lineColors)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {/* Tactile Plot Pointer Dots */}
                  {lineChartPath.points.map((point, i) => (
                    <g key={i}>
                      <circle 
                        cx={point.x} 
                        cy={point.y} 
                        r="3.5" 
                        fill={darkMode ? "#020617" : "#ffffff"} 
                        stroke="#06b6d4" 
                        strokeWidth="2.5" 
                        className="transition-all cursor-pointer hover:r-[5.5]"
                      />
                      {/* Invisible hover area for convenient triggers */}
                      <circle 
                        cx={point.x} 
                        cy={point.y} 
                        r="12" 
                        fill="transparent" 
                        className="cursor-pointer"
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredCell({
                            date: lineChartData[i].dateLabel,
                            count: lineChartData[i].completedCount,
                            rate: lineChartData[i].rate,
                            x: rect.left + window.scrollX + rect.width / 2,
                            y: rect.top + window.scrollY - 32
                          });
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                      />
                    </g>
                  ))}
                </>
              ) : null}
            </svg>
          </div>
          
          <div className="flex justify-between items-center px-8 border-t border-dashed border-slate-100 dark:border-slate-800/60 pt-3">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              {lineChartData[0]?.dateLabel}
            </span>
            <span className="text-[10px] text-center font-bold px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
              Avg Daily Rate: {Math.round(lineChartData.reduce((acc, curr) => acc + curr.rate, 0) / 14)}%
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              {lineChartData[lineChartData.length - 1]?.dateLabel}
            </span>
          </div>
        </section>

        {/* Highlighted Monthly Performance Review Card */}
        <section id="monthly-insights-card" className={`rounded-3xl p-6 border transition-all duration-300 lg:col-span-6 min-h-[290px] flex flex-col justify-between ${
          darkMode 
            ? 'bg-gradient-to-br from-indigo-950/20 via-slate-900/40 to-slate-900/40 border-indigo-900/30 shadow-[0_12px_40px_rgba(0,0,0,0.5)] shadow-indigo-950/10' 
            : 'bg-gradient-to-br from-indigo-50/20 to-white border-blue-50/80 shadow-xl shadow-slate-200/60'
        }`}>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
              <BarChart2 className="w-4 h-4 text-emerald-400 animate-pulse" />
              Monthly Consistency Summary
            </h3>
            <p className={`text-xs font-semibold leading-relaxed mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Completed habits during <span className="text-indigo-400 font-bold">{monthlyReview.monthName}</span> relative to your custom target goal.
            </p>
          </div>

          <div className="flex items-center gap-6 my-2">
            <div className="relative shrink-0 select-none">
              <svg className="w-24 h-24 transform -rotate-90">
                {/* Background Ring */}
                <circle cx="48" cy="48" r="40" fill="none" strokeWidth="8" className={darkMode ? 'stroke-slate-800' : 'stroke-slate-100'} />
                {/* Real-time Value Fill */}
                <motion.circle 
                  cx="48" cy="48" r="40" 
                  fill="none" 
                  strokeWidth="8"
                  stroke={darkMode ? '#10b981' : '#10b981'}
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - Math.min(100, monthlyReview.percentage) / 100)}`}
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - Math.min(100, monthlyReview.percentage) / 100) }}
                  transition={{ duration: 0.85, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-xl font-black ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  {monthlyReview.percentage}%
                </span>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                  Target Match
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-center md:text-left">
                <div className={`p-2 rounded-xl border ${darkMode ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-120'}`}>
                  <span className="block text-[9px] uppercase font-bold tracking-wide text-slate-400">Ticks Logged</span>
                  <span className="text-base font-bold text-emerald-400">{monthlyReview.completedInMonth} Completed</span>
                </div>
                <div className={`p-2 rounded-xl border ${darkMode ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-120'}`}>
                  <span className="block text-[9px] uppercase font-bold tracking-wide text-slate-400">Target Goal</span>
                  <span className="text-base font-bold text-cyan-400">{monthlyReview.monthlyGoal} Target</span>
                </div>
              </div>
              
              <div className="flex items-start gap-1.5 p-2 rounded-xl bg-indigo-500/5 text-indigo-400 text-[11px] font-medium leading-relaxed">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-[10px] font-semibold">{monthlyReview.message}</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-center font-bold px-4 py-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400">
            You completed {monthlyReview.completedInMonth} tasks in {monthlyReview.monthName}!
          </div>
        </section>

        {/* Gamified Achievement Gallery Component */}
        <section id="achievements-gallery" className={`rounded-3xl p-6 border transition-all duration-300 lg:col-span-12 ${
          darkMode 
            ? 'bg-slate-900/40 border-slate-800/80 shadow-[0_12px_40px_rgba(0,0,0,0.5)] shadow-indigo-950/10' 
            : 'bg-white border-slate-100 shadow-xl shadow-slate-200/60'
        }`}>
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-dashed border-slate-200/40 dark:border-slate-800/80 pb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                <Trophy className="w-4 h-4 text-amber-400 animate-bounce" />
                Badge Achievement Gallery
              </h3>
              <p className={`text-xs font-semibold leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Unlock exclusive badges immediately by scaling streak heights or ticking task volumes.
              </p>
            </div>
            
            <div className="flex gap-2 text-[10px] font-bold">
              <span className={`px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-450`}>
                Bronze Tier
              </span>
              <span className={`px-2 py-1 rounded bg-slate-400/10 border border-slate-400/20 text-slate-400`}>
                Silver Tier
              </span>
              <span className={`px-2 py-1 rounded bg-yellow-400/10 border border-yellow-400/20 text-yellow-450`}>
                Gold Tier
              </span>
              <span className={`px-2 py-1 rounded bg-cyan-400/10 border border-cyan-400/20 text-cyan-400`}>
                Legendary Tier
              </span>
            </div>
          </div>

          {/* Grid layout for badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {MILESTONES.map((badge, idx) => {
              const isUnlocked = stats.unlockedList.includes(badge.id);
              
              // Compute badge relative progress bar rates
              let currentProgressValue = 0;
              let barPercentage = 0;

              if (badge.category === 'streak') {
                currentProgressValue = stats.longestStreak;
                barPercentage = Math.round((stats.longestStreak / badge.threshold) * 100);
              } else if (badge.category === 'count') {
                currentProgressValue = stats.totalCompletedCount;
                barPercentage = Math.round((stats.totalCompletedCount / badge.threshold) * 100);
              }
              barPercentage = Math.min(100, Math.max(0, barPercentage));

              return (
                <motion.div
                  key={badge.id}
                  id={`badge-card-${badge.id}`}
                  whileHover={isUnlocked ? { scale: 1.02, y: -4 } : {}}
                  className={`relative p-5 rounded-3xl border flex flex-col justify-between transition-all overflow-hidden ${
                    isUnlocked
                      ? darkMode
                        ? 'bg-slate-900 border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.5)] shadow-indigo-950/20'
                        : 'bg-white border-slate-100 shadow-md hover:shadow-lg shadow-slate-200/50'
                      : darkMode
                        ? 'bg-slate-950/40 border-slate-900 text-slate-600 opacity-65'
                        : 'bg-slate-100/50 border-slate-200 text-slate-400 opacity-70'
                  }`}
                >
                  {/* Decorative glowing top line for unlocked badges */}
                  {isUnlocked && (
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                      badge.badgeType === 'bronze' ? 'bg-amber-600' :
                      badge.badgeType === 'silver' ? 'bg-slate-400' :
                      badge.badgeType === 'gold' ? 'bg-yellow-450' : 'bg-cyan-400 animate-pulse'
                    }`} />
                  )}

                  <div className="flex gap-4">
                    {/* Badge Glyph Icon with glowing circular ring */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border shrink-0 select-none ${
                      isUnlocked
                        ? badge.badgeType === 'bronze' ? 'bg-amber-100/15 border-amber-900/10' :
                          badge.badgeType === 'silver' ? 'bg-slate-100/10 border-slate-200/30' :
                          badge.badgeType === 'gold' ? 'bg-yellow-500/10 border-yellow-400/20' :
                          'bg-cyan-500/15 border-cyan-400/20 shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                        : darkMode ? 'bg-slate-900 border-slate-800 grayscale' : 'bg-slate-200 border-slate-300 grayscale'
                    }`}>
                      <span>{isUnlocked ? badge.icon : '🔒'}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className={`block font-extrabold text-sm ${
                        isUnlocked 
                          ? darkMode ? 'text-slate-100' : 'text-slate-800'
                          : darkMode ? 'text-slate-500' : 'text-slate-500'
                      }`}>{badge.title}</span>
                      <span className={`block text-[11px] font-semibold leading-relaxed mt-0.5 ${
                        darkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {badge.description}
                      </span>
                    </div>
                  </div>

                  {/* Badge Progress Track */}
                  <div className="mt-5 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400">
                      <span>Progression:</span>
                      <span>{currentProgressValue} / {badge.threshold}</span>
                    </div>
                    
                    <div className={`w-full h-2 rounded-full overflow-hidden ${
                      darkMode ? 'bg-slate-950' : 'bg-slate-200'
                    }`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          isUnlocked 
                            ? badge.badgeType === 'bronze' ? 'bg-amber-600' :
                              badge.badgeType === 'silver' ? 'bg-slate-400' :
                              badge.badgeType === 'gold' ? 'bg-yellow-400' : 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]'
                            : darkMode ? 'bg-slate-800' : 'bg-slate-300'
                        }`}
                        style={{ width: `${barPercentage}%` }}
                      />
                    </div>
                    
                    {isUnlocked && (
                      <span className="block text-[10px] font-bold text-emerald-400 text-right uppercase tracking-wider">
                        Unlocked ✅
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

      </div>

      {/* Floating Interactive Hover Coordinate Tooltip overlay */}
      <AnimatePresence>
        {hoveredCell && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed pointer-events-none z-50 p-2.5 px-4 rounded-2xl border font-bold text-xs shadow-2xl backdrop-blur-md flex flex-col items-center text-center"
            style={{ 
              left: hoveredCell.x, 
              top: hoveredCell.y,
              transform: 'translateX(-50%)',
              backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: darkMode ? '#334155' : '#e2e8f0',
              color: darkMode ? '#f8fafc' : '#030712'
            }}
          >
            <span className="block text-[10px] text-slate-400 font-bold">{hoveredCell.date}</span>
            <span className="block mt-1.5 text-cyan-450 dark:text-cyan-400 font-black text-sm">{hoveredCell.rate}% Completion</span>
            <span className="block text-[10px] text-slate-400 font-bold mt-0.5">({hoveredCell.count} {hoveredCell.count === 1 ? 'task' : 'tasks'} checked)</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
