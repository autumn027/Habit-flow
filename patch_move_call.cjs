const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/moveTask\(i, 'up'\)/g, "moveTask(visibleIndex, 'up')");
code = code.replace(/moveTask\(i, 'down'\)/g, "moveTask(visibleIndex, 'down')");

fs.writeFileSync('src/App.tsx', code);
console.log("Patched moveTask calls");
