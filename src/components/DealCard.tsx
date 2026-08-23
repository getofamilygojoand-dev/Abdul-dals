import React, { useState } from 'react';
import { 
  Plus, 
  Minus, 
  ShoppingBag, 
  Check, 
  Sparkles, 
  Coins, 
  Edit3,
  Flame,
  Clock,
  Crown,
  Eye,
  Maximize2,
  ChevronRight,
  CreditCard
} from 'lucide-react';
import { DealItem, AuthorizedPerson } from '../types';
import { formatAedCurrency } from '../utils/formatters';
import { sound } from '../utils/audio';
import { DealVisual } from './DealVisual';
import { MegaBaseTourModal } from './MegaBaseTourModal';
import { MegaBaseVideoPlayer } from './MegaBaseVideoPlayer';
import { CatTreatModal } from './CatTreatModal';
import { UserAccount, getActiveUserAccount } from '../utils/userAccounts';

interface DealCardProps {
  deal: DealItem;
  quantityInCart: number;
  onAddToCart: (deal: DealItem, qty: number, treatTimings?: string[], customPrice?: number) => void;
  onUpdateCartQty: (dealId: string, delta: number) => void;
  currentUser?: AuthorizedPerson | null;
  onEditDeal?: (deal: DealItem) => void;
  isStoreUnlocked?: boolean;
  activeAccount?: UserAccount | null;
  onOpenAccountModal?: () => void;
}

