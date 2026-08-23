import React, { useState, useMemo } from 'react';
import {
  Crown,
  Lightbulb,
  Sparkles,
  Plus,
  Check,
  Search,
  Flame,
  Coins,
  TrendingUp,
  Shuffle,
  Zap,
  Filter,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Tag,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Trash2,
  BookmarkPlus,
  Star,
  Layers,
  FolderPlus
} from 'lucide-react';
import { DealIdea, getAllDealIdeas, saveCustomDealIdea, deleteCustomDealIdea } from '../data/dealIdeasData';
import { sound } from '../utils/audio';
import { formatAedCurrency } from '../utils/formatters';

interface OwnerIdeaVaultProps {
  onAddIdeaToCatalog: (idea: DealIdea) => void;
  existingDealTitles?: string[];
  onOpenEditDealModal?: (defaultCategory?: string) => void;
  onSelectCategory?: (categoryId: string) => void;
}

export const OwnerIdeaVault: React.FC<OwnerIdeaVaultProps> = ({
  onAddIdeaToCatalog,
  existingDealTitles = [],
  onOpenEditDealModal,
  onSelectCategory,
}) => {
  const [ideas, setIdeas] = useState<DealIdea[]>(() => getAllDealIdeas());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [highlightedIdeaId, setHighlightedIdeaId] = useState<string | null>(null);
  
  // Custom Idea Form State
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState('rivals');
  const [customPrice, setCustomPrice] = useState<number>(3.5);
  const [customUnit, setCustomUnit] = useState('per task');
  const [customEmoji, setCustomEmoji] = useState('💡');
  const [customTag, setCustomTag] = useState('VIP Deal');
  const [customDesc, setCustomDesc] = useState('');
  const [customWhy, setCustomWhy] = useState('');
  const [customTier, setCustomTier] = useState<'budget' | 'standard' | 'premium' | 'legendary'>('standard');
  const [createSuccessMsg, setCreateSuccessMsg] = useState('');

  const refreshIdeas = () => {
    setIdeas(getAllDealIdeas());
  };

  const categories = [
    { id: 'all', name: 'All Ideas', emoji: '💡' },
    { id: 'rivals', name: 'Rivals & Gaming', emoji: '🎮' },
    { id: 'room', name: 'Room Care & Chores', emoji: '🛏️' },
    { id: 'food', name: 'Snacks & Buns', emoji: '🥪' },
    { id: 'drinks', name: 'Drinks & Karak', emoji: '🧋' },
    { id: 'minecraft', name: 'OP Survival', emoji: '⛏️' },
  ];

  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      const matchesCat = selectedCategory === 'all' || idea.categoryId === selectedCategory;
      const matchesTier = selectedTier === 'all' || idea.tier === selectedTier;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q ||
        idea.title.toLowerCase().includes(q) ||
        idea.description.toLowerCase().includes(q) ||
        idea.tag.toLowerCase().includes(q) ||
        idea.whyItWorks.toLowerCase().includes(q) ||
        (idea.profitTag && idea.profitTag.toLowerCase().includes(q));
      return matchesCat && matchesTier && matchesQuery;
    });
  }, [ideas, selectedCategory, selectedTier, searchQuery]);

  const totalPotentialAed = useMemo(() => {
    return ideas.reduce((acc, curr) => acc + curr.priceAed, 0);
  }, [ideas]);

  const handleAdd = (idea: DealIdea) => {
    sound.playCashRegister();
    onAddIdeaToCatalog(idea);
    setAddedIds((prev) => new Set([...prev, idea.id]));
  };

  const handleRollRandom = () => {
    sound.playVipFanfare();
    const randomIndex = Math.floor(Math.random() * ideas.length);
    const randomIdea = ideas[randomIndex];
    setSelectedCategory('all');
    setSelectedTier('all');
    setSearchQuery('');
    setHighlightedIdeaId(randomIdea.id);

    setTimeout(() => {
      const el = document.getElementById(`vault-idea-${randomIdea.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  const handleSaveCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) {
      sound.playError();
      return;
    }

    const catInfo = categories.find((c) => c.id === customCategory);
    const saved = saveCustomDealIdea({
      categoryId: customCategory,
      categoryName: catInfo ? catInfo.name : 'Custom Services',
      title: customTitle.trim(),
      priceAed: Number(customPrice) || 3.0,
      unit: customUnit.trim() || 'per item',
      emoji: customEmoji.trim() || '💡',
      tag: customTag.trim() || 'Owner Special',
      description: customDesc.trim() || `Custom crafted deal: ${customTitle.trim()}`,
      whyItWorks: customWhy.trim() || 'Tailored to immediate customer requests and high demand.',
      tier: customTier,
      profitTag: '⭐ Owner Custom',
      estimatedTime: '15 mins',
    });

    sound.playCashRegister();
    refreshIdeas();
    setCreateSuccessMsg(`✓ Saved idea "${saved.title}" to Idea Vault!`);
    setCustomTitle('');
    setCustomDesc('');
    setCustomWhy('');
    setIsCreatingCustom(false);
    setTimeout(() => setCreateSuccessMsg(''), 3500);
  };

  const handleDeleteCustom = (id: string, title: string) => {
    sound.playClick();
    if (confirm(`Remove custom idea "${title}" from vault?`)) {
      deleteCustomDealIdea(id);
      refreshIdeas();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1b1406] via-[#100c04] to-[#080602] border-2 border-yellow-400/80 p-4 sm:p-7 shadow-2xl mb-8 ring-1 ring-yellow-400/30 vip-gold-bevel">
      
      {/* Background Lighting */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-amber-500/[0.15] rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-yellow-400/[0.12] rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>

      <div className="relative z-10 space-y-6">
        
        {/* Top Header & Owner Badge */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-yellow-500/25 pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 text-3xs sm:text-xs font-black shadow-lg uppercase font-mono vip-gold-bevel">
                <Crown className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                <span>👑 2015 OWNER IDEA VAULT</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-yellow-400/15 border border-yellow-400/40 text-yellow-300 text-3xs font-black uppercase font-mono">
                {ideas.length}+ READY-TO-ADD IDEAS
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-3xs font-black uppercase font-mono">
                1-CLICK LIVE PUBLISHING
              </span>
            </div>

            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span className="bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-300 bg-clip-text text-transparent drop-shadow-md">
                So Many Deals & Expansion Ideas To Add
              </span>
              <span>💡</span>
            </h2>

            <p className="text-xs sm:text-sm text-yellow-100/80 font-medium max-w-3xl leading-relaxed">
              Welcome Abdul Owner! Here is your exclusive brainstorm vault packed with high-margin gaming carries, 5-star room care, viral Dubai snacks, iced drinks, and OP Survival kits. Click <strong>"⚡ + Add to Store Instantly"</strong> on any card to publish it immediately to your live customer store!
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleRollRandom}
              className="py-2.5 px-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl active:scale-95 transition-all flex items-center gap-2 cursor-pointer font-mono vip-gold-bevel"
              title="Pick a random high-profit deal idea"
            >
              <Shuffle className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>🎲 Roll Golden Idea</span>
            </button>

            <button
              onClick={() => {
                sound.playPop();
                setIsCreatingCustom(!isCreatingCustom);
              }}
              className="py-2.5 px-3.5 bg-[#20180b] hover:bg-[#2e2310] text-yellow-300 border border-yellow-400/50 hover:border-yellow-300 font-black text-xs sm:text-sm rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <BookmarkPlus className="w-4 h-4 text-yellow-400" />
              <span>{isCreatingCustom ? 'Close Creator' : '+ Write Custom Idea'}</span>
              {isCreatingCustom ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Live Metrics Stat Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
          <div className="p-3 rounded-2xl bg-black/60 border border-yellow-500/30 flex items-center gap-3 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-300 to-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shrink-0">
              💡
            </div>
            <div>
              <div className="text-base sm:text-lg font-black text-white">{ideas.length} Ideas</div>
              <div className="text-3xs text-yellow-300/80 uppercase font-bold font-mono">Curated Vault</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/60 border border-yellow-500/30 flex items-center gap-3 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center font-black text-lg shrink-0">
              💰
            </div>
            <div>
              <div className="text-base sm:text-lg font-black text-emerald-300">{totalPotentialAed.toFixed(2)} AED</div>
              <div className="text-3xs text-emerald-300/80 uppercase font-bold font-mono">Total Potential Value</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/60 border border-yellow-500/30 flex items-center gap-3 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 text-slate-950 flex items-center justify-center font-black text-lg shrink-0">
              📁
            </div>
            <div>
              <div className="text-base sm:text-lg font-black text-sky-300">5 Main Categories</div>
              <div className="text-3xs text-sky-300/80 uppercase font-bold font-mono">Gaming • Room • Food</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/60 border border-yellow-500/30 flex items-center gap-3 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-400 to-purple-600 text-slate-950 flex items-center justify-center font-black text-lg shrink-0">
              ⚡
            </div>
            <div>
              <div className="text-base sm:text-lg font-black text-fuchsia-300">{addedIds.size} Added</div>
              <div className="text-3xs text-fuchsia-300/80 uppercase font-bold font-mono">Live In Store</div>
            </div>
          </div>
        </div>

        {createSuccessMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-black font-mono flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{createSuccessMsg}</span>
          </div>
        )}

        {/* Collapsible Write Custom Idea Form */}
        {isCreatingCustom && (
          <form
            onSubmit={handleSaveCustomSubmit}
            className="p-4 sm:p-5 rounded-2xl bg-[#150f06] border-2 border-yellow-400/70 space-y-4 shadow-xl animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between border-b border-yellow-500/20 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-mono">
                    Create & Save Your Own Idea to Vault
                  </h3>
                  <p className="text-3xs text-yellow-300/80">
                    Write down any new chore, game carry, snack or custom service you thought of!
                  </p>
                </div>
              </div>
              <span className="text-3xs bg-yellow-400 text-slate-950 font-black px-2 py-0.5 rounded font-mono">
                Owner Creator
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-3xs font-bold text-yellow-300 uppercase tracking-wider mb-1">
                  Idea Title:
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Roblox Murder Mystery 2 Godly Weapon Trading"
                  className="w-full px-3.5 py-2.5 bg-black/70 border border-yellow-500/40 focus:border-yellow-400 rounded-xl text-xs text-white placeholder-yellow-600/60 focus:outline-none font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-3xs font-bold text-yellow-300 uppercase tracking-wider mb-1">
                  Category:
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black/70 border border-yellow-500/40 focus:border-yellow-400 rounded-xl text-xs text-yellow-300 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="rivals">🎮 Rivals & Gaming</option>
                  <option value="room">🛏️ Room Care & Chores</option>
                  <option value="food">🥪 Food & Snacks</option>
                  <option value="drinks">🧋 Drinks & Karak</option>
                  <option value="minecraft">⛏️ OP Survival Minecraft</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-3xs font-bold text-yellow-300 uppercase tracking-wider mb-1">
                  Price in AED:
                </label>
                <input
                  type="number"
                  step="0.25"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-black/70 border border-yellow-500/40 rounded-xl text-xs font-mono font-black text-yellow-300 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-3xs font-bold text-yellow-300 uppercase tracking-wider mb-1">
                  Unit / Measurement:
                </label>
                <input
                  type="text"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  placeholder="per 30 mins / per item"
                  className="w-full px-3 py-2 bg-black/70 border border-yellow-500/40 rounded-xl text-xs text-white focus:outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold text-yellow-300 uppercase tracking-wider mb-1">
                  Emoji Icon:
                </label>
                <input
                  type="text"
                  value={customEmoji}
                  onChange={(e) => setCustomEmoji(e.target.value)}
                  className="w-full px-3 py-2 bg-black/70 border border-yellow-500/40 rounded-xl text-center text-sm text-white focus:outline-none"
                  maxLength={4}
                />
              </div>

              <div>
                <label className="block text-3xs font-bold text-yellow-300 uppercase tracking-wider mb-1">
                  Sticker Tag:
                </label>
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder="e.g. 🔥 HOT DEAL"
                  className="w-full px-3 py-2 bg-black/70 border border-yellow-500/40 rounded-xl text-xs text-white focus:outline-none font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-3xs font-bold text-yellow-300 uppercase tracking-wider mb-1">
                Description (What customer gets):
              </label>
              <textarea
                rows={2}
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                placeholder="Explain what Abdul does for the customer in detail..."
                className="w-full px-3 py-2 bg-black/70 border border-yellow-500/40 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-3xs font-bold text-yellow-300 uppercase tracking-wider mb-1">
                Why this makes big AED / Why it works:
              </label>
              <input
                type="text"
                value={customWhy}
                onChange={(e) => setCustomWhy(e.target.value)}
                placeholder="e.g. Friends always ask for help with this game—easy 5 AED profit!"
                className="w-full px-3 py-2 bg-black/70 border border-yellow-500/40 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreatingCustom(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-yellow-300/80 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer font-mono"
              >
                ✓ Save To Idea Vault
              </button>
            </div>
          </form>
        )}

        {/* Filter Controls Bar */}
        <div className="space-y-3 bg-[#120d04] p-3.5 sm:p-4 rounded-2xl border border-yellow-500/30">
          
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = cat.id === 'all'
                ? ideas.length
                : ideas.filter((i) => i.categoryId === cat.id).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    sound.playPop();
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-3xs sm:text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-yellow-400 text-slate-950 border-yellow-300 shadow-md ring-1 ring-yellow-400'
                      : 'bg-black/60 text-yellow-200/80 border-yellow-500/30 hover:border-yellow-400 hover:text-white'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.name}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-3xs font-mono ${isSelected ? 'bg-slate-950 text-yellow-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Tier Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-400/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ideas by name, game, treat, karak, profit..."
                className="w-full pl-9 pr-4 py-2 bg-black/70 border border-yellow-500/30 focus:border-yellow-400 rounded-xl text-xs text-white placeholder-yellow-500/40 focus:outline-none font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-3xs text-yellow-400/70 hover:text-white font-mono"
                >
                  CLEAR
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => {
                  sound.playPop();
                  setSelectedTier(selectedTier === 'legendary' ? 'all' : 'legendary');
                }}
                className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-3xs font-black uppercase font-mono transition-all cursor-pointer border ${
                  selectedTier === 'legendary'
                    ? 'bg-amber-400 text-slate-950 border-yellow-300'
                    : 'bg-black/60 text-amber-300/80 border-yellow-500/30 hover:border-yellow-400'
                }`}
              >
                👑 Legendary (High AED)
              </button>

              <button
                onClick={() => {
                  sound.playPop();
                  setSelectedTier(selectedTier === 'standard' ? 'all' : 'standard');
                }}
                className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-3xs font-black uppercase font-mono transition-all cursor-pointer border ${
                  selectedTier === 'standard'
                    ? 'bg-yellow-400 text-slate-950 border-yellow-300'
                    : 'bg-black/60 text-yellow-300/80 border-yellow-500/30 hover:border-yellow-400'
                }`}
              >
                ⚡ Fast Daily Bestsellers
              </button>
            </div>
          </div>
        </div>

        {/* Ideas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 max-h-[680px] overflow-y-auto pr-1.5 scrollbar-thin">
          {filteredIdeas.map((idea) => {
            const isAdded = addedIds.has(idea.id);
            const isHighlighted = highlightedIdeaId === idea.id;

            return (
              <div
                key={idea.id}
                id={`vault-idea-${idea.id}`}
                className={`relative rounded-2xl bg-gradient-to-b from-[#161007] to-[#0d0903] border p-4 sm:p-5 flex flex-col justify-between gap-3.5 transition-all duration-300 hover:scale-[1.02] shadow-xl group ${
                  isHighlighted
                    ? 'border-yellow-300 ring-2 ring-yellow-400 bg-amber-950/40 shadow-yellow-500/30'
                    : isAdded
                    ? 'border-emerald-500/60 bg-emerald-950/15'
                    : 'border-yellow-500/35 hover:border-yellow-400/80'
                }`}
              >
                {/* Top Badges */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-3xs font-black uppercase tracking-wider text-yellow-400 font-mono flex items-center gap-1">
                      <span>{idea.categoryName}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      {idea.profitTag && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/30 text-amber-300 text-3xs font-black font-mono">
                          {idea.profitTag}
                        </span>
                      )}
                      {idea.highlight && (
                        <span className="px-2 py-0.5 rounded-md bg-yellow-400/20 text-yellow-300 text-3xs font-black border border-yellow-400/40">
                          {idea.highlight}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Emoji */}
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-yellow-300/20 via-amber-400/10 to-yellow-500/20 border border-yellow-400/40 flex items-center justify-center text-2xl shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                      {idea.emoji}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm sm:text-base font-black text-white group-hover:text-yellow-300 transition-colors leading-snug">
                        {idea.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs sm:text-sm font-black font-mono text-yellow-300">
                          {idea.priceAed.toFixed(2)} AED
                        </span>
                        <span className="text-3xs text-yellow-200/60 font-medium">
                          • {idea.unit}
                        </span>
                        {idea.estimatedTime && (
                          <span className="text-3xs text-slate-400 flex items-center gap-0.5 font-mono">
                            <Clock className="w-2.5 h-2.5" />
                            {idea.estimatedTime}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-yellow-100/75 leading-relaxed mb-3">
                    {idea.description}
                  </p>

                  {/* Why it works / Selling Insight Box */}
                  <div className="p-2.5 rounded-xl bg-black/60 border border-yellow-500/20 text-3xs text-yellow-200/90 leading-relaxed flex items-start gap-1.5 mb-2">
                    <Lightbulb className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black text-yellow-300 font-mono">WHY IT SELLS: </span>
                      <span>{idea.whyItWorks}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom 1-Click Add Action */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-yellow-500/20">
                  {idea.isCustom && (
                    <button
                      onClick={() => handleDeleteCustom(idea.id, idea.title)}
                      className="p-2 bg-rose-950/40 hover:bg-rose-900 text-rose-400 rounded-xl text-3xs transition-colors border border-rose-500/30 cursor-pointer"
                      title="Delete Custom Idea"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleAdd(idea)}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95 ${
                      isAdded
                        ? 'bg-emerald-400 text-slate-950 border border-emerald-300 shadow-emerald-500/25'
                        : 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-300 text-slate-950 border border-yellow-200 vip-gold-bevel'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                        <span>✓ Added To Live Store!</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                        <span>⚡ + Add to Store Instantly</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Summary / Prompt */}
        <div className="p-4 rounded-2xl bg-black/60 border border-yellow-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center font-black">
              ✨
            </div>
            <div>
              <div className="text-xs font-black text-white">
                Want to create a custom deal from scratch with specific items?
              </div>
              <div className="text-3xs text-yellow-300/80 font-medium">
                Open the Add Deal Studio to configure prices, units, images and custom tags.
              </div>
            </div>
          </div>

          {onOpenEditDealModal && (
            <button
              onClick={() => {
                sound.playCashRegister();
                onOpenEditDealModal('rivals');
              }}
              className="px-4 py-2 bg-gradient-to-r from-yellow-300 to-amber-400 hover:from-yellow-200 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer font-mono active:scale-95"
            >
              + Open Deal Creator Studio →
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
