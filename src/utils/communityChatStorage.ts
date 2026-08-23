import { UserAccount, getStoredUserAccounts } from './userAccounts';

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderCode: string;
  senderName: string;
  senderAvatar: string;
  recipientCode: string;
  recipientName: string;
  text: string;
  timestamp: number;
  read: boolean;
  dealSnippet?: {
    id: string;
    title: string;
    priceAed: number;
    emoji: string;
  };
  reactions?: Record<string, number>;
}

export interface FriendRequest {
  id: string;
  fromUserCode: string;
  fromUserName: string;
  fromUserAvatar: string;
  toUserCode: string;
  toUserName: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
}

export interface FriendShip {
  id: string;
  user1Code: string;
  user2Code: string;
  createdAt: number;
}

export interface DirectCallSession {
  id: string;
  callerCode: string;
  callerName: string;
  callerAvatar: string;
  recipientCode: string;
  recipientName: string;
  recipientAvatar: string;
  status: 'ringing' | 'connected' | 'ended' | 'declined';
  startedAt: number;
  connectedAt?: number;
  endedAt?: number;
  callerMuted?: boolean;
  recipientMuted?: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  showToasts: boolean;
}

export interface LiveBusEvent {
  type: 
    | 'direct_message' 
    | 'friend_request' 
    | 'friend_accepted' 
    | 'friend_removed'
    | 'direct_call_start'
    | 'direct_call_answer'
    | 'direct_call_end'
    | 'direct_call_update'
    | 'notification_toggle';
  payload?: any;
  senderCode?: string;
  timestamp: number;
}

const DIRECT_CALL_STORAGE_KEY = 'abdul_deals_direct_call_session_v4';
const DMS_STORAGE_KEY = 'abdul_deals_direct_messages_v4';
const FRIEND_REQUESTS_KEY = 'abdul_deals_friend_requests_v4';
const FRIENDSHIPS_KEY = 'abdul_deals_friendships_v4';
const NOTIF_SETTINGS_KEY = 'abdul_deals_notif_settings_v4';

// BroadcastChannel for instant cross-tab live synchronization
let liveChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    liveChannel = new BroadcastChannel('abdul_deals_live_bus_channel_v4');
  }
} catch (e) {
  console.warn('BroadcastChannel not available, falling back to storage events', e);
}

// ---------------- WEBSOCKET REAL-TIME CLIENT ---------------- //
let wsClient: WebSocket | null = null;
let wsReconnectTimeout: any = null;
let wsHeartbeatInterval: any = null;

export function getWebSocketClient(): WebSocket | null {
  return wsClient;
}

export function sendWebSocketMessage(data: any): boolean {
  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    try {
      wsClient.send(JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('Failed to send WS message:', e);
    }
  }
  return false;
}

export function sendCallSignal(targetCode: string, senderCode: string, payload: any): void {
  sendWebSocketMessage({
    type: 'call_signal',
    targetCode,
    senderCode,
    payload,
  });
}

