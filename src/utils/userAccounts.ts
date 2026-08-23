import { PlacedOrder } from '../types';
import { getStoredPromoCodes } from './promoCodeStorage';

export interface UserAccount {
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
  status?: 'online' | 'offline' | 'in-call' | 'away';
  lastSeen?: number;
  bio?: string;
  aCard?: any;
}

export const DEFAULT_USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'owner-2015',
    code: '2015',
    name: 'Abdul',
    password: '2015',
    dateOfBirth: '2015-01-01',
    avatarEmoji: '👑',
    roleTitle: 'Store Owner',
    bio: 'Founder & Store Owner',
    isOwner: true,
    status: 'online',
    createdAt: 1700000000000,
  },
];

export const USER_ACCOUNTS: UserAccount[] = DEFAULT_USER_ACCOUNTS;

const BANNED_BOT_CODES = new Set(['1001', '1002', '1003', '1004', '1005', '1006', '1007']);

const CUSTOM_ACCOUNTS_KEY = 'abdul_deals_custom_accounts_v4';
const ALL_ACCOUNTS_CACHE_KEY = 'abdul_deals_all_accounts_cache_v5';
const ACCOUNT_SESSION_KEY = 'abdul_deals_active_user_account_v2';

// In-memory synced accounts cache
let memoryAccountsCache: UserAccount[] = [];

// Initialize memory cache from localStorage immediately on load
try {
  const rawAll = localStorage.getItem(ALL_ACCOUNTS_CACHE_KEY);
  const rawCustom = localStorage.getItem(CUSTOM_ACCOUNTS_KEY);
  const parsedAll: UserAccount[] = rawAll ? JSON.parse(rawAll) : [];
  const parsedCustom: UserAccount[] = rawCustom ? JSON.parse(rawCustom) : [];

  const map = new Map<string, UserAccount>();
  DEFAULT_USER_ACCOUNTS.forEach((a) => map.set(a.code.toLowerCase(), a));
  parsedAll.forEach((a) => {
    if (a?.code && !BANNED_BOT_CODES.has(a.code.toLowerCase())) {
      map.set(a.code.toLowerCase(), a);
    }
  });
  parsedCustom.forEach((a) => {
    if (a?.code && !BANNED_BOT_CODES.has(a.code.toLowerCase())) {
      map.set(a.code.toLowerCase(), a);
    }
  });
  memoryAccountsCache = Array.from(map.values());
  const customClean = memoryAccountsCache.filter((a) => a.code !== '2015');
  localStorage.setItem(CUSTOM_ACCOUNTS_KEY, JSON.stringify(customClean));
  localStorage.setItem(ALL_ACCOUNTS_CACHE_KEY, JSON.stringify(memoryAccountsCache));
} catch {}

if (typeof window !== 'undefined') {
  window.addEventListener('abdul_accounts_updated', (e: any) => {
    if (Array.isArray(e.detail)) {
      const cleanList = e.detail.filter((a: UserAccount) => a?.code && !BANNED_BOT_CODES.has(a.code.toLowerCase()));
      memoryAccountsCache = cleanList;
      try {
        localStorage.setItem(ALL_ACCOUNTS_CACHE_KEY, JSON.stringify(cleanList));
      } catch {}
    }
  });
}

/**
 * Fetch accounts from server and merge with local storage
 */
