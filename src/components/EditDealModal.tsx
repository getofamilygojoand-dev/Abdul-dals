import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Sparkles, 
  Trash2, 
  Coins, 
  Tag, 
  Layers, 
  FileText,
  AlertCircle,
  Crown
} from 'lucide-react';
import { DealItem } from '../types';
import { CATEGORIES } from '../data/dealsData';
import { formatAedCurrency } from '../utils/formatters';
import { sound } from '../utils/audio';
import { CategoryInfo, STICKER_PRESETS } from '../utils/categoryStorage';

interface EditDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealToEdit: DealItem | null; // If null, mode is "Create New Deal"
  defaultCategoryId?: string;
  categoriesList?: CategoryInfo[];
  activeStore?: 'abdul' | 'hamdaan';
  onSaveDeal: (dealItem: DealItem) => void;
  onDeleteDeal?: (dealId: string) => void;
  canDelete?: boolean;
}

const EMOJI_PRESETS = [
  '✨', '🐱', '🐾', '🧹', '🐟', '⛏️', '🛏️', '🔫', '🟤', '🟠', '🟡', '📦', '🟫', '🚀', 
  '🥪', '🍞', '🍫', '🍋', '🥤', '🍵', '☕', '🫖', '💰', '💎', 
  '👑', '🛡️', '⚡', '🔥', '🏆', '🍕', '🍔'
];

