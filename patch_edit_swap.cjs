const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldLogic = `    const oldTask = { ...currentTask, endDate: prevDateStr };
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

const newLogic = `    const oldTask = { ...currentTask, endDate: prevDateStr };
    const newTask = { ...currentTask, ...updates, startDate: selectedDate };
    
    const newTasks = [...tasks];
    newTasks[index] = newTask;
    newTasks.push(oldTask);
    const archivedIndex = newTasks.length - 1;
    
    const updatedHistory = { ...history };
    Object.keys(updatedHistory).forEach(dateStr => {
      if (dateStr < selectedDate) {
        if (updatedHistory[dateStr]?.includes(index)) {
          updatedHistory[dateStr] = [...updatedHistory[dateStr].filter(idx => idx !== index), archivedIndex];
        }
      }
    });
    
    setTasks(newTasks);
    setHistory(updatedHistory);
  };`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched swap logic in handleTaskEditInSettings");
