import React, { useState } from 'react';
import { 
  Sparkles, 
  Coins, 
  BadgePercent, 
  ArrowRight,
  Calculator,
  ShieldCheck,
  Zap,
  Phone,
  PhoneCall,
  Crown,
  Share2,
  Copy,
  Check,
  Flame,
  Star,
  Lightbulb,
  Plus,
  KeyRound
} from 'lucide-react';
import { sound } from '../utils/audio';
import { ABDUL_CONTACT } from '../data/dealsData';
import { DealVisual } from './DealVisual';

interface HeroBannerProps {
  onOpenDiscountModal: () => void;
  onScrollToSection: (sectionId: string) => void;
  onOpenCart: () => void;
  onOpenIdeasModal?: () => void;
  onOpenAddDealModal?: () => void;
  isStoreUnlocked?: boolean;
  isOwner2015?: boolean;
  onOpenPasscodeModal?: () => void;
  onOpenInstallModal?: (autoDownload?: boolean) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onOpenDiscountModal,
  onScrollToSection,
  onOpenCart,
  onOpenIdeasModal,
  onOpenAddDealModal,
  isStoreUnlocked = false,
  isOwner2015 = false,
  onOpenPasscodeModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const appShareUrl = 'https://ais-pre-2ncwszuxzkgfhzonritrb6-682699691919.europe-west2.run.app';

