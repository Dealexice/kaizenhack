'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import CitationChip from '@/components/CitationChip';

const GUIDED_PROMPTS = [
  'Analyse my latest feedback and identify key strengths and weaknesses.',
  'Which learning outcomes do I need to focus on most?',
  'What recurring issues appear across my assessments?',
  'Suggest specific actions I can take to improve.',
];

export default function ChatPanel({ moduleId, allChunks, onCitationClick }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  async function sendMessage(text) {
    if (!text.trim() || isTyping) return;
    const userMsg = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          chatHistory: messages,
          chunks: allChunks,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: data.reply,
          citedChunks: data.citedChunks || [],
        },
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `Sorry, I couldn't respond right now. ${err.message}`,
          citedChunks: [],
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  function renderContent(content) {
    if (!content) return null;
    // Parse [[chunk_id]] citations into clickable chips
    const parts = content.split(/(\[\[[^\]]+\]\])/g);
    return parts.map((part, i) => {
      const match = part.match(/^\[\[([^\]]+)\]\]$/);
      if (match) {
        return (
          <CitationChip
            key={i}
            chunkId={match[1]}
            index={i}
            onClick={() => onCitationClick(match[1])}
          />
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Panel Header */}
      <div className="p-4 border-b border-[#E5E5E7] flex-shrink-0">
        <h2 className="font-semibold text-sm text-[#1A1A1A]">Reflect</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Chat with your reflection coach
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="text-4xl mb-4">👋</div>
            <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">
              Let&apos;s start reflecting...
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              This is a space to explore your feedback, understand your
              strengths, and plan your growth. Upload sources on the left, then
              ask me to analyse them.
            </p>
            <div className="space-y-2 w-full max-w-sm">
              {GUIDED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  className="w-full text-left px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-[#E12726] hover:text-[#E12726] transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            } animate-fade-in-up`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#E12726] text-white rounded-br-md'
                  : 'bg-[#F5F5F7] text-[#1A1A1A] rounded-bl-md'
              }`}
            >
              <div className="whitespace-pre-wrap">
                {renderContent(msg.content)}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-fade-in-up">
            <div className="bg-[#F5F5F7] px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1.5">
              <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
              <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
              <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#E5E5E7] flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question or create content..."
              disabled={isTyping}
              className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-full focus:ring-2 focus:ring-[#E12726] focus:border-transparent outline-none text-sm disabled:opacity-50"
            />
            <Sparkles
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300"
            />
          </div>
          <button
            type="submit"
            disabled={isTyping || !input.trim()}
            className="p-2.5 bg-[#E12726] hover:bg-[#C41F1E] text-white rounded-full transition-colors disabled:opacity-40 cursor-pointer flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </form>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          Zen Learn may provide inaccurate information; please double-check the
          answers you receive.
        </p>
      </div>
    </div>
  );
}
