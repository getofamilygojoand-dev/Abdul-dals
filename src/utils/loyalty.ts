import { PlacedOrder } from '../types';
import { UserAccount } from './userAccounts';

export const VIP_BADGE_ORDER_THRESHOLD = 5;

export interface LoyaltyStatus {
  hasVipBadge: boolean;
  totalOrders: number;
  ordersNeededForVip: number;
  progressPercent: number; // 0 to 100
  threshold: number;
  isOwner: boolean;
  tierLabel: string;
  badgeTitle: string;
  badgeEmoji: string;
}

/**
 * Calculates user's total orders and VIP Badge qualification status
 */
export function getLoyaltyStatus(
  account: UserAccount | null,
  orders: PlacedOrder[]
): LoyaltyStatus {
  if (!account) {
    return {
      hasVipBadge: false,
      totalOrders: 0,
      ordersNeededForVip: VIP_BADGE_ORDER_THRESHOLD,
      progressPercent: 0,
      threshold: VIP_BADGE_ORDER_THRESHOLD,
      isOwner: false,
      tierLabel: 'Guest Shopper',
      badgeTitle: 'No Badge',
      badgeEmoji: '⚪',
    };
  }

  const cleanCode = account.code.trim().toLowerCase();
  const isOwner = Boolean(account.isOwner || cleanCode === '2015');

  // Count orders placed by this user account
  const userOrders = isOwner
    ? orders
    : orders.filter((ord) => {
        if (!ord) return false;
        const ordUserCode = ord.userCode?.trim().toLowerCase();
        const ordAccountName = ord.accountName?.trim().toLowerCase();
        const accName = account.name?.trim().toLowerCase();
        return ordUserCode === cleanCode || (accName && ordAccountName === accName);
      });

  const totalOrders = userOrders.length;
  // If user is owner or placed >= 5 orders, VIP Badge is unlocked!
  const hasVipBadge = totalOrders >= VIP_BADGE_ORDER_THRESHOLD || isOwner;
  const ordersNeededForVip = Math.max(0, VIP_BADGE_ORDER_THRESHOLD - totalOrders);
  const progressPercent = Math.min(100, Math.round((totalOrders / VIP_BADGE_ORDER_THRESHOLD) * 100));

  let tierLabel = 'Standard Member';
  let badgeTitle = 'VIP Badge';
  let badgeEmoji = '🎖️';

  if (isOwner) {
    tierLabel = 'Store Founder & VIP Owner';
    badgeTitle = '👑 Founder VIP Badge';
    badgeEmoji = '👑';
  } else if (hasVipBadge) {
    tierLabel = 'Verified VIP Badge Holder';
    badgeTitle = '🎖️ Official VIP Badge';
    badgeEmoji = '🎖️';
  } else {
    tierLabel = `Loyalty Member (${totalOrders}/${VIP_BADGE_ORDER_THRESHOLD} Orders)`;
    badgeTitle = `${totalOrders}/${VIP_BADGE_ORDER_THRESHOLD} Orders to VIP`;
    badgeEmoji = '⭐';
  }

  return {
    hasVipBadge,
    totalOrders,
    ordersNeededForVip,
    progressPercent,
    threshold: VIP_BADGE_ORDER_THRESHOLD,
    isOwner,
    tierLabel,
    badgeTitle,
    badgeEmoji,
  };
}

/**
 * Check if a specific user code or account qualifies for the VIP Badge based on order list
 */
export function checkUserHasVipBadge(
  userCode: string,
  orders: PlacedOrder[],
  isOwner?: boolean
): boolean {
  if (!userCode) return false;
  if (isOwner || userCode.trim().toLowerCase() === '2015') return true;

  const count = orders.filter((ord) => ord.userCode?.trim().toLowerCase() === userCode.trim().toLowerCase()).length;
  return count >= VIP_BADGE_ORDER_THRESHOLD;
}