export function initRealtimeSocket(): void {
  if (typeof window === 'undefined') return;
  if (wsClient && (wsClient.readyState === WebSocket.OPEN || wsClient.readyState === WebSocket.CONNECTING)) {
    return;
  }

  try {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsClient = ws;

    ws.onopen = () => {
      console.log('⚡ Connected to Abdul Deals real-time live socket');
      // Send auth/presence
      try {
        const rawUser = localStorage.getItem('abdul_deals_active_user_account_v2');
        const user = rawUser ? JSON.parse(rawUser) : null;
        if (user?.code) {
          sendWebSocketMessage({ type: 'auth', userCode: user.code });
        }
      } catch {}

      // Start periodic heartbeat
      if (wsHeartbeatInterval) clearInterval(wsHeartbeatInterval);
      wsHeartbeatInterval = setInterval(() => {
        try {
          const rawUser = localStorage.getItem('abdul_deals_active_user_account_v2');
          const user = rawUser ? JSON.parse(rawUser) : null;
          if (user?.code) {
            sendWebSocketMessage({ type: 'heartbeat', userCode: user.code });
          }
        } catch {}
      }, 15000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (!data || !data.type) return;

        if (data.type === 'init') {
          if (Array.isArray(data.dms)) {
            localStorage.setItem(DMS_STORAGE_KEY, JSON.stringify(data.dms));
          }
          if (Array.isArray(data.friendRequests)) {
            localStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(data.friendRequests));
          }
          if (Array.isArray(data.friendships)) {
            localStorage.setItem(FRIENDSHIPS_KEY, JSON.stringify(data.friendships));
          }
          if (data.activeCall !== undefined) {
            if (data.activeCall) {
              localStorage.setItem(DIRECT_CALL_STORAGE_KEY, JSON.stringify(data.activeCall));
            } else {
              localStorage.removeItem(DIRECT_CALL_STORAGE_KEY);
            }
          }
          if (Array.isArray(data.accounts)) {
            const customOnly = data.accounts.filter((a: any) => a.isCustom || a.code !== '2015');
            localStorage.setItem('abdul_deals_custom_accounts_v4', JSON.stringify(customOnly));
            localStorage.setItem('abdul_deals_all_accounts_cache_v5', JSON.stringify(data.accounts));
            window.dispatchEvent(new CustomEvent('abdul_accounts_updated', { detail: data.accounts }));
          }
          broadcastLiveEvent({ type: 'direct_message' });
        } else if (data.type === 'direct_message') {
          const newDm: DirectMessage = data.payload;
          if (newDm) {
            const allDms = getStoredDirectMessages();
            if (!allDms.some((m) => m.id === newDm.id)) {
              const updated = [...allDms, newDm];
              localStorage.setItem(DMS_STORAGE_KEY, JSON.stringify(updated));
            }
            broadcastLiveEvent({
              type: 'direct_message',
              payload: newDm,
              senderCode: data.senderCode,
            });
          }
        } else if (data.type === 'dm_read') {
          const { currentUserCode, conversationId } = data.payload || {};
          if (currentUserCode && conversationId) {
            const allDms = getStoredDirectMessages();
            const updated = allDms.map((m) => {
              if (m.conversationId === conversationId && m.recipientCode === currentUserCode) {
                return { ...m, read: true };
              }
              return m;
            });
            localStorage.setItem(DMS_STORAGE_KEY, JSON.stringify(updated));
            broadcastLiveEvent({ type: 'direct_message' });
          }
        } else if (data.type === 'friend_request') {
          const newReq: FriendRequest = data.payload;
          if (newReq) {
            const allReqs = getStoredFriendRequests();
            if (!allReqs.some((r) => r.id === newReq.id)) {
              localStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify([...allReqs, newReq]));
            }
            broadcastLiveEvent({
              type: 'friend_request',
              payload: newReq,
              senderCode: data.senderCode,
            });
          }
        } else if (data.type === 'friend_accepted') {
          const { requestId, friendship } = data.payload || {};
          if (requestId) {
            const allReqs = getStoredFriendRequests();
            const updatedReqs = allReqs.map((r) => (r.id === requestId ? { ...r, status: 'accepted' as const } : r));
            localStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(updatedReqs));
          }
          if (friendship) {
            const allFs = getStoredFriendships();
            if (!allFs.some((f) => f.id === friendship.id)) {
              localStorage.setItem(FRIENDSHIPS_KEY, JSON.stringify([...allFs, friendship]));
            }
          }
          broadcastLiveEvent({
            type: 'friend_accepted',
            payload: data.payload,
            senderCode: data.senderCode,
          });
        } else if (data.type === 'friend_declined') {
          const { requestId } = data.payload || {};
          if (requestId) {
            const allReqs = getStoredFriendRequests().filter((r) => r.id !== requestId);
            localStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(allReqs));
            broadcastLiveEvent({ type: 'friend_request' });
          }
        } else if (data.type === 'friend_removed') {
          const { user1Code, user2Code } = data.payload || {};
          if (user1Code && user2Code) {
            const c1 = user1Code.toLowerCase();
            const c2 = user2Code.toLowerCase();
            const allFs = getStoredFriendships().filter(
              (f) =>
                !(
                  (f.user1Code.toLowerCase() === c1 && f.user2Code.toLowerCase() === c2) ||
                  (f.user1Code.toLowerCase() === c2 && f.user2Code.toLowerCase() === c1)
                )
            );
            localStorage.setItem(FRIENDSHIPS_KEY, JSON.stringify(allFs));
            broadcastLiveEvent({
              type: 'friend_removed',
              payload: data.payload,
            });
          }
        } else if (data.type === 'direct_call_start') {
          const session: DirectCallSession = data.payload;
          if (session) {
            localStorage.setItem(DIRECT_CALL_STORAGE_KEY, JSON.stringify(session));
            broadcastLiveEvent({
              type: 'direct_call_start',
              payload: session,
              senderCode: data.senderCode,
            });
          }
        } else if (data.type === 'direct_call_answer') {
          const session: DirectCallSession = data.payload;
          if (session) {
            localStorage.setItem(DIRECT_CALL_STORAGE_KEY, JSON.stringify(session));
            broadcastLiveEvent({
              type: 'direct_call_answer',
              payload: session,
            });
          }
        } else if (data.type === 'direct_call_end') {
          const session: DirectCallSession = data.payload;
          if (session) {
            localStorage.setItem(DIRECT_CALL_STORAGE_KEY, JSON.stringify(session));
          } else {
            localStorage.removeItem(DIRECT_CALL_STORAGE_KEY);
          }
          broadcastLiveEvent({
            type: 'direct_call_end',
            payload: session,
          });
        } else if (data.type === 'direct_call_update') {
          const session: DirectCallSession = data.payload;
          if (session) {
            localStorage.setItem(DIRECT_CALL_STORAGE_KEY, JSON.stringify(session));
            broadcastLiveEvent({
              type: 'direct_call_update',
              payload: session,
            });
          }
        } else if (data.type === 'call_signal') {
          // WebRTC / Voice peer signal
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('abdul_call_signal', { detail: data }));
          }
        } else if (data.type === 'accounts_updated' || data.type === 'presence_update') {
          if (Array.isArray(data.accounts)) {
            const customOnly = data.accounts.filter((a: any) => a.isCustom || a.code !== '2015');
            localStorage.setItem('abdul_deals_custom_accounts_v4', JSON.stringify(customOnly));
            localStorage.setItem('abdul_deals_all_accounts_cache_v5', JSON.stringify(data.accounts));
            window.dispatchEvent(new CustomEvent('abdul_accounts_updated', { detail: data.accounts }));
          }
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      if (wsHeartbeatInterval) clearInterval(wsHeartbeatInterval);
      wsClient = null;
      // Reconnect with small backoff
      if (wsReconnectTimeout) clearTimeout(wsReconnectTimeout);
      wsReconnectTimeout = setTimeout(() => {
        initRealtimeSocket();
      }, 2000);
    };

    ws.onerror = () => {
      try {
        ws.close();
      } catch {}
    };
  } catch (err) {
    console.warn('WebSocket init exception:', err);
  }
}

