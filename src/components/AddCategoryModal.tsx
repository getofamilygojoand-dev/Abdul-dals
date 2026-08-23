import React, { useState } from 'react';
import { X, FolderPlus, Sparkles, Crown, Tag, Check, Layers, AlertCircle, Trash2, ArrowRight } from 'lucide-react';
import { CategoryInfo, STICKER_PRESETS } from '../utils/categoryStorage';
import { sound } from '../utils/audio';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStore?: 'abdul' | 'hamdaan';
  onSaveCategory: (category: Omit<CategoryInfo, 'id'>) => void;
  categoriesList?: CategoryInfo[];
  activeCategory?: string;
  onSelectCategory?: (categoryId: string) => void;
  onDeleteCategory?: (categoryId: string) => void;
}

const EMOJI_OPTIONS = [
  '🐟', '🐉', '🌋', '❄️', '💎', '🌊', '🍕', '🍔', '🥪', '🍟', '🥤', '🍩', '🍫', '🍦', '☕', '🍋',
  '🎮', '🚀', '🎯', '⚡', '🔥', '👑', '🏆', '⚽', '🏎️',
  '⛏️', '🛏️', '🧹', '🐱', '🐾', '🍿', '🎁', '📦', '💥', '✨'
];

const COLOR_THEMES = [
  { name: '24K VIP Gold', gradient: 'from-yellow-400 via-amber-400 to-yellow-600', key: 'yellow' },
  { name: 'Emerald Green', gradient: 'from-emerald-400 via-teal-500 to-emerald-600', key: 'emerald' },
  { name: 'Fire Orange', gradient: 'from-orange-500 via-amber-500 to-red-500', key: 'orange' },
  { name: 'Cyber Blue', gradient: 'from-cyan-400 via-blue-500 to-indigo-600', key: 'blue' },
  { name: 'Neon Purple', gradient: 'from-fuchsia-500 via-purple-600 to-pink-500', key: 'purple' },
  { name: 'Ruby Red', gradient: 'from-red-500 via-rose-600 to-red-700', key: 'red' },
];

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  activeStore = 'abdul',
  onSaveCategory,
  categoriesList = [],
  activeCategory = 'all',
  onSelectCategory,
  onDeleteCategory,
}) => {
  const [modalTab, setModalTab] = useState<'create' | 'choose'>('create');
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🍕');
  const [subEmoji, setSubEmoji] = useState('🥤');
  const [badge, setBadge] = useState('🔥 HOT DEAL');
  const [description, setDescription] = useState('');
  const [autoSelectOnCreate, setAutoSelectOnCreate] = useState(true);
  const [targetStore, setTargetStore] = useState<'abdul' | 'hamdaan' | 'both'>(activeStore);
  const [selectedTheme, setSelectedTheme] = useState(COLOR_THEMES[0]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a category name.');
      sound.playError();
      return;
    }

    sound.playCashRegister();
    onSaveCategory({
      name: name.trim(),
      emoji: emoji.trim() || '🏷️',
      subEmoji: subEmoji.trim() || undefined,
      badge: badge.trim() || '✨ VIP Category',
      description: description.trim() || `Exclusive custom catalog deals for ${name.trim()}`,
      gradient: selectedTheme.gradient,
      themeColor: selectedTheme.key,
      store: targetStore,
    });

    setSuccessMsg(`✓ Created category "${name.trim()}"!`);
    setName('');
    setDescription('');
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 600);
  };

  const handleChoose = (catId: string) => {
    sound.playPop();
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl flex flex-col bg-gradient-to-b from-[#181206] via-[#100c04] to-[#070502] border-2 border-yellow-500/40 rounded-2xl sm:rounded-3xl shadow-2xl shadow-yellow-950/80 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 my-auto text-slate-100 ring-1 ring-yellow-400/20">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 p-4 sm:p-5 text-slate-950 flex items-center justify-between shrink-0 shadow-lg vip-gold-bevel">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-950 text-yellow-400 flex items-center justify-center text-xl font-black shrink-0 border border-yellow-400/40 shadow-xl">
              <FolderPlus className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-950">
                  Category Studio
                </h2>
                <span className="text-3xs px-2 py-0.5 rounded bg-slate-950 text-yellow-300 font-mono font-black border border-yellow-300/30">
                  Owner
                </span>
              </div>
              <p className="text-3xs font-bold text-slate-950/80 uppercase tracking-wider">
                Make custom store categories & choose any category to view
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

        {/* Mode Switcher Tabs */}
        <div className="p-3 bg-black/60 border-b border-yellow-500/20 flex gap-2">
          <button
            type="button"
            onClick={() => {
              sound.playPop();
              setModalTab('create');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
              modalTab === 'create'
                ? 'bg-gradient-to-r from-yellow-300 to-amber-400 text-slate-950 border-yellow-200 shadow-md font-mono'
                : 'bg-[#151006] text-yellow-300/80 border-yellow-500/20 hover:text-white'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>✨ Make New Category</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playPop();
              setModalTab('choose');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
              modalTab === 'choose'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 border-emerald-300 shadow-md font-mono'
                : 'bg-[#151006] text-emerald-300/80 border-emerald-500/20 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>📋 Choose / Switch Category ({categoriesList.length})</span>
          </button>
        </div>

        {/* Content Form: MAKE CATEGORY */}
        {modalTab === 'create' && (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-bold font-mono">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Name & Emojis */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-2xs font-bold text-yellow-300 uppercase tracking-wider mb-1.5">
                  Category Name:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Pizza & Burgers / Minecraft Gear"
                  className="w-full px-3.5 py-2.5 bg-[#181308] border border-yellow-500/30 focus:border-yellow-400 rounded-xl text-xs text-white placeholder-yellow-500/40 focus:outline-none font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-yellow-300 uppercase tracking-wider mb-1.5">
                  Icons / Emojis:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    className="w-1/2 px-2 py-2 bg-[#181308] border border-yellow-500/30 text-center rounded-xl text-base text-white focus:outline-none"
                    maxLength={2}
                  />
                  <input
                    type="text"
                    value={subEmoji}
                    onChange={(e) => setSubEmoji(e.target.value)}
                    className="w-1/2 px-2 py-2 bg-[#181308] border border-yellow-500/30 text-center rounded-xl text-base text-white focus:outline-none"
                    placeholder="2nd"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            {/* Quick Emoji Picker */}
            <div>
              <span className="text-3xs text-yellow-500/70 font-bold uppercase tracking-wider mb-1 block">
                Quick Pick Emojis:
              </span>
              <div className="flex flex-wrap gap-1.5 bg-black/60 p-2 rounded-xl border border-yellow-500/20 max-h-24 overflow-y-auto">
                {EMOJI_OPTIONS.map((em, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setEmoji(em)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-transform hover:scale-110 cursor-pointer ${
                      emoji === em ? 'bg-yellow-400/20 border border-yellow-400' : 'bg-[#140f06]'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* Sticker & Badge System */}
            <div>
              <label className="block text-2xs font-bold text-yellow-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-yellow-400" />
                <span>Select Category Sticker / Badge:</span>
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="🔥 HOT DEAL / ⚡ FLASH SALE / 👑 24K VIP"
                className="w-full px-3.5 py-2 bg-[#181308] border border-yellow-500/30 focus:border-yellow-400 rounded-xl text-xs text-white placeholder-yellow-500/40 focus:outline-none font-semibold mb-2"
              />

              {/* Sticker Presets Grid */}
              <span className="text-3xs text-yellow-500/70 font-bold uppercase tracking-wider mb-1.5 block">
                Popular Sticker Presets:
              </span>
              <div className="flex flex-wrap gap-1.5 bg-black/60 p-2.5 rounded-xl border border-yellow-500/20 max-h-32 overflow-y-auto">
                {STICKER_PRESETS.map((st, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      sound.playPop();
                      setBadge(st.label);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-3xs font-black transition-all cursor-pointer border flex items-center gap-1 ${
                      badge === st.label
                        ? 'bg-yellow-400 text-slate-950 border-yellow-300 scale-105 shadow-md'
                        : 'bg-[#161007] text-yellow-200/90 border-yellow-500/30 hover:border-yellow-400 hover:scale-105'
                    }`}
                  >
                    <span>{st.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Color Theme */}
            <div>
              <label className="block text-2xs font-bold text-yellow-300 uppercase tracking-wider mb-1.5">
                Visual Theme Color:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {COLOR_THEMES.map((theme, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedTheme(theme)}
                    className={`p-2 rounded-xl text-3xs font-bold text-center transition-all cursor-pointer border flex flex-col items-center gap-1 ${
                      selectedTheme.name === theme.name
                        ? 'border-yellow-400 bg-yellow-400/20 shadow-md ring-1 ring-yellow-400'
                        : 'border-yellow-500/20 bg-[#140f06] hover:border-yellow-400'
                    }`}
                  >
                    <div className={`w-full h-3 rounded-md bg-gradient-to-r ${theme.gradient}`}></div>
                    <span className="text-white truncate w-full">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Description */}
            <div>
              <label className="block text-2xs font-bold text-yellow-300 uppercase tracking-wider mb-1.5">
                Category Description:
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what items or deals belong in this category..."
                className="w-full px-3.5 py-2 bg-[#181308] border border-yellow-500/30 focus:border-yellow-400 rounded-xl text-xs text-white placeholder-yellow-500/40 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Live Preview Card */}
            <div className="p-3.5 bg-black/80 rounded-2xl border border-yellow-500/30 space-y-1.5">
              <span className="text-3xs font-bold text-yellow-400/80 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-yellow-400" />
                Category Live Preview
              </span>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#140f06] border border-yellow-500/30">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{emoji} {subEmoji}</span>
                  <div>
                    <h4 className="text-sm font-black text-white">{name || 'Your Category Name'}</h4>
                    <p className="text-3xs text-yellow-200/70">{description || 'Category description preview...'}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-3xs font-black uppercase tracking-wider bg-gradient-to-r ${selectedTheme.gradient} text-slate-950 shadow`}>
                  {badge || 'STICKER'}
                </span>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-3 border-t border-yellow-500/20 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#201808] hover:bg-[#2c220c] text-yellow-200 font-bold text-xs rounded-xl border border-yellow-500/20 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-xl active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer vip-gold-bevel font-mono"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Create & Select Category</span>
              </button>
            </div>
          </form>
        )}

        {/* Mode 2: CHOOSE / BROWSE CATEGORIES */}
        {modalTab === 'choose' && (
          <div className="p-4 sm:p-6 space-y-3 max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between text-2xs font-bold text-yellow-300 uppercase tracking-wider">
              <span>All Available Catalog Categories:</span>
              <span className="font-mono text-yellow-400">{categoriesList.length} Categories</span>
            </div>

            <div className="space-y-2.5">
              {categoriesList.map((cat) => {
                const isCurrent = activeCategory === cat.id;

                return (
                  <div
                    key={cat.id}
                    className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-[#221a0a] border-yellow-400 shadow-lg shadow-yellow-950/60 ring-1 ring-yellow-400/30'
                        : 'bg-black/60 border-yellow-500/20 hover:border-yellow-500/40 hover:bg-[#140f06]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-black/80 border border-yellow-500/30 flex items-center justify-center text-xl shrink-0">
                        {cat.emoji}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-white">{cat.name}</h4>
                          {cat.badge && (
                            <span className="text-3xs px-2 py-0.5 rounded-full font-mono font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-500/30">
                              {cat.badge}
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-3xs px-2 py-0.5 rounded-full font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Active Category
                            </span>
                          )}
                          {cat.isCustom && (
                            <span className="text-3xs px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 font-mono">
                              Custom Made
                            </span>
                          )}
                        </div>
                        <p className="text-3xs text-yellow-200/70 truncate mt-0.5">
                          {cat.description || 'Category deals and services'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleChoose(cat.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-black transition-all cursor-pointer flex items-center gap-1.5 shadow border ${
                          isCurrent
                            ? 'bg-yellow-400 text-slate-950 border-yellow-300'
                            : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border-emerald-500/40 hover:scale-105'
                        }`}
                      >
                        <span>{isCurrent ? 'Viewing Now' : 'Choose Category'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {cat.isCustom && onDeleteCategory && (
                        <button
                          type="button"
                          onClick={() => {
                            sound.playError();
                            if (confirm(`Delete custom category "${cat.name}"?`)) {
                              onDeleteCategory(cat.id);
                            }
                          }}
                          className="p-1.5 bg-rose-950/40 hover:bg-rose-900 text-rose-400 hover:text-rose-200 rounded-xl text-xs cursor-pointer transition-colors border border-rose-500/30"
                          title="Delete Custom Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-yellow-500/20 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setModalTab('create')}
                className="text-xs font-bold text-yellow-300 hover:text-white underline cursor-pointer"
              >
                + Make another new category
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#201808] hover:bg-[#2c220c] text-yellow-200 font-bold text-xs rounded-xl border border-yellow-500/20 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

