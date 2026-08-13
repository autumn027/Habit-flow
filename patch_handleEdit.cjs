const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const isOnlyDateUpdate = Object.keys(updates).every(k => k === 'startDate' || k === 'endDate');",
  "const isOnlyDateUpdate = Object.keys(updates).every(k => k === 'startDate' || k === 'endDate' || k === 'exceptionDates');"
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched isOnlyDateUpdate");
