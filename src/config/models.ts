import { ModelOption, SubscriptionPlan } from '../types';

export const UPI_CONFIG = {
  payeeVpa: '8294976432@ptsbi',
  payeeName: 'Yasmin Pravin',
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: '1-month',
    title: '1 Month Pro Pass',
    duration: '30 Days Access',
    price: 10,
    upiUrl: `upi://pay?pa=8294976432@ptsbi&pn=Yasmin%20Pravin&am=10&cu=INR`,
    popular: false,
  },
  {
    id: '1-year',
    title: '1 Year Pro Pass',
    duration: '365 Days Access',
    price: 100,
    originalPrice: 120,
    discountText: 'Special Offer - Save ₹20',
    upiUrl: `upi://pay?pa=8294976432@ptsbi&pn=Yasmin%20Pravin&am=100&cu=INR`,
    popular: true,
  },
];

export const MODELS: ModelOption[] = [
  // --- FREE MODELS ---
  {
    id: 'gemini',
    name: 'Google Gemini (Flix Grim Auto)',
    provider: 'Google AI',
    badge: 'Free Auto',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    description: 'High-speed reasoning, coding, and general multimodal intelligence.',
    maxTokens: '1M Context',
    isPro: false,
    supportsThinking: true,
  },
  {
    id: 'qwen',
    name: 'Qwen 2.5 (Alibaba)',
    provider: 'Alibaba Cloud',
    badge: 'Free Tier',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    description: 'Exceptional coding, math, and cross-language translation capabilities.',
    maxTokens: '128K Context',
    isPro: false,
    supportsThinking: false,
  },
  {
    id: 'groq',
    name: 'Groq (Llama 3.3)',
    provider: 'Groq LPUs',
    badge: 'Ultra Fast',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    description: 'Blazing-fast inference powered by Groq LPU processing architecture.',
    maxTokens: '128K Context',
    isPro: false,
    supportsThinking: false,
  },

  // --- PAID / PRO MODELS (Requires Active Subscription) ---
  {
    id: 'chatgpt',
    name: 'ChatGPT (OpenAI GPT-4o)',
    provider: 'OpenAI',
    badge: 'PRO',
    badgeColor: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/40',
    description: 'Flagship multimodal intelligence with superior reasoning and creative flair.',
    maxTokens: '128K Context',
    isPro: true,
    supportsThinking: true,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek (R1/V3)',
    provider: 'DeepSeek AI',
    badge: 'PRO',
    badgeColor: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/40',
    description: 'Deep mathematical reasoning with explicit chain-of-thought analysis.',
    maxTokens: '64K Context',
    isPro: true,
    supportsThinking: true,
  },
  {
    id: 'kimi',
    name: 'Kimi AI (Moonshot)',
    provider: 'Moonshot AI',
    badge: 'PRO',
    badgeColor: 'bg-gradient-to-r from-rose-500/20 to-pink-500/20 text-rose-400 border-rose-500/40',
    description: 'Super long-context champion for documents, books, and deep research synthesis.',
    maxTokens: '200K Context',
    isPro: true,
    supportsThinking: false,
  },
  {
    id: 'glm',
    name: 'GLM-5 (Z.ai)',
    provider: 'Zhipu AI',
    badge: 'PRO',
    badgeColor: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/40',
    description: 'Advanced bilingual reasoning model for complex coding and agentic workflows.',
    maxTokens: '1M Context',
    isPro: true,
    supportsThinking: false,
  },
];

export const STARTER_PROMPTS = [
  {
    icon: '⚡',
    label: 'React Native Setup',
    prompt: 'What are the essential dependencies for React Native Android multi-model integration?',
  },
  {
    icon: '🔍',
    label: 'Hidden Web Search',
    prompt: 'Search the latest React Native 0.76 architecture changes and Hermes engine performance.',
  },
  {
    icon: '🎥',
    label: 'YouTube Tutorial Index',
    prompt: 'Find YouTube video tutorial on React Native AppState lifecycle listener.',
  },
  {
    icon: '🧠',
    label: 'DeepSeek R1 vs GPT-4o',
    prompt: 'Compare DeepSeek R1 cold-start reasoning with OpenAI GPT-4o reasoning tokens.',
  },
];