export const EditDealModal: React.FC<EditDealModalProps> = ({
  isOpen,
  onClose,
  dealToEdit,
  defaultCategoryId,
  categoriesList = CATEGORIES as CategoryInfo[],
  activeStore = 'abdul',
  onSaveDeal,
  onDeleteDeal,
  canDelete = true,
}) => {
  const isEditing = !!dealToEdit;

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<string>('rivals');
  const [priceAed, setPriceAed] = useState<string>('5');
  const [unit, setUnit] = useState('per item');
  const [emoji, setEmoji] = useState('✨');
  const [tag, setTag] = useState('VIP Deal');
  const [description, setDescription] = useState('');
  const [highlight, setHighlight] = useState('');
  const [tier, setTier] = useState<'budget' | 'standard' | 'premium' | 'legendary'>('standard');
  const [originalText, setOriginalText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setShowDeleteConfirm(false);
    if (dealToEdit) {
      setTitle(dealToEdit.title);
      setCategoryId(dealToEdit.categoryId);
      setPriceAed(dealToEdit.priceAed.toString());
      setUnit(dealToEdit.unit || 'per item');
      setEmoji(dealToEdit.emoji || '✨');
      setTag(dealToEdit.tag || 'VIP Deal');
      setDescription(dealToEdit.description || '');
      setHighlight(dealToEdit.highlight || '');
      setTier(dealToEdit.tier || 'standard');
      setOriginalText(dealToEdit.originalText || '');
    } else {
      // New deal initialization
      setTitle('');
      const validCategories = categoriesList.filter((c) => c.id !== 'all');
      const fallbackCatId = validCategories.length > 0 ? validCategories[0].id : 'rivals';
      const initialCatId = defaultCategoryId && validCategories.some((c) => c.id === defaultCategoryId)
        ? defaultCategoryId
        : fallbackCatId;
      setCategoryId(initialCatId);
      setPriceAed('5');
      setUnit('per order');
      setEmoji('✨');
      setTag('VIP Deal');
      setDescription('');
      setHighlight('');
      setTier('standard');
      setOriginalText('');
    }
    setErrorMsg('');
  }, [dealToEdit, defaultCategoryId, isOpen, categoriesList]);

  if (!isOpen) return null;

  const numPrice = parseFloat(priceAed) || 0;
  const formattedPreview = formatAedCurrency(numPrice);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Deal title is required.');
      return;
    }

    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMsg('Please enter a valid positive price in AED.');
      return;
    }

    const catInfo = categoriesList.find((c) => c.id === categoryId);
    const catName = catInfo ? catInfo.name : 'Abdul Deals';
    const storeOwnership = 'abdul';

    const savedDeal: DealItem = {
      id: dealToEdit ? dealToEdit.id : `deal-${Date.now()}`,
      categoryId: categoryId,
      categoryName: catName,
      store: storeOwnership,
      title: title.trim(),
      priceAed: numPrice,
      priceFormatted: formattedPreview.detailed,
      unit: unit.trim() || 'per order',
      emoji: emoji.trim() || '✨',
      tag: tag.trim() || 'VIP Deal',
      description: description.trim() || 'Special VIP service.',
      highlight: highlight.trim() || undefined,
      tier,
      originalText: originalText.trim() || undefined,
      isCustom: true,
    };

    sound.playCashRegister();
    onSaveDeal(savedDeal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl max-h-[94vh] flex flex-col bg-gradient-to-b from-[#181206] via-[#100c04] to-[#070502] border-2 border-yellow-500/40 rounded-2xl sm:rounded-3xl shadow-2xl shadow-yellow-950/80 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 my-auto text-slate-100 ring-1 ring-yellow-400/20">
        
        {/* VIP Gold Header */}
        <div className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 p-4 sm:p-5 text-slate-950 flex items-center justify-between shrink-0 shadow-lg vip-gold-bevel">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-slate-950 text-yellow-400 flex items-center justify-center text-lg sm:text-xl font-black shrink-0 border border-yellow-400/40 shadow-xl">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 fill-yellow-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-950">
                {isEditing ? `Edit VIP Service: ${dealToEdit?.title}` : 'Add New 24K VIP Deal'}
              </h2>
              <p className="text-3xs font-bold text-slate-950/80 uppercase tracking-wider">
                Configure UAE Dirham Pricing, VIP Badges, and Specifications
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-950/20 hover:bg-slate-950/40 flex items-center justify-center text-slate-950 transition-colors cursor-pointer active:scale-95 border border-slate-950/20"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-slate-950" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Category and Tier Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-2xs font-bold text-yellow-300 uppercase tracking-wider mb-1.5">
                Category:
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#181308] border border-yellow-500/30 focus:border-yellow-400 rounded-xl text-xs text-white font-bold focus:outline-none cursor-pointer"
              >
                {categoriesList
                  .filter((c) => c.id !== 'all')
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-2xs font-bold text-yellow-300 uppercase tracking-wider mb-1.5">
                Deal Tier / Quality:
              </label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-[#181308] border border-yellow-500/30 focus:border-yellow-400 rounded-xl text-xs text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="standard">Standard Deal</option>
                <option value="budget">Budget / Affordable</option>
                <option value="premium">VIP Premium Service</option>
                <option value="legendary">👑 Legendary Exclusive</option>
              </select>
            </div>
          </div>

          {/* Title and Emoji Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-2xs font-bold text-yellow-300 uppercase tracking-wider mb-1.5">
                Deal Title:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Daily Pass Boost / Nutella Bun Extra Hot"
                className="w-full px-3.5 py-2.5 bg-[#181308] border border-yellow-500/30 focus:border-yellow-400 rounded-xl text-xs text-white placeholder-yellow-500/40 focus:outline-none font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-2xs font-bold text-yellow-300 uppercase tracking-wider mb-1.5">
                Deal Icon / Emoji:
              </label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#181308] border border-yellow-500/30 focus:border-yellow-400 rounded-xl text-lg text-center text-white focus:outline-none"
                maxLength={4}
              />
            </div>
          </div>

          {/* Emoji Preset Quick Picks */}
          <div>
            <span className="text-3xs text-yellow-500/70 font-bold uppercase tracking-wider mb-1 block">
              Quick Pick Emojis:
            </span>
            <div className="flex flex-wrap gap-1.5 bg-black/60 p-2 rounded-xl border border-yellow-500/20">
              {EMOJI_PRESETS.map((em, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setEmoji(em)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-base hover:bg-[#221a0a] transition-transform hover:scale-110 cursor-pointer ${
                    emoji === em ? 'bg-yellow-400/20 border border-yellow-400' : 'bg-[#140f06]'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing & Unit Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-black/60 rounded-2xl border border-yellow-500/30">
            <div>
              <label className="block text-2xs font-bold text-yellow-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                <span>Price in AED (Dirhams):</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={priceAed}
                  onChange={(e) => setPriceAed(e.target.value)}
                  placeholder="5.00 or 0.50"
                  className="w-full pl-3.5 pr-14 py-2.5 bg-[#181308] border-2 border-yellow-400 focus:border-yellow-300 rounded-xl text-base font-black text-yellow-300 focus:outline-none font-mono shadow-inner"
                  required
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-yellow-400 font-mono">
                  AED
                </span>
              </div>

              {/* Quick Preset Prices */}
              <div className="mt-2 space-y-1">
                <span className="text-3xs text-yellow-500/80 font-bold uppercase tracking-wider block">
                  Quick Price Presets:
                </span>
                <div className="flex flex-wrap gap-1">
                  {['0.25', '0.50', '1.00', '2.00', '5.00', '10.00', '15.00', '20.00', '50.00'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPriceAed(preset)}
                      className={`px-2 py-0.5 rounded-lg text-3xs font-mono font-bold border cursor-pointer transition-all active:scale-90 ${
                        priceAed === preset
                          ? 'bg-yellow-400 text-slate-950 border-yellow-300 font-black shadow-sm'
                          : 'bg-[#181308] text-yellow-300/80 border-yellow-500/30 hover:border-yellow-400 hover:text-white'
                      }`}
                    >
                      {preset} AED
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-3xs text-yellow-400/90 mt-1.5 font-mono">
                Preview: <strong className="text-white font-mono">{formattedPreview.detailed}</strong> ({numPrice < 1 ? `${formattedPreview.fils} Fils` : `${numPrice.toFixed(2)} AED`})
              </div>
            </div>

            <div>
              <label className="block text-2xs font-bold text-yellow-300 uppercase tracking-wider mb-1.5">
                Pricing Unit / Frequency:
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="per 5 days / per level / with oven"
                className="w-full px-3.5 py-2.5 bg-[#181308] border border-yellow-500/30 focus:border-yellow-400 rounded-xl text-xs text-white placeholder-yellow-500/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Tag and Highlight */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-2xs font-bold text-yellow-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Badge / Tag:</span>
                  <span className="text-3xs text-yellow-400 font-mono">Sticker</span>
                </label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="VIP Daily / 🔥 HOT DEAL / ⚡ FLASH SALE"
                  className="w-full px-3.5 py-2.5 bg-[#181308] border border-yellow-500/30 focus:border-yellow-400 rounded-xl text-xs text-white placeholder-yellow-500/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-yellow-300 uppercase tracking-wider mb-1.5">
                  Highlight Label (Optional):
                </label>
                <input
                  type="text"
                  value={highlight}
                  onChange={(e) => setHighlight(e.target.value)}
                  placeholder="🔥 HOT / ⚡ BEST VALUE / 🏆 PRO"
                  className="w-full px-3.5 py-2.5 bg-[#181308] border border-yellow-500/30 focus:border-yellow-400 rounded-xl text-xs text-white placeholder-yellow-500/40 focus:outline-none"
                />
              </div>
            </div>

            {/* Sticker Presets Grid */}
            <div>
              <span className="text-3xs text-yellow-500/70 font-bold uppercase tracking-wider mb-1 block">
                Quick Pick Deal Stickers & Badges:
              </span>
              <div className="flex flex-wrap gap-1.5 bg-black/60 p-2 rounded-xl border border-yellow-500/20 max-h-28 overflow-y-auto">
                {STICKER_PRESETS.map((st, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      sound.playPop();
                      setTag(st.label);
                    }}
                    className={`px-2 py-1 rounded-lg text-3xs font-black transition-all cursor-pointer border ${
                      tag === st.label
                        ? 'bg-yellow-400 text-slate-950 border-yellow-300 scale-105 shadow-md'
                        : 'bg-[#140f06] text-yellow-200/80 border-yellow-500/30 hover:border-yellow-400'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-2xs font-bold text-yellow-300 uppercase tracking-wider mb-1.5">
              Description & Service Scope:
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed explanation of what Abdul delivers for this VIP deal..."
              className="w-full px-3.5 py-2.5 bg-[#181308] border border-yellow-500/30 focus:border-yellow-400 rounded-xl text-xs text-white placeholder-yellow-500/40 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-yellow-500/20 flex items-center justify-between gap-3">
            {isEditing && onDeleteDeal && canDelete ? (
              showDeleteConfirm ? (
                <div className="flex items-center gap-2 p-1.5 bg-rose-950/80 border border-rose-500/50 rounded-xl">
                  <span className="text-3xs font-bold text-rose-300 pl-1">
                    Delete deal?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      onDeleteDeal(dealToEdit!.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow cursor-pointer transition-colors"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setShowDeleteConfirm(true);
                  }}
                  className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Deal</span>
                </button>
              )
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-[#201808] hover:bg-[#2c220c] text-yellow-200 font-bold text-xs rounded-xl border border-yellow-500/20 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-xl shadow-yellow-500/25 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer vip-gold-bevel"
              >
                <Save className="w-4 h-4 text-slate-950" />
                <span>{isEditing ? 'Save VIP Changes' : 'Publish 24K VIP Deal'}</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

