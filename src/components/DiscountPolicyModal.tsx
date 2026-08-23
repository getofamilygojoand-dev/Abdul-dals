import React, { useState } from 'react';
import { 
  X, 
  BadgePercent, 
  Sparkles, 
  Handshake, 
  Coins, 
  ArrowRight,
  Smile,
  ShieldCheck,
  Check,
  Crown,
  PhoneCall
} from 'lucide-react';
import { ABDUL_CONTACT } from '../data/dealsData';
import { sound } from '../utils/audio';

interface DiscountPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDiscount?: (discountPercent: number) => void;
}

export const DiscountPolicyModal: React.FC<DiscountPolicyModalProps> = ({
  isOpen,
  onClose,
  onSelectDiscount,
}) => {
  const [testAmount, setTestAmount] = useState<number>(20);
  const [testPercent, setTestPercent] = useState<number>(20);

  if (!isOpen) return null;

  const discountAmount = (testAmount * testPercent) / 100;
  const finalAmount = testAmount - discountAmount;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg max-h-[94vh] flex flex-col bg-gradient-to-b from-[#181206] via-[#100c04] to-[#070502] border-2 border-yellow-500/40 rounded-2xl sm:rounded-3xl shadow-2xl shadow-yellow-950/80 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 my-auto text-slate-100 ring-1 ring-yellow-400/20">
        
        {/* VIP Gold Header */}
        <div className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 p-4 sm:p-5 text-slate-950 flex items-center justify-between shrink-0 shadow-lg vip-gold-bevel">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-950 text-yellow-400 border border-yellow-400/40 flex items-center justify-center text-xl shadow-xl shrink-0 font-black">
              <Crown className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            </div>
            <div>
              <div className="text-3xs font-black uppercase tracking-widest text-slate-950/80">
                Abdul's VIP Deal Terms
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-950">
                In-Person & VIP Discount Policy
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-950/20 hover:bg-slate-950/40 flex items-center justify-center text-slate-950 transition-colors cursor-pointer active:scale-95 border border-slate-950/20"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-slate-950" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 text-slate-200 overflow-y-auto">
          
          {/* Main VIP policy callout */}
          <div className="p-4 bg-yellow-400/15 border-2 border-yellow-500/40 rounded-2xl shadow-md">
            <div className="flex items-center gap-2 text-yellow-300 font-black text-xs sm:text-sm mb-1.5">
              <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
              <span>Direct In-Person VIP Negotiation</span>
            </div>
            <p className="text-xs text-yellow-100/90 leading-relaxed">
              As stated in Abdul’s official rules: <em>"Off money think will be discount on person."</em>
              If you call Abdul directly or meet in person to bundle services (e.g. Marvel Rivals dailies + Nutella toasted bun + middle room tidy), you qualify for instant VIP off-money discounts!
            </p>
          </div>

          {/* Hotline Box */}
          <div className="p-3.5 bg-gradient-to-r from-yellow-500/25 via-[#231a08] to-yellow-500/15 border-2 border-yellow-400/60 rounded-2xl flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2.5 text-xs">
              <PhoneCall className="w-4 h-4 text-yellow-400" />
              <span>Direct VIP Hotline: <strong className="text-yellow-300 font-mono font-black">{ABDUL_CONTACT.phoneDisplay}</strong></span>
            </div>
            <a
              href={`tel:${ABDUL_CONTACT.phoneRaw}`}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 text-3xs font-black shadow-md hover:brightness-110 active:scale-95 transition-all vip-gold-bevel"
            >
              Call Abdul
            </a>
          </div>

          {/* 3 Common Deals */}
          <div className="space-y-2">
            <h3 className="text-3xs font-black uppercase tracking-wider text-yellow-400">
              Popular VIP Combos
            </h3>

            <div className="p-3 bg-[#181206] border-2 border-yellow-500/25 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <div className="text-xs font-bold text-white">The VIP Gamer Combo 🎮</div>
                <div className="text-3xs text-yellow-400/70">5 Days Rivals Tasks + 1 Nutella Toast</div>
              </div>
              <span className="text-xs font-black text-yellow-400 font-mono">8.00 AED</span>
            </div>

            <div className="p-3 bg-[#181206] border-2 border-yellow-500/25 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <div className="text-xs font-bold text-white">The Minecraft Base Tycoon ⛏️</div>
                <div className="text-3xs text-yellow-400/70">1T Coins + Pro Castle Base</div>
              </div>
              <span className="text-xs font-black text-yellow-400 font-mono">13.50 AED</span>
            </div>

            <div className="p-3 bg-[#181206] border-2 border-yellow-500/25 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <div className="text-xs font-bold text-white">VIP Suite Refresh 🛏️🍵</div>
                <div className="text-3xs text-yellow-400/70">3 Days Bed Making + Hall Doors + Karak Tea</div>
              </div>
              <span className="text-xs font-black text-yellow-400 font-mono">8.00 AED</span>
            </div>
          </div>

          {/* Interactive Calculator */}
          <div className="p-4 bg-black/80 border-2 border-yellow-500/30 rounded-2xl space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-yellow-200">Test In-Person VIP Discount:</span>
              <span className="text-xs font-black text-yellow-400 font-mono bg-yellow-400/20 px-2 py-0.5 rounded-md border border-yellow-400/40">{testPercent}% OFF</span>
            </div>

            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={testPercent}
              onChange={(e) => {
                sound.playClick();
                setTestPercent(Number(e.target.value));
              }}
              className="w-full h-3 accent-yellow-400 cursor-pointer"
            />

            <div className="flex items-center justify-between text-xs pt-2 border-t border-yellow-500/30 font-mono">
              <span className="text-yellow-500/70 font-semibold">Example 20.00 AED Deal:</span>
              <div className="text-right">
                <span className="line-through text-yellow-500/40 mr-2">20.00 AED</span>
                <span className="text-sm font-black text-yellow-400">{finalAmount.toFixed(2)} AED</span>
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => {
              sound.playClick();
              if (onSelectDiscount) onSelectDiscount(testPercent);
              onClose();
            }}
            className="w-full py-3.5 px-4 min-h-[46px] bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-300 active:scale-98 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-xl shadow-yellow-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer select-none vip-gold-bevel"
          >
            <Check className="w-4 h-4 text-slate-950" />
            <span>Apply VIP Haggling & Return</span>
          </button>

        </div>

      </div>
    </div>
  );
};

