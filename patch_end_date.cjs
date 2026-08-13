const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = "onChange={(e) => { const newType = e.target.value as any; handleTaskEditInSettings(i, { type: newType, endDate: t.endDate || (newType !== 'evergreen' ? formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) : undefined) }); }}";

const replacement = `onChange={(e) => { 
                                    const newType = e.target.value as any; 
                                    let newEndDate = t.endDate;
                                    if (newType === 'evergreen') {
                                      newEndDate = undefined;
                                    } else if (!t.endDate) {
                                      const sd = new Date(selectedDate);
                                      sd.setDate(sd.getDate() + 7);
                                      newEndDate = formatDate(sd);
                                    }
                                    handleTaskEditInSettings(i, { type: newType, endDate: newEndDate }); 
                                  }}`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched end date logic.");
