export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  badge: string;
  badgeColor: string;
  description: string;
  maxTokens: string;
  isPro: boolean;
  supportsThinking?: boolean;
}

export interface ChatMessage {
  id: string | number;
  text: string;
  sender: 'user' | 'ai';
  modelId?: string;
  modelName?: string;
  timestamp: string;
  thoughtProcess?: string;
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  modelId: string;
}

export interface AppSettings {
  geminiKey: string;
  chatgptKey: string;
  kimiKey: string;
  deepseekKey: string;
  groqKey: string;
  glmKey: string;
  systemInstruction: string;
  temperature: number;
  theme: 'dark' | 'oled' | 'cyber';
  soundEnabled: boolean;
  streamEnabled: boolean;
  activeModels: string[];
}

export interface SubscriptionPlan {
  id: '1-month' | '1-year';
  title: string;
  duration: string;
  price: number;
  originalPrice?: number;
  discountText?: string;
  upiUrl: string;
  popular?: boolean;
}
