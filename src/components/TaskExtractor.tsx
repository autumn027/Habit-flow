import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Brain, Loader2, Sparkles, PlusCircle } from 'lucide-react';
import { audioEngine } from '../utils/audio';
import { HabitTask } from '../types';
import { formatDate } from '../utils/dateHelpers';

interface TaskExtractorProps {
  darkMode: boolean;
  onAddTasks: (tasks: HabitTask[]) => void;
}

interface ExtractedTask {
  taskName: string;
  priority: 'High' | 'Medium' | 'Low';
  daysToComplete: number;
}

export default function TaskExtractor({ darkMode, onAddTasks }: TaskExtractorProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<ExtractedTask[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setTasks(null);
    audioEngine.playCheckPop();

    try {
      const storedKey = localStorage.getItem('gemini_api_key');
      const userApiKey = storedKey ? atob(storedKey) : undefined;
      const res = await fetch('/api/extract-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, userApiKey })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to extract tasks');
      }

      const data = await res.json();
      setTasks(data.result);
      audioEngine.playSuccessChime();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      audioEngine.playUncheckBong();
    } finally {
      setLoading(false);
    }
  };

  const handleAddAllToTracker = () => {
    if (!tasks) return;
    const newHabits: HabitTask[] = tasks.map(t => {
      const today = new Date();
      today.setDate(today.getDate() + t.daysToComplete);
      return {
        name: t.taskName,
        type: 'target_quest',
        endDate: formatDate(today)
      };
    });
    onAddTasks(newHabits);
    setTasks(null);
    setPrompt('');
  };

  return (
    <div className={`mt-6 p-6 rounded-3xl border transition-all duration-300 ${
      darkMode 
        ? 'bg-slate-900/40 border-slate-800/80 shadow-[0_12px_40px_rgba(0,0,0,0.5)]' 
        : 'bg-white border-slate-100 shadow-xl shadow-slate-200/60'
    }`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-2xl ${darkMode ? 'bg-purple-950/50 text-purple-400' : 'bg-purple-50 text-purple-500'}`}>
          <Brain className="w-6 h-6" />
        </div>
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-purple-200' : 'text-slate-800'}`}>
            Brain Dump to Tasks
          </h2>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Extract structured goals from your stress
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          What's on your mind right now? Paste your brain dump...
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. I am freaking out because I have a math paper due today and a biology presentation on Tuesday..."
            className={`flex-1 px-4 py-3 min-h-[100px] sm:min-h-[60px] rounded-xl border outline-none transition-all resize-none ${
              darkMode 
                ? 'bg-slate-800/50 border-slate-700 text-slate-200 focus:border-purple-500 focus:bg-slate-800' 
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-purple-500 focus:bg-white'
            }`}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className={`px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              darkMode
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white border-transparent'
                : 'bg-slate-800 hover:bg-slate-900 text-white'
            }`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            <span>Extract</span>
          </button>
        </div>
      </form>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 mb-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.div>
      )}

      {tasks && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {tasks.length === 0 ? (
            <div className={`p-4 rounded-xl text-center text-sm ${darkMode ? 'text-slate-400 bg-slate-800/50' : 'text-slate-500 bg-slate-50'}`}>
              No clear tasks found in your text.
            </div>
          ) : (
            <>
              {tasks.map((task, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                  darkMode 
                    ? 'bg-slate-800/60 border-slate-700/60' 
                    : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div>
                    <h3 className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                      {task.taskName}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        task.priority === 'High' 
                          ? (darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700')
                          : task.priority === 'Medium'
                            ? (darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700')
                            : (darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700')
                      }`}>
                        {task.priority}
                      </span>
                      <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {task.daysToComplete === 0 ? 'Due Today' : `Due in ${task.daysToComplete} day${task.daysToComplete === 1 ? '' : 's'}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={handleAddAllToTracker}
                className={`w-full mt-2 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  darkMode
                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                <PlusCircle className="w-5 h-5" />
                Add All to Tracker
              </button>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
