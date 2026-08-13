const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldRemove = `  const removeTaskInSettings = (indexToRemove: number) => {
    if (visibleTasksForSelectedDate.length <= 1) return; // Must keep at least one habit active
    
    const hasHistoryBeforeSelectedDate = Object.keys(history).some(dateStr => dateStr < selectedDate && history[dateStr]?.includes(indexToRemove));

    if (hasHistoryBeforeSelectedDate) {
      const prevDate = new Date(selectedDate);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateStr = formatDate(prevDate);
      
      const newTasks = [...tasks];
      newTasks[indexToRemove] = { ...newTasks[indexToRemove], endDate: prevDateStr };
      setTasks(newTasks);
      
      const updatedHistory = { ...history };
      Object.keys(updatedHistory).forEach(dateStr => {
        if (dateStr >= selectedDate && updatedHistory[dateStr]?.includes(indexToRemove)) {
           updatedHistory[dateStr] = updatedHistory[dateStr].filter(idx => idx !== indexToRemove);
        }
      });
      setHistory(updatedHistory);
      
    } else {
      const newTasks = tasks.filter((_, idx) => idx !== indexToRemove);
      setTasks(newTasks);

      const updatedHistory: HabitHistory = {};
      Object.keys(history).forEach((dateStr) => {
        const dayHistory = history[dateStr] || [];
        const newDayHistory = dayHistory
          .filter((idx) => idx !== indexToRemove)
          .map((idx) => (idx > indexToRemove ? idx - 1 : idx));
        updatedHistory[dateStr] = newDayHistory;
      });
      setHistory(updatedHistory);
    }
  };`;

const newRemove = `  const removeTaskInSettings = (indexToRemove: number) => {
    if (visibleTasksForSelectedDate.length <= 1) return; // Must keep at least one habit active
    
    const currentTask = tasks[indexToRemove];
    const firstHistoryDate = Object.keys(history).sort().find(d => history[d]?.includes(indexToRemove));
    const effectiveStart = currentTask.startDate || firstHistoryDate || '0000-00-00';
    
    // If it started before the selected date, we soft delete it so it remains visible in the past
    if (effectiveStart < selectedDate) {
      const prevDate = new Date(selectedDate);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateStr = formatDate(prevDate);
      
      const newTasks = [...tasks];
      newTasks[indexToRemove] = { ...newTasks[indexToRemove], endDate: prevDateStr };
      setTasks(newTasks);
      
      const updatedHistory = { ...history };
      Object.keys(updatedHistory).forEach(dateStr => {
        if (dateStr >= selectedDate && updatedHistory[dateStr]?.includes(indexToRemove)) {
           updatedHistory[dateStr] = updatedHistory[dateStr].filter(idx => idx !== indexToRemove);
        }
      });
      setHistory(updatedHistory);
      
    } else {
      // Hard delete if it was created on or after the selected date
      const newTasks = tasks.filter((_, idx) => idx !== indexToRemove);
      setTasks(newTasks);

      const updatedHistory: HabitHistory = {};
      Object.keys(history).forEach((dateStr) => {
        const dayHistory = history[dateStr] || [];
        const newDayHistory = dayHistory
          .filter((idx) => idx !== indexToRemove)
          .map((idx) => (idx > indexToRemove ? idx - 1 : idx));
        updatedHistory[dateStr] = newDayHistory;
      });
      setHistory(updatedHistory);
    }
  };`;

code = code.replace(oldRemove, newRemove);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched removeTaskInSettings");