/**
 * Fetch latest community state from server and update local storage & broadcast
 */
export async function syncCommunityStateWithServer(userCode?: string): Promise<void> {
  try {
    const url = userCode ? `/api/community/state?userCode=${encodeURIComponent(userCode)}` : '/api/community/state';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.dms)) {
          localStorage.setItem(DMS_STORAGE_KEY, JSON.stringify(data.dms));
        }
        if (Array.isArray(data.friendRequests)) {
          localStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(data.friendRequests));
        }
        if (Array.isArray(data.friendships)) {
          localStorage.setItem(FRIENDSHIPS_KEY, JSON.stringify(data.friendships));
        }
        if (data.activeCall !== undefined) {
          if (data.activeCall) {
            localStorage.setItem(DIRECT_CALL_STORAGE_KEY, JSON.stringify(data.activeCall));
          } else {
            localStorage.removeItem(DIRECT_CALL_STORAGE_KEY);
          }
        }
        if (Array.isArray(data.accounts)) {
          const customOnly = data.accounts.filter((a: any) => a.isCustom || a.code !== '2015');
          localStorage.setItem('abdul_deals_custom_accounts_v4', JSON.stringify(customOnly));
          localStorage.setItem('abdul_deals_all_accounts_cache_v5', JSON.stringify(data.accounts));
          window.dispatchEvent(new CustomEvent('abdul_accounts_updated', { detail: data.accounts }));
        }
      }
    }
  } catch (e) {
    // Offline mode
  }
}

// Auto-initialize real-time WebSocket connection
if (typeof window !== 'undefined') {
  initRealtimeSocket();
  syncCommunityStateWithServer();
  // Secondary fallback heartbeat/sync every 5 seconds
  setInterval(() => {
    try {
      const rawUser = localStorage.getItem('abdul_deals_active_user_account_v2');
      const user = rawUser ? JSON.parse(rawUser) : null;
      if (!wsClient || wsClient.readyState !== WebSocket.OPEN) {
        initRealtimeSocket();
        syncCommunityStateWithServer(user?.code);
      }
    } catch {}
  }, 5000);
}

