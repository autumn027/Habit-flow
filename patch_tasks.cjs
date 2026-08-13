const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Update moveTask
const oldMoveTask = `  const moveTask = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === tasks.length - 1) return;
    
    const partnerIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...tasks];
    const temp = reordered[index];
    reordered[index] = reordered[partnerIndex];
    reordered[partnerIndex] = temp;
    setTasks(reordered);

    // Map history indices so completions correspond correctly to swapped habits
    const updatedHistory: HabitHistory = {};
    Object.keys(history).forEach((dateStr) => {
      const dayHistory = history[dateStr] || [];
      const newDayHistory = dayHistory.map((idx) => {
        if (idx === index) return partnerIndex;
        if (idx === partnerIndex) return index;
        return idx;
      });
      updatedHistory[dateStr] = newDayHistory;
    });
    setHistory(updatedHistory);
    audioEngine.playCheckPop();
  };`;

const newMoveTask = `  const moveTask = (visibleIndex: number, direction: 'up' | 'down') => {
    if (direction === 'up' && visibleIndex === 0) return;
    if (direction === 'down' && visibleIndex === visibleTasksForSelectedDate.length - 1) return;
    
    const partnerVisibleIndex = direction === 'up' ? visibleIndex - 1 : visibleIndex + 1;
    const originalIndex1 = visibleTasksForSelectedDate[visibleIndex].originalIndex;
    const originalIndex2 = visibleTasksForSelectedDate[partnerVisibleIndex].originalIndex;

    const reordered = [...tasks];
    const temp = reordered[originalIndex1];
    reordered[originalIndex1] = reordered[originalIndex2];
    reordered[originalIndex2] = temp;
    setTasks(reordered);

    // Map history indices so completions correspond correctly to swapped habits
    const updatedHistory: HabitHistory = {};
    Object.keys(history).forEach((dateStr) => {
      const dayHistory = history[dateStr] || [];
      const newDayHistory = dayHistory.map((idx) => {
        if (idx === originalIndex1) return originalIndex2;
        if (idx === originalIndex2) return originalIndex1;
        return idx;
      });
      updatedHistory[dateStr] = newDayHistory;
    });
    setHistory(updatedHistory);
    audioEngine.playCheckPop();
  };`;

code = code.replace(oldMoveTask, newMoveTask);

// 2. Update removeTaskInSettings to handle versioning
const oldRemoveTask = `  const removeTaskInSettings = (indexToRemove: number) => {
    if (tasks.length <= 1) return; // Must keep at least one habit
    
    // Check if task has any history
    const hasHistory = Object.values(history).some(dayHistory => dayHistory?.includes(indexToRemove));

    if (hasHistory) {
      // Soft delete: set endDate to today or yesterday, but since it's just stopping it from tomorrow onward:
      // Actually, if we set endDate to today, it will still show today. If we set it to yesterday, it won't show today.
      // The prompt says "stop generating future instances from that date onward". We will set endDate to today.
      const newTasks = [...tasks];
      newTasks[indexToRemove] = { ...newTasks[indexToRemove], endDate: formatDate(new Date()) };
      setTasks(newTasks);
    } else {
      // Hard delete if no history
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
    }
  };`;

const newRemoveTask = `  const removeTaskInSettings = (indexToRemove: number) => {
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
  };

  const handleTaskEditInSettings = (index: number, updates: Partial<HabitTask>) => {
    const currentTask = tasks[index];
    const isOnlyDateUpdate = Object.keys(updates).every(k => k === 'startDate' || k === 'endDate');
    
    if (isOnlyDateUpdate) {
      const newTasks = [...tasks];
      newTasks[index] = { ...newTasks[index], ...updates };
      setTasks(newTasks);
      return;
    }
    
    const firstHistoryDate = Object.keys(history).sort().find(d => history[d]?.includes(index));
    const effectiveStart = currentTask.startDate || firstHistoryDate || '9999-99-99';
    
    if (!firstHistoryDate || selectedDate <= effectiveStart) {
      const newTasks = [...tasks];
      newTasks[index] = { ...newTasks[index], ...updates };
      setTasks(newTasks);
      return;
    }
    
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = formatDate(prevDate);
    
    const oldTask = { ...currentTask, endDate: prevDateStr };
    const newTask = { ...currentTask, ...updates, startDate: selectedDate };
    
    const newTasks = [...tasks];
    newTasks[index] = oldTask;
    newTasks.push(newTask);
    const newIndex = newTasks.length - 1;
    
    const updatedHistory = { ...history };
    Object.keys(updatedHistory).forEach(dateStr => {
      if (dateStr >= selectedDate) {
        if (updatedHistory[dateStr]?.includes(index)) {
          updatedHistory[dateStr] = [...updatedHistory[dateStr].filter(idx => idx !== index), newIndex];
        }
      }
    });
    
    setTasks(newTasks);
    setHistory(updatedHistory);
  };`;

code = code.replace(oldRemoveTask, newRemoveTask);

fs.writeFileSync('src/App.tsx', code);
console.log("Successfully patched removeTask and moveTask logic");
