let t = { endDate: '2026-08-20' };
let newType = 'evergreen';
let endDate = newType === 'evergreen' ? undefined : (t.endDate || 'NEW_DATE');
console.log(endDate);
