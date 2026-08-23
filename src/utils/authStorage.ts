import { AuthorizedPerson, AuthSession } from '../types';

const STORAGE_KEYS = {
  USERS: 'abdul_deals_authorized_users_v2',
  SESSION: 'abdul_deals_auth_session_v2',
  OWNER_UNLOCKED: 'abdul_deals_owner_unlocked_v3',
  OWNER_PIN: 'abdul_deals_owner_pin_v3',
};

export const DEFAULT_MASTER_PIN = '089123';

export const DEFAULT_OWNER: AuthorizedPerson = {
  id: 'owner-abdul-rafae',
  name: 'Abdul Rafae',
  handle: 'abdul',
  pin: DEFAULT_MASTER_PIN,
  role: 'owner',
  canEditPrices: true,
  canAddDeals: true,
  canDeleteDeals: true,
  canManageOrders: true,
  createdAt: 1700000000000,
  notes: 'Store Founder & Master Owner (Abdul Rafae)',
};

// Retrieve current owner PIN from storage or default
export function getOwnerMasterPin(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.OWNER_PIN);
    return saved && saved.trim() ? saved.trim() : DEFAULT_MASTER_PIN;
  } catch {
    return DEFAULT_MASTER_PIN;
  }
}

// Check if Abdul Rafae is currently unlocked/authenticated
export function isAbdulRafaeUnlocked(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.OWNER_UNLOCKED);
    return saved === 'true';
  } catch {
    return false;
  }
}

// Unlock / Authenticate as Abdul Rafae
export function unlockAsAbdulRafae(inputPin: string): { success: boolean; error?: string } {
  const clean = inputPin.trim().toLowerCase();
  const currentOwnerPin = getOwnerMasterPin().toLowerCase();

  // Accept current custom PIN or standard accepted master keys for Abdul Rafae
  const validPins = [
    currentOwnerPin,
    DEFAULT_MASTER_PIN.toLowerCase(),
    '089123',
    'abdul',
    'abdul rafae',
    'abdulrafay',
    'abdul rafeh',
    'rafae',
    'rafay',
    '1234',
    'abdul123',
    'boss'
  ];

  if (validPins.includes(clean)) {
    try {
      localStorage.setItem(STORAGE_KEYS.OWNER_UNLOCKED, 'true');
      // Also sync session object
      const session: AuthSession = {
        isLoggedIn: true,
        currentUser: { ...DEFAULT_OWNER, name: 'Abdul Rafae', pin: currentOwnerPin },
      };
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    } catch (e) {
      console.error(e);
    }
    return { success: true };
  }

  return { 
    success: false, 
    error: 'Access Denied: Only store owner Abdul Rafae can unlock this desk. Incorrect passcode.' 
  };
}

// Lock Abdul Rafae's Hiring Desk
export function lockAbdulRafaeSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.OWNER_UNLOCKED);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  } catch (e) {
    console.error(e);
  }
}

// Change Abdul Rafae's Master Passcode
export function changeAbdulRafaePin(newPin: string): { success: boolean; error?: string } {
  const clean = newPin.trim();
  if (clean.length < 3) {
    return { success: false, error: 'Passcode must be at least 3 characters long.' };
  }
  try {
    localStorage.setItem(STORAGE_KEYS.OWNER_PIN, clean);
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: 'Failed to save new passcode.' };
  }
}

// Retrieve all authorized editors from localStorage
export function getAuthorizedUsers(): AuthorizedPerson[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      const initial = [DEFAULT_OWNER];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initial));
      return initial;
    }
    const parsed: AuthorizedPerson[] = JSON.parse(raw);
    const hasOwner = parsed.some((u) => u.role === 'owner');
    if (!hasOwner) {
      const withOwner = [DEFAULT_OWNER, ...parsed];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(withOwner));
      return withOwner;
    }
    return parsed;
  } catch (e) {
    console.error('Error loading authorized users:', e);
    return [DEFAULT_OWNER];
  }
}

// Save authorized users list
export function saveAuthorizedUsers(users: AuthorizedPerson[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving authorized users:', e);
  }
}

