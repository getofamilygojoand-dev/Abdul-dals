import { CATEGORIES } from '../data/dealsData';

export interface CategoryInfo {
  id: string;
  name: string;
  emoji: string;
  subEmoji?: string;
  badge: string; // Sticker tag
  description: string;
  gradient?: string;
  themeColor?: string;
  store?: 'abdul' | 'hamdaan' | 'both';
  isCustom?: boolean;
}

const CATEGORY_STORAGE_KEY = 'abdul_deals_custom_categories_v2';

export const STICKER_PRESETS = [
  { label: '🔥 HOT DEAL', emoji: '🔥', text: 'HOT DEAL', color: 'from-orange-500 to-amber-500' },
  { label: '⚡ FLASH SALE', emoji: '⚡', text: 'FLASH SALE', color: 'from-yellow-400 to-amber-500' },
  { label: '👑 24K VIP', emoji: '👑', text: '24K VIP', color: 'from-yellow-300 to-yellow-500' },
  { label: '🍕 BEST BITE', emoji: '🍕', text: 'BEST BITE', color: 'from-amber-400 to-orange-500' },
  { label: '🍔 MEAL DEAL', emoji: '🍔', text: 'MEAL DEAL', color: 'from-yellow-500 to-red-500' },
  { label: '🎁 FREE BONUS', emoji: '🎁', text: 'FREE BONUS', color: 'from-emerald-400 to-teal-500' },
  { label: '💎 LEGENDARY', emoji: '💎', text: 'LEGENDARY', color: 'from-cyan-400 to-blue-500' },
  { label: '🏷️ SUPER SAVER', emoji: '🏷️', text: 'SUPER SAVER', color: 'from-green-400 to-emerald-600' },
  { label: '🌟 EXCLUSIVE', emoji: '🌟', text: 'EXCLUSIVE', color: 'from-yellow-300 to-amber-400' },
  { label: '🍦 SWEET TREAT', emoji: '🍦', text: 'SWEET TREAT', color: 'from-pink-400 to-rose-500' },
  { label: '📦 MEGA BUNDLE', emoji: '📦', text: 'MEGA BUNDLE', color: 'from-amber-400 to-yellow-600' },
  { label: '🚀 TURBO BOOST', emoji: '🚀', text: 'TURBO BOOST', color: 'from-blue-400 to-indigo-600' },
  { label: '🎯 TARGET HIT', emoji: '🎯', text: 'TARGET HIT', color: 'from-red-500 to-rose-600' },
  { label: '🐾 PET APPROVED', emoji: '🐾', text: 'PET APPROVED', color: 'from-amber-400 to-yellow-500' },
  { label: '⛏️ OP GOD GEAR', emoji: '⛏️', text: 'OP GOD GEAR', color: 'from-[#22c55e] to-emerald-600' },
  { label: '💥 50% OFF', emoji: '💥', text: '50% OFF', color: 'from-red-500 to-orange-500' },
  { label: '🏆 #1 BEST SELLER', emoji: '🏆', text: '#1 BEST SELLER', color: 'from-yellow-300 to-amber-500' },
  { label: '🛡️ GUARANTEED', emoji: '🛡️', text: 'GUARANTEED', color: 'from-blue-500 to-teal-500' },
  { label: '💰 DIRECT SAVINGS', emoji: '💰', text: 'DIRECT SAVINGS', color: 'from-emerald-400 to-green-600' },
  { label: '🌙 NIGHT OWL', emoji: '🌙', text: 'NIGHT OWL', color: 'from-purple-500 to-indigo-600' },
  { label: '💯 TOP QUALITY', emoji: '💯', text: 'TOP QUALITY', color: 'from-[#eab308] to-amber-500' },
];

export function getStoredCategories(): CategoryInfo[] {
  try {
    const raw = localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (!raw) {
      return CATEGORIES as CategoryInfo[];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return CATEGORIES as CategoryInfo[];
    }
    
    // Ensure standard categories exist
    const standardIds = new Set(CATEGORIES.map((c) => c.id));
    const customCats = parsed.filter((c) => !standardIds.has(c.id));
    
    return [...(CATEGORIES as CategoryInfo[]), ...customCats];
  } catch (e) {
    console.error('Failed to load custom categories:', e);
    return CATEGORIES as CategoryInfo[];
  }
}

export function saveStoredCategories(categories: CategoryInfo[]): void {
  try {
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error('Failed to save categories:', e);
  }
}

export function addCategoryToStorage(newCategory: Omit<CategoryInfo, 'id'>): CategoryInfo[] {
  const current = getStoredCategories();
  const slug = newCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const id = `cat-${slug}-${Date.now().toString().slice(-4)}`;
  
  const categoryItem: CategoryInfo = {
    ...newCategory,
    id,
    gradient: newCategory.gradient || 'from-yellow-400 via-amber-400 to-yellow-600',
    themeColor: newCategory.themeColor || 'yellow',
    isCustom: true,
  };

  const updated = [...current, categoryItem];
  saveStoredCategories(updated);
  return updated;
}

export function deleteCategoryFromStorage(categoryId: string): CategoryInfo[] {
  const current = getStoredCategories();
  const updated = current.filter((c) => c.id !== categoryId);
  saveStoredCategories(updated);
  return updated;
}
