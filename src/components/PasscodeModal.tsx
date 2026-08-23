import React, { useState, useEffect } from 'react';
import { KeyRound, X, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { sound } from '../utils/audio';

interface PasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStore?: 'abdul' | 'hamdaan';
  isUnlocked: boolean;
  onUnlockSuccess: (store: 'abdul') => void;
}

export const PasscodeModal: React.FC<PasscodeModalProps> = ({
  isOpen,
  onClose,
  isUnlocked,
  onUnlockSuccess,
}) => {
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const correctCode = '2015';
  const storeName = 'Abdul Deals';

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        sound.playPop();
        setCode((prev) => (prev.length < 8 ? prev + e.key : prev));
        setErrorMsg(null);
      } else if (e.key === 'Backspace') {
        sound.playClick();
        setCode((prev) => prev.slice(0, -1));
        setErrorMsg(null);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, code]);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    sound.playPop();
    if (code.length < 8) {
      setCode((prev) => prev + num);
      setErrorMsg(null);
    }
  };

  const handleBackspace = () => {
    sound.playClick();
    setCode((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (code.trim() === correctCode) {
      sound.playVipFanfare();
      setIsSuccess(true);
      setErrorMsg(null);
      setTimeout(() => {
        onUnlockSuccess('abdul');
        setIsSuccess(false);
        setCode('');
        onClose();
      }, 900);
    } else {
      sound.playClick();
      setErrorMsg(`Incorrect passcode! Please try again.`);
      setCode('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-sm rounded-3xl bg-[#0e0a04] border-2 border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.25)] overflow-hidden text-yellow-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-yellow-400" />
            <h3 className="text-base font-black text-white tracking-tight">
              {storeName} Authorization
            </h3>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-yellow-500/20 text-yellow-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {isUnlocked ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/40 text-center space-y-2">
              <ShieldCheck className="w-10 h-10 mx-auto text-emerald-400" />
              <h4 className="text-sm font-black text-emerald-300">
                {storeName} Unlocked!
              </h4>
              <p className="text-xs text-yellow-100/80">
                You can now add and edit deals for {storeName}.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 bg-yellow-400 text-slate-950 rounded-xl text-xs font-black vip-gold-bevel cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : isSuccess ? (
            <div className="p-6 text-center space-y-2 animate-fade-in">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg">
                <Check className="w-7 h-7 stroke-[3]" />
              </div>
              <h4 className="text-base font-black text-emerald-400">Passcode Accepted!</h4>
              <p className="text-xs text-yellow-200/80">Unlocking Add Deals for {storeName}...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-xs text-yellow-200/80 font-medium">
                  Enter passcode to unlock <strong className="text-yellow-400">+ Add Deals</strong> for {storeName}
                </p>
              </div>

              {/* Masked Input Display - Shows dots only */}
              <div className="relative">
                <input
                  type="text"
                  value={'• '.repeat(code.length).trim()}
                  readOnly
                  placeholder="• • • •"
                  className="w-full text-center text-3xl font-bold tracking-widest py-3 px-4 rounded-2xl bg-[#161007] border-2 border-yellow-500/40 text-yellow-400 focus:outline-none focus:border-yellow-400 shadow-inner select-none pointer-events-none"
                />
                {code.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-yellow-400/70 hover:text-yellow-300 p-1 font-bold cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs text-center flex items-center justify-center gap-1.5 font-bold animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* On-screen Keypad */}
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeyPress(num)}
                    className="py-2.5 bg-[#1a140a] hover:bg-yellow-400/20 border border-yellow-500/30 text-yellow-200 font-mono text-base font-bold rounded-xl transition-all cursor-pointer active:scale-95 shadow-xs"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="py-2.5 bg-[#1a140a] hover:bg-yellow-400/20 border border-yellow-500/30 text-yellow-400 text-xs font-black rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  ⌫
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyPress('0')}
                  className="py-2.5 bg-[#1a140a] hover:bg-yellow-400/20 border border-yellow-500/30 text-yellow-200 font-mono text-base font-bold rounded-xl transition-all cursor-pointer active:scale-95 shadow-xs"
                >
                  0
                </button>
                <button
                  type="submit"
                  className="py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer active:scale-95 shadow-md vip-gold-bevel"
                >
                  OK
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
