const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace name onChange
const nameRegex = /onChange=\{\(e\) => \{\s+const newTasks = \[\.\.\.tasks\];\s+newTasks\[i\] = \{ \.\.\.newTasks\[i\], name: e\.target\.value \};\s+setTasks\(newTasks\);\s+\}\}/g;
code = code.replace(nameRegex, "onChange={(e) => handleTaskEditInSettings(i, { name: e.target.value })}");

// Replace type onChange
const typeRegex = /onChange=\{\(e\) => \{\s+const newTasks = \[\.\.\.tasks\];\s+const newType = e\.target\.value as any;\s+newTasks\[i\] = \{ \s+\.\.\.newTasks\[i\], \s+type: newType,\s+endDate: newTasks\[i\]\.endDate \|\| \(newType !== 'evergreen' \? formatDate\(new Date\(Date\.now\(\) \+ 7 \* 24 \* 60 \* 60 \* 1000\)\) : undefined\)\s+\};\s+setTasks\(newTasks\);\s+\}\}/g;
code = code.replace(typeRegex, "onChange={(e) => { const newType = e.target.value as any; handleTaskEditInSettings(i, { type: newType, endDate: t.endDate || (newType !== 'evergreen' ? formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) : undefined) }); }}");

// Replace startDate onChange
const startRegex = /onChange=\{\(e\) => \{\s+const newTasks = \[\.\.\.tasks\];\s+newTasks\[i\] = \{ \s+\.\.\.newTasks\[i\], \s+startDate: e\.target\.value \|\| undefined\s+\};\s+setTasks\(newTasks\);\s+\}\}/g;
code = code.replace(startRegex, "onChange={(e) => handleTaskEditInSettings(i, { startDate: e.target.value || undefined })}");

// Replace endDate onChange
const endRegex = /onChange=\{\(e\) => \{\s+const newTasks = \[\.\.\.tasks\];\s+newTasks\[i\] = \{ \s+\.\.\.newTasks\[i\], \s+endDate: e\.target\.value \|\| undefined\s+\};\s+setTasks\(newTasks\);\s+\}\}/g;
code = code.replace(endRegex, "onChange={(e) => handleTaskEditInSettings(i, { endDate: e.target.value || undefined })}");

fs.writeFileSync('src/App.tsx', code);
console.log("Patched onChange handlers");
