import { PromoCode } from '../types';

const PROMO_CODES_STORAGE_KEY = 'abdul_deals_promo_codes_v2';

// Seed promo codes created by Store Admin (No "2015" in code names)
const DEFAULT_PROMO_CODES: PromoCode[] = [
  {
    id: 'promo-rsd0y',
    code: 'Rsd0y',
    dirhamOff: 5.00,
    description: 'VIP Reward - 5 Dirhams Off',
    createdAt: Date.now() - 3600000,
    createdBy: 'Abdul Owner',
    isActive: true, // Available
    isSingleUse: true, // 1 time use only
    isUsed: false,
    usageCount: 0,
    maxUses: 1,
    minSpendAed: 0,
  },
  {
    id: 'promo-abd2',
    code: 'Abd2k',
    dirhamOff: 2.00,
    description: 'Quick Snack - 2 Dirhams Off',
    createdAt: Date.now() - 7200000,
    createdBy: 'Abdul Owner',
    isActive: true,
    isSingleUse: true,
    isUsed: false,
    usageCount: 0,
    maxUses: 1,
    minSpendAed: 0,
  },
  {
    id: 'promo-dhr10',
    code: 'Dhr10',
    dirhamOff: 10.00,
    description: 'Mega Base Special - 10 Dirhams Off',
    createdAt: Date.now() - 14400000,
    createdBy: 'Abdul Owner',
    isActive: true,
    isSingleUse: true,
    isUsed: false,
    usageCount: 0,
    maxUses: 1,
    minSpendAed: 10,
  },
];

/**
 * Friendly code generator creating memorable, short, easy-to-type 5-character codes
 * like "Rsd0y", "Abd5k", "Drm20", "Vip07", "Kng5d", etc.
 * STRICTLY NEVER PRODUCES "2015"
 */
export function generateFriendlyCode(dirhamAmount?: number): string {
  const prefixes = ['Rsd', 'Abd', 'Dhr', 'Vip', 'Kng', 'Del', 'Sav', 'Top', 'Gft', 'Jck'];
  const chosenPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  
  if (dirhamAmount && dirhamAmount >= 1 && dirhamAmount <= 99) {
    const rounded = Math.round(dirhamAmount);
    const suffixLetters = ['y', 'k', 'x', 'm', 'd', 'z', 'p'];
    const chosenSuffix = suffixLetters[Math.floor(Math.random() * suffixLetters.length)];
    const generated = `${chosenPrefix}${rounded}${chosenSuffix}`;
    return generated.replace('2015', '777');
  }

  // Generate 5-character code like "Rsd0y"
  const digits = '123456789';
  const letters = 'abcdefghjkmnpqrstuvwxyz';
  const numChar = digits[Math.floor(Math.random() * digits.length)];
  const letterChar = letters[Math.floor(Math.random() * letters.length)];
  const res = `${chosenPrefix}${numChar}${letterChar}`;
  return res.replace('2015', '99');
}

/**
 * Retrieve all promo codes from localStorage
 */
export function getStoredPromoCodes(): PromoCode[] {
  try {
    const raw = localStorage.getItem(PROMO_CODES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PROMO_CODES_STORAGE_KEY, JSON.stringify(DEFAULT_PROMO_CODES));
      return DEFAULT_PROMO_CODES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(PROMO_CODES_STORAGE_KEY, JSON.stringify(DEFAULT_PROMO_CODES));
      return DEFAULT_PROMO_CODES;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load promo codes from localStorage:', e);
    return DEFAULT_PROMO_CODES;
  }
}

/**
 * Save new or updated promo codes list
 */
export function saveStoredPromoCodes(codes: PromoCode[]): void {
  try {
    localStorage.setItem(PROMO_CODES_STORAGE_KEY, JSON.stringify(codes));
  } catch (e) {
    console.error('Failed to save promo codes:', e);
  }
}

/**
 * Add a new promo code
 */
