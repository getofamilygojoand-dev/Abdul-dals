import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  Crown, 
  ShoppingBag, 
  CalendarClock,
  Heart,
  Coins,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { DealItem } from '../types';
import { sound } from '../utils/audio';
import catTreatImg from '../assets/images/cat_treat_snack_1786730352381.jpg';

interface CatTreatModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: DealItem;
  onConfirmAddToCart: (deal: DealItem, qty: number, timings: string[], customPrice: number) => void;
}

const PRESET_TIMES = [
  { id: 'morning', label: '08:30 AM', name: '🌅 Morning Breakfast' },
  { id: 'lunch', label: '01:00 PM', name: '☀️ Lunch Snack' },
  { id: 'afternoon', label: '04:30 PM', name: '☕ Afternoon Treat' },
  { id: 'dinner', label: '07:30 PM', name: '🌙 Dinner Feeding' },
  { id: 'bedtime', label: '10:00 PM', name: '🌌 Bedtime Snack' },
];

export const CatTreatModal: React.FC<CatTreatModalProps> = ({
  isOpen,
  onClose,
  deal,
  onConfirmAddToCart,
}) => {
  const [selectedMode, setSelectedMode] = useState<'custom' | 'standard'>('custom');
  const [selectedTimings, setSelectedTimings] = useState<string[]>(['08:30 AM', '01:00 PM', '07:30 PM']);
  const [customTimeInput, setCustomTimeInput] = useState('12:00');
  const [isConfirmedStep, setIsConfirmedStep] = useState(false);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  // Price calculations according to exact requirement:
  // "they can choose maxium 3 timing to feed them treat in total it will be 2.00 for these things you can chose the time its will be 2.50 not 2.00"
  const isCustomTimed = selectedMode === 'custom' && selectedTimings.length > 0;
  const totalPrice = isCustomTimed ? 2.50 : 2.00;

  const handleTogglePreset = (timeLabel: string) => {
    sound.playClick();
    if (selectedTimings.includes(timeLabel)) {
      setSelectedTimings(selectedTimings.filter((t) => t !== timeLabel));
    } else {
      if (selectedTimings.length >= 3) {
        sound.playError();
        return;
      }
      setSelectedTimings([...selectedTimings, timeLabel]);
    }
  };

  const handleAddCustomTime = () => {
    if (!customTimeInput) return;
    if (selectedTimings.length >= 3) {
      sound.playError();
      return;
    }

    // Convert 24-hr time to 12-hr AM/PM string
    const [hoursStr, minutesStr] = customTimeInput.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = minutesStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const formatted = `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;

    if (!selectedTimings.includes(formatted)) {
      sound.playPop();
      setSelectedTimings([...selectedTimings, formatted]);
    }
  };

  const handleRemoveTiming = (timeToRemove: string) => {
    sound.playClick();
    setSelectedTimings(selectedTimings.filter((t) => t !== timeToRemove));
  };

  const handleConfirmAndAdd = () => {
    sound.playCashRegister();
    setIsConfirmedStep(true);
    onConfirmAddToCart(
      deal,
      1,
      isCustomTimed ? selectedTimings : [],
      totalPrice
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#1c1509] via-[#120e05] to-[#080603] border-2 border-yellow-500/50 rounded-2xl sm:rounded-3xl shadow-2xl shadow-yellow-950/80 overflow-hidden z-10 text-slate-100 ring-1 ring-yellow-400/30 my-auto">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 p-4 sm:p-5 text-slate-950 flex items-center justify-between shadow-lg vip-gold-bevel">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-950 text-yellow-300 flex items-center justify-center text-xl shadow-xl shrink-0 border border-yellow-400/40">
              🐾
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-3xs font-black uppercase tracking-widest text-slate-950/80 font-mono">
                  Gourmet Feline Care
                </span>
                <span className="bg-slate-950 text-yellow-300 text-3xs font-black px-2 py-0.2 rounded-full font-mono">
                  50 Fils / Timing
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-950 leading-tight">
                {isConfirmedStep ? 'Cat Treat Booking Confirmed!' : 'Schedule Cat Treat Feeding (Max 3 Timings)'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-950/20 hover:bg-slate-950/35 active:scale-95 text-slate-950 flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* CONFIRMATION SCREEN (With Treat Image as requested) */}
          {isConfirmedStep ? (
            <div className="space-y-4 text-center animate-in zoom-in-95 duration-200">
              {/* Gourmet Cat Treat Image Hero Card */}
              <div className="relative mx-auto w-full max-w-sm rounded-2xl overflow-hidden border-2 border-yellow-400 shadow-2xl shadow-yellow-500/20 ring-2 ring-yellow-400/40 group">
                <img
                  src={catTreatImg}
                  alt="Gourmet Cat Treat Snacks"
                  referrerPolicy="no-referrer"
                  className="w-full h-52 sm:h-60 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                
                <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-md border border-yellow-400/60 px-3 py-1 rounded-full text-3xs font-black text-yellow-300 font-mono flex items-center gap-1.5 shadow-lg">
                  <Sparkles className="w-3 h-3 text-yellow-400" />
                  <span>24K Fresh Crunchy Treats</span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-left">
                  <div className="text-3xs font-black uppercase tracking-wider text-yellow-400 font-mono">
                    Official Treat Booking
                  </div>
                  <div className="text-sm font-black text-white drop-shadow-md">
                    Abdul Gourmet Feline Treat Service
                  </div>
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 text-xs text-left space-y-1.5 shadow-inner">
                <div className="flex items-center gap-2 text-emerald-300 font-black text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Treats Scheduled in VIP Roster!</span>
                </div>
                <p className="text-3xs leading-relaxed text-emerald-100/90">
                  Abdul has recorded your cat's scheduled feeding times. Delicious crunchy snacks and loving attention will be delivered right on time!
                </p>
              </div>

              {/* Summary of Times & Price */}
              <div className="p-4 rounded-2xl bg-black/80 border border-yellow-500/30 text-left space-y-3 shadow-md">
                <div className="flex items-center justify-between text-xs border-b border-yellow-500/20 pb-2">
                  <span className="text-yellow-400/80 font-bold uppercase text-3xs font-mono">
                    Feeding Mode:
                  </span>
                  <span className="font-black text-yellow-300 font-mono">
                    {isCustomTimed ? '⏰ Custom Scheduled Timings' : '🕒 Standard Anytime Feeding'}
                  </span>
                </div>

                {isCustomTimed && (
                  <div>
                    <div className="text-3xs font-bold text-yellow-400/80 uppercase font-mono mb-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-yellow-400" />
                      <span>Confirmed Timings ({selectedTimings.length}/3 chosen):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTimings.map((time, idx) => (
                        <span 
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-yellow-400/15 border border-yellow-400/50 text-yellow-200 text-xs font-black font-mono flex items-center gap-1 shadow-xs"
                        >
                          <span className="text-3xs text-yellow-400/70 font-mono">#{idx + 1}</span>
                          <span>{time}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm pt-2 border-t border-yellow-500/20">
                  <div>
                    <div className="text-3xs text-yellow-400/70 font-mono uppercase font-bold">Total Deal Price:</div>
                    <div className="text-xs text-yellow-200/80">
                      {isCustomTimed ? 'With Custom Scheduled Timings' : 'Standard Treat Bundle'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-yellow-400 font-mono">
                      {totalPrice.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-yellow-200 ml-1 font-mono">AED</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl font-black text-xs bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-300 text-slate-950 transition-all cursor-pointer shadow-lg vip-gold-bevel"
                >
                  Done & Continue Shopping
                </button>
              </div>
            </div>
          ) : (
            /* CONFIGURATION / SCHEDULING STEP */
            <div className="space-y-4">
              
              {/* Visual Treat Showcase Banner */}
              <div className="relative rounded-2xl overflow-hidden border border-yellow-500/35 bg-black/60 p-3.5 flex items-center gap-3.5 shadow-md">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-yellow-400/60 shadow-lg">
                  <img
                    src={catTreatImg}
                    alt="Gourmet Cat Treats"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-3xs font-black uppercase px-2 py-0.2 rounded-md bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 font-mono">
                      50 Fils per Treat Timing
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white truncate">
                    Gourmet Cat Treats by Abdul
                  </h3>
                  <p className="text-3xs text-yellow-200/80 leading-relaxed mt-0.5">
                    Choose up to <strong>3 specific feeding times</strong> (50 fils per timed treat) for <strong>2.50 AED</strong>, or choose standard feeding for <strong>2.00 AED</strong>!
                  </p>
                </div>
              </div>

              {/* Mode Selection Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-black/80 rounded-2xl border border-yellow-500/30">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedMode('custom');
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                    selectedMode === 'custom'
                      ? 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 shadow-md vip-gold-bevel'
                      : 'text-yellow-300/70 hover:text-yellow-200'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Choose Timings</span>
                  </span>
                  <span className="text-3xs font-mono font-bold opacity-90">
                    2.50 AED (Max 3 Times)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedMode('standard');
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                    selectedMode === 'standard'
                      ? 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 shadow-md vip-gold-bevel'
                      : 'text-yellow-300/70 hover:text-yellow-200'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Standard Treats</span>
                  </span>
                  <span className="text-3xs font-mono font-bold opacity-90">
                    2.00 AED (No Fixed Times)
                  </span>
                </button>
              </div>

              {/* If Custom Timed Mode is Active */}
              {selectedMode === 'custom' && (
                <div className="space-y-3.5 p-4 rounded-2xl bg-black/70 border border-yellow-500/30">
                  
                  {/* Header & Counter */}
                  <div className="flex items-center justify-between border-b border-yellow-500/20 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-300">
                      <CalendarClock className="w-4 h-4 text-yellow-400" />
                      <span>Select Treat Feeding Times:</span>
                    </div>
                    <span className={`text-3xs font-mono font-black px-2.5 py-0.5 rounded-full border ${
                      selectedTimings.length === 3
                        ? 'bg-yellow-400 text-slate-950 border-yellow-300 shadow-sm'
                        : 'bg-yellow-400/10 text-yellow-300 border-yellow-400/40'
                    }`}>
                      {selectedTimings.length} / 3 Timings (Max 3)
                    </span>
                  </div>

                  {/* Preset Quick Time Chips */}
                  <div className="space-y-1.5">
                    <div className="text-3xs font-bold uppercase tracking-wider text-yellow-400/70 font-mono">
                      Quick Preset Timings (50 Fils / time):
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PRESET_TIMES.map((preset) => {
                        const isSelected = selectedTimings.includes(preset.label);
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleTogglePreset(preset.label)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer select-none flex flex-col justify-between gap-1 ${
                              isSelected
                                ? 'bg-yellow-400/20 border-yellow-400 text-white shadow-sm ring-1 ring-yellow-400/40'
                                : selectedTimings.length >= 3
                                ? 'opacity-40 bg-black/40 border-yellow-500/20 text-yellow-300/50 cursor-not-allowed'
                                : 'bg-[#181308] border-yellow-500/30 text-yellow-200 hover:border-yellow-400/60'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-black text-xs text-yellow-300">
                                {preset.label}
                              </span>
                              {isSelected ? (
                                <Check className="w-3.5 h-3.5 text-yellow-400 stroke-[3]" />
                              ) : (
                                <Plus className="w-3 h-3 text-yellow-400/60" />
                              )}
                            </div>
                            <span className="text-3xs text-yellow-100/70 truncate">
                              {preset.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Time Input */}
                  <div className="pt-2 border-t border-yellow-500/20">
                    <div className="text-3xs font-bold uppercase tracking-wider text-yellow-400/70 font-mono mb-1.5">
                      Or Add Exact Clock Time:
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={customTimeInput}
                        onChange={(e) => setCustomTimeInput(e.target.value)}
                        className="flex-1 bg-[#181308] border border-yellow-500/40 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-yellow-400"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomTime}
                        disabled={selectedTimings.length >= 3}
                        className="px-3.5 py-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-md"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Time</span>
                      </button>
                    </div>
                  </div>

                  {/* Chosen Timings Chips */}
                  {selectedTimings.length > 0 ? (
                    <div className="pt-2 border-t border-yellow-500/20 space-y-1.5">
                      <div className="text-3xs font-bold uppercase tracking-wider text-yellow-400/70 font-mono flex items-center justify-between">
                        <span>Your Scheduled Timings ({selectedTimings.length}/3):</span>
                        <span className="text-emerald-400 font-mono">50 Fils per treat</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedTimings.map((time, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 bg-yellow-400/15 border border-yellow-400/60 rounded-xl px-3 py-1.5 shadow-sm text-xs font-mono text-white font-bold"
                          >
                            <span className="text-3xs text-yellow-400 font-mono">#{idx + 1}</span>
                            <span>{time}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTiming(time)}
                              className="text-yellow-400/60 hover:text-rose-400 transition-colors ml-1"
                              aria-label={`Remove timing ${time}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-3xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Select at least 1 timing (up to 3 maximum) for the 2.50 AED timed schedule.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Price Calculation Banner */}
              <div className="p-4 rounded-2xl bg-[#140e05] border-2 border-yellow-400/60 flex items-center justify-between shadow-xl">
                <div>
                  <div className="text-3xs font-black uppercase tracking-wider text-yellow-400 font-mono">
                    Total Deal Price
                  </div>
                  <div className="text-xs text-yellow-200/90 font-medium">
                    {isCustomTimed 
                      ? `Custom Timed Feeding (${selectedTimings.length}/3 times chosen)` 
                      : 'Standard Feeding (2.00 AED total)'}
                  </div>
                  <div className="text-3xs text-yellow-400/70 font-mono mt-0.5">
                    {isCustomTimed 
                      ? '✓ Custom scheduled times: 2.50 AED (not 2.00 AED)' 
                      : '✓ Standard treat bundle: 2.00 AED'}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-black text-yellow-400 font-mono">
                    {totalPrice.toFixed(2)}
                    <span className="text-xs font-bold text-yellow-200 ml-1">AED</span>
                  </div>
                  <div className="text-3xs text-yellow-500/70 font-mono">
                    {isCustomTimed ? '50 fils / timing included' : 'Fixed standard bundle'}
                  </div>
                </div>
              </div>

              {/* Bottom Confirm Action */}
              <button
                type="button"
                onClick={handleConfirmAndAdd}
                className="w-full py-3.5 px-4 min-h-[48px] rounded-xl font-black text-sm bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-300 text-slate-950 transition-all cursor-pointer shadow-xl vip-gold-bevel active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4 text-slate-950" />
                <span>
                  Confirm & Schedule Treats ({totalPrice.toFixed(2)} AED)
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