export async function syncAccountsWithServer(): Promise<UserAccount[]> {
  try {
    const rawLocal = localStorage.getItem(CUSTOM_ACCOUNTS_KEY);
    const localList: UserAccount[] = rawLocal
      ? JSON.parse(rawLocal).filter((a: UserAccount) => a?.code && !BANNED_BOT_CODES.has(a.code.toLowerCase()))
      : [];

    // Push local accounts to server to ensure nothing is missed
    if (localList.length > 0) {
      await fetch('/api/accounts/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localAccounts: localList }),
      }).catch(() => {});
    }

    const res = await fetch('/api/accounts');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.accounts)) {
        const cleanAccounts = data.accounts.filter((a: UserAccount) => a?.code && !BANNED_BOT_CODES.has(a.code.toLowerCase()));
        memoryAccountsCache = cleanAccounts;
        const customOnly = cleanAccounts.filter((a: UserAccount) => a.isCustom || a.code !== '2015');
        localStorage.setItem(CUSTOM_ACCOUNTS_KEY, JSON.stringify(customOnly));
        localStorage.setItem(ALL_ACCOUNTS_CACHE_KEY, JSON.stringify(cleanAccounts));

        // Send local bus event so UI immediately re-renders with the latest accounts
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('abdul_accounts_updated', { detail: cleanAccounts }));
        }

        return cleanAccounts;
      }
    }
  } catch (e) {
    // Offline or fallback to local
  }
  return getStoredUserAccounts();
}

// Start auto-sync on load
if (typeof window !== 'undefined') {
  syncAccountsWithServer();
  // Poll every 1.5 seconds for new accounts or status changes
  setInterval(() => {
    syncAccountsWithServer();
    const active = getActiveUserAccount();
    if (active?.code) {
      fetch('/api/accounts/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: active.code }),
      }).catch(() => {});
    }
  }, 1500);
}

/**
 * Get all user accounts (Default Abdul Owner 2015 + Signed up members, online and offline)
 */
export function getStoredUserAccounts(): UserAccount[] {
  try {
    const rawCustom = localStorage.getItem(CUSTOM_ACCOUNTS_KEY);
    const rawAll = localStorage.getItem(ALL_ACCOUNTS_CACHE_KEY);
    const custom: UserAccount[] = rawCustom ? JSON.parse(rawCustom) : [];
    const allCached: UserAccount[] = rawAll ? JSON.parse(rawAll) : [];
    
    // Combine memory cache, server sync, and local storage cleanly
    const allMap = new Map<string, UserAccount>();

    // 1. Base default owner account
    DEFAULT_USER_ACCOUNTS.forEach((d) => allMap.set(d.code.toLowerCase(), d));

    // 2. Add all cached accounts from server
    allCached.forEach((c) => {
      if (c && c.code && !BANNED_BOT_CODES.has(c.code.toLowerCase())) {
        allMap.set(c.code.toLowerCase(), c);
      }
    });

    // 3. Add local custom accounts
    custom.forEach((c) => {
      if (c && c.code && !BANNED_BOT_CODES.has(c.code.toLowerCase())) {
        allMap.set(c.code.toLowerCase(), {
          ...(allMap.get(c.code.toLowerCase()) || {}),
          ...c,
        });
      }
    });

    // 4. Merge server-synced memory accounts cache (real accounts created by friends)
    memoryAccountsCache.forEach((c) => {
      if (c && c.code && !BANNED_BOT_CODES.has(c.code.toLowerCase())) {
        const existing = allMap.get(c.code.toLowerCase()) || {};
        allMap.set(c.code.toLowerCase(), {
          ...existing,
          ...c,
        });
      }
    });

    return Array.from(allMap.values()).filter(a => !BANNED_BOT_CODES.has(a.code.toLowerCase()));
  } catch (e) {
    console.error('Error loading accounts:', e);
    return DEFAULT_USER_ACCOUNTS;
  }
}

/**
 * Save custom user accounts list to localStorage and sync to server
 */
export function saveCustomUserAccounts(accounts: UserAccount[]): void {
  try {
    const customOnly = accounts.filter((a) => a.isCustom || a.code !== '2015');
    localStorage.setItem(CUSTOM_ACCOUNTS_KEY, JSON.stringify(customOnly));
    localStorage.setItem(ALL_ACCOUNTS_CACHE_KEY, JSON.stringify(accounts));
    memoryAccountsCache = accounts;
    fetch('/api/accounts/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ localAccounts: customOnly }),
    }).catch(() => {});
  } catch (e) {
    console.error('Error saving custom accounts:', e);
  }
}

