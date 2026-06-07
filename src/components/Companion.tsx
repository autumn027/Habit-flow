import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { Sparkles, Heart } from 'lucide-react';

// --- Custom useMousePosition Hook with Lerping & requestAnimationFrame ---
function useMousePosition() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);

    const updatePosition = () => {
      const lerpFactor = 0.085; // smooth transition factor to prevent jitter
      const dx = targetRef.current.x - currentRef.current.x;
      const dy = targetRef.current.y - currentRef.current.y;

      // Only update local state if meaningful delta exists to prevent unnecessary re-renders
      if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
        currentRef.current.x += dx * lerpFactor;
        currentRef.current.y += dy * lerpFactor;
        setMousePosition({ x: currentRef.current.x, y: currentRef.current.y });
      }

      rafId.current = requestAnimationFrame(updatePosition);
    };

    rafId.current = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return mousePosition;
}

interface CompanionProps {
  tasksCompleted: number;
  totalTasks: number;
  theme: 'light' | 'dark';
  companionType?: 'auto' | 'white_cat' | 'black_witch_cat' | 'wise_owl';
  companionAction?: { type: 'check' | 'uncheck' | 'complete_all'; timestamp: number } | null;
}

const SLEEP_INACTIVITY_THRESHOLD_MS = 15000; // Configurable inactivity timer in milliseconds (15 seconds)

