
import React, { useState, useRef, useEffect } from 'react';
import { LocationData, ChatMessage } from '../types';
import { chatWithGemini } from '../services/geminiService';
import ScrollingBackButton from './ScrollingBackButton';

interface WasteChatProps {
  onBack: () => void;
  location: LocationData;
}

const WasteChat: React.FC<WasteChatProps> = ({ onBack, location }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: `Hi there! I'm your Waste Assistant. Got questions about recycling, trash, or rules in ${location.address || 'your area'}? Ask me anything!` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const context = messages.map(m => ({ role: m.role, text: m.text }));
    const aiResponse = await chatWithGemini(context, `User at ${location.address} says: ${userMsg}`);
    
    setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right duration-300 max-h-[80vh]">
      <div className="flex items-center space-x-2 mb-4 shrink-0">
        <button onClick={onBack} className="text-indigo-600"><i className="fa-solid fa-arrow-left text-xl"></i></button>
        <h2 className="text-2xl font-bold text-gray-800">Waste Rules AI</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1 scrollbar-hide">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-white border border-indigo-50 text-indigo-900 rounded-bl-none'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-indigo-50 p-3 rounded-2xl rounded-bl-none shadow-sm">
              <i className="fa-solid fa-ellipsis fa-bounce text-indigo-400"></i>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="pt-4 shrink-0">
        <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl border border-indigo-100 shadow-lg">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Can I recycle pizza boxes?"
            className="flex-1 p-3 focus:outline-none bg-transparent"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-indigo-600 text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
      
      <ScrollingBackButton onBack={onBack} showHomeButton={true} />
    </div>
  );
};

export default WasteChat;
