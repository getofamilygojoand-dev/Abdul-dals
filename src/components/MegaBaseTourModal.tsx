import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Crown, 
  ShoppingBag, 
  Check, 
  Music,
  Tv,
  Film
} from 'lucide-react';
import { sound } from '../utils/audio';
import { DealItem } from '../types';
import { MegaBaseVideoPlayer } from './MegaBaseVideoPlayer';

interface MegaBaseTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal?: DealItem;
  onAddToCart?: (deal: DealItem, qty: number) => void;
}

export const MegaBaseTourModal: React.FC<MegaBaseTourModalProps> = ({
  isOpen,
  onClose,
  deal,
  onAddToCart,
}) => {
  const [addedSuccess, setAddedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleBookBase = () => {
    if (deal && onAddToCart) {
      sound.playCashRegister();
      onAddToCart(deal, 1);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl bg-gradient-to-b from-[#1c1508] via-[#120e05] to-[#070502] border-2 border-yellow-400/80 rounded-3xl overflow-hidden shadow-2xl shadow-yellow-950/80 ring-1 ring-yellow-400/40 flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar: Prominently "Abdul Deals" */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 flex items-center justify-between shadow-md vip-gold-bevel shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-black text-yellow-400 flex items-center justify-center text-base shadow-inner font-black shrink-0">
              <Crown className="w-5 h-5 fill-yellow-400" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-950 tracking-tight leading-tight">
                  Abdul Deals • Real Mega Base Gameplay Walkthrough
                </h3>
                <span className="bg-black text-yellow-300 text-3xs font-black px-2 py-0.5 rounded-full font-mono">
                  20.00 AED
                </span>
                <span className="bg-emerald-950 text-emerald-300 text-3xs font-black px-2 py-0.5 rounded-md border border-emerald-500/40 flex items-center gap-1 font-mono">
                  <Film className="w-3 h-3 text-emerald-400" />
                  <span>Real In-Game Gameplay (Not AI)</span>
                </span>
              </div>
              <p className="text-3xs text-slate-900 font-bold hidden sm:block mt-0.5">
                Authentic Gameplay: Secret Entrance & Piston Stairs, Bedroom, TV Lounge, Throne Banquet, Kitchen & Redstone Vault
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/20 hover:bg-black/40 text-slate-950 flex items-center justify-center transition-all cursor-pointer font-black active:scale-95 shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Section with "Abdul Deals" Header & Calm Song */}
        <div className="p-3 sm:p-5 bg-[#0e0a04] flex flex-col items-center justify-center flex-1 overflow-y-auto">
          <div className="w-full max-w-3xl">
            <MegaBaseVideoPlayer autoPlay={true} isCompact={false} />
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full max-w-3xl mt-3.5">
            <div className="p-2.5 rounded-xl bg-[#181308] border border-yellow-400/25 flex items-center gap-2">
              <span className="text-lg">🪜</span>
              <div>
                <div className="text-3xs font-black text-white">Piston Stairs</div>
                <div className="text-3xs text-yellow-300/70 font-mono">00:00 - 00:07</div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#181308] border border-yellow-400/25 flex items-center gap-2">
              <span className="text-lg">🛏️</span>
              <div>
                <div className="text-3xs font-black text-white">Bedroom & TV</div>
                <div className="text-3xs text-yellow-300/70 font-mono">00:07 - 00:19</div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#181308] border border-yellow-400/25 flex items-center gap-2">
              <span className="text-lg">👑</span>
              <div>
                <div className="text-3xs font-black text-white">Throne Banquet</div>
                <div className="text-3xs text-yellow-300/70 font-mono">00:20 - 00:31</div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#181308] border border-yellow-400/25 flex items-center gap-2">
              <span className="text-lg">⚙️</span>
              <div>
                <div className="text-3xs font-black text-white">Kitchen & Vault</div>
                <div className="text-3xs text-yellow-300/70 font-mono">00:32 - 00:58</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Details & Booking Action */}
        <div className="p-4 sm:p-5 bg-[#100c05] border-t border-yellow-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-center sm:text-left">
            <div className="text-xs text-yellow-200/90 font-medium flex items-center gap-1.5 justify-center sm:justify-start">
              <Music className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Includes Calm Ambient Background Song & Custom Minecraft Base Architecture</span>
            </div>
            <div className="text-3xs text-yellow-500/70 font-mono mt-0.5">
              Built and delivered by Abdul Deals • 20.00 AED total
            </div>
          </div>

          {deal && (
            <button
              onClick={handleBookBase}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-xl shadow-yellow-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer select-none vip-gold-bevel shrink-0"
            >
              {addedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                  <span>Added Mega Base to Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-slate-950" />
                  <span>Book Mega Base (20 AED)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
