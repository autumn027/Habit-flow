import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Bot, Loader2, Play, Wind, Zap } from 'lucide-react';
import { HabitHistory, HabitTask } from '../types';
import { audioEngine } from '../utils/audio';
import TaskExtractor from './TaskExtractor';

interface AILifeSaverProps {
  tasks: HabitTask[];
  history: HabitHistory;
  darkMode: boolean;
  onAddTasks: (tasks: HabitTask[]) => void;
}

export default function AILifeSaver({ tasks, history, darkMode, onAddTasks }: AILifeSaverProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);
    audioEngine.playCheckPop();

    try {
      const storedKey = localStorage.getItem('gemini_api_key');
      const userApiKey = storedKey ? atob(storedKey) : undefined;
      const res = await fetch('/api/generate-rescue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, history, prompt, userApiKey })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to generate rescue strategy');
      }

      const data = await res.json();
      setResponse(data.result);
      audioEngine.playSuccessChime();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      audioEngine.playUncheckBong();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-6 rounded-3xl border transition-all duration-300 ${
      darkMode 
        ? 'bg-slate-900/40 border-slate-800/80 shadow-[0_12px_40px_rgba(0,0,0,0.5)]' 
        : 'bg-white border-slate-100 shadow-xl shadow-slate-200/60'
    }`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-2xl ${darkMode ? 'bg-indigo-950/50 text-indigo-400' : 'bg-blue-50 text-blue-500'}`}>
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-indigo-200' : 'text-slate-800'}`}>
            HabitFlow AI
          </h2>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Last-Minute Life Saver
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          What's blocking you right now? (Time, energy, stress...)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. I am exhausted and only have 5 mins..."
            className={`flex-1 px-4 py-3 rounded-xl border outline-none transition-all ${
              darkMode 
                ? 'bg-slate-800/50 border-slate-700 text-slate-200 focus:border-indigo-500 focus:bg-slate-800' 
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white'
            }`}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              darkMode
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-transparent'
                : 'bg-slate-800 hover:bg-slate-900 text-white'
            }`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            <span className="hidden sm:inline">Rescue Me</span>
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

      {response && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          {response.includes('🧘 GROUNDING ACTION:') ? (
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-teal-950/40 border-teal-800/60 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'}`}>
              <div className="flex items-center gap-2 mb-3">
                 <Wind className={`w-5 h-5 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                 <h3 className="font-bold text-lg">Mindfulness & Grounding</h3>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">
                 {response}
              </div>
            </div>
          ) : response.includes('⚡ STREAK RESCUE:') ? (
             <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-orange-950/40 border-orange-800/60 text-orange-100' : 'bg-orange-50 border-orange-200 text-orange-900'}`}>
              <div className="flex items-center gap-2 mb-3">
                 <Zap className={`w-5 h-5 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                 <h3 className="font-bold text-lg">Action Plan</h3>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">
                 {response}
              </div>
            </div>
          ) : (
            <div className={`p-6 rounded-2xl whitespace-pre-wrap leading-relaxed border ${
              darkMode 
                ? 'bg-slate-800/60 border-slate-700/60 text-slate-200' 
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              {response}
            </div>
          )}
        </motion.div>
      )}

      <TaskExtractor darkMode={darkMode} onAddTasks={onAddTasks} />
    </div>
  );
}
