export type CategoryId = string;

export type UserRole = 'owner' | 'editor' | 'guest';

export interface AuthorizedPerson {
  id: string;
  name: string;
  handle: string; // login identifier e.g. "abdul", "staff1"
  pin: string; // passcode to authenticate
  role: 'owner' | 'editor';
  canEditPrices: boolean;
  canAddDeals: boolean;
  canDeleteDeals: boolean;
  canManageOrders: boolean;
  createdAt: number;
  notes?: string;
}

export interface AuthSession {
  isLoggedIn: boolean;
  currentUser: AuthorizedPerson | null;
}

export interface DealItem {
  id: string;
  categoryId: string;
  categoryName: string;
  store?: 'abdul' | 'hamdaan' | 'both';
  title: string;
  originalText?: string;
  priceAed: number; // in Dirhams (e.g. 5, 0.50, 2.25, 1.50)
  priceFormatted?: string; // e.g. "5.00 AED" or "50 Fils"
  unit: string; // e.g. "per cup", "per 5 days", "per level", "per item", "per day", "per treat"
  emoji: string;
  secondaryIcon?: string;
  imageUrl?: string;
  tag: string;
  description: string;
  popular?: boolean;
  highlight?: string;
  tier?: 'budget' | 'standard' | 'premium' | 'legendary';
  isCustom?: boolean;
  isPaused?: boolean;
  isComingSoon?: boolean;
}

export interface CartItem {
  deal: DealItem;
  quantity: number;
  customNote?: string;
  treatTimings?: string[]; // up to 3 chosen times, e.g. ["08:30 AM", "01:00 PM", "07:30 PM"]
  customPriceAed?: number; // e.g. 2.50 AED when timings are chosen
}

export interface PlacedOrder {
  id: string;
  customerName: string;
  userCode?: string;
  accountName?: string;
  customerEmail?: string;
  items: {
    title: string;
    quantity: number;
    priceAed: number;
    totalAed: number;
    treatTimings?: string[];
    customNote?: string;
  }[];
  subtotalAed: number;
  discountPercentage: number;
  discountAed: number;
  promoCode?: string;
  promoDiscountAed?: number;
  finalTotalAed: number;
  specialInstructions?: string;
  paymentMethod?: 'cash' | 'a_card';
  paymentStatus?: 'paid' | 'pending_verification' | 'cash_on_delivery';
  paymentTransactionId?: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'delivered' | 'not_delivered' | 'denied';
  createdAt: number;
  expiresAt: number;
  validityDays?: number;
  sevenDayPaymentDeadline?: number;
  twoDayPaymentDeadline?: number;
  lateFineAed?: number;
  adminNotes?: string;
}

export interface PromoCode {
  id: string;
  code: string; // e.g. "Rsd0y", "Abd2k", "Dhr10"
  dirhamOff: number; // e.g. 5.00 AED off
  description?: string;
  createdAt: number;
  createdBy: string;
  isActive: boolean; // true = Available, false = Expired / Disabled
  isSingleUse?: boolean; // true = 1 time use only
  isUsed?: boolean; // true = already redeemed
  usageCount: number;
  maxUses?: number;
  usedByOrder?: string;
  usedAt?: number;
  minSpendAed?: number;
}