export function broadcastLiveEvent(event: Omit<LiveBusEvent, 'timestamp'>): void {
  const fullEvent: LiveBusEvent = {
    ...event,
    timestamp: Date.now(),
  };

  if (liveChannel) {
    try {
      liveChannel.postMessage(fullEvent);
    } catch {}
  }

  // Also dispatch window custom event for same-tab subscribers
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('abdul_live_bus_event', { detail: fullEvent }));
    } catch {}
  }
}

export function subscribeToLiveUpdates(callback: (event: LiveBusEvent) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleBroadcastMessage = (e: MessageEvent) => {
    if (e.data && e.data.type) {
      callback(e.data as LiveBusEvent);
    }
  };

  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<LiveBusEvent>;
    if (custom.detail) {
      callback(custom.detail);
    }
  };

  const handleStorageChange = (e: StorageEvent) => {
    if (
      e.key === DMS_STORAGE_KEY ||
      e.key === FRIEND_REQUESTS_KEY ||
      e.key === FRIENDSHIPS_KEY ||
      e.key === DIRECT_CALL_STORAGE_KEY
    ) {
      callback({
        type: e.key === DIRECT_CALL_STORAGE_KEY ? 'direct_call_update' : 'direct_message',
        timestamp: Date.now(),
      });
    }
  };

  if (liveChannel) {
    liveChannel.addEventListener('message', handleBroadcastMessage);
  }
  window.addEventListener('abdul_live_bus_event', handleCustomEvent);
  window.addEventListener('storage', handleStorageChange);

  return () => {
    if (liveChannel) {
      liveChannel.removeEventListener('message', handleBroadcastMessage);
    }
    window.removeEventListener('abdul_live_bus_event', handleCustomEvent);
    window.removeEventListener('storage', handleStorageChange);
  };
}

// ---------------- NOTIFICATION SETTINGS ---------------- //

export function getNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(NOTIF_SETTINGS_KEY);
    if (!raw) {
      const defaultSettings: NotificationSettings = { enabled: true, sound: true, showToasts: true };
      localStorage.setItem(NOTIF_SETTINGS_KEY, JSON.stringify(defaultSettings));
      return defaultSettings;
    }
    return JSON.parse(raw);
  } catch {
    return { enabled: true, sound: true, showToasts: true };
  }
}

export function saveNotificationSettings(settings: NotificationSettings): NotificationSettings {
  try {
    localStorage.setItem(NOTIF_SETTINGS_KEY, JSON.stringify(settings));
    broadcastLiveEvent({ type: 'notification_toggle', payload: settings });
  } catch {}
  return settings;
}

export function toggleNotifications(): NotificationSettings {
  const current = getNotificationSettings();
  const updated: NotificationSettings = {
    ...current,
    enabled: !current.enabled,
  };
  return saveNotificationSettings(updated);
}

// ---------------- DIRECT MESSAGES (DMs) ---------------- //

export function getConversationId(code1: string, code2: string): string {
  const sorted = [code1.toLowerCase(), code2.toLowerCase()].sort();
  return `dm_${sorted[0]}_${sorted[1]}`;
}

const BANNED_BOT_CODES = new Set(['1001', '1002', '1003', '1004', '1005', '1006', '1007']);

const DEFAULT_FALLBACK_DMS: DirectMessage[] = [];

