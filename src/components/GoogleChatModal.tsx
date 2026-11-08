import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  RefreshCw,
  LogOut,
  LogIn,
  X,
  Share2,
  ExternalLink,
} from 'lucide-react';
import {
  auth,
  signInWithGoogle,
  signOutUser,
  getGoogleAccessToken,
} from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ChatSession } from '../types';

interface GoogleChatSpace {
  name: string;
  displayName: string;
  spaceType?: string;
}

interface GoogleChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSession?: ChatSession;
  onCloudSqlSyncNotice?: (message: string) => void;
}

export const GoogleChatModal: React.FC<GoogleChatModalProps> = ({
  isOpen,
  onClose,
  currentSession,
  onCloudSqlSyncNotice,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [spaces, setSpaces] = useState<GoogleChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const [newSpaceName, setNewSpaceName] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Sync user with Cloud SQL backend
        try {
          const idToken = await user.getIdToken();
          await fetch('/api/user/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
          });
          onCloudSqlSyncNotice?.('User authenticated & synced to Cloud SQL');
        } catch (e) {
          console.error('Failed to sync user with DB:', e);
        }
        fetchSpaces(user);
      } else {
        setSpaces([]);
        setSelectedSpace('');
      }
    });

    return () => unsubscribe();
  }, []);

  // Pre-fill message text when currentSession changes
  useEffect(() => {
    if (currentSession && currentSession.messages.length > 0) {
      const summaryLines = [
        `🤖 *Flix Grim AI Conversation Export*`,
        `*Topic*: ${currentSession.title}`,
        `*Model*: ${currentSession.modelId}`,
        `---`,
      ];

      // Add up to last 4 messages formatted for Google Chat
      const recent = currentSession.messages.slice(-4);
      recent.forEach((m) => {
        const prefix = m.sender === 'user' ? '👤 *User*' : `🤖 *${m.modelName || 'Flix Grim'}*`;
        summaryLines.push(`${prefix}: ${m.text.slice(0, 300)}${m.text.length > 300 ? '...' : ''}`);
      });

      setMessageText(summaryLines.join('\n\n'));
    } else {
      setMessageText('Greetings from Flix Grim AI! Sharing an insight directly to Google Chat.');
    }
  }, [currentSession, isOpen]);

  // Fetch user spaces from backend
  const fetchSpaces = async (user?: User | null) => {
    const activeUser = user || currentUser;
    if (!activeUser) return;

    const accessToken = getGoogleAccessToken();
    if (!accessToken) {
      setStatusMessage({
        type: 'info',
        text: 'Signed in. To fetch live Google Chat spaces, grant permissions with Google sign-in.',
      });
      return;
    }

    setIsLoadingSpaces(true);
    setStatusMessage(null);

    try {
      const idToken = await activeUser.getIdToken();
      const res = await fetch('/api/google-chat/spaces', {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'X-Google-Chat-Token': accessToken,
        },
      });

      const data = await res.json();
      if (res.ok && data.spaces) {
        setSpaces(data.spaces);
        if (data.spaces.length > 0 && !selectedSpace) {
          setSelectedSpace(data.spaces[0].name);
        }
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Could not retrieve Google Chat spaces.',
        });
      }
    } catch (err: any) {
      console.error('Error fetching Google Chat spaces:', err);
      setStatusMessage({
        type: 'error',
        text: 'Network error fetching spaces.',
      });
    } finally {
      setIsLoadingSpaces(false);
    }
  };

  // Sign in flow
  const handleSignIn = async () => {
    setIsSigningIn(true);
    setStatusMessage(null);
    try {
      const { user, accessToken } = await signInWithGoogle();
      setCurrentUser(user);
      if (accessToken) {
        setStatusMessage({
          type: 'success',
          text: 'Signed in successfully! Google Chat access granted.',
        });
        fetchSpaces(user);
      }
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to sign in with Google.',
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  // Sign out flow
  const handleSignOut = async () => {
    try {
      await signOutUser();
      setCurrentUser(null);
      setSpaces([]);
      setSelectedSpace('');
      setStatusMessage({
        type: 'info',
        text: 'Signed out from Google account.',
      });
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  // Create new space
  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim() || !currentUser) return;

    const accessToken = getGoogleAccessToken();
    if (!accessToken) {
      setStatusMessage({
        type: 'error',
        text: 'Google Chat token missing. Please sign in again.',
      });
      return;
    }

    setIsCreatingSpace(true);
    setStatusMessage(null);

    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/google-chat/create-space', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
          'X-Google-Chat-Token': accessToken,
        },
        body: JSON.stringify({ displayName: newSpaceName.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.space) {
        setStatusMessage({
          type: 'success',
          text: `Space "${newSpaceName}" created successfully!`,
        });
        setNewSpaceName('');
        fetchSpaces(currentUser);
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Failed to create Google Chat space.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'Error creating space.',
      });
    } finally {
      setIsCreatingSpace(false);
    }
  };

  // Send message to space
  const handleSendMessage = async () => {
    if (!selectedSpace || !messageText.trim() || !currentUser) return;

    const accessToken = getGoogleAccessToken();
    if (!accessToken) {
      setStatusMessage({
        type: 'error',
        text: 'Please sign in with Google to post messages to Google Chat.',
      });
      return;
    }

    setIsSending(true);
    setStatusMessage(null);

    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/google-chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
          'X-Google-Chat-Token': accessToken,
        },
        body: JSON.stringify({
          spaceName: selectedSpace,
          messageText: messageText.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: 'Message successfully delivered to Google Chat Space!',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Failed to post message to Google Chat.',
        });
      }
    } catch (err: any) {
      console.error('Error posting to space:', err);
      setStatusMessage({
        type: 'error',
        text: 'Network error posting to Google Chat space.',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111625] border border-gray-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-[#0d121f]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-500/20 to-blue-500/20 border border-green-500/30 flex items-center justify-center text-green-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                Google Chat Integration
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-normal">
                  Live Spaces
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Share Flix Grim conversations & AI outputs directly into your Google Chat spaces
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-gray-300">
          {/* Status banner */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl flex items-start space-x-2 text-xs border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                  : 'bg-blue-950/40 border-blue-500/30 text-blue-300'
              }`}
            >
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
              {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              {statusMessage.type === 'info' && <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* User Account / Auth Section */}
          <div className="bg-[#151b2e] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-10 h-10 rounded-full border border-gray-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                    {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div>
                  <div className="text-white font-medium">
                    {currentUser.displayName || 'Google User'}
                  </div>
                  <div className="text-xs text-gray-400">{currentUser.email}</div>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-white font-medium">Sign in to Google Chat</div>
                <div className="text-xs text-gray-400">
                  Authenticate to access your spaces and publish AI messages
                </div>
              </div>
            )}

            <div>
              {currentUser ? (
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-600 text-xs text-gray-300 hover:text-white flex items-center space-x-1 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1" />
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center space-x-2 transition-colors disabled:opacity-50"
                >
                  {isSigningIn ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  <span>Sign In with Google</span>
                </button>
              )}
            </div>
          </div>

          {/* Spaces Selection */}
          {currentUser && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-400" />
                  Target Google Chat Space
                </label>
                <button
                  onClick={() => fetchSpaces()}
                  disabled={isLoadingSpaces}
                  className="text-xs text-gray-400 hover:text-white flex items-center space-x-1 transition-colors"
                  title="Refresh spaces"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSpaces ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {isLoadingSpaces ? (
                <div className="flex items-center justify-center p-6 bg-[#0a0e17] rounded-xl border border-gray-800 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin mr-2 text-blue-400" />
                  Loading your Google Chat spaces...
                </div>
              ) : spaces.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {spaces.map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => setSelectedSpace(s.name)}
                      className={`text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                        selectedSpace === s.name
                          ? 'border-blue-500 bg-blue-500/10 text-white'
                          : 'border-gray-800 bg-[#0d121f] text-gray-300 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <MessageSquare className="w-4 h-4 text-blue-400" />
                        <span className="font-medium text-sm">{s.displayName}</span>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-gray-800 text-gray-400 uppercase">
                        {s.spaceType || 'Space'}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-[#0d121f] rounded-xl border border-gray-800 text-center space-y-2">
                  <p className="text-xs text-gray-400">No active Google Chat spaces found for your account.</p>
                  <p className="text-xs text-gray-500">You can create a new space below to get started immediately.</p>
                </div>
              )}

              {/* Create new Space Input */}
              <form onSubmit={handleCreateSpace} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  placeholder="New Space Name (e.g. Flix Grim Discussions)..."
                  className="flex-1 bg-[#0a0e17] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newSpaceName.trim() || isCreatingSpace}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-medium flex items-center space-x-1 transition-colors disabled:opacity-50 shrink-0"
                >
                  {isCreatingSpace ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Create Space</span>
                </button>
              </form>

              {/* Message Payload Editor */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                  <span>Message Payload</span>
                  <span className="text-[10px] text-gray-500 lowercase">Markdown supported</span>
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={4}
                  className="w-full bg-[#0a0e17] border border-gray-800 rounded-xl p-3 text-xs text-gray-200 focus:outline-none focus:border-blue-500 font-mono leading-relaxed resize-none"
                  placeholder="Type message to post to space..."
                />
              </div>
            </div>
          )}

          {/* Cloud SQL persistence banner */}
          <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-xs text-gray-400 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>PostgreSQL Cloud SQL backend active in asia-southeast1</span>
            </div>
            <span className="text-[11px] text-blue-400">Synced</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-800 bg-[#0d121f] flex items-center justify-between">
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Share2 className="w-3.5 h-3.5 text-gray-400" />
            <span>Google Workspace Chat API</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSendMessage}
              disabled={!currentUser || !selectedSpace || !messageText.trim() || isSending}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center space-x-2 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Delivering...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send to Google Chat</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
