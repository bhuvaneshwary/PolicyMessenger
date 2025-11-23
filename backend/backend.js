
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const { Client } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const db = new Client({ connectionString: process.env.DATABASE_URL }); // Set in .env
db.connect();

// Route to summarize OCR text
app.post('/summarize', async (req, res) => {
  const { text, language, sessionId } = req.body;
  const prompt = Summarize this government policy in simple, clear ${language}. Explain eligibility, benefits, and required documents. Be concise and helpful: ${text};
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });
    const summary = response.choices[0].message.content;
    // Store in DB (minimal, for session continuity)
    await db.query('INSERT INTO sessions (session_id, chat_log) VALUES ($1, $2)', [sessionId, JSON.stringify({ summary })]);
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: 'AI processing failed' });
  }
});

// Route for Q&A
app.post('/ask', async (req, res) => {
  const { question, sessionId, language } = req.body;
  // Fetch previous context from DB
  const result = await db.query('SELECT chat_log FROM sessions WHERE session_id = $1', [sessionId]);
  const context = result.rows[0]?.chat_log || {};
  const prompt = Based on this policy summary: ${JSON.stringify(context)}. Answer in simple ${language}: ${question};
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });
  res.json({ answer: response.choices[0].message.content });
});

app.listen(5000, () => console.log('Backend running on port 5000'));
