import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MessageSquare, 
  PhoneCall, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  Smile, 
  Users, 
  Sparkles, 
  Crown, 
  ShieldCheck, 
  Radio, 
  Check, 
  Share2, 
  ShoppingBag,
  Zap,
  Lock,
  Plus,
  UserPlus,
  UserCheck,
  UserX,
  Bell,
  BellOff,
  ArrowRight,
  Clock,
  CheckCheck,
  PhoneIncoming,
  PhoneForwarded,
  User,
  X,
  ArrowLeft
} from 'lucide-react';
import { UserAccount, getStoredUserAccounts } from '../utils/userAccounts';
import { 
  DirectMessage,
  FriendRequest,
  DirectCallSession,
  getStoredDirectMessages,
  getDirectMessagesBetween,
  sendDirectMessage,
  markDirectMessagesAsRead,
  getUnreadDMsCountForUser,
  getUnreadDMsCountFromFriend,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  getUserFriends,
  getPendingIncomingRequests,
  getPendingSentRequests,
  removeFriend,
  getNotificationSettings,
  toggleNotifications,
  subscribeToLiveUpdates,
  getStoredDirectCallSession,
  startDirectCall,
  answerDirectCall,
  declineDirectCall,
  endDirectCall,
  toggleDirectCallMute,
  syncCommunityStateWithServer,
  getConversationPartners,
  getLastMessageBetween,
  NotificationSettings
} from '../utils/communityChatStorage';
import { sound } from '../utils/audio';
import { formatAedCurrency } from '../utils/formatters';
import { DealItem } from '../types';

interface CommunityLoungeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
  allDeals?: DealItem[];
  onAddToCart?: (deal: DealItem, quantity: number) => void;
  initialTab?: 'dms' | 'friends' | 'call';
  initialFriendToDM?: UserAccount | null;
}

