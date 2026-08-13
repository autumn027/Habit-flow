const formatDate = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

let tasks = [
  { name: 'Habit', type: 'evergreen', startDate: '2026-08-11' } // Created 2 days ago
];

let selectedDate = '2026-08-13'; // Today

let t = tasks[0];
let i = 0;

let history = { '2026-08-11': [0], '2026-08-12': [0] };

let newType = 'target_quest';
let updates = { 
  type: newType, 
  endDate: t.endDate || (newType !== 'evergreen' ? formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) : undefined) 
};

let currentTask = tasks[i];
let effectiveStart = currentTask.startDate || '0000-00-00';
let newTasks = [...tasks];

let prevDate = new Date(selectedDate);
prevDate.setDate(prevDate.getDate() - 1);
let prevDateStr = formatDate(prevDate);

let oldTask = { ...currentTask, endDate: prevDateStr };
let newTask = { ...currentTask, ...updates, startDate: selectedDate };

newTasks[i] = newTask;
newTasks.push(oldTask);

tasks = newTasks;

let updatedHistory = { ...history };
let archivedIndex = tasks.length - 1;
Object.keys(updatedHistory).forEach(dateStr => {
  if (dateStr < selectedDate) {
    if (updatedHistory[dateStr]?.includes(i)) {
      updatedHistory[dateStr] = [...updatedHistory[dateStr].filter(idx => idx !== i), archivedIndex];
    }
  }
});
history = updatedHistory;

const getVisibleTasksForDate = (dateStr) => {
  const mapped = tasks.map((task, originalIndex) => ({ ...task, originalIndex }));
  const filtered = mapped.filter(({ type, startDate, endDate, exceptionDates, originalIndex }) => {
    if (startDate && dateStr < startDate) return false;
    if (endDate && dateStr > endDate) return false;
    if (type === 'evergreen') return true;
    if (type === 'target_quest') {
      const completionDate = Object.keys(history).sort().find(d => history[d]?.includes(originalIndex));
      if (completionDate) {
        return dateStr <= completionDate;
      }
    }
    return true;
  });
  return filtered;
};

console.log("2026-08-13:", getVisibleTasksForDate('2026-08-13').map(t=>t.name + ' ' + t.originalIndex));
console.log("2026-08-14:", getVisibleTasksForDate('2026-08-14').map(t=>t.name + ' ' + t.originalIndex));