export function getStoredDirectMessages(): DirectMessage[] {
  try {
    const raw = localStorage.getItem(DMS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: DirectMessage[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [];
    }
    
    // Deduplicate by message ID & filter banned bots
    const unique: DirectMessage[] = [];
    const seen = new Set<string>();
    for (const msg of parsed) {
      if (msg && msg.id && !seen.has(msg.id)) {
        const s = (msg.senderCode || '').toLowerCase().trim();
        const r = (msg.recipientCode || '').toLowerCase().trim();
        if (!BANNED_BOT_CODES.has(s) && !BANNED_BOT_CODES.has(r)) {
          seen.add(msg.id);
          unique.push(msg);
        }
      }
    }
    return unique;
  } catch {
    return [];
  }
}

export function getDirectMessagesBetween(user1Code: string, user2Code: string): DirectMessage[] {
  const c1 = (user1Code || '').toLowerCase().trim();
  const c2 = (user2Code || '').toLowerCase().trim();
  const conversationId = getConversationId(c1, c2);
  const allDms = getStoredDirectMessages();
  const filtered = allDms.filter((m) => {
    if (m.conversationId === conversationId) return true;
    const s = (m.senderCode || '').toLowerCase().trim();
    const r = (m.recipientCode || '').toLowerCase().trim();
    return (s === c1 && r === c2) || (s === c2 && r === c1);
  });
  
  // Deduplicate
  const unique: DirectMessage[] = [];
  const seen = new Set<string>();
  for (const m of filtered) {
    if (m && m.id && !seen.has(m.id)) {
      seen.add(m.id);
      unique.push(m);
    }
  }
  return unique;
}

export function sendDirectMessage(
  sender: UserAccount,
  recipient: UserAccount,
  text: string,
  dealSnippet?: DirectMessage['dealSnippet']
): DirectMessage {
  const allDms = getStoredDirectMessages();
  const conversationId = getConversationId(sender.code, recipient.code);

  const newDm: DirectMessage = {
    id: `dm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    conversationId,
    senderCode: sender.code,
    senderName: sender.name,
    senderAvatar: sender.avatarEmoji || '⭐',
    recipientCode: recipient.code,
    recipientName: recipient.name,
    text: text.trim(),
    timestamp: Date.now(),
    read: false,
    dealSnippet,
    reactions: {},
  };

  const updated = allDms.filter((m) => m.id !== newDm.id);
  updated.push(newDm);
  try {
    localStorage.setItem(DMS_STORAGE_KEY, JSON.stringify(updated));
    broadcastLiveEvent({
      type: 'direct_message',
      payload: newDm,
      senderCode: sender.code,
    });

    // 1. Instant sub-millisecond WebSocket transmission
    sendWebSocketMessage({
      type: 'direct_message',
      payload: newDm,
    });

    // 2. HTTP POST fallback
    fetch('/api/community/dm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: newDm }),
    }).catch(() => {});
  } catch (e) {
    console.error('Failed to save DM:', e);
  }

  return newDm;
}

export function markDirectMessagesAsRead(currentUserCode: string, otherUserCode: string): void {
  const conversationId = getConversationId(currentUserCode, otherUserCode);
  const allDms = getStoredDirectMessages();
  let hasChanges = false;

  const updated = allDms.map((m) => {
    if (m.conversationId === conversationId && m.recipientCode === currentUserCode && !m.read) {
      hasChanges = true;
      return { ...m, read: true };
    }
    return m;
  });

  if (hasChanges) {
    try {
      localStorage.setItem(DMS_STORAGE_KEY, JSON.stringify(updated));
      sendWebSocketMessage({
        type: 'dm_read',
        payload: { currentUserCode, conversationId },
      });
      fetch('/api/community/dm/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserCode, conversationId }),
      }).catch(() => {});
    } catch {}
  }
}

export function getUnreadDMsCountForUser(currentUserCode: string): number {
  const allDms = getStoredDirectMessages();
  return allDms.filter((m) => m.recipientCode === currentUserCode && !m.read).length;
}

export function getUnreadDMsCountFromFriend(currentUserCode: string, friendCode: string): number {
  const allDms = getStoredDirectMessages();
  const conversationId = getConversationId(currentUserCode, friendCode);
  return allDms.filter((m) => m.conversationId === conversationId && m.recipientCode === currentUserCode && !m.read).length;
}

export function getConversationPartners(currentUserCode: string): string[] {
  const myCode = (currentUserCode || '').toLowerCase().trim();
  if (!myCode) return [];
  const allDms = getStoredDirectMessages();
  const partnersMap = new Map<string, number>();

  allDms.forEach((dm) => {
    const s = (dm.senderCode || '').toLowerCase().trim();
    const r = (dm.recipientCode || '').toLowerCase().trim();
    if (s === myCode && r && r !== myCode) {
      const prev = partnersMap.get(r) || 0;
      if (dm.timestamp > prev) partnersMap.set(r, dm.timestamp);
    } else if (r === myCode && s && s !== myCode) {
      const prev = partnersMap.get(s) || 0;
      if (dm.timestamp > prev) partnersMap.set(s, dm.timestamp);
    }
  });

  return Array.from(partnersMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([code]) => code);
}

export function getLastMessageBetween(user1Code: string, user2Code: string): DirectMessage | undefined {
  const dms = getDirectMessagesBetween(user1Code, user2Code);
  if (dms.length === 0) return undefined;
  return dms[dms.length - 1];
}

// ---------------- FRIEND SYSTEM (ADD / ACCEPT / REJECT) ---------------- //

export function getStoredFriendRequests(): FriendRequest[] {
  try {
    const raw = localStorage.getItem(FRIEND_REQUESTS_KEY);
    if (!raw) return [];
    const parsed: FriendRequest[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const unique: FriendRequest[] = [];
    const seen = new Set<string>();
    for (const req of parsed) {
      if (req && req.id && !seen.has(req.id)) {
        seen.add(req.id);
        unique.push(req);
      }
    }
    return unique;
  } catch {
    return [];
  }
}

const DEFAULT_FALLBACK_FRIENDSHIPS: FriendShip[] = [];

export function getStoredFriendships(): FriendShip[] {
  try {
    const raw = localStorage.getItem(FRIENDSHIPS_KEY);
    if (!raw) {
      return [];
    }
    const parsed: FriendShip[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [];
    }
    const unique: FriendShip[] = [];
    const seenPairs = new Set<string>();
    for (const fs of parsed) {
      if (fs && fs.user1Code && fs.user2Code) {
        const u1 = fs.user1Code.toLowerCase().trim();
        const u2 = fs.user2Code.toLowerCase().trim();
        if (!BANNED_BOT_CODES.has(u1) && !BANNED_BOT_CODES.has(u2)) {
          const pairKey = [u1, u2].sort().join('_');
          if (!seenPairs.has(pairKey)) {
            seenPairs.add(pairKey);
            unique.push(fs);
          }
        }
      }
    }
    return unique;
  } catch {
    return [];
  }
}

export function areFriends(user1Code: string, user2Code: string): boolean {
  if (user1Code.toLowerCase() === user2Code.toLowerCase()) return true;
  const friendships = getStoredFriendships();
  const c1 = user1Code.toLowerCase();
  const c2 = user2Code.toLowerCase();
  return friendships.some(
    (f) =>
      (f.user1Code.toLowerCase() === c1 && f.user2Code.toLowerCase() === c2) ||
      (f.user1Code.toLowerCase() === c2 && f.user2Code.toLowerCase() === c1)
  );
}

export function sendFriendRequest(
  currentUser: UserAccount,
  targetCodeOrName: string
): { success: boolean; message: string; request?: FriendRequest } {
  const cleanTarget = targetCodeOrName.trim().toLowerCase();
  if (!cleanTarget) {
    return { success: false, message: 'Please select a member to add.' };
  }

  const allAccounts = getStoredUserAccounts();
  const targetAccount = allAccounts.find(
    (acc) =>
      acc.code.toLowerCase() === cleanTarget ||
      acc.name.trim().toLowerCase() === cleanTarget
  );

  if (!targetAccount) {
    return { success: false, message: `No registered member found matching "${targetCodeOrName}".` };
  }

  if (targetAccount.code.toLowerCase() === currentUser.code.toLowerCase()) {
    return { success: false, message: "You cannot add yourself as a friend!" };
  }

  if (areFriends(currentUser.code, targetAccount.code)) {
    return { success: false, message: `You and ${targetAccount.name} are already friends!` };
  }

  const allRequests = getStoredFriendRequests();
  // Check if request already pending
  const existingPending = allRequests.find(
    (r) =>
      r.status === 'pending' &&
      ((r.fromUserCode === currentUser.code && r.toUserCode === targetAccount.code) ||
        (r.fromUserCode === targetAccount.code && r.toUserCode === currentUser.code))
  );

  if (existingPending) {
    if (existingPending.fromUserCode === currentUser.code) {
      return { success: false, message: `Friend request already sent to ${targetAccount.name}. Awaiting acceptance.` };
    } else {
      // The other person already sent one, auto-accept it
      acceptFriendRequest(existingPending.id, currentUser);
      return { success: true, message: `Accepted friend request from ${targetAccount.name}! You are now friends.` };
    }
  }

  const newRequest: FriendRequest = {
    id: `freq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    fromUserCode: currentUser.code,
    fromUserName: currentUser.name,
    fromUserAvatar: currentUser.avatarEmoji || '⭐',
    toUserCode: targetAccount.code,
    toUserName: targetAccount.name,
    status: 'pending',
    createdAt: Date.now(),
  };

  const updated = [...allRequests, newRequest];
  try {
    localStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(updated));
    broadcastLiveEvent({
      type: 'friend_request',
      payload: newRequest,
      senderCode: currentUser.code,
    });

    sendWebSocketMessage({
      type: 'friend_request',
      payload: newRequest,
    });

    fetch('/api/community/friend-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request: newRequest }),
    }).catch(() => {});
  } catch (e) {
    console.error('Failed to save friend request:', e);
  }

  return {
    success: true,
    message: `✓ Friend request sent to ${targetAccount.name}!`,
    request: newRequest,
  };
}

