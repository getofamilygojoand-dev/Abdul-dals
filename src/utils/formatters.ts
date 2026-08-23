import { PlacedOrder } from '../types';

/**
 * Format AED amount into clear readable Dirhams and Fils
 * e.g., 5.00 -> "5.00 AED (5 Dirhams)"
 * 0.50 -> "50 Fils (0.50 AED)"
 * 2.25 -> "2.25 AED (2 Dirhams, 25 Fils)"
 */
export function formatAedCurrency(amountAed: number): {
  short: string;
  detailed: string;
  dirhams: number;
  fils: number;
} {
  const dirhams = Math.floor(amountAed);
  const fils = Math.round((amountAed - dirhams) * 100);

  let detailed = '';
  if (dirhams > 0 && fils > 0) {
    detailed = `${dirhams} Dirham${dirhams > 1 ? 's' : ''}, ${fils} Fils`;
  } else if (dirhams > 0 && fils === 0) {
    detailed = `${dirhams} Dirham${dirhams > 1 ? 's' : ''}`;
  } else {
    detailed = `${fils} Fils`;
  }

  const short = amountAed < 1 && fils > 0 
    ? `${fils} Fils` 
    : `${amountAed.toFixed(2)} AED`;

  return {
    short,
    detailed,
    dirhams,
    fils,
  };
}

/**
 * Calculate if an unpaid order has exceeded 7 days and incurred the 10.00 AED (10 Dirhams) fine
 */
export function calculateOrderLateFine(
  order: PlacedOrder,
  currentTimeMs: number = Date.now()
): {
  isPaid: boolean;
  sevenDayDeadline: number;
  sevenDayDeadlineStr: string;
  twoDayDeadlineStr: string; // backwards compatibility alias
  isOverdue: boolean;
  lateFineAed: number;
  totalWithFine: number;
  hoursRemaining: number;
  daysRemaining: number;
} {
  const isPaid = order.paymentStatus === 'paid';
  const sevenDayDeadline = order.sevenDayPaymentDeadline || order.twoDayPaymentDeadline || (order.createdAt + 7 * 24 * 60 * 60 * 1000);
  
  const sevenDayDeadlineStr = new Date(sevenDayDeadline).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const msRemaining = sevenDayDeadline - currentTimeMs;
  const isOverdue = !isPaid && msRemaining <= 0;
  const lateFineAed = isOverdue ? 10.00 : 0.00;
  const totalWithFine = Number((order.finalTotalAed + lateFineAed).toFixed(2));
  const hoursRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60)));
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

  return {
    isPaid,
    sevenDayDeadline,
    sevenDayDeadlineStr,
    twoDayDeadlineStr: sevenDayDeadlineStr,
    isOverdue,
    lateFineAed,
    totalWithFine,
    hoursRemaining,
    daysRemaining,
  };
}

/**
 * Generate a clean text receipt for copying or sending to Abdul
 */
export function generateOrderReceiptText(
  order: PlacedOrder,
  currentTimeMs: number = Date.now()
): string {
  const issueDateStr = new Date(order.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const expiryTimestamp = order.expiresAt || (order.createdAt + 7 * 24 * 60 * 60 * 1000);
  const expiryDateStr = new Date(expiryTimestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const fineInfo = calculateOrderLateFine(order, currentTimeMs);

  const lines = [
    `══════════════════════════════════════`,
    `       🧾 ABDUL DEALS 24K VIP RECEIPT   `,
    `   👑 ⛏️ 🛏️ 🥪  OFFICIAL SERVICE BOOKING `,
    `══════════════════════════════════════`,
    `Order ID: #${order.id}`,
    `Customer: ${order.customerName || 'Valued VIP Client'}`,
    `Payment Method: 💵 Cash in Hand (Only Allowed Method)`,
    `Payment Status: ${order.paymentStatus === 'paid' ? '✅ Paid in Full (Cash)' : '⏳ Cash on Service Delivery'}`,
    `Issue Date:   ${issueDateStr}`,
    `PAYMENT DUE:  ${fineInfo.sevenDayDeadlineStr} (Pay within 7 Days)`,
    `EXPIRY DATE:  ${expiryDateStr} (Valid 7 Days)`,
    `──────────────────────────────────────`,
    `ORDERED ITEMS:`,
  ];

  order.items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.title}`,
      `   Qty: ${item.quantity}  ×  ${item.priceAed.toFixed(2)} AED  =  ${item.totalAed.toFixed(2)} AED`
    );
    if (item.treatTimings && item.treatTimings.length > 0) {
      lines.push(`   ⏰ Scheduled Treat Timings (Max 3): ${item.treatTimings.join(', ')}`);
    }
  });

  lines.push(`──────────────────────────────────────`);
  lines.push(`Subtotal: ${order.subtotalAed.toFixed(2)} AED`);

  if (order.promoCode && order.promoDiscountAed && order.promoDiscountAed > 0) {
    lines.push(
      `🎟️ Abdul Dirham-Off Code (${order.promoCode}): -${order.promoDiscountAed.toFixed(2)} AED`
    );
  }

  if (order.discountPercentage > 0) {
    lines.push(
      `In-Person VIP Discount (${order.discountPercentage}% off): -${order.discountAed.toFixed(2)} AED`
    );
  }

  if (fineInfo.isOverdue) {
    lines.push(`⚠️ LATE PAYMENT FINE (>7 days unpaid): +10.00 AED (10 Dirhams)`);
    lines.push(`══════════════════════════════════════`);
    lines.push(`TOTAL DUE (incl. 10 AED fine): ${fineInfo.totalWithFine.toFixed(2)} AED (${formatAedCurrency(fineInfo.totalWithFine).detailed})`);
    lines.push(`══════════════════════════════════════`);
    lines.push(`* Notice: 10.00 AED (10 Dirhams) late fee applied because payment was not completed within 7 days.`);
  } else {
    lines.push(`══════════════════════════════════════`);
    lines.push(`TOTAL DUE: ${order.finalTotalAed.toFixed(2)} AED (${formatAedCurrency(order.finalTotalAed).detailed})`);
    lines.push(`══════════════════════════════════════`);
    if (!fineInfo.isPaid) {
      lines.push(`* NOTICE: Please pay within 7 days (${fineInfo.sevenDayDeadlineStr}). If payment is not completed within 7 days, a mandatory 10 Dirham (+10.00 AED) fine will be added to your bill.`);
    }
  }

  if (order.specialInstructions) {
    lines.push(`──────────────────────────────────────`);
    lines.push(`Special Notes / Requests: "${order.specialInstructions}"`);
  }

  lines.push(`──────────────────────────────────────`);
  lines.push(`Store Owner Email: gojoandgetofamily@gmail.com`);
  lines.push(`VIP Hotline: 050 297 8206`);
  lines.push(`🚀 100% Satisfaction & Royal VIP Service Guarantee.`);

  return lines.join('\n');
}
