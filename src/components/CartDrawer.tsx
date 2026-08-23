import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Sparkles, 
  BadgePercent, 
  ArrowRight, 
  FileText, 
  Coins,
  Smile,
  ShieldCheck,
  User,
  MessageSquare,
  Crown,
  PhoneCall,
  CreditCard,
  Lock,
  Mail,
  Wallet,
  CheckCircle2,
  Tag,
  Check,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, PlacedOrder, PromoCode } from '../types';
import { ABDUL_CONTACT } from '../data/dealsData';
import { formatAedCurrency } from '../utils/formatters';
import { sound } from '../utils/audio';
import { validatePromoCode } from '../utils/promoCodeStorage';
import { UserAccount } from '../utils/userAccounts';
import { getLoyaltyStatus, VIP_BADGE_ORDER_THRESHOLD } from '../utils/loyalty';
import { submitACardOrder, payWithACard } from '../utils/aCardStorage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQty: (dealId: string, delta: number) => void;
  onRemoveItem: (dealId: string) => void;
  onClearCart: () => void;
  onOrderPlaced: (order: PlacedOrder) => void;
  activeAccount?: UserAccount | null;
  placedOrders?: PlacedOrder[];
  onOpenAccountModal?: () => void;
  onOpenPromoGenerator?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onOrderPlaced,
  activeAccount = null,
  placedOrders = [],
  onOpenAccountModal,
  onOpenPromoGenerator,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'a_card'>('cash');
  const [aCardPaymentError, setACardPaymentError] = useState('');

  const hasActiveACard = activeAccount?.aCard && activeAccount.aCard.status === 'active';
  const aCardBalance = activeAccount?.aCard?.balanceAed || 0;

  const loyaltyStatus = React.useMemo(() => {
    return getLoyaltyStatus(activeAccount, placedOrders);
  }, [activeAccount, placedOrders]);

  if (!isOpen) return null;

  // Calculate totals
  const subtotalAed = cartItems.reduce(
    (acc, item) => acc + (item.customPriceAed ?? item.deal.priceAed) * item.quantity,
    0
  );

  // Dirham-off Promo calculation
  const promoDiscountAed = appliedPromo ? Math.min(subtotalAed, appliedPromo.dirhamOff) : 0;
  const remainingAfterPromo = Math.max(0, subtotalAed - promoDiscountAed);
  const percentDiscountAed = (remainingAfterPromo * discountPercent) / 100;
  const totalDiscountAed = promoDiscountAed + percentDiscountAed;
  const finalTotalAed = Math.max(0, remainingAfterPromo - percentDiscountAed);

  const subtotalFormatted = formatAedCurrency(subtotalAed);
  const finalFormatted = formatAedCurrency(finalTotalAed);

  const handleApplyPromoCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPromoError('');
    setPromoSuccess('');

    if (!promoCodeInput.trim()) {
      setPromoError('Please enter a promo code.');
      sound.playError();
      return;
    }

    const result = validatePromoCode(promoCodeInput, subtotalAed);
    if (result.valid && result.promoCode) {
      sound.playCashRegister();
      setAppliedPromo(result.promoCode);
      setPromoSuccess(`✓ Applied "${result.promoCode.code}": -${result.promoCode.dirhamOff.toFixed(2)} AED OFF!`);
      setPromoError('');
    } else {
      sound.playError();
      setPromoError(result.error || 'Invalid code.');
      setPromoSuccess('');
    }
  };

  const handleRemovePromo = () => {
    sound.playClick();
    setAppliedPromo(null);
    setPromoCodeInput('');
    setPromoSuccess('');
    setPromoError('');
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    if (!activeAccount) {
      sound.playPop();
      if (onOpenAccountModal) {
        onOpenAccountModal();
      }
      return;
    }

    setACardPaymentError('');

    if (paymentMethod === 'a_card') {
      if (!hasActiveACard) {
        setACardPaymentError('Your Official A Card is not active yet! Please activate it with 1.00 AED or switch to Cash in Hand.');
        sound.playError();
        return;
      }
      if (aCardBalance < finalTotalAed) {
        setACardPaymentError(`Insufficient A Card balance (${aCardBalance.toFixed(2)} AED available, need ${finalTotalAed.toFixed(2)} AED). Please add balance to your A Card or use Cash.`);
        sound.playError();
        return;
      }

      const payRes = payWithACard(activeAccount.code, finalTotalAed);
      if (!payRes.success) {
        setACardPaymentError(payRes.error || 'Failed to charge A Card.');
        sound.playError();
        return;
      }

      finalizeOrder('a_card', 'paid');
      return;
    }

    finalizeOrder('cash', 'cash_on_delivery');
  };

  const finalizeOrder = (
    method: 'cash' | 'a_card',
    payStatus: 'paid' | 'pending_verification' | 'cash_on_delivery'
  ) => {
    sound.playCashRegister();

    // Trigger celebratory confetti
    try {
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#facc15', '#fbbf24', '#f59e0b', '#eab308'],
        });
      }
    } catch {
      // Ignore if canvas isn't permitted in iframe
    }

    const finalName = customerName.trim() || (activeAccount ? activeAccount.name : 'VIP Client');

    const newOrder: PlacedOrder = {
      id: Math.floor(100000 + Math.random() * 900000).toString(),
      customerName: finalName,
      userCode: activeAccount ? activeAccount.code : undefined,
      accountName: activeAccount ? activeAccount.name : undefined,
      customerEmail: 'gojoandgetofamily@gmail.com',
      paymentMethod: method,
      paymentStatus: payStatus,
      items: cartItems.map((item) => {
        const itemPrice = item.customPriceAed ?? item.deal.priceAed;
        return {
          title: item.deal.title,
          quantity: item.quantity,
          priceAed: itemPrice,
          totalAed: itemPrice * item.quantity,
          treatTimings: item.treatTimings,
          customNote: item.customNote,
        };
      }),
      subtotalAed,
      discountPercentage: discountPercent,
      discountAed: totalDiscountAed,
      promoCode: appliedPromo?.code,
      promoDiscountAed: promoDiscountAed > 0 ? promoDiscountAed : undefined,
      finalTotalAed,
      specialInstructions: specialNotes.trim() || undefined,
      status: 'pending',
      createdAt: Date.now(),
      sevenDayPaymentDeadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
      twoDayPaymentDeadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      validityDays: 7,
    };

    // If cart contains A Card item, also initialize the A Card on the user's account
    const hasACardItem = cartItems.some(
      (item) =>
        item.deal.id === 'pass-official-a-card' ||
        item.deal.id === 'official-a-card-pass' ||
        item.deal.title.toLowerCase().includes('a card')
    );

    if (hasACardItem && activeAccount) {
      submitACardOrder(activeAccount.code, activeAccount.name);
    }

    onOrderPlaced(newOrder);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-full sm:w-[480px] max-w-full bg-gradient-to-b from-[#161006] via-[#0f0b04] to-[#070502] border-l-2 border-yellow-500/40 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 text-slate-100 ring-1 ring-yellow-400/20">
          
          {/* VIP Header */}
          <div className="p-4 sm:p-5 border-b-2 border-yellow-500/30 flex items-center justify-between bg-gradient-to-r from-[#201708] via-[#161006] to-[#120e06]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 shadow-lg shadow-yellow-500/30 vip-gold-bevel shrink-0">
                <ShoppingBag className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <span className="bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-300 bg-clip-text text-transparent drop-shadow-sm font-black">24K VIP Order Cart</span>
                  <span className="text-3xs bg-yellow-400 text-slate-950 px-2 py-0.5 rounded-full font-mono font-black shadow-xs">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)} items
                  </span>
                </h2>
                <p className="text-3xs text-yellow-200/80 font-medium">
                  Official VIP Order Calculation & Receipt Generator
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-yellow-300 hover:text-white rounded-xl bg-[#221808] border border-yellow-500/40 hover:border-yellow-300 transition-colors cursor-pointer active:scale-95 shadow-sm"
              aria-label="Close Cart"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Direct VIP Hotline Callout */}
          <div className="px-4 py-2.5 bg-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-amber-500/20 border-b border-yellow-500/30 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-3xs font-bold text-yellow-200">
              <Crown className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span>Direct Abdul Hotline: <strong className="font-mono text-yellow-300 font-black">{ABDUL_CONTACT.phoneDisplay}</strong></span>
            </div>
            <a
              href={`tel:${ABDUL_CONTACT.phoneRaw}`}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 text-3xs font-black flex items-center gap-1 hover:brightness-110 transition-all vip-gold-bevel shadow-sm"
            >
              <PhoneCall className="w-2.5 h-2.5 text-slate-950" />
              <span>Call Abdul</span>
            </a>
          </div>

          {/* Account Loyalty Status Bar */}
          {activeAccount && (
            <div className="px-4 py-2 bg-[#120d04] border-b border-yellow-500/25 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm">{loyaltyStatus.hasVipBadge ? '🎖️' : '⭐'}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-3xs font-black text-white truncate">
                      {activeAccount.name}
                    </span>
                    {loyaltyStatus.hasVipBadge ? (
                      <span className="text-4xs px-1.5 py-0.2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black uppercase">
                        VIP Badge Active
                      </span>
                    ) : (
                      <span className="text-4xs px-1.5 py-0.2 rounded-full bg-yellow-500/20 text-yellow-300 font-mono font-bold">
                        {loyaltyStatus.totalOrders}/5 Orders to VIP
                      </span>
                    )}
                  </div>
                  <p className="text-4xs text-yellow-200/70 truncate">
                    {loyaltyStatus.hasVipBadge
                      ? 'Priority 24K VIP fulfillment applied to this order'
                      : `Placing this order will make it ${loyaltyStatus.totalOrders + 1}/5 towards earning your VIP Badge!`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenAccountModal}
                className="text-4xs text-yellow-400 hover:text-yellow-300 font-mono underline cursor-pointer shrink-0 font-bold"
              >
                View Status →
              </button>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-yellow-400/60">
                <div className="w-16 h-16 rounded-2xl bg-[#1a1408] border border-yellow-500/30 flex items-center justify-center text-3xl mb-3 shadow-inner">
                  🛒
                </div>
                <h3 className="text-base font-black text-white mb-1">
                  Your VIP cart is empty
                </h3>
                <p className="text-xs text-yellow-200/60 max-w-xs mb-5">
                  Select your Marvel Rivals boosts, Nutella butter buns, Karak chai, or room maintenance deals.
                </p>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-yellow-500/20 active:scale-95"
                >
                  Explore VIP Catalog
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-yellow-300/80 font-bold mb-1">
                  <span>Selected VIP Services</span>
                  <button
                    onClick={() => {
                      sound.playClick();
                      onClearCart();
                    }}
                    className="text-rose-400 hover:text-rose-300 text-3xs font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                </div>

                {cartItems.map((item) => {
                  const effectivePrice = item.customPriceAed ?? item.deal.priceAed;
                  const itemTotal = effectivePrice * item.quantity;
                  return (
                    <div
                      key={item.deal.id}
                      className="p-3 bg-[#181308] border border-yellow-500/20 rounded-xl flex flex-col gap-2 group hover:border-yellow-400/60 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-lg bg-[#241a0a] border border-yellow-500/20 flex items-center justify-center text-lg shrink-0 select-none">
                            {item.deal.emoji}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-white truncate">
                              {item.deal.title}
                            </h4>
                            <div className="text-3xs text-yellow-400 font-semibold font-mono flex items-center gap-1.5 flex-wrap">
                              <span>{effectivePrice.toFixed(2)} AED each</span>
                              {item.customPriceAed && (
                                <span className="bg-yellow-400/20 text-yellow-300 px-1.5 py-0.2 rounded text-3xs font-mono">
                                  ⏰ Timed Schedule (2.50 AED)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center bg-black/80 border border-yellow-500/30 rounded-lg p-0.5">
                            <button
                              onClick={() => {
                                sound.playClick();
                                onUpdateQty(item.deal.id, -1);
                              }}
                              className="p-1 text-yellow-300 hover:text-white rounded hover:bg-[#201808]"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center text-xs font-black text-white font-mono">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => {
                                sound.playCoin();
                                onUpdateQty(item.deal.id, 1);
                              }}
                              className="p-1 text-yellow-300 hover:text-white rounded hover:bg-[#201808]"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="text-xs font-black text-yellow-400 font-mono min-w-[50px] text-right">
                            {itemTotal.toFixed(2)} AED
                          </span>

                          <button
                            onClick={() => {
                              sound.playClick();
                              onRemoveItem(item.deal.id);
                            }}
                            className="p-1 text-yellow-500/50 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Treat Timings Tags */}
                      {item.treatTimings && item.treatTimings.length > 0 && (
                        <div className="pt-1.5 border-t border-yellow-500/15 flex items-center gap-1.5 flex-wrap">
                          <span className="text-3xs text-yellow-400/80 font-bold uppercase font-mono">
                            ⏰ Timings ({item.treatTimings.length}/3):
                          </span>
                          {item.treatTimings.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-3xs bg-yellow-400/15 border border-yellow-400/40 text-yellow-200 px-2 py-0.5 rounded font-mono font-bold"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* A Card One-Time Purchase Badge in Cart */}
                      {(item.deal.id === 'pass-official-a-card' || item.deal.id === 'official-a-card-pass' || item.deal.title.toLowerCase().includes('a card')) && activeAccount?.aCard && (
                        <div className="pt-1.5 border-t border-emerald-500/30 flex items-center gap-1.5 text-3xs text-emerald-300 font-mono">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Official A Card already recorded on your account (1-time buy).</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Account Status Banner */}
                {activeAccount ? (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-500/20 via-amber-500/10 to-yellow-500/20 border border-yellow-400/50 flex items-center justify-between text-xs shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{activeAccount.avatarEmoji}</span>
                      <div>
                        <div className="font-black text-white">Signed in: {activeAccount.name}</div>
                        <div className="text-3xs text-yellow-300/90 font-bold">Code: {activeAccount.code} • Ready to place order</div>
                      </div>
                    </div>
                    {onOpenAccountModal && (
                      <button
                        onClick={onOpenAccountModal}
                        className="px-2.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-lg text-3xs transition-all cursor-pointer shadow-xs"
                      >
                        Account
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-amber-950/60 border-2 border-amber-400/80 flex items-center justify-between text-xs shadow-md">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">🔒</span>
                      <div>
                        <div className="font-black text-amber-200">Sign In Required To Buy</div>
                        <div className="text-3xs text-yellow-200/90 font-bold">You are not allowed to buy anything until you log in to an account.</div>
                      </div>
                    </div>
                    {onOpenAccountModal && (
                      <button
                        onClick={onOpenAccountModal}
                        className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-lg text-xs transition-all cursor-pointer shadow-sm shrink-0"
                      >
                        Sign In Now
                      </button>
                    )}
                  </div>
                )}

                {/* Customer Details Form */}
                <div className="pt-3 border-t border-yellow-500/20 space-y-3">
                  <div>
                    <label className="block text-3xs font-extrabold text-yellow-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <User className="w-3 h-3 text-yellow-400" />
                      <span>VIP Customer / Room / Nickname:</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="VIP Client / Room 402 / Nickname"
                      className="w-full px-3 py-2 bg-[#181308] border border-yellow-500/30 focus:border-yellow-400 rounded-xl text-xs text-white placeholder-yellow-500/40 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-3xs font-extrabold text-yellow-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-yellow-400" />
                      <span>Special Requests / VIP Instructions:</span>
                    </label>
                    <input
                      type="text"
                      value={specialNotes}
                      onChange={(e) => setSpecialNotes(e.target.value)}
                      placeholder="Extra hot chai, Nutella double coat, Middle room sweeping"
                      className="w-full px-3 py-2 bg-[#181308] border border-yellow-500/30 focus:border-yellow-400 rounded-xl text-xs text-white placeholder-yellow-500/40 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Abdul's Dirham-Off Promo Code Section */}
                  <div className="p-3.5 bg-gradient-to-r from-amber-950/30 via-[#181308] to-yellow-950/40 border border-yellow-500/30 rounded-xl space-y-2.5 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-3xs font-black uppercase tracking-wider text-yellow-400 flex items-center gap-1.5 font-mono">
                        <Tag className="w-3.5 h-3.5 text-yellow-400" />
                        <span>Abdul Dirham-Off Promo Code:</span>
                      </span>
                      {activeAccount?.isOwner && activeAccount?.code === '2015' && onOpenPromoGenerator && (
                        <button
                          type="button"
                          onClick={() => {
                            sound.playPop();
                            onOpenPromoGenerator();
                          }}
                          className="text-3xs text-yellow-300 hover:text-white font-mono font-bold flex items-center gap-1 cursor-pointer bg-yellow-500/20 hover:bg-yellow-500/30 px-2 py-0.5 rounded border border-yellow-400/50 transition-colors"
                        >
                          <Crown className="w-2.5 h-2.5 text-yellow-400" />
                          <span>Promo Generator ↗</span>
                        </button>
                      )}
                    </div>

                    {!appliedPromo ? (
                      <form onSubmit={handleApplyPromoCode} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={promoCodeInput}
                            onChange={(e) => setPromoCodeInput(e.target.value)}
                            placeholder="Enter Promo Code"
                            className="flex-1 px-3 py-2 bg-[#100b04] border border-yellow-500/40 focus:border-yellow-400 rounded-xl text-xs font-mono font-bold text-yellow-300 placeholder-yellow-500/30 focus:outline-none transition-colors uppercase tracking-wider"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-300 text-slate-950 rounded-xl text-xs font-mono font-black transition-all cursor-pointer shadow-md vip-gold-bevel active:scale-95 shrink-0"
                          >
                            Apply
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xs text-emerald-300 font-mono font-black shrink-0">
                            ✓
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-xs text-emerald-300">
                                {appliedPromo.code}
                              </span>
                              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-3xs font-mono font-black px-1.5 py-0.2 rounded">
                                -{appliedPromo.dirhamOff.toFixed(2)} AED
                              </span>
                            </div>
                            <p className="text-3xs text-emerald-200/80 truncate">
                              {appliedPromo.description || 'Dirham-Off Discount Applied'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleRemovePromo}
                          className="text-3xs text-rose-400 hover:text-rose-200 font-mono font-bold underline cursor-pointer shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {promoError && (
                      <div className="p-2 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-200 text-3xs flex items-center gap-1.5 font-mono">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{promoError}</span>
                      </div>
                    )}

                    {promoSuccess && (
                      <div className="p-2 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-3xs flex items-center gap-1.5 font-mono">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{promoSuccess}</span>
                      </div>
                    )}
                  </div>

                  {/* Abdul's VIP Negotiated Discount Slider */}
                  <div className="p-3.5 bg-gradient-to-r from-yellow-950/40 via-[#181308] to-yellow-950/40 border border-yellow-500/30 rounded-xl space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-3xs font-black uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                          <BadgePercent className="w-3.5 h-3.5" />
                          <span>Direct Negotiated Discount with Abdul:</span>
                        </span>
                        <span className="text-xs font-black text-yellow-300 font-mono bg-yellow-400/20 px-2 py-0.5 rounded-md border border-yellow-400/40">
                          {discountPercent}% OFF
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="5"
                        value={discountPercent}
                        onChange={(e) => {
                          sound.playClick();
                          setDiscountPercent(Number(e.target.value));
                        }}
                        className="w-full accent-yellow-400 cursor-pointer"
                      />
                      <div className="flex justify-between text-3xs font-mono text-yellow-500/60 mt-1">
                        <span>0% (Standard)</span>
                        <span>25% (VIP Friend)</span>
                        <span>50% (Abdul Special)</span>
                      </div>
                      {discountPercent > 0 && (
                        <p className="text-3xs text-yellow-300/90 italic mt-1.5 flex items-center gap-1">
                          <Smile className="w-3 h-3 text-yellow-400" />
                          <span>VIP Discount approved by Abdul!</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Payment Method Selector (Cash in Hand OR Official A Card) */}
                  <div className="space-y-2 pt-2 border-t border-yellow-500/20">
                    <label className="block text-3xs font-extrabold text-yellow-300 uppercase tracking-wider flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Wallet className="w-3 h-3 text-yellow-400" />
                        <span>Payment Method:</span>
                      </div>
                      {hasActiveACard && (
                        <span className="font-mono text-emerald-400 font-bold">
                          A Card: {aCardBalance.toFixed(2)} AED
                        </span>
                      )}
                    </label>

                    {aCardPaymentError && (
                      <div className="p-2.5 rounded-xl bg-rose-950/90 border border-rose-500/60 text-rose-200 text-3xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{aCardPaymentError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Cash in Hand Option */}
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setPaymentMethod('cash');
                          setACardPaymentError('');
                        }}
                        className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          paymentMethod === 'cash'
                            ? 'bg-gradient-to-r from-[#2a1d08] to-[#161006] border-yellow-400 shadow-md ring-1 ring-yellow-400/40'
                            : 'bg-black/40 border-yellow-500/20 hover:border-yellow-500/40 opacity-75'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black shrink-0 ${
                            paymentMethod === 'cash'
                              ? 'bg-gradient-to-br from-yellow-300 to-amber-500 text-slate-950 shadow-xs'
                              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            <Coins className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-white truncate">Cash in Hand</div>
                            <div className="text-4xs text-yellow-200/70 truncate">Pay Abdul in person</div>
                          </div>
                        </div>
                        {paymentMethod === 'cash' && (
                          <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
                        )}
                      </button>

                      {/* Official A Card Option */}
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setPaymentMethod('a_card');
                          setACardPaymentError('');
                        }}
                        className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          paymentMethod === 'a_card'
                            ? 'bg-gradient-to-r from-[#1f1708] via-[#2a1e08] to-[#120d04] border-yellow-400 shadow-md ring-1 ring-yellow-400/40'
                            : 'bg-black/40 border-yellow-500/20 hover:border-yellow-500/40 opacity-75'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black shrink-0 ${
                            paymentMethod === 'a_card'
                              ? 'bg-gradient-to-br from-amber-300 via-yellow-400 to-yellow-500 text-slate-950 shadow-xs'
                              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-white truncate flex items-center gap-1">
                              <span>Pay With A Card</span>
                              {hasActiveACard && (
                                <span className="text-4xs font-mono font-black px-1 rounded bg-emerald-400/20 text-emerald-300">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="text-4xs text-yellow-200/70 truncate font-mono">
                              {hasActiveACard ? `${aCardBalance.toFixed(2)} AED balance` : '1.00 AED activation'}
                            </div>
                          </div>
                        </div>
                        {paymentMethod === 'a_card' && (
                          <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
                        )}
                      </button>
                    </div>

                    {paymentMethod === 'a_card' && !hasActiveACard && (
                      <p className="text-3xs text-amber-300/90 font-medium px-1 flex items-center gap-1">
                        <span>ℹ️</span>
                        <span>You need to unlock your Official A Card (1.00 AED) in your Account profile to pay with it.</span>
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Subtotal & Checkout */}
          {cartItems.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-yellow-500/25 bg-[#120e06] space-y-3 shrink-0">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-yellow-200/70">
                  <span>VIP Subtotal:</span>
                  <span className="font-mono text-white">{subtotalAed.toFixed(2)} AED</span>
                </div>

                {promoDiscountAed > 0 && appliedPromo && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-emerald-400" />
                      <span>Dirham-Off Code ({appliedPromo.code}):</span>
                    </span>
                    <span className="font-mono">-{promoDiscountAed.toFixed(2)} AED</span>
                  </div>
                )}

                {percentDiscountAed > 0 && (
                  <div className="flex justify-between text-yellow-400 font-semibold">
                    <span>VIP Negotiated Discount ({discountPercent}%):</span>
                    <span className="font-mono">-{percentDiscountAed.toFixed(2)} AED</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-2 border-t border-yellow-500/20 text-white">
                  <span className="text-sm font-black flex items-center gap-1.5 text-yellow-300">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span>Total Due:</span>
                  </span>
                  <div className="text-right">
                    <div className="text-xl font-black text-yellow-400 font-mono drop-shadow-sm">
                      {finalTotalAed.toFixed(2)} AED
                    </div>
                    <div className="text-3xs text-yellow-500/60 font-mono">
                      {finalFormatted.detailed}
                    </div>
                  </div>
                </div>

                <div className="text-3xs text-yellow-400/90 flex flex-col items-center justify-center gap-0.5 pt-1 text-center font-medium">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                    <span>Official 24K Bill • 7-day service validity</span>
                  </div>
                  <span className="text-3xs text-amber-300/80 font-bold">
                    ⚠️ Payment policy: Please pay within 7 days. Unpaid bills after 7 days incur a 10 Dirham (+10.00 AED) fine
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className={`w-full py-3.5 px-4 min-h-[46px] font-black text-xs sm:text-sm rounded-xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer select-none ${
                  activeAccount
                    ? 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-300 text-slate-950 shadow-yellow-500/25 vip-gold-bevel'
                    : 'bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-amber-500/30'
                }`}
              >
                {activeAccount ? (
                  <>
                    <FileText className="w-4 h-4 text-slate-950" />
                    <span>Confirm 24K VIP Order & Print Receipt</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </>
                ) : (
                  <>
                    <span className="text-sm">🔒</span>
                    <span>Sign In To Complete Purchase</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