export function acceptFriendRequest(requestId: string, currentUser: UserAccount): { success: boolean; newFriend?: UserAccount } {
  const allRequests = getStoredFriendRequests();
  const req = allRequests.find((r) => r.id === requestId);
  if (!req) return { success: false };

  // Update request status
  const updatedRequests = allRequests.map((r) =>
    r.id === requestId ? { ...r, status: 'accepted' as const } : r
  );

  // Add friendship
  const allFriendships = getStoredFriendships();
  const friendship: FriendShip = {
    id: `fs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user1Code: req.fromUserCode,
    user2Code: req.toUserCode,
    createdAt: Date.now(),
  };

  const updatedFriendships = [...allFriendships, friendship];

  try {
    localStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(updatedRequests));
    localStorage.setItem(FRIENDSHIPS_KEY, JSON.stringify(updatedFriendships));
    broadcastLiveEvent({
      type: 'friend_accepted',
      payload: { requestId, friendship, fromUserCode: req.fromUserCode, toUserCode: req.toUserCode },
      senderCode: currentUser.code,
    });

    sendWebSocketMessage({
      type: 'friend_accept',
      payload: { requestId, currentUserCode: currentUser.code },
    });

    fetch('/api/community/friend-request/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, currentUserCode: currentUser.code }),
    }).catch(() => {});
  } catch (e) {
    console.error('Failed to accept friend request:', e);
  }

  const allAccounts = getStoredUserAccounts();
  const otherCode = req.fromUserCode === currentUser.code ? req.toUserCode : req.fromUserCode;
  const newFriend = allAccounts.find((a) => a.code === otherCode);

  return { success: true, newFriend };
}

export function declineFriendRequest(requestId: string): void {
  const allRequests = getStoredFriendRequests();
  const updated = allRequests.filter((r) => r.id !== requestId);
  try {
    localStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(updated));
    sendWebSocketMessage({
      type: 'friend_decline',
      payload: { requestId },
    });
    fetch('/api/community/friend-request/decline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId }),
    }).catch(() => {});
  } catch {}
}

export function getUserFriends(userCode: string): UserAccount[] {
  const allFriendships = getStoredFriendships();
  const allAccounts = getStoredUserAccounts();
  const c = userCode.toLowerCase();

  const friendCodes = new Set<string>();
  allFriendships.forEach((f) => {
    if (f.user1Code.toLowerCase() === c) friendCodes.add(f.user2Code.toLowerCase());
    if (f.user2Code.toLowerCase() === c) friendCodes.add(f.user1Code.toLowerCase());
  });

  return allAccounts.filter((acc) => friendCodes.has(acc.code.toLowerCase()));
}

export function getPendingIncomingRequests(userCode: string): FriendRequest[] {
  const allRequests = getStoredFriendRequests();
  const c = userCode.toLowerCase();
  return allRequests.filter((r) => r.toUserCode.toLowerCase() === c && r.status === 'pending');
}

export function getPendingSentRequests(userCode: string): FriendRequest[] {
  const allRequests = getStoredFriendRequests();
  const c = userCode.toLowerCase();
  return allRequests.filter((r) => r.fromUserCode.toLowerCase() === c && r.status === 'pending');
}

export function removeFriend(user1Code: string, user2Code: string): void {
  const allFriendships = getStoredFriendships();
  const c1 = user1Code.toLowerCase();
  const c2 = user2Code.toLowerCase();
  const updated = allFriendships.filter(
    (f) =>
      !(
        (f.user1Code.toLowerCase() === c1 && f.user2Code.toLowerCase() === c2) ||
        (f.user1Code.toLowerCase() === c2 && f.user2Code.toLowerCase() === c1)
      )
  );
  try {
    localStorage.setItem(FRIENDSHIPS_KEY, JSON.stringify(updated));
    broadcastLiveEvent({
      type: 'friend_removed',
      payload: { user1Code, user2Code },
    });

    sendWebSocketMessage({
      type: 'friend_remove',
      payload: { user1Code, user2Code },
    });

    fetch('/api/community/friend-remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user1Code, user2Code }),
    }).catch(() => {});
  } catch {}
}

// ---------------- 1-ON-1 DIRECT CALLS ---------------- //

export function getStoredDirectCallSession(): DirectCallSession | null {
  try {
    const raw = localStorage.getItem(DIRECT_CALL_STORAGE_KEY);
    if (!raw) return null;
    const session: DirectCallSession = JSON.parse(raw);
    if (session.status === 'ended' || session.status === 'declined') {
      // Auto clear expired calls
      if (Date.now() - session.startedAt > 60000) {
        localStorage.removeItem(DIRECT_CALL_STORAGE_KEY);
        return null;
      }
    }
    return session;
  } catch {
    return null;
  }
}

export function startDirectCall(caller: UserAccount, recipient: UserAccount): DirectCallSession {
  const session: DirectCallSession = {
    id: `call-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    callerCode: caller.code,
    callerName: caller.name,
    callerAvatar: caller.avatarEmoji || '👑',
    recipientCode: recipient.code,
    recipientName: recipient.name,
    recipientAvatar: recipient.avatarEmoji || '👤',
    status: 'ringing',
    startedAt: Date.now(),
    callerMuted: false,
    recipientMuted: false,
  };

  try {
    localStorage.setItem(DIRECT_CALL_STORAGE_KEY, JSON.stringify(session));
    broadcastLiveEvent({
      type: 'direct_call_start',
      payload: session,
      senderCode: caller.code,
    });

    sendWebSocketMessage({
      type: 'direct_call_start',
      payload: session,
    });

    fetch('/api/community/call/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session }),
    }).catch(() => {});
  } catch (e) {
    console.error('Failed to start direct call:', e);
  }

  return session;
}

