import React from 'react';
import { 
  BadgePercent, 
  ShoppingBag, 
  Home, 
  PhoneCall, 
  Crown, 
  Zap, 
  KeyRound,
  MessageSquare,
  Users
} from 'lucide-react';
import { sound } from '../utils/audio';
import { CategoryId } from '../types';
import { ABDUL_CONTACT } from '../data/dealsData';

import { UserAccount } from '../utils/userAccounts';

interface MobileBottomNavProps {
  cartCount: number;
  cartTotalAed: number;
  onOpenCart: () => void;
  onOpenDiscountModal: () => void;
  onOpenPasscodeModal?: () => void;
  activeStore?: 'abdul' | 'hamdaan';
  onToggleStore?: (store: 'abdul' | 'hamdaan') => void;
  onGoToTop: () => void;
  onSelectCategory: (id: CategoryId) => void;
  activeCategory: CategoryId;
  activeAccount?: UserAccount | null;
  onOpenAccountModal?: () => void;
  onOpenInstallModal?: () => void;
  onOpenCommunityLounge?: () => void;
  unreadCommunityCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  cartCount,
  cartTotalAed,
  onOpenCart,
  onOpenDiscountModal,
  onOpenPasscodeModal,
  activeStore = 'abdul',
  onToggleStore,
  onGoToTop,
  onSelectCategory,
  activeCategory,
  activeAccount = null,
  onOpenAccountModal,
  onOpenCommunityLounge,
  unreadCommunityCount = 0,
}) => {
  return (
    <div 
      id="mobile-bottom-navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0903]/95 backdrop-blur-xl border-t-2 border-yellow-500/40 shadow-[0_-10px_35px_rgba(0,0,0,0.95)] pb-safe transition-all ring-1 ring-yellow-400/20"
    >
      <div className="grid grid-cols-5 items-center justify-around px-1 py-1.5 min-h-[58px]">
        
        {/* 1. Deals / Catalog Tab */}
        <button
          onClick={() => {
            sound.playClick();
            onSelectCategory('all');
            onGoToTop();
          }}
          className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-xl active:scale-95 transition-all cursor-pointer select-none ${
            activeCategory === 'all' 
              ? 'text-yellow-300 font-black bg-yellow-500/15 border border-yellow-500/30 shadow-xs' 
              : 'text-yellow-200/60 hover:text-yellow-300'
          }`}
        >
          <Home className="w-4 h-4 mb-0.5 text-yellow-400" />
          <span className="text-3xs font-black tracking-tight">VIP Deals</span>
        </button>

        {/* 2. DMs & Friends Lounge */}
        <button
          onClick={() => {
            sound.playPop();
            if (onOpenCommunityLounge) {
              onOpenCommunityLounge();
            }
          }}
          className="flex flex-col items-center justify-center py-1 px-0.5 rounded-xl text-cyan-300 hover:text-cyan-100 active:scale-95 transition-all cursor-pointer select-none relative"
        >
          <div className="relative">
            <MessageSquare className="w-4 h-4 mb-0.5 text-cyan-400" />
            {unreadCommunityCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-3xs font-mono font-black flex items-center justify-center border border-slate-950 shadow-md animate-pulse">
                {unreadCommunityCount}
              </span>
            )}
          </div>
          <span className="text-3xs font-black tracking-tight font-mono text-cyan-300">
            DMs/Friends
          </span>
        </button>

        {/* 3. Account / Sign In Tab */}
        <button
          onClick={() => {
            sound.playPop();
            if (onOpenAccountModal) {
              onOpenAccountModal();
            } else if (onOpenPasscodeModal) {
              onOpenPasscodeModal();
            }
          }}
          className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-xl active:scale-95 transition-all cursor-pointer select-none ${
            activeAccount
              ? 'text-slate-950 font-black bg-gradient-to-r from-yellow-300 to-amber-400 shadow-sm vip-gold-bevel'
              : 'text-yellow-300 hover:text-yellow-200'
          }`}
        >
          <span className="text-xs leading-none mb-0.5">{activeAccount ? activeAccount.avatarEmoji : '👤'}</span>
          <span className="text-3xs font-black tracking-tight max-w-[50px] truncate">
            {activeAccount ? activeAccount.name : 'Sign In'}
          </span>
        </button>

        {/* 4. Direct Call Abdul Hotline */}
        <a
          href={`tel:${ABDUL_CONTACT.phoneRaw}`}
          className="flex flex-col items-center justify-center py-1 px-0.5 rounded-xl text-yellow-400 hover:text-yellow-200 active:scale-95 transition-all cursor-pointer select-none"
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center mb-0.5 shadow-sm vip-gold-bevel">
            <PhoneCall className="w-3 h-3 text-slate-950" />
          </div>
          <span className="text-3xs font-black tracking-tight text-yellow-300">Call Abdul</span>
        </a>

        {/* 5. Cart Tab with dynamic badge & glow */}
        <button
          onClick={() => {
            sound.playCoin();
            onOpenCart();
          }}
          className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all cursor-pointer select-none active:scale-95 ${
            cartCount > 0
              ? 'bg-gradient-to-b from-yellow-500/25 to-amber-500/10 border border-yellow-400/60 text-yellow-300 shadow-md ring-1 ring-yellow-400/30'
              : 'text-yellow-200/60 hover:text-yellow-300'
          }`}
        >
          <div className="relative">
            <ShoppingBag className={`w-4 h-4 mb-0.5 ${cartCount > 0 ? 'text-yellow-400' : 'text-yellow-200/60'}`} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 rounded-full bg-yellow-400 text-slate-950 text-3xs font-black flex items-center justify-center border border-slate-950 shadow-md font-mono">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-3xs font-black tracking-tight font-mono">
            {cartCount > 0 ? `${cartTotalAed.toFixed(0)} AED` : 'Cart'}
          </span>
        </button>

      </div>
    </div>
  );
};

