import React from 'react';
import { ModelOption } from '../types';
import { Menu, Settings, Sparkles, Smartphone, Monitor, ChevronDown, MessageSquare } from 'lucide-react';

interface HeaderProps {
  selectedModel: ModelOption;
  isModelDropdownOpen: boolean;
  setIsModelDropdownOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  onOpenDrawer: () => void;
  onOpenSettings: () => void;
  onOpenUpgrade: () => void;
  onOpenNativeCode: () => void;
  onOpenGoogleChat: () => void;
  isProUser: boolean;
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedModel,
  isModelDropdownOpen,
  setIsModelDropdownOpen,
  onOpenDrawer,
  onOpenSettings,
  onOpenUpgrade,
  onOpenNativeCode,
  onOpenGoogleChat,
  isProUser,
  isMobileFrame,
  setIsMobileFrame,
}) => {
  return (
    <header className="relative z-30 flex items-center justify-between px-3 sm:px-4 py-3 bg-[#0b0f19] border-b border-gray-800/80 shrink-0 select-none">
      {/* Left: Drawer Menu button */}
      <div className="flex items-center space-x-1.5 sm:space-x-2">
        <button
          onClick={onOpenDrawer}
          className="p-2 text-gray-300 hover:text-white hover:bg-gray-800/60 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          title="Open History (☰)"
          aria-label="Open History Drawer"
        >
          <Menu className="w-5 h-5 text-gray-200" />
        </button>

        {/* View mode toggle (Mobile Frame vs Desktop) */}
        <button
          onClick={() => setIsMobileFrame((prev) => !prev)}
          className="hidden sm:flex items-center space-x-1 px-2.5 py-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 rounded-lg border border-gray-800 transition-colors cursor-pointer"
          title={isMobileFrame ? 'Switch to Full Width View' : 'Switch to Mobile App Preview'}
        >
          {isMobileFrame ? (
            <>
              <Monitor className="w-3.5 h-3.5 text-blue-400" />
              <span>Full View</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5 text-purple-400" />
              <span>Mobile View</span>
            </>
          )}
        </button>
      </div>

      {/* Center: Model Selector Dropdown Button & Online Indicator */}
      <div className="relative flex items-center space-x-2">
        <button
          onClick={() => setIsModelDropdownOpen((prev) => !prev)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-900/80 hover:bg-gray-800 border border-gray-700/60 rounded-xl text-gray-100 font-semibold text-sm transition-all shadow-sm active:scale-98 group cursor-pointer"
          aria-expanded={isModelDropdownOpen}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="max-w-[130px] sm:max-w-[200px] truncate flex items-center gap-1">
            <span>{selectedModel.name}</span>
            {selectedModel.isPro && !isProUser && (
              <span className="text-[10px] text-amber-400 bg-amber-500/20 px-1 rounded border border-amber-500/30 font-mono">
                PRO
              </span>
            )}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isModelDropdownOpen ? 'rotate-180 text-blue-400' : ''
            }`}
          />
        </button>

        {/* Live Online Badge */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-950/40 border border-emerald-500/30 rounded-full text-[11px] text-emerald-400 font-medium select-none shadow-sm shadow-emerald-500/10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Live Online</span>
        </div>
      </div>

      {/* Right: Google Chat, Android Code, Upgrade Button & Settings */}
      <div className="flex items-center space-x-1.5 sm:space-x-2">
        {/* Google Chat button */}
        <button
          onClick={onOpenGoogleChat}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs text-green-400 hover:text-green-300 hover:bg-green-950/40 rounded-xl border border-green-500/30 transition-all cursor-pointer shadow-sm"
          title="Google Chat Spaces & Export"
        >
          <MessageSquare className="w-3.5 h-3.5 text-green-400" />
          <span className="hidden sm:inline font-medium">Google Chat</span>
        </button>

        <button
          onClick={onOpenNativeCode}
          className="hidden md:flex items-center space-x-1 px-2 py-1.5 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 rounded-lg border border-emerald-500/30 transition-all cursor-pointer"
          title="View Android React Native Code"
        >
          <span className="font-mono text-[11px]">Android Code</span>
        </button>

        <button
          onClick={onOpenUpgrade}
          className={`relative overflow-hidden flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 shadow-sm active:scale-95 cursor-pointer ${
            isProUser
              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-amber-500/20 shadow-md font-bold'
              : 'bg-[#2563eb] hover:bg-blue-600 text-white shadow-blue-600/30'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isProUser ? 'PRO ACTIVE' : 'Upgrade'}</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 text-gray-300 hover:text-white hover:bg-gray-800/60 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          title="Settings (⚙️)"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-gray-300 hover:rotate-45 transition-transform" />
        </button>
      </div>
    </header>
  );
};