/**
 * Sign up a new user account with Name, Date of Birth, and Password.
 * Saved to backend server so friends on any device can see it instantly!
 */
export function signUpUser(params: {
  name: string;
  dateOfBirth: string;
  password: string;
  avatarEmoji?: string;
  roleTitle?: string;
}): { success: boolean; account?: UserAccount; error?: string } {
  const cleanName = params.name.trim();
  const cleanDob = params.dateOfBirth.trim();
  const cleanPass = params.password.trim();

  if (!cleanName) {
    return { success: false, error: 'Please enter your name.' };
  }
  if (!cleanDob) {
    return { success: false, error: 'Please enter your date of birth.' };
  }
  if (!cleanPass) {
    return { success: false, error: 'Please create a password.' };
  }

  const allAccounts = getStoredUserAccounts();

  // 1. Strict Duplicate Name Check (Case-insensitive)
  const nameExists = allAccounts.some(
    (acc) => acc.name.trim().toLowerCase() === cleanName.toLowerCase()
  );
  if (nameExists) {
    return {
      success: false,
      error: `The name "${cleanName}" is already taken. You cannot copy other people's names! Please choose a unique name.`,
    };
  }

  // Generate unique code
  let generatedCode = cleanPass;
  if (allAccounts.some((a) => a.code.toLowerCase() === generatedCode.toLowerCase())) {
    generatedCode = `${cleanPass}-${Math.floor(100 + Math.random() * 900)}`;
  }

  const newAccount: UserAccount = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    code: generatedCode,
    name: cleanName,
    dateOfBirth: cleanDob,
    password: cleanPass,
    avatarEmoji: params.avatarEmoji?.trim() || '⭐',
    roleTitle: params.roleTitle?.trim() || 'VIP Member',
    isCustom: true,
    createdAt: Date.now(),
    status: 'online',
    lastSeen: Date.now(),
  };

  const raw = localStorage.getItem(CUSTOM_ACCOUNTS_KEY);
  const existingCustom: UserAccount[] = raw ? JSON.parse(raw) : [];
  existingCustom.push(newAccount);
  localStorage.setItem(CUSTOM_ACCOUNTS_KEY, JSON.stringify(existingCustom));

  // Update memory cache
  memoryAccountsCache = [...memoryAccountsCache.filter((a) => a.code !== newAccount.code), newAccount];

  // Automatically log in the user locally
  saveActiveUserAccount(newAccount);

  // Dispatch account update event locally & broadcast
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('abdul_accounts_updated', { detail: getStoredUserAccounts() }));
  }

  // Send to server immediately
  fetch('/api/accounts/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: cleanName,
      dateOfBirth: cleanDob,
      password: cleanPass,
      avatarEmoji: newAccount.avatarEmoji,
      roleTitle: newAccount.roleTitle,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success && data.account) {
        saveActiveUserAccount(data.account);
        syncAccountsWithServer();
      }
    })
    .catch(() => {});

  return { success: true, account: newAccount };
}

/**
 * Log In with either Name & Password or Passcode / Code
 */
