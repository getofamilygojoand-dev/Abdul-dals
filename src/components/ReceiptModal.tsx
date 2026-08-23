import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  Sparkles, 
  CheckCircle2,
  Coins,
  QrCode,
  PhoneCall,
  Crown,
  Mail,
  Wallet,
  ShieldCheck,
  CalendarClock,
  Clock,
  Hourglass,
  AlertCircle,
  Calendar,
  AlertTriangle,
  Flame,
  CheckCircle,
  Tag,
  Gift,
  Zap,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PlacedOrder } from '../types';
import { ABDUL_CONTACT } from '../data/dealsData';
import { formatAedCurrency, generateOrderReceiptText, calculateOrderLateFine } from '../utils/formatters';
import { sound } from '../utils/audio';
import {
  claimReceiptGiftCard,
  getReceiptGiftCardCode,
  isReceiptGiftCardClaimed,
} from '../utils/promoCodeStorage';
import { VIP_BADGE_ORDER_THRESHOLD } from '../utils/loyalty';
import catTreatImg from '../assets/images/cat_treat_snack_1786730352381.jpg';

interface ReceiptModalProps {
  order: PlacedOrder | null;
  onClose: () => void;
  placedOrders?: PlacedOrder[];
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  onClose,
  placedOrders = [],
}) => {
  const [copied, setCopied] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);
  const [simulateLateOverdue, setSimulateLateOverdue] = useState(false);
  
  // Gift Card Claim & Redeem State
  const [giftCardClaimed, setGiftCardClaimed] = useState<boolean>(() => {
    return order ? isReceiptGiftCardClaimed(order.id) : false;
  });
  const [copiedGiftCard, setCopiedGiftCard] = useState(false);
  const [giftCardFeedback, setGiftCardFeedback] = useState<string | null>(null);

  if (!order) return null;

  const giftCardCode = getReceiptGiftCardCode(order.id);
  const giftCardValueAed = 5.0; // 5.00 Dirhams VIP Gift Card

  const userOrdersCount = order.userCode
    ? Math.max(
        1,
        placedOrders.filter(
          (o) => o.userCode?.trim().toUpperCase() === order.userCode?.trim().toUpperCase()
        ).length
      )
    : 1;
  const hasVipBadge = userOrdersCount >= VIP_BADGE_ORDER_THRESHOLD || order.userCode === '2015';
  const ordersNeeded = Math.max(0, VIP_BADGE_ORDER_THRESHOLD - userOrdersCount);

  const handleClaimGiftCard = () => {
    sound.playCashRegister();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#fbbf24', '#f59e0b', '#10b981', '#ffffff'],
    });

    const res = claimReceiptGiftCard(order.id, giftCardValueAed);
    setGiftCardClaimed(true);
    navigator.clipboard.writeText(res.code);
    setCopiedGiftCard(true);
    setGiftCardFeedback(`✓ Claimed! Code "${res.code}" (-${res.dirhamValue.toFixed(2)} AED) copied to clipboard!`);
    setTimeout(() => {
      setCopiedGiftCard(false);
    }, 3000);
  };

  const handleCopyGiftCardCode = () => {
    sound.playPop();
    navigator.clipboard.writeText(giftCardCode);
    setCopiedGiftCard(true);
    setGiftCardFeedback(`✓ Code "${giftCardCode}" copied! Paste at checkout for -${giftCardValueAed.toFixed(2)} AED off!`);
    setTimeout(() => {
      setCopiedGiftCard(false);
    }, 3000);
  };

  // Effective time for fine calculation (allows testing what happens past 7 days)
  const effectiveCurrentTime = simulateLateOverdue
    ? order.createdAt + 8 * 24 * 60 * 60 * 1000 // 8 days after creation (past the 7-day deadline)
    : Date.now();

  const fineInfo = calculateOrderLateFine(order, effectiveCurrentTime);
  const totalFormatted = formatAedCurrency(fineInfo.totalWithFine);

  const summary = `Abdul VIP Order #${order.id} | Call 050 297 8206 | Total: ${fineInfo.totalWithFine.toFixed(2)} AED`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=2&data=${encodeURIComponent(summary)}`;

  const handleCopy = () => {
    const text = generateOrderReceiptText(order, effectiveCurrentTime) + `\n\nVIP Hotline: Call Abdul @ ${ABDUL_CONTACT.phoneDisplay}`;
    navigator.clipboard.writeText(text);
    sound.playClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = generateOrderReceiptText(order, effectiveCurrentTime) + `\n\nVIP Hotline: Call Abdul @ ${ABDUL_CONTACT.phoneDisplay}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    sound.playClick();
    window.open(url, '_blank');
  };

  const handleEmailReceipt = () => {
    const subject = `Abdul Deals 24K VIP Order #${order.id} Confirmation (${fineInfo.totalWithFine.toFixed(2)} AED)`;
    const body = generateOrderReceiptText(order, effectiveCurrentTime);
    const mailtoUrl = `mailto:${ABDUL_CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    sound.playClick();
    window.location.href = mailtoUrl;
  };

  const issueDateFormatted = new Date(order.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const expiryTimestamp = order.expiresAt || (order.createdAt + (order.validityDays || 7) * 24 * 60 * 60 * 1000);
  const expiryDateFormatted = new Date(expiryTimestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isExpired = effectiveCurrentTime > expiryTimestamp;
  const msRemainingExpiry = Math.max(0, expiryTimestamp - effectiveCurrentTime);
  const daysRemainingExpiry = Math.ceil(msRemainingExpiry / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/90 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg max-h-[94vh] flex flex-col bg-gradient-to-b from-[#181206] via-[#100c04] to-[#070502] border-2 border-yellow-500/40 rounded-2xl sm:rounded-3xl shadow-2xl shadow-yellow-950/80 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 my-auto text-slate-100 ring-1 ring-yellow-400/20">
        
        {/* Top celebratory VIP header */}
        <div className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 p-4 sm:p-5 text-slate-950 flex items-center justify-between shrink-0 shadow-lg vip-gold-bevel">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-950 text-yellow-400 flex items-center justify-center text-xl shadow-xl font-black shrink-0 border border-yellow-400/40">
              <Crown className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            </div>
            <div>
              <div className="text-3xs font-black uppercase tracking-widest text-slate-950/80">
                Official 24K Royal Certificate
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-950">
                Abdul Deals VIP Order Receipt
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-950/20 hover:bg-slate-950/40 flex items-center justify-center text-slate-950 transition-colors cursor-pointer active:scale-95 border border-slate-950/20"
            aria-label="Close Receipt"
          >
            <X className="w-4 h-4 text-slate-950" />
          </button>
        </div>

        {/* Paper Receipt Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          
          {/* Order Meta info */}
          <div className="bg-[#181206] border-2 border-yellow-500/35 rounded-2xl p-4 flex items-center justify-between shadow-inner">
            <div>
              <div className="text-3xs font-black uppercase tracking-wider text-yellow-400">
                VIP Reference Code
              </div>
              <div className="text-lg font-black text-yellow-300 font-mono drop-shadow-sm">
                #{order.id}
              </div>
              <div className="text-xs text-yellow-100 font-semibold mt-0.5">
                VIP Customer: <strong className="text-white font-bold">{order.customerName}</strong>
              </div>
              <div className="text-3xs text-yellow-400/80 font-mono mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-yellow-400" />
                <span>Issued: {issueDateFormatted}</span>
              </div>
            </div>

            {!qrFailed ? (
              <div className="bg-white p-1 rounded-xl shadow-md shrink-0 border-2 border-yellow-400">
                <img
                  src={qrUrl}
                  alt="Order QR Code"
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                  onError={() => setQrFailed(true)}
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="bg-[#221a0a] border border-yellow-500/40 p-2 rounded-xl flex flex-col items-center justify-center text-yellow-400 shrink-0">
                <QrCode className="w-6 h-6" />
                <span className="text-3xs font-mono font-bold mt-0.5">#{order.id}</span>
              </div>
            )}
          </div>

          {/* Bill Validity, 7-Day Payment Rule & Expiration Card */}
          <div className="bg-gradient-to-br from-[#1b1407] via-[#140e04] to-[#0d0902] border-2 border-yellow-500/40 rounded-2xl p-3.5 sm:p-4 shadow-md space-y-2.5">
            <div className="flex items-center justify-between border-b border-yellow-500/20 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-yellow-300 uppercase tracking-wider">
                <CalendarClock className="w-4 h-4 text-yellow-400" />
                <span>Payment Due Date & Bill Expiry</span>
              </div>
              
              {fineInfo.isPaid ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  <span>Paid (0 AED Fee)</span>
                </span>
              ) : fineInfo.isOverdue ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  <span>+10 AED Fine Active</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-black uppercase tracking-wider bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                  <Clock className="w-3 h-3 text-yellow-400 animate-pulse" />
                  <span>7-Day Period ({fineInfo.daysRemaining}d left)</span>
                </span>
              )}
            </div>

            {/* Timelines grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              
              {/* 7-Day Payment Deadline Card */}
              <div className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                fineInfo.isOverdue 
                  ? 'bg-rose-950/30 border-rose-500/50 ring-1 ring-rose-500/30' 
                  : fineInfo.isPaid
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-black/60 border-yellow-400/40 ring-1 ring-yellow-400/20'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-3xs font-extrabold uppercase text-yellow-400 flex items-center gap-1">
                    <Hourglass className="w-3 h-3 text-yellow-400" />
                    <span>7-Day Payment Deadline</span>
                  </span>
                  {fineInfo.isOverdue && (
                    <span className="text-3xs font-black text-rose-400 uppercase font-mono">Overdue</span>
                  )}
                </div>
                <div className="font-mono font-black text-white text-xs mt-1">
                  {fineInfo.sevenDayDeadlineStr}
                </div>
                <div className="text-3xs text-yellow-400/80 mt-0.5 font-medium">
                  {fineInfo.isPaid 
                    ? 'Payment completed on booking.' 
                    : fineInfo.isOverdue
                    ? '⚠️ 7-day limit exceeded: +10.00 AED (10 Dirhams) fine added'
                    : 'Pay within 7 days to avoid 10 Dirham fine.'}
                </div>
              </div>

              {/* 7-Day Service Expiry Card */}
              <div className="bg-black/60 rounded-xl p-2.5 border border-yellow-500/20 flex flex-col justify-between">
                <div className="text-3xs font-extrabold uppercase text-yellow-400/70 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-yellow-400" />
                  <span>Bill Expiry (7 Days)</span>
                </div>
                <div className="font-mono font-bold text-yellow-300 text-xs mt-1">
                  {expiryDateFormatted}
                </div>
                <div className="text-3xs text-yellow-500/70 mt-0.5 font-medium">
                  {isExpired ? 'Bill has expired' : `Service valid for ${daysRemainingExpiry} more days`}
                </div>
              </div>
            </div>

            {/* 10 Dirham Late Fine Warning Banner */}
            <div className={`flex items-start gap-2.5 text-3xs rounded-xl p-2.5 border transition-all ${
              fineInfo.isOverdue
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                : 'bg-yellow-500/10 border-yellow-500/25 text-yellow-200/90'
            }`}>
              <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${fineInfo.isOverdue ? 'text-rose-400' : 'text-yellow-400'}`} />
              <div className="leading-relaxed">
                <strong className={fineInfo.isOverdue ? 'text-rose-300' : 'text-yellow-300'}>
                  7-Day Payment Rule (10 Dirham Fine):
                </strong>{' '}
                {fineInfo.isOverdue ? (
                  <span>
                    This order was not settled within 7 days of booking. A mandatory <strong>+10.00 AED late payment fine (10 Dirhams)</strong> has been added to your bill total.
                  </span>
                ) : (
                  <span>
                    Please pay within <strong>7 days</strong> of buying (by <em>{fineInfo.sevenDayDeadlineStr}</em>). If payment is not completed within 7 days, you will get a <strong>10 Dirham (+10.00 AED) fine</strong> added to your bill.
                  </span>
                )}
              </div>
            </div>

            {/* Interactive Simulation / Testing Toggle for User */}
            {!fineInfo.isPaid && (
              <div className="pt-1 flex items-center justify-between border-t border-yellow-500/15 text-3xs text-yellow-400/80">
                <span className="flex items-center gap-1 font-medium">
                  <Sparkles className="w-3 h-3 text-yellow-400" />
                  <span>Preview 7-Day Late Fine Effect:</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSimulateLateOverdue(!simulateLateOverdue);
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-3xs font-bold transition-all cursor-pointer select-none active:scale-95 flex items-center gap-1 ${
                    simulateLateOverdue
                      ? 'bg-rose-500 text-white border-rose-400 shadow-md'
                      : 'bg-black/70 text-yellow-300 border-yellow-500/40 hover:border-yellow-400'
                  }`}
                >
                  <span>{simulateLateOverdue ? 'Simulating > 7 Days (Late +10 AED Fine)' : 'Simulate > 7 Days Unpaid'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="bg-black/80 border-2 border-yellow-500/25 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div className="text-3xs font-black uppercase tracking-wider text-yellow-400/80 border-b border-yellow-500/30 pb-2 flex justify-between">
              <span>VIP Service Description</span>
              <span>Total</span>
            </div>

            {order.items.map((item, idx) => {
              const isTreat = item.title.toLowerCase().includes('treat') || (item.treatTimings && item.treatTimings.length > 0);
              return (
                <div key={idx} className="border-b border-yellow-500/10 last:border-b-0 py-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-3">
                      {isTreat && (
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-yellow-400/50 shrink-0">
                          <img
                            src={catTreatImg}
                            alt="Gourmet Cat Treat"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white truncate">{item.title}</div>
                        <div className="text-3xs text-yellow-400/80 font-mono">
                          Qty {item.quantity} × {item.priceAed.toFixed(2)} AED
                        </div>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-yellow-400 shrink-0">
                      {item.totalAed.toFixed(2)} AED
                    </div>
                  </div>

                  {item.treatTimings && item.treatTimings.length > 0 && (
                    <div className="mt-1.5 ml-0 sm:ml-10.5 flex items-center gap-1.5 flex-wrap bg-yellow-400/10 p-1.5 rounded-lg border border-yellow-500/20">
                      <span className="text-3xs text-yellow-400/90 font-bold uppercase font-mono">
                        ⏰ Scheduled Timings (Max 3):
                      </span>
                      {item.treatTimings.map((time, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-3xs bg-yellow-400/20 text-yellow-200 border border-yellow-400/40 px-1.5 py-0.2 rounded font-mono font-bold"
                        >
                          {time}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Subtotal, Discount, Late Fine and Total */}
            <div className="pt-3 border-t border-yellow-500/30 space-y-1.5 text-xs">
              <div className="flex justify-between text-yellow-200/70">
                <span>VIP Subtotal:</span>
                <span className="font-mono text-white">{order.subtotalAed.toFixed(2)} AED</span>
              </div>

              {order.promoCode && order.promoDiscountAed && order.promoDiscountAed > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-emerald-400" />
                    <span>Dirham-Off Promo Code ({order.promoCode}):</span>
                  </span>
                  <span className="font-mono">-{order.promoDiscountAed.toFixed(2)} AED</span>
                </div>
              )}

              {order.discountPercentage > 0 && (
                <div className="flex justify-between text-yellow-400 font-semibold">
                  <span>VIP Negotiated Discount ({order.discountPercentage}% off):</span>
                  <span className="font-mono">-{order.discountAed.toFixed(2)} AED</span>
                </div>
              )}

              {/* Late Payment Fine Row */}
              {fineInfo.isOverdue ? (
                <div className="flex justify-between items-center text-rose-300 font-bold bg-rose-950/30 px-2.5 py-1.5 rounded-lg border border-rose-500/30">
                  <span className="flex items-center gap-1 text-3xs sm:text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Late Payment Fine (&gt; 7 Days Unpaid):</span>
                  </span>
                  <span className="font-mono text-rose-300 font-black">+10.00 AED</span>
                </div>
              ) : !fineInfo.isPaid ? (
                <div className="flex justify-between text-3xs text-yellow-500/70 pt-0.5">
                  <span>7-Day Grace Period (0 AED fine):</span>
                  <span className="font-mono text-yellow-400/80">+0.00 AED</span>
                </div>
              ) : null}

              {/* Total Due */}
              <div className="flex justify-between items-baseline pt-2 border-t-2 border-yellow-500/40 text-white">
                <span className="text-xs font-black uppercase tracking-wider text-yellow-300">
                  {fineInfo.isOverdue ? 'TOTAL DUE (INCL. 10 AED FINE):' : 'TOTAL DUE:'}
                </span>
                <div className="text-right">
                  <span className={`text-xl sm:text-2xl font-black font-mono drop-shadow-md ${
                    fineInfo.isOverdue ? 'text-amber-300' : 'text-yellow-400'
                  }`}>
                    {fineInfo.totalWithFine.toFixed(2)} AED
                  </span>
                  <div className="text-3xs text-yellow-500/70 font-mono font-medium">
                    {totalFormatted.detailed}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Claimable VIP Gift Card / Reward Voucher Section */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#201505] via-[#150e03] to-[#0d0902] border-2 border-yellow-400/70 shadow-xl shadow-yellow-950/60 space-y-3 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute -right-4 -bottom-4 text-5xl opacity-10 pointer-events-none select-none">
              🎁
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-sm">
                  <Gift className="w-4 h-4 text-slate-950" />
                </div>
                <div>
                  <div className="text-3xs font-black uppercase tracking-wider text-yellow-400 font-mono flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                    <span>Receipt VIP Gift Card Voucher</span>
                  </div>
                  <div className="text-xs font-black text-white">
                    Claimable Loyalty Perk: -{giftCardValueAed.toFixed(2)} AED Credit
                  </div>
                </div>
              </div>

              {giftCardClaimed && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-3xs font-mono font-black">
                  Claimed ✓
                </span>
              )}
            </div>

            <div className="p-3 bg-black/80 rounded-xl border border-yellow-500/30 flex items-center justify-between gap-3">
              <div>
                <div className="text-3xs text-yellow-500/70 uppercase font-mono font-bold">
                  Your Unique Gift Voucher Code
                </div>
                <div className="text-sm sm:text-base font-mono font-black text-yellow-300 tracking-wider">
                  {giftCardCode}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {!giftCardClaimed ? (
                  <button
                    type="button"
                    onClick={handleClaimGiftCard}
                    className="px-3.5 py-2 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-300 text-slate-950 font-black rounded-xl text-xs font-mono transition-all cursor-pointer shadow-md vip-gold-bevel active:scale-95 flex items-center gap-1.5 shrink-0"
                  >
                    <Gift className="w-3.5 h-3.5 text-slate-950" />
                    <span>Claim Gift Card</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCopyGiftCardCode}
                    className="px-3.5 py-2 bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-200 hover:text-white font-mono font-bold rounded-xl text-xs transition-all cursor-pointer border border-yellow-400/50 flex items-center gap-1.5 shrink-0"
                  >
                    {copiedGiftCard ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-yellow-300" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {giftCardFeedback && (
              <div className="p-2 rounded-lg bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-3xs font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{giftCardFeedback}</span>
              </div>
            )}
          </div>

          {/* Loyalty & VIP Badge Milestone Card */}
          <div className={`rounded-2xl p-3.5 border-2 transition-all space-y-2 shadow-sm ${
            hasVipBadge
              ? 'bg-gradient-to-r from-amber-950/70 via-black/80 to-yellow-950/70 border-amber-400/80 vip-gold-bevel'
              : 'bg-[#150f05] border-yellow-500/30'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                  hasVipBadge
                    ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 shadow-md'
                    : 'bg-yellow-500/20 border border-yellow-400/40 text-yellow-300'
                }`}>
                  {hasVipBadge ? '🎖️' : '⭐'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-3xs font-black uppercase tracking-wider text-yellow-300 font-mono">
                      VIP Loyalty Milestone
                    </span>
                    {hasVipBadge ? (
                      <span className="text-4xs font-black px-1.5 py-0.2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 uppercase">
                        VIP Badge Active 👑
                      </span>
                    ) : (
                      <span className="text-4xs font-mono font-bold px-1.5 py-0.2 rounded-full bg-yellow-400/15 text-yellow-300 border border-yellow-400/30">
                        {userOrdersCount}/5 Orders
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-black text-white mt-0.5 truncate">
                    {hasVipBadge
                      ? 'Congratulations! You earned the VIP Badge on your account!'
                      : `Order #${userOrdersCount} recorded! ${ordersNeeded} more order${ordersNeeded === 1 ? '' : 's'} to earn your VIP Badge.`}
                  </div>
                </div>
              </div>
            </div>

            {/* 5-step dots */}
            <div className="grid grid-cols-5 gap-1 pt-1">
              {[1, 2, 3, 4, 5].map((step) => {
                const isStepCompleted = userOrdersCount >= step || order.userCode === '2015';
                const isFinal = step === 5;
                return (
                  <div
                    key={step}
                    className={`py-1 rounded-lg border text-center transition-all ${
                      isStepCompleted
                        ? isFinal
                          ? 'bg-amber-400 text-slate-950 font-black border-yellow-200 text-3xs shadow-xs'
                          : 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50 text-3xs font-bold'
                        : 'bg-black/50 text-yellow-200/30 border-yellow-500/15 text-3xs'
                    }`}
                  >
                    {isStepCompleted ? (isFinal ? '🎖️ VIP' : `✓ #${step}`) : isFinal ? '👑 5th' : `#${step}`}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Method and Status Badge */}
          <div className="bg-[#150f05] border border-yellow-500/30 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-yellow-400/40 text-yellow-300 flex items-center justify-center font-black shrink-0">
                <Wallet className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <div className="text-3xs font-black uppercase tracking-wider text-yellow-400">
                  Payment Method (Exclusive)
                </div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>💵 Cash in Hand / In-Person Pay</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-3xs font-black uppercase tracking-wider ${
                order.paymentStatus === 'paid'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : fineInfo.isOverdue
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
              }`}>
                <CheckCircle2 className="w-3 h-3" />
                <span>
                  {order.paymentStatus === 'paid' 
                    ? 'Paid' 
                    : fineInfo.isOverdue 
                    ? 'Unpaid (+2 AED Fine)' 
                    : 'Pay Cash on Service'}
                </span>
              </span>
            </div>
          </div>

          {/* Notes if any */}
          {order.specialInstructions && (
            <div className="p-3 bg-[#181206] border border-yellow-500/30 rounded-xl text-xs shadow-inner">
              <span className="font-bold text-yellow-400">Special Instructions: </span>
              <span className="text-yellow-100 italic">"{order.specialInstructions}"</span>
            </div>
          )}

          {/* Call Abdul Direct Callout Box */}
          <div className="p-3.5 bg-gradient-to-r from-yellow-500/25 via-[#231a08] to-yellow-500/20 border-2 border-yellow-400/60 rounded-2xl flex items-center justify-between text-xs text-yellow-200 shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center font-black shrink-0 vip-gold-bevel shadow-sm">
                <PhoneCall className="w-4 h-4 text-slate-950" />
              </div>
              <div>
                <div className="font-black text-white text-xs">Ready for fast service?</div>
                <div className="text-3xs text-yellow-300 font-mono font-bold">Call Abdul: {ABDUL_CONTACT.phoneDisplay}</div>
              </div>
            </div>
            <a
              href={`tel:${ABDUL_CONTACT.phoneRaw}`}
              className="px-3.5 py-2 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 font-black text-xs rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1 shrink-0 vip-gold-bevel"
            >
              <span>Call Now</span>
            </a>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <button
              onClick={handleEmailReceipt}
              className="py-3 px-3 min-h-[44px] bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 vip-gold-bevel"
            >
              <Mail className="w-4 h-4 text-slate-950" />
              <span>Email Receipt</span>
            </button>

            <button
              onClick={handleCopy}
              className="py-3 px-3 min-h-[44px] bg-[#1a1408] hover:bg-[#261d0c] text-yellow-300 font-bold text-xs rounded-xl border border-yellow-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-yellow-400" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button
              onClick={handleWhatsApp}
              className="py-3 px-3 min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};


