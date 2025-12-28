import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageSquare, Send, X, Bot, User as UserIcon, Loader2, Sparkles } from 'lucide-react';
import { User } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AIAssistant: React.FC<{ user: User }> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hello ${user.name}! I'm your AMS AI Assistant. How can I help you with your attendance, leave requests, or company policies today?` }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: `You are a professional HR AI Assistant for AMS Pro. User: ${user.name}, Role: ${user.role}. Answer concisely about HR policy, attendance logging, and leave requests.`,
        }
      });
      setMessages(prev => [...prev, { role: 'assistant', content: response.text || "System offline. Please try again later." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Connection timed out. Secure network required." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {isOpen ? (
        <div className="bg-white dark:bg-slate-900 w-[90vw] sm:w-[400px] h-[600px] max-h-[80vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-8 zoom-in-95 duration-300">
          <div className="bg-slate-900 dark:bg-slate-950 p-6 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-blue-400">AMS AI</h4>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-[10px] text-slate-400 font-bold">Neural Engine Active</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/50 custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-md' 
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 rounded-tl-none shadow-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
                  <Loader2 size={16} className="animate-spin text-blue-600 dark:text-blue-400" />
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Processing...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className="relative">
              <input 
                type="text"
                placeholder="Type your query..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl pl-5 pr-14 py-4 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 transition-all font-bold text-sm dark:text-white dark:placeholder:text-slate-700"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-2 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 transition-all shadow-lg active:scale-95"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-center text-[8px] text-slate-400 dark:text-slate-600 mt-3 font-black uppercase tracking-[0.2em]">
              Powered by AMS Intelligence Core
            </p>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-slate-900 dark:bg-blue-600 w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-900/40 hover:scale-110 active:scale-95 transition-all group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Bot size={28} className="relative z-10" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 dark:bg-emerald-500 border-4 border-slate-50 dark:border-slate-950 rounded-full animate-bounce"></div>
        </button>
      )}
    </div>
  );
};

export default AIAssistant;