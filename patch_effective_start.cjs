const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Patch removeTaskInSettings
code = code.replace(
  "const firstHistoryDate = Object.keys(history).sort().find(d => history[d]?.includes(indexToRemove));\n    const effectiveStart = currentTask.startDate || firstHistoryDate || '0000-00-00';",
  "const effectiveStart = currentTask.startDate || '0000-00-00';"
);

// Patch handleTaskEditInSettings
code = code.replace(
  "const firstHistoryDate = Object.keys(history).sort().find(d => history[d]?.includes(index));\n    const effectiveStart = currentTask.startDate || firstHistoryDate || '0000-00-00';",
  "const effectiveStart = currentTask.startDate || '0000-00-00';"
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched effectiveStart logic");
