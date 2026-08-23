import { UserAccount, getStoredUserAccounts, saveCustomUserAccounts, getActiveUserAccount, saveActiveUserAccount } from './userAccounts';
import { PlacedOrder } from '../types';
import { ABDUL_CONTACT } from '../data/dealsData';

export const A_CARD_COST_AED = 1.0; // 1.00 Dirham to buy A Card
export const MAX_A_CARD_BALANCE_AED = 10000.0; // Max 10,000 Dirhams inside the card

export interface ACardTransaction {
  id: string;
  type: 'purchase_card' | 'deposit' | 'payment' | 'refund';
  amountAed: number;
  description: string;
  timestamp: number;
  balanceAfterAed: number;
}

export interface ACardData {
  cardNumber: string; // 16 digits random (formatted XXXX XXXX XXXX XXXX)
  cardholderName: string;
  balanceAed: number; // Starts with 0, goes up on deposit, max 10,000 AED
  createdAt: number;
  expiryDate: string; // e.g. "08/31"
  cvv: string; // 3 random digits e.g. "739"
  costPaidAed: number; // 1.00 AED
  theme?: 'gold' | 'obsidian' | 'emerald' | 'cyber';
  status: 'pending_order' | 'active'; // Card only starts working after order is submitted and sent to Abdul
  orderId?: string;
  orderTimestamp?: number;
  sentToAbdulAt?: number;
  transactions: ACardTransaction[];
}

/**
 * Generates a completely random 16-digit card number formatted into 4 blocks of 4
 */
export function generateRandomCardNumber(): string {
  const p1 = Math.floor(1000 + Math.random() * 9000);
  const p2 = Math.floor(1000 + Math.random() * 9000);
  const p3 = Math.floor(1000 + Math.random() * 9000);
  const p4 = Math.floor(1000 + Math.random() * 9000);
  return `${p1} ${p2} ${p3} ${p4}`;
}

/**
 * Generates a random 3-digit CVV
 */
export function generateRandomCvv(): string {
  return String(Math.floor(100 + Math.random() * 900));
}

/**
 * Generates a random Expiration date (MM/YY, 4-6 years in future)
 */
export function generateRandomExpiry(): string {
  const month = String(Math.floor(1 + Math.random() * 12)).padStart(2, '0');
  const year = (new Date().getFullYear() % 100) + 4 + Math.floor(Math.random() * 3);
  return `${month}/${year}`;
}

/**
 * Helper to update an account in localStorage, memory, active session, and server
 */
export function updateAccountWithACard(userCode: string, aCard: ACardData | null): UserAccount | null {
  const allAccounts = getStoredUserAccounts();
  const cleanCode = userCode.trim().toLowerCase();
  
  let targetAccount = allAccounts.find((a) => a.code.toLowerCase() === cleanCode);
  if (!targetAccount) return null;

  targetAccount = {
    ...targetAccount,
    aCard: aCard ? { ...aCard } : null,
  };

  const updatedAll = allAccounts.map((a) =>
    a.code.toLowerCase() === cleanCode ? targetAccount! : a
  );

  saveCustomUserAccounts(updatedAll);

  // If active user is this account, update active user session
  const active = getActiveUserAccount();
  if (active && active.code.toLowerCase() === cleanCode) {
    saveActiveUserAccount(targetAccount);
  }

  // Dispatch local window event so UI reacts instantly
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('abdul_accounts_updated', { detail: updatedAll }));
  }

  // Sync to server
  fetch('/api/accounts/acard/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userCode, aCard }),
  }).catch(() => {});

  return targetAccount;
}

/**
 * Save an order to global placed orders storage
 */
export function recordPlacedOrderInStorage(order: PlacedOrder) {
  try {
    const existingStr = localStorage.getItem('abdul_vip_orders');
    const orders: PlacedOrder[] = existingStr ? JSON.parse(existingStr) : [];
    const updated = [order, ...orders.filter((o) => o.id !== order.id)];
    localStorage.setItem('abdul_vip_orders', JSON.stringify(updated));
    localStorage.setItem('abdul_my_last_order', JSON.stringify(order));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('abdul_order_created', { detail: order }));
    }
  } catch (e) {
    console.error('Failed to save order to localStorage', e);
  }
}

/**
 * 1. Submit Order for A Card (Creates the 1.00 AED order to send to Abdul)
 */