export function loginUserWithCredentials(params: {
  nameOrCode: string;
  password?: string;
}): { success: boolean; account?: UserAccount; error?: string } {
  const cleanInput = params.nameOrCode.trim();
  const cleanPassword = params.password ? params.password.trim() : '';

  if (!cleanInput) {
    return { success: false, error: 'Please enter your Name or Passcode.' };
  }

  const allAccounts = getStoredUserAccounts();

  // Special owner match for code 2015 or name Abdul
  if (cleanInput === '2015' || cleanInput.toLowerCase() === 'abdul') {
    const owner = allAccounts.find((a) => a.code === '2015' || a.name.toLowerCase() === 'abdul') || DEFAULT_USER_ACCOUNTS[0];
    if (!cleanPassword) {
      return { success: false, error: 'Please enter your password.' };
    }
    if (cleanPassword !== '2015') {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }
    saveActiveUserAccount(owner);
    return { success: true, account: owner };
  }

  // 1. Match by Exact Name
  const accountByName = allAccounts.find(
    (acc) => acc.name.trim().toLowerCase() === cleanInput.toLowerCase()
  );

  if (accountByName) {
    if (accountByName.password) {
      if (!cleanPassword) {
        return { success: false, error: `Please enter the password for "${accountByName.name}".` };
      }
      if (accountByName.password !== cleanPassword) {
        return { success: false, error: 'Incorrect password. Please try again.' };
      }
    }
    saveActiveUserAccount(accountByName);
    return { success: true, account: accountByName };
  }

  // 2. Match by Passcode / Code
  const accountByCode = allAccounts.find(
    (acc) => acc.code.toLowerCase() === cleanInput.toLowerCase()
  );

  if (accountByCode) {
    if (accountByCode.password && cleanPassword && accountByCode.password !== cleanPassword) {
      return { success: false, error: 'Incorrect password for this code.' };
    }
    saveActiveUserAccount(accountByCode);
    return { success: true, account: accountByCode };
  }

  return {
    success: false,
    error: `Account "${cleanInput}" not found. Please check spelling or Sign Up to create your account.`,
  };
}

/**
 * Create a custom member account (Owner manual creation)
 */
export function createCustomUserAccount(params: {
  code: string;
  name: string;
  dateOfBirth?: string;
  password?: string;
  avatarEmoji?: string;
  roleTitle?: string;
}): { success: boolean; account?: UserAccount; error?: string } {
  const cleanCode = params.code.trim();
  const cleanName = params.name.trim();

  if (!cleanCode) {
    return { success: false, error: 'Please enter a valid passcode.' };
  }
  if (!cleanName) {
    return { success: false, error: 'Please enter the member name.' };
  }

  const all = getStoredUserAccounts();
  const duplicate = all.find((a) => a.name.trim().toLowerCase() === cleanName.toLowerCase());
  if (duplicate) {
    return {
      success: false,
      error: `Name "${cleanName}" is already taken. You cannot copy other people's names.`,
    };
  }

  const newAccount: UserAccount = {
    id: `user-${Date.now()}`,
    code: cleanCode,
    name: cleanName,
    dateOfBirth: params.dateOfBirth?.trim() || '2000-01-01',
    password: params.password?.trim() || cleanCode,
    avatarEmoji: params.avatarEmoji?.trim() || '⭐',
    roleTitle: params.roleTitle?.trim() || 'VIP Member',
    isCustom: true,
    createdAt: Date.now(),
    status: 'online',
  };

  const raw = localStorage.getItem(CUSTOM_ACCOUNTS_KEY);
  const existingCustom: UserAccount[] = raw ? JSON.parse(raw) : [];
  existingCustom.push(newAccount);
  localStorage.setItem(CUSTOM_ACCOUNTS_KEY, JSON.stringify(existingCustom));

  // Update memory cache
  memoryAccountsCache = [...memoryAccountsCache.filter((a) => a.code !== newAccount.code), newAccount];

  // Dispatch update event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('abdul_accounts_updated', { detail: getStoredUserAccounts() }));
  }

  // Sync to server
  fetch('/api/accounts/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: cleanName,
      dateOfBirth: newAccount.dateOfBirth,
      password: newAccount.password,
      avatarEmoji: newAccount.avatarEmoji,
      roleTitle: newAccount.roleTitle,
    }),
  }).catch(() => {});

  return { success: true, account: newAccount };
}

/**
 * Delete a custom member account
 */