export function answerDirectCall(callId: string): DirectCallSession | null {
  const current = getStoredDirectCallSession();
  if (!current || current.id !== callId) return null;

  const updated: DirectCallSession = {
    ...current,
    status: 'connected',
    connectedAt: Date.now(),
  };

  try {
    localStorage.setItem(DIRECT_CALL_STORAGE_KEY, JSON.stringify(updated));
    broadcastLiveEvent({
      type: 'direct_call_answer',
      payload: updated,
    });

    sendWebSocketMessage({
      type: 'direct_call_answer',
      payload: { callId },
    });

    fetch('/api/community/call/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId }),
    }).catch(() => {});
  } catch {}

  return updated;
}

export function declineDirectCall(callId: string): void {
  const current = getStoredDirectCallSession();
  if (!current || current.id !== callId) return;

  const updated: DirectCallSession = {
    ...current,
    status: 'declined',
    endedAt: Date.now(),
  };

  try {
    localStorage.setItem(DIRECT_CALL_STORAGE_KEY, JSON.stringify(updated));
    broadcastLiveEvent({
      type: 'direct_call_end',
      payload: updated,
    });

    sendWebSocketMessage({
      type: 'direct_call_end',
      payload: { callId },
    });

    fetch('/api/community/call/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId }),
    }).catch(() => {});
  } catch {}
}