export const DealCard: React.FC<DealCardProps> = ({
  deal,
  quantityInCart,
  onAddToCart,
  onUpdateCartQty,
  currentUser,
  onEditDeal,
  isStoreUnlocked = false,
  activeAccount,
  onOpenAccountModal,
}) => {
  const [justAdded, setJustAdded] = useState(false);
  const [selectedQty, setSelectedQty] = useState(1);
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [isTreatModalOpen, setIsTreatModalOpen] = useState(false);

  const isMegaBaseDeal = deal.id === 'mc-build-pro-base' || 
    deal.title.toLowerCase().includes('mega base') || 
    deal.title.toLowerCase().includes('bulid a base');

  const isTreatDeal = deal.id === 'cat-feed-treat' || 
    deal.title.toLowerCase().includes('treat') || 
    deal.title.toLowerCase().includes('snack for cat');

  const isACardDeal = deal.id === 'pass-official-a-card' || 
    deal.id === 'official-a-card-pass' || 
    deal.title.toLowerCase().includes('a card');

  const resolvedAccount = activeAccount || getActiveUserAccount();
  const userACard = isACardDeal ? resolvedAccount?.aCard : null;
  const alreadyOwnsACard = isACardDeal && !!userACard;

  const formatted = formatAedCurrency(deal.priceAed);
  const canEdit = currentUser && (currentUser.role === 'owner' || currentUser.canEditPrices);

  const handleAdd = () => {
    if (alreadyOwnsACard) {
      sound.playPop();
      if (onOpenAccountModal) {
        onOpenAccountModal();
      } else {
        window.dispatchEvent(new CustomEvent('abdul_open_account_modal_acard'));
      }
      return;
    }
    if (isTreatDeal) {
      sound.playPop();
      setIsTreatModalOpen(true);
      return;
    }
    sound.playCashRegister();
    onAddToCart(deal, selectedQty);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <>
      <div 
        id={`deal-card-${deal.id}`}
        className="group relative flex flex-col justify-between bg-gradient-to-b from-[#1c1509] via-[#120e05] to-[#070502] border-2 border-yellow-500/35 hover:border-yellow-300 rounded-3xl p-5 sm:p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-950/70 hover:-translate-y-1.5 overflow-hidden ring-1 ring-yellow-400/20 vip-card-glow"
      >
        {/* Top subtle VIP ambient gold glow & light sweep */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-yellow-400/20 via-amber-500/10 to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-yellow-400/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

        <div>
          {/* Header Badges */}
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-3xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg border bg-yellow-400/15 border-yellow-400/40 text-yellow-300 shadow-xs font-mono">
                {deal.tag}
              </span>

              {alreadyOwnsACard && userACard ? (
                userACard.status === 'active' ? (
                  <span className="inline-flex items-center gap-1 text-3xs font-black px-2.5 py-0.5 rounded-md bg-emerald-400 text-slate-950 shadow-sm font-mono">
                    <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
                    <span>ALREADY OWNED & WORKING</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-3xs font-black px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 shadow-sm font-mono animate-pulse">
                    <Clock className="w-3 h-3 text-slate-950 stroke-[3]" />
                    <span>ORDER SUBMITTED • SEND TO ABDUL</span>
                  </span>
                )
              ) : deal.isComingSoon ? (
                <span className="inline-flex items-center gap-1 text-3xs font-black px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-300 border border-yellow-400/40 animate-pulse">
                  <Clock className="w-2.5 h-2.5" />
                  <span>COMING SOON</span>
                </span>
              ) : deal.highlight ? (
                <span className="inline-flex items-center gap-1 text-3xs font-black px-2.5 py-0.5 rounded-md bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 shadow-sm vip-gold-bevel font-sans">
                  <Sparkles className="w-2.5 h-2.5 text-slate-950 fill-slate-950" />
                  <span>{deal.highlight}</span>
                </span>
              ) : null}

              {deal.tier === 'legendary' && (
                <span className="text-3xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-gradient-to-r from-yellow-400/30 to-amber-500/30 text-yellow-200 border border-yellow-400/70 flex items-center gap-1 shadow-sm font-mono">
                  <Crown className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                  24K Royal
                </span>
              )}
            </div>

            {/* Quick Edit button */}
            {isStoreUnlocked && onEditDeal && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onEditDeal(deal);
                }}
                className="px-2.5 py-1 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-300 text-slate-950 text-3xs font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-md vip-gold-bevel"
                title="Edit deal price or details"
              >
                <Edit3 className="w-3 h-3 text-slate-950 stroke-[3]" />
                <span>✏️ Edit Price</span>
              </button>
            )}
          </div>

          {/* Title and Visual */}
          <div className="flex items-start gap-3.5 mb-3">
            <div className="relative shrink-0">
              <DealVisual deal={deal} size="md" className="border-2 border-yellow-400/60 group-hover:border-yellow-300 group-hover:scale-105 transition-transform shadow-lg" />
              <span className="absolute -bottom-1 -right-1 text-xs bg-black/90 rounded-full px-1 border border-yellow-400/60 shadow-sm pointer-events-none">
                {deal.emoji}
              </span>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white group-hover:text-yellow-300 transition-colors leading-snug tracking-tight">
                {deal.title}
              </h3>
              <span className="text-3xs font-black uppercase tracking-wider text-yellow-400/90 font-mono">
                {deal.unit}
              </span>
            </div>
          </div>

          {/* Mega Base Video Tour Player with Calm Song & "Abdul Deals" On Top */}
          {isMegaBaseDeal && (
            <div className="mb-3.5 space-y-2">
              <MegaBaseVideoPlayer
                isCompact={true}
                onExpand={() => setIsTourModalOpen(true)}
              />
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  setIsTourModalOpen(true);
                }}
                className="w-full py-1.5 px-3 bg-[#181308] hover:bg-[#241a0a] border border-yellow-400/50 hover:border-yellow-300 text-yellow-300 rounded-xl text-3xs font-black transition-all flex items-center justify-between cursor-pointer group/tour shadow-sm"
              >
                <div className="flex items-center gap-1.5">
                  <Maximize2 className="w-3 h-3 text-yellow-400" />
                  <span>Open Full Video Tour & Room Details</span>
                </div>
                <span className="text-3xs text-yellow-400/80 font-mono group-hover/tour:translate-x-0.5 transition-transform">
                  20 AED Deal →
                </span>
              </button>
            </div>
          )}

          {/* Cat Treat Timing Scheduler Banner */}
          {isTreatDeal && (
            <div className="mb-3.5 p-3 rounded-2xl bg-gradient-to-r from-yellow-500/15 via-amber-500/10 to-yellow-500/15 border border-yellow-400/50 space-y-2 shadow-inner">
              <div className="flex items-center justify-between text-3xs font-black font-mono">
                <span className="text-yellow-300 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-yellow-400" />
                  <span>Custom Timings (Max 3): 2.50 AED</span>
                </span>
                <span className="text-yellow-400/80 bg-black/60 px-2 py-0.5 rounded border border-yellow-500/30">
                  50 Fils / Timing
                </span>
              </div>
              <p className="text-3xs text-yellow-100/90 leading-tight">
                Standard treats are <strong>2.00 AED</strong>. Choose up to 3 custom feeding times for <strong>2.50 AED</strong>!
              </p>
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  setIsTreatModalOpen(true);
                }}
                className="w-full py-2 px-3 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-300 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center justify-between cursor-pointer shadow-md vip-gold-bevel active:scale-[0.98]"
              >
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                  <span>⏰ Choose Treat Times (Max 3)</span>
                </div>
                <span className="text-3xs font-mono font-black text-slate-950 bg-yellow-100/60 px-1.5 py-0.2 rounded">
                  2.50 AED →
                </span>
              </button>
            </div>
          )}

          {/* One-Time Purchase Status Card for A Card */}
          {alreadyOwnsACard && userACard && (
            <div className="mb-3.5 p-3 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-[#181308] to-yellow-950/40 border border-emerald-500/50 space-y-2 shadow-inner">
              <div className="flex items-center justify-between text-3xs font-black font-mono">
                <span className="text-emerald-300 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  <span>One-Time Purchase Complete</span>
                </span>
                <span className="text-yellow-300 bg-black/70 px-2 py-0.5 rounded border border-yellow-500/40">
                  {userACard.status === 'active' ? 'Card Active' : 'Order Placed'}
                </span>
              </div>
              <p className="text-3xs text-yellow-100/90 leading-tight">
                {userACard.status === 'active'
                  ? `You already bought your Official A Card (${userACard.cardNumber})! Your balance is ${userACard.balanceAed.toFixed(2)} AED. You do not need to buy again.`
                  : `You already placed Order #${userACard.orderId || ''} for 1.00 AED. Send it to Abdul to start working. You do not need to buy again.`}
              </p>
            </div>
          )}

          {/* Description */}
          <p className="text-xs text-yellow-100/90 font-normal leading-relaxed mb-3.5">
            {deal.description}
          </p>

          {/* Original Request Prompt Reference */}
          {deal.originalText && (
            <div className="mb-3.5 px-3 py-1.5 rounded-xl bg-black/80 border border-yellow-500/25 text-3xs font-mono text-yellow-400/70 flex items-center justify-between shadow-inner">
              <span className="text-yellow-500/50 font-bold">VIP Decree:</span>
              <span className="italic text-yellow-200 truncate max-w-[190px]" title={deal.originalText}>
                "{deal.originalText}"
              </span>
            </div>
          )}
        </div>

        {/* Bottom Pricing & Actions */}
        <div className="pt-3.5 border-t border-yellow-500/25 mt-auto">
          <div className="flex items-end justify-between mb-3.5">
            <div>
              <div className="text-3xs font-black uppercase tracking-wider text-yellow-400/90 flex items-center justify-between gap-1.5 font-mono">
                <span className="flex items-center gap-1">
                  <Coins className="w-3 h-3 text-yellow-400" />
                  <span>24K VIP Price</span>
                </span>
                {isStoreUnlocked && onEditDeal && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      onEditDeal(deal);
                    }}
                    className="px-1.5 py-0.2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-3xs rounded flex items-center gap-0.5 shadow-sm transition-all cursor-pointer"
                    title="Click to edit price"
                  >
                    <Edit3 className="w-2.5 h-2.5" />
                    <span>Change</span>
                  </button>
                )}
              </div>
              <div 
                className={`flex items-baseline gap-1 mt-0.5 ${isStoreUnlocked && onEditDeal ? 'cursor-pointer hover:opacity-80' : ''}`}
                onClick={() => {
                  if (isStoreUnlocked && onEditDeal) {
                    sound.playClick();
                    onEditDeal(deal);
                  }
                }}
              >
                <span className="text-2xl sm:text-3xl font-black text-yellow-400 font-mono drop-shadow-md tracking-tight">
                  {deal.priceAed < 1 ? `${formatted.fils} Fils` : `${deal.priceAed.toFixed(2)}`}
                </span>
                {deal.priceAed >= 1 && (
                  <span className="text-xs font-black text-yellow-200 font-mono">
                    AED
                  </span>
                )}
              </div>
              <div className="text-3xs text-yellow-500/70 font-bold font-mono">
                {formatted.detailed}
              </div>
            </div>

            {/* Stepper / Coming Soon indicator / Already Owned Badge */}
            {alreadyOwnsACard && userACard ? (
              <div className="px-3 py-1 bg-emerald-500/15 border border-emerald-400/50 rounded-xl text-3xs font-black text-emerald-300 flex items-center gap-1 font-mono">
                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                <span>Owned</span>
              </div>
            ) : deal.isComingSoon ? (
              <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/40 rounded-xl text-3xs font-bold text-yellow-300 flex items-center gap-1 font-mono">
                <span>⏳</span>
                <span>VIP Drop</span>
              </div>
            ) : quantityInCart === 0 ? (
              <div className="flex items-center gap-1 bg-black/90 border border-yellow-500/50 rounded-xl p-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedQty(Math.max(1, selectedQty - 1));
                  }}
                  className="w-8 h-8 rounded-lg bg-[#221808] hover:bg-[#32230c] active:scale-90 text-yellow-200 flex items-center justify-center text-xs font-bold transition-all cursor-pointer select-none border border-yellow-500/30"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-xs font-black text-white font-mono select-none">
                  {selectedQty}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedQty(selectedQty + 1);
                  }}
                  className="w-8 h-8 rounded-lg bg-[#221808] hover:bg-[#32230c] active:scale-90 text-yellow-200 flex items-center justify-center text-xs font-bold transition-all cursor-pointer select-none border border-yellow-500/30"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-yellow-500/20 border-2 border-yellow-400/60 rounded-xl p-1 shadow-md">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onUpdateCartQty(deal.id, -1);
                  }}
                  className="w-8 h-8 rounded-lg bg-black hover:bg-[#1a1408] active:scale-90 text-yellow-300 flex items-center justify-center text-xs font-bold cursor-pointer transition-all select-none border border-yellow-500/40"
                  aria-label="Decrease cart quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-xs font-black text-yellow-300 font-mono select-none">
                  {quantityInCart}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    sound.playCoin();
                    onUpdateCartQty(deal.id, 1);
                  }}
                  className="w-8 h-8 rounded-lg bg-black hover:bg-[#1a1408] active:scale-90 text-yellow-300 flex items-center justify-center text-xs font-bold cursor-pointer transition-all select-none border border-yellow-500/40"
                  aria-label="Increase cart quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Action Button */}
          {alreadyOwnsACard && userACard ? (
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                if (onOpenAccountModal) {
                  onOpenAccountModal();
                } else {
                  window.dispatchEvent(new CustomEvent('abdul_open_account_modal_acard'));
                }
              }}
              className="w-full py-3 px-4 min-h-[46px] rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl select-none bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-300 text-slate-950 vip-gold-bevel active:scale-[0.98]"
            >
              <CreditCard className="w-4 h-4 text-slate-950" />
              <span>
                {userACard.status === 'active'
                  ? `Manage A Card in Hub (${userACard.balanceAed.toFixed(2)} AED) →`
                  : 'View Order & Send to Abdul →'}
              </span>
            </button>
          ) : deal.isComingSoon ? (
            <div className="w-full py-2.5 px-3 min-h-[44px] rounded-xl font-bold text-xs bg-[#181308] border border-yellow-500/40 text-yellow-300 flex items-center justify-center gap-2 select-none font-mono">
              <span>⏳</span>
              <span>Chai Coming Soon ({deal.priceAed.toFixed(2)} AED / cup)</span>
            </div>
          ) : quantityInCart === 0 ? (
            <button
              type="button"
              onClick={handleAdd}
              className={`w-full py-3 px-4 min-h-[46px] rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl select-none active:scale-[0.98] ${
                justAdded
                  ? 'bg-emerald-500 text-slate-950 scale-95'
                  : 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-yellow-400 text-slate-950 shadow-yellow-500/25 vip-gold-bevel'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>Added to VIP Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-slate-950" />
                  <span>Add to VIP Cart ({((deal.priceAed * selectedQty)).toFixed(2)} AED)</span>
                </>
              )}
            </button>
          ) : (
            <div className="w-full py-3 px-3 min-h-[46px] bg-[#140f06] border-2 border-yellow-400/60 rounded-xl flex items-center justify-between text-xs font-bold text-yellow-300 select-none shadow-md">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>In VIP Cart ({quantityInCart}x)</span>
              </span>
              <span className="font-mono text-white font-black text-sm">
                {(deal.priceAed * quantityInCart).toFixed(2)} AED
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mega Base Tour Modal */}
      {isMegaBaseDeal && (
        <MegaBaseTourModal
          isOpen={isTourModalOpen}
          onClose={() => setIsTourModalOpen(false)}
          deal={deal}
          onAddToCart={onAddToCart}
        />
      )}

      {/* Cat Treat Timing Scheduler & Confirmation Modal */}
      {isTreatDeal && (
        <CatTreatModal
          isOpen={isTreatModalOpen}
          onClose={() => setIsTreatModalOpen(false)}
          deal={deal}
          onConfirmAddToCart={(treatDeal, qty, timings, customPrice) => {
            onAddToCart(treatDeal, qty, timings, customPrice);
            setJustAdded(true);
            setTimeout(() => setJustAdded(false), 1400);
          }}
        />
      )}
    </>
  );
};

