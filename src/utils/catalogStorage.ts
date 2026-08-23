import { DealItem } from '../types';
import { DEALS_DATA } from '../data/dealsData';

const STORAGE_KEY = 'abdul_deals_custom_catalog_v12';
const OLD_STORAGE_KEYS = [
  'abdul_deals_custom_catalog',
  'abdul_deals_custom_catalog_v1',
  'abdul_deals_custom_catalog_v2',
  'abdul_deals_custom_catalog_v3',
  'abdul_deals_custom_catalog_v4',
  'abdul_deals_custom_catalog_v5',
  'abdul_deals_custom_catalog_v6',
  'abdul_deals_custom_catalog_v7',
  'abdul_deals_custom_catalog_v8',
  'abdul_deals_custom_catalog_v9',
  'abdul_deals_custom_catalog_v10',
  'abdul_deals_custom_catalog_v11',
];

// Helper to strictly enforce 20 AED for OP Mega Base across all stores and sessions
function sanitizeDeal(deal: DealItem): DealItem {
  if (
    deal.id === 'mc-build-pro-base' ||
    deal.title.toLowerCase().includes('mega base') ||
    deal.title.toLowerCase().includes('bulid a base for you') ||
    (deal.originalText && deal.originalText.toLowerCase().includes('mega base'))
  ) {
    return {
      ...deal,
      id: 'mc-build-pro-base',
      priceAed: 20.0,
      priceFormatted: '20.00 AED',
      tag: 'Mega Base 20 AED',
      highlight: '👑 20 AED Mega Base',
      unit: 'per custom mega base',
      title: 'Build a Mega Base (Very Good / Pro OP Survival)',
      originalText: 'bulid a base for you 20 dirham very good mega base',
      description: 'Authentic OP Survival MEGA Base built by Abdul for 20 Dirhams: includes redstone piston stairs, custom bedroom with wall TV, royal emerald/gold throne banquet hall, kitchen bar, and redstone machinery vault with real in-game walkthrough video and calm soundtrack.',
    };
  }
  return deal;
}

export function getStoredDeals(): DealItem[] {
  try {
    // Clean up older legacy storage keys
    OLD_STORAGE_KEYS.forEach((oldKey) => {
      try {
        localStorage.removeItem(oldKey);
      } catch {}
    });

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const sanitizedDefaults = DEALS_DATA.map(sanitizeDeal);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedDefaults));
      return sanitizedDefaults;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const sanitizedDefaults = DEALS_DATA.map(sanitizeDeal);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedDefaults));
      return sanitizedDefaults;
    }
    
    // Check if default deals are missing, and merge them in
    const existingIds = new Set(parsed.map((d: DealItem) => d.id));
    const missingDefaults = DEALS_DATA.filter((d) => !existingIds.has(d.id)).map(sanitizeDeal);
    
    // Sync standard default deals in case prices/titles updated in code
    const defaultMap = new Map(DEALS_DATA.map((d) => [d.id, sanitizeDeal(d)]));
    const updatedParsed = parsed.map((item: DealItem) => {
      if (item.id === 'mc-build-pro-base' || item.title.toLowerCase().includes('mega base')) {
        return sanitizeDeal(item);
      }
      if (!item.isCustom && defaultMap.has(item.id)) {
        return defaultMap.get(item.id)!;
      }
      return sanitizeDeal(item);
    });

    const merged = [...updatedParsed, ...missingDefaults].map(sanitizeDeal);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.error('Error loading stored deals:', e);
    return DEALS_DATA.map(sanitizeDeal);
  }
}

export function saveStoredDeals(deals: DealItem[]): void {
  try {
    const sanitized = deals.map(sanitizeDeal);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch (e) {
    console.error('Error saving deals catalog:', e);
  }
}

export function updateDealInCatalog(updatedDeal: DealItem): DealItem[] {
  const sanitizedDeal = sanitizeDeal(updatedDeal);
  const current = getStoredDeals();
  const index = current.findIndex((d) => d.id === sanitizedDeal.id);
  if (index > -1) {
    current[index] = { ...sanitizedDeal };
  } else {
    current.push(sanitizedDeal);
  }
  saveStoredDeals(current);
  return current;
}

export function addDealToCatalog(newDeal: Omit<DealItem, 'id'>): DealItem[] {
  const current = getStoredDeals();
  const fullDeal: DealItem = sanitizeDeal({
    ...newDeal,
    id: `custom-deal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    isCustom: true,
  });
  const updated = [fullDeal, ...current];
  saveStoredDeals(updated);
  return updated;
}

export function deleteDealFromCatalog(dealId: string): DealItem[] {
  const current = getStoredDeals();
  const updated = current.filter((d) => d.id !== dealId);
  saveStoredDeals(updated);
  return updated;
}

export function resetCatalogToDefaults(): DealItem[] {
  try {
    const sanitizedDefaults = DEALS_DATA.map(sanitizeDeal);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedDefaults));
    return sanitizedDefaults;
  } catch {}
  return DEALS_DATA.map(sanitizeDeal);
}