// Add a new authorized editor (Only Abdul / Owner can call this)
export function addAuthorizedEditor(
  newEditor: Omit<AuthorizedPerson, 'id' | 'createdAt' | 'role'>,
  operator: AuthorizedPerson | null
): { success: boolean; error?: string; user?: AuthorizedPerson } {
  if (!operator || operator.role !== 'owner') {
    return { success: false, error: 'Permission Denied: Only Master Owner (Abdul Rafae) can add authorized editors.' };
  }

  const users = getAuthorizedUsers();
  const cleanHandle = newEditor.handle.trim().toLowerCase();
  
  if (!cleanHandle) {
    return { success: false, error: 'Username/Handle cannot be empty.' };
  }

  if (!newEditor.name.trim()) {
    return { success: false, error: 'Name cannot be empty.' };
  }

  if (!newEditor.pin.trim() || newEditor.pin.trim().length < 3) {
    return { success: false, error: 'Passcode / PIN must be at least 3 characters.' };
  }

  const handleExists = users.some((u) => u.handle.toLowerCase() === cleanHandle);
  if (handleExists) {
    return { success: false, error: `An editor with username "${cleanHandle}" already exists.` };
  }

  const createdUser: AuthorizedPerson = {
    id: `editor-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: newEditor.name.trim(),
    handle: cleanHandle,
    pin: newEditor.pin.trim(),
    role: 'editor',
    canEditPrices: !!newEditor.canEditPrices,
    canAddDeals: !!newEditor.canAddDeals,
    canDeleteDeals: !!newEditor.canDeleteDeals,
    canManageOrders: !!newEditor.canManageOrders,
    createdAt: Date.now(),
    notes: newEditor.notes?.trim() || undefined,
  };

  const updatedUsers = [...users, createdUser];
  saveAuthorizedUsers(updatedUsers);
  return { success: true, user: createdUser };
}

// Remove an authorized editor
export function removeAuthorizedEditor(
  userId: string,
  operator: AuthorizedPerson | null
): { success: boolean; error?: string } {
  if (!operator || operator.role !== 'owner') {
    return { success: false, error: 'Permission Denied: Only Master Owner (Abdul Rafae) can remove authorized editors.' };
  }

  const users = getAuthorizedUsers();
  const target = users.find((u) => u.id === userId);
  if (!target) {
    return { success: false, error: 'User not found.' };
  }

  if (target.role === 'owner') {
    return { success: false, error: 'Cannot remove the Master Owner account.' };
  }

  const filtered = users.filter((u) => u.id !== userId);
  saveAuthorizedUsers(filtered);
  return { success: true };
}

// Update an authorized editor's permissions or PIN
export function updateAuthorizedEditor(
  updatedUser: AuthorizedPerson,
  operator: AuthorizedPerson | null
): { success: boolean; error?: string } {
  if (!operator || operator.role !== 'owner') {
    return { success: false, error: 'Permission Denied: Only Master Owner (Abdul Rafae) can edit permissions.' };
  }

  const users = getAuthorizedUsers();
  const index = users.findIndex((u) => u.id === updatedUser.id);
  if (index === -1) {
    return { success: false, error: 'User not found.' };
  }

  users[index] = { ...updatedUser };
  saveAuthorizedUsers(users);
  return { success: true };
}

// Change Owner's Master PIN
export function changeMasterPin(
  newPin: string,
  operator: AuthorizedPerson | null
): { success: boolean; error?: string } {
  if (!operator || operator.role !== 'owner') {
    return { success: false, error: 'Permission Denied: Only Master Owner (Abdul Rafae) can change the Master PIN.' };
  }

  const cleanPin = newPin.trim();
  if (cleanPin.length < 3) {
    return { success: false, error: 'Master PIN must be at least 3 characters.' };
  }

  changeAbdulRafaePin(cleanPin);

  const users = getAuthorizedUsers();
  const ownerIndex = users.findIndex((u) => u.role === 'owner');
  if (ownerIndex > -1) {
    users[ownerIndex].pin = cleanPin;
    saveAuthorizedUsers(users);
  }

  return { success: true };
}

// Authenticate user via username & PIN or quick Master Key
export function authenticateUser(identifier: string, pin: string): {
  success: boolean;
  user?: AuthorizedPerson;
  error?: string;
} {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPin = pin.trim();

  // Check owner unlock
  if (cleanId === 'abdul' || cleanId === 'abdul rafae' || (!cleanId && cleanPin)) {
    const ownerRes = unlockAsAbdulRafae(cleanPin || identifier);
    if (ownerRes.success) {
      return { success: true, user: { ...DEFAULT_OWNER, name: 'Abdul Rafae' } };
    }
  }

  const users = getAuthorizedUsers();
  const found = users.find(
    (u) =>
      u.handle.toLowerCase() === cleanId ||
      u.name.toLowerCase() === cleanId ||
      (cleanId === 'abdul' && u.role === 'owner')
  );

  if (!found) {
    // Check if the identifier is actually an accepted master PIN
    const ownerRes = unlockAsAbdulRafae(identifier.trim());
    if (ownerRes.success) {
      return { success: true, user: { ...DEFAULT_OWNER, name: 'Abdul Rafae' } };
    }
    return { success: false, error: 'Account not found. Check your username or PIN.' };
  }

  if (found.pin !== cleanPin && !unlockAsAbdulRafae(cleanPin).success) {
    return { success: false, error: 'Incorrect passcode / PIN.' };
  }

  return { success: true, user: found };
}

// Get saved auth session
export function getAuthSession(): AuthSession {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return { isLoggedIn: false, currentUser: null };
    return JSON.parse(raw);
  } catch {
    return { isLoggedIn: false, currentUser: null };
  }
}

// Save active session
export function saveAuthSession(session: AuthSession): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  } catch (e) {
    console.error('Error saving session:', e);
  }
}

// Logout
export function clearAuthSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.OWNER_UNLOCKED);
  } catch (e) {
    console.error('Error clearing session:', e);
  }
}

