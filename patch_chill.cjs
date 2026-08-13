const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add state
code = code.replace(
  "const [showApiKeyPrompt, setShowApiKeyPrompt] = useState<boolean>(false);",
  "const [showApiKeyPrompt, setShowApiKeyPrompt] = useState<boolean>(false);\n  const [showChillDayPrompt, setShowChillDayPrompt] = useState<boolean>(false);"
);

// 2. Add handleChillDay function next to addTaskInSettings
const handlerCode = `
  const handleChillDay = (hasExam: boolean) => {
    if (hasExam) {
      const currentVisibleTasks = getVisibleTasksForDate(selectedDate);
      const newTasks = [...tasks];
      currentVisibleTasks.forEach(vt => {
        const i = vt.originalIndex;
        newTasks[i] = {
          ...newTasks[i],
          exceptionDates: [...(newTasks[i].exceptionDates || []), selectedDate]
        };
      });
      newTasks.push({
        name: "prep for exam",
        type: "evergreen",
        startDate: selectedDate,
        endDate: selectedDate
      });
      setTasks(newTasks);
    } else {
      const currentVisibleTasks = getVisibleTasksForDate(selectedDate);
      const newDayHistory = currentVisibleTasks.map(vt => vt.originalIndex);
      const updatedHistory = { ...history, [selectedDate]: newDayHistory };
      setHistory(updatedHistory);
      audioEngine.playCheckPop();
    }
    setShowChillDayPrompt(false);
  };
`;
code = code.replace(
  "  const addTaskInSettings = () => {",
  handlerCode + "\n  const addTaskInSettings = () => {"
);

// 3. Add Chill Day button next to btn-add-habit block
const buttonCode = `
                    <button
                      type="button"
                      onClick={() => setShowChillDayPrompt(true)}
                      className={\`w-full mt-4 border font-bold py-2.5 rounded-xl transition-all cursor-pointer text-sm flex items-center justify-center gap-1.5 \${
                        darkMode 
                          ? 'border-slate-700 hover:border-emerald-500 shadow-inner hover:text-emerald-400 text-slate-300 bg-slate-800 hover:bg-slate-800/80' 
                          : 'border-slate-200 hover:border-emerald-500 hover:text-emerald-600 text-slate-600 bg-white hover:bg-slate-50 shadow-sm'
                      }\`}
                    >
                      Chill day 💆
                    </button>
`;
code = code.replace(
  "                    {/* Monthly Goal Setting Option */}",
  buttonCode + "\n                    {/* Monthly Goal Setting Option */}"
);

// 4. Add Chill Day Prompt modal next to API Key Prompt modal
const modalCode = `
      {/* Chill Day Prompt Modal */}
      <AnimatePresence>
        {showChillDayPrompt && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[120] flex items-center justify-center p-4 cursor-default"
            onClick={(e) => { if (e.target === e.currentTarget) setShowChillDayPrompt(false); }}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className={\`max-w-sm w-full p-6 rounded-3xl shadow-2xl border \${
                darkMode 
                  ? 'bg-slate-900 border-slate-700/60 shadow-[0_0_40px_rgba(0,0,0,0.5)]' 
                  : 'bg-white border-slate-200/60 shadow-[0_20px_60px_rgba(148,163,184,0.2)]'
              }\`}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center">
                  <span className="text-3xl">💆</span>
                </div>
                <h3 className={\`text-xl font-black mb-2 \${darkMode ? 'text-white' : 'text-slate-800'}\`}>Chill Day</h3>
                <p className={\`text-sm font-medium \${darkMode ? 'text-slate-400' : 'text-slate-500'}\`}>Is there an exam near the targeted day?</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleChillDay(false)}
                  className={\`flex-1 py-3 rounded-xl font-bold transition-all text-sm \${
                    darkMode 
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                  }\`}
                >
                  No
                </button>
                <button
                  onClick={() => handleChillDay(true)}
                  className="flex-1 py-3 rounded-xl font-bold transition-all text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                >
                  Yes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
`;
code = code.replace(
  "      {/* API Key Prompt Modal */}",
  modalCode + "\n      {/* API Key Prompt Modal */}"
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched correctly!");