export function submitACardOrder(
  userCode: string,
  accountName: string,
  theme: 'gold' | 'obsidian' | 'emerald' | 'cyber' = 'gold'
): { success: boolean; account?: UserAccount; aCard?: ACardData; order?: PlacedOrder; error?: string } {
  if (!userCode) {
    return { success: false, error: 'User account code is required to buy an A Card.' };
  }

  const allAccounts = getStoredUserAccounts();
  const account = allAccounts.find((a) => a.code.toLowerCase() === userCode.trim().toLowerCase());
  if (!account) {
    return { success: false, error: 'Account not found. Please log in first.' };
  }

  // If account already owns an active A Card, each user only buys it once!
  if (account.aCard && account.aCard.status === 'active') {
    return {
      success: true,
      account,
      aCard: account.aCard,
      error: 'You already own an active Official A Card! Each account only buys the card one time.',
    };
  }

  // If already in pending status, reuse existing order details
  if (account.aCard && account.aCard.status === 'pending_order') {
    return {
      success: true,
      account,
      aCard: account.aCard,
    };
  }

  const orderId = `ABD-CARD-${Date.now().toString().slice(-4)}-${Math.floor(100 + Math.random() * 900)}`;
  const cardNumber = generateRandomCardNumber();
  const cvv = generateRandomCvv();
  const expiryDate = generateRandomExpiry();

  // Create an official store order record
  const newOrder: PlacedOrder = {
    id: orderId,
    customerName: accountName || account.name,
    userCode: account.code,
    accountName: account.name,
    items: [
      {
        title: 'Official A Card Store Pass (Activation)',
        priceAed: A_CARD_COST_AED,
        quantity: 1,
        totalAed: A_CARD_COST_AED,
        customNote: `Card Theme: ${theme.toUpperCase()} • Generated Card Number: ${cardNumber}`,
      },
    ],
    subtotalAed: A_CARD_COST_AED,
    discountPercentage: 0,
    discountAed: 0,
    finalTotalAed: A_CARD_COST_AED,
    specialInstructions: `Official A Card purchase for account: ${account.name} (Code: ${account.code}). Sent to Abdul for activation.`,
    status: 'pending',
    createdAt: Date.now(),
    sevenDayPaymentDeadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
    twoDayPaymentDeadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    validityDays: 7,
  };

  recordPlacedOrderInStorage(newOrder);

  // Card is in pending_order status until sent to Abdul / activated
  const pendingACard: ACardData = {
    cardNumber,
    cardholderName: accountName || account.name,
    balanceAed: 0.0, // Starts at 0
    createdAt: Date.now(),
    expiryDate,
    cvv,
    costPaidAed: A_CARD_COST_AED,
    theme,
    status: 'pending_order',
    orderId,
    orderTimestamp: Date.now(),
    transactions: [],
  };

  const updatedAccount = updateAccountWithACard(userCode, pendingACard);
  if (!updatedAccount) {
    return { success: false, error: 'Failed to create A Card order.' };
  }

  return {
    success: true,
    account: updatedAccount,
    aCard: pendingACard,
    order: newOrder,
  };
}

/**
 * 2. Send to Abdul & Start Working
 * - Once sent to Abdul, the card starts working!
 * - Status becomes active, initial transaction is logged, balance starts at 0.00 AED, and deposits/spending are unlocked.
 */