export function endDirectCall(callId?: string): void {
  const current = getStoredDirectCallSession();
  if (!current) return;
  if (callId && current.id !== callId) return;

  const updated: DirectCallSession = {
    ...current,
    status: 'ended',
    endedAt: Date.now(),
  };

  try {
    localStorage.setItem(DIRECT_CALL_STORAGE_KEY, JSON.stringify(updated));
    broadcastLiveEvent({
      type: 'direct_call_end',
      payload: updated,
    });

    sendWebSocketMessage({
      type: 'direct_call_end',
      payload: { callId: current.id },
    });

    fetch('/api/community/call/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId: current.id }),
    }).catch(() => {});
  } catch {}
}

export function toggleDirectCallMute(callId: string, userCode: string, muted: boolean): DirectCallSession | null {
  const current = getStoredDirectCallSession();
  if (!current || current.id !== callId) return null;

  const isCaller = current.callerCode === userCode;
  const updated: DirectCallSession = {
    ...current,
    callerMuted: isCaller ? muted : current.callerMuted,
    recipientMuted: !isCaller ? muted : current.recipientMuted,
  };

  try {
    localStorage.setItem(DIRECT_CALL_STORAGE_KEY, JSON.stringify(updated));
    broadcastLiveEvent({
      type: 'direct_call_update',
      payload: updated,
    });

    sendWebSocketMessage({
      type: 'direct_call_update',
      payload: updated,
    });

    fetch('/api/community/call/mute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId, userCode, muted }),
    }).catch(() => {});
  } catch {}

  return updated;
}
