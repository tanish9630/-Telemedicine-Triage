import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Send, Mic, AlertTriangle, Shield, Zap, Info, Paperclip, X, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi (हिंदी)', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi (मराठी)', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati (ગુજરાતી)', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil (தமிழ்)', flag: '🇮🇳' },
];

interface ChatMessage {
  from: string;
  text: string;
  time: string;
  urgencyLevel?: number;
  specialist?: string;
  recommendation?: string;
  image?: string | null;
  isVision?: boolean;
  condition?: string;
  confidence?: number;
}

const URGENCY_META: Record<number, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  1: { label: 'Level 1 — Mild', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', icon: <Shield className="w-4 h-4" /> },
  2: { label: 'Level 2 — Minor', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-500/10', border: 'border-teal-200 dark:border-teal-500/20', icon: <Info className="w-4 h-4" /> },
  3: { label: 'Level 3 — Moderate', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', icon: <AlertTriangle className="w-4 h-4" /> },
  4: { label: 'Level 4 — Serious', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/20', icon: <Zap className="w-4 h-4" /> },
  5: { label: 'Level 5 — Emergency 🚨', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', icon: <AlertTriangle className="w-4 h-4" /> },
};

async function callTriageAPI(message: string, patientName: string, lang: string, token: string): Promise<{
  message: string;
  urgencyLevel?: number;
  specialist?: string;
  recommendation?: string;
}> {
  const res = await fetch(`${API_URL}/ai/triage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ message, patientName, lang }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Triage API error');
  }
  return res.json();
}

async function callVisionAPI(image: string, userMessage: string, lang: string, token: string): Promise<{
  condition: string;
  confidence: number;
  urgencyLevel: number;
  specialist: string;
  recommendation: string;
  message: string;
}> {
  const res = await fetch(`${API_URL}/ai/analyze-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ image, message: userMessage, lang }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Vision API error');
  }
  return res.json();
}

export function PatientAITriage() {
  const { user, token } = useAuth();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { from: 'ai', text: `Hello! 👋 I'm your **Groq AI** health assistant. Describe your symptoms or upload an image, and I'll analyze your urgency level and recommend the best specialist for you.`, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    groqApiKey: GROQ_KEY,
    lang: selectedLanguage,
    onResult: (transcript) => setChatInput((prev) => (prev ? prev + ' ' + transcript : transcript))
  });

  const toggleListening = () => isListening ? stopListening() : startListening();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size too large. Please select a file under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setSelectedImage(base64);
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, isTyping]);

  const handleSendChat = useCallback(async () => {
    if (!chatInput.trim() && !selectedImage) return;

    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const userMsg = chatInput;
    const currentImage = selectedImage;
    const currentPreview = imagePreview;

    setChatMessages(prev => [...prev, {
      from: 'user',
      text: userMsg || (currentImage ? 'Sent an image for analysis' : ''),
      time,
      image: currentPreview
    }]);

    setChatInput('');
    removeImage();
    setIsTyping(true);

    try {
      const patientName = user?.fullName?.split(' ')[0] || 'there';

      if (currentImage) {
        const result = await callVisionAPI(currentImage, userMsg, selectedLanguage, token || '');
        setChatMessages(prev => [...prev, {
          from: 'ai',
          text: result.message,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          urgencyLevel: result.urgencyLevel,
          specialist: result.specialist,
          recommendation: result.recommendation,
          isVision: true,
          condition: result.condition,
          confidence: result.confidence
        }]);
      } else {
        const result = await callTriageAPI(userMsg, patientName, selectedLanguage, token || '');
        setChatMessages(prev => [...prev, {
          from: 'ai',
          text: result.message,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          urgencyLevel: result.urgencyLevel,
          specialist: result.specialist,
          recommendation: result.recommendation
        }]);
      }
    } catch (err: any) {
      setChatMessages(prev => [...prev, { from: 'ai', text: err.message || 'Sorry, I couldn\'t reach the AI service.', time }]);
    } finally { setIsTyping(false); }
  }, [chatInput, selectedImage, imagePreview, user, token]);

  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 flex flex-col items-center justify-center pb-20 md:pb-8">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl flex flex-col h-[75vh] md:h-[80vh] min-h-[500px] transition-colors overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 transition-colors">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">CareConnect AI Triage</h1>
              <div className="text-sm text-emerald-500 font-semibold flex items-center mt-0.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                Powered by Groq · Llama 3.3
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="max-w-3xl mx-auto space-y-6">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.from === 'ai' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-0.5 shadow-sm">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[85%] ${msg.from === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                    msg.from === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm border border-slate-100 dark:border-white/10'
                  }`}>
                    {msg.image && (
                      <div className="mb-3 rounded-lg overflow-hidden border border-white/20">
                        <img src={msg.image} alt="Uploaded" className="max-w-full h-auto" />
                      </div>
                    )}
                    {msg.text}
                  </div>

                  {msg.isVision && (
                    <div className="mt-3 w-full bg-white dark:bg-slate-800 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 shadow-lg overflow-hidden">
                      <div className="bg-indigo-600 px-4 py-2 text-white text-xs font-bold flex items-center">
                        <Activity className="w-3 h-3 mr-2" />
                        VISUAL ANALYSIS RESULT
                      </div>
                      <div className="p-4 space-y-4">
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Detected Condition</div>
                          <div className="text-lg font-bold text-slate-900 dark:text-white">{msg.condition}</div>
                          <div className="mt-2 flex items-center space-x-2">
                            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${msg.confidence}%` }} />
                            </div>
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{msg.confidence}% Match</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {msg.urgencyLevel && URGENCY_META[msg.urgencyLevel] && (
                    <div className={`mt-2 px-5 py-4 rounded-xl border ${URGENCY_META[msg.urgencyLevel].bg} ${URGENCY_META[msg.urgencyLevel].border} text-sm w-full`}>
                      <div className={`flex items-center font-bold mb-2 text-[15px] ${URGENCY_META[msg.urgencyLevel].color}`}>
                        {URGENCY_META[msg.urgencyLevel].icon}
                        <span className="ml-2">{URGENCY_META[msg.urgencyLevel].label}</span>
                      </div>
                      {msg.specialist && <div className="text-slate-700 dark:text-slate-300 mt-1">👨‍⚕️ Recommend visiting: <span className="font-semibold">{msg.specialist}</span></div>}
                      {msg.recommendation && <div className="text-slate-700 dark:text-slate-300 mt-1 mb-4">💡 {msg.recommendation}</div>}
                      {msg.specialist && (
                        <Link 
                          to={`/find-doctors?specialty=${encodeURIComponent(msg.specialist)}`}
                          className="mt-2 block w-full text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shadow-sm"
                        >
                          Find {msg.specialist}
                        </Link>
                      )}
                    </div>
                  )}
                  <span className="text-xs text-slate-400 mt-2 px-1">{msg.time}</span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 px-5 py-4 rounded-2xl rounded-bl-sm shadow-sm">
                  <div className="flex items-center space-x-2">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="px-6 py-5 border-t border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 transition-colors">
          <div className="max-w-3xl mx-auto flex items-end space-x-3">
            <button
              onClick={toggleListening}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-xl shadow-rose-500/30'
                  : 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
              title={isListening ? 'Stop recording' : 'Voice input'}
            >
              <Mic className="w-6 h-6" />
            </button>
            <div className="flex-1 relative">
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                placeholder="Describe your symptoms in detail..."
                rows={1}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-base text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 resize-none transition-all shadow-sm"
                style={{ maxHeight: '150px', overflowY: 'auto' }}
              />
              {imagePreview && (
                <div className="absolute bottom-full left-0 mb-3 animate-in slide-in-from-bottom-2">
                  <div className="relative group">
                    <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-xl border-2 border-indigo-500 shadow-xl" />
                    <button
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
                imagePreview
                  ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600'
                  : 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
              title="Upload image"
            >
              <Paperclip className="w-6 h-6" />
            </button>
            <button
              onClick={handleSendChat}
              disabled={(!chatInput.trim() && !selectedImage) || isTyping}
              className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl flex items-center justify-center flex-shrink-0 transition-all shadow-lg shadow-indigo-600/20"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
          {isListening && (
            <p className="text-sm text-rose-500 font-medium mt-3 text-center animate-pulse">🎙 Listening... speak now to describe your problem</p>
          )}
        </div>
      </div>
    </main>
  );
}
