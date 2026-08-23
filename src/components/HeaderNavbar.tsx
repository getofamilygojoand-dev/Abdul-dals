import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Search, 
  FileText, 
  BadgePercent, 
  Phone, 
  PhoneCall, 
  Crown, 
  Check, 
  Share2, 
  Copy,
  Lightbulb,
  Zap,
  Plus,
  KeyRound,
  ShieldCheck,
  MessageSquare,
  CreditCard,
} from 'lucide-react';
import { CategoryId } from '../types';
import { CATEGORIES, ABDUL_CONTACT } from '../data/dealsData';
import { sound } from '../utils/audio';

import { UserAccount } from '../utils/userAccounts';

interface HeaderNavbarProps {
  activeCategory: CategoryId;
  onSelectCategory: (id: CategoryId) => void;
  cartCount: number;
  cartTotalAed: number;
  onOpenCart: () => void;
  onOpenDiscountModal: () => void;
  onOpenIdeasModal?: () => void;
  onOpenAddDealModal?: () => void;
  onOpenAddCategoryModal?: () => void;
  categoriesList?: any[];
  isStoreUnlocked?: boolean;
  onOpenPasscodeModal?: () => void;
  activeStore?: 'abdul' | 'hamdaan';
  onToggleStore?: (store: 'abdul' | 'hamdaan') => void;
  onOpenMyRecentReceipt?: () => void;
  hasRecentLocalOrder?: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  activeAccount?: UserAccount | null;
  onOpenAccountModal?: () => void;
  onOpenPromoGenerator?: () => void;
  onOpenInstallModal?: (autoDownload?: boolean) => void;
  onOpenCommunityLounge?: () => void;
  unreadCommunityCount?: number;
  isNotificationsMuted?: boolean;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  activeCategory,
  onSelectCategory,
  cartCount,
  cartTotalAed,
  onOpenCart,
  onOpenDiscountModal,
  onOpenIdeasModal,
  onOpenAddDealModal,
  onOpenAddCategoryModal,
  categoriesList = CATEGORIES,
  isStoreUnlocked = false,
  onOpenPasscodeModal,
  activeStore = 'abdul',
  onToggleStore,
  onOpenMyRecentReceipt,
  hasRecentLocalOrder = false,
  searchQuery,
  onSearchChange,
  soundEnabled,
  onToggleSound,
  activeAccount = null,
  onOpenAccountModal,
  onOpenPromoGenerator,
  onOpenInstallModal,
  onOpenCommunityLounge,
  unreadCommunityCount = 0,
  isNotificationsMuted = false,
}) => {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener for '/' and 'Ctrl+K' / 'Cmd+K' to focus search bar on laptops and iPads with keyboards
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't override if user is typing in another input or textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName)) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      if (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        sound.playPop();
        if (window.innerWidth >= 1024) {
          desktopSearchInputRef.current?.focus();
        } else {
          mobileSearchInputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playPop();
    navigator.clipboard.writeText(ABDUL_CONTACT.phoneDisplay);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#070502]/95 backdrop-blur-2xl border-b border-yellow-500/35 shadow-2xl shadow-yellow-950/40">
      {/* Top VIP Micro announcement & Hotline bar */}
      <div className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 text-xs font-black py-1.5 px-3 sm:px-4 flex items-center justify-between overflow-hidden shadow-md vip-gold-bevel">
        
        {/* Left VIP Royal marquee / announcement */}
        <div className="flex items-center gap-2 max-w-2xl truncate">
          <span className="inline-flex items-center gap-1 bg-black text-yellow-300 px-2.5 py-0.5 rounded-full text-3xs font-black uppercase tracking-wider shadow-inner border border-yellow-400/50">
            <Crown className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
            24K ROYAL VIP
          </span>
          <span className="hidden sm:inline font-black text-slate-950 text-xs">
            Abdul Deals VIP Official Portal • Rivals Boosts, Bed & Middle Room Care, Nutella Buns, Fresh Karak/Green Tea & 1T Minecraft
          </span>
          <span className="sm:hidden font-black text-slate-950 text-2xs truncate">
            👑 Abdul Deals 24K VIP Portal • Gaming, Room, Food & Tea
          </span>
        </div>

        {/* Right Hotline & Discount Trigger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Direct Phone Call Button */}
          <a
            href={`tel:${ABDUL_CONTACT.phoneRaw}`}
            onClick={() => sound.playCoin()}
            className="flex items-center gap-1.5 bg-black hover:bg-zinc-950 text-yellow-300 hover:text-yellow-200 px-3 py-0.5 rounded-full text-3xs sm:text-2xs font-black transition-all hover:scale-105 active:scale-95 shadow-lg border border-yellow-400/60"
            title="Call Abdul directly"
          >
            <PhoneCall className="w-3 h-3 text-yellow-400 animate-pulse" />
            <span className="font-mono">Call Abdul: {ABDUL_CONTACT.phoneDisplay}</span>
          </a>

          <button
            onClick={() => {
              sound.playClick();
              onOpenDiscountModal();
            }}
            className="hidden md:flex bg-black/15 hover:bg-black/25 px-2.5 py-0.5 rounded-full transition-all cursor-pointer items-center gap-1 font-black text-2xs text-slate-950 border border-slate-950/20"
          >
            <BadgePercent className="w-3.5 h-3.5" />
            <span>Off-Money Haggling</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Brand Logo - Ultra VIP 24K Royal Gold Luxury Edition */}
          <div 
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group" 
            onClick={() => {
              sound.playClick();
              onSelectCategory('all');
            }}
          >
            <div className="relative">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-yellow-200 via-amber-400 to-yellow-600 p-[2px] shadow-xl shadow-yellow-500/30 group-hover:scale-105 transition-transform duration-200">
                <div className="w-full h-full bg-[#120e05] rounded-[14px] flex items-center justify-center relative overflow-hidden">
                  <span className="text-lg sm:text-2xl font-black text-yellow-400 font-mono tracking-tighter flex items-center gap-0.5">
                    <Crown className="w-4 h-4 text-yellow-400 fill-yellow-400 animate-pulse" />
                    AD
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/25 via-transparent to-transparent"></div>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 text-3xs font-black px-2 py-0.2 rounded-full border border-black shadow-md font-mono tracking-wider">
                VIP
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                  <span className="bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-300 bg-clip-text text-transparent drop-shadow-md font-black">
                    abdul Deals
                  </span>
                  <span className="text-3xs bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black px-2 py-0.5 rounded shadow-sm tracking-widest uppercase">
                    VIP 24K
                  </span>
                </h1>

                {/* 4 Classic Emojis in Gold Frame */}
                <div className="flex items-center gap-1 text-sm sm:text-base bg-[#181308] px-2.5 py-0.5 rounded-lg border border-yellow-500/40 shadow-inner">
                  <span title="Clean Emoji" className="hover:scale-125 transition-transform">✨</span>
                  <span title="Minecraft Pickaxe Emoji" className="hover:scale-125 transition-transform">⛏️</span>
                  <span title="Room Emoji" className="hover:scale-125 transition-transform">🛏️</span>
                  <span title="Gun AK47 Emoji" className="hover:scale-125 transition-transform">🔫</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-2xs text-yellow-200/80 font-bold hidden sm:block">
                  👑 VIP Services • Rivals Boosts, Room Care, Burger & Nutella, Green Tea & 1T Minecraft
                </p>
                <a
                  href={`tel:${ABDUL_CONTACT.phoneRaw}`}
                  className="hidden lg:inline-flex items-center gap-1 text-3xs text-yellow-400 font-mono font-bold hover:underline"
                >
                  <Phone className="w-2.5 h-2.5" />
                  {ABDUL_CONTACT.phoneDisplay}
                </a>
              </div>
            </div>
          </div>

          {/* Search Bar on Desktop & Laptop */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-3 xl:mx-5">
            <div className="relative w-full group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-400/80 group-focus-within:text-yellow-300 transition-colors" />
              <input
                ref={desktopSearchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search VIP deals (Mega Base 20 AED, Rivals RPG, Tea, Bed, 1T)..."
                className="w-full pl-10 pr-16 py-2.5 bg-[#140f06] hover:bg-[#1a1408] focus:bg-[#1c160a] border-2 border-yellow-500/40 focus:border-yellow-400 rounded-xl text-xs text-yellow-100 placeholder-yellow-500/60 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 transition-all font-medium shadow-inner"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery ? (
                  <button
                    onClick={() => {
                      sound.playPop();
                      onSearchChange('');
                    }}
                    className="p-1 rounded-md text-yellow-400 hover:text-white hover:bg-yellow-500/20 text-xs font-bold cursor-pointer transition-colors"
                    title="Clear search"
                  >
                    ✕
                  </button>
                ) : (
                  <kbd className="hidden xl:inline-block px-1.5 py-0.5 text-4xs font-mono font-bold text-yellow-400/70 bg-black/60 border border-yellow-500/30 rounded shadow-xs">
                    /
                  </kbd>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Quick Call Pill on Desktop */}
            <a
              href={`tel:${ABDUL_CONTACT.phoneRaw}`}
              onClick={() => sound.playCoin()}
              className="hidden xl:flex items-center gap-2 px-3 py-2 bg-[#1c160a] hover:bg-[#281f0d] border border-yellow-400/40 hover:border-yellow-400 text-yellow-300 hover:text-yellow-200 rounded-xl text-xs font-black transition-all hover:scale-105 active:scale-95 shadow-lg"
              title="Call Abdul"
            >
              <PhoneCall className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
              <span className="font-mono font-bold">Call: {ABDUL_CONTACT.phoneDisplay}</span>
            </a>

            {/* Account Sign In / User Profile Button */}
            {onOpenAccountModal && (
              <button
                onClick={() => {
                  sound.playPop();
                  onOpenAccountModal();
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 select-none border ${
                  activeAccount
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 border-yellow-200 vip-gold-bevel font-black'
                    : 'bg-[#181308] hover:bg-[#241c0a] text-yellow-300 border-yellow-400/60'
                }`}
                title={activeAccount ? `Signed in as ${activeAccount.name}` : 'Sign In'}
              >
                <span className="text-sm">{activeAccount ? activeAccount.avatarEmoji : '👤'}</span>
                <span className="max-w-[70px] sm:max-w-[120px] truncate">
                  {activeAccount ? activeAccount.name : 'Sign In'}
                </span>
              </button>
            )}

            {/* A Card Quick Balance / Pending Pill */}
            {activeAccount?.aCard && onOpenAccountModal && (
              <button
                onClick={() => {
                  sound.playCashRegister();
                  onOpenAccountModal();
                }}
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-mono font-black border transition-all shadow-md cursor-pointer ${
                  activeAccount.aCard.status === 'active'
                    ? 'border-amber-400/60 bg-gradient-to-r from-[#201708] via-black to-[#181005] text-amber-300 hover:border-yellow-300 hover:scale-105 active:scale-95'
                    : 'border-amber-400 bg-amber-950/80 text-amber-200 animate-pulse hover:border-amber-300'
                }`}
                title={
                  activeAccount.aCard.status === 'active'
                    ? `A Card Balance: ${Number(activeAccount.aCard.balanceAed || 0).toFixed(2)} AED (Card: ${activeAccount.aCard.cardNumber})`
                    : `A Card Order #${activeAccount.aCard.orderId || 'PENDING'} - Send to Abdul to start working!`
                }
              >
                <CreditCard className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-yellow-200 font-extrabold">
                  {activeAccount.aCard.status === 'active'
                    ? `${Number(activeAccount.aCard.balanceAed || 0).toFixed(2)} AED`
                    : 'Send to Abdul ⏳'}
                </span>
              </button>
            )}

            {/* Direct Messages & 1-on-1 Calls Button */}
            {onOpenCommunityLounge && (
              <button
                onClick={() => {
                  sound.playPop();
                  onOpenCommunityLounge();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 select-none border border-cyan-400/50 bg-gradient-to-r from-cyan-950/80 via-sky-900/60 to-blue-950/80 text-cyan-300 hover:border-cyan-300 font-mono relative"
                title="Direct Messages, Members & 1-on-1 Calls"
              >
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span className="hidden md:inline">Direct Messages</span>
                <span className="md:hidden">DMs</span>
                {unreadCommunityCount > 0 ? (
                  <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-3xs font-mono font-black animate-pulse">
                    {unreadCommunityCount}
                  </span>
                ) : (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                )}
                {isNotificationsMuted && (
                  <span className="text-3xs text-rose-400 font-mono" title="Notifications Muted">
                    🔕
                  </span>
                )}
              </button>
            )}

            {/* Code Unlock Button */}
            {!isStoreUnlocked && onOpenPasscodeModal && (
              <button
                onClick={() => {
                  sound.playPop();
                  onOpenPasscodeModal();
                }}
                className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 bg-[#1b1409] hover:bg-[#281d0a] border-2 border-yellow-400/80 hover:border-yellow-300 text-yellow-300 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 select-none"
                title="Store Authorization"
              >
                <KeyRound className="w-4 h-4 text-yellow-400" />
                <span>Code</span>
              </button>
            )}
            {isStoreUnlocked && (
              <button
                onClick={() => {
                  sound.playPop();
                  if (onOpenPasscodeModal) onOpenPasscodeModal();
                }}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-emerald-950/60 border border-emerald-400/50 text-emerald-300 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 select-none"
                title="Deals Unlocked"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Unlocked</span>
              </button>
            )}

            {/* Promo Code Generator ONLY for Abdul Owner when Logged In */}
            {activeAccount?.isOwner && activeAccount?.code === '2015' && onOpenPromoGenerator && (
              <button
                onClick={() => {
                  sound.playCashRegister();
                  onOpenPromoGenerator();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 select-none border-2 border-amber-400 bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-300 hover:border-amber-300"
                title="Dirham-Off Promo Code Generator (Owner Tool)"
              >
                <span className="text-sm">🎟️</span>
                <span className="font-mono">
                  Owner Promo
                </span>
              </button>
            )}

            {/* 👑 2015 Owner Idea Vault Button (Exclusively for Code 2015) */}
            {onOpenIdeasModal && activeAccount?.code === '2015' && (
              <button
                onClick={() => {
                  sound.playVipFanfare();
                  onOpenIdeasModal();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 select-none border bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 border-yellow-200 shadow-yellow-500/30 vip-gold-bevel font-mono"
                title="Browse 50+ deal ideas for your store"
              >
                <Lightbulb className="w-4 h-4 text-slate-950 animate-bounce" />
                <span>👑 Idea Vault</span>
                <span className="text-3xs px-1.5 py-0.5 rounded font-black font-mono bg-slate-950 text-yellow-300 border border-yellow-400/40">
                  50+
                </span>
              </button>
            )}

            {/* Sound Toggle */}
            <button
              onClick={() => {
                onToggleSound();
                sound.playClick();
              }}
              title={soundEnabled ? 'Mute Sound Effects' : 'Enable Audio'}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                soundEnabled
                  ? 'bg-yellow-500/20 border-yellow-400/50 text-yellow-300 hover:bg-yellow-500/30'
                  : 'bg-[#140f06] border-yellow-500/20 text-yellow-500/40 hover:text-yellow-300'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-yellow-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden lg:inline">{soundEnabled ? 'Audio ON' : 'Muted'}</span>
            </button>

            {/* My Recent Receipt */}
            {hasRecentLocalOrder && onOpenMyRecentReceipt && (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenMyRecentReceipt();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-[#181308] hover:bg-[#241c0a] border border-yellow-500/40 hover:border-yellow-400 text-yellow-200 hover:text-yellow-100 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
                title="View your recent receipt"
              >
                <FileText className="w-4 h-4 text-yellow-400" />
                <span>My Receipt</span>
              </button>
            )}

            {/* VIP Gold Cart Trigger */}
            <button
              onClick={() => {
                sound.playCoin();
                onOpenCart();
              }}
              className="relative flex items-center gap-2 px-3 sm:px-4.5 py-2 bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-500 hover:from-yellow-200 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-xl shadow-yellow-500/30 hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer select-none vip-gold-bevel"
            >
              <div className="relative flex items-center">
                <ShoppingBag className="w-4 h-4 text-slate-950" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 min-w-[19px] h-[19px] px-1 rounded-full bg-red-600 text-white text-3xs font-black flex items-center justify-center border-2 border-slate-950 shadow-md">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="font-mono tracking-tight">{cartTotalAed > 0 ? `${cartTotalAed.toFixed(2)} AED` : 'Cart'}</span>
            </button>

          </div>

        </div>

        {/* Mobile & iPad Tablet High-Visibility Search Bar with Quick Filter Tags */}
        <div className="mt-2.5 lg:hidden space-y-2">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-400" />
            <input
              ref={mobileSearchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search deals (Mega Base 20 AED, Rivals RPG, Bed, Tea)..."
              className="w-full pl-10 pr-9 py-2.5 bg-[#161006] border-2 border-yellow-500/50 focus:border-yellow-400 rounded-xl text-xs text-yellow-100 placeholder-yellow-500/60 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 shadow-inner font-medium"
            />
            {searchQuery ? (
              <button
                onClick={() => {
                  sound.playPop();
                  onSearchChange('');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-yellow-400 hover:text-white hover:bg-yellow-500/20 text-xs font-bold cursor-pointer"
                title="Clear search"
              >
                ✕
              </button>
            ) : null}
          </div>

          {/* Quick-tap Search Suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none no-scrollbar text-3xs font-bold">
            <span className="text-yellow-400/70 shrink-0 font-mono text-4xs uppercase tracking-wider pl-0.5">Quick:</span>
            {[
              { label: '👑 Mega Base 20 AED', query: 'Mega Base' },
              { label: '🍔 Burger', query: 'Burger' },
              { label: '🍵 Karak Tea', query: 'Tea' },
              { label: '🎮 Rivals RPG', query: 'Rivals' },
              { label: '⛏️ 1T Coins', query: '1T' },
              { label: '🛏️ Bed Care', query: 'Bed' },
            ].map((tag) => (
              <button
                key={tag.query}
                type="button"
                onClick={() => {
                  sound.playClick();
                  onSearchChange(tag.query);
                }}
                className={`px-2 py-0.5 rounded-lg border whitespace-nowrap transition-all cursor-pointer ${
                  searchQuery.toLowerCase().includes(tag.query.toLowerCase())
                    ? 'bg-yellow-400 text-slate-950 border-yellow-300 font-black'
                    : 'bg-black/50 text-yellow-300/80 border-yellow-500/25 hover:border-yellow-400/50 hover:text-yellow-200'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* VIP Category Navigation Pills */}
        <nav className="flex items-center gap-1.5 sm:gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none no-scrollbar touch-pan-x overscroll-x-contain">
          {categoriesList.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  sound.playClick();
                  onSelectCategory(cat.id);
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 min-h-[40px] sm:min-h-[38px] rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border select-none active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-500 text-slate-950 border-yellow-200 shadow-xl shadow-yellow-500/30 font-black scale-105 vip-gold-bevel'
                    : 'bg-[#140f06]/90 hover:bg-[#1e1709] text-yellow-100/90 border-yellow-500/25 hover:border-yellow-400/60'
                }`}
              >
                <span className="text-sm">{cat.emoji}</span>
                <span>{cat.name}</span>
                {cat.id !== 'all' && cat.badge && (
                  <span className={`text-3xs px-1.5 py-0.2 rounded-md font-mono ${
                    isActive ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-black/70 text-yellow-300 border border-yellow-500/30'
                  }`}>
                    {cat.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Add Category Button (Abdul Owner Exclusive ONLY) */}
          {(isStoreUnlocked || activeAccount?.code === '2015') && onOpenAddCategoryModal && (
            <button
              onClick={() => {
                sound.playPop();
                onOpenAddCategoryModal();
              }}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 min-h-[40px] sm:min-h-[38px] bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-400/60 hover:border-emerald-300 text-emerald-300 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer select-none active:scale-95 shadow-md"
              title="Make custom categories & choose them"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
              <span>+ Category</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