export default function Companion({ tasksCompleted, totalTasks, theme, companionType = 'auto', companionAction }: CompanionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const twitchControls = useAnimation();
  const mousePosition = useMousePosition();
  
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isDancing, setIsDancing] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [temporaryPhrase, setTemporaryPhrase] = useState<string | null>(null);
  
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tempPhraseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wakeIndexRef = useRef(0);

  // Math safety: handle division by zero
  const completionPercentage = useMemo(() => {
    if (totalTasks <= 0) return 0;
    return Math.round((tasksCompleted / totalTasks) * 100);
  }, [tasksCompleted, totalTasks]);

  // Determine active companion resolved from theme and companionType setting
  const resolvedCompanion = useMemo(() => {
    if (companionType && companionType !== 'auto') {
      return companionType;
    }
    return theme === 'dark' ? 'wise_owl' : 'white_cat';
  }, [companionType, theme]);

  // Speech bubble text - customized adaptively for different companions
  const bubblePhrase = useMemo(() => {
    if (temporaryPhrase) {
      return temporaryPhrase;
    }

    if (isSleeping) {
      if (resolvedCompanion === 'white_cat') return "mrr... zzz... 😴🐾";
      if (resolvedCompanion === 'black_witch_cat') return "nyan... zzz... 🔮😴";
      return "h-hoo... zzz... 😴🦉";
    }
    
    if (completionPercentage === 0) {
      if (resolvedCompanion === 'white_cat') return "meow! let's do this! 🐾";
      if (resolvedCompanion === 'black_witch_cat') return "mew! ready to cast some habit-magic? 🔮";
      return "hoo! ready for tracking! 🦉";
    } else if (completionPercentage < 40) {
      if (resolvedCompanion === 'white_cat') return "purr! a great start! 🐱";
      if (resolvedCompanion === 'black_witch_cat') return "a magical beginning! ✨🐱";
      return "wise start! keep it up! ✨";
    } else if (completionPercentage < 70) {
      if (resolvedCompanion === 'white_cat') return "wow, half done! gorgeous! 💕";
      if (resolvedCompanion === 'black_witch_cat') return "the potion is brewing perfectly! 🧪💜";
      return "shining progress there! 🌙";
    } else if (completionPercentage < 100) {
      if (resolvedCompanion === 'white_cat') return "almost perfectly done! 🌟";
      if (resolvedCompanion === 'black_witch_cat') return "so close to a spellbinding finish! 🌟🧙‍♀️";
      return "nearly master level! 🔮";
    } else {
      if (resolvedCompanion === 'white_cat') return "MEOW-VELOUS! 100% complete! 🏆🎉";
      if (resolvedCompanion === 'black_witch_cat') return "SPECTACULAR MAGIC! 100% cast! 👑🔮🐱";
      return "ABSOLUTE WISDOM! you did it! 👑🦉";
    }
  }, [temporaryPhrase, completionPercentage, resolvedCompanion, isSleeping]);

  // Handle inactivity sleeping timer & wake ups on cursor movement
  useEffect(() => {
    const handleInactivityAndWake = () => {
      // Reset sleeping logic and trigger wake-up animation if returning from sleep
      if (isSleeping) {
        setIsSleeping(false);
        setIsWakingUp(true);

        // Clear any running temp phrase timers
        if (tempPhraseTimeoutRef.current) {
          clearTimeout(tempPhraseTimeoutRef.current);
        }

        // Trigger alternating cute awake dialogue sequentially
        const wakePhrases = [
          "you are back cutie 💕",
          "Back for more magic? I knew you’d return 😅"
        ];
        const chosen = wakePhrases[wakeIndexRef.current % wakePhrases.length];
        wakeIndexRef.current += 1;
        setTemporaryPhrase(chosen);

        // Set fallback timeout to clear temporary awake phrase
        tempPhraseTimeoutRef.current = setTimeout(() => {
          setTemporaryPhrase(null);
        }, 5000);

        if (resolvedCompanion === 'white_cat' || resolvedCompanion === 'black_witch_cat') {
          // Feline Wake-up stretch (scaleX/scaleY springs and elastic hop)
          controls.start({
            scaleX: [1, 1.15, 0.94, 1.05, 1],
            scaleY: [1, 0.82, 1.12, 0.96, 1],
            y: [0, 4, -10, 2, 0],
            transition: { duration: 0.7, ease: "easeOut" }
          }).then(() => {
            setIsWakingUp(false);
          });
        } else {
          // White Owl Wake-up flutter (shakes head, ruffles wings with scale pop)
          controls.start({
            rotate: [0, -14, 12, -8, 6, 0],
            scale: [1, 1.1, 0.95, 1.03, 1],
            transition: { duration: 0.75, ease: "easeOut" }
          }).then(() => {
            setIsWakingUp(false);
          });
        }
      }

      // Cleanup trailing sleep timeout
      if (sleepTimerRef.current) {
        clearTimeout(sleepTimerRef.current);
      }

      // Only re-arm sleep timer if not currently at 100% or dancing (dance has complete state override priority)
      if (completionPercentage < 100 && !isDancing) {
        sleepTimerRef.current = setTimeout(() => {
          setIsSleeping(true);
        }, SLEEP_INACTIVITY_THRESHOLD_MS);
      }
    };

    // Arm sleep timer on mount/reset
    if (completionPercentage < 100 && !isDancing) {
      sleepTimerRef.current = setTimeout(() => {
        setIsSleeping(true);
      }, SLEEP_INACTIVITY_THRESHOLD_MS);
    }

    window.addEventListener('mousemove', handleInactivityAndWake);
    return () => {
      window.removeEventListener('mousemove', handleInactivityAndWake);
      if (sleepTimerRef.current) {
        clearTimeout(sleepTimerRef.current);
      }
    };
  }, [isSleeping, isDancing, completionPercentage, resolvedCompanion, controls]);

  // Cancel sleep instantly if user reaches 100% target or starts dancing
  useEffect(() => {
    if (completionPercentage === 100) {
      setIsSleeping(false);
      if (sleepTimerRef.current) {
        clearTimeout(sleepTimerRef.current);
      }
    }
  }, [completionPercentage]);

  // Trigger custom dynamic dialogue reactions on checking or unchecking tasks
  useEffect(() => {
    if (!companionAction) return;

    // Wake up instantly!
    setIsSleeping(false);

    // Cancel any active reset timeout
    if (tempPhraseTimeoutRef.current) {
      clearTimeout(tempPhraseTimeoutRef.current);
    }

    if (companionAction.type === 'complete_all') {
      const allCompletedPHRASES = {
        white_cat: [
          "MEOW-VELOUS! 100% complete! 🏆🎉",
          "purrrrfect day! we did everything! 💖🥇",
          "you did it! let's take a cozy nap now! 💤🐱",
          "amazing consistency! you are a superstar! 🌟🐾"
        ],
        black_witch_cat: [
          "SPECTACULAR MAGIC! 100% cast! 👑🔮🐱",
          "all rituals complete! the universe is aligned! 🌌🔮",
          "unbelievable wizardry! you completed it all! 🐈‍⬛🖤",
          "the potion is fully brewed! pure magic! ✨🧪"
        ],
        wise_owl: [
          "ABSOLUTE WISDOM! you did it! 👑🦉",
          "a masterful daily record! perfect score! 🏆🎓",
          "hoo-ray! you completed every task tonight! 🌌⭐",
          "wisdom is achieved through consistency! 📖👑"
        ]
      };
      const activePhrases = allCompletedPHRASES[resolvedCompanion] || allCompletedPHRASES.white_cat;
      const chosen = activePhrases[Math.floor(Math.random() * activePhrases.length)];
      setTemporaryPhrase(chosen);

      // Play major celebration jump animation
      controls.start({
        y: [0, -28, 0, -12, 0],
        scaleY: [1, 1.25, 0.88, 1.06, 1],
        scaleX: [1, 0.82, 1.12, 0.95, 1],
        transition: { duration: 0.85, ease: "easeOut" }
      });
    } else if (companionAction.type === 'check') {
      const checkPHRASES = {
        white_cat: [
          "purr! another habit down! 🐱🐾",
          "meow! you are doing great! keep going! 💕",
          "clawsome job! that was smooth! ✨",
          "so proud of you, human! 🌸"
        ],
        black_witch_cat: [
          "the spell is working! great job! 🔮⚡",
          "mew! beautiful magic cast there! ✨🍷",
          "another ingredient added to the potion! 🧪💜",
          "such strong focus power! 🧙‍♀️⭐"
        ],
        wise_owl: [
          "hoo! a wise choice indeed! 🦉✨",
          "excellent execution! stay mindful! 🌙📖",
          "progress is the path to wisdom! 💫🦉",
          "one step closer to your goal! 🌲📋"
        ]
      };
      const activePhrases = checkPHRASES[resolvedCompanion] || checkPHRASES.white_cat;
      const chosen = activePhrases[Math.floor(Math.random() * activePhrases.length)];
      setTemporaryPhrase(chosen);

      // Play cute happy hop animation
      controls.start({
        y: [0, -16, 0],
        scaleY: [1, 1.18, 0.94, 1],
        transition: { duration: 0.45, ease: "easeOut" }
      });
    } else if (companionAction.type === 'uncheck') {
      const uncheckPHRASES = [
        "mistakes happen",
        "you can do it, I know."
      ];
      const chosen = uncheckPHRASES[Math.floor(Math.random() * uncheckPHRASES.length)];
      setTemporaryPhrase(chosen);

      // Play cute sad/sheepish wiggle animation
      controls.start({
        x: [0, -7, 7, -5, 5, 0],
        rotate: [0, -5, 5, -3, 3, 0],
        transition: { duration: 0.55, ease: "easeInOut" }
      });
    }

    // Set fallback timeout to revert dynamic bubble text to default values
    tempPhraseTimeoutRef.current = setTimeout(() => {
      setTemporaryPhrase(null);
    }, 5000);

  }, [companionAction, resolvedCompanion, controls]);

  // Cleanup dynamic phrases on unmount
  useEffect(() => {
    return () => {
      if (tempPhraseTimeoutRef.current) {
        clearTimeout(tempPhraseTimeoutRef.current);
      }
    };
  }, []);

  // Randomized blinking interval (3s to 7s) - lasts 110ms
  useEffect(() => {
    let timerId: NodeJS.Timeout;

    const runBlink = () => {
      if (!isSleeping) {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
        }, 110);
      }
      
      const nextDelay = Math.random() * (7000 - 3000) + 3000;
      timerId = setTimeout(runBlink, nextDelay);
    };

    timerId = setTimeout(runBlink, 4000);
    return () => clearTimeout(timerId);
  }, [isSleeping]);

  // Randomized twitch loops (5s to 10s) - triggers subtle ear/head flinches
  useEffect(() => {
    let timerId: NodeJS.Timeout;

    const runTwitch = () => {
      if (!isSleeping && !isDancing) {
        if (resolvedCompanion === 'white_cat' || resolvedCompanion === 'black_witch_cat') {
          // Twitch cat head
          twitchControls.start({
            rotate: [0, -10, 8, 0],
            transition: { duration: 0.38, ease: "easeInOut" }
          });
        } else {
          // Tilt owl head
          twitchControls.start({
            rotate: [0, 12, -8, 0],
            transition: { duration: 0.42, ease: "easeInOut" }
          });
        }
      }

      const nextDelay = Math.random() * (10000 - 5000) + 5000;
      timerId = setTimeout(runTwitch, nextDelay);
    };

    timerId = setTimeout(runTwitch, 5500);
    return () => clearTimeout(timerId);
  }, [isSleeping, isDancing, resolvedCompanion, twitchControls]);

  // eyes tracking cursor calculation
  useEffect(() => {
    // If sleeping, lock eyes forward/closed instantly, disabling creep stares
    if (isSleeping) {
      setEyeOffset({ x: 0, y: 0 });
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Center of the head (roughly)
    const headX = rect.left + rect.width / 2;
    const headY = rect.top + 35; 
    
    const dx = mousePosition.x - headX;
    const dy = mousePosition.y - headY;
    const angle = Math.atan2(dy, dx);
    const distance = Math.hypot(dx, dy);
    
    // Limit pupil deflection within orbits (max 3.8px)
    const maxDisplacement = 3.8;
    const intensity = Math.min(maxDisplacement, distance / 32);
    
    setEyeOffset({
      x: Math.cos(angle) * intensity,
      y: Math.sin(angle) * intensity
    });
  }, [mousePosition, isSleeping]);

  // Dancing behavior on 100% completion
  useEffect(() => {
    if (completionPercentage === 100 && !isDancing) {
      setIsDancing(true);
      
      // Animate sequential joy leaps
      controls.start({
        rotate: [0, -12, 12, -6, 6, 0],
        y: [0, -22, 0, -10, 0],
        scale: [1, 1.18, 0.92, 1.06, 1],
        transition: {
          duration: 1.4,
          ease: "easeInOut"
        }
      }).then(() => {
        // Starry double spin dance
        controls.start({
          rotate: 360,
          transition: { duration: 0.9, ease: "circOut" }
        }).then(() => {
          setIsDancing(false);
        });
      });
    }
  }, [completionPercentage, controls]);

  return (
    <div 
      ref={containerRef}
      className="relative flex flex-col items-center justify-center select-none animate-fade-in"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Speech Bubble */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 12 }}
        animate={{ 
          opacity: (isHovered || completionPercentage === 100 || isSleeping || !!temporaryPhrase) ? 1 : 0, 
          scale: (isHovered || completionPercentage === 100 || isSleeping || !!temporaryPhrase) ? 1 : 0.8, 
          y: (isHovered || completionPercentage === 100 || isSleeping || !!temporaryPhrase) ? 0 : 8 
        }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={`absolute -top-16 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-2xl text-[10px] sm:text-xs font-bold shadow-md border text-center whitespace-nowrap z-30 ${
          (isHovered || completionPercentage === 100 || isSleeping || !!temporaryPhrase) ? 'pointer-events-auto' : 'pointer-events-none'
        } ${
          theme === 'dark' 
            ? 'bg-slate-900 border-indigo-950 text-indigo-400 font-semibold shadow-[0_4px_15px_rgba(99,102,241,0.2)]' 
            : 'bg-white border-slate-100 text-slate-700 shadow-lg'
        }`}
      >
        {bubblePhrase}
        <div className={`absolute bottom-[-5px] left-1/2 transform -translate-x-1/2 w-2.5 h-2.5 rotate-45 border-r border-b ${
          theme === 'dark' ? 'bg-slate-900 border-indigo-950' : 'bg-white border-slate-100'
        }`} />
      </motion.div>

      {/* Floating Zzz Snoring Indicators during Sleep */}
      {isSleeping && (
        <div className="absolute -top-6 right-0 pointer-events-none flex flex-col font-mono text-[10px] sm:text-xs font-bold select-none z-10">
          <motion.span
            animate={{ y: [-4, -20], x: [0, 4, 0], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 3.2, delay: 0 }}
            className={theme === 'dark' ? "text-indigo-400" : "text-amber-500"}
          >
            z
          </motion.span>
          <motion.span
            animate={{ y: [0, -16], x: [2, -2, 2], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 3.2, delay: 1 }}
            className={theme === 'dark' ? "text-indigo-400 text-[10px] ml-2" : "text-amber-500 text-[10px] ml-2"}
          >
            z
          </motion.span>
          <motion.span
            animate={{ y: [4, -12], x: [-1, 2, -1], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 3.2, delay: 2 }}
            className={theme === 'dark' ? "text-indigo-500 text-[8px] ml-4" : "text-amber-600 text-[8px] ml-4"}
          >
            z
          </motion.span>
        </div>
      )}

      {/* Main Floating Wrapper */}
      <motion.div
        animate={controls}
        whileHover={{ scale: 1.06, y: -4 }}
        className="w-20 h-20 relative cursor-pointer mt-4 flex items-center justify-center"
      >
        {/* Magic Particles when finished */}
        {completionPercentage === 100 && (
          <div className="absolute inset-x-0 inset-y-0 pointer-events-none scale-150 z-10">
            <Sparkles className="w-4 h-4 text-amber-400 absolute top-0 left-0 animate-pulse" />
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 absolute bottom-1 right-1 animate-ping" />
            <Heart className="w-3 h-3 text-red-400 absolute top-3 right-0 animate-bounce" />
          </div>
        )}

        {/* AnimatePresence for Cat/Owl Crossfade transition when companion selection triggers */}
        <AnimatePresence mode="wait">
          {resolvedCompanion === 'white_cat' ? (
            /* --- White Cat Asset (Light Theme Default) --- */
            <motion.div
              key="cat_asset"
              initial={{ opacity: 0, scale: 0.82, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.82, rotate: 8 }}
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              <svg 
                viewBox="0 0 100 100" 
                className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.12)]"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Cat Tail swish */}
                <motion.path 
                  d="M 68,76 C 75,76 84,70 82,56 C 81,48 76,46 76,52" 
                  fill="none" 
                  stroke="#FFFBF5" 
                  strokeWidth="6" 
                  strokeLinecap="round"
                  animate={{ 
                    rotate: isSleeping 
                      ? [0, 2, -2, 0] 
                      : isDancing 
                        ? [0, 30, -30, 0] 
                        : [0, 12, -8, 12, -4, 0] 
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: isSleeping ? 5.0 : isDancing ? 0.6 : 2.8, 
                    ease: "easeInOut" 
                  }}
                />

                {/* Cat Back Paws */}
                <circle cx="34" cy="85" r="7.5" fill="#E2E8F0" />
                <circle cx="66" cy="85" r="7.5" fill="#E2E8F0" />

                {/* Cat Main Body with continuous soft Idle Breathing */}
                <motion.ellipse 
                  cx="50" 
                  cy="72" 
                  rx="24" 
                  ry="17" 
                  fill="#F8FAFC" 
                  animate={isSleeping ? { scaleY: [1, 1.04, 1] } : { scaleY: [1, 1.02, 1] }}
                  style={{ originY: 0.95 }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: isSleeping ? 4.5 : 3.2, 
                    ease: "easeInOut" 
                  }}
                />
                <motion.ellipse 
                  cx="50" 
                  cy="72" 
                  rx="16" 
                  ry="11" 
                  fill="#FFFBF5" 
                  animate={isSleeping ? { scaleY: [1, 1.04, 1] } : { scaleY: [1, 1.02, 1] }}
                  style={{ originY: 0.95 }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: isSleeping ? 4.5 : 3.2, 
                    ease: "easeInOut" 
                  }}
                />

                {/* Nesting Master: Base breathing and twitch layers on head. */}
                <motion.g
                  animate={isSleeping ? { y: [0, 1.2, 0] } : { y: [0, 0.6, 0] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: isSleeping ? 4.5 : 3.2, 
                    ease: "easeInOut" 
                  }}
                >
                  <motion.g
                    animate={twitchControls}
                    style={{ transformOrigin: "50px 46px" }}
                  >
                    {/* Left & Right fluffy cat ears */}
                    <polygon points="20,44 26,18 42,34" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="0.5" />
                    <polygon points="24,40 28,24 38,34" fill="#FFC8DD" /> {/* Ear inside */}

                    <polygon points="80,44 74,18 58,34" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="0.5" />
                    <polygon points="76,40 72,24 62,34" fill="#FFC8DD" /> {/* Ear inside */}

                    {/* Cat Head Circle */}
                    <ellipse cx="50" cy="46" rx="22" ry="19" fill="#FFF" stroke="#F1F5F9" strokeWidth="0.5" />

                    {/* Cute rosy pink blush */}
                    <circle cx="33" cy="51" r="3.2" fill="#FFB5A7" opacity={isSleeping ? 0.25 : 0.45 + (completionPercentage / 180)} />
                    <circle cx="67" cy="51" r="3.2" fill="#FFB5A7" opacity={isSleeping ? 0.25 : 0.45 + (completionPercentage / 180)} />

                    {/* Eye Layer */}
                    {(isSleeping || isBlinking) ? (
                      <g>
                        <path d="M 33,44 Q 38,48 43,44" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M 57,44 Q 62,48 67,44" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
                      </g>
                    ) : (
                      <>
                        <circle cx="38" cy="44" r="4.5" fill="#FFFFFF" stroke="#64748B" strokeWidth="0.5" />
                        <circle cx="62" cy="44" r="4.5" fill="#FFFFFF" stroke="#64748B" strokeWidth="0.5" />

                        {/* Interactive Pupil Layer */}
                        <motion.g style={{ x: eyeOffset.x, y: eyeOffset.y }}>
                          <circle cx="38" cy="44" r="3" fill="#1E293B" />
                          <circle cx="36.8" cy="42.8" r="0.9" fill="#FFFFFF" />
                          <circle cx="62" cy="44" r="3" fill="#1E293B" />
                          <circle cx="60.8" cy="42.8" r="0.9" fill="#FFFFFF" />
                        </motion.g>
                      </>
                    )}

                    {/* Nose */}
                    <polygon points="48,51 52,51 50,53.2" fill="#FDA4AF" />

                    {/* Whiskers */}
                    <line x1="28" y1="52" x2="16" y2="50" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="28" y1="55" x2="17" y2="56" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="72" y1="52" x2="84" y2="50" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="72" y1="55" x2="83" y2="56" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />

                    {/* Cat Mouth */}
                    {completionPercentage === 100 ? (
                      <path d="M 46,54 C 47.5,58.5 52.5,58.5 54,54" fill="none" stroke="#64748B" strokeWidth="1.6" strokeLinecap="round" />
                    ) : completionPercentage >= 50 ? (
                      <path d="M 46,54 C 48,56.5 52,56.5 54,54" fill="none" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
                    ) : (
                      <path d="M 46,54 C 48,55.2 50,54.5 50,54 C 50,54.5 52,55.2 54,54" fill="none" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
                    )}
                  </motion.g>
                </motion.g>

                {/* Forepaws */}
                <ellipse cx="44" cy="80" rx="3.5" ry="4" fill="#FFFBF5" stroke="#E2E8F0" strokeWidth="0.5" />
                <ellipse cx="56" cy="80" rx="3.5" ry="4" fill="#FFFBF5" stroke="#E2E8F0" strokeWidth="0.5" />
              </svg>
            </motion.div>
          ) : resolvedCompanion === 'black_witch_cat' ? (
            /* --- Black Witch Cat Asset (Sleek Black, Piercing Gold Eyes, Purple Velvet Hat, Ornate Gold Embroidery) --- */
            <motion.div
              key="witch_cat_asset"
              initial={{ opacity: 0, scale: 0.82, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.82, rotate: 8 }}
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              <svg 
                viewBox="0 0 100 100" 
                className="w-full h-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.35)]"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Tail swish (sleek space-black) */}
                <motion.path 
                  d="M 68,76 C 75,76 84,70 82,56 C 81,48 76,46 76,52" 
                  fill="none" 
                  stroke="#121214" 
                  strokeWidth="6" 
                  strokeLinecap="round"
                  animate={{ 
                    rotate: isSleeping 
                      ? [0, 2, -2, 0] 
                      : isDancing 
                        ? [0, 30, -30, 0] 
                        : [0, 12, -8, 12, -4, 0] 
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: isSleeping ? 5.0 : isDancing ? 0.6 : 2.8, 
                    ease: "easeInOut" 
                  }}
                />

                {/* Back Paws */}
                <circle cx="34" cy="85" r="7.5" fill="#1C1917" />
                <circle cx="66" cy="85" r="7.5" fill="#1C1917" />

                {/* Main Body */}
                <motion.ellipse 
                  cx="50" 
                  cy="72" 
                  rx="24" 
                  ry="17" 
                  fill="#121214" 
                  animate={isSleeping ? { scaleY: [1, 1.04, 1] } : { scaleY: [1, 1.02, 1] }}
                  style={{ originY: 0.95 }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: isSleeping ? 4.5 : 3.2, 
                    ease: "easeInOut" 
                  }}
                />
                <motion.ellipse 
                  cx="50" 
                  cy="72" 
                  rx="16" 
                  ry="11" 
                  fill="#1C1917" 
                  animate={isSleeping ? { scaleY: [1, 1.04, 1] } : { scaleY: [1, 1.02, 1] }}
                  style={{ originY: 0.95 }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: isSleeping ? 4.5 : 3.2, 
                    ease: "easeInOut" 
                  }}
                />

                {/* Head, twitch layers */}
                <motion.g
                  animate={isSleeping ? { y: [0, 1.2, 0] } : { y: [0, 0.6, 0] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: isSleeping ? 4.5 : 3.2, 
                    ease: "easeInOut" 
                  }}
                >
                  <motion.g
                    animate={twitchControls}
                    style={{ transformOrigin: "50px 46px" }}
                  >
                    {/* pointy black cat ears */}
                    <polygon points="20,44 26,18 42,34" fill="#121214" stroke="#1A1A1E" strokeWidth="0.5" />
                    <polygon points="24,40 28,24 38,34" fill="#3B0764" /> {/* Deep velvet purple inside */}

                    <polygon points="80,44 74,18 58,34" fill="#121214" stroke="#1A1A1E" strokeWidth="0.5" />
                    <polygon points="76,40 72,24 62,34" fill="#3B0764" /> {/* Deep velvet purple inside */}

                    {/* Head Round Circle */}
                    <ellipse cx="50" cy="46" rx="22" ry="19" fill="#121214" stroke="#1A1A1E" strokeWidth="0.5" />

                    {/* Magical glowing magenta purple blush */}
                    <circle cx="33" cy="51" r="3.2" fill="#D946EF" opacity={isSleeping ? 0.25 : 0.45 + (completionPercentage / 180)} />
                    <circle cx="67" cy="51" r="3.2" fill="#D946EF" opacity={isSleeping ? 0.25 : 0.45 + (completionPercentage / 180)} />

                    {/* Eye Layer - Vibrant Gold Eyes */}
                    {(isSleeping || isBlinking) ? (
                      <g>
                        <path d="M 33,44 Q 38,48 43,44" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M 57,44 Q 62,48 67,44" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                      </g>
                    ) : (
                      <>
                        {/* Piercing gold scleras with amber borders */}
                        <circle cx="38" cy="44" r="5" fill="#FCD34D" stroke="#D97706" strokeWidth="1" />
                        <circle cx="62" cy="44" r="5" fill="#FCD34D" stroke="#D97706" strokeWidth="1" />

                        {/* Interactive tracked black pupils */}
                        <motion.g style={{ x: eyeOffset.x, y: eyeOffset.y }}>
                          <circle cx="38" cy="44" r="3" fill="#09090B" />
                          <circle cx="36.8" cy="42.8" r="0.9" fill="#FFFFFF" />
                          <circle cx="62" cy="44" r="3" fill="#09090B" />
                          <circle cx="60.8" cy="42.8" r="0.9" fill="#FFFFFF" />
                        </motion.g>
                      </>
                    )}

                    {/* Nose */}
                    <polygon points="48,51 52,51 50,53.2" fill="#EC4899" />

                    {/* High-visibility silver whiskers */}
                    <line x1="28" y1="52" x2="16" y2="50" stroke="#71717A" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="28" y1="55" x2="17" y2="56" stroke="#71717A" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="72" y1="52" x2="84" y2="50" stroke="#71717A" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="72" y1="55" x2="83" y2="56" stroke="#71717A" strokeWidth="1.2" strokeLinecap="round" />

                    {/* silver cat mouth */}
                    {completionPercentage === 100 ? (
                      <path d="M 46,54 C 47.5,58.5 52.5,58.5 54,54" fill="none" stroke="#E4E4E7" strokeWidth="1.6" strokeLinecap="round" />
                    ) : completionPercentage >= 50 ? (
                      <path d="M 46,54 C 48,56.5 52,56.5 54,54" fill="none" stroke="#E4E4E7" strokeWidth="1.5" strokeLinecap="round" />
                    ) : (
                      <path d="M 46,54 C 48,55.2 50,54.5 50,54 C 50,54.5 52,55.2 54,54" fill="none" stroke="#E4E4E7" strokeWidth="1.5" strokeLinecap="round" />
                    )}

                    {/* Ornate Stylized Velvet Witch Hat with Gold Details */}
                    <g id="witch-hat" className="origin-[50px_27px]">
                      {/* Purple velvet crooked cone top */}
                      <path 
                        d="M 33,26 C 34,10 40,-3 55,-6 C 51,7 48,16 67,26 Z" 
                        fill="#3B0764" 
                        stroke="#F59E0B"
                        strokeWidth="0.5"
                        strokeLinejoin="round"
                      />
                      {/* Star Embroidery Details */}
                      <polygon points="41,8 43,10 41.5,9.5 43.5,9.5 42,10" fill="#FCD34D" />
                      <polygon points="48,3 49.5,5 48.5,4.5 50,4.5 48.5,5" fill="#FCD34D" />

                      {/* Golden ribbon base band */}
                      <path 
                        d="M 34,26 Q 50,28.5 66,26 L 65,22 Q 50,24.5 35,22 Z" 
                        fill="#FBBF24" 
                        stroke="#D97706" 
                        strokeWidth="0.7" 
                      />

                      {/* Embroidered gold square buckle */}
                      <rect x="47" y="21.2" width="6" height="5" rx="1.5" fill="none" stroke="#FFF" strokeWidth="1.2" />
                      <rect x="48" y="22.2" width="4" height="3" rx="0.8" fill="none" stroke="#D97706" strokeWidth="1" />

                      {/* Velvet Deep Purple curved wide brim */}
                      <ellipse 
                        cx="50" 
                        cy="27" 
                        rx="24" 
                        ry="4.5" 
                        fill="#4C1D95" 
                        stroke="#F59E0B" 
                        strokeWidth="1.2" 
                      />
                    </g>
                  </motion.g>
                </motion.g>

                {/* Forepaws */}
                <ellipse cx="44" cy="80" rx="3.5" ry="4" fill="#121214" stroke="#1A1A1E" strokeWidth="0.5" />
                <ellipse cx="56" cy="80" rx="3.5" ry="4" fill="#121214" stroke="#1A1A1E" strokeWidth="0.5" />
              </svg>
            </motion.div>
          ) : (
            /* --- White Owl Asset (Dark Theme / Night Mode Default) --- */
            <motion.div
              key="owl_asset"
              initial={{ opacity: 0, scale: 0.82, rotate: 8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.82, rotate: -8 }}
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              <svg 
                viewBox="0 0 100 100" 
                className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Feathery Ear Tufts */}
                <motion.polygon 
                  points="22,30 16,12 36,24" 
                  fill="#E2E8F0" 
                  animate={isSleeping ? { rotate: [0, 2, -2, 0], y: [0, 1.4, 0] } : { rotate: isDancing ? [0, -15, 15, 0] : [0, 3, -3, 0] }}
                  transition={{ repeat: Infinity, duration: isSleeping ? 4.5 : 3.5, ease: "easeInOut" }}
                />
                <motion.polygon 
                  points="78,30 84,12 64,24" 
                  fill="#E2E8F0" 
                  animate={isSleeping ? { rotate: [0, -2, 2, 0], y: [0, 1.4, 0] } : { rotate: isDancing ? [0, 15, -15, 0] : [0, -3, 3, 0] }}
                  transition={{ repeat: Infinity, duration: isSleeping ? 4.5 : 3.5, ease: "easeInOut" }}
                />

                {/* Owl Body */}
                <motion.ellipse 
                  cx="50" 
                  cy="68" 
                  rx="25" 
                  ry="20" 
                  fill="#F1F5F9" 
                  animate={isSleeping ? { scaleY: [1, 1.03, 1] } : { scaleY: [1, 1.018, 1] }}
                  style={{ originY: 0.95 }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: isSleeping ? 4.5 : 3.2, 
                    ease: "easeInOut" 
                  }}
                />
                {/* Belly Feathers Pattern */}
                <motion.ellipse 
                  cx="50" 
                  cy="70" 
                  rx="17" 
                  ry="13" 
                  fill="#E2E8F0" 
                  animate={isSleeping ? { scaleY: [1, 1.03, 1] } : { scaleY: [1, 1.018, 1] }}
                  style={{ originY: 0.95 }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: isSleeping ? 4.5 : 3.2, 
                    ease: "easeInOut" 
                  }}
                />
                <path d="M 44,68 Q 47,72 50,68 Q 53,72 56,68" fill="none" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M 42,74 Q 46,78 50,74 Q 54,78 58,74" fill="none" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />

                {/* Left Wing */}
                <motion.path 
                  d="M 25,58 C 16,66 18,80 26,82 C 26,74 26,62 25,58 Z" 
                  fill="#CBD5E1" 
                  animate={
                    isSleeping 
                      ? { rotate: [0, 0.5, -0.5, 0] } 
                      : isDancing 
                        ? { rotate: [0, -25, 10, -25, 0] } 
                        : { rotate: [0, -6, 2, -6, 0] }
                  }
                  transition={{ 
                    repeat: Infinity, 
                    duration: isSleeping ? 5.0 : isDancing ? 0.6 : 3.0, 
                    ease: "easeInOut" 
                  }}
                />

                {/* Right Wing */}
                <motion.path 
                  d="M 75,58 C 84,66 82,80 74,82 C 74,74 74,62 75,58 Z" 
                  fill="#CBD5E1" 
                  animate={
                    isSleeping 
                      ? { rotate: [0, -0.5, 0.5, 0] } 
                      : isDancing 
                        ? { rotate: [0, 25, -10, 25, 0] } 
                        : { rotate: [0, 6, -2, 6, 0] }
                  }
                  transition={{ 
                    repeat: Infinity, 
                    duration: isSleeping ? 5.0 : isDancing ? 0.6 : 3.0, 
                    ease: "easeInOut" 
                  }}
                />

                {/* Nesting Owl Head */}
                <motion.g
                  animate={isSleeping ? { y: [0, 1.4, 0] } : { y: [0, 0.7, 0] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: isSleeping ? 4.5 : 3.2, 
                    ease: "easeInOut" 
                  }}
                >
                  <motion.g
                    animate={twitchControls}
                    style={{ transformOrigin: "50px 43px" }}
                  >
                    {/* Owl Round Head Base */}
                    <circle cx="50" cy="43" r="21" fill="#FFFFFF" />

                    {/* blush cheeks */}
                    <circle cx="31" cy="48" r="3.5" fill="#818CF8" opacity={isSleeping ? 0.2 : 0.35 + (completionPercentage / 200)} />
                    <circle cx="69" cy="48" r="3.5" fill="#818CF8" opacity={isSleeping ? 0.2 : 0.35 + (completionPercentage / 200)} />

                    {/* Eye Layer */}
                    {(isSleeping || isBlinking) ? (
                      <g>
                        <path d="M 29,40 Q 34,44 39,40" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M 61,40 Q 66,44 71,40" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
                      </g>
                    ) : (
                      <>
                        <circle cx="34" cy="40" r="5.5" fill="#FEF08A" stroke="#475569" strokeWidth="0.5" />
                        <circle cx="66" cy="40" r="5.5" fill="#FEF08A" stroke="#475569" strokeWidth="0.5" />

                        {/* Interactive Pupil Layer */}
                        <motion.g style={{ x: eyeOffset.x, y: eyeOffset.y }}>
                          <circle cx="34" cy="40" r="3.5" fill="#0F172A" />
                          <circle cx="32.5" cy="38.5" r="1.1" fill="#FFFFFF" />
                          <circle cx="66" cy="40" r="3.5" fill="#0F172A" />
                          <circle cx="64.5" cy="38.5" r="1.1" fill="#FFFFFF" />
                        </motion.g>
                      </>
                    )}

                    {/* Golden beak */}
                    {completionPercentage === 100 ? (
                      <polygon points="46,46 54,46 50,54" fill="#F59E0B" />
                    ) : (
                      <polygon points="47,46 53,46 50,51" fill="#F59E0B" />
                    )}
                  </motion.g>
                </motion.g>

                {/* Feet paws */}
                <circle cx="42" cy="85" r="3" fill="#F59E0B" />
                <circle cx="45" cy="86" r="3" fill="#F59E0B" />
                <circle cx="55" cy="86" r="3" fill="#F59E0B" />
                <circle cx="58" cy="85" r="3" fill="#F59E0B" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
