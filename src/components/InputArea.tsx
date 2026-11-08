import React, { useRef, useEffect, useState } from 'react';
import { ModelOption } from '../types';
import { ArrowRight, Mic, MicOff, Paperclip, X, FileText, Loader2 } from 'lucide-react';

interface InputAreaProps {
  inputText: string;
  setInputText: (text: string) => void;
  onSend: () => void;
  selectedModel: ModelOption;
  isLoading: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({
  inputText,
  setInputText,
  onSend,
  selectedModel,
  isLoading,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [attachedDocument, setAttachedDocument] = useState<{
    name: string;
    size: string;
    content: string;
  } | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Check speech recognition capability
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Auto focus on mount & when model changes
  useEffect(() => {
    textareaRef.current?.focus();
  }, [selectedModel]);

  // Adjust textarea height automatically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  }, [inputText]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && (inputText.trim() || attachedDocument)) {
        handleTriggerSend();
      }
    }
  };

  const handleTriggerSend = () => {
    if (attachedDocument) {
      // Append document content if not already in prompt
      const fullPrompt = `${inputText.trim()}\n\n[Attached Document: ${attachedDocument.name}]\n${attachedDocument.content.slice(0, 4000)}`;
      setInputText(fullPrompt);
      setAttachedDocument(null);
      setTimeout(() => onSend(), 50);
    } else {
      onSend();
    }
  };

  // Web Speech Recognition for voice input
  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your current browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('Listening... Speak now');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (final) {
          setInputText(inputText ? `${inputText} ${final.trim()}` : final.trim());
          setInterimTranscript('');
        } else if (interim) {
          setInterimTranscript(interim);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition notice:', err);
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
      setInterimTranscript('');
    }
  };

  // Handle local text or Google Drive document file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setAttachedDocument({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        content: text,
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="shrink-0 bg-[#111827] border-t border-gray-800/80 px-3 sm:px-4 py-3 relative">
      {/* Hidden file input for document attachment */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.json,.csv,.js,.ts,.tsx,.py,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Voice Listening Waveform Status Indicator */}
      {isListening && (
        <div className="mb-2 flex items-center justify-between px-3.5 py-2 bg-gradient-to-r from-red-950/60 to-purple-950/60 border border-red-500/40 rounded-xl text-xs text-red-200 animate-in fade-in duration-200">
          <div className="flex items-center space-x-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="font-medium">Voice Input Active</span>
            {/* Visualizer soundwave bars */}
            <div className="flex items-center space-x-0.5 h-3">
              <span className="w-0.5 h-2 bg-red-400 animate-pulse"></span>
              <span className="w-0.5 h-3 bg-red-300 animate-pulse [animation-delay:150ms]"></span>
              <span className="w-0.5 h-1.5 bg-red-400 animate-pulse [animation-delay:300ms]"></span>
              <span className="w-0.5 h-3 bg-red-200 animate-pulse [animation-delay:450ms]"></span>
            </div>
            <span className="text-[11px] text-gray-300 italic truncate max-w-[200px] sm:max-w-xs">
              {interimTranscript || 'Speak now...'}
            </span>
          </div>
          <button
            onClick={() => setIsListening(false)}
            className="px-2 py-0.5 bg-red-600/40 hover:bg-red-600/60 rounded-md text-[11px] text-white transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      )}

      {/* Attached Document Preview */}
      {attachedDocument && (
        <div className="mb-2 flex items-center justify-between px-3 py-1.5 bg-gray-800/80 border border-blue-500/30 rounded-lg text-xs text-blue-300">
          <div className="flex items-center space-x-2 truncate">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-medium text-white truncate">{attachedDocument.name}</span>
            <span className="text-[10px] text-gray-400 font-mono">({attachedDocument.size})</span>
          </div>
          <button
            onClick={() => setAttachedDocument(null)}
            className="text-gray-400 hover:text-white ml-2 p-0.5 cursor-pointer"
            title="Remove document"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end space-x-2">
        {/* Attachment / Google Drive Document button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-xl transition-colors shrink-0 mb-0.5 cursor-pointer"
          title="Attach Document or Google Drive File"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Input box */}
        <div className="flex-1 bg-[#1f2937] border border-gray-700/60 focus-within:border-blue-500/80 rounded-2xl px-3.5 py-1.5 transition-all shadow-inner flex items-center">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Listening to your voice...'
                : `Ask ${selectedModel.name}... (Voice or text)`
            }
            className="w-full bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none resize-none max-h-32 py-1 leading-normal"
          />

          {/* Voice Input Microphone Button */}
          <button
            onClick={toggleVoiceInput}
            className={`p-1.5 rounded-lg transition-all ml-1.5 cursor-pointer shrink-0 ${
              isListening
                ? 'bg-red-500/20 text-red-400 scale-110 shadow-sm shadow-red-500/20'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
            title={isListening ? 'Stop voice input' : 'Voice Input (Speech-to-Text)'}
          >
            {isListening ? (
              <MicOff className="w-4 h-4 animate-pulse" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Send Button */}
        <button
          onClick={handleTriggerSend}
          disabled={isLoading || (!inputText.trim() && !attachedDocument)}
          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 shadow-md cursor-pointer ${
            isLoading || (!inputText.trim() && !attachedDocument)
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed shadow-none'
              : 'bg-[#2563eb] hover:bg-blue-600 active:scale-95 text-white shadow-blue-600/30'
          }`}
          title="Send message (Enter)"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : (
            <ArrowRight className="w-5 h-5 text-white" />
          )}
        </button>
      </div>

      <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live Online</span>
          </span>
          <span className="mx-1 text-gray-600">·</span>
          <span>Press <kbd className="bg-gray-800 text-gray-400 px-1 py-0.5 rounded text-[10px]">Enter</kbd> to send</span>
          <span className="mx-1 text-gray-600">·</span>
          <span>Tap <Mic className="w-3 h-3 inline text-blue-400" /> for Voice</span>
        </span>
        <span className="hidden sm:inline font-mono text-emerald-400/80">● {selectedModel.name}</span>
      </div>
    </div>
  );
};
