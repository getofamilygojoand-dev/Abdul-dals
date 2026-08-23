import React, { useState } from 'react';
import { 
  Crown, 
  Sparkles, 
  ShieldCheck, 
  PhoneCall, 
  Flame, 
  Zap, 
  Coins, 
  Star,
  Award,
  ChevronRight,
  Gem,
  CheckCircle2
} from 'lucide-react';
import { ABDUL_CONTACT } from '../data/dealsData';
import { sound } from '../utils/audio';

export type VipTier = 'gold' | 'diamond' | 'royal';

interface VipCardLoungeProps {
  onOpenDiscountModal: () => void;
  onOpenCart: () => void;
}

export const VipCardLounge: React.FC<VipCardLoungeProps> = ({
  onOpenDiscountModal,
  onOpenCart,
}) => {
  const [activeTier, setActiveTier] = useState<VipTier>('royal');
  const [memberName, setMemberName] = useState('VIP High-Roller');
  const [isEditingName, setIsEditingName] = useState(false);
  const [claimedBonus, setClaimedBonus] = useState(false);

  const handleTierChange = (tier: VipTier) => {
    sound.playVipFanfare();
    setActiveTier(tier);
  };

  const handleClaimBonus = () => {
    sound.playCashRegister();
    setClaimedBonus(true);
    setTimeout(() => setClaimedBonus(false), 3000);
  };

  const tierDetails = {
    gold: {
      name: '24K Gold VIP',
      color: 'from-amber-400 via-yellow-500 to-amber-600',
      textColor: 'text-amber-300',
      badge: 'Gold Level 1',
      perk: 'Direct Hotline + Off-Money Haggling',
      seal: '👑 24K GOLD',
      cardId: 'AD-24K-7701-DXB',
    },
    diamond: {
      name: 'Diamond Sovereign',
      color: 'from-cyan-300 via-blue-400 to-indigo-500',
      textColor: 'text-cyan-300',
      badge: 'Diamond Level 2',
      perk: 'Priority Bed Care & Free Lemonade upgrades',
      seal: '💎 DIAMOND',
      cardId: 'AD-DIA-9942-DXB',
    },
    royal: {
      name: 'Royal Sovereign 24K',
      color: 'from-yellow-200 via-amber-300 to-yellow-600',
      textColor: 'text-yellow-300',
      badge: 'Royal Founder Tier',
      perk: 'Unlimited Haggling + 2-Day Grace + 1T Minecraft Access',
      seal: '👑 ROYAL VIP',
      cardId: 'AD-ROYAL-8888-DUBAI',
    },
  }[activeTier];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1b1407] via-[#100c04] to-[#080602] border-2 border-yellow-400/50 p-5 sm:p-7 shadow-2xl mb-8 ring-1 ring-yellow-400/20">
      
      {/* Decorative Gold Sheen & Radial Background */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-400/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>

      <div className="relative z-10">
        
        {/* Header & Tier Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-yellow-500/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 text-3xs font-black uppercase tracking-wider vip-gold-bevel shadow-md">
                <Crown className="w-3 h-3 text-slate-950 fill-slate-950" />
                VIP 24K LOUNGE & PASS
              </span>
              <span className="text-3xs font-black uppercase tracking-wider text-yellow-400/80 font-mono">
                Official Dubai Status
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
              <span>Abdul Deals</span>
              <span className="animate-gold-shimmer font-black">Elite VIP Membership</span>
            </h2>
          </div>

          {/* Tier Selector Buttons */}
          <div className="flex items-center gap-1.5 bg-black/80 p-1 rounded-2xl border border-yellow-500/40 shrink-0">
            {(['gold', 'diamond', 'royal'] as VipTier[]).map((t) => (
              <button
                key={t}
                onClick={() => handleTierChange(t)}
                className={`px-3 py-1.5 rounded-xl text-3xs font-black uppercase tracking-wider transition-all cursor-pointer select-none active:scale-95 ${
                  activeTier === t
                    ? 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 shadow-md scale-105 vip-gold-bevel'
                    : 'text-yellow-300/70 hover:text-yellow-200 hover:bg-yellow-400/10'
                }`}
              >
                {t === 'gold' && '24K Gold'}
                {t === 'diamond' && 'Diamond'}
                {t === 'royal' && '👑 Royal 24K'}
              </button>
            ))}
          </div>
        </div>

        {/* Main Card & Perks Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-center">
          
          {/* Left: 3D-styled 24K VIP Metal Membership Card */}
          <div className="lg:col-span-6">
            <div className="relative group perspective-1000">
              <div className="relative rounded-2xl sm:rounded-3xl p-6 bg-gradient-to-br from-[#281e0a] via-[#1a1306] to-[#0c0903] border-2 border-yellow-400/70 shadow-2xl overflow-hidden ring-1 ring-yellow-300/30 transition-transform duration-300 group-hover:scale-[1.02] vip-card-glow">
                
                {/* Holographic foil watermark */}
                <div className="absolute -right-8 -top-8 w-44 h-44 bg-gradient-to-br from-yellow-400/20 via-amber-500/10 to-transparent rounded-full blur-xl pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 opacity-10 text-9xl font-black text-yellow-300 select-none pointer-events-none font-mono">
                  24K
                </div>

                {/* Card Top Row: Brand & Chip */}
                <div className="flex items-center justify-between relative z-10 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 p-0.5 shadow-md flex items-center justify-center vip-gold-bevel">
                      <Crown className="w-5 h-5 text-slate-950 fill-slate-950" />
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider text-yellow-300 font-mono">
                        ABDUL DEALS VIP
                      </div>
                      <div className="text-3xs text-yellow-400/80 font-bold">
                        24K Dubai Concierge
                      </div>
                    </div>
                  </div>

                  {/* Smart Metallic EMV Chip graphic */}
                  <div className="w-11 h-8 rounded-lg bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 border border-yellow-600/80 shadow-md flex flex-col justify-around p-1">
                    <div className="w-full h-0.5 bg-amber-700/60 rounded"></div>
                    <div className="w-full h-0.5 bg-amber-700/60 rounded"></div>
                    <div className="w-full h-0.5 bg-amber-700/60 rounded"></div>
                  </div>
                </div>

                {/* Card Middle: Member ID & Tier */}
                <div className="relative z-10 space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-3xs uppercase font-extrabold tracking-widest text-yellow-400/70 font-mono">
                      VIP PASS NUMBER
                    </span>
                    <span className="text-3xs font-black uppercase px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-300 border border-yellow-400/40">
                      {tierDetails.badge}
                    </span>
                  </div>

                  <div className="font-mono text-lg sm:text-xl font-black text-yellow-200 tracking-widest drop-shadow-md">
                    {tierDetails.cardId}
                  </div>

                  {/* 4 Required Store Emojis on Card */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-lg border border-yellow-500/30 text-sm">
                      <span title="Clean">✨</span>
                      <span title="Minecraft Pickaxe">⛏️</span>
                      <span title="Room Bed">🛏️</span>
                      <span title="Gun AK47">🔫</span>
                    </div>
                    <span className="text-3xs text-yellow-300/80 font-mono font-bold">
                      VERIFIED 24K HOLDER
                    </span>
                  </div>
                </div>

                {/* Card Bottom: Member Name & Expiry */}
                <div className="flex items-end justify-between relative z-10 pt-3 border-t border-yellow-500/30">
                  <div>
                    <div className="text-3xs uppercase font-bold text-yellow-400/70 font-mono">
                      CARDHOLDER
                    </div>
                    {isEditingName ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="text"
                          value={memberName}
                          onChange={(e) => setMemberName(e.target.value)}
                          onBlur={() => setIsEditingName(false)}
                          onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                          autoFocus
                          className="bg-black/90 text-yellow-300 font-black text-xs px-2 py-0.5 rounded border border-yellow-400 focus:outline-none"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="text-xs sm:text-sm font-black text-white hover:text-yellow-300 font-mono uppercase tracking-wide flex items-center gap-1 group/name cursor-pointer"
                        title="Click to personalize name"
                      >
                        <span>{memberName}</span>
                        <span className="text-3xs text-yellow-400/60 group-hover/name:text-yellow-300">(edit)</span>
                      </button>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-3xs uppercase font-bold text-yellow-400/70 font-mono">
                      STATUS
                    </div>
                    <div className="text-xs font-black text-yellow-300 font-mono uppercase">
                      ACTIVE • LIFETIME
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Right: VIP Privileges, 2-Day Rule Guarantee & Quick Actions */}
          <div className="lg:col-span-6 space-y-4">
            
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400 shrink-0" />
                <h3 className="text-base sm:text-lg font-black text-white">
                  Exclusive {tierDetails.name} Privileges
                </h3>
              </div>
              <p className="text-xs text-yellow-100/80 leading-relaxed font-normal">
                Every VIP order placed with Abdul comes with verified guarantee, instant WhatsApp dispatch, and fair off-money negotiating rights.
              </p>
            </div>

            {/* Perks List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-medium">
              
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-black/60 border border-yellow-500/30">
                <PhoneCall className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-white text-xs">Direct Abdul Hotline</div>
                  <div className="text-3xs text-yellow-200/70 font-mono font-bold mt-0.5">
                    Call 050 297 8206 anytime
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-black/60 border border-yellow-500/30">
                <ShieldCheck className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-white text-xs">7-Day Bill Validity</div>
                  <div className="text-3xs text-yellow-200/70 font-bold mt-0.5">
                    Official QR bill guarantee
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-black/60 border border-yellow-500/30">
                <Zap className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-white text-xs">2-Day Payment Rule</div>
                  <div className="text-3xs text-yellow-200/70 font-bold mt-0.5">
                    Pay in 2 days to avoid 2 AED fine
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-black/60 border border-yellow-500/30">
                <Coins className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-white text-xs">Off-Money Haggling</div>
                  <div className="text-3xs text-yellow-200/70 font-bold mt-0.5">
                    Direct price negotiation allowed
                  </div>
                </div>
              </div>

            </div>

            {/* VIP Lounge Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                onClick={handleClaimBonus}
                className="flex-1 min-h-[42px] px-4 py-2 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-yellow-500/30 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all vip-gold-bevel"
              >
                <Crown className="w-4 h-4 text-slate-950 fill-slate-950" />
                <span>{claimedBonus ? '✨ 24K VIP Status Verified!' : 'Activate 24K Royal VIP Pass'}</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onOpenDiscountModal();
                }}
                className="px-4 py-2 min-h-[42px] bg-[#161006] hover:bg-[#221809] border border-yellow-400/60 text-yellow-300 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-md"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Haggling Rules</span>
              </button>

              <a
                href={`tel:${ABDUL_CONTACT.phoneRaw}`}
                onClick={() => sound.playCoin()}
                className="px-4 py-2 min-h-[42px] bg-black/80 hover:bg-black border border-yellow-500/50 text-yellow-300 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                <span className="font-mono">Call Concierge</span>
              </a>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
