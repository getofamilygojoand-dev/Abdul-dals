import React from 'react';
import { DealItem, CartItem, AuthorizedPerson } from '../types';
import { DealCard } from './DealCard';
import { Sparkles, Plus, Layers, Crown, Flame } from 'lucide-react';
import { sound } from '../utils/audio';
import { DealVisual } from './DealVisual';
import { getCategoryBackground } from '../utils/dealVisuals';
import { UserAccount } from '../utils/userAccounts';

interface CategorySectionProps {
  categoryId: string;
  categoryName: string;
  categoryEmoji: string;
  subEmoji?: string;
  badge: string;
  description: string;
  gradient: string;
  deals: DealItem[];
  cartItems: CartItem[];
  onAddToCart: (deal: DealItem, qty: number, treatTimings?: string[], customPrice?: number) => void;
  onUpdateCartQty: (dealId: string, delta: number) => void;
  currentUser?: AuthorizedPerson | null;
  onEditDeal?: (deal: DealItem) => void;
  onAddDealToCategory?: (categoryId: string) => void;
  isStoreUnlocked?: boolean;
  activeAccount?: UserAccount | null;
  onOpenAccountModal?: () => void;
}

const CATEGORY_TAGLINES: Record<string, string> = {
  rivals: 'RPG Bazooka, Tactical AK-47 & Roblox Rivals Arena',
  room: 'Clean Made Beds, Scrub Brushes & Spotless Doors',
  food: 'Crispy Burgers, Golden Toasts & Rich Nutella Jars',
  drinks: 'Chilled Lemonade, Spiced Karak Chai & Fresh Green Tea',
  minecraft: 'Diamond Pickaxe, Netherite Axe, Sword, Mace & Voxel Blocks',
  cats: 'Fluffy Cats, Spotless Cat Litter & Gourmet Pet Treats',
  fisch: 'Leviathans, Fang Rod, Scylla, Crystallized Dragon, Calm Zone & Streaks',
};

export const CategorySection: React.FC<CategorySectionProps> = ({
  categoryId,
  categoryName,
  categoryEmoji,
  subEmoji,
  badge,
  description,
  deals,
  cartItems,
  onAddToCart,
  onUpdateCartQty,
  currentUser,
  onEditDeal,
  onAddDealToCategory,
  isStoreUnlocked = false,
  activeAccount,
  onOpenAccountModal,
}) => {
  const bgImage = getCategoryBackground(categoryId);
  const tagline = CATEGORY_TAGLINES[categoryId] || '';

  return (
    <section 
      id={`section-${categoryId}`} 
      className="mb-14 sm:mb-20 scroll-mt-28 relative rounded-3xl border-2 border-yellow-500/40 overflow-hidden shadow-2xl p-5 sm:p-7 lg:p-8 bg-[#0c0803] transition-all hover:border-yellow-400/70 ring-1 ring-yellow-400/20"
    >
      {/* Thematic Background Image with Dark Gradient & Vignette Overlay */}
      {bgImage && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <img
            src={bgImage}
            alt={`${categoryName} background`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-45 sm:opacity-55 scale-105 filter brightness-90 contrast-105"
            loading="lazy"
          />
          {/* Multi-layered dark gradients to guarantee text legibility while preserving vivid colors */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0803] via-[#0c0803]/85 to-[#0e0a04]/85"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c0803]/95 via-[#0c0803]/40 to-[#0c0803]/95"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,179,8,0.25),transparent_70%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.2),transparent_70%)]"></div>
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-yellow-400/70 to-transparent"></div>
        </div>
      )}

      <div className="relative z-10">
        {/* VIP Category Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 pb-4 border-b-2 border-yellow-500/30">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="text-3xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 font-mono flex items-center gap-1.5 shadow-md vip-gold-bevel">
                <Crown className="w-3 h-3 text-slate-950 fill-slate-950" />
                {badge}
              </span>

              {tagline && (
                <span className="text-3xs font-bold text-yellow-200/90 bg-black/80 px-3 py-1 rounded-full border border-yellow-500/30 backdrop-blur-md shadow-inner">
                  {tagline}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3.5">
              <DealVisual 
                categoryKey={categoryId as any} 
                size="lg" 
                className="border-2 border-yellow-400 shadow-2xl ring-2 ring-yellow-400/40"
              />
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                    <span className="bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-300 bg-clip-text text-transparent drop-shadow-md font-black">
                      {categoryName}
                    </span>
                  </h2>
                  <div className="text-xl sm:text-2xl flex items-center gap-1 select-none drop-shadow-sm">
                    <span>{categoryEmoji}</span>
                    {subEmoji && <span>{subEmoji}</span>}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-yellow-100/90 font-normal mt-1 max-w-2xl leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto shrink-0 mt-2 sm:mt-0">
            <div className="text-3xs sm:text-2xs font-black uppercase tracking-wider text-yellow-300 font-mono bg-black/90 px-3.5 py-1.5 rounded-xl border border-yellow-500/40 shadow-inner">
              {deals.length} VIP Item{deals.length > 1 ? 's' : ''}
            </div>

            {isStoreUnlocked && onAddDealToCategory && (
              <button
                type="button"
                onClick={() => {
                  sound.playCashRegister();
                  onAddDealToCategory(categoryId);
                }}
                className="px-4 py-2 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-300 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer select-none active:scale-95 shadow-xl shadow-yellow-500/30 vip-gold-bevel"
              >
                <Plus className="w-3.5 h-3.5 text-slate-950" />
                <span>Add VIP Deal</span>
              </button>
            )}
          </div>
        </div>

        {/* Grid of Deal Cards */}
        {deals.length === 0 ? (
          <div className="p-8 bg-[#181308]/80 border border-yellow-500/30 rounded-2xl text-center text-yellow-300/70 text-xs backdrop-blur-md">
            No active VIP deals in this section right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {deals.map((deal) => {
              const cartItem = cartItems.find((ci) => ci.deal.id === deal.id);
              const qtyInCart = cartItem ? cartItem.quantity : 0;

              return (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  quantityInCart={qtyInCart}
                  onAddToCart={onAddToCart}
                  onUpdateCartQty={onUpdateCartQty}
                  currentUser={currentUser}
                  onEditDeal={onEditDeal}
                  isStoreUnlocked={isStoreUnlocked}
                  activeAccount={activeAccount}
                  onOpenAccountModal={onOpenAccountModal}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

