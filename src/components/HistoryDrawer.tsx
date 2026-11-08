import React, { useState } from 'react';
import { ChatSession } from '../types';
import { Plus, X, Search, MessageSquare, Trash2, Download, Edit2, Check } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onClearAll: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onClearAll,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  if (!isOpen) return null;

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startRename = (s: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(s.id);
    setEditTitle(s.title);
  };

  const saveRename = (id: string, e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const exportChat = (s: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    const markdownContent = `# ${s.title}\nDate: ${new Date(
      s.createdAt
    ).toLocaleString()}\nModel: ${s.modelId}\n\n` +
      s.messages
        .map(
          (m) =>
            `### ${m.sender === 'user' ? 'User' : m.modelName || 'Flix Grim'} (${m.timestamp}):\n\n${m.text}\n`
        )
        .join('\n---\n\n');

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${s.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out drawer panel matching original 75% width */}
      <div className="relative w-[85%] sm:w-80 max-w-sm bg-[#111827] border-r border-gray-800 h-full flex flex-col p-4 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <span className="text-blue-500 font-bold text-lg">✦</span>
            <h2 className="text-white text-base sm:text-lg font-bold tracking-tight">
              Flix Grim History
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="pt-3 pb-2">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full py-2.5 px-4 bg-[#1f2937] hover:bg-blue-600/20 hover:border-blue-500/40 border border-transparent text-[#3b82f6] hover:text-blue-400 font-semibold text-sm rounded-xl transition-all flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Chat</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative my-2">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1f2937]/70 border border-gray-800 text-xs text-white placeholder-gray-500 pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:border-blue-500/60"
          />
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 mt-1">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-xs">
              No conversations found.
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isEditing = editingId === session.id;

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl border text-sm transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/15 border-blue-500/40 text-white font-medium'
                      : 'hover:bg-gray-800/60 border-transparent text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    <MessageSquare
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-blue-400' : 'text-gray-500'
                      }`}
                    />

                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveRename(session.id, e)}
                        autoFocus
                        className="bg-gray-900 text-xs text-white px-2 py-0.5 rounded border border-blue-500 outline-none w-full"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs sm:text-sm">
                          {session.title}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {new Date(session.updatedAt || session.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action icons */}
                  <div className="flex items-center space-x-1 shrink-0 ml-1">
                    {isEditing ? (
                      <button
                        onClick={(e) => saveRename(session.id, e)}
                        className="p-1 text-emerald-400 hover:bg-emerald-950/50 rounded"
                        title="Save name"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={(e) => startRename(session, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white rounded hover:bg-gray-700/50 transition-opacity"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => exportChat(session, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-400 rounded hover:bg-gray-700/50 transition-opacity"
                          title="Export Markdown"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 rounded hover:bg-gray-700/50 transition-opacity"
                          title="Delete Chat"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        {sessions.length > 0 && (
          <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
            <span>{sessions.length} chats</span>
            <button
              onClick={onClearAll}
              className="text-red-400/80 hover:text-red-400 transition-colors"
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
