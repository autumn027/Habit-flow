const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = "if (Array.isArray(savedTasks) && savedTasks.length >= 1 && savedTasks.length <= 10) {";
const replacement = "if (Array.isArray(savedTasks) && savedTasks.length >= 1) {";

code = code.replace(target, replacement);

// Also let's fix the race condition in useEffect 2 by checking if we have mounted
const targetEffect = `  useEffect(() => {
    localStorage.setItem('habit-tracker-data', JSON.stringify({ 
      tasks, 
      history, 
      hasStarted, 
      darkMode, 
      companionType,
      lightCompanion,
      darkCompanion,
      syncCompanions,
      soundMuted,
      unlockedMilestones,
      currentView,
      monthlyGoal
    }));
  }, [tasks, history, hasStarted, darkMode, companionType, lightCompanion, darkCompanion, syncCompanions, soundMuted, unlockedMilestones, currentView, monthlyGoal]);`;

const replacementEffect = `  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // On first render, wait for the read effect to finish setting state before we start overwriting
      return;
    }
    localStorage.setItem('habit-tracker-data', JSON.stringify({ 
      tasks, 
      history, 
      hasStarted, 
      darkMode, 
      companionType,
      lightCompanion,
      darkCompanion,
      syncCompanions,
      soundMuted,
      unlockedMilestones,
      currentView,
      monthlyGoal
    }));
  }, [tasks, history, hasStarted, darkMode, companionType, lightCompanion, darkCompanion, syncCompanions, soundMuted, unlockedMilestones, currentView, monthlyGoal]);`;

code = code.replace(targetEffect, replacementEffect);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched localstorage!");
