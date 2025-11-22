import React, { useState, useEffect, useRef } from 'react';
import { Send, MapPin, Globe, BrainCircuit, Loader2, Sparkles, X } from 'lucide-react';
import { sendMessageToGemini, sendThinkingMessage } from '../services/geminiService.ts';
import { Message } from '../types.ts';

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIChat: React.FC<AIChatProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'init', 
      role: 'model', 
      text: "Hello! I am Malin. How can I help you with your crypto journey today? I can analyze markets, find ATMs, or explain complex topics." 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'standard' | 'search' | 'maps' | 'thinking'>('standard');
  const [location, setLocation] = useState<{lat: number, lng: number} | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => console.log("Loc access denied", err)
      );
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      let responseText = '';
      let sources: any[] = [];
      let mapLocs: any[] = [];

      if (mode === 'thinking') {
        const res = await sendThinkingMessage(input);
        responseText = res.text || "I couldn't generate a thought.";
      } else {
        // Prepare history for context
        const history = messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

        const res = await sendMessageToGemini(
          input, 
          history, 
          mode === 'search', 
          mode === 'maps', 
          location
        );
        
        responseText = res.text || "I have nothing to say.";
        
        // Extract grounding
        const chunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
          chunks.forEach((chunk: any) => {
             if (chunk.web?.uri) {
               sources.push({ uri: chunk.web.uri, title: chunk.web.title });
             }
             if (chunk.maps?.uri) {
               mapLocs.push({ uri: chunk.maps.uri, title: chunk.maps.title || "Location" });
             }
          });
        }
      }

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        isThinking: mode === 'thinking',
        sources: sources.length > 0 ? sources : undefined,
        mapLocations: mapLocs.length > 0 ? mapLocs : undefined
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Sorry, I encountered an error connecting to the Malin Network." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-2xl h-[80vh] rounded-3xl border border-slate-800 flex flex-col shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white">Malin AI</h3>
              <p className="text-xs text-slate-400">Powered by Gemini 2.5 & 3 Pro</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-sm' 
                  : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'
              }`}>
                {msg.isThinking && (
                   <div className="flex items-center gap-2 mb-2 text-xs text-purple-400 font-medium uppercase tracking-wider">
                     <BrainCircuit size={14} />
                     Deep Thinking Analysis
                   </div>
                )}
                <div className="whitespace-pre-wrap leading-relaxed text-sm">
                  {msg.text}
                </div>

                {/* Grounding Sources */}
                {msg.sources && (
                  <div className="mt-4 pt-3 border-t border-slate-700">
                    <p className="text-xs text-slate-400 mb-2">Sources:</p>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((s, idx) => (
                        <a key={idx} href={s.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs bg-slate-900 hover:bg-slate-950 text-indigo-400 px-2 py-1 rounded border border-slate-700 transition">
                          <Globe size={10} /> {s.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                 {/* Map Locations */}
                 {msg.mapLocations && (
                  <div className="mt-4 pt-3 border-t border-slate-700">
                    <p className="text-xs text-slate-400 mb-2">Locations Found:</p>
                    <div className="flex flex-wrap gap-2">
                      {msg.mapLocations.map((s, idx) => (
                        <a key={idx} href={s.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs bg-slate-900 hover:bg-slate-950 text-emerald-400 px-2 py-1 rounded border border-slate-700 transition">
                          <MapPin size={10} /> {s.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
                 <Loader2 className="animate-spin text-indigo-500" size={20} />
                 <span className="text-slate-400 text-sm">Malin is processing...</span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Controls */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
            <button 
              onClick={() => setMode('standard')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition flex items-center gap-1 ${mode === 'standard' ? 'bg-slate-100 text-slate-900 border-slate-100' : 'text-slate-400 border-slate-700 hover:border-slate-500'}`}
            >
              <Sparkles size={12} /> Chat
            </button>
            <button 
              onClick={() => setMode('thinking')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition flex items-center gap-1 ${mode === 'thinking' ? 'bg-purple-600 text-white border-purple-600' : 'text-slate-400 border-slate-700 hover:border-slate-500'}`}
            >
              <BrainCircuit size={12} /> Deep Think
            </button>
            <button 
              onClick={() => setMode('search')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition flex items-center gap-1 ${mode === 'search' ? 'bg-blue-600 text-white border-blue-600' : 'text-slate-400 border-slate-700 hover:border-slate-500'}`}
            >
              <Globe size={12} /> Live Search
            </button>
            <button 
              onClick={() => setMode('maps')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition flex items-center gap-1 ${mode === 'maps' ? 'bg-emerald-600 text-white border-emerald-600' : 'text-slate-400 border-slate-700 hover:border-slate-500'}`}
            >
              <MapPin size={12} /> Maps
            </button>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 focus-within:border-indigo-500 transition">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Ask Malin (${mode} mode)...`}
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
            <button 
              disabled={isLoading || !input.trim()}
              onClick={handleSend}
              className="p-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;