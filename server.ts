import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

interface UserAccount {
  id?: string;
  code: string;
  name: string;
  dateOfBirth?: string;
  password?: string;
  avatarEmoji: string;
  roleTitle: string;
  isOwner?: boolean;
  isCustom?: boolean;
  createdAt?: number;
  status?: "online" | "offline" | "in-call" | "away";
  lastSeen?: number;
  bio?: string;
  aCard?: any;
}

interface DirectMessage {
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

interface FriendRequest {
  id: string;
  fromUserCode: string;
  fromUserName: string;
  fromUserAvatar: string;
  toUserCode: string;
  toUserName: string;
  status: "pending" | "accepted" | "declined";
  createdAt: number;
}

interface FriendShip {
  id: string;
  user1Code: string;
  user2Code: string;
  createdAt: number;
}

interface DirectCallSession {
  id: string;
  callerCode: string;
  callerName: string;
  callerAvatar: string;
  recipientCode: string;
  recipientName: string;
  recipientAvatar: string;
  status: "ringing" | "connected" | "ended" | "declined";
  startedAt: number;
  connectedAt?: number;
  endedAt?: number;
  callerMuted?: boolean;
  recipientMuted?: boolean;
}

interface DatabaseSchema {
  accounts: UserAccount[];
  dms: DirectMessage[];
  friendRequests: FriendRequest[];
  friendships: FriendShip[];
  activeCall: DirectCallSession | null;
  heartbeats: Record<string, number>;
}

const DEFAULT_OWNER_ACCOUNT: UserAccount = {
  id: "owner-2015",
  code: "2015",
  name: "Abdul",
  password: "2015",
  dateOfBirth: "2015-01-01",
  avatarEmoji: "👑",
  roleTitle: "Store Owner",
  bio: "Founder & Store Owner",
  isOwner: true,
  createdAt: 1700000000000,
  status: "online",
};

const BANNED_BOT_CODES = new Set(["1001", "1002", "1003", "1004", "1005", "1006", "1007"]);

let db: DatabaseSchema = {
  accounts: [DEFAULT_OWNER_ACCOUNT],
  dms: [],
  friendRequests: [],
  friendships: [],
  activeCall: null,
  heartbeats: {
    "2015": Date.now(),
  },
};

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    console.error("Failed to create data directory:", e);
  }
}

function loadDatabase(): void {
  ensureDataDir();
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      
      // Filter out any banned bot accounts
      const rawAccs: UserAccount[] = parsed.accounts || [DEFAULT_OWNER_ACCOUNT];
      const uniqueAccs: UserAccount[] = [];
      const seenCodes = new Set<string>();
      for (const acc of rawAccs) {
        if (acc && acc.code) {
          const c = acc.code.toLowerCase().trim();
          if (!BANNED_BOT_CODES.has(c) && !seenCodes.has(c)) {
            seenCodes.add(c);
            uniqueAccs.push(acc);
          }
        }
      }

      // Filter DMs
      const rawDms: DirectMessage[] = parsed.dms || [];
      const uniqueDms: DirectMessage[] = [];
      const seenDmIds = new Set<string>();
      for (const dm of rawDms) {
        if (dm && dm.id && !seenDmIds.has(dm.id)) {
          const s = (dm.senderCode || "").toLowerCase().trim();
          const r = (dm.recipientCode || "").toLowerCase().trim();
          if (!BANNED_BOT_CODES.has(s) && !BANNED_BOT_CODES.has(r)) {
            seenDmIds.add(dm.id);
            uniqueDms.push(dm);
          }
        }
      }

      // Filter friend requests
      const rawReqs: FriendRequest[] = parsed.friendRequests || [];
      const uniqueReqs: FriendRequest[] = [];
      const seenReqIds = new Set<string>();
      for (const req of rawReqs) {
        if (req && req.id && !seenReqIds.has(req.id)) {
          const f = (req.fromUserCode || "").toLowerCase().trim();
          const t = (req.toUserCode || "").toLowerCase().trim();
          if (!BANNED_BOT_CODES.has(f) && !BANNED_BOT_CODES.has(t)) {
            seenReqIds.add(req.id);
            uniqueReqs.push(req);
          }
        }
      }

      // Filter friendships
      const rawFs: FriendShip[] = parsed.friendships || [];
      const uniqueFs: FriendShip[] = [];
      const seenFsPairs = new Set<string>();
      for (const f of rawFs) {
        if (f && f.user1Code && f.user2Code) {
          const u1 = f.user1Code.toLowerCase().trim();
          const u2 = f.user2Code.toLowerCase().trim();
          if (!BANNED_BOT_CODES.has(u1) && !BANNED_BOT_CODES.has(u2)) {
            const key = [u1, u2].sort().join('_');
            if (!seenFsPairs.has(key)) {
              seenFsPairs.add(key);
              uniqueFs.push(f);
            }
          }
        }
      }

      db = {
        accounts: uniqueAccs,
        dms: uniqueDms,
        friendRequests: uniqueReqs,
        friendships: uniqueFs,
        activeCall: parsed.activeCall || null,
        heartbeats: {
          "2015": Date.now(),
        },
      };

      // Ensure default owner always exists
      const hasOwner = db.accounts.some(
        (a) => a.code === "2015" || a.name.toLowerCase() === "abdul"
      );
      if (!hasOwner) {
        db.accounts.unshift(DEFAULT_OWNER_ACCOUNT);
      }
      saveDatabase();
    } else {
      saveDatabase();
    }
  } catch (e) {
    console.error("Failed to load database, initializing defaults:", e);
  }
}

