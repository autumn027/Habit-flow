import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post('/api/verify-gemini-key', async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey) return res.status(400).json({ error: 'API key is required' });

      // Lightweight validation call (fetching models list)
      const fetchRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (fetchRes.ok) {
        res.json({ valid: true });
      } else {
        res.status(401).json({ error: 'Invalid API key' });
      }
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({ error: 'Failed to verify API key' });
    }
  });

  // API Route
  app.post('/api/extract-tasks', async (req, res) => {
    try {
      const { prompt, userApiKey } = req.body;
      
      const apiKeyToUse = userApiKey || process.env.GEMINI_API_KEY;
      
      if (!apiKeyToUse) {
         return res.status(401).json({ error: "No API key provided. Please configure one in Settings." });
      }
      
      const ai = new GoogleGenAI({
        apiKey: apiKeyToUse,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = `You are a rigid backend API endpoint for the HabitFlow app. You do not talk to humans. You do not offer encouragement, lifestyle advice, or explanations. You only parse text into raw JSON.

[CONTEXT]
Today's Date: June 27, 2026

[TASK]
Analyze the user's input string. Extract ALL distinct tasks, events, habits, or commitments mentioned in the text (e.g. assignments, meetings, chores, hanging out). Ensure you extract EVERY single task mentioned, even if there are multiple. For each task, calculate "daysToComplete" relative to June 27, 2026. If a task is due "today", daysToComplete is 0.

[OUTPUT FORMAT]
You must respond ONLY with a valid JSON array of objects, matching the exact structure below. Do not truncate. No markdown code blocks (do NOT use \`\`\`json), no trailing text, no conversational prose. 

[
  {
    "taskName": "String - clear, action-oriented task title",
    "priority": "String - 'High' | 'Medium' | 'Low'",
    "daysToComplete": Integer
  }
]

[CRITICAL VIOLATION WARNING]
Do not say "Feeling the pressure". Do not suggest habits like "Drink Water". Extract ONLY what the user explicitly writes in their input. If you output any text outside of the raw JSON array, the application will crash.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });

      res.json({ result: JSON.parse(response.text || "[]") });
    } catch (error: any) {
      console.error("Error extracting tasks:", error);
      const statusCode = error.status || 500;
      const errorMessage = error.message || "Failed to extract tasks";
      res.status(statusCode).json({ error: errorMessage });
    }
  });

  // API Route
  app.post('/api/generate-rescue', async (req, res) => {
    try {
      const { tasks, history, prompt, userApiKey } = req.body;
      
      const apiKeyToUse = userApiKey || process.env.GEMINI_API_KEY;
      
      if (!apiKeyToUse) {
         return res.status(401).json({ error: "No API key provided. Please configure one in Settings." });
      }
      
      const ai = new GoogleGenAI({
        apiKey: apiKeyToUse,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = `You are the advanced, core AI execution agent for the "HabitFlow AI" tab. Your task is to process incoming user habit profiles alongside real-time behavioral text and provide actionable execution strategies.

### CORE EXECUTION PROTOCOLS
1. STREAK RESCUE PROTOCOL: If a user has a high-value active habit streak, prioritize saving it. If they state they have zero time or energy, scale down the macro-habit into an un-ignorable "micro-habit alternative".
2. ELIMINATE PARALYSIS: Identify and output exactly ONE task the user must execute next. Force absolute focus on a single action path.
3. CALM & GROUNDING (Quality of Life): If the user expresses extreme exhaustion, panic, or states they only have a very short window (e.g. "5 minutes before a meeting"), DO NOT force a habit task. Instead, provide a quick, actionable grounding exercise (like box breathing, stretching, or mind-clearing) to help them regain calmness and composure.
4. CONTEXT-AWARE TONALITY: Remain encouraging, crisp, and high-impact. Do not sound like a simple clock or static notification engine.

### STRICT COMPONENT OUTPUT FORMAT (For Habit/Task rescue)
If the user is asking for help picking a task or saving a habit, use this format:
[Brief 1-sentence strategic acknowledgment of their current roadblock]

🎯 CHOSEN TASK: [Explicitly state the single most important habit from their list to focus on next]

⚡ STREAK RESCUE: [A hyper-reduced, 3-to-5 minute alternative action that legally keeps the streak active on their profile today]

### STRICT COMPONENT OUTPUT FORMAT (For Grounding/Calming)
If the user is exhausted, panicked, or only has a few minutes, use this format:
[Brief 1-sentence empathetic acknowledgment of their state]

🧘 GROUNDING ACTION: [A specific 1-to-5 minute calming action (e.g., breathing exercise, quick stretch) they can do right now]`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `User Habits: ${JSON.stringify(tasks)}\nUser History: ${JSON.stringify(history)}\n\nUser Current State: ${prompt}`,
        config: {
          systemInstruction,
        }
      });

      res.json({ result: response.text });
    } catch (error: any) {
      console.error("Error generating rescue:", error);
      const statusCode = error.status || 500;
      const errorMessage = error.message || "Failed to generate rescue strategy";
      res.status(statusCode).json({ error: errorMessage });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
