import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage, ModelOption } from '../types';
import { STARTER_PROMPTS } from '../config/models';
import { renderMarkdown, extractReasoning } from '../utils/markdown';
import { Copy, Check, Volume2, RotateCcw, Brain, Sparkles, AlertCircle } from 'lucide-react';

interface ChatAreaProps {
  messages: ChatMessage[];
  selectedModel: ModelOption;
  isLoading: boolean;
  onSelectPrompt: (prompt: string) => void;
  onRetryMessage?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  selectedModel,
  isLoading,
  onSelectPrompt,
  onRetryMessage,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [isSpeakingId, setIsSpeakingId] = useState<string | number | null>(null);
  const [openThoughts, setOpenThoughts] = useState<Record<string | number, boolean>>({});

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  const handleCopy = (id: string | number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id: string | number, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeakingId === id) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/<[^>]*>?/gm, '').replace(/[#*`_~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.onend = () => setIsSpeakingId(null);
    utterance.onerror = () => setIsSpeakingId(null);

    setIsSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const toggleThought = (id: string | number) => {
    setOpenThoughts(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4"
    >
      {messages.length === 0 ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-500 shadow-lg shadow-blue-500/5">
            <span className="text-3xl leading-none font-serif">✦</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-200 mb-2">
            Any new ideas to explore?
          </h2>
          <p className="text-sm text-gray-400 max-w-md mb-8">
            Flix Grim connects you to Google Gemini, ChatGPT GPT-4o, DeepSeek R1, Kimi AI, Qwen 2.5, Groq & GLM-4.
          </p>

          <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
            {STARTER_PROMPTS.map((starter, idx) => (
              <button
                key={idx}
                onClick={() => onSelectPrompt(starter.prompt)}
                className="p-3 bg-gray-900/60 hover:bg-gray-800/80 border border-gray-800 hover:border-gray-700 rounded-xl transition-all text-xs group cursor-pointer text-gray-300 hover:text-white"
              >
                <div className="flex items-center space-x-2 font-medium mb-1 text-gray-200 group-hover:text-blue-400">
                  <span>{starter.icon}</span>
                  <span>{starter.label}</span>
                </div>
                <div className="text-[11px] text-gray-500 line-clamp-2">
                  {starter.prompt}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const { reasoning, content } = isUser
            ? { reasoning: undefined, content: msg.text }
            : extractReasoning(msg.text);

          const isThoughtOpen = openThoughts[msg.id] ?? false;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              {/* Sender label / Model header for AI */}
              {!isUser && (
                <div className="flex items-center space-x-2 mb-1.5 px-1">
                  <div className="w-5 h-5 rounded-md bg-blue-600/30 border border-blue-500/40 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className="text-xs font-semibold text-gray-300">
                    {msg.modelName || selectedModel.name}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {msg.timestamp}
                  </span>
                </div>
              )}

              {/* Message Bubble Container */}
              <div
                className={`rounded-2xl px-4 py-3 max-w-[92%] sm:max-w-[85%] text-sm leading-relaxed transition-all shadow-md ${
                  isUser
                    ? 'bg-[#1d4ed8] text-white rounded-tr-none'
                    : msg.isError
                    ? 'bg-red-950/40 border border-red-500/40 text-red-200 rounded-tl-none'
                    : 'bg-[#1f2937] text-gray-100 border border-gray-800/80 rounded-tl-none'
                }`}
              >
                {/* Reasoning Accordion (DeepSeek R1 / Thought process) */}
                {reasoning && (
                  <div className="mb-3 border border-emerald-500/30 rounded-xl bg-emerald-950/20 overflow-hidden text-xs">
                    <button
                      onClick={() => toggleThought(msg.id)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-emerald-900/20 hover:bg-emerald-900/30 text-emerald-400 font-medium transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-1.5">
                        <Brain className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        <span>Chain-of-Thought Reasoning</span>
                      </div>
                      <span className="text-[10px] uppercase font-mono tracking-wider">
                        {isThoughtOpen ? 'Hide' : 'View'}
                      </span>
                    </button>
                    {isThoughtOpen && (
                      <div className="p-3 text-gray-300 whitespace-pre-wrap font-mono text-[11px] leading-normal border-t border-emerald-500/20 bg-black/20">
                        {reasoning}
                      </div>
                    )}
                  </div>
                )}

                {/* Content rendering */}
                {isUser ? (
                  <p className="whitespace-pre-wrap">{content}</p>
                ) : (
                  <div
                    className="prose-dark overflow-x-auto"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(content),
                    }}
                  />
                )}
              </div>

              {/* Action buttons under AI message */}
              {!isUser && (
                <div className="flex items-center space-x-1 mt-1.5 px-1 text-gray-400">
                  <button
                    onClick={() => handleCopy(msg.id, content)}
                    className="p-1 hover:text-white hover:bg-gray-800/60 rounded-md transition-colors text-xs flex items-center space-x-1 cursor-pointer"
                    title="Copy message"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[11px] text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleSpeak(msg.id, content)}
                    className={`p-1 hover:text-white hover:bg-gray-800/60 rounded-md transition-colors text-xs flex items-center space-x-1 cursor-pointer ${
                      isSpeakingId === msg.id ? 'text-blue-400' : ''
                    }`}
                    title={isSpeakingId === msg.id ? 'Stop audio' : 'Read aloud'}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span className="text-[11px]">
                      {isSpeakingId === msg.id ? 'Playing' : 'Listen'}
                    </span>
                  </button>

                  {onRetryMessage && (
                    <button
                      onClick={onRetryMessage}
                      className="p-1 hover:text-white hover:bg-gray-800/60 rounded-md transition-colors text-xs flex items-center space-x-1 cursor-pointer"
                      title="Regenerate response"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Regenerate</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Background Processing & Async Typing Indicator */}
      {isLoading && (
        <div className="flex items-start space-x-2 py-2 animate-in fade-in duration-200">
          <div className="w-6 h-6 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
          </div>
          <div className="bg-[#1f2937] border border-gray-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-lg flex flex-col space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-200 font-medium">
                {selectedModel.name}
              </span>
              <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 font-mono">
                Background Processing
              </span>
              <div className="flex space-x-1 pl-1">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
              <span>Synthesizing neural reasoning & background web knowledge...</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