  const handleCopyPhone = () => {
    sound.playPop();
    navigator.clipboard.writeText(ABDUL_CONTACT.phoneDisplay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleCopyAppUrl = () => {
    sound.playPop();
    navigator.clipboard.writeText(appShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#1c1508] via-[#120e05] to-[#070502] border-2 border-yellow-500/40 p-4 sm:p-7 lg:p-9 shadow-2xl mb-8 sm:mb-10 ring-1 ring-yellow-400/20">
      {/* Background ambient lighting - 24K VIP Gold glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-400/[0.18] rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-500/[0.14] rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -top-10 -left-10 w-60 h-60 bg-yellow-300/[0.10] rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-80"></div>

      <div className="relative z-10 max-w-4xl">
        
        {/* Top VIP Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 text-3xs sm:text-xs font-black shadow-lg shadow-yellow-500/20 vip-gold-bevel">
            <Crown className="w-3.5 h-3.5 text-slate-950 fill-slate-950 shrink-0" />
            <span>24K ROYAL VIP CATALOG</span>
            <span className="text-slate-950/40">•</span>
            <span>Abdul Official Store</span>
          </div>

          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/90 border border-yellow-400/50 text-yellow-300 text-3xs font-black tracking-wide shadow-md">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 animate-pulse" />
            <span>Direct Concierge & VIP Hotline</span>
          </div>
        </div>

        {/* Grand Headline with VIP Gold & 4 Required Emojis */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 mb-3">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-300 bg-clip-text text-transparent drop-shadow-md font-black">
              abdul Deals
            </span>
            <span className="text-sm sm:text-xl font-black bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 px-3 py-0.5 rounded-lg shadow-xl uppercase tracking-wider vip-gold-bevel">
              VIP 24K
            </span>
          </h1>

          {/* Clean Emoji, Minecraft Pickaxe, Room, and Gun AK47 Emojis */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-[#140f06] border-2 border-yellow-400/50 px-3 py-1.5 rounded-xl shadow-xl select-none">
            <span className="text-lg sm:text-2xl hover:scale-125 transition-transform cursor-default" title="Clean Emoji">✨</span>
            <span className="text-lg sm:text-2xl hover:scale-125 transition-transform cursor-default" title="Minecraft Pickaxe Emoji">⛏️</span>
            <span className="text-lg sm:text-2xl hover:scale-125 transition-transform cursor-default" title="Room Emoji">🛏️</span>
            <span className="text-lg sm:text-2xl hover:scale-125 transition-transform cursor-default" title="Gun AK47 Emoji">🔫</span>
          </div>
        </div>

        {/* Subtitle description */}
        <p className="text-xs sm:text-base text-yellow-100/90 font-normal leading-relaxed mb-5 max-w-2xl">
          Welcome to the ultra-exclusive VIP portal for <strong className="text-yellow-300 font-black">Rivals Gaming Boosts</strong>, dedicated <strong className="text-yellow-300 font-black">Room Bed & Door Care</strong>, mouthwatering <strong className="text-amber-300 font-black">Nutella & Toasted Buns</strong>, premium <strong className="text-yellow-300 font-black">Green Tea & Chai Drinks</strong>, and <strong className="text-yellow-200 font-black">1 Trillion Minecraft Economy</strong>.
        </p>

        {/* VIP Perks Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 text-3xs sm:text-2xs font-bold text-yellow-200/90">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-black/60 border border-yellow-500/30">
            <Crown className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            <span className="truncate">Direct Abdul Pricing</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-black/60 border border-yellow-500/30">
            <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            <span className="truncate">Instant VIP Service</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-black/60 border border-yellow-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            <span className="truncate">100% Guaranteed</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-black/60 border border-yellow-500/30">
            <Coins className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            <span className="truncate">Off-Money Haggling</span>
          </div>
        </div>

        {/* PROMINENT VIP HOTLINE CALLOUT BOX (Call Abdul 050 297 8206) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-yellow-500/25 via-[#231a08] to-yellow-500/15 border-2 border-yellow-400/70 shadow-2xl shadow-yellow-950/50 mb-6 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center text-xl font-black shadow-xl shadow-yellow-500/30 shrink-0 vip-gold-bevel">
                <PhoneCall className="w-6 h-6 animate-pulse text-slate-950" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-3xs font-black uppercase tracking-widest text-slate-950 bg-yellow-400 px-2 py-0.5 rounded font-mono shadow-sm">
                    VIP 24K DIRECT HOTLINE
                  </span>
                  <span className="text-3xs font-bold text-yellow-200/80">Available for Fast Orders</span>
                </div>
                <div className="text-base sm:text-xl font-black text-white tracking-tight mt-1 flex flex-wrap items-baseline gap-2">
                  <span>Call Abdul:</span>
                  <span className="text-yellow-400 font-mono tracking-wider text-xl sm:text-2xl drop-shadow-md">
                    {ABDUL_CONTACT.phoneDisplay}
                  </span>
                </div>
                <p className="text-3xs sm:text-2xs text-yellow-200/70 font-medium">
                  Direct phone orders, in-person discount negotiations & rapid service bookings
                </p>
              </div>
            </div>

            {/* Quick Action Buttons for Hotline */}
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`tel:${ABDUL_CONTACT.phoneRaw}`}
                onClick={() => sound.playCoin()}
                className="py-2.5 px-4 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-xl shadow-yellow-500/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer select-none vip-gold-bevel"
              >
                <Phone className="w-4 h-4 text-slate-950" />
                <span>Call Now</span>
              </a>

              <a
                href={ABDUL_CONTACT.whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sound.playClick()}
                className="py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer select-none border border-emerald-400/40"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>

              <button
                onClick={handleCopyPhone}
                className="py-2.5 px-3 bg-black/80 hover:bg-black text-yellow-300 font-bold text-xs rounded-xl border border-yellow-500/50 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Copy phone number"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-yellow-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

          </div>
        </div>

        {/* 5 Quick Jump Category Navigator Cards with DealVisuals */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 mb-6">
          <div 
            onClick={() => { sound.playClick(); onScrollToSection('rivals'); }}
            className="p-3 bg-[#161006]/95 hover:bg-[#221809] active:scale-95 border-2 border-yellow-500/30 hover:border-yellow-400 rounded-xl cursor-pointer transition-all group select-none shadow-lg flex items-center gap-2.5 hover:shadow-yellow-950/40"
          >
            <DealVisual categoryKey="rivals" size="sm" className="shrink-0 border-yellow-400/60" />
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-xs font-black text-white group-hover:text-yellow-300 transition-colors truncate">Rivals</span>
                <span className="text-3xs font-mono font-black text-yellow-400 bg-yellow-400/10 px-1 py-0.2 rounded border border-yellow-400/30">0.50+</span>
              </div>
              <div className="text-3xs text-yellow-200/60 font-medium truncate">RPG & AK47</div>
            </div>
          </div>

          <div 
            onClick={() => { sound.playClick(); onScrollToSection('room'); }}
            className="p-3 bg-[#161006]/95 hover:bg-[#221809] active:scale-95 border-2 border-yellow-500/30 hover:border-yellow-400 rounded-xl cursor-pointer transition-all group select-none shadow-lg flex items-center gap-2.5 hover:shadow-yellow-950/40"
          >
            <DealVisual categoryKey="room" size="sm" className="shrink-0 border-yellow-400/60" />
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-xs font-black text-white group-hover:text-yellow-300 transition-colors truncate">Room</span>
                <span className="text-3xs font-mono font-black text-yellow-400 bg-yellow-400/10 px-1 py-0.2 rounded border border-yellow-400/30">2.00+</span>
              </div>
              <div className="text-3xs text-yellow-200/60 font-medium truncate">Beds & Doors</div>
            </div>
          </div>

          <div 
            onClick={() => { sound.playClick(); onScrollToSection('food'); }}
            className="p-3 bg-[#161006]/95 hover:bg-[#221809] active:scale-95 border-2 border-yellow-500/30 hover:border-yellow-400 rounded-xl cursor-pointer transition-all group select-none shadow-lg flex items-center gap-2.5 hover:shadow-yellow-950/40"
          >
            <DealVisual categoryKey="food" size="sm" className="shrink-0 border-yellow-400/60" />
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-xs font-black text-white group-hover:text-yellow-300 transition-colors truncate">Food</span>
                <span className="text-3xs font-mono font-black text-yellow-400 bg-yellow-400/10 px-1 py-0.2 rounded border border-yellow-400/30">1.00+</span>
              </div>
              <div className="text-3xs text-yellow-200/60 font-medium truncate">Burger & Nutella</div>
            </div>
          </div>

          <div 
            onClick={() => { sound.playClick(); onScrollToSection('drinks'); }}
            className="p-3 bg-[#161006]/95 hover:bg-[#221809] active:scale-95 border-2 border-yellow-500/30 hover:border-yellow-400 rounded-xl cursor-pointer transition-all group select-none shadow-lg flex items-center gap-2.5 hover:shadow-yellow-950/40"
          >
            <DealVisual categoryKey="drinks" size="sm" className="shrink-0 border-yellow-400/60" />
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-xs font-black text-white group-hover:text-yellow-300 transition-colors truncate">Drinks</span>
                <span className="text-3xs font-mono font-black text-yellow-400 bg-yellow-400/10 px-1 py-0.2 rounded border border-yellow-400/30">1.50</span>
              </div>
              <div className="text-3xs text-yellow-200/60 font-medium truncate">Tea & Lemonade</div>
            </div>
          </div>

          <div 
            onClick={() => { sound.playClick(); onScrollToSection('minecraft'); }}
            className="p-3 bg-[#161006]/95 hover:bg-[#221809] active:scale-95 border-2 border-yellow-500/30 hover:border-yellow-400 rounded-xl cursor-pointer transition-all group select-none col-span-2 sm:col-span-1 shadow-lg flex items-center gap-2.5 hover:shadow-yellow-950/40"
          >
            <DealVisual categoryKey="minecraft" size="sm" className="shrink-0 border-yellow-400/60" />
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-xs font-black text-white group-hover:text-yellow-300 transition-colors truncate">Minecraft</span>
                <span className="text-3xs font-mono font-black text-yellow-400 bg-yellow-400/10 px-1 py-0.2 rounded border border-yellow-400/30">1.00+</span>
              </div>
              <div className="text-3xs text-yellow-200/60 font-medium truncate">Tools & 1T Coins</div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={() => {
              sound.playCashRegister();
              onOpenCart();
            }}
            className="px-5 py-3.5 min-h-[46px] bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-xl shadow-yellow-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer select-none vip-gold-bevel"
          >
            <Calculator className="w-4 h-4 text-slate-950" />
            <span>Open VIP Cart & Calculate Total</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {isStoreUnlocked ? (
            onOpenAddDealModal && (
              <button
                onClick={() => {
                  sound.playPop();
                  onOpenAddDealModal();
                }}
                className="px-4 py-3.5 min-h-[46px] bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer select-none shadow-lg vip-gold-bevel"
              >
                <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
                <span>+ Add Deal to Abdul</span>
              </button>
            )
          ) : (
            onOpenPasscodeModal && (
              <button
                onClick={() => {
                  sound.playPop();
                  onOpenPasscodeModal();
                }}
                className="px-4 py-3.5 min-h-[46px] bg-[#1a1307] hover:bg-[#291d09] border-2 border-yellow-400 hover:border-yellow-300 active:scale-95 text-yellow-300 font-black text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer select-none shadow-lg"
              >
                <KeyRound className="w-4 h-4 text-yellow-400" />
                <span>Store Authorization</span>
              </button>
            )
          )}

          {/* 👑 2015 Owner Idea Vault Studio Button (Exclusively for Code 2015) */}
          {onOpenIdeasModal && isOwner2015 && (
            <button
              onClick={() => {
                sound.playVipFanfare();
                onOpenIdeasModal();
              }}
              className="px-4 py-3.5 min-h-[46px] bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-300 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer select-none shadow-xl vip-gold-bevel font-mono"
            >
              <Lightbulb className="w-4 h-4 text-slate-950 animate-bounce" />
              <span>👑 2015 Idea Vault</span>
              <span className="text-3xs bg-slate-950 text-yellow-300 border border-yellow-400/40 px-1.5 py-0.5 rounded font-mono font-black">
                50+
              </span>
            </button>
          )}

          <button
            onClick={() => {
              sound.playCoin();
              onOpenDiscountModal();
            }}
            className="px-4 py-3.5 min-h-[46px] bg-[#161006] hover:bg-[#241a0a] border-2 border-yellow-400/50 hover:border-yellow-400 active:scale-95 text-yellow-300 font-black text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer select-none shadow-lg"
          >
            <BadgePercent className="w-4 h-4 text-yellow-400" />
            <span>VIP Off-Money Haggling</span>
          </button>

          <a
            href={`tel:${ABDUL_CONTACT.phoneRaw}`}
            onClick={() => sound.playCoin()}
            className="sm:hidden py-3.5 min-h-[46px] bg-yellow-400/20 border-2 border-yellow-400 text-yellow-300 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg"
          >
            <PhoneCall className="w-4 h-4 text-yellow-400" />
            <span>Call Abdul: {ABDUL_CONTACT.phoneDisplay}</span>
          </a>
        </div>

      </div>
    </div>
  );
};

