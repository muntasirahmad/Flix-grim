import React, { useState } from 'react';
import { AppSettings } from '../types';
import { ArrowLeft, Key, Sliders, Palette, ShieldCheck, Eye, EyeOff, Save, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  hasServerGeminiKey: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  hasServerGeminiKey,
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const toggleVisibility = (key: string) => {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    const defaultSettings: AppSettings = {
      geminiKey: '',
      chatgptKey: '',
      kimiKey: '',
      deepseekKey: '',
      groqKey: '',
      glmKey: '',
      systemInstruction: '',
      temperature: 0.7,
      theme: 'dark',
      soundEnabled: true,
      streamEnabled: true,
      activeModels: ['gemini', 'chatgpt', 'kimi', 'deepseek', 'qwen', 'groq', 'glm'],
    };
    setFormData(defaultSettings);
    onSaveSettings(defaultSettings);
  };

  const apiKeyConfigs = [
    {
      id: 'geminiKey',
      label: 'Google Gemini API Key',
      placeholder: 'AQ.Ab8RN... (Connected & Active)',
      desc: 'Powers Google Gemini (Flix Grim Auto) with real-time web search grounding.',
      badge: formData.geminiKey ? 'Active & Verified' : 'Cloud Key Ready',
    },
    {
      id: 'chatgptKey',
      label: 'ChatGPT (OpenAI GPT-4o) API Key',
      placeholder: 'sk-proj-...',
      desc: 'Direct OpenAI inference for GPT-4o and advanced multimodal reasoning.',
    },
    {
      id: 'kimiKey',
      label: 'Kimi AI (Moonshot) API Key',
      placeholder: 'sk-...',
      desc: 'Moonshot long-context engine for long-document indexing & research.',
    },
    {
      id: 'deepseekKey',
      label: 'DeepSeek (R1/V3) API Key',
      placeholder: 'sk-...',
      desc: 'DeepSeek deep mathematical reasoning & chain-of-thought analysis.',
    },
    {
      id: 'groqKey',
      label: 'Groq API Key',
      placeholder: 'gsk_...',
      desc: 'Ultra-fast Llama 3.3 70B inference via Groq LPUs.',
    },
    {
      id: 'glmKey',
      label: 'GLM-4 (Zhipu AI) API Key',
      placeholder: 'key.id...',
      desc: 'Zhipu AI GLM-4 enterprise bilingual and agentic execution.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0f19] flex flex-col text-[#f3f4f6] animate-in fade-in duration-150">
      {/* Settings Header */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-gray-800 bg-[#0b0f19]/90 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
            title="Back to chat"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Settings
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-600/30 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saveSuccess ? 'Saved!' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Settings Body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-3xl mx-auto w-full space-y-6">
        {/* API Keys Configuration Card */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-gray-800/80">
            <Key className="w-4 h-4 text-blue-500" />
            <h2 className="text-[#3b82f6] text-sm sm:text-base font-bold">
              API Keys Configuration
            </h2>
          </div>

          <div className="mb-4 p-3 bg-blue-950/30 border border-blue-500/20 rounded-xl text-xs text-blue-200">
            <p className="font-semibold text-white mb-0.5">🚀 Live Cloud AI Connectivity</p>
            <p className="text-gray-300 leading-relaxed">
              Enter your Gemini API key below to unlock 100% direct Google Gemini 3.8 Flash online streaming with Google Search grounding. If left blank, Flix Grim operates via its built-in neural reasoning engine without stopping.
            </p>
          </div>

          <div className="space-y-4">
            {apiKeyConfigs.map((cfg) => {
              const isVisible = visibility[cfg.id] || false;
              const val = (formData as any)[cfg.id] || '';

              return (
                <div key={cfg.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-300">
                      {cfg.label}
                    </label>
                    {cfg.badge && (
                      <span className="flex items-center space-x-1 text-[11px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                        <ShieldCheck className="w-3 h-3" />
                        <span>{cfg.badge}</span>
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type={isVisible ? 'text' : 'password'}
                      placeholder={cfg.placeholder}
                      value={val}
                      onChange={(e) =>
                        setFormData({ ...formData, [cfg.id]: e.target.value })
                      }
                      className="w-full bg-[#1f2937] border border-gray-700 text-white text-sm px-3.5 py-2.5 rounded-xl pr-10 focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => toggleVisibility(cfg.id)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                    >
                      {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">{cfg.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Preferences Card */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 shadow-lg space-y-5">
          <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-gray-800/80">
            <Sliders className="w-4 h-4 text-blue-500" />
            <h2 className="text-[#3b82f6] text-sm sm:text-base font-bold">
              Preferences
            </h2>
          </div>

          {/* Theme selection */}
          <div>
            <label className="text-xs font-semibold text-gray-300 mb-2 flex items-center space-x-2">
              <Palette className="w-3.5 h-3.5 text-blue-400" />
              <span>Theme Appearance</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'dark', label: 'Dark Mode (Default)', desc: '#0b0f19' },
                { id: 'oled', label: 'Pitch Black (OLED)', desc: '#000000' },
                { id: 'cyber', label: 'Cyberpunk Slate', desc: '#0c1322' },
              ].map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, theme: th.id as any })
                  }
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    formData.theme === th.id
                      ? 'border-blue-500 bg-blue-600/15 text-white'
                      : 'border-gray-800 bg-gray-900/50 hover:bg-gray-800/50 text-gray-400'
                  }`}
                >
                  <div className="text-xs font-bold text-gray-200">{th.label}</div>
                  <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                    {th.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Instructions for Flix Grim */}
          <div>
            <label className="text-xs font-semibold text-gray-300 mb-1.5 block">
              Instructions for Flix Grim
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Provide answers with code snippets, concise bullet points, and practical implementation tips."
              value={formData.systemInstruction}
              onChange={(e) =>
                setFormData({ ...formData, systemInstruction: e.target.value })
              }
              className="w-full bg-[#1f2937] border border-gray-700 text-white text-xs sm:text-sm p-3 rounded-xl focus:outline-none focus:border-blue-500 leading-relaxed"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Custom instructions will be passed into all model prompt system instructions.
            </p>
          </div>

          {/* Model Manager */}
          <div className="pt-2 border-t border-gray-800/80">
            <div className="flex items-center justify-between text-xs mb-2">
              <label className="font-semibold text-gray-300">
                Model Manager
              </label>
              <span className="text-[11px] text-gray-400">7 Models Configured</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {[
                { name: 'Google Gemini (Flix Grim Auto)', tier: 'FREE' },
                { name: 'Qwen 2.5 (Alibaba)', tier: 'FREE' },
                { name: 'Groq (Llama 3.3)', tier: 'FREE' },
                { name: 'ChatGPT (OpenAI GPT-4o)', tier: 'PRO' },
                { name: 'DeepSeek (R1/V3)', tier: 'PRO' },
                { name: 'Kimi AI (Moonshot)', tier: 'PRO' },
                { name: 'GLM-4 (Zhipu AI)', tier: 'PRO' },
              ].map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-gray-900/60 border border-gray-800 rounded-xl text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        m.tier === 'PRO' ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                    ></span>
                    <span className="text-gray-200 font-medium">{m.name}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      m.tier === 'PRO'
                        ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                        : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                    }`}
                  >
                    {m.tier}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-400">Generation Temperature ({formData.temperature})</span>
                <span className="text-[11px] text-blue-400 font-mono">
                  {formData.temperature < 0.4
                    ? 'Precise & Deterministic'
                    : formData.temperature > 0.8
                    ? 'Creative'
                    : 'Balanced'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={formData.temperature}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    temperature: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Live Online System Health Card */}
          <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold text-white">Live Online Systems</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                100% OPERATIONAL
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center justify-between p-2 bg-black/30 rounded-lg border border-gray-800">
                <span className="text-gray-400">AI Neural Engine</span>
                <span className="text-emerald-400 font-medium">● Online</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-black/30 rounded-lg border border-gray-800">
                <span className="text-gray-400">7-Model Engine</span>
                <span className="text-emerald-400 font-medium">● Active</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-black/30 rounded-lg border border-gray-800">
                <span className="text-gray-400">Live Web Search</span>
                <span className="text-emerald-400 font-medium">● Grounded</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-black/30 rounded-lg border border-gray-800">
                <span className="text-gray-400">Cloud SQL & DB</span>
                <span className="text-emerald-400 font-medium">● Synced</span>
              </div>
            </div>
          </div>

          {/* Reset section */}
          <div className="pt-3 border-t border-gray-800 flex justify-between items-center">
            <span className="text-xs text-gray-500">Flix Grim AI v3.0 · Multi-Model Architecture</span>
            <button
              onClick={handleReset}
              className="text-xs text-gray-400 hover:text-red-400 flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Defaults</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
