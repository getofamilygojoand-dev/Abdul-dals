import React, { useState, useMemo, useEffect } from 'react';
import { 
  Lightbulb, 
  Sparkles, 
  Plus, 
  Check, 
  Search, 
  Crown, 
  Flame, 
  Filter, 
  Coins, 
  ArrowRight,
  TrendingUp,
  Shuffle,
  Zap,
  Lock,
  KeyRound
} from 'lucide-react';
import { DealIdea, getAllDealIdeas } from '../data/dealIdeasData';
import { DealItem } from '../types';
import { formatAedCurrency } from '../utils/formatters';
import { sound } from '../utils/audio';
import { DealVisual } from './DealVisual';

interface DealIdeasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddIdeaToCatalog: (idea: DealIdea) => void;
  existingDealTitles: string[];
  isOwner2015?: boolean;
  onUnlockWithCode?: (code: string) => boolean;
}

export const DealIdeasModal: React.FC<DealIdeasModalProps> = ({
  isOpen,
  onClose,
  onAddIdeaToCatalog,
  existingDealTitles,
  isOwner2015 = false,
  onUnlockWithCode,
}) => {
  const [ideas, setIdeas] = useState<DealIdea[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [highlightedRandomIdeaId, setHighlightedRandomIdeaId] = useState<string | null>(null);
  const [passcodeAttempt, setPasscodeAttempt] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIdeas(getAllDealIdeas());
      setPasscodeAttempt('');
      setPasscodeError('');
    }
  }, [isOpen]);

  const categories = [
    { id: 'all', name: `All ${ideas.length || 30}+ Ideas`, emoji: '💡' },
    { id: 'rivals', name: 'Rivals Gaming', emoji: '🚀' },
    { id: 'room', name: 'Room Care', emoji: '🛏️' },
    { id: 'food', name: 'Snack Bar & Buns', emoji: '🥪' },
    { id: 'drinks', name: 'Drinks & Karak', emoji: '🧋' },
    { id: 'minecraft', name: 'OP Survival', emoji: '⛏️' },
  ];

  const filteredIdeas = useMemo(() => {
    if (!isOpen) return [];
    return ideas.filter((idea) => {
      const matchesCat = selectedCategory === 'all' || idea.categoryId === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        idea.title.toLowerCase().includes(q) ||
        idea.description.toLowerCase().includes(q) ||
        idea.tag.toLowerCase().includes(q) ||
        idea.whyItWorks.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [isOpen, ideas, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = passcodeAttempt.trim();
    if (cleanCode === '2015') {
      sound.playVipFanfare();
      if (onUnlockWithCode) {
        onUnlockWithCode('2015');
      }
      setPasscodeError('');
    } else {
      sound.playError();
      setPasscodeError('Incorrect code. Store owner access only.');
    }
  };

  const handleAdd = (idea: DealIdea) => {
    sound.playCashRegister();
    onAddIdeaToCatalog(idea);
    setAddedIds((prev) => new Set([...prev, idea.id]));
  };

  const handleRollRandom = () => {
    sound.playPop();
    if (ideas.length === 0) return;
    const randomIndex = Math.floor(Math.random() * ideas.length);
    const randomIdea = ideas[randomIndex];
    setSelectedCategory('all');
    setSearchQuery('');
    setHighlightedRandomIdeaId(randomIdea.id);
    
    // Scroll to element if possible
    setTimeout(() => {
      const el = document.getElementById(`idea-card-${randomIdea.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-b from-[#1c1508] via-[#140f06] to-[#0c0904] border-2 border-yellow-500/40 rounded-3xl shadow-2xl shadow-yellow-950/60 flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-yellow-500/25 relative z-10 flex items-start justify-between gap-4 bg-[#181207]/90">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-3xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 font-mono">
                <Crown className="w-3 h-3 text-yellow-400" />
                <span>👑 OWNER IDEA VAULT (EXCLUSIVE)</span>
              </span>
              <span className="text-3xs font-mono text-yellow-400/60 hidden sm:inline">
                • Strictly for Store Owner
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 font-mono">
              <span className="bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-400 bg-clip-text text-transparent">
                50+ Ready Catalog Deal Ideas to Add
              </span>
              <span className="text-xl">💡</span>
            </h2>

            <p className="text-xs sm:text-sm text-yellow-100/75 mt-1 max-w-2xl font-normal">
              Browse gaming boosts, 5-star room resets, snack favorites, and iced karak. Click <strong>"⚡ + Add to Store"</strong> on any idea to instantly publish it to your live customer catalog!
            </p>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-black/60 hover:bg-yellow-400 hover:text-slate-950 text-yellow-300 border border-yellow-500/30 flex items-center justify-center text-sm font-bold transition-all cursor-pointer shrink-0"
            aria-label="Close ideas modal"
          >
            ✕
          </button>
        </div>

        {/* 🔒 Passcode Lock Gate if not logged in as owner */}
        {!isOwner2015 ? (
          <div className="p-8 sm:p-12 text-center space-y-5 max-w-md mx-auto my-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-slate-950 mx-auto shadow-xl vip-gold-bevel">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white uppercase font-mono">
                👑 Owner Passcode Required
              </h3>
              <p className="text-xs text-yellow-200/75 leading-relaxed">
                The 50+ Deal Idea Vault is strictly reserved for store owner Abdul. Enter passcode to unlock all ideas.
              </p>
            </div>

            <form onSubmit={handlePasscodeSubmit} className="space-y-3">
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-400/60" />
                <input
                  type="password"
                  maxLength={10}
                  value={passcodeAttempt}
                  onChange={(e) => {
                    setPasscodeAttempt(e.target.value);
                    if (passcodeError) setPasscodeError('');
                  }}
                  placeholder="Enter Passcode..."
                  className="w-full pl-10 pr-4 py-3 bg-black/70 border-2 border-yellow-500/50 focus:border-yellow-400 rounded-xl text-sm font-mono text-center tracking-widest text-white placeholder-yellow-500/40 focus:outline-none"
                  autoFocus
                />
              </div>

              {passcodeError && (
                <div className="text-3xs font-bold text-rose-400 bg-rose-950/40 border border-rose-500/30 p-2 rounded-lg">
                  {passcodeError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 font-black text-xs font-mono uppercase tracking-wider rounded-xl shadow-lg vip-gold-bevel cursor-pointer active:scale-95 transition-all"
              >
                Unlock Idea Vault →
              </button>
            </form>
          </div>
        ) : (
          <>

        {/* Search, Filter Tabs & Random Generator Bar */}
        <div className="p-3 sm:p-4 bg-[#140f06] border-b border-yellow-500/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none no-scrollbar">
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border select-none ${
                    active
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-slate-950 border-yellow-300 shadow-md font-black'
                      : 'bg-[#1a1408] text-yellow-200/70 border-yellow-500/20 hover:border-yellow-400/40 hover:text-yellow-100'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Search & Randomizer */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-yellow-400/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter ideas..."
                className="w-full pl-8 pr-3 py-1.5 bg-black/60 border border-yellow-500/25 focus:border-yellow-400 rounded-xl text-xs text-yellow-100 placeholder-yellow-500/40 focus:outline-none"
              />
            </div>

            <button
              onClick={handleRollRandom}
              className="px-3 py-1.5 bg-[#201808] hover:bg-yellow-400 hover:text-slate-950 text-yellow-300 border border-yellow-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm"
              title="Pick a random idea"
            >
              <Shuffle className="w-3.5 h-3.5 text-yellow-400 group-hover:text-slate-950" />
              <span className="hidden sm:inline">Surprise Idea</span>
            </button>
          </div>
        </div>

        {/* Ideas Grid Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredIdeas.map((idea) => {
              const formatted = formatAedCurrency(idea.priceAed);
              const isAdded = addedIds.has(idea.id) || existingDealTitles.includes(idea.title);
              const isHighlighted = highlightedRandomIdeaId === idea.id;

              return (
                <div
                  key={idea.id}
                  id={`idea-card-${idea.id}`}
                  className={`relative p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                    isHighlighted 
                      ? 'bg-gradient-to-b from-[#2d220c] to-[#1a1408] border-yellow-400 shadow-xl shadow-yellow-500/30 ring-2 ring-yellow-400/50'
                      : 'bg-gradient-to-b from-[#181308]/90 to-[#100d05] border-yellow-500/20 hover:border-yellow-400/60 hover:shadow-lg'
                  }`}
                >
                  <div>
                    {/* Top Tag & Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-3xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-yellow-400/10 border border-yellow-400/30 text-yellow-300">
                          {idea.tag}
                        </span>
                        {idea.highlight && (
                          <span className="text-3xs font-black px-2 py-0.5 rounded-md bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-xs">
                            {idea.highlight}
                          </span>
                        )}
                      </div>

                      <span className="text-3xs font-mono text-yellow-400/60 uppercase font-bold">
                        {idea.categoryName}
                      </span>
                    </div>

                    {/* Title and Visual */}
                    <div className="flex items-start gap-3 mb-2.5">
                      <div className="relative shrink-0">
                        <DealVisual deal={idea as any} size="md" className="border-yellow-500/40" />
                        <span className="absolute -bottom-1 -right-1 text-xs bg-black/80 rounded-full px-1 border border-yellow-500/40 shadow-xs pointer-events-none">
                          {idea.emoji}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-black text-white leading-snug">
                          {idea.title}
                        </h4>
                        <span className="text-3xs font-bold text-yellow-400/70 font-mono">
                          {idea.unit}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-yellow-100/80 leading-relaxed mb-3">
                      {idea.description}
                    </p>

                    {/* Why this idea sells */}
                    <div className="p-2 rounded-xl bg-black/60 border border-yellow-500/15 text-3xs text-yellow-300/80 font-medium mb-3 flex items-start gap-1.5">
                      <Sparkles className="w-3 h-3 text-yellow-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-yellow-200">Why customers love it:</strong> {idea.whyItWorks}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Price & Add Action */}
                  <div className="pt-3 border-t border-yellow-500/20 flex items-center justify-between gap-3 mt-auto">
                    <div>
                      <div className="text-3xs font-bold uppercase tracking-wider text-yellow-500/60">
                        Suggested VIP Price
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-yellow-400 font-mono">
                          {idea.priceAed < 1 ? `${formatted.fils} Fils` : `${idea.priceAed.toFixed(2)}`}
                        </span>
                        {idea.priceAed >= 1 && (
                          <span className="text-xs font-black text-yellow-200">AED</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAdd(idea)}
                      disabled={isAdded}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all select-none active:scale-95 shadow-md ${
                        isAdded
                          ? 'bg-emerald-600/30 border border-emerald-400/50 text-emerald-300 cursor-default'
                          : 'bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-slate-950 cursor-pointer shadow-yellow-500/20'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Active in Catalog</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 text-slate-950" />
                          <span>Add to Store</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredIdeas.length === 0 && (
            <div className="p-8 text-center bg-black/40 border border-yellow-500/20 rounded-2xl">
              <p className="text-sm font-bold text-yellow-300 mb-1">No matching deal ideas</p>
              <p className="text-xs text-yellow-200/60">Try searching for "Noodles", "Carry", "Desk", or "God Armor".</p>
            </div>
          )}
        </div>

        {/* Modal Footer Summary */}
        <div className="p-4 bg-[#140f06] border-t border-yellow-500/25 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-yellow-200/70">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span>All ideas come pre-configured with UAE Dirham pricing & custom emojis!</span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2 bg-[#201808] hover:bg-[#2c220c] border border-yellow-500/30 text-yellow-300 rounded-xl font-bold cursor-pointer transition-all"
          >
            Done Browsing Ideas
          </button>
        </div>
      </>
    )}
      </div>
    </div>
  );
};
