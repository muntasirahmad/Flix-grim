import React from 'react';
import { ModelOption } from '../types';
import { MODELS } from '../config/models';
import { Check, Sparkles, Cpu, Zap, Globe, Compass, Lock, Crown, ShieldAlert } from 'lucide-react';

interface ModelDropdownProps {
  isOpen: boolean;
  selectedModel: ModelOption;
  onSelectModel: (model: ModelOption) => void;
  onClose: () => void;
  isProUser: boolean;
  onTriggerUpgrade: () => void;
}

export const ModelDropdown: React.FC<ModelDropdownProps> = ({
  isOpen,
  selectedModel,
  onSelectModel,
  onClose,
  isProUser,
  onTriggerUpgrade,
}) => {
  if (!isOpen) return null;

  const getModelIcon = (id: string) => {
    switch (id) {
      case 'gemini':
        return <Sparkles className="w-4 h-4 text-blue-400" />;
      case 'chatgpt':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'deepseek':
        return <Cpu className="w-4 h-4 text-emerald-400" />;
      case 'kimi':
        return <Compass className="w-4 h-4 text-rose-400" />;
      case 'groq':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'qwen':
        return <Globe className="w-4 h-4 text-purple-400" />;
      case 'glm':
        return <Compass className="w-4 h-4 text-cyan-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Floating Dropdown Card */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2 sm:left-auto sm:right-auto sm:translate-x-0 sm:left-24 z-50 w-[92%] max-w-sm sm:w-92 bg-[#151c2e] border border-gray-700/80 rounded-2xl shadow-2xl p-2.5 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              7 AI Engines Available
            </span>
          </div>
          {isProUser ? (
            <span className="flex items-center space-x-1 text-[11px] text-amber-400 font-bold bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
              <Crown className="w-3 h-3 text-amber-400" />
              <span>PRO UNLOCKED</span>
            </span>
          ) : (
            <span className="text-[11px] text-gray-400 font-mono">
              3 Free · 4 PRO
            </span>
          )}
        </div>

        <div className="py-1 space-y-1 max-h-[420px] overflow-y-auto">
          {MODELS.map((model) => {
            const isSelected = model.id === selectedModel.id;
            const isLocked = model.isPro && !isProUser;

            return (
              <button
                key={model.id}
                onClick={() => {
                  if (isLocked) {
                    onClose();
                    onTriggerUpgrade();
                  } else {
                    onSelectModel(model);
                    onClose();
                  }
                }}
                className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start space-x-3 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/15 border border-blue-500/40 shadow-sm'
                    : isLocked
                    ? 'opacity-85 hover:bg-gray-800/40 border border-transparent'
                    : 'hover:bg-gray-800/60 border border-transparent'
                }`}
              >
                <div
                  className={`p-2 rounded-lg mt-0.5 shrink-0 relative ${
                    isSelected
                      ? 'bg-blue-600/25'
                      : isLocked
                      ? 'bg-gray-800/70'
                      : 'bg-gray-800'
                  }`}
                >
                  {getModelIcon(model.id)}
                  {isLocked && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full flex items-center justify-center text-black">
                      <Lock className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className={`text-sm font-semibold truncate ${
                        isSelected ? 'text-white' : 'text-gray-200'
                      }`}
                    >
                      {model.name}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md border shrink-0 font-medium ${model.badgeColor}`}
                    >
                      {isLocked ? '🔒 PRO' : model.badge}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-1 mb-1">
                    {model.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono">
                    <span>{model.provider}</span>
                    <span>{model.maxTokens}</span>
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-blue-400 shrink-0 self-center ml-1" />
                )}
                {isLocked && !isSelected && (
                  <span className="text-[11px] text-amber-400/90 font-semibold self-center shrink-0 ml-1">
                    Unlock
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {!isProUser && (
          <div className="mt-2 pt-2 border-t border-gray-800/80">
            <button
              onClick={() => {
                onClose();
                onTriggerUpgrade();
              }}
              className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 hover:from-blue-500 hover:to-amber-400 rounded-xl text-xs font-bold text-white shadow-md flex items-center justify-center space-x-1.5 transition-all active:scale-98 cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 text-amber-200" />
              <span>Unlock All 4 PRO Models (From ₹10)</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};
