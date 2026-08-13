const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldAddTask = `  const addTaskInSettings = () => {
    if (tasks.length >= 10) return;
    setTasks([...tasks, { name: \`New Habit \${tasks.length + 1}\`, type: "evergreen", startDate: formatDate(new Date()) }]);
  };

  const handleAddGeneratedTasks = (newTasks: HabitTask[]) => {
    if (tasks.length >= 10) return;
    const tasksToAdd = newTasks.slice(0, 10 - tasks.length).map(t => ({ ...t, startDate: t.startDate || formatDate(new Date()) }));
    setTasks([...tasks, ...tasksToAdd]);
    setCurrentView('tracker');
    audioEngine.playSuccessChime();
  };`;

const newAddTask = `  const addTaskInSettings = () => {
    if (visibleTasksForSelectedDate.length >= 10) return;
    setTasks([...tasks, { name: \`New Habit \${tasks.length + 1}\`, type: "evergreen", startDate: selectedDate }]);
  };

  const handleAddGeneratedTasks = (newTasks: HabitTask[]) => {
    if (visibleTasksForSelectedDate.length >= 10) return;
    const tasksToAdd = newTasks.slice(0, 10 - visibleTasksForSelectedDate.length).map(t => ({ ...t, startDate: t.startDate || selectedDate }));
    setTasks([...tasks, ...tasksToAdd]);
    setCurrentView('tracker');
    audioEngine.playSuccessChime();
  };`;

code = code.replace(oldAddTask, newAddTask);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched add tasks checks");
