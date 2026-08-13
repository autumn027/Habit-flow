const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldLogic = `    const firstHistoryDate = Object.keys(history).sort().find(d => history[d]?.includes(index));
    const effectiveStart = currentTask.startDate || firstHistoryDate || '9999-99-99';
    
    if (!firstHistoryDate || selectedDate <= effectiveStart) {
      const newTasks = [...tasks];
      newTasks[index] = { ...newTasks[index], ...updates };
      setTasks(newTasks);
      return;
    }`;

const newLogic = `    const firstHistoryDate = Object.keys(history).sort().find(d => history[d]?.includes(index));
    const effectiveStart = currentTask.startDate || firstHistoryDate || '0000-00-00';
    
    if (selectedDate <= effectiveStart) {
      const newTasks = [...tasks];
      newTasks[index] = { ...newTasks[index], ...updates };
      setTasks(newTasks);
      return;
    }`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched handleTaskEditInSettings");