function saveDatabase(): void {
  ensureDataDir();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save database:", e);
  }
}

function getAccountsWithOnlineStatus(): UserAccount[] {
  const now = Date.now();
  return db.accounts.map((acc) => {
    const last = db.heartbeats[acc.code.toLowerCase()] || acc.lastSeen || 0;
    // Considered online if active within last 45 seconds or if owner
    const isOnline = acc.code === "2015" || now - last < 45000;
    return {
      ...acc,
      status: isOnline ? "online" : "offline",
      lastSeen: last,
    };
  });
}

async function startServer() {
  loadDatabase();

  const app = express();
  app.use(express.json());

  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Broadcast helper function to push instant real-time events to all connected WebSocket clients
  function broadcastEvent(event: any, excludeWs?: WebSocket) {
    const dataStr = JSON.stringify(event);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client !== excludeWs) {
        try {
          client.send(dataStr);
        } catch (e) {
          console.error("WS broadcast error:", e);
        }
      }
    });
  }

  // WebSocket connection & real-time messaging pipeline
  wss.on("connection", (ws: WebSocket & { userCode?: string }) => {
    // Send initial snapshot on connect
    ws.send(
      JSON.stringify({
        type: "init",
        accounts: getAccountsWithOnlineStatus(),
        dms: db.dms,
        friendRequests: db.friendRequests,
        friendships: db.friendships,
        activeCall: db.activeCall,
      })
    );

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (!msg || !msg.type) return;

        if (msg.type === "auth" || msg.type === "heartbeat") {
          const userCode = (msg.userCode || msg.code || "").trim();
          if (userCode) {
            ws.userCode = userCode;
            db.heartbeats[userCode.toLowerCase()] = Date.now();
            broadcastEvent({
              type: "presence_update",
              userCode,
              status: "online",
              accounts: getAccountsWithOnlineStatus(),
            });
          }
        } else if (msg.type === "direct_message") {
          const message = msg.payload;
          if (message && message.senderCode && message.recipientCode && message.text) {
            const dmId = message.id || `dm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const existingIdx = db.dms.findIndex((m) => m.id === dmId);
            const newDm: DirectMessage = {
              id: dmId,
              conversationId: message.conversationId,
              senderCode: message.senderCode,
              senderName: message.senderName,
              senderAvatar: message.senderAvatar || "⭐",
              recipientCode: message.recipientCode,
              recipientName: message.recipientName,
              text: message.text.trim(),
              timestamp: message.timestamp || Date.now(),
              read: false,
              dealSnippet: message.dealSnippet,
              reactions: message.reactions || {},
            };
            if (existingIdx >= 0) {
              db.dms[existingIdx] = newDm;
            } else {
              db.dms.push(newDm);
            }
            db.heartbeats[message.senderCode.toLowerCase()] = Date.now();
            saveDatabase();
            broadcastEvent({ type: "direct_message", payload: newDm, senderCode: newDm.senderCode });
          }
        } else if (msg.type === "dm_read") {
          const { currentUserCode, conversationId } = msg.payload || {};
          if (currentUserCode && conversationId) {
            let changed = false;
            db.dms = db.dms.map((m) => {
              if (m.conversationId === conversationId && m.recipientCode === currentUserCode && !m.read) {
                changed = true;
                return { ...m, read: true };
              }
              return m;
            });
            if (changed) {
              saveDatabase();
              broadcastEvent({ type: "dm_read", payload: { currentUserCode, conversationId } });
            }
          }
        } else if (msg.type === "friend_request") {
          const reqPayload = msg.payload;
          if (reqPayload && reqPayload.fromUserCode && reqPayload.toUserCode) {
            const reqId = reqPayload.id || `freq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const existingIdx = db.friendRequests.findIndex((r) => r.id === reqId);
            const newReq: FriendRequest = {
              id: reqId,
              fromUserCode: reqPayload.fromUserCode,
              fromUserName: reqPayload.fromUserName,
              fromUserAvatar: reqPayload.fromUserAvatar || "⭐",
              toUserCode: reqPayload.toUserCode,
              toUserName: reqPayload.toUserName,
              status: "pending",
              createdAt: Date.now(),
            };
            if (existingIdx >= 0) {
              db.friendRequests[existingIdx] = newReq;
            } else {
              db.friendRequests.push(newReq);
            }
            saveDatabase();
            broadcastEvent({ type: "friend_request", payload: newReq, senderCode: newReq.fromUserCode });
          }
        } else if (msg.type === "friend_accept") {
          const { requestId, currentUserCode } = msg.payload || {};
          const found = db.friendRequests.find((r) => r.id === requestId);
          if (found) {
            found.status = "accepted";
            const c1 = found.fromUserCode.toLowerCase();
            const c2 = found.toUserCode.toLowerCase();
            const alreadyFriends = db.friendships.some(
              (f) =>
                (f.user1Code.toLowerCase() === c1 && f.user2Code.toLowerCase() === c2) ||
                (f.user1Code.toLowerCase() === c2 && f.user2Code.toLowerCase() === c1)
            );
            let newFs: FriendShip | null = null;
            if (!alreadyFriends) {
              newFs = {
                id: `fs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                user1Code: found.fromUserCode,
                user2Code: found.toUserCode,
                createdAt: Date.now(),
              };
              db.friendships.push(newFs);
            }
            saveDatabase();
            broadcastEvent({
              type: "friend_accepted",
              payload: {
                requestId,
                friendship: newFs,
                fromUserCode: found.fromUserCode,
                toUserCode: found.toUserCode,
              },
              senderCode: currentUserCode,
            });
          }
        } else if (msg.type === "friend_decline") {
          const { requestId } = msg.payload || {};
          if (requestId) {
            db.friendRequests = db.friendRequests.filter((r) => r.id !== requestId);
            saveDatabase();
            broadcastEvent({ type: "friend_declined", payload: { requestId } });
          }
        } else if (msg.type === "friend_remove") {
          const { user1Code, user2Code } = msg.payload || {};
          const c1 = (user1Code || "").toLowerCase();
          const c2 = (user2Code || "").toLowerCase();
          db.friendships = db.friendships.filter(
            (f) =>
              !(
                (f.user1Code.toLowerCase() === c1 && f.user2Code.toLowerCase() === c2) ||
                (f.user1Code.toLowerCase() === c2 && f.user2Code.toLowerCase() === c1)
              )
          );
          saveDatabase();
          broadcastEvent({ type: "friend_removed", payload: { user1Code, user2Code } });
        } else if (msg.type === "direct_call_start") {
          const session = msg.payload;
          if (session) {
            db.activeCall = session;
            saveDatabase();
            broadcastEvent({ type: "direct_call_start", payload: session, senderCode: session.callerCode });
          }
        } else if (msg.type === "direct_call_answer") {
          const { callId } = msg.payload || {};
          if (db.activeCall && db.activeCall.id === callId) {
            db.activeCall.status = "connected";
            db.activeCall.connectedAt = Date.now();
            saveDatabase();
            broadcastEvent({ type: "direct_call_answer", payload: db.activeCall });
          }
        } else if (msg.type === "direct_call_end") {
          const { callId } = msg.payload || {};
          if (db.activeCall && (!callId || db.activeCall.id === callId)) {
            db.activeCall.status = "ended";
            db.activeCall.endedAt = Date.now();
            saveDatabase();
            broadcastEvent({ type: "direct_call_end", payload: db.activeCall });
          }
        } else if (msg.type === "direct_call_update") {
          const updated = msg.payload;
          if (updated) {
            db.activeCall = updated;
            saveDatabase();
            broadcastEvent({ type: "direct_call_update", payload: updated });
          }
        } else if (msg.type === "call_signal") {
          // WebRTC / Voice Signaling between call peers
          broadcastEvent(
            {
              type: "call_signal",
              payload: msg.payload,
              senderCode: msg.senderCode,
              targetCode: msg.targetCode,
            },
            ws
          );
        }
      } catch (e) {
        console.error("Error processing WS message:", e);
      }
    });

    ws.on("close", () => {
      if (ws.userCode) {
        // If in call, handle disconnect
        if (db.activeCall && (db.activeCall.callerCode === ws.userCode || db.activeCall.recipientCode === ws.userCode)) {
          db.activeCall.status = "ended";
          db.activeCall.endedAt = Date.now();
          saveDatabase();
          broadcastEvent({ type: "direct_call_end", payload: db.activeCall });
        }
      }
    });
  });

  // 1. Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", count: db.accounts.length });
  });

  // 2. Get all accounts (online & offline)
  app.get("/api/accounts", (_req, res) => {
    res.json({ success: true, accounts: getAccountsWithOnlineStatus() });
  });

  // 3. Heartbeat / presence
  app.post("/api/accounts/heartbeat", (req, res) => {
    const { code } = req.body;
    if (code) {
      db.heartbeats[code.toLowerCase()] = Date.now();
    }
    res.json({ success: true, status: "online" });
  });

  // 4. Sign Up a new account (permanently saved across all devices)
  app.post("/api/accounts/signup", (req, res) => {
    const { name, dateOfBirth, password, avatarEmoji, roleTitle, bio } = req.body;
    const cleanName = (name || "").trim();
    const cleanDob = (dateOfBirth || "").trim();
    const cleanPass = (password || "").trim();

    if (!cleanName) {
      return res.status(400).json({ success: false, error: "Please enter your name." });
    }
    if (!cleanDob) {
      return res.status(400).json({ success: false, error: "Please enter your date of birth." });
    }
    if (!cleanPass) {
      return res.status(400).json({ success: false, error: "Please enter a password." });
    }

    // Check duplicate name
    const exists = db.accounts.some(
      (a) => a.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (exists) {
      return res.status(400).json({
        success: false,
        error: `The name "${cleanName}" is already taken. You cannot copy other people's names! Please choose a unique name.`,
      });
    }

    let generatedCode = cleanPass;
    if (db.accounts.some((a) => a.code.toLowerCase() === generatedCode.toLowerCase())) {
      generatedCode = `${cleanPass}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const newAccount: UserAccount = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      code: generatedCode,
      name: cleanName,
      dateOfBirth: cleanDob,
      password: cleanPass,
      avatarEmoji: (avatarEmoji || "⭐").trim(),
      roleTitle: (roleTitle || "VIP Member").trim(),
      isCustom: true,
      createdAt: Date.now(),
      status: "online",
      lastSeen: Date.now(),
      bio: bio || "",
    };

    db.accounts.push(newAccount);
    db.heartbeats[newAccount.code.toLowerCase()] = Date.now();
    saveDatabase();
    broadcastEvent({ type: "accounts_updated", accounts: getAccountsWithOnlineStatus() });

    return res.json({ success: true, account: newAccount, allAccounts: getAccountsWithOnlineStatus() });
  });

  // 5. Login
  app.post("/api/accounts/login", (req, res) => {
    const { nameOrCode, password } = req.body;
    const cleanInput = (nameOrCode || "").trim();
    const cleanPass = (password || "").trim();

    if (!cleanInput) {
      return res.status(400).json({ success: false, error: "Please enter your Name or Passcode." });
    }

    // Owner check
    if (cleanInput === "2015" || cleanInput.toLowerCase() === "abdul") {
      if (cleanPass !== "2015") {
        return res.status(400).json({ success: false, error: "Incorrect password for Abdul (2015)." });
      }
      db.heartbeats["2015"] = Date.now();
      return res.json({ success: true, account: DEFAULT_OWNER_ACCOUNT });
    }

    // By Name
    const byName = db.accounts.find(
      (a) => a.name.trim().toLowerCase() === cleanInput.toLowerCase()
    );
    if (byName) {
      if (byName.password && byName.password !== cleanPass) {
        return res.status(400).json({ success: false, error: "Incorrect password. Please try again." });
      }
      db.heartbeats[byName.code.toLowerCase()] = Date.now();
      return res.json({ success: true, account: byName });
    }

    // By Code
    const byCode = db.accounts.find(
      (a) => a.code.toLowerCase() === cleanInput.toLowerCase()
    );
    if (byCode) {
      if (byCode.password && cleanPass && byCode.password !== cleanPass) {
        return res.status(400).json({ success: false, error: "Incorrect password for this code." });
      }
      db.heartbeats[byCode.code.toLowerCase()] = Date.now();
      return res.json({ success: true, account: byCode });
    }

    return res.status(404).json({
      success: false,
      error: `Account "${cleanInput}" not found. Please check spelling or Sign Up to create your account.`,
    });
  });

  // 6. Sync Client Local Accounts to Server
  app.post("/api/accounts/sync", (req, res) => {
    const { localAccounts } = req.body;
    if (Array.isArray(localAccounts)) {
      let changed = false;
      for (const clientAcc of localAccounts) {
        if (!clientAcc || !clientAcc.name || !clientAcc.code) continue;
        const existingIdx = db.accounts.findIndex(
          (a) =>
            a.code.toLowerCase() === clientAcc.code.toLowerCase() ||
            a.name.trim().toLowerCase() === clientAcc.name.trim().toLowerCase()
        );
        if (existingIdx === -1) {
          db.accounts.push({
            ...clientAcc,
            status: "offline",
          });
          changed = true;
        } else {
          // Merge aCard if updated
          if (clientAcc.aCard && JSON.stringify(db.accounts[existingIdx].aCard) !== JSON.stringify(clientAcc.aCard)) {
            db.accounts[existingIdx].aCard = clientAcc.aCard;
            changed = true;
          }
        }
      }
      if (changed) {
        saveDatabase();
        broadcastEvent({ type: "accounts_updated", accounts: getAccountsWithOnlineStatus() });
      }
    }
    res.json({ success: true, accounts: getAccountsWithOnlineStatus() });
  });

  // 6a. Update A Card for Account
  app.post("/api/accounts/acard/update", (req, res) => {
    const { userCode, aCard } = req.body;
    if (!userCode) {
      return res.status(400).json({ success: false, error: "userCode is required" });
    }
    const cleanCode = String(userCode).trim().toLowerCase();
    const accIdx = db.accounts.findIndex((a) => a.code.toLowerCase() === cleanCode);
    if (accIdx >= 0) {
      db.accounts[accIdx].aCard = aCard;
      saveDatabase();
      broadcastEvent({ type: "accounts_updated", accounts: getAccountsWithOnlineStatus() });
      return res.json({ success: true, account: db.accounts[accIdx] });
    }
    res.json({ success: false, error: "Account not found" });
  });

  // 6b. Delete Account from Server
  app.post("/api/accounts/delete", (req, res) => {
    const { code } = req.body;
    if (code && code !== "2015") {
      db.accounts = db.accounts.filter((a) => a.code.toLowerCase() !== code.toLowerCase());
      delete db.heartbeats[code.toLowerCase()];
      saveDatabase();
      broadcastEvent({ type: "accounts_updated", accounts: getAccountsWithOnlineStatus() });
    }
    res.json({ success: true, accounts: getAccountsWithOnlineStatus() });
  });

  // 7. Full community state (Accounts, DMs, Friend Requests, Friendships, Calls)
  app.get("/api/community/state", (req, res) => {
    const userCode = (req.query.userCode as string) || "";
    if (userCode) {
      db.heartbeats[userCode.toLowerCase()] = Date.now();
    }

    // Clean up expired calls (>60s ended/declined)
    if (db.activeCall && (db.activeCall.status === "ended" || db.activeCall.status === "declined")) {
      if (Date.now() - db.activeCall.startedAt > 60000) {
        db.activeCall = null;
      }
    }

    res.json({
      success: true,
      accounts: getAccountsWithOnlineStatus(),
      dms: db.dms,
      friendRequests: db.friendRequests,
      friendships: db.friendships,
      activeCall: db.activeCall,
    });
  });

  // 8. Post DM
  app.post("/api/community/dm", (req, res) => {
    const { message } = req.body;
    if (!message || !message.senderCode || !message.recipientCode || !message.text) {
      return res.status(400).json({ success: false, error: "Invalid message payload" });
    }

    const dmId = message.id || `dm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const existingIdx = db.dms.findIndex((m) => m.id === dmId);

    const newDm: DirectMessage = {
      id: dmId,
      conversationId: message.conversationId,
      senderCode: message.senderCode,
      senderName: message.senderName,
      senderAvatar: message.senderAvatar || "⭐",
      recipientCode: message.recipientCode,
      recipientName: message.recipientName,
      text: message.text.trim(),
      timestamp: message.timestamp || Date.now(),
      read: false,
      dealSnippet: message.dealSnippet,
      reactions: message.reactions || {},
    };

    if (existingIdx >= 0) {
      db.dms[existingIdx] = newDm;
    } else {
      db.dms.push(newDm);
    }
    db.heartbeats[message.senderCode.toLowerCase()] = Date.now();
    saveDatabase();
    broadcastEvent({ type: "direct_message", payload: newDm, senderCode: newDm.senderCode });

    res.json({ success: true, message: newDm, dms: db.dms });
  });

  // 9. Mark DMs read
  app.post("/api/community/dm/read", (req, res) => {
    const { currentUserCode, conversationId } = req.body;
    if (currentUserCode && conversationId) {
      let changed = false;
      db.dms = db.dms.map((m) => {
        if (m.conversationId === conversationId && m.recipientCode === currentUserCode && !m.read) {
          changed = true;
          return { ...m, read: true };
        }
        return m;
      });
      if (changed) {
        saveDatabase();
        broadcastEvent({ type: "dm_read", payload: { currentUserCode, conversationId } });
      }
    }
    res.json({ success: true, dms: db.dms });
  });

  // 10. Send friend request
  app.post("/api/community/friend-request", (req, res) => {
    const { request } = req.body;
    if (!request || !request.fromUserCode || !request.toUserCode) {
      return res.status(400).json({ success: false, error: "Invalid request payload" });
    }

    // Check if already friends
    const isFriend = db.friendships.some(
      (f) =>
        (f.user1Code.toLowerCase() === request.fromUserCode.toLowerCase() &&
          f.user2Code.toLowerCase() === request.toUserCode.toLowerCase()) ||
        (f.user1Code.toLowerCase() === request.toUserCode.toLowerCase() &&
          f.user2Code.toLowerCase() === request.fromUserCode.toLowerCase())
    );

    if (isFriend) {
      return res.json({ success: true, alreadyFriends: true, friendships: db.friendships });
    }

    const existingReq = db.friendRequests.find(
      (r) =>
        r.status === "pending" &&
        ((r.fromUserCode.toLowerCase() === request.fromUserCode.toLowerCase() &&
          r.toUserCode.toLowerCase() === request.toUserCode.toLowerCase()) ||
          (r.fromUserCode.toLowerCase() === request.toUserCode.toLowerCase() &&
            r.toUserCode.toLowerCase() === request.fromUserCode.toLowerCase()))
    );

    if (existingReq) {
      if (existingReq.fromUserCode.toLowerCase() === request.fromUserCode.toLowerCase()) {
        return res.json({ success: true, message: "Request already sent", friendRequests: db.friendRequests });
      } else {
        // Auto accept
        existingReq.status = "accepted";
        const newFs: FriendShip = {
          id: `fs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          user1Code: request.fromUserCode,
          user2Code: request.toUserCode,
          createdAt: Date.now(),
        };
        db.friendships.push(newFs);
        saveDatabase();
        broadcastEvent({
          type: "friend_accepted",
          payload: {
            requestId: existingReq.id,
            friendship: newFs,
            fromUserCode: existingReq.fromUserCode,
            toUserCode: existingReq.toUserCode,
          },
        });
        return res.json({
          success: true,
          accepted: true,
          friendships: db.friendships,
          friendRequests: db.friendRequests,
        });
      }
    }

    const newReq: FriendRequest = {
      id: request.id || `freq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fromUserCode: request.fromUserCode,
      fromUserName: request.fromUserName,
      fromUserAvatar: request.fromUserAvatar || "⭐",
      toUserCode: request.toUserCode,
      toUserName: request.toUserName,
      status: "pending",
      createdAt: Date.now(),
    };

    db.friendRequests.push(newReq);
    saveDatabase();
    broadcastEvent({ type: "friend_request", payload: newReq, senderCode: newReq.fromUserCode });
    res.json({ success: true, request: newReq, friendRequests: db.friendRequests });
  });

  // 11. Accept friend request
  app.post("/api/community/friend-request/accept", (req, res) => {
    const { requestId, currentUserCode } = req.body;
    const found = db.friendRequests.find((r) => r.id === requestId);
    if (found) {
      found.status = "accepted";
      const newFs: FriendShip = {
        id: `fs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user1Code: found.fromUserCode,
        user2Code: found.toUserCode,
        createdAt: Date.now(),
      };
      db.friendships.push(newFs);
      saveDatabase();
      broadcastEvent({
        type: "friend_accepted",
        payload: {
          requestId,
          friendship: newFs,
          fromUserCode: found.fromUserCode,
          toUserCode: found.toUserCode,
        },
        senderCode: currentUserCode,
      });
    }
    res.json({ success: true, friendships: db.friendships, friendRequests: db.friendRequests });
  });

  // 12. Decline friend request
  app.post("/api/community/friend-request/decline", (req, res) => {
    const { requestId } = req.body;
    db.friendRequests = db.friendRequests.filter((r) => r.id !== requestId);
    saveDatabase();
    broadcastEvent({ type: "friend_declined", payload: { requestId } });
    res.json({ success: true, friendRequests: db.friendRequests });
  });

  // 13. Remove friend
  app.post("/api/community/friend-remove", (req, res) => {
    const { user1Code, user2Code } = req.body;
    const c1 = (user1Code || "").toLowerCase();
    const c2 = (user2Code || "").toLowerCase();
    db.friendships = db.friendships.filter(
      (f) =>
        !(
          (f.user1Code.toLowerCase() === c1 && f.user2Code.toLowerCase() === c2) ||
          (f.user1Code.toLowerCase() === c2 && f.user2Code.toLowerCase() === c1)
        )
    );
    saveDatabase();
    broadcastEvent({ type: "friend_removed", payload: { user1Code, user2Code } });
    res.json({ success: true, friendships: db.friendships });
  });

  // 14. 1-on-1 Call endpoints
  app.post("/api/community/call/start", (req, res) => {
    const { session } = req.body;
    db.activeCall = session;
    saveDatabase();
    broadcastEvent({ type: "direct_call_start", payload: session, senderCode: session?.callerCode });
    res.json({ success: true, activeCall: db.activeCall });
  });

  app.post("/api/community/call/answer", (req, res) => {
    const { callId } = req.body;
    if (db.activeCall && db.activeCall.id === callId) {
      db.activeCall.status = "connected";
      db.activeCall.connectedAt = Date.now();
      saveDatabase();
      broadcastEvent({ type: "direct_call_answer", payload: db.activeCall });
    }
    res.json({ success: true, activeCall: db.activeCall });
  });

  app.post("/api/community/call/end", (req, res) => {
    const { callId } = req.body;
    if (db.activeCall && (!callId || db.activeCall.id === callId)) {
      db.activeCall.status = "ended";
      db.activeCall.endedAt = Date.now();
      saveDatabase();
      broadcastEvent({ type: "direct_call_end", payload: db.activeCall });
    }
    res.json({ success: true, activeCall: db.activeCall });
  });

  app.post("/api/community/call/mute", (req, res) => {
    const { callId, userCode, muted } = req.body;
    if (db.activeCall && db.activeCall.id === callId) {
      if (db.activeCall.callerCode === userCode) {
        db.activeCall.callerMuted = muted;
      } else if (db.activeCall.recipientCode === userCode) {
        db.activeCall.recipientMuted = muted;
      }
      saveDatabase();
      broadcastEvent({ type: "direct_call_update", payload: db.activeCall });
    }
    res.json({ success: true, activeCall: db.activeCall });
  });

  // 15. Vite middleware in dev / Static serving in prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Abdul Deals server running on port ${PORT}`);
  });
}

startServer();