export function activateACardAfterSendingToAbdul(
  userCode: string
): { success: boolean; account?: UserAccount; aCard?: ACardData; error?: string } {
  const cleanCode = userCode.trim().toLowerCase();
  const allAccounts = getStoredUserAccounts();
  const account = allAccounts.find((a) => a.code.toLowerCase() === cleanCode);

  if (!account || !account.aCard) {
    return { success: false, error: 'No A Card order found on this account. Please submit an order first.' };
  }

  const existingCard = account.aCard;

  const initialTransaction: ACardTransaction = {
    id: `tx-buy-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: 'purchase_card',
    amountAed: A_CARD_COST_AED,
    description: `Order Submitted & Sent to Abdul (Order #${existingCard.orderId || 'DIRECT'}) • Card Activated`,
    timestamp: Date.now(),
    balanceAfterAed: existingCard.balanceAed || 0.0,
  };

  const activeCard: ACardData = {
    ...existingCard,
    status: 'active',
    sentToAbdulAt: Date.now(),
    transactions: [initialTransaction, ...(existingCard.transactions || [])],
  };

  const updatedAccount = updateAccountWithACard(userCode, activeCard);
  if (!updatedAccount) {
    return { success: false, error: 'Failed to activate A Card.' };
  }

  return {
    success: true,
    account: updatedAccount,
    aCard: activeCard,
  };
}

/**
 * Backward compatibility: Buy and immediately activate or submit order
 */
export function buyACard(
  userCode: string,
  accountName: string,
  theme: 'gold' | 'obsidian' | 'emerald' | 'cyber' = 'gold'
) {
  return submitACardOrder(userCode, accountName, theme);
}

/**
 * Input / Deposit money into an A Card
 * - Card MUST be in 'active' status (i.e. order submitted and sent to Abdul)
 * - Max allowed balance inside the card is 10,000 AED
 * - Increases the balance
 */
export function topUpACard(
  userCode: string,
  amountAed: number,
  customNote?: string
): { success: boolean; newBalance?: number; aCard?: ACardData; error?: string } {
  const cleanCode = userCode.trim().toLowerCase();
  const allAccounts = getStoredUserAccounts();
  const account = allAccounts.find((a) => a.code.toLowerCase() === cleanCode);

  if (!account || !account.aCard) {
    return { success: false, error: 'No active A Card found on this account. Please buy an A Card first for 1.00 Dirham.' };
  }

  if (account.aCard.status !== 'active') {
    return {
      success: false,
      error: 'Your A Card order is not activated yet. Please submit the order and send it to Abdul before adding money.',
    };
  }

  const depositAmount = Number(amountAed);
  if (isNaN(depositAmount) || depositAmount <= 0) {
    return { success: false, error: 'Please enter a valid amount greater than 0 AED.' };
  }

  const currentBalance = Number(account.aCard.balanceAed || 0);
  const remainingRoom = MAX_A_CARD_BALANCE_AED - currentBalance;

  if (remainingRoom <= 0) {
    return {
      success: false,
      error: `Your A Card is at the maximum limit of ${MAX_A_CARD_BALANCE_AED.toLocaleString()} AED. You cannot add more funds until you spend some.`,
    };
  }

  if (depositAmount > remainingRoom) {
    return {
      success: false,
      error: `Cannot deposit ${depositAmount.toFixed(2)} AED. The maximum limit is ${MAX_A_CARD_BALANCE_AED.toLocaleString()} AED. You can only deposit up to ${remainingRoom.toFixed(2)} AED more.`,
    };
  }

  const newBalance = Number((currentBalance + depositAmount).toFixed(2));

  const newTransaction: ACardTransaction = {
    id: `tx-dep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: 'deposit',
    amountAed: depositAmount,
    description: customNote || `Added +${depositAmount.toFixed(2)} AED to A Card balance`,
    timestamp: Date.now(),
    balanceAfterAed: newBalance,
  };

  const updatedACard: ACardData = {
    ...account.aCard,
    balanceAed: newBalance,
    transactions: [newTransaction, ...(account.aCard.transactions || [])],
  };

  const updatedAccount = updateAccountWithACard(userCode, updatedACard);
  if (!updatedAccount) {
    return { success: false, error: 'Failed to update A Card balance.' };
  }

  return {
    success: true,
    newBalance,
    aCard: updatedACard,
  };
}

/**
 * Pay with A Card for store purchases
 * - Deducts amount from A Card balance
 */
export function payWithACard(
  userCode: string,
  amountAed: number,
  orderId?: string
): { success: boolean; remainingBalance?: number; aCard?: ACardData; error?: string } {
  const cleanCode = userCode.trim().toLowerCase();
  const allAccounts = getStoredUserAccounts();
  const account = allAccounts.find((a) => a.code.toLowerCase() === cleanCode);

  if (!account || !account.aCard) {
    return { success: false, error: 'No active A Card found on this account.' };
  }

  if (account.aCard.status !== 'active') {
    return {
      success: false,
      error: 'Your A Card is not activated yet. Please submit the 1.00 AED order to Abdul to start using it.',
    };
  }

  const payAmount = Number(amountAed);
  const currentBalance = Number(account.aCard.balanceAed || 0);

  if (currentBalance < payAmount) {
    return {
      success: false,
      error: `Insufficient A Card balance. You have ${currentBalance.toFixed(2)} AED, but this order is ${payAmount.toFixed(2)} AED. Please add ${ (payAmount - currentBalance).toFixed(2) } AED more to your card.`,
    };
  }

  const remainingBalance = Number((currentBalance - payAmount).toFixed(2));

  const newTransaction: ACardTransaction = {
    id: `tx-pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: 'payment',
    amountAed: payAmount,
    description: orderId ? `Paid for Order #${orderId}` : `Store Checkout Payment (-${payAmount.toFixed(2)} AED)`,
    timestamp: Date.now(),
    balanceAfterAed: remainingBalance,
  };

  const updatedACard: ACardData = {
    ...account.aCard,
    balanceAed: remainingBalance,
    transactions: [newTransaction, ...(account.aCard.transactions || [])],
  };

  updateAccountWithACard(userCode, updatedACard);

  return {
    success: true,
    remainingBalance,
    aCard: updatedACard,
  };
}

/**
 * Initiates an official Top-Up Order (creates an official store bill for adding balance)
 */
export function createTopUpOrder(
  targetUserCode: string,
  amountAed: number,
  targetAccountName?: string
): { success: boolean; order?: PlacedOrder; error?: string } {
  const cleanCode = targetUserCode.trim().toLowerCase();
  const allAccounts = getStoredUserAccounts();
  const account = allAccounts.find((a) => a.code.toLowerCase() === cleanCode);

  if (!account) {
    return { success: false, error: 'Target account not found.' };
  }

  if (!account.aCard || account.aCard.status !== 'active') {
    return {
      success: false,
      error: `Account ${account.name} does not have an active A Card. Please activate the card first with 1.00 AED before creating top-up bills.`,
    };
  }

  const amt = Number(amountAed);
  if (isNaN(amt) || amt <= 0) {
    return { success: false, error: 'Top-up amount must be greater than 0 AED.' };
  }

  const currentBal = Number(account.aCard.balanceAed || 0);
  const remainingRoom = MAX_A_CARD_BALANCE_AED - currentBal;
  if (amt > remainingRoom) {
    return {
      success: false,
      error: `Cannot add ${amt.toFixed(2)} AED. Max remaining capacity is ${remainingRoom.toFixed(2)} AED (Limit: ${MAX_A_CARD_BALANCE_AED.toLocaleString()} AED).`,
    };
  }

  const orderId = `ABD-TOPUP-${Date.now().toString().slice(-4)}-${Math.floor(100 + Math.random() * 900)}`;
  const order: PlacedOrder = {
    id: orderId,
    customerName: targetAccountName || account.name,
    userCode: account.code,
    accountName: account.name,
    items: [
      {
        title: `Official A Card Balance Top-Up (+${amt.toFixed(2)} AED)`,
        priceAed: amt,
        quantity: 1,
        totalAed: amt,
        customNote: `Target Account: ${account.name} (Code: ${account.code}) • A Card: ${account.aCard.cardNumber}`,
      },
    ],
    subtotalAed: amt,
    discountPercentage: 0,
    discountAed: 0,
    finalTotalAed: amt,
    specialInstructions: `A Card balance addition of +${amt.toFixed(2)} AED for account ${account.name} (${account.code}). Pay cash to Abdul.`,
    status: 'pending',
    createdAt: Date.now(),
    sevenDayPaymentDeadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
    twoDayPaymentDeadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    validityDays: 7,
  };

  recordPlacedOrderInStorage(order);

  return {
    success: true,
    order,
  };
}

/**
 * OWNER ONLY (Code 2015): Completely reset a user's A Card
 * Wipes the card, balance, and transaction history, resetting them to not having a card.
 */
export function resetUserACard(
  targetUserCode: string
): { success: boolean; account?: UserAccount; error?: string } {
  const cleanCode = targetUserCode.trim().toLowerCase();
  const allAccounts = getStoredUserAccounts();
  const account = allAccounts.find((a) => a.code.toLowerCase() === cleanCode);

  if (!account) {
    return { success: false, error: 'Target account not found.' };
  }

  const updatedAccount = updateAccountWithACard(targetUserCode, null);
  if (!updatedAccount) {
    return { success: false, error: 'Failed to reset user A Card.' };
  }

  return {
    success: true,
    account: updatedAccount,
  };
}

/**
 * OWNER ONLY (Code 2015): Change / Override a user's A Card balance directly
 */
export function adminSetUserACardBalance(
  targetUserCode: string,
  newBalanceAed: number,
  adminReason?: string
): { success: boolean; account?: UserAccount; aCard?: ACardData; error?: string } {
  const cleanCode = targetUserCode.trim().toLowerCase();
  const allAccounts = getStoredUserAccounts();
  const account = allAccounts.find((a) => a.code.toLowerCase() === cleanCode);

  if (!account) {
    return { success: false, error: 'Target account not found.' };
  }

  const newBal = Math.max(0, Math.min(MAX_A_CARD_BALANCE_AED, Number(newBalanceAed) || 0));

  let cardData: ACardData;
  if (!account.aCard) {
    // Generate an active card if they did not have one
    cardData = {
      cardNumber: generateRandomCardNumber(),
      cardholderName: account.name,
      balanceAed: newBal,
      createdAt: Date.now(),
      expiryDate: generateRandomExpiry(),
      cvv: generateRandomCvv(),
      costPaidAed: A_CARD_COST_AED,
      theme: 'gold',
      status: 'active',
      transactions: [
        {
          id: `tx-admin-set-${Date.now()}`,
          type: 'deposit',
          amountAed: newBal,
          description: adminReason || '👑 Balance set directly by Store Owner (Abdul 2015)',
          timestamp: Date.now(),
          balanceAfterAed: newBal,
        },
      ],
    };
  } else {
    cardData = {
      ...account.aCard,
      status: 'active',
      balanceAed: newBal,
      transactions: [
        {
          id: `tx-admin-set-${Date.now()}`,
          type: 'deposit',
          amountAed: newBal,
          description: adminReason || `👑 Balance updated by Store Owner (Abdul 2015) to ${newBal.toFixed(2)} AED`,
          timestamp: Date.now(),
          balanceAfterAed: newBal,
        },
        ...(account.aCard.transactions || []),
      ],
    };
  }

  const updatedAccount = updateAccountWithACard(targetUserCode, cardData);
  if (!updatedAccount) {
    return { success: false, error: 'Failed to update user A Card balance.' };
  }

  return {
    success: true,
    account: updatedAccount,
    aCard: cardData,
  };
}

/**
 * Generate a pre-filled WhatsApp link to send top-up deposit request to Abdul
 */
export function generateAbdulWhatsAppLinkForTopUp(amountAed: number, account: UserAccount, aCard?: ACardData): string {
  const message = `💳 *A CARD BALANCE TOP-UP REQUEST (+${amountAed.toFixed(2)} AED)* 💰
━━━━━━━━━━━━━━━━━━━━━
👤 *Customer:* ${account.name}
🔑 *Account Code:* ${account.code}
🔢 *A Card:* ${aCard ? aCard.cardNumber : 'Official A Card'}
💵 *Top-up Amount:* ${amountAed.toFixed(2)} AED (Cash in Hand / Send to Abdul)
📈 *New Balance:* ${((aCard?.balanceAed || 0) + amountAed).toFixed(2)} AED
📅 *Date:* ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━
*Hello Abdul!* I want to add *+${amountAed.toFixed(2)} AED* to my Official A Card balance. Sending this to you for confirmation! Thank you!`;

  const cleanNumber = ABDUL_CONTACT.phoneInternational.replace(/\D/g, '');
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate a pre-filled WhatsApp link to send the A Card order to Abdul
 */
export function generateAbdulWhatsAppLinkForACard(order: PlacedOrder, account: UserAccount, aCard?: ACardData): string {
  const message = `👑 *NEW OFFICIAL A CARD ORDER (1.00 AED)* 💳
━━━━━━━━━━━━━━━━━━━━━
👤 *Customer:* ${order.customerName}
🔑 *Account Code:* ${account.code}
🆔 *Order ID:* #${order.id}
💰 *Card Fee:* 1.00 AED (Cash in Hand)
🔢 *Card Number:* ${aCard ? aCard.cardNumber : 'Generated'}
📅 *Date:* ${new Date(order.createdAt).toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━
*Hello Abdul!* I have submitted my 1.00 AED order for the Official A Card. Please confirm and activate my card so I can start depositing money (up to 10,000 AED)! Thank you!`;

  const cleanNumber = ABDUL_CONTACT.phoneInternational.replace(/\D/g, '');
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}