export const CommunityLoungeModal: React.FC<CommunityLoungeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth,
  allDeals = [],
  onAddToCart,
  initialTab = 'dms',
  initialFriendToDM = null,
}) => {
  const [activeTab, setActiveTab] = useState<'dms' | 'friends' | 'call'>(initialTab);
  
  // DMs state
  const [selectedFriend, setSelectedFriend] = useState<UserAccount | null>(initialFriendToDM);
  const [dmMessages, setDmMessages] = useState<DirectMessage[]>([]);
  const [dmInputText, setDmInputText] = useState('');
  const [dmSidebarFilter, setDmSidebarFilter] = useState<'all' | 'chats' | 'friends'>('all');
  
  // Friends & Members state (All accounts directory without search bar)
  const [friends, setFriends] = useState<UserAccount[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [allRegisteredAccounts, setAllRegisteredAccounts] = useState<UserAccount[]>([]);
  const [memberTabFilter, setMemberTabFilter] = useState<'all' | 'friends' | 'requests'>('all');
  const [requestStatusFeedback, setRequestStatusFeedback] = useState<{ [code: string]: string }>({});

  // 1-on-1 Direct Call state
  const [activeCallSession, setActiveCallSession] = useState<DirectCallSession | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Notification Settings
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>({ enabled: true, sound: true, showToasts: true });

  // Share deal modal
  const [showShareDealModal, setShowShareDealModal] = useState(false);

  const dmEndRef = useRef<HTMLDivElement>(null);

  // Reload data from local storage and sync with server
  const reloadData = () => {
    syncCommunityStateWithServer(currentUser?.code);
    const accounts = getStoredUserAccounts();
    setAllRegisteredAccounts(accounts);
    setNotifSettings(getNotificationSettings());
    const currentCall = getStoredDirectCallSession();
    setActiveCallSession(currentCall);

    if (currentUser) {
      setFriends(getUserFriends(currentUser.code));
      setIncomingRequests(getPendingIncomingRequests(currentUser.code));
      setSentRequests(getPendingSentRequests(currentUser.code));
    }
  };

  useEffect(() => {
    if (isOpen) {
      reloadData();
      if (initialTab) setActiveTab(initialTab);
      if (initialFriendToDM) {
        setSelectedFriend(initialFriendToDM);
        setActiveTab('dms');
      }
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, [isOpen, currentUser, initialTab, initialFriendToDM]);

  // Subscribe to live cross-tab and in-memory events + continuous sub-second sync
  useEffect(() => {
    const unsubscribe = subscribeToLiveUpdates((event) => {
      reloadData();
      if (currentUser && selectedFriend) {
        setDmMessages(getDirectMessagesBetween(currentUser.code, selectedFriend.code));
      }
      if (event.type === 'direct_call_start' || event.type === 'direct_call_answer' || event.type === 'direct_call_end' || event.type === 'direct_call_update') {
        const session = getStoredDirectCallSession();
        setActiveCallSession(session);
      }
    });

    const handleAccountsUpdated = () => {
      reloadData();
    };
    window.addEventListener('abdul_accounts_updated', handleAccountsUpdated);

    // Continuous fast sync while modal is open so real-time messages & accounts arrive immediately
    const interval = setInterval(() => {
      syncCommunityStateWithServer(currentUser?.code);
      reloadData();
      if (currentUser && selectedFriend) {
        const updatedDms = getDirectMessagesBetween(currentUser.code, selectedFriend.code);
        setDmMessages(updatedDms);
      }
    }, 800);

    return () => {
      unsubscribe();
      window.removeEventListener('abdul_accounts_updated', handleAccountsUpdated);
      clearInterval(interval);
    };
  }, [currentUser, selectedFriend]);

  // Update DMs whenever selected friend changes
  useEffect(() => {
    if (currentUser && selectedFriend) {
      markDirectMessagesAsRead(currentUser.code, selectedFriend.code);
      setDmMessages(getDirectMessagesBetween(currentUser.code, selectedFriend.code));
    }
  }, [selectedFriend, currentUser]);

  // Call timer increment
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeCallSession && activeCallSession.status === 'connected') {
      interval = setInterval(() => {
        const start = activeCallSession.connectedAt || activeCallSession.startedAt;
        const diff = Math.max(0, Math.floor((Date.now() - start) / 1000));
        setCallDuration(diff);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [activeCallSession]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (activeTab === 'dms') {
      dmEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [dmMessages, activeTab]);

  // ---------------- NOTIFICATIONS TOGGLE ---------------- //
  const handleToggleNotifications = () => {
    sound.playClick();
    const updated = toggleNotifications();
    setNotifSettings(updated);
    if (updated.enabled && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  };

  // ---------------- SEND DIRECT MESSAGE (DM) ---------------- //
  const handleSendDM = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!selectedFriend || !dmInputText.trim()) return;

    sound.playPop();
    const newDm = sendDirectMessage(currentUser, selectedFriend, dmInputText);
    setDmMessages((prev) => {
      const withoutDupes = prev.filter((m) => m.id !== newDm.id);
      return [...withoutDupes, newDm];
    });
    setDmInputText('');
  };

  // ---------------- SHARE DEAL INTO DM ---------------- //
  const handleShareDeal = (deal: DealItem) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!selectedFriend) {
      setShowShareDealModal(false);
      return;
    }

    sound.playCashRegister();
    const newDm = sendDirectMessage(
      currentUser,
      selectedFriend,
      `Check out this deal: ${deal.title}!`,
      {
        id: deal.id,
        title: deal.title,
        priceAed: deal.priceAed,
        emoji: deal.emoji,
      }
    );
    setDmMessages((prev) => {
      const withoutDupes = prev.filter((m) => m.id !== newDm.id);
      return [...withoutDupes, newDm];
    });
    setShowShareDealModal(false);
  };

  // ---------------- FRIEND REQUEST ACTIONS (NO SEARCH BAR) ---------------- //
  const handleAddFriendClick = (targetAccount: UserAccount) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    sound.playPop();
    const res = sendFriendRequest(currentUser, targetAccount.code);
    setRequestStatusFeedback((prev) => ({
      ...prev,
      [targetAccount.code]: res.message,
    }));
    if (res.success) {
      setSentRequests(getPendingSentRequests(currentUser.code));
    }
  };

  const handleAcceptRequest = (req: FriendRequest) => {
    if (!currentUser) return;
    sound.playVipFanfare();
    const res = acceptFriendRequest(req.id, currentUser);
    if (res.success) {
      setIncomingRequests(getPendingIncomingRequests(currentUser.code));
      setFriends(getUserFriends(currentUser.code));
      if (res.newFriend) {
        setSelectedFriend(res.newFriend);
      }
    }
  };

  const handleDeclineRequest = (requestId: string) => {
    sound.playClick();
    declineFriendRequest(requestId);
    if (currentUser) {
      setIncomingRequests(getPendingIncomingRequests(currentUser.code));
    }
  };

  const handleRemoveFriend = (friendCode: string) => {
    if (!currentUser) return;
    if (confirm('Are you sure you want to remove this friend?')) {
      sound.playClick();
      removeFriend(currentUser.code, friendCode);
      setFriends(getUserFriends(currentUser.code));
      if (selectedFriend?.code === friendCode) {
        setSelectedFriend(null);
      }
    }
  };

  // ---------------- 1-ON-1 DIRECT CALL ACTIONS ---------------- //
  const handleStartCall = (recipient: UserAccount) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    sound.playVipFanfare();
    const session = startDirectCall(currentUser, recipient);
    setActiveCallSession(session);
    setActiveTab('call');
  };

  const handleAnswerCall = () => {
    if (!activeCallSession) return;
    sound.playVipFanfare();
    const updated = answerDirectCall(activeCallSession.id);
    setActiveCallSession(updated);
    setActiveTab('call');
  };

  const handleDeclineCall = () => {
    if (!activeCallSession) return;
    sound.playClick();
    declineDirectCall(activeCallSession.id);
    setActiveCallSession(null);
  };

  const handleEndCall = () => {
    sound.playClick();
    endDirectCall(activeCallSession?.id);
    setActiveCallSession(null);
    if (selectedFriend) {
      setActiveTab('dms');
    } else {
      setActiveTab('friends');
    }
  };

  const handleToggleCallMic = () => {
    if (!activeCallSession || !currentUser) return;
    sound.playClick();
    const nextState = !isMicMuted;
    setIsMicMuted(nextState);
    const updated = toggleDirectCallMute(activeCallSession.id, currentUser.code, nextState);
    setActiveCallSession(updated);
  };

  const formatCallTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalUnreadDMs = currentUser ? getUnreadDMsCountForUser(currentUser.code) : 0;
  const isIncomingCallForMe = activeCallSession && currentUser && activeCallSession.recipientCode === currentUser.code && activeCallSession.status === 'ringing';
  const isCallParticipant = activeCallSession && currentUser && (activeCallSession.callerCode === currentUser.code || activeCallSession.recipientCode === currentUser.code);
  const otherCallPersonName = activeCallSession && currentUser ? (activeCallSession.callerCode === currentUser.code ? activeCallSession.recipientName : activeCallSession.callerName) : 'Member';
  const otherCallPersonAvatar = activeCallSession && currentUser ? (activeCallSession.callerCode === currentUser.code ? activeCallSession.recipientAvatar : activeCallSession.callerAvatar) : '👤';

  // Accounts list (excluding current user, real registered accounts only)
  const otherRegisteredAccounts = allRegisteredAccounts.filter((acc) => !currentUser || acc.code !== currentUser.code);

  // DMs sidebar list computed based on filter
  const conversationPartners = useMemo(() => {
    if (!currentUser) return [];
    const codes = getConversationPartners(currentUser.code);
    const accounts: UserAccount[] = [];
    const seen = new Set<string>();
    for (const code of codes) {
      const found = allRegisteredAccounts.find(
        (a) => a.code.toLowerCase() === code.toLowerCase()
      );
      if (found && !seen.has(found.code.toLowerCase())) {
        seen.add(found.code.toLowerCase());
        accounts.push(found);
      }
    }
    return accounts;
  }, [currentUser, dmMessages, allRegisteredAccounts]);

  const dmSidebarList = useMemo(() => {
    let list: UserAccount[] = [];
    if (dmSidebarFilter === 'chats') {
      list = conversationPartners;
    } else if (dmSidebarFilter === 'friends') {
      list = friends;
    } else {
      list = otherRegisteredAccounts;
    }

    // Strictly deduplicate by code
    const unique: UserAccount[] = [];
    const seen = new Set<string>();
    for (const acc of list) {
      if (acc && acc.code && !seen.has(acc.code.toLowerCase())) {
        seen.add(acc.code.toLowerCase());
        unique.push(acc);
      }
    }
    return unique;
  }, [dmSidebarFilter, conversationPartners, friends, otherRegisteredAccounts]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-6xl h-[95vh] sm:h-[92vh] max-h-[920px] bg-gradient-to-b from-[#1c1508] via-[#140f06] to-[#0c0904] border-2 border-yellow-500/40 rounded-3xl shadow-2xl shadow-yellow-950/60 flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header Bar */}
        <div className="p-3 sm:p-4 border-b border-yellow-500/25 relative z-10 flex items-center justify-between gap-3 bg-[#181207]/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-yellow-500/20 vip-gold-bevel shrink-0">
              <MessageSquare className="w-5 h-5 fill-slate-950" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-lg font-black text-white flex items-center gap-1.5 font-mono">
                  <span>Direct Messages & 1-on-1 Calls</span>
                  <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 text-3xs font-mono border border-yellow-500/30 uppercase tracking-widest">
                    VIP Network
                  </span>
                </h2>
              </div>
              <p className="text-3xs sm:text-xs text-yellow-200/60 font-mono flex items-center gap-1">
                <span>Message & call real registered members directly</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Mute / Unmute Toggle */}
            <button
              onClick={handleToggleNotifications}
              className={`p-2 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                notifSettings.enabled
                  ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/20'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-900/40'
              }`}
              title={notifSettings.enabled ? 'Mute In-App Sound & Notifications' : 'Unmute Notifications'}
            >
              {notifSettings.enabled ? <Bell className="w-4 h-4 text-yellow-400" /> : <BellOff className="w-4 h-4 text-rose-400" />}
              <span className="hidden sm:inline font-bold">
                {notifSettings.enabled ? 'Alerts On' : 'Muted'}
              </span>
            </button>

            {/* Close Button */}
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/25 border border-yellow-500/30 text-yellow-300 flex items-center justify-center font-mono font-bold transition-all cursor-pointer active:scale-95"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Incoming 1-on-1 Call Alert Bar (If ringing for current user) */}
        {isIncomingCallForMe && (
          <div className="p-3 bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 text-slate-950 font-mono font-black flex items-center justify-between gap-3 shadow-lg animate-pulse z-20">
            <div className="flex items-center gap-2">
              <span className="text-xl">{activeCallSession?.callerAvatar || '👑'}</span>
              <div>
                <p className="text-xs font-black uppercase tracking-wider">Incoming 1-on-1 Voice Call</p>
                <p className="text-sm font-black">{activeCallSession?.callerName} is calling you...</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAnswerCall}
                className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white font-mono font-black text-xs flex items-center gap-1.5 shadow-md hover:bg-emerald-600 active:scale-95 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Answer</span>
              </button>
              <button
                onClick={handleDeclineCall}
                className="px-3 py-1.5 rounded-xl bg-rose-700 text-white font-mono font-black text-xs flex items-center gap-1.5 shadow-md hover:bg-rose-600 active:scale-95 cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Decline</span>
              </button>
            </div>
          </div>
        )}

        {/* Incoming Friend Request High-Priority Alert Banner */}
        {incomingRequests.length > 0 && (
          <div className="p-3 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-950 font-mono font-black flex flex-wrap items-center justify-between gap-2 shadow-lg z-20 border-b border-yellow-400/40">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl animate-bounce">🤝</span>
              <div>
                <p className="text-xs font-black uppercase tracking-wider">
                  🔔 Incoming Friend Request{incomingRequests.length > 1 ? 's' : ''}!
                </p>
                <p className="text-xs font-bold text-slate-900">
                  {incomingRequests[0].fromUserName} sent you a friend request.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAcceptRequest(incomingRequests[0])}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-mono font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Accept Friend</span>
              </button>
              <button
                onClick={() => handleDeclineRequest(incomingRequests[0].id)}
                className="px-3 py-1.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-white font-mono font-black text-xs flex items-center gap-1 shadow-md active:scale-95 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Decline</span>
              </button>
              {incomingRequests.length > 1 && (
                <button
                  onClick={() => {
                    setActiveTab('friends');
                    setMemberTabFilter('requests');
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 text-white font-mono font-bold text-xs cursor-pointer"
                >
                  View All
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main Navigation Tabs */}
        <div className="flex items-center border-b border-yellow-500/20 bg-[#120d05]/90 px-3 sm:px-4 py-2 gap-2 overflow-x-auto">
          {/* Direct Messages Tab */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('dms');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono font-black transition-all cursor-pointer relative shrink-0 ${
              activeTab === 'dms'
                ? 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/30'
                : 'text-yellow-200/70 hover:text-yellow-200 hover:bg-yellow-500/10'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Direct Messages</span>
            {totalUnreadDMs > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-3xs font-mono font-black ${
                activeTab === 'dms' ? 'bg-slate-950 text-yellow-300' : 'bg-rose-500 text-white animate-pulse'
              }`}>
                {totalUnreadDMs}
              </span>
            )}
          </button>

          {/* All Members & Friends Directory Tab (No search bar, all accounts displayed) */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('friends');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono font-black transition-all cursor-pointer relative shrink-0 ${
              activeTab === 'friends'
                ? 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/30'
                : 'text-yellow-200/70 hover:text-yellow-200 hover:bg-yellow-500/10'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>All Members & Friends</span>
            {incomingRequests.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-3xs font-mono font-black animate-bounce">
                +{incomingRequests.length}
              </span>
            )}
          </button>

          {/* Active 1-on-1 Call Tab (Visible if in a call) */}
          {activeCallSession && isCallParticipant && (
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('call');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono font-black transition-all cursor-pointer shrink-0 ${
                activeTab === 'call'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                  : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 animate-pulse'
              }`}
            >
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>1-on-1 Call ({otherCallPersonName})</span>
              {activeCallSession.status === 'connected' && (
                <span className="text-3xs font-mono bg-slate-950/50 px-1.5 py-0.5 rounded-md text-emerald-200">
                  {formatCallTime(callDuration)}
                </span>
              )}
            </button>
          )}

          {/* Right Status Badge */}
          <div className="ml-auto hidden sm:flex items-center gap-2 text-3xs font-mono text-yellow-300/80">
            {currentUser ? (
              <span className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-1 rounded-lg">
                <span>{currentUser.avatarEmoji || '👑'}</span>
                <span className="font-bold text-yellow-300">{currentUser.name}</span>
                <span className="text-yellow-200/50">({currentUser.code})</span>
              </span>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-2.5 py-1 rounded-lg bg-yellow-500 text-slate-950 font-black hover:bg-yellow-400 cursor-pointer"
              >
                Sign In to Message
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: DIRECT MESSAGES (DMs) - Responsive WhatsApp Experience */}
        {activeTab === 'dms' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Conversations / Members Sidebar (Full height on mobile if no chat selected, hidden on mobile when inside active chat) */}
            <div className={`w-full md:w-80 lg:w-96 bg-[#100b04]/98 border-b md:border-b-0 md:border-r border-yellow-500/25 flex flex-col shrink-0 h-full overflow-y-auto ${
              selectedFriend ? 'hidden md:flex' : 'flex'
            }`}>
              {/* Sidebar Filter Tabs */}
              <div className="p-3 border-b border-yellow-500/20 bg-[#160f06] space-y-2.5 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-mono font-black text-yellow-300 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-yellow-400" />
                    <span>Direct Messages</span>
                  </span>
                  <button
                    onClick={() => setActiveTab('friends')}
                    className="text-xs font-mono text-yellow-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Directory</span>
                  </button>
                </div>

                {/* Sub-tabs */}
                <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-yellow-500/20">
                  <button
                    onClick={() => setDmSidebarFilter('all')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-black transition-all cursor-pointer text-center truncate ${
                      dmSidebarFilter === 'all'
                        ? 'bg-yellow-500 text-slate-950 shadow-md font-bold'
                        : 'text-yellow-200/70 hover:text-yellow-200'
                    }`}
                  >
                    All Members
                  </button>
                  <button
                    onClick={() => setDmSidebarFilter('chats')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-black transition-all cursor-pointer text-center truncate ${
                      dmSidebarFilter === 'chats'
                        ? 'bg-yellow-500 text-slate-950 shadow-md font-bold'
                        : 'text-yellow-200/70 hover:text-yellow-200'
                    }`}
                  >
                    Active Chats
                  </button>
                  <button
                    onClick={() => setDmSidebarFilter('friends')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-black transition-all cursor-pointer text-center truncate ${
                      dmSidebarFilter === 'friends'
                        ? 'bg-yellow-500 text-slate-950 shadow-md font-bold'
                        : 'text-yellow-200/70 hover:text-yellow-200'
                    }`}
                  >
                    Friends
                  </button>
                </div>
              </div>

              {dmSidebarList.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-yellow-200/50 font-mono text-xs space-y-3">
                  <p>
                    {dmSidebarFilter === 'chats' 
                      ? 'No active chats yet. Select any member below to start a conversation!' 
                      : dmSidebarFilter === 'friends' 
                      ? 'No friends added yet.' 
                      : 'No other registered accounts found.'}
                  </p>
                  <button
                    onClick={() => {
                      if (dmSidebarFilter !== 'all') {
                        setDmSidebarFilter('all');
                      } else {
                        setActiveTab('friends');
                      }
                    }}
                    className="w-full max-w-xs py-2 px-4 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-300 text-xs font-black transition-all cursor-pointer"
                  >
                    {dmSidebarFilter !== 'all' ? 'Show All Members' : 'Open Member Directory'}
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-yellow-500/10 flex-1 overflow-y-auto">
                  {dmSidebarList.map((account) => {
                    const unread = currentUser ? getUnreadDMsCountFromFriend(currentUser.code, account.code) : 0;
                    const isSelected = selectedFriend?.code === account.code;
                    const lastMsg = currentUser ? getLastMessageBetween(currentUser.code, account.code) : null;
                    const isFriend = friends.some((f) => f.code.toLowerCase().trim() === account.code.toLowerCase().trim());

                    return (
                      <button
                        key={account.code}
                        onClick={() => {
                          sound.playClick();
                          setSelectedFriend(account);
                        }}
                        className={`w-full p-3 sm:p-3.5 flex items-center gap-3 text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-yellow-500/25 border-l-4 border-yellow-400 text-white'
                            : 'hover:bg-yellow-500/10 text-yellow-200/90'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <span className="text-3xl sm:text-4xl">{account.avatarEmoji || '👤'}</span>
                          <span
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-950 ${
                              account.status === 'online'
                                ? 'bg-emerald-400 ring-2 ring-emerald-500/50 animate-pulse'
                                : 'bg-slate-500'
                            }`}
                            title={account.status === 'online' ? 'Online' : 'Offline'}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5 mb-1">
                            <p className="font-bold text-xs sm:text-sm truncate text-yellow-100 flex items-center gap-1.5">
                              <span>{account.name}</span>
                              {account.isOwner && (
                                <span className="px-1.5 py-0.2 bg-yellow-500 text-slate-950 text-3xs font-mono font-black rounded">
                                  👑 Owner
                                </span>
                              )}
                              {isFriend && (
                                <span className="text-emerald-400 text-xs font-mono" title="Friend">
                                  ✓
                                </span>
                              )}
                            </p>
                            {unread > 0 ? (
                              <span className="px-2 py-0.5 bg-rose-500 text-white text-xs rounded-full font-mono font-black animate-bounce shadow-md">
                                {unread}
                              </span>
                            ) : lastMsg ? (
                              <span className="text-3xs font-mono text-yellow-200/50 shrink-0">
                                {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            ) : null}
                          </div>
                          
                          {lastMsg ? (
                            <p className="text-xs font-sans text-yellow-200/70 truncate">
                              {lastMsg.senderCode === currentUser?.code ? 'You: ' : ''}{lastMsg.text}
                            </p>
                          ) : (
                            <div className="flex items-center gap-2 text-3xs font-mono text-yellow-200/50 truncate">
                              <span className={account.status === 'online' ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                                {account.status === 'online' ? '● Online' : '○ Offline'}
                              </span>
                              <span>• {account.roleTitle || 'VIP Member'}</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Active DM Chat Box (WhatsApp Style: Large, clear, readable on Mobile/Laptop/iPad) */}
            <div className={`flex-1 flex flex-col bg-[#0a0702] overflow-hidden ${
              selectedFriend ? 'flex h-full' : 'hidden md:flex'
            }`}>
              {selectedFriend ? (
                <>
                  {/* WhatsApp-Style Chat Header */}
                  <div className="p-3 sm:p-4 border-b border-yellow-500/25 bg-[#160f06] flex items-center justify-between gap-2.5 shrink-0 shadow-md">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      {/* Mobile Back Button to Contacts */}
                      <button
                        onClick={() => {
                          sound.playClick();
                          setSelectedFriend(null);
                        }}
                        className="md:hidden p-2 -ml-1 rounded-xl bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/40 text-yellow-300 flex items-center gap-1 font-mono text-xs font-bold active:scale-95 cursor-pointer shrink-0"
                        title="Back to all conversations"
                      >
                        <ArrowLeft className="w-4 h-4 text-yellow-400" />
                        <span>Chats</span>
                      </button>

                      <div className="relative shrink-0">
                        <span className="text-3xl sm:text-4xl">{selectedFriend.avatarEmoji || '👤'}</span>
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-950 ${
                            selectedFriend.status === 'online' ? 'bg-emerald-400 ring-2 ring-emerald-400/50 animate-pulse' : 'bg-slate-500'
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-sm sm:text-base text-yellow-100 truncate flex items-center gap-1.5">
                          <span>{selectedFriend.name}</span>
                          {selectedFriend.isOwner && (
                            <span className="px-1.5 py-0.2 rounded bg-yellow-500 text-slate-950 text-3xs font-mono font-black">
                              Owner
                            </span>
                          )}
                        </h3>
                        <p className="text-3xs sm:text-xs font-mono text-yellow-200/60 truncate flex items-center gap-1.5">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              selectedFriend.status === 'online' ? 'bg-emerald-400' : 'bg-slate-500'
                            }`}
                          />
                          <span>{selectedFriend.status === 'online' ? 'Online' : 'Offline'}</span>
                          <span>• {selectedFriend.roleTitle || 'VIP Member'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Chat Action Buttons */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      {/* 1-on-1 Call Button */}
                      <button
                        onClick={() => handleStartCall(selectedFriend)}
                        className="px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:brightness-110 text-white font-mono font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-950/60 active:scale-95 transition-all cursor-pointer"
                        title={`Start 1-on-1 Voice Call with ${selectedFriend.name}`}
                      >
                        <PhoneCall className="w-4 h-4 fill-white" />
                        <span className="hidden sm:inline">Call</span>
                      </button>

                      {/* Share Deal Button */}
                      <button
                        onClick={() => setShowShareDealModal(true)}
                        className="px-2.5 sm:px-3 py-2 rounded-xl bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/40 text-yellow-300 font-mono text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Share a store deal in DM"
                      >
                        <Share2 className="w-4 h-4 text-yellow-400" />
                        <span className="hidden sm:inline">Share Deal</span>
                      </button>
                    </div>
                  </div>

                  {/* WhatsApp-Style Messages Canvas (Large, readable, clean wallpaper) */}
                  <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#0d0903] bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:24px_24px]">
                    {/* Centered Encryption / VIP Room Badge */}
                    <div className="flex justify-center my-1">
                      <span className="px-3.5 py-1 rounded-full bg-[#181105]/90 border border-yellow-500/20 text-yellow-300/70 text-3xs sm:text-xs font-mono text-center shadow-sm">
                        🔒 Direct VIP Chat with {selectedFriend.name} • Live & Synced
                      </span>
                    </div>

                    {dmMessages.length === 0 ? (
                      <div className="h-4/5 flex flex-col items-center justify-center text-center p-6 text-yellow-200/50 font-mono space-y-3">
                        <span className="text-5xl">💬</span>
                        <p className="text-base font-bold text-yellow-300">No messages yet with {selectedFriend.name}</p>
                        <p className="text-xs sm:text-sm max-w-sm text-yellow-200/70 font-sans">
                          Say hello, share your favorite Abdul Deals discounts, or tap the Call button to speak directly!
                        </p>
                      </div>
                    ) : (
                      dmMessages.map((dm) => {
                        const isMe = currentUser?.code === dm.senderCode;
                        return (
                          <div
                            key={dm.id}
                            className={`flex gap-2.5 max-w-[88%] sm:max-w-[78%] md:max-w-[70%] ${
                              isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'
                            }`}
                          >
                            <span className="text-2xl sm:text-3xl shrink-0 self-end mb-1">{dm.senderAvatar}</span>
                            <div className="space-y-1 min-w-0 max-w-full">
                              <div
                                className={`px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl text-sm sm:text-base leading-relaxed shadow-lg font-sans ${
                                  isMe
                                    ? 'bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-medium rounded-br-xs shadow-yellow-950/40'
                                    : 'bg-[#1c1409] border border-yellow-500/30 text-yellow-50 font-normal rounded-bl-xs shadow-black/80'
                                }`}
                              >
                                {dm.dealSnippet && (
                                  <div className="mb-2.5 p-2.5 rounded-xl bg-black/40 border border-black/30 flex items-center justify-between gap-3 text-left">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span className="text-2xl sm:text-3xl">{dm.dealSnippet.emoji}</span>
                                      <div className="min-w-0">
                                        <p className="font-bold text-xs sm:text-sm truncate text-white">{dm.dealSnippet.title}</p>
                                        <p className="font-mono text-xs font-black text-yellow-300">
                                          {formatAedCurrency(dm.dealSnippet.priceAed).short}
                                        </p>
                                      </div>
                                    </div>
                                    {onAddToCart && (
                                      <button
                                        onClick={() => {
                                          const fullDeal = allDeals.find((d) => d.id === dm.dealSnippet?.id);
                                          if (fullDeal) onAddToCart(fullDeal, 1);
                                        }}
                                        className="px-2.5 py-1.5 rounded-lg bg-yellow-400 text-slate-950 text-xs font-black shrink-0 hover:bg-yellow-300 shadow-sm cursor-pointer active:scale-95"
                                      >
                                        + Cart
                                      </button>
                                    )}
                                  </div>
                                )}
                                <p className="whitespace-pre-wrap break-words">{dm.text}</p>
                              </div>
                              <div className={`flex items-center gap-1.5 text-3xs font-mono px-1.5 ${
                                isMe ? 'justify-end text-yellow-200/60' : 'justify-start text-yellow-200/40'
                              }`}>
                                <span>{new Date(dm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {isMe && (
                                  <CheckCheck className={`w-3.5 h-3.5 ${dm.read ? 'text-cyan-400' : 'text-yellow-200/50'}`} />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={dmEndRef} />
                  </div>

                  {/* WhatsApp Quick Reaction Bar */}
                  <div className="px-3 py-1.5 bg-[#120c04] border-t border-yellow-500/15 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                    <span className="text-3xs font-mono text-yellow-300/50 shrink-0 font-bold">Quick:</span>
                    {['👍', '❤️', '🔥', '😂', '👑', '🎉', '👏', '🤝', '💯', '🚀'].map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => {
                          sound.playPop();
                          setDmInputText((prev) => prev + em);
                        }}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/25 active:scale-95 flex items-center justify-center text-sm sm:text-base shrink-0 transition-transform cursor-pointer border border-yellow-500/20"
                      >
                        {em}
                      </button>
                    ))}
                  </div>

                  {/* Large, Comfortable WhatsApp Message Input Bar */}
                  <form onSubmit={handleSendDM} className="p-3 sm:p-4 border-t border-yellow-500/20 bg-[#160f06] flex items-center gap-2.5 shrink-0">
                    <input
                      type="text"
                      value={dmInputText}
                      onChange={(e) => setDmInputText(e.target.value)}
                      placeholder={`Type a message to ${selectedFriend.name}...`}
                      className="flex-1 bg-black/75 border border-yellow-500/40 rounded-2xl px-4 py-3 text-sm sm:text-base text-yellow-100 placeholder-yellow-200/40 focus:outline-none focus:border-yellow-400 font-sans shadow-inner"
                    />
                    <button
                      type="submit"
                      disabled={!dmInputText.trim()}
                      className="px-5 py-3 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 hover:brightness-110 disabled:opacity-40 text-slate-950 font-black font-mono text-sm flex items-center gap-2 shadow-lg shadow-yellow-950/60 active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Send</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-yellow-200/60 font-mono space-y-4">
                  <span className="text-6xl">💬</span>
                  <h3 className="text-lg font-bold text-yellow-300">Choose a Contact to Start Messaging</h3>
                  <p className="text-sm max-w-md text-yellow-200/70 font-sans">
                    Select any member from the left sidebar to open a full-sized, WhatsApp-style direct chat.
                  </p>
                  <button
                    onClick={() => setActiveTab('friends')}
                    className="px-5 py-2.5 rounded-2xl bg-yellow-500 text-slate-950 font-black text-xs sm:text-sm font-mono hover:bg-yellow-400 transition-all cursor-pointer shadow-md"
                  >
                    View All Registered Accounts
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: ALL MEMBERS & FRIENDS (NO SEARCH BAR - SEE ALL ACCOUNTS AND CHOOSE) */}
        {activeTab === 'friends' && (
          <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-5 bg-[#0e0a04]/90 space-y-4">
            {/* Header & Sub-Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#181207] p-3.5 rounded-2xl border border-yellow-500/25">
              <div>
                <h3 className="text-sm font-black text-white font-mono flex items-center gap-2">
                  <Users className="w-4 h-4 text-yellow-400" />
                  <span>Registered Member Directory</span>
                </h3>
                <p className="text-3xs text-yellow-200/60 font-mono">
                  All accounts in the system. Click to add as friend, message directly, or call!
                </p>
              </div>

              {/* Sub-filter pills */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMemberTabFilter('all')}
                  className={`px-3 py-1 rounded-xl text-3xs font-mono font-black transition-all cursor-pointer ${
                    memberTabFilter === 'all'
                      ? 'bg-yellow-500 text-slate-950 shadow-sm'
                      : 'bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20'
                  }`}
                >
                  All Members
                </button>
                <button
                  onClick={() => setMemberTabFilter('friends')}
                  className={`px-3 py-1 rounded-xl text-3xs font-mono font-black transition-all cursor-pointer ${
                    memberTabFilter === 'friends'
                      ? 'bg-yellow-500 text-slate-950 shadow-sm'
                      : 'bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20'
                  }`}
                >
                  My Friends
                </button>
                <button
                  onClick={() => setMemberTabFilter('requests')}
                  className={`px-3 py-1 rounded-xl text-3xs font-mono font-black transition-all cursor-pointer relative ${
                    memberTabFilter === 'requests'
                      ? 'bg-yellow-500 text-slate-950 shadow-sm'
                      : 'bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20'
                  }`}
                >
                  Requests {incomingRequests.length > 0 ? `(${incomingRequests.length})` : ''}
                </button>
              </div>
            </div>

            {/* Incoming Requests Section (If any) */}
            {incomingRequests.length > 0 && memberTabFilter !== 'friends' && (
              <div className="bg-amber-950/40 border border-amber-500/40 p-3.5 rounded-2xl space-y-2">
                <h4 className="text-xs font-mono font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span>Incoming Friend Requests</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {incomingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-2.5 rounded-xl bg-black/40 border border-amber-500/30 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl">{req.fromUserAvatar || '👤'}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-white truncate">{req.fromUserName}</p>
                          <p className="text-3xs font-mono text-yellow-200/50">VIP Member</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleAcceptRequest(req)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-3xs flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(req.id)}
                          className="px-2 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-300 font-mono font-bold text-3xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Member Cards Grid (Direct selection, NO SEARCH BAR) */}
            <div className="flex-1 overflow-y-auto pr-1">
              {otherRegisteredAccounts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#140e06] rounded-2xl border border-yellow-500/20 text-yellow-200/60 font-mono space-y-3">
                  <span className="text-4xl">👤</span>
                  <h4 className="text-sm font-bold text-yellow-300">No Other Accounts Registered Yet</h4>
                  <p className="text-xs max-w-md">
                    There are no fake accounts. Someone has to make an account! You can create a second account (using a different name) in the Account sign-up screen to test 1-on-1 chatting and calling across browser tabs.
                  </p>
                  <button
                    onClick={onOpenAuth}
                    className="px-4 py-2 rounded-xl bg-yellow-500 text-slate-950 font-black text-xs hover:bg-yellow-400 transition-all cursor-pointer"
                  >
                    + Create Another Account / Sign Up
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {otherRegisteredAccounts
                    .filter((acc) => {
                      const c = acc.code.toLowerCase().trim();
                      if (memberTabFilter === 'friends') {
                        return friends.some((f) => f.code.toLowerCase().trim() === c);
                      }
                      if (memberTabFilter === 'requests') {
                        return incomingRequests.some((r) => r.fromUserCode.toLowerCase().trim() === c);
                      }
                      return true;
                    })
                    .map((acc) => {
                      const c = acc.code.toLowerCase().trim();
                      const isFriend = friends.some((f) => f.code.toLowerCase().trim() === c);
                      const isSentPending = sentRequests.some((r) => r.toUserCode.toLowerCase().trim() === c);
                      const isIncoming = incomingRequests.some((r) => r.fromUserCode.toLowerCase().trim() === c);
                      const feedback = requestStatusFeedback[acc.code];

                      return (
                        <div
                          key={acc.code}
                          className="p-3.5 rounded-2xl bg-[#181207] border border-yellow-500/25 flex flex-col justify-between gap-3 shadow-md hover:border-yellow-500/50 transition-all"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="relative shrink-0">
                              <span className="text-3xl block bg-yellow-500/10 p-2 rounded-2xl border border-yellow-500/20">
                                {acc.avatarEmoji || '👤'}
                              </span>
                              <span
                                className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-950 ${
                                  acc.status === 'online'
                                    ? 'bg-emerald-400 animate-pulse'
                                    : 'bg-slate-500'
                                }`}
                                title={acc.status === 'online' ? 'Online' : 'Offline'}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-black text-sm text-yellow-100 truncate">{acc.name}</p>
                                {acc.isOwner && (
                                  <span className="px-1.5 py-0.2 rounded bg-yellow-500 text-slate-950 text-3xs font-mono font-black shrink-0">
                                    Owner
                                  </span>
                                )}
                                <span
                                  className={`px-1.5 py-0.2 rounded text-3xs font-mono font-bold shrink-0 ${
                                    acc.status === 'online'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                                  }`}
                                >
                                  {acc.status === 'online' ? '● Online' : '○ Offline'}
                                </span>
                              </div>
                              <p className="text-3xs font-mono text-yellow-200/60 truncate">
                                {acc.roleTitle || 'VIP Member'}
                              </p>
                            </div>
                          </div>

                          {feedback && (
                            <p className="text-3xs font-mono text-emerald-400 bg-emerald-950/40 p-1.5 rounded-lg">
                              {feedback}
                            </p>
                          )}

                          {/* Action Buttons */}
                          <div className="pt-2 border-t border-yellow-500/15 flex items-center gap-2">
                            {isFriend ? (
                              <>
                                <button
                                  onClick={() => {
                                    sound.playClick();
                                    setSelectedFriend(acc);
                                    setActiveTab('dms');
                                  }}
                                  className="flex-1 py-1.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-mono font-black text-3xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  <span>Message</span>
                                </button>
                                <button
                                  onClick={() => handleStartCall(acc)}
                                  className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-3xs flex items-center justify-center transition-all cursor-pointer"
                                  title={`Call ${acc.name}`}
                                >
                                  <PhoneCall className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRemoveFriend(acc.code)}
                                  className="p-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900 border border-rose-500/30 text-rose-300 font-mono text-3xs cursor-pointer"
                                  title="Remove Friend"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : isIncoming ? (
                              <div className="w-full flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    const req = incomingRequests.find((r) => r.fromUserCode.toLowerCase().trim() === c);
                                    if (req) handleAcceptRequest(req);
                                  }}
                                  className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-black text-3xs flex items-center justify-center gap-1 cursor-pointer shadow-md"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Accept Request</span>
                                </button>
                                <button
                                  onClick={() => {
                                    const req = incomingRequests.find((r) => r.fromUserCode.toLowerCase().trim() === c);
                                    if (req) handleDeclineRequest(req.id);
                                  }}
                                  className="px-2 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/30 text-rose-300 font-mono text-3xs cursor-pointer"
                                  title="Decline Request"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : isSentPending ? (
                              <div className="w-full flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    sound.playClick();
                                    setSelectedFriend(acc);
                                    setActiveTab('dms');
                                  }}
                                  className="flex-1 py-1.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-mono font-black text-3xs flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  <span>Message</span>
                                </button>
                                <span className="px-2 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300/80 font-mono text-3xs flex items-center justify-center gap-1">
                                  <Clock className="w-3 h-3 text-yellow-400" />
                                  <span>Pending</span>
                                </span>
                              </div>
                            ) : (
                              <div className="w-full flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    sound.playClick();
                                    setSelectedFriend(acc);
                                    setActiveTab('dms');
                                  }}
                                  className="flex-1 py-1.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-mono font-black text-3xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  <span>Message</span>
                                </button>
                                <button
                                  onClick={() => handleAddFriendClick(acc)}
                                  className="flex-1 py-1.5 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-300 font-mono font-bold text-3xs flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                                >
                                  <UserPlus className="w-3 h-3" />
                                  <span>Add Friend</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: 1-ON-1 DIRECT CALL INTERFACE */}
        {activeTab === 'call' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#140e06] via-[#0c0803] to-[#050301] text-center space-y-6">
            {activeCallSession && isCallParticipant ? (
              <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#1c1408] border-2 border-yellow-500/40 shadow-2xl space-y-6">
                {/* Profile Avatar of Call Partner */}
                <div className="relative inline-block mx-auto">
                  <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-400 flex items-center justify-center text-6xl shadow-2xl border-4 border-yellow-300 ${
                    activeCallSession.status === 'connected' ? 'animate-pulse' : ''
                  }`}>
                    {otherCallPersonAvatar}
                  </div>
                  <span className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-2 border-slate-950 ${
                    activeCallSession.status === 'connected' ? 'bg-emerald-500' : 'bg-amber-400 animate-ping'
                  }`}></span>
                </div>

                {/* Call Status & Info */}
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-black text-white font-mono">
                    {otherCallPersonName}
                  </h3>
                  <p className="text-xs font-mono uppercase tracking-widest text-yellow-400 font-bold">
                    {activeCallSession.status === 'connected'
                      ? `1-on-1 Call Connected (${formatCallTime(callDuration)})`
                      : 'Ringing... Waiting to connect'}
                  </p>
                </div>

                {/* Audio Wave Visualizer */}
                <div className="flex items-center justify-center gap-1.5 h-8">
                  {[40, 70, 30, 90, 60, 100, 45, 80, 50, 75, 35, 85].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: activeCallSession.status === 'connected' && !isMicMuted ? `${h}%` : '20%' }}
                      className={`w-1.5 rounded-full transition-all duration-150 ${
                        activeCallSession.status === 'connected' && !isMicMuted
                          ? 'bg-gradient-to-t from-yellow-500 to-amber-300'
                          : 'bg-yellow-500/20'
                      }`}
                    />
                  ))}
                </div>

                {/* Call Control Buttons */}
                <div className="flex items-center justify-center gap-4 pt-2">
                  {/* Mic Toggle */}
                  <button
                    onClick={handleToggleCallMic}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold transition-all cursor-pointer shadow-lg ${
                      isMicMuted
                        ? 'bg-rose-900/80 border border-rose-500 text-rose-300'
                        : 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/30'
                    }`}
                    title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
                  >
                    {isMicMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>

                  {/* Speaker Toggle */}
                  <button
                    onClick={() => {
                      sound.playClick();
                      setIsSpeakerMuted(!isSpeakerMuted);
                    }}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold transition-all cursor-pointer shadow-lg ${
                      isSpeakerMuted
                        ? 'bg-rose-900/80 border border-rose-500 text-rose-300'
                        : 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/30'
                    }`}
                    title={isSpeakerMuted ? 'Unmute Speaker' : 'Mute Speaker'}
                  >
                    {isSpeakerMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                  </button>

                  {/* End Call Button */}
                  <button
                    onClick={handleEndCall}
                    className="w-14 h-14 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center font-bold shadow-xl shadow-rose-950/80 active:scale-95 transition-all cursor-pointer"
                    title="End Call"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 max-w-sm rounded-3xl bg-[#181207] border border-yellow-500/25 space-y-3">
                <span className="text-4xl">📞</span>
                <h4 className="text-sm font-bold text-yellow-300">No Active 1-on-1 Call</h4>
                <p className="text-xs text-yellow-200/60 font-mono">
                  Select a friend from Direct Messages or the Member Directory and click "Call" to start talking!
                </p>
                <button
                  onClick={() => setActiveTab('dms')}
                  className="w-full py-2 rounded-xl bg-yellow-500 text-slate-950 font-mono font-black text-xs hover:bg-yellow-400 cursor-pointer"
                >
                  Go to Direct Messages
                </button>
              </div>
            )}
          </div>
        )}

        {/* SHARE STORE DEAL MODAL */}
        {showShareDealModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-md bg-[#181207] border-2 border-yellow-500/40 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-mono font-black text-yellow-300 flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  <span>Share Deal in DM with {selectedFriend?.name}</span>
                </h4>
                <button
                  onClick={() => setShowShareDealModal(false)}
                  className="text-yellow-200/50 hover:text-yellow-200 text-sm font-mono cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-yellow-500/10 space-y-1">
                {allDeals.slice(0, 15).map((deal) => (
                  <button
                    key={deal.id}
                    onClick={() => handleShareDeal(deal)}
                    className="w-full p-2.5 rounded-xl hover:bg-yellow-500/15 text-left flex items-center justify-between gap-2 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-2xl">{deal.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-black truncate">{deal.title}</p>
                        <p className="text-3xs font-mono text-yellow-400 font-bold">
                          {formatAedCurrency(deal.priceAed).short}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded bg-yellow-500 text-slate-950 text-3xs font-black shrink-0">
                      Share
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
