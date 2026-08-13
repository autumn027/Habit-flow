const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace("FileJson\n} from 'lucide-react';", "FileJson,\n  Ban\n} from 'lucide-react';");

const oldDeleteBtn = `                              {tasks.length > 1 && (
                                <button
                                  type="button"
                                  id={\`btn-remove-habit-\${i}\`}
                                  onClick={() => removeTaskInSettings(i)}
                                  className={\`p-2 rounded-lg transition-colors cursor-pointer shrink-0 \${
                                    darkMode ? 'text-slate-500 hover:text-red-400 hover:bg-slate-800' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                                  }\`}
                                  title="Delete Habit"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}`;

const newButtons = `                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  id={\`btn-skip-habit-\${i}\`}
                                  onClick={() => handleTaskEditInSettings(i, { exceptionDates: [...(t.exceptionDates || []), selectedDate] })}
                                  className={\`p-2 rounded-lg transition-colors cursor-pointer shrink-0 \${
                                    darkMode ? 'text-slate-500 hover:text-amber-400 hover:bg-slate-800' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                                  }\`}
                                  title="Skip for this date"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                                {tasks.length > 1 && (
                                  <button
                                    type="button"
                                    id={\`btn-remove-habit-\${i}\`}
                                    onClick={() => removeTaskInSettings(i)}
                                    className={\`p-2 rounded-lg transition-colors cursor-pointer shrink-0 \${
                                      darkMode ? 'text-slate-500 hover:text-red-400 hover:bg-slate-800' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                                    }\`}
                                    title="Delete Habit"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>`;

code = code.replace(oldDeleteBtn, newButtons);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched skip button");