export function createPromoCode(
  codeText: string,
  dirhamOff: number,
  description?: string,
  minSpendAed: number = 0,
  isSingleUse: boolean = true
): { success: boolean; promoCode?: PromoCode; error?: string } {
  const cleanCode = codeText.trim();
  if (!cleanCode) {
    return { success: false, error: 'Please provide a valid promo code name.' };
  }

  if (cleanCode === '2015') {
    return { success: false, error: 'Promo code cannot be "2015". Please enter a discount voucher name.' };
  }

  if (!dirhamOff || dirhamOff <= 0) {
    return { success: false, error: 'Please enter a valid Dirham off amount (greater than 0 AED).' };
  }

  const existingCodes = getStoredPromoCodes();
  // Check case-insensitive duplicate
  const duplicate = existingCodes.find(
    (c) => c.code.toLowerCase() === cleanCode.toLowerCase() && c.isActive && !c.isUsed
  );
  if (duplicate) {
    return { success: false, error: `Code "${cleanCode}" already exists and is currently available!` };
  }

  const newPromo: PromoCode = {
    id: `promo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    code: cleanCode,
    dirhamOff: Number(dirhamOff.toFixed(2)),
    description: description?.trim() || `${dirhamOff.toFixed(2)} AED Off Voucher`,
    createdAt: Date.now(),
    createdBy: 'Abdul Owner',
    isActive: true, // Available
    isSingleUse: isSingleUse, // 1 time use only
    isUsed: false,
    usageCount: 0,
    maxUses: isSingleUse ? 1 : undefined,
    minSpendAed: minSpendAed || 0,
  };

  const updated = [newPromo, ...existingCodes];
  saveStoredPromoCodes(updated);
  return { success: true, promoCode: newPromo };
}

/**
 * Toggle between Available (true) and Expired / Disabled (false)
 */
export function togglePromoCodeActive(codeId: string): PromoCode[] {
  const codes = getStoredPromoCodes();
  const updated = codes.map((c) => {
    if (c.id === codeId) {
      const nextActive = !c.isActive;
      return {
        ...c,
        isActive: nextActive,
        // If making available again, clear isUsed flag
        isUsed: nextActive ? false : c.isUsed,
      };
    }
    return c;
  });
  saveStoredPromoCodes(updated);
  return updated;
}

/**
 * Explicitly set promo code availability (Available vs Expired)
 */
export function setPromoCodeStatus(codeId: string, makeAvailable: boolean): PromoCode[] {
  const codes = getStoredPromoCodes();
  const updated = codes.map((c) => {
    if (c.id === codeId) {
      return {
        ...c,
        isActive: makeAvailable,
        isUsed: makeAvailable ? false : c.isUsed,
      };
    }
    return c;
  });
  saveStoredPromoCodes(updated);
  return updated;
}

/**
 * Toggle single-use mode (1 Time Only vs Multiple Uses)
 */
export function togglePromoCodeSingleUse(codeId: string): PromoCode[] {
  const codes = getStoredPromoCodes();
  const updated = codes.map((c) => {
    if (c.id === codeId) {
      const nextSingle = !c.isSingleUse;
      return {
        ...c,
        isSingleUse: nextSingle,
        maxUses: nextSingle ? 1 : undefined,
      };
    }
    return c;
  });
  saveStoredPromoCodes(updated);
  return updated;
}

/**
 * Reset usage for a single-use code so it can be used again
 */
export function resetPromoCodeUsage(codeId: string): PromoCode[] {
  const codes = getStoredPromoCodes();
  const updated = codes.map((c) => {
    if (c.id === codeId) {
      return {
        ...c,
        isActive: true,
        isUsed: false,
        usageCount: 0,
        usedByOrder: undefined,
        usedAt: undefined,
      };
    }
    return c;
  });
  saveStoredPromoCodes(updated);
  return updated;
}

/**
 * Delete a promo code
 */
export function deletePromoCode(codeId: string): PromoCode[] {
  const codes = getStoredPromoCodes();
  const updated = codes.filter((c) => c.id !== codeId);
  saveStoredPromoCodes(updated);
  return updated;
}

/**
 * Validate a promo code entered at checkout
 */
export function validatePromoCode(
  inputCode: string,
  subtotalAed: number
): { valid: boolean; promoCode?: PromoCode; error?: string } {
  const cleanInput = inputCode.trim();
  if (!cleanInput) {
    return { valid: false, error: 'Please enter a promo code.' };
  }

  const allCodes = getStoredPromoCodes();
  const normalizedInput = cleanInput.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  // 1. Exact match (case-insensitive)
  let match = allCodes.find(
    (c) => c.code.toLowerCase() === cleanInput.toLowerCase()
  );

  // 2. Normalized alphanumeric match (handles spaces, dashes, e.g. "GIFT 5" vs "GIFT-5")
  if (!match && normalizedInput.length > 0) {
    match = allCodes.find(
      (c) => c.code.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === normalizedInput
    );
  }

  // 3. If matched a registered promo code
  if (match) {
    // Check if already used up (1-time use only)
    if (match.isUsed || (match.isSingleUse && (match.usageCount || 0) >= (match.maxUses || 1))) {
      return {
        valid: false,
        error: `Code "${match.code}" has already been used (1-time use only).`,
      };
    }

    // Check if marked expired / disabled
    if (!match.isActive) {
      return {
        valid: false,
        error: `Code "${match.code}" is expired or unavailable.`,
      };
    }

    // Check minimum cart spend
    if (match.minSpendAed && subtotalAed < match.minSpendAed) {
      return {
        valid: false,
        error: `Code "${match.code}" requires a minimum cart spend of ${match.minSpendAed.toFixed(2)} AED (Current: ${subtotalAed.toFixed(2)} AED).`,
      };
    }

    return { valid: true, promoCode: match };
  }

  // 4. Check if user typed a VIP Member Passcode (1980, 2017, 1992, 2015, or custom account)
  const isMemberCode = ['1980', '2017', '1992', '2015'].includes(cleanInput) ||
    /^\d{4}$/.test(cleanInput);

  if (isMemberCode) {
    // Auto-grant a 5.00 AED VIP Member discount
    const vipPromo: PromoCode = {
      id: `vip-pass-${cleanInput}-${Date.now()}`,
      code: cleanInput,
      dirhamOff: 5.0,
      description: `VIP Member Pass Discount (${cleanInput})`,
      createdAt: Date.now(),
      createdBy: 'Abdul Owner',
      isActive: true,
      isSingleUse: true,
      isUsed: false,
      usageCount: 0,
      minSpendAed: 0,
    };
    return { valid: true, promoCode: vipPromo };
  }

  return {
    valid: false,
    error: `Code "${cleanInput}" is invalid. Please check the code with Abdul Owner.`,
  };
}

/**
 * Mark a promo code as redeemed when an order is placed
 */
export function redeemPromoCode(codeName: string, orderId?: string): boolean {
  if (!codeName) return false;
  const codes = getStoredPromoCodes();
  let found = false;

  const updated = codes.map((c) => {
    if (c.code.toLowerCase() === codeName.trim().toLowerCase()) {
      found = true;
      const newCount = (c.usageCount || 0) + 1;
      const isSingle = c.isSingleUse !== false; // default to true (1 time use)
      const nowUsed = isSingle && newCount >= (c.maxUses || 1);

      return {
        ...c,
        usageCount: newCount,
        isUsed: nowUsed,
        isActive: nowUsed ? false : c.isActive, // automatically expires if single-use is exhausted
        usedByOrder: orderId,
        usedAt: Date.now(),
      };
    }
    return c;
  });

  if (found) {
    saveStoredPromoCodes(updated);
  }
  return found;
}

/**
 * Generate and claim a Receipt VIP Gift Card / Reward Voucher
 */
export function getReceiptGiftCardCode(orderId: string): string {
  const cleanId = orderId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || '7777';
  return `GIFT-${cleanId}`;
}

export function isReceiptGiftCardClaimed(orderId: string): boolean {
  try {
    return localStorage.getItem(`claimed_gc_${orderId}`) === 'true';
  } catch (e) {
    return false;
  }
}

export function claimReceiptGiftCard(
  orderId: string,
  giftCardValueAed: number = 5.0
): { code: string; dirhamValue: number; alreadyClaimed: boolean } {
  const code = getReceiptGiftCardCode(orderId);
  const alreadyClaimed = isReceiptGiftCardClaimed(orderId);

  try {
    localStorage.setItem(`claimed_gc_${orderId}`, 'true');
  } catch (e) {
    console.error('Could not set claimed flag', e);
  }

  // Ensure code exists in stored promo codes as a 1-time single-use voucher
  const allCodes = getStoredPromoCodes();
  const existing = allCodes.find((c) => c.code.toUpperCase() === code.toUpperCase());
  if (!existing) {
    createPromoCode(
      code,
      giftCardValueAed,
      `VIP Gift Card Voucher for Order #${orderId}`,
      0,
      true // 1 time use only!
    );
  }

  return { code, dirhamValue: giftCardValueAed, alreadyClaimed };
}
