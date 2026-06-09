export interface HabitHistory {
  [dateStr: string]: number[]; // Format: { "2026-06-07": [0, 3, 4] }
}

export interface HabitTask {
  name: string;
  type: 'evergreen' | 'target_quest' | 'daily_sprint';
  endDate?: string; // YYYY-MM-DD
}
