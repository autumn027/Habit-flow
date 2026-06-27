import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { KeyRound, Check, AlertCircle, Loader2 } from 'lucide-react';
import { audioEngine } from '../utils/audio';

export default function GeminiSettings({ darkMode }: { darkMode: boolean }) {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Basic obscuring for display (not true encryption, just local storage + btoa for minimal obfuscation)
    const stored = localStorage.getItem('gemini_api_key');
    if (stored) {
      try {
        setApiKey(atob(stored));
      } catch (e) {
        setApiKey(stored);
      }
    }
  }, []);

  const handleVerifyAndSave = async () => {
    if (!apiKey.trim()) return;
    
    setStatus('validating');
    setErrorMsg('');
    audioEngine.playCheckPop();

    try {
      const res = await fetch('/api/verify-gemini-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() })
      });

      if (res.ok) {
        // Save to device storage (simple base64 encoding to prevent cleartext in localStorage, though still easily reversible)
        localStorage.setItem('gemini_api_key', btoa(apiKey.trim()));
        setStatus('success');
        audioEngine.playSuccessChime();
        
        // Return to idle after a few seconds
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Invalid API Key');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Validation failed');
      audioEngine.playUncheckBong();
    }
  };

  return (
    <div className={`p-4 rounded-2xl border mb-6 transition-all ${
      darkMode 
        ? 'bg-slate-800/40 border-slate-700/60 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
        : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="font-bold text-xs md:text-sm block flex items-center gap-1.5">
            <KeyRound className={`w-4 h-4 ${darkMode ? 'text-indigo-400' : 'text-blue-500'}`} />
            Gemini AI API Key
          </span>
          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
            Required for HabitFlow AI Life Saver
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            setStatus('idle');
          }}
          placeholder="Paste your Gemini API key here..."
          className={`w-full px-3 py-2 text-xs rounded-xl border outline-none transition-all ${
            darkMode
              ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-indigo-500'
              : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'
          }`}
        />

        <div className="flex items-center justify-between">
          <button
            onClick={handleVerifyAndSave}
            disabled={status === 'validating' || !apiKey.trim()}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 ${
              darkMode
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {status === 'validating' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {status === 'success' && <Check className="w-3.5 h-3.5" />}
            {status === 'idle' || status === 'error' ? 'Verify & Save' : status === 'validating' ? 'Validating...' : 'Saved'}
          </button>
        </div>

        {status === 'error' && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 text-red-500 text-xs font-semibold mt-2"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
