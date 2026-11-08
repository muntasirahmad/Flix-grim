import React, { useState, useEffect } from 'react';
import { ModelOption, ChatMessage, ChatSession, AppSettings } from './types';
import { MODELS } from './config/models';
import { Header } from './components/Header';
import { ModelDropdown } from './components/ModelDropdown';
import { ChatArea } from './components/ChatArea';
import { InputArea } from './components/InputArea';
import { HistoryDrawer } from './components/HistoryDrawer';
import { SettingsModal } from './components/SettingsModal';
import { UpgradeModal } from './components/UpgradeModal';
import { NativeCodeModal } from './components/NativeCodeModal';
import { GoogleChatModal } from './components/GoogleChatModal';
import { auth, db, testFirestoreConnection, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

// Initial preloaded sessions matching the user's initial history
const INITIAL_SESSIONS: ChatSession[] = [
  {
    id: 'session-1',
    title: 'Flix Grim AI Setup Discussion',
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000 * 2,
    modelId: 'gemini',
    messages: [
      {
        id: 101,
        sender: 'user',
        text: 'How should we architect the Flix Grim multi-model AI assistant?',
        timestamp: '10:14 AM',
      },
      {
        id: 102,
        sender: 'ai',
        modelName: 'Flix Grim Auto (Gemini)',
        text: `[Flix Grim Auto (Gemini)] Response: Aapka Flix Grim app successfully kaam kar raha hai!

### **Flix Grim Architecture Blueprint**

To build an ultra-responsive multi-model AI assistant:

1. **Unified Interface**: Seamlessly switch between Gemini 3.8, DeepSeek R1, Groq Llama 3.3, Qwen 2.5, and GLM-5.
2. **Context Preservation**: Persistent history sessions with search, rename, and export.
3. **Optimized Inference**: Real server-side Google Gemini integration with smart local fallback.

Aapka Flix Grim AI system fully operational hai! Ready to assist you with coding, architecture, and reasoning.`,
        timestamp: '10:15 AM',
      },
    ],
  },
  {
    id: 'session-2',
    title: 'React Native Multi-Model Integration',
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 24,
    modelId: 'groq',
    messages: [
      {
        id: 201,
        sender: 'user',
        text: 'What are the essential dependencies for React Native setup?',
        timestamp: 'Yesterday',
      },
      {
        id: 202,
        sender: 'ai',
        modelName: 'Groq Llama 3.3',
        text: `Here are the foundational libraries for a modern React Native Android application:

\`\`\`bash
# Navigation & UI Gestures
npm install @react-navigation/native @react-navigation/stack react-native-screens react-native-safe-area-context

# Multi-Model State Management
npm install zustand @react-native-async-storage/async-storage
\`\`\`

All 7 models in Flix Grim are synchronized and ready to answer your questions!`,
        timestamp: 'Yesterday',
      },
    ],
  },
];

const DEFAULT_GEMINI_KEY = '';

const DEFAULT_SETTINGS: AppSettings = {
  geminiKey: DEFAULT_GEMINI_KEY,
  githubModelsKey: '',
  chatgptKey: '',
  claudeKey: '',
  kimiKey: '',
  deepseekKey: '',
  qwenKey: '',
  groqKey: '',
  glmKey: '',
  systemInstruction: '',
  temperature: 0.7,
  theme: 'dark',
  soundEnabled: true,
  streamEnabled: true,
  activeModels: ['gemini', 'chatgpt', 'claude', 'kimi', 'deepseek', 'deepseek-v1', 'qwen', 'groq', 'glm', 'llama', 'mistral', 'phi', 'cohere', 'grok'],
};

export default function App() {
  // Model selection
  const [selectedModel, setSelectedModel] = useState<ModelOption>(MODELS[0]);

  // Input & Messaging
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sessions and History
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('flix_grim_sessions');
      return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
    } catch {
      return INITIAL_SESSIONS;
    }
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions.length > 0 ? sessions[0].id : 'new-session';
  });

  // Current active messages derived from active session
  const currentSession = sessions.find((s) => s.id === activeSessionId);
  const messages = currentSession ? currentSession.messages : [];

  // Modals visibility (matching user's state names)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isNativeCodeOpen, setIsNativeCodeOpen] = useState(false);
  const [isGoogleChatOpen, setIsGoogleChatOpen] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);

  // Test Firestore connection on boot per Firebase guidelines
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Sync auth state and load user's sessions from Cloud SQL and Firestore
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (user) {
        // Sync user profile to Firestore
        try {
          const userDocPath = `users/${user.uid}`;
          await setDoc(
            doc(db, 'users', user.uid),
            {
              uid: user.uid,
              email: user.email || `${user.uid}@flixgrim.ai`,
              displayName: user.displayName || null,
              photoUrl: user.photoURL || null,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn('Firestore sync note:', err);
        }

        try {
          const idToken = await user.getIdToken();
          const res = await fetch('/api/db/sessions', {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.sessions && data.sessions.length > 0) {
              setSessions(data.sessions);
              setActiveSessionId(data.sessions[0].id);
            }
          }
        } catch (e) {
          console.error('Failed to sync Cloud SQL sessions:', e);
        }
      }
    });
    return () => unsub();
  }, []);

  // Mobile Device Frame mode toggle (true = mobile phone frame; false = full screen)
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  // Pro Subscription State
  const [isProUser, setIsProUser] = useState(() => {
    return localStorage.getItem('flix_grim_pro') === 'true';
  });

  // Settings & API Keys
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('flix_grim_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.geminiKey || parsed.geminiKey === 'MY_GEMINI_API_KEY') {
          parsed.geminiKey = DEFAULT_GEMINI_KEY;
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [hasServerGeminiKey, setHasServerGeminiKey] = useState(false);

  // Check health and server configuration
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasGeminiKey) {
          setHasServerGeminiKey(true);
        }
      })
      .catch(() => {});
  }, []);

  // Auto Reset to New Chat when minimizing/switching the app (equivalent to AppState listener)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Reset active conversation on background/exit
        handleNewChat();
      } else if (document.visibilityState === 'visible') {
        // Auto focus input when returning
        setTimeout(() => {
          const inputEl = document.querySelector('textarea') as HTMLTextAreaElement | null;
          inputEl?.focus();
        }, 300);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('flix_grim_sessions', JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions:', e);
    }
  }, [sessions]);

  // Sync settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('flix_grim_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }, [settings]);

  // Sync Pro status to localStorage
  useEffect(() => {
    localStorage.setItem('flix_grim_pro', isProUser ? 'true' : 'false');
  }, [isProUser]);

  // Handle send message
  const handleSend = async (overridePrompt?: string) => {
    // Check if model requires active Pro subscription
    if (selectedModel.isPro && !isProUser) {
      setIsUpgradeOpen(true);
      return;
    }

    const textToSend = overridePrompt !== undefined ? overridePrompt : inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMessageText = textToSend.trim();
    const timeString = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: ChatMessage = {
      id: Date.now(),
      text: userMessageText,
      sender: 'user',
      timestamp: timeString,
    };

    setInputText('');

    // Ensure we have an active session
    let targetSessionId = activeSessionId;
    let updatedSessions = [...sessions];

    const sessionIndex = updatedSessions.findIndex((s) => s.id === targetSessionId);

    if (sessionIndex === -1) {
      const newSession: ChatSession = {
        id: 'session-' + Date.now(),
        title: userMessageText.slice(0, 32) + (userMessageText.length > 32 ? '...' : ''),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        modelId: selectedModel.id,
        messages: [userMsg],
      };
      updatedSessions.unshift(newSession);
      targetSessionId = newSession.id;
      setActiveSessionId(newSession.id);
      setSessions(updatedSessions);
    } else {
      // Append user message
      const targetSession = updatedSessions[sessionIndex];
      const newMessages = [...targetSession.messages, userMsg];
      
      // Auto-title if it's the first message or default title
      const newTitle =
        targetSession.messages.length === 0
          ? userMessageText.slice(0, 32) + (userMessageText.length > 32 ? '...' : '')
          : targetSession.title;

      updatedSessions[sessionIndex] = {
        ...targetSession,
        title: newTitle,
        updatedAt: Date.now(),
        modelId: selectedModel.id,
        messages: newMessages,
      };
      setSessions(updatedSessions);
    }

    setIsLoading(true);

    try {
      // Build conversation payload
      const currentMsgs = sessionIndex !== -1 ? updatedSessions[sessionIndex].messages : [userMsg];
      const payloadMessages = currentMsgs.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'ai',
        content: m.text,
      }));

      const aiMsgId = Date.now() + 1;
      let accumulatedText = '';
      let modelDisplayName = selectedModel.name;

      // Add placeholder message for live streaming
      const initialAiMsg: ChatMessage = {
        id: aiMsgId,
        text: '',
        sender: 'ai',
        modelId: selectedModel.id,
        modelName: selectedModel.name,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? {
                ...s,
                updatedAt: Date.now(),
                messages: [...s.messages, initialAiMsg],
              }
            : s
        )
      );

      // Attempt live streaming from server
      let streamSucceeded = false;
      if (selectedModel.id === 'gemini' || selectedModel.id === 'glm') {
        try {
        const streamRes = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelId: selectedModel.id,
            messages: payloadMessages,
            prompt: userMessageText,
            systemInstruction: settings.systemInstruction,
            temperature: settings.temperature,
            userKeys: {
              gemini: settings.geminiKey,
              githubModels: settings.githubModelsKey,
              chatgpt: settings.chatgptKey,
              claude: settings.claudeKey,
              kimi: settings.kimiKey,
              deepseek: settings.deepseekKey,
              qwen: settings.qwenKey,
              groq: settings.groqKey,
              glm: settings.glmKey,
            },
          }),
        });

        if (streamRes.ok && streamRes.body) {
          const reader = streamRes.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                try {
                  const data = JSON.parse(trimmed.slice(6));
                  if (data.text) {
                    accumulatedText += data.text;
                    streamSucceeded = true;
                    setSessions((prev) =>
                      prev.map((s) =>
                        s.id === targetSessionId
                          ? {
                              ...s,
                              messages: s.messages.map((m) =>
                                m.id === aiMsgId ? { ...m, text: accumulatedText } : m
                              ),
                            }
                          : s
                      )
                    );
                  }
                  if (data.model) {
                    modelDisplayName = data.model;
                  }
                } catch {}
              }
            }
          }
        }
        } catch (streamErr) {
          console.warn('Stream failed, falling back to batch API:', streamErr);
        }
      }

      // If streaming was empty or failed, fallback to standard /api/chat
      if (!streamSucceeded || !accumulatedText.trim()) {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelId: selectedModel.id,
            messages: payloadMessages,
            prompt: userMessageText,
            systemInstruction: settings.systemInstruction,
            temperature: settings.temperature,
            userKeys: {
              gemini: settings.geminiKey,
              githubModels: settings.githubModelsKey,
              chatgpt: settings.chatgptKey,
              claude: settings.claudeKey,
              kimi: settings.kimiKey,
              deepseek: settings.deepseekKey,
              qwen: settings.qwenKey,
              groq: settings.groqKey,
              glm: settings.glmKey,
            },
          }),
        });

        const data = await res.json();
        accumulatedText = data.text || data.fallback || `[${selectedModel.name}] Could not retrieve response.`;
        modelDisplayName = data.model || selectedModel.name;

        setSessions((prev) =>
          prev.map((s) =>
            s.id === targetSessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === aiMsgId
                      ? { ...m, text: accumulatedText, modelName: modelDisplayName, isError: !res.ok }
                      : m
                  ),
                }
              : s
          )
        );
      } else {
        // Finalize model name
        setSessions((prev) =>
          prev.map((s) =>
            s.id === targetSessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === aiMsgId ? { ...m, modelName: modelDisplayName } : m
                  ),
                }
              : s
          )
        );
      }
    } catch (err: any) {
      console.error('Error querying chat API:', err);
      // Fallback message on unexpected connection failure
      const fallbackAiMsg: ChatMessage = {
        id: Date.now() + 1,
        text: `Server se connect karne me network issue aaya. Kripya apna internet check karein aur dobara message bhejein.`,
        sender: 'ai',
        modelId: selectedModel.id,
        modelName: selectedModel.name,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isError: true,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? {
                ...s,
                updatedAt: Date.now(),
                messages: [...s.messages, fallbackAiMsg],
              }
            : s
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Create brand new chat
  const handleNewChat = () => {
    const newSessionId = 'session-' + Date.now();
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      modelId: selectedModel.id,
      messages: [],
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
    setInputText('');
  };

  // Delete chat session
  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (activeSessionId === id) {
        setActiveSessionId(remaining.length > 0 ? remaining[0].id : '');
      }
      return remaining;
    });
  };

  // Rename session
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  };

  // Clear all chats
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all chat history?')) {
      setSessions([]);
      setActiveSessionId('');
    }
  };

  // Regenerate last response
  const handleRetryLastMessage = () => {
    if (messages.length < 2) return;
    const lastUser = [...messages].reverse().find((m) => m.sender === 'user');
    if (lastUser) {
      handleSend(lastUser.text);
    }
  };

  // Select starter prompt
  const handleSelectStarterPrompt = (prompt: string) => {
    handleSend(prompt);
  };

  // Determine theme background
  const getThemeBg = () => {
    if (settings.theme === 'oled') return 'bg-black';
    if (settings.theme === 'cyber') return 'bg-[#0c1322]';
    return 'bg-[#0b0f19]';
  };

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center transition-colors duration-200 ${
        isMobileFrame ? 'bg-[#05070d] p-0 sm:p-6' : getThemeBg()
      }`}
    >
      {/* Mobile App Bezel Wrapper (when in Mobile View) or Full Width Container */}
      <div
        className={`w-full flex flex-col overflow-hidden transition-all duration-300 relative ${
          isMobileFrame
            ? 'max-w-[420px] h-[100dvh] sm:h-[840px] sm:rounded-[40px] sm:border-[8px] sm:border-gray-800 sm:shadow-2xl sm:shadow-blue-900/20'
            : 'h-[100dvh] max-w-full'
        } ${getThemeBg()}`}
      >
        {/* Mobile speaker notch indicator (visible when in device frame mode on desktop) */}
        {isMobileFrame && (
          <div className="hidden sm:flex justify-center pt-2 pb-1 bg-[#0b0f19] shrink-0">
            <div className="w-20 h-4 bg-gray-900 rounded-full flex items-center justify-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-gray-800"></div>
              <div className="w-8 h-1.5 rounded-full bg-gray-800"></div>
            </div>
          </div>
        )}

        {/* Header Bar */}
        <Header
          selectedModel={selectedModel}
          isModelDropdownOpen={isModelDropdownOpen}
          setIsModelDropdownOpen={setIsModelDropdownOpen}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenUpgrade={() => setIsUpgradeOpen(true)}
          onOpenNativeCode={() => setIsNativeCodeOpen(true)}
          onOpenGoogleChat={() => setIsGoogleChatOpen(true)}
          isProUser={isProUser}
          isMobileFrame={isMobileFrame}
          setIsMobileFrame={setIsMobileFrame}
        />

        {/* Model Switcher Dropdown Menu */}
        <ModelDropdown
          isOpen={isModelDropdownOpen}
          selectedModel={selectedModel}
          onSelectModel={(model) => setSelectedModel(model)}
          onClose={() => setIsModelDropdownOpen(false)}
          isProUser={isProUser}
          onTriggerUpgrade={() => setIsUpgradeOpen(true)}
        />

        {/* Main Chat Area */}
        <ChatArea
          messages={messages}
          selectedModel={selectedModel}
          isLoading={isLoading}
          onSelectPrompt={handleSelectStarterPrompt}
          onRetryMessage={messages.length > 1 ? handleRetryLastMessage : undefined}
        />

        {/* Input Box Area with Auto Keyboard Focus */}
        <InputArea
          inputText={inputText}
          setInputText={setInputText}
          onSend={() => handleSend()}
          selectedModel={selectedModel}
          isLoading={isLoading}
        />

        {/* Sidebar History Drawer */}
        <HistoryDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={(id) => setActiveSessionId(id)}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
          onClearAll={handleClearAll}
        />

        {/* Settings Screen Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSaveSettings={(newSettings) => setSettings(newSettings)}
          hasServerGeminiKey={hasServerGeminiKey}
        />

        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={isUpgradeOpen}
          onClose={() => setIsUpgradeOpen(false)}
          isProUser={isProUser}
          onUpgradeSuccess={(planId) => {
            setIsProUser(true);
            localStorage.setItem('flix_grim_pro', 'true');
            localStorage.setItem('flix_grim_plan', planId);
            if (authUser) {
              authUser.getIdToken().then((token) => {
                fetch('/api/user/upgrade-pro', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ planId }),
                }).catch(() => {});
              });
            }
          }}
        />

        {/* Android React Native Code Viewer Modal */}
        <NativeCodeModal
          isOpen={isNativeCodeOpen}
          onClose={() => setIsNativeCodeOpen(false)}
        />

        {/* Google Chat Integration Modal */}
        <GoogleChatModal
          isOpen={isGoogleChatOpen}
          onClose={() => setIsGoogleChatOpen(false)}
          currentSession={currentSession}
        />
      </div>
    </div>
  );
}
