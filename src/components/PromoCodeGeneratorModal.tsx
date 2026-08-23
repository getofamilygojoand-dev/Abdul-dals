import React, { useState, useEffect } from 'react';
import {
  X,
  Tag,
  Sparkles,
  Copy,
  Check,
  Plus,
  Trash2,
  Lock,
  Crown,
  KeyRound,
  Coins,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Gem,
  Award,
  Zap,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PromoCode } from '../types';
import { UserAccount } from '../utils/userAccounts';
import {
  getStoredPromoCodes,
  createPromoCode,
  deletePromoCode,
  togglePromoCodeActive,
  setPromoCodeStatus,
  resetPromoCodeUsage,
  togglePromoCodeSingleUse,
  generateFriendlyCode,
} from '../utils/promoCodeStorage';
import { sound } from '../utils/audio';

interface PromoCodeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAccount: UserAccount | null;
  onOwnerLoginSuccess?: (account: UserAccount) => void;
}

const PRESET_DIRHAM_AMOUNTS = [1.0, 2.0, 2.5, 5.0, 10.0, 20.0, 50.0];

export const PromoCodeGeneratorModal: React.FC<PromoCodeGeneratorModalProps> = ({
  isOpen,
  onClose,
  activeAccount,
  onOwnerLoginSuccess,
}) => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [codeName, setCodeName] = useState<string>('Rsd0y');
  const [dirhamOff, setDirhamOff] = useState<number>(5.0);
  const [description, setDescription] = useState<string>('');
  const [minSpend, setMinSpend] = useState<number>(0);
  const [isSingleUse, setIsSingleUse] = useState<boolean>(true);
  
  // Auth & Passcode state
  const [ownerPasscodeInput, setOwnerPasscodeInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  const isOwner = activeAccount?.isOwner || activeAccount?.code === '2015';

  useEffect(() => {
    if (isOpen) {
      setPromoCodes(getStoredPromoCodes());
      setCodeName(generateFriendlyCode(5));
      setFormError('');
      setFormSuccess('');
      setAuthError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOwnerPasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ownerPasscodeInput.trim() === '2015') {
      sound.playCashRegister();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#f59e0b', '#d97706', '#ffffff'],
      });
      setAuthError('');
      const ownerAcc: UserAccount = {
        code: '2015',
        name: 'Abdul Owner',
        avatarEmoji: '👑',
        roleTitle: 'Store Owner & Admin',
        isOwner: true,
      };
      if (onOwnerLoginSuccess) {
        onOwnerLoginSuccess(ownerAcc);
      }
    } else {
      sound.playError();
      setAuthError('Incorrect passcode! Store owner access only.');
    }
  };

  const handleGenerateRandomCode = () => {
    sound.playPop();
    const newEasyCode = generateFriendlyCode(dirhamOff);
    setCodeName(newEasyCode);
  };

  const handleCreateCode = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!codeName.trim()) {
      setFormError('Please enter or generate a code name.');
      sound.playError();
      return;
    }

    if (codeName.trim() === '2015') {
      setFormError('Promo code cannot be "2015". Choose a voucher name like Rsd0y.');
      sound.playError();
      return;
    }

    if (!dirhamOff || dirhamOff <= 0) {
      setFormError('Please select or enter how many Dirhams off this code grants.');
      sound.playError();
      return;
    }

    const result = createPromoCode(codeName, dirhamOff, description, minSpend, isSingleUse);
    if (result.success && result.promoCode) {
      sound.playCashRegister();
      confetti({
        particleCount: 45,
        spread: 55,
        origin: { y: 0.65 },
        colors: ['#fbbf24', '#f59e0b', '#10b981'],
      });
      setPromoCodes(getStoredPromoCodes());
      setFormSuccess(`✓ VIP Code "${result.promoCode.code}" Activated: -${result.promoCode.dirhamOff.toFixed(2)} AED (${isSingleUse ? '1-Time Use' : 'Multi-Use'})!`);
      // prepare next easy code
      setCodeName(generateFriendlyCode(dirhamOff));
      setDescription('');
    } else {
      sound.playError();
      setFormError(result.error || 'Failed to create code.');
    }
  };

  const handleCopyCode = (code: string) => {
    sound.playPop();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = (id: string, currentActive: boolean) => {
    sound.playClick();
    const updated = setPromoCodeStatus(id, !currentActive);
    setPromoCodes(updated);
  };

  const handleResetUsage = (id: string) => {
    sound.playCashRegister();
    const updated = resetPromoCodeUsage(id);
    setPromoCodes(updated);
    setFormSuccess('✓ Voucher usage reset to Available (0/1 used)!');
    setTimeout(() => setFormSuccess(''), 2500);
  };

  const handleToggleSingleUse = (id: string) => {
    sound.playClick();
    const updated = togglePromoCodeSingleUse(id);
    setPromoCodes(updated);
  };

  const handleDelete = (id: string) => {
    sound.playClick();
    const updated = deletePromoCode(id);
    setPromoCodes(updated);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/90 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#1c1305] via-[#0f0a02] to-[#050301] border-2 border-yellow-400 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(234,179,8,0.35)] overflow-hidden z-10 text-slate-100 ring-2 ring-yellow-400/40 my-auto">
        
        {/* Top Gold Shimmer Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 animate-pulse" />

        {/* Modal Header: EXTRA VIP ROYAL DESIGN */}
        <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 p-4 sm:p-5 text-slate-950 flex items-center justify-between shadow-xl relative overflow-hidden">
          {/* Subtle VIP background watermark */}
          <div className="absolute -right-6 -bottom-6 text-7xl opacity-15 pointer-events-none select-none">
            👑
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-slate-950 text-yellow-300 flex items-center justify-center text-xl shadow-2xl shrink-0 border-2 border-yellow-300/80 ring-2 ring-yellow-400/40">
              👑
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-3xs font-black uppercase tracking-widest text-slate-950 font-mono bg-yellow-300/60 px-2 py-0.2 rounded-full">
                  ★ ROYAL ABDUL SUITE ★
                </span>
                <span className="bg-slate-950 text-yellow-300 text-3xs font-black px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1 shadow-sm border border-yellow-400/40">
                  <Crown className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  Owner Only
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-black tracking-tight text-slate-950 leading-tight drop-shadow-xs flex items-center gap-1.5 mt-0.5">
                <span>VIP Promo Code & Voucher Vault</span>
                <Gem className="w-4 h-4 text-slate-950 inline" />
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-950/20 hover:bg-slate-950/40 active:scale-95 text-slate-950 flex items-center justify-center transition-all cursor-pointer shadow-inner relative z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <div className="p-4 sm:p-6 max-h-[82vh] overflow-y-auto space-y-5 custom-scrollbar">

          {/* IF NOT LOGGED IN AS ABDUL OWNER (CODE 2015) */}
          {!isOwner ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#1a1205] to-[#0a0702] border-2 border-yellow-500/50 text-center space-y-5 shadow-2xl relative overflow-hidden">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-600 p-0.5 shadow-xl shadow-amber-950/80 flex items-center justify-center">
                <div className="w-full h-full bg-[#120c03] rounded-[22px] flex items-center justify-center">
                  <Lock className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
              
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-lg font-black text-white flex items-center justify-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span>Owner Passcode Required</span>
                </h3>
                <p className="text-xs text-yellow-200/80 leading-relaxed font-medium">
                  This Royal Discount Machine is reserved strictly for <strong>Abdul Store Owner</strong> to manage voucher availability and discount codes.
                </p>
              </div>

              <form onSubmit={handleOwnerPasscodeSubmit} className="max-w-xs mx-auto space-y-3 pt-2">
                <div>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={10}
                    value={ownerPasscodeInput}
                    onChange={(e) => setOwnerPasscodeInput(e.target.value)}
                    placeholder="Enter Passcode"
                    className="w-full bg-[#160f04] border-2 border-yellow-500/60 focus:border-yellow-300 rounded-2xl px-4 py-3.5 text-center text-xl font-mono tracking-widest text-yellow-300 placeholder-yellow-600/40 focus:outline-none shadow-inner"
                  />
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-3xs flex items-center gap-2 text-left font-mono">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 px-5 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-300 text-slate-950 transition-all cursor-pointer shadow-xl shadow-yellow-950/60 active:scale-98 flex items-center justify-center gap-2 border border-yellow-200"
                >
                  <KeyRound className="w-4 h-4 text-slate-950" />
                  <span>Unlock VIP Generator</span>
                </button>
              </form>
            </div>
          ) : (
            /* OWNER AUTHORIZED: ROYAL EXTRA VIP DESIGN */
            <div className="space-y-6">
              
              {/* VIP Golden Ticket Creator Card */}
              <form onSubmit={handleCreateCode} className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#1d1406] via-[#120b02] to-[#0a0601] border-2 border-yellow-400/80 space-y-4 shadow-2xl shadow-yellow-950/60 relative overflow-hidden">
                
                <div className="flex items-center justify-between border-b border-yellow-500/25 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-sm text-yellow-300">
                      🎟️
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <span>VIP Dirham-Off Generator</span>
                        <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                      </h3>
                      <p className="text-3xs text-yellow-300/70 font-mono">
                        Instant 1-Time Dirhams Off codes valid at checkout
                      </p>
                    </div>
                  </div>
                  <span className="text-3xs font-mono font-black bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                    <Crown className="w-3 h-3 text-slate-950 fill-slate-950" />
                    <span>ROYAL OWNER</span>
                  </span>
                </div>

                {/* 1. Code Name & Random Easy Generator */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-3xs font-black uppercase tracking-wider text-yellow-300 font-mono flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-yellow-400" />
                      <span>Code Voucher Name:</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateRandomCode}
                      className="text-3xs text-yellow-300 hover:text-white font-mono font-black flex items-center gap-1.5 cursor-pointer bg-gradient-to-r from-yellow-500/20 to-amber-500/20 hover:from-yellow-500/30 hover:to-amber-500/30 border border-yellow-400/50 px-2.5 py-1 rounded-xl transition-all shadow-xs"
                    >
                      <RefreshCw className="w-3 h-3 text-yellow-400" />
                      <span>Roll Short Code</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={codeName}
                      onChange={(e) => setCodeName(e.target.value)}
                      placeholder="Voucher Code Name"
                      maxLength={14}
                      className="w-full bg-black/90 border-2 border-yellow-400/60 focus:border-yellow-300 rounded-2xl px-4 py-3 text-base sm:text-lg font-mono font-black text-yellow-300 tracking-widest focus:outline-none uppercase shadow-inner"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-yellow-500/20 border border-yellow-400/30 px-2 py-0.5 rounded-lg text-3xs font-mono font-bold text-yellow-300">
                      <span>UNIQUE</span>
                    </div>
                  </div>
                </div>

                {/* 2. Dirham Off Amount Selection */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-3xs font-black uppercase tracking-wider text-yellow-300 font-mono flex items-center gap-1.5">
                      <Coins className="w-3 h-3 text-yellow-400" />
                      <span>Dirham Discount (AED Off):</span>
                    </label>
                    <span className="text-sm font-black font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                      -{dirhamOff.toFixed(2)} AED
                    </span>
                  </div>

                  {/* VIP Preset Amount Chips */}
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {PRESET_DIRHAM_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setDirhamOff(amt);
                        }}
                        className={`py-2 px-1 rounded-xl text-xs font-mono font-black border transition-all cursor-pointer text-center ${
                          dirhamOff === amt
                            ? 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 border-yellow-200 shadow-lg shadow-amber-950/80 scale-105'
                            : 'bg-black/60 border-yellow-500/30 text-yellow-200/80 hover:border-yellow-400 hover:text-white'
                        }`}
                      >
                        {amt.toFixed(amt % 1 === 0 ? 0 : 2)} AED
                      </button>
                    ))}
                  </div>

                  {/* Custom Dirham Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-3xs text-yellow-400/80 font-mono uppercase font-bold shrink-0">
                      Or Exact Dirhams:
                    </span>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={dirhamOff}
                      onChange={(e) => setDirhamOff(Math.max(0.5, Number(e.target.value)))}
                      className="w-28 bg-black/90 border border-yellow-400/50 rounded-xl px-3 py-1.5 text-xs font-mono font-black text-emerald-300 focus:outline-none focus:border-yellow-300"
                    />
                    <span className="text-xs text-yellow-300 font-mono font-bold">AED OFF</span>
                  </div>
                </div>

                {/* 3. 1-Time Use Setting & Minimum Cart Spend */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Single-Use 1-Time Toggle */}
                  <div className="p-3 bg-black/70 border border-yellow-500/40 rounded-2xl flex items-center justify-between gap-2">
                    <div>
                      <div className="text-3xs font-black uppercase tracking-wider text-yellow-300 font-mono">
                        Usage Rule:
                      </div>
                      <div className="text-xs font-bold text-white">
                        {isSingleUse ? '1-Time Use Only' : 'Multiple Uses Allowed'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSingleUse(!isSingleUse)}
                      className={`px-3 py-1.5 rounded-xl text-3xs font-mono font-black border transition-all cursor-pointer ${
                        isSingleUse
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {isSingleUse ? '1-Time (Active)' : 'Multi-Use'}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-3xs font-black uppercase tracking-wider text-yellow-300/80 font-mono">
                      Minimum Cart Spend (Optional):
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={minSpend}
                        onChange={(e) => setMinSpend(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-black/80 border border-yellow-500/40 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-yellow-300"
                      />
                      <span className="text-3xs text-yellow-300 font-mono font-bold shrink-0">AED min</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-3xs font-black uppercase tracking-wider text-yellow-300/80 font-mono">
                    Description Note (Optional):
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. VIP Special Reward Voucher"
                    className="w-full bg-black/80 border border-yellow-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-300"
                  />
                </div>

                {/* Feedback Alerts */}
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-3xs flex items-center gap-2 font-mono">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {formSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-3xs flex items-center gap-2 font-mono">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                {/* Submit Create Button */}
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-300 text-slate-950 transition-all cursor-pointer shadow-xl shadow-yellow-950/80 active:scale-98 flex items-center justify-center gap-2 border-2 border-yellow-200"
                >
                  <Crown className="w-4 h-4 text-slate-950 fill-slate-950" />
                  <span>Activate Voucher ({codeName} • -{dirhamOff.toFixed(2)} AED)</span>
                </button>
              </form>

              {/* Active & Stored Codes Manager (Available vs Expired / Used) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                      Voucher Vault Controls ({promoCodes.length})
                    </h3>
                  </div>
                  <span className="text-3xs text-yellow-400/80 font-mono">
                    Make Available / Expired or Reset 1-Time Use
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {promoCodes.map((promo) => {
                    const isCopied = copiedCode === promo.code;
                    const isUsedUp = promo.isUsed || (promo.isSingleUse && (promo.usageCount || 0) >= (promo.maxUses || 1));
                    const isAvailable = promo.isActive && !isUsedUp;

                    return (
                      <div
                        key={promo.id}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isAvailable
                            ? 'bg-gradient-to-r from-[#1e1406] via-[#140e04] to-[#0e0902] border-yellow-500/50 hover:border-yellow-400 shadow-md'
                            : 'bg-black/60 border-slate-800 opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Ticket icon */}
                          <div className={`w-11 h-11 rounded-2xl border flex flex-col items-center justify-center shrink-0 shadow-inner ${
                            isAvailable
                              ? 'bg-gradient-to-br from-amber-500/25 to-yellow-500/10 border-yellow-400/50 text-yellow-300'
                              : 'bg-slate-900 border-slate-700 text-slate-500'
                          }`}>
                            <span className="text-sm">🎟️</span>
                            <span className="text-3xs font-mono font-black leading-none mt-0.5">AED</span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-base text-yellow-300 tracking-wider bg-black/80 px-2.5 py-0.5 rounded-lg border border-yellow-500/40">
                                {promo.code}
                              </span>
                              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black font-mono px-2 py-0.5 rounded-full">
                                -{promo.dirhamOff.toFixed(2)} AED
                              </span>
                              
                              {/* Status Badges */}
                              {isAvailable ? (
                                <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/60 text-3xs font-mono font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Available
                                </span>
                              ) : isUsedUp ? (
                                <span className="bg-rose-950/80 text-rose-300 border border-rose-500/60 text-3xs font-mono font-black px-2 py-0.5 rounded-full">
                                  Used (1x Done)
                                </span>
                              ) : (
                                <span className="bg-amber-950/80 text-amber-300 border border-amber-500/60 text-3xs font-mono font-black px-2 py-0.5 rounded-full">
                                  Expired / Paused
                                </span>
                              )}

                              {/* Single-Use Badge */}
                              <span className="bg-yellow-500/10 text-yellow-300 border border-yellow-500/25 text-3xs font-mono px-1.5 py-0.2 rounded">
                                {promo.isSingleUse ? '1-Time Only' : 'Multi-Use'}
                              </span>
                            </div>

                            <p className="text-3xs text-yellow-100/80 truncate mt-1">
                              {promo.description} {promo.minSpendAed ? `• Min spend: ${promo.minSpendAed} AED` : ''}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
                          {/* Copy Code */}
                          <button
                            type="button"
                            onClick={() => handleCopyCode(promo.code)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                              isCopied
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-md'
                                : 'bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-200 border-yellow-400/40'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-yellow-300" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          {/* Reset / Make Available Button */}
                          {isUsedUp ? (
                            <button
                              type="button"
                              onClick={() => handleResetUsage(promo.id)}
                              className="px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded-xl text-3xs font-mono font-bold cursor-pointer transition-colors border border-emerald-500/40 flex items-center gap-1"
                              title="Reset single-use so it can be redeemed again"
                            >
                              <RotateCcw className="w-3 h-3 text-emerald-400" />
                              <span>Make Available</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(promo.id, promo.isActive)}
                              className={`px-2.5 py-1.5 rounded-xl text-3xs font-mono font-bold cursor-pointer transition-colors border flex items-center gap-1 ${
                                promo.isActive
                                  ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border-rose-500/40'
                                  : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border-emerald-500/40'
                              }`}
                              title={promo.isActive ? 'Mark Expired' : 'Mark Available'}
                            >
                              {promo.isActive ? (
                                <>
                                  <EyeOff className="w-3 h-3 text-rose-400" />
                                  <span>Make Expired</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3 text-emerald-400" />
                                  <span>Make Available</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(promo.id)}
                            className="p-2 text-rose-400/70 hover:text-rose-300 rounded-xl hover:bg-rose-500/20 transition-colors cursor-pointer border border-rose-500/20"
                            title="Delete code"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