export function deleteCustomUserAccount(code: string): UserAccount[] {
  try {
    const raw = localStorage.getItem(CUSTOM_ACCOUNTS_KEY);
    const existingCustom: UserAccount[] = raw ? JSON.parse(raw) : [];
    const updated = existingCustom.filter((a) => a.code.toLowerCase() !== code.trim().toLowerCase());
    localStorage.setItem(CUSTOM_ACCOUNTS_KEY, JSON.stringify(updated));
    memoryAccountsCache = memoryAccountsCache.filter((a) => a.code.toLowerCase() !== code.trim().toLowerCase());
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('abdul_accounts_updated', { detail: getStoredUserAccounts() }));
    }

    fetch('/api/accounts/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    }).catch(() => {});

    return getStoredUserAccounts();
  } catch (e) {
    console.error('Error deleting account:', e);
    return getStoredUserAccounts();
  }
}

export function getActiveUserAccount(): UserAccount | null {
  try {
    const raw = localStorage.getItem(ACCOUNT_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveActiveUserAccount(account: UserAccount | null): void {
  try {
    if (account) {
      localStorage.setItem(ACCOUNT_SESSION_KEY, JSON.stringify(account));
    } else {
      localStorage.removeItem(ACCOUNT_SESSION_KEY);
    }
  } catch (e) {
    console.error('Error saving active user account:', e);
  }
}

/**
 * Legacy code login helper maintained for backwards compatibility
 */
export function loginUserWithCode(code: string): { success: boolean; account?: UserAccount; error?: string } {
  return loginUserWithCredentials({ nameOrCode: code, password: code === '2015' ? '2015' : undefined });
}

/**
 * Ensures accounts start with actual purchases submitted by users.
 * Cleaned out legacy dummy sample seeds.
 */
export function seedInitialUserOrders(existingOrders: PlacedOrder[]): PlacedOrder[] {
  // Return existing orders or empty list so accounts start with 0 purchases until an order is placed!
  if (!existingOrders) return [];
  // Filter out any old legacy seed order IDs if they exist in localStorage
  return existingOrders.filter((ord) => !ord.id.startsWith('ord-seed-'));
}

/**
 * Calculate user total money spent and retrieve list of orders for a user account.
 * If the user is Abdul Owner (Code 2015), return ALL orders in the system.
 */
export function getUserAccountSpending(
  account: UserAccount,
  orders: PlacedOrder[]
): {
  totalSpentAed: number;
  ordersCount: number;
  userOrders: PlacedOrder[];
  itemizedSummary: { title: string; totalQty: number; totalSpentAed: number }[];
} {
  const cleanCode = account.code.trim();

  const isOwner = account.isOwner || cleanCode === '2015';

  // Find all orders placed by this user code.
  // If owner (Code 2015), include ALL orders in the system!
  const userOrders = isOwner
    ? [...orders]
    : orders.filter((ord) => ord.userCode && ord.userCode === cleanCode);

  // Calculate total money spent
  const totalSpentAed = userOrders.reduce((sum, ord) => sum + (ord.finalTotalAed || 0), 0);

  // Build itemized breakdown ("what money was spent for")
  const itemMap = new Map<string, { totalQty: number; totalSpentAed: number }>();

  userOrders.forEach((ord) => {
    ord.items.forEach((it) => {
      const existing = itemMap.get(it.title) || { totalQty: 0, totalSpentAed: 0 };
      itemMap.set(it.title, {
        totalQty: existing.totalQty + it.quantity,
        totalSpentAed: existing.totalSpentAed + (it.totalAed || it.priceAed * it.quantity),
      });
    });
  });

  const itemizedSummary = Array.from(itemMap.entries()).map(([title, val]) => ({
    title,
    totalQty: val.totalQty,
    totalSpentAed: val.totalSpentAed,
  }));

  // Sort items by highest amount spent
  itemizedSummary.sort((a, b) => b.totalSpentAed - a.totalSpentAed);

  return {
    totalSpentAed: Number(totalSpentAed.toFixed(2)),
    ordersCount: userOrders.length,
    userOrders,
    itemizedSummary,
  };
}
