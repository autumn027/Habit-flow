const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldLogic = `        if (type === 'target_quest') {
          const completionDate = Object.keys(history).find(d => history[d]?.includes(originalIndex));
          if (completionDate) {
            return dateStr <= completionDate;
          }
        }`;

const newLogic = `        if (type === 'target_quest') {
          const completionDate = Object.keys(history).sort().find(d => history[d]?.includes(originalIndex));
          if (completionDate) {
            return dateStr <= completionDate;
          }
        }`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched target_quest sort logic");
