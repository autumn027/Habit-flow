const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldMergeLogic = `    } else if (mode === 'merge') {
      const newTasks = [...tasks];
      const incomingTasks = Array.isArray(data.tasks) ? migrateTasksList(data.tasks) : [];
      
      incomingTasks.forEach(incomingTask => {
        if (!newTasks.some(t => t.name === incomingTask.name)) {
          newTasks.push(incomingTask);
        }
      });
      setTasks(newTasks);

      const newHistory = { ...history };
      const incomingHistory = data.history || {};
      Object.keys(incomingHistory).forEach(dateStr => {
        if (!newHistory[dateStr]) {
          newHistory[dateStr] = incomingHistory[dateStr];
        } else {
          newHistory[dateStr] = Array.from(new Set([...newHistory[dateStr], ...incomingHistory[dateStr]]));
        }
      });
      setHistory(newHistory);
    }`;

const newMergeLogic = `    } else if (mode === 'merge') {
      const newTasks = [...tasks];
      const incomingTasks = Array.isArray(data.tasks) ? migrateTasksList(data.tasks) : [];
      
      const indexMap = new Map<number, number>();

      incomingTasks.forEach((incomingTask, incomingIdx) => {
        const existingIdx = newTasks.findIndex(t => t.name === incomingTask.name);
        if (existingIdx === -1) {
          newTasks.push(incomingTask);
          indexMap.set(incomingIdx, newTasks.length - 1);
        } else {
          indexMap.set(incomingIdx, existingIdx);
        }
      });
      setTasks(newTasks);

      const newHistory = { ...history };
      const incomingHistory = data.history || {};
      Object.keys(incomingHistory).forEach(dateStr => {
        const incomingIndices = incomingHistory[dateStr];
        if (!Array.isArray(incomingIndices)) return;

        const mappedIncoming = incomingIndices.map((idx: number) => indexMap.get(idx)).filter((idx: number | undefined) => idx !== undefined) as number[];

        if (!newHistory[dateStr]) {
          newHistory[dateStr] = mappedIncoming;
        } else {
          newHistory[dateStr] = Array.from(new Set([...newHistory[dateStr], ...mappedIncoming]));
        }
      });
      setHistory(newHistory);
    }`;

if (code.includes(oldMergeLogic)) {
  code = code.replace(oldMergeLogic, newMergeLogic);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Successfully patched merge logic");
} else {
  console.log("Could not find the old merge logic block");
}
