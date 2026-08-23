import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  RotateCw,
  Wallet,
  Coins,
  History,
  Info,
  Send,
  PhoneCall,
  MessageSquare,
  ArrowRight,
  AlertCircle,
  ExternalLink,
  Crown,
  Receipt,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserAccount, getStoredUserAccounts } from '../utils/userAccounts';
import {
  A_CARD_COST_AED,
  MAX_A_CARD_BALANCE_AED,
  ACardData,
  submitACardOrder,
  activateACardAfterSendingToAbdul,
  topUpACard,
  createTopUpOrder,
  generateAbdulWhatsAppLinkForACard,
  generateAbdulWhatsAppLinkForTopUp,
} from '../utils/aCardStorage';
import { ABDUL_CONTACT } from '../data/dealsData';
import { sound } from '../utils/audio';
import { PlacedOrder } from '../types';

interface ACardViewProps {
  activeAccount: UserAccount;
  onAccountUpdated?: (updated: UserAccount) => void;
}

export const ACardView: React.FC<ACardViewProps> = ({
  activeAccount,
  onAccountUpdated,
}) => {
  const aCard: ACardData | undefined = activeAccount?.aCard;
  const isOwnerAbdul = activeAccount?.code === '2015' || activeAccount?.isOwner;

  const [isFlipped, setIsFlipped] = useState(false);
  const [copiedNum, setCopiedNum] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<'gold' | 'obsidian' | 'emerald' | 'cyber'>(
    aCard?.theme || 'gold'
  );

  // Target account selection for top-up
  const [allAccounts, setAllAccounts] = useState<UserAccount[]>([]);
  const [targetAccountCode, setTargetAccountCode] = useState<string>(activeAccount?.code || '');
  const [createdTopUpBill, setCreatedTopUpBill] = useState<PlacedOrder | null>(null);

  useEffect(() => {
    setAllAccounts(getStoredUserAccounts());
    setTargetAccountCode(activeAccount?.code || '');
  }, [activeAccount]);

  const targetAccount = allAccounts.find(
    (a) => a.code.toLowerCase().trim() === targetAccountCode.toLowerCase().trim()
  ) || activeAccount;

  const targetACard = targetAccount?.aCard;
  const isTargetCardActive = targetACard?.status === 'active' || (targetAccount?.isOwner && !!targetACard);

  const isPendingOrder = aCard?.status === 'pending_order';
  const isActive = aCard?.status === 'active' || (isOwnerAbdul && !!aCard);

  const balance = aCard ? Number(aCard.balanceAed || 0) : 0;
  const remainingRoom = Math.max(0, MAX_A_CARD_BALANCE_AED - balance);
  const percentCapacity = Math.min(100, Math.round((balance / MAX_A_CARD_BALANCE_AED) * 100));

  const handleCopyCardNumber = () => {
    if (!aCard) return;
    sound.playPop();
    navigator.clipboard.writeText(aCard.cardNumber.replace(/\s+/g, ''));
    setCopiedNum(true);
    setTimeout(() => setCopiedNum(false), 2000);
  };

  // Instant Owner Activation (Abdul 2015)
  const handleOwnerInstantActivate = () => {
    setIsProcessing(true);
    setActionErrorMsg(null);
    setActionSuccessMsg(null);
    try {
      if (!aCard) {
        submitACardOrder(activeAccount.code, activeAccount.name, 'gold');
      }
      const res = activateACardAfterSendingToAbdul(activeAccount.code);
      if (res.success && res.account && res.aCard) {
        sound.playCashRegister();
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#eab308', '#f59e0b', '#fbbf24', '#ffffff'],
        });
        setActionSuccessMsg('👑 Owner A Card is now active and ready for adding balance!');
        if (onAccountUpdated) onAccountUpdated(res.account);
      }
    } catch (e: any) {
      setActionErrorMsg(e?.message || 'Failed to activate owner card.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 1. Submit Order to Abdul (1.00 AED)
  const handleSubmitOrderToAbdul = () => {
    setIsProcessing(true);
    setActionErrorMsg(null);
    setActionSuccessMsg(null);

    try {
      const res = submitACardOrder(activeAccount.code, activeAccount.name, selectedTheme);
      if (res.success && res.account && res.aCard) {
        sound.playPop();
        if (isOwnerAbdul) {
          const act = activateACardAfterSendingToAbdul(activeAccount.code);
          if (act.account && onAccountUpdated) {
            onAccountUpdated(act.account);
          }
          setActionSuccessMsg('👑 Owner A Card initialized and ready to add balance!');
          return;
        }

        setActionSuccessMsg(
          `Order #${res.aCard.orderId || 'PENDING'} submitted! Now send the order to Abdul via WhatsApp or Call to activate your card & start working.`
        );
        if (onAccountUpdated) {
          onAccountUpdated(res.account);
        }
      } else {
        setActionErrorMsg(res.error || 'Failed to submit A Card order.');
      }
    } catch (e: any) {
      setActionErrorMsg(e?.message || 'Error submitting A Card order.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Confirm Sent to Abdul & Activate Card
  const handleConfirmSentAndActivate = () => {
    setIsProcessing(true);
    setActionErrorMsg(null);
    setActionSuccessMsg(null);

    try {
      const res = activateACardAfterSendingToAbdul(activeAccount.code);
      if (res.success && res.account && res.aCard) {
        sound.playCashRegister();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#eab308', '#f59e0b', '#fbbf24', '#22c55e', '#ffffff'],
        });
        setActionSuccessMsg(
          `🎉 Official A Card is now ACTIVE and WORKING! You can now deposit money up to 10,000.00 AED and make store payments.`
        );
        if (onAccountUpdated) {
          onAccountUpdated(res.account);
        }
      } else {
        setActionErrorMsg(res.error || 'Failed to activate card.');
      }
    } catch (e: any) {
      setActionErrorMsg(e?.message || 'Error activating card.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Deposit money into working card (supports chosen account or current active account)
  const handleDeposit = (amountToAdd?: number) => {
    const targetCode = targetAccount?.code || activeAccount.code;
    const targetAcc = targetAccount || activeAccount;

    if (targetCode === activeAccount.code && !isActive && isOwnerAbdul) {
      if (!aCard) submitACardOrder(activeAccount.code, activeAccount.name, 'gold');
      activateACardAfterSendingToAbdul(activeAccount.code);
    }

    const amt = amountToAdd !== undefined ? amountToAdd : parseFloat(depositAmount);

    if (isNaN(amt) || amt <= 0) {
      setActionErrorMsg('Please enter a valid amount greater than 0 AED.');
      return;
    }

    const targetBal = targetAcc.aCard ? Number(targetAcc.aCard.balanceAed || 0) : 0;
    const targetRoom = Math.max(0, MAX_A_CARD_BALANCE_AED - targetBal);

    if (amt > targetRoom) {
      setActionErrorMsg(
        `Cannot add ${amt.toFixed(2)} AED to ${targetAcc.name}'s card. Max remaining capacity is ${targetRoom.toFixed(2)} AED.`
      );
      return;
    }

    setIsProcessing(true);
    setActionErrorMsg(null);
    setActionSuccessMsg(null);

    try {
      const res = topUpACard(targetCode, amt);
      if (res.success && res.aCard) {
        sound.playCashRegister();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#22c55e', '#eab308', '#f59e0b', '#ffffff'],
        });
        setDepositAmount('');
        setActionSuccessMsg(`Added +${amt.toFixed(2)} AED to ${targetAcc.name}'s A-Card! New balance: ${res.newBalance?.toFixed(2)} AED.`);
        setAllAccounts(getStoredUserAccounts());
        if (targetCode === activeAccount.code && onAccountUpdated) {
          onAccountUpdated({
            ...activeAccount,
            aCard: res.aCard,
          });
        }
      } else {
        setActionErrorMsg(res.error || 'Failed to deposit funds.');
      }
    } catch (e: any) {
      setActionErrorMsg(e?.message || 'Error processing deposit.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 3.5 Create official store top-up bill (Order)
  const handleCreateTopUpBill = (amountToAdd?: number) => {
    const targetCode = targetAccount?.code || activeAccount.code;
    const targetAcc = targetAccount || activeAccount;

    const amt = amountToAdd !== undefined ? amountToAdd : parseFloat(depositAmount);

    if (isNaN(amt) || amt <= 0) {
      setActionErrorMsg('Please enter a valid amount greater than 0 AED.');
      return;
    }

    if (!targetAcc.aCard || targetAcc.aCard.status !== 'active') {
      setActionErrorMsg(`Account ${targetAcc.name} does not have an active A-Card yet. Must activate first with 1.00 AED.`);
      return;
    }

    setIsProcessing(true);
    setActionErrorMsg(null);
    setActionSuccessMsg(null);

    try {
      const res = createTopUpOrder(targetCode, amt, targetAcc.name);
      if (res.success && res.order) {
        sound.playCashRegister();
        setCreatedTopUpBill(res.order);
        setActionSuccessMsg(`Official Top-Up Bill #${res.order.id} generated for +${amt.toFixed(2)} AED! It is now a store bill.`);
      } else {
        setActionErrorMsg(res.error || 'Failed to create top-up bill.');
      }
    } catch (e: any) {
      setActionErrorMsg(e?.message || 'Error generating top-up order.');
    } finally {
      setIsProcessing(false);
    }
  };

  // WhatsApp Order Link generator
  const getWhatsAppLink = () => {
    if (!aCard) return ABDUL_CONTACT.whatsAppUrl;
    const mockOrder: PlacedOrder = {
      id: aCard.orderId || 'DIRECT',
      customerName: activeAccount.name,
      userCode: activeAccount.code,
      items: [],
      subtotalAed: A_CARD_COST_AED,
      discountPercentage: 0,
      discountAed: 0,
      finalTotalAed: A_CARD_COST_AED,
      status: 'pending',
      createdAt: aCard.orderTimestamp || Date.now(),
      sevenDayPaymentDeadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
      twoDayPaymentDeadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      validityDays: 7,
    };
    return generateAbdulWhatsAppLinkForACard(mockOrder, activeAccount, aCard);
  };

  // WhatsApp Top-Up Link generator
  const getWhatsAppTopUpLink = (amount: number) => {
    return generateAbdulWhatsAppLinkForTopUp(amount, activeAccount, aCard);
  };

  // Quick increment buttons requested by user:
  // +1, +5, +10, +15, +20, +25, +30, +50, +100, +500, +1000, +2500, +5000
  const quickIncrements = [1, 5, 10, 15, 20, 25, 30, 50, 100, 500, 1000, 2500, 5000];

  // Theme styling configurations
  const themeStyles = {
    gold: {
      cardBg: 'bg-gradient-to-br from-[#2a1e08] via-[#1a1205] to-[#0d0902]',
      border: 'border-yellow-400/80',
      badgeBg: 'bg-yellow-400 text-slate-950',
      chipColor: 'from-yellow-200 via-amber-400 to-yellow-500',
      textAccent: 'text-yellow-300',
      foilGleam: 'from-amber-400/30 via-yellow-200/10 to-transparent',
    },
    obsidian: {
      cardBg: 'bg-gradient-to-br from-[#1c1d22] via-[#0e0f12] to-[#050608]',
      border: 'border-slate-400/70',
      badgeBg: 'bg-slate-200 text-slate-950',
      chipColor: 'from-slate-200 via-gray-400 to-slate-300',
      textAccent: 'text-slate-200',
      foilGleam: 'from-slate-300/20 via-white/5 to-transparent',
    },
    emerald: {
      cardBg: 'bg-gradient-to-br from-[#062419] via-[#03150e] to-[#010906]',
      border: 'border-emerald-400/80',
      badgeBg: 'bg-emerald-400 text-slate-950',
      chipColor: 'from-emerald-200 via-emerald-400 to-teal-500',
      textAccent: 'text-emerald-300',
      foilGleam: 'from-emerald-400/30 via-teal-200/10 to-transparent',
    },
    cyber: {
      cardBg: 'bg-gradient-to-br from-[#1b0a2a] via-[#0e0417] to-[#05010a]',
      border: 'border-purple-400/80',
      badgeBg: 'bg-purple-400 text-slate-950',
      chipColor: 'from-purple-200 via-fuchsia-400 to-pink-500',
      textAccent: 'text-purple-300',
      foilGleam: 'from-fuchsia-400/30 via-purple-200/10 to-transparent',
    },
  }[selectedTheme];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner Alert / Messages */}
      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center justify-between gap-2 shadow-md">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-400 hover:text-white text-3xs font-mono font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-400/40 text-rose-300 text-xs font-bold flex items-center justify-between gap-2 shadow-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionErrorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionErrorMsg(null)}
            className="text-rose-400 hover:text-white text-3xs font-mono font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Owner Abdul 2015 Special Banner */}
      {isOwnerAbdul && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border-2 border-yellow-400/60 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
              <Crown className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-white font-mono flex items-center gap-1.5">
                <span>Abdul (Owner) Store Pass</span>
                <span className="px-1.5 py-0.2 bg-yellow-400 text-slate-950 text-4xs rounded font-bold">Code 2015</span>
              </p>
              <p className="text-3xs text-yellow-200/80 font-sans">
                You can add balance directly to your card anytime or send quick WhatsApp top-up receipts.
              </p>
            </div>
          </div>
          {!isActive && (
            <button
              onClick={handleOwnerInstantActivate}
              className="px-3 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs shrink-0 shadow-md cursor-pointer transition-all active:scale-95"
            >
              Activate Owner Card
            </button>
          )}
        </div>
      )}

      {/* ===================== PHYSICAL 3D A CARD RENDER ===================== */}
      <div className="flex flex-col items-center">
        <div className="w-full max-w-[420px] perspective-1000">
          <div
            className={`w-full aspect-[1.586/1] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border-2 transition-all duration-500 shadow-2xl relative overflow-hidden select-none cursor-pointer group ${
              themeStyles.cardBg
            } ${themeStyles.border} ${isFlipped ? 'rotate-y-180' : ''}`}
            onClick={() => {
              sound.playPop();
              setIsFlipped(!isFlipped);
            }}
            title="Click to flip card"
          >
            {/* Holographic foil sweep */}
            <div
              className={`absolute -inset-full bg-gradient-to-tr ${themeStyles.foilGleam} transform rotate-45 pointer-events-none group-hover:translate-x-full transition-transform duration-1000`}
            />

            {!isFlipped ? (
              /* CARD FRONT */
              <div className="h-full flex flex-col justify-between relative z-10">
                {/* Top Row: Logo & Status Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 font-black text-lg shadow-md border border-yellow-200">
                      A
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-white tracking-widest uppercase font-mono flex items-center gap-1.5">
                        <span>A CARD</span>
                        <span
                          className={`text-4xs px-1.5 py-0.2 rounded-full font-black uppercase ${
                            isActive
                              ? 'bg-emerald-400 text-slate-950'
                              : isPendingOrder
                              ? 'bg-amber-400 text-slate-950 animate-pulse'
                              : 'bg-yellow-400 text-slate-950'
                          }`}
                        >
                          {isActive ? '● WORKING' : isPendingOrder ? '⏳ SEND TO ABDUL' : '1.00 AED PASS'}
                        </span>
                      </div>
                      <div className="text-4xs text-yellow-300/70 font-mono tracking-wider">
                        OFFICIAL STORE CARD
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full border border-yellow-400/40 flex items-center justify-center text-yellow-300/80 text-3xs font-mono font-bold rotate-90">
                      )))
                    </div>
                    <span className="text-4xs font-mono font-bold px-2 py-0.5 rounded-full bg-black/60 text-yellow-300 border border-yellow-500/30 uppercase">
                      {selectedTheme}
                    </span>
                  </div>
                </div>

                {/* Middle: EMV Chip & Live Balance Display */}
                <div className="flex items-center justify-between my-auto py-1">
                  <div className="w-11 h-8 rounded-lg bg-gradient-to-br from-yellow-200 via-amber-400 to-yellow-600 border border-yellow-200/80 shadow-md flex items-center justify-center p-1 relative overflow-hidden">
                    <div className="w-full h-full border border-amber-900/40 rounded flex flex-col justify-between py-0.5 px-1">
                      <div className="w-full h-[1px] bg-amber-950/40" />
                      <div className="w-full h-[1px] bg-amber-950/40" />
                      <div className="w-full h-[1px] bg-amber-950/40" />
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-4xs uppercase tracking-widest text-yellow-400/80 font-mono font-black">
                      Card Balance (Max 10k)
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight drop-shadow-md flex items-baseline justify-end gap-1">
                      <span className="text-yellow-300">{isActive ? balance.toFixed(2) : '0.00'}</span>
                      <span className="text-xs text-yellow-400 font-bold">AED</span>
                    </div>
                  </div>
                </div>

                {/* Bottom: Card Number, Name, Expiry */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base font-black font-mono tracking-widest text-yellow-200 drop-shadow-md">
                      {aCard ? aCard.cardNumber : '•••• •••• •••• ••••'}
                    </span>
                    {aCard && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCardNumber();
                        }}
                        className="p-1 text-yellow-300 hover:text-white bg-black/40 hover:bg-black/60 rounded-md border border-yellow-500/30 transition-all text-3xs flex items-center gap-1 cursor-pointer"
                        title="Copy Card Number"
                      >
                        {copiedNum ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span className="text-4xs font-mono">{copiedNum ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-end justify-between text-4xs font-mono font-bold text-yellow-300/80">
                    <div>
                      <div className="uppercase text-yellow-400/60 tracking-wider">Cardholder</div>
                      <div className="text-xs font-black text-white uppercase truncate max-w-[170px] sm:max-w-[200px]">
                        {activeAccount.name}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="uppercase text-yellow-400/60 tracking-wider">Expires</div>
                      <div className="text-xs font-black text-white font-mono">
                        {aCard ? aCard.expiryDate : '08/30'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* CARD BACK */
              <div className="h-full flex flex-col justify-between relative z-10 rotate-y-180">
                <div className="-mx-5 sm:-mx-6 h-9 bg-black border-y border-yellow-500/20 flex items-center px-4">
                  <div className="w-full h-2 bg-neutral-800/80" />
                </div>

                <div className="space-y-1 my-auto">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 h-7 bg-yellow-100 rounded flex items-center px-3 text-slate-900 font-mono text-3xs italic font-bold">
                      {activeAccount.name} • VIP STORE SIGNATURE
                    </div>
                    <div className="px-2.5 py-1 bg-black/80 border border-yellow-500/40 rounded text-yellow-300 font-mono text-xs font-black">
                      CVV {aCard ? aCard.cvv : '•••'}
                    </div>
                  </div>
                  <div className="text-4xs text-yellow-300/60 font-mono">
                    Security Code • Keep confidential
                  </div>
                </div>

                <div className="flex items-end justify-between gap-3 text-4xs text-yellow-300/70 font-mono">
                  <div className="space-y-0.5">
                    <div className="font-bold text-white">Official Abdul Deals A Card</div>
                    <div>Max balance 10,000.00 AED • Cost 1.00 AED</div>
                    <div className="text-yellow-400/60">Non-transferable • Accepted across all store deals</div>
                  </div>

                  <div className="text-right font-mono text-xs tracking-widest text-yellow-400">
                    |||||| | |||| || |||
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Flip Hint */}
          <div className="flex items-center justify-between text-3xs font-mono text-yellow-300/70 mt-2 px-2">
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                setIsFlipped(!isFlipped);
              }}
              className="hover:text-yellow-200 flex items-center gap-1 cursor-pointer font-bold"
            >
              <RotateCw className="w-3 h-3 text-yellow-400" />
              <span>{isFlipped ? 'View Front Side' : 'Click Card to Flip & View CVV / Back'}</span>
            </button>
            <span>Limit: 10,000 AED</span>
          </div>
        </div>
      </div>

      {/* ===================== STEP 1: NOT ORDERED YET (SUBMIT ORDER FOR 1.00 AED) ===================== */}
      {!aCard && !isOwnerAbdul && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-[#1a1306] to-yellow-500/15 border-2 border-yellow-400/60 shadow-xl space-y-4 text-center vip-gold-bevel">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-300 to-amber-500 text-slate-950 flex items-center justify-center text-2xl font-black mx-auto shadow-lg">
            💳
          </div>

          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-white">
              Order Your Official A Card (1.00 AED)
            </h3>
            <p className="text-xs text-yellow-200/80 max-w-md mx-auto">
              Submit your order for <strong>1.00 Dirham (1.00 AED)</strong> and send it to Abdul. Once submitted and sent to Abdul, your card <strong>starts working</strong> with a randomized 16-digit card number and allows you to deposit up to <strong>10,000.00 AED</strong>!
            </p>
          </div>

          {/* Process Flow Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-left text-3xs font-mono">
            <div className="p-3 rounded-xl bg-black/60 border border-yellow-500/30 space-y-1">
              <div className="flex items-center gap-1.5 text-yellow-300 font-black">
                <span className="w-5 h-5 rounded-full bg-yellow-400 text-slate-950 flex items-center justify-center text-xs font-black">1</span>
                <span>Submit 1.00 AED Order</span>
              </div>
              <p className="text-yellow-200/70 text-4xs">
                Creates the official A Card pass order on your account.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-black/60 border border-yellow-500/30 space-y-1">
              <div className="flex items-center gap-1.5 text-yellow-300 font-black">
                <span className="w-5 h-5 rounded-full bg-yellow-400 text-slate-950 flex items-center justify-center text-xs font-black">2</span>
                <span>Send to Abdul</span>
              </div>
              <p className="text-yellow-200/70 text-4xs">
                Send order details to Abdul via WhatsApp or Direct Call.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-black/60 border border-yellow-500/30 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-300 font-black">
                <span className="w-5 h-5 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center text-xs font-black">3</span>
                <span>Card Starts Working</span>
              </div>
              <p className="text-emerald-200/70 text-4xs">
                Card unlocks with 0.00 balance. Store up to 10,000 AED!
              </p>
            </div>
          </div>

          {/* Theme Selector */}
          <div className="space-y-1.5 text-left">
            <label className="text-3xs font-mono font-bold text-yellow-300/80 uppercase">
              Choose Card Theme:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['gold', 'obsidian', 'emerald', 'cyber'] as const).map((thm) => (
                <button
                  key={thm}
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setSelectedTheme(thm);
                  }}
                  className={`py-1.5 px-2 rounded-xl text-3xs font-mono font-black capitalize border transition-all cursor-pointer ${
                    selectedTheme === thm
                      ? 'bg-yellow-400 text-slate-950 border-yellow-200 shadow-md'
                      : 'bg-black/40 text-yellow-300 border-yellow-500/20 hover:border-yellow-500/40'
                  }`}
                >
                  {thm}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Order Button */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleSubmitOrderToAbdul}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-yellow-400 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-yellow-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 vip-gold-bevel"
          >
            <CreditCard className="w-4 h-4 text-slate-950" />
            <span>Submit Order (1.00 AED) & Send to Abdul →</span>
          </button>
        </div>
      )}

      {/* ===================== STEP 2: ORDER SUBMITTED / PENDING SEND TO ABDUL ===================== */}
      {isPendingOrder && aCard && !isOwnerAbdul && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#2a1704] via-[#1c1003] to-[#100902] border-2 border-amber-400 shadow-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center text-2xl font-black shrink-0 animate-bounce shadow-md">
              ⏳
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>Order #{aCard.orderId || 'PENDING'} Submitted!</span>
                <span className="text-4xs px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono font-black uppercase">
                  Pending Send
                </span>
              </h3>
              <p className="text-xs text-yellow-200/90 font-medium">
                Send this 1.00 AED order to Abdul now to activate your card so it starts working.
              </p>
            </div>
          </div>

          {/* Order Details Receipt Box */}
          <div className="p-3.5 rounded-xl bg-black/60 border border-yellow-500/30 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-yellow-200/80 border-b border-yellow-500/20 pb-2">
              <span>Item:</span>
              <span className="text-white font-black">💳 Official A Card Store Pass</span>
            </div>
            <div className="flex justify-between text-yellow-200/80 border-b border-yellow-500/20 pb-2">
              <span>Order Total:</span>
              <span className="text-yellow-300 font-black">1.00 AED (Cash in Hand to Abdul)</span>
            </div>
            <div className="flex justify-between text-yellow-200/80 border-b border-yellow-500/20 pb-2">
              <span>Cardholder Account:</span>
              <span className="text-white font-black">{activeAccount.name} ({activeAccount.code})</span>
            </div>
            <div className="flex justify-between text-yellow-200/80">
              <span>Generated Card Number:</span>
              <span className="text-yellow-400 font-black">{aCard.cardNumber}</span>
            </div>
          </div>

          {/* Send To Abdul Action Buttons */}
          <div className="space-y-2.5">
            <label className="text-3xs font-mono font-bold text-yellow-300/80 uppercase">
              Send Order to Abdul:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sound.playPop()}
                className="py-3 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer font-mono"
              >
                <Send className="w-4 h-4 text-slate-950" />
                <span>Send via WhatsApp (+971 50 492 8847)</span>
              </a>

              <a
                href={`tel:${ABDUL_CONTACT.phoneRaw}`}
                onClick={() => sound.playPop()}
                className="py-3 px-3 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer font-mono vip-gold-bevel"
              >
                <PhoneCall className="w-4 h-4 text-slate-950" />
                <span>Call Abdul ({ABDUL_CONTACT.phoneDisplay})</span>
              </a>
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirmSentAndActivate}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-sm rounded-xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <Check className="w-5 h-5 text-slate-950" />
              <span>I Have Sent the Order to Abdul — Start Card Working Now! 🚀</span>
            </button>
          </div>
        </div>
      )}

      {/* ===================== STEP 3: CARD IS ACTIVE & WORKING (TOP-UP & STORE UP TO 10,000 AED) ===================== */}
      {(isActive || isOwnerAbdul) && (
        <div className="space-y-4">
          {/* Working Status Callout */}
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/50 flex items-center justify-between text-xs shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="font-black text-emerald-300">
                A Card Active & Working {aCard?.orderId ? `(Order #${aCard.orderId})` : '(Store Owner Pass)'}
              </span>
            </div>
            <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300">
              Verified by Abdul
            </span>
          </div>

          {/* Card Capacity Meter */}
          <div className="p-4 rounded-2xl bg-[#140e05] border border-yellow-500/30 space-y-2 shadow-md">
            <div className="flex items-center justify-between text-3xs font-mono font-bold text-yellow-300/80">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-yellow-400" />
                <span>A Card Balance & Capacity Status</span>
              </span>
              <span className="text-white font-black">
                {balance.toFixed(2)} / {MAX_A_CARD_BALANCE_AED.toLocaleString()} AED ({percentCapacity}%)
              </span>
            </div>

            {/* Capacity Bar */}
            <div className="w-full h-3 rounded-full bg-black/70 border border-yellow-500/30 overflow-hidden relative p-0.5">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300 transition-all duration-500 rounded-full shadow-sm"
                style={{ width: `${percentCapacity}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-4xs font-mono text-yellow-400/70">
              <span className="font-black text-yellow-300">Current Balance: {balance.toFixed(2)} AED</span>
              <span>Available Capacity: {remainingRoom.toFixed(2)} AED</span>
            </div>
          </div>

          {/* INPUT MONEY / TOP UP SECTION */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#181106] to-[#0e0a03] border-2 border-yellow-500/40 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-black text-yellow-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span>Add Balance To A-Card</span>
              </h4>
              <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-400/30">
                Max 10,000 AED
              </span>
            </div>

            {/* Choose Target Account Selector (Especially helpful for Abdul owner / multi-account topups) */}
            <div className="space-y-1.5 p-3 rounded-xl bg-black/50 border border-yellow-500/25">
              <label className="text-3xs font-mono font-bold text-yellow-300 uppercase flex items-center justify-between">
                <span>Select Account to Top-Up:</span>
                <span className="text-4xs text-yellow-400/70 font-normal">
                  Target: <strong className="text-yellow-300">{targetAccount?.name}</strong> ({targetAccount?.code})
                </span>
              </label>
              <select
                value={targetAccountCode}
                onChange={(e) => {
                  setTargetAccountCode(e.target.value);
                  setCreatedTopUpBill(null);
                }}
                className="w-full px-3 py-2 bg-[#120d06] border border-yellow-500/40 text-yellow-200 text-xs font-mono font-bold rounded-lg focus:outline-hidden"
              >
                {allAccounts.map((acc) => (
                  <option key={acc.code} value={acc.code} className="bg-slate-900 text-white">
                    {acc.name} (Code: {acc.code}) • A-Card: {acc.aCard ? `${acc.aCard.balanceAed.toFixed(2)} AED (${acc.aCard.status})` : 'No Card'}
                  </option>
                ))}
              </select>
            </div>

            {/* Top-up Bill Created Alert */}
            {createdTopUpBill && (
              <div className="p-3.5 rounded-xl bg-amber-500/15 border-2 border-amber-400/60 text-amber-200 space-y-1.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-xs text-amber-300 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Store Bill Generated #{createdTopUpBill.id}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-4xs uppercase">
                    Pending Abdul Approval
                  </span>
                </div>
                <p className="text-3xs text-yellow-100/80 font-mono">
                  This top-up is now an official store bill for <strong>+{createdTopUpBill.finalTotalAed.toFixed(2)} AED</strong> for <strong>{createdTopUpBill.accountName}</strong>. Send to Abdul on WhatsApp to finalize payment!
                </p>
              </div>
            )}

            {/* Amount Input */}
            <div className="space-y-1.5">
              <label className="text-3xs font-mono font-bold text-yellow-300/80 uppercase">
                Enter Amount to Add (AED):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max={remainingRoom}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder={`Enter amount (Max remaining: ${remainingRoom.toFixed(2)} AED)`}
                  className="w-full px-4 py-3 bg-black/70 border-2 border-yellow-500/40 focus:border-yellow-300 text-white rounded-xl text-sm font-mono font-bold placeholder:text-yellow-500/30 focus:outline-hidden"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-yellow-400 font-mono">
                  AED
                </div>
              </div>
            </div>

            {/* Quick Preset Buttons (+1, +5, +10, +15, +20, +25, +30, +50, +100, etc.) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-3xs font-mono font-bold text-yellow-300/90 uppercase">
                  Quick Add Balance (+ AED):
                </span>
                <span className="text-4xs font-mono text-yellow-400/60">
                  Tap to add directly or send to Abdul
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {quickIncrements.map((amt) => {
                  const isDisabled = amt > remainingRoom;
                  return (
                    <button
                      key={amt}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleDeposit(amt)}
                      className={`py-2 px-1 rounded-xl text-3xs font-mono font-black border transition-all cursor-pointer ${
                        isDisabled
                          ? 'bg-black/20 text-yellow-500/30 border-yellow-500/10 cursor-not-allowed'
                          : 'bg-yellow-500/15 hover:bg-yellow-500/30 text-yellow-200 border-yellow-400/40 hover:scale-105 active:scale-95 shadow-sm'
                      }`}
                      title={`Quick add +${amt} AED to A Card`}
                    >
                      +{amt} AED
                    </button>
                  );
                })}

                {/* Fill to Max Button */}
                <button
                  type="button"
                  disabled={remainingRoom <= 0}
                  onClick={() => handleDeposit(remainingRoom)}
                  className={`py-2 px-1 rounded-xl text-3xs font-mono font-black border transition-all cursor-pointer ${
                    remainingRoom <= 0
                      ? 'bg-black/20 text-yellow-500/30 border-yellow-500/10 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 border-yellow-200 hover:scale-105 active:scale-95 vip-gold-bevel shadow-sm'
                  }`}
                  title="Fill remaining balance up to 10,000 AED"
                >
                  Max (10k)
                </button>
              </div>
            </div>

            {/* Action Buttons: Direct Add, Official Bill, & WhatsApp Send to Abdul */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                disabled={isProcessing || !depositAmount || parseFloat(depositAmount) <= 0}
                onClick={() => handleDeposit()}
                className="w-full py-3 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-slate-950" />
                <span>Direct Top-Up</span>
              </button>

              <button
                type="button"
                disabled={isProcessing || !depositAmount || parseFloat(depositAmount) <= 0}
                onClick={() => handleCreateTopUpBill()}
                className="w-full py-3 px-3 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5 font-mono"
              >
                <Receipt className="w-3.5 h-3.5 text-slate-950" />
                <span>Create Store Bill</span>
              </button>

              <a
                href={getWhatsAppTopUpLink(parseFloat(depositAmount) || 50)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sound.playPop()}
                className="w-full py-3 px-3 bg-emerald-600/90 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5 font-mono"
              >
                <Send className="w-3.5 h-3.5 text-white" />
                <span>Send to Abdul</span>
              </a>
            </div>
          </div>

          {/* TRANSACTION HISTORY */}
          <div className="p-4 rounded-2xl bg-[#140e05] border border-yellow-500/30 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-yellow-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-yellow-400" />
                <span>A Card Transaction Ledger</span>
              </h4>
              <span className="text-3xs text-yellow-400/70 font-mono">
                {aCard?.transactions?.length || 0} Transactions
              </span>
            </div>

            {(!aCard?.transactions || aCard.transactions.length === 0) ? (
              <div className="p-4 rounded-xl bg-black/40 text-center text-3xs font-mono text-yellow-300/60">
                No transactions recorded yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {aCard.transactions.map((tx) => {
                  const isDeposit = tx.type === 'deposit';
                  const isPayment = tx.type === 'payment';

                  return (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-xl bg-black/50 border border-yellow-500/20 flex items-center justify-between gap-2 text-3xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-black shrink-0 ${
                            isDeposit
                              ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                              : isPayment
                              ? 'bg-rose-400/20 text-rose-300 border border-rose-400/30'
                              : 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
                          }`}
                        >
                          {isDeposit ? '+' : isPayment ? '−' : '💳'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-white truncate">
                            {tx.description}
                          </div>
                          <div className="text-4xs font-mono text-yellow-400/60">
                            {new Date(tx.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className={`font-black font-mono ${
                            isDeposit
                              ? 'text-emerald-300'
                              : isPayment
                              ? 'text-rose-300'
                              : 'text-yellow-300'
                          }`}
                        >
                          {isDeposit ? `+${tx.amountAed.toFixed(2)}` : isPayment ? `-${tx.amountAed.toFixed(2)}` : `${tx.amountAed.toFixed(2)}`} AED
                        </div>
                        <div className="text-4xs font-mono text-yellow-200/50">
                          Bal: {tx.balanceAfterAed.toFixed(2)} AED
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
