const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldRender = `{tasks.map((t, i) => (`;
const newRender = `{visibleTasksForSelectedDate.map((t, visibleIndex) => {
                          const i = t.originalIndex;
                          return (`;

code = code.replace(oldRender, newRender);

const oldClose = `                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {tasks.length < 10 && (`;
const newClose = `                          </motion.div>
                        )})}
                      </AnimatePresence>
                    </div>

                    {visibleTasksForSelectedDate.length < 10 && (`;

code = code.replace(oldClose, newClose);

const oldLabelCount = `<span className="text-xs font-normal opacity-70">({tasks.length}/10)</span>`;
const newLabelCount = `<span className="text-xs font-normal opacity-70">({visibleTasksForSelectedDate.length}/10)</span>`;

code = code.replace(oldLabelCount, newLabelCount);

// Need to update onChange usages to use handleTaskEditInSettings
// Since it's tricky with regex, we can manually replace the known blocks or write a script

fs.writeFileSync('src/App.tsx', code);
console.log("Successfully patched map rendering");
