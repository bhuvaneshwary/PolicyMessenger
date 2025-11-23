
import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useSpeechSynthesis } from 'react-speech-kit';
import axios from 'axios';

function App() {
  const [image, setImage] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [summary, setSummary] = useState('');
  const [language, setLanguage] = useState('English');
  const [sessionId] = useState(Math.random().toString(36)); // Unique session
  const { speak } = useSpeechSynthesis();
  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    setImage(URL.createObjectURL(file));
    const result = await Tesseract.recognize(file, 'eng'); // Add more langs if needed
    setOcrText(result.data.text);
    // Send to backend for summary
    const response = await axios.post('http://localhost:5000/summarize', { text: result.data.text, language, sessionId });
    setSummary(response.data.summary);
    speak({ text: response.data.summary }); // Auto-speak summary
  };

  const handleAsk = async () => {
    const response = await axios.post('http://localhost:5000/ask', { question: transcript, sessionId, language });
    const answer = response.data.answer;
    speak({ text: answer });
    resetTranscript();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>The Policy Messenger</h1>
      <select onChange={(e) => setLanguage(e.target.value)}>
        <option>English</option>
        <option>Hindi</option>
        <option>Tamil</option>
      </select>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {image && <img src={image} alt="Uploaded" width="300" />}
      <p>OCR Text: {ocrText}</p>
      <p>Summary: {summary}</p>
      <button onClick={SpeechRecognition.startListening}>Speak Question</button>
      <button onClick={SpeechRecognition.stopListening}>Stop</button>
      <p>Transcript: {transcript}</p>
      <button onClick={handleAsk}>Ask AI</button>
    </div>
  );
}

export default App;
