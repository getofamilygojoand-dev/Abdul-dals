import React from 'react';
import { MessageSquare, UserPlus, BellOff, X, ArrowRight, ShieldCheck, Crown, Sparkles, Send } from 'lucide-react';
import { sound } from '../utils/audio';

export interface NotificationItem {
  id: string;
  type: 'chat' | 'dm' | 'friend_request' | 'friend_accepted';
  title: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
  data?: any;
}

interface LiveNotificationToastProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
  onOpenAction: (notification: NotificationItem) => void;
  onMuteAll: () => void;
  isMuted: boolean;
}

export const LiveNotificationToast: React.FC<LiveNotificationToastProps> = ({
  notifications,
  onDismiss,
  onOpenAction,
  onMuteAll,
  isMuted,
}) => {
  if (isMuted || notifications.length === 0) return null;

  return (
    <div className="fixed top-3 inset-x-3 sm:inset-x-auto sm:right-5 z-[9999] flex flex-col gap-2.5 max-w-md w-full pointer-events-none transition-all">
      {notifications.slice(0, 3).map((notif) => (
        <div
          key={notif.id}
          onClick={() => {
            sound.playPop();
            onOpenAction(notif);
          }}
          className="pointer-events-auto cursor-pointer group bg-gradient-to-b from-[#221808] via-[#1a1205] to-[#120c03] border-2 border-yellow-400 text-white rounded-2xl p-4 shadow-2xl shadow-yellow-950/90 animate-in slide-in-from-top-4 fade-in duration-300 flex flex-col gap-3 vip-gold-bevel hover:border-yellow-300 transition-all hover:scale-[1.01]"
        >
          {/* Main App Brand Header Bar */}
          <div className="flex items-center justify-between gap-2 border-b border-yellow-500/25 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <div className="flex items-center gap-1.5 bg-yellow-500/20 px-2 py-0.5 rounded-md border border-yellow-500/40">
                <Crown className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="text-2xs sm:text-xs font-mono font-black uppercase tracking-wider text-yellow-300">
                  ABDUL DEALS
                </span>
              </div>
              <span className="text-3xs font-mono font-bold text-yellow-200/70 hidden sm:inline">
                {notif.type === 'dm' ? '• New Message' : notif.type === 'friend_request' ? '• Friend Request' : '• VIP Alert'}
              </span>
            </div>

            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onMuteAll();
                }}
                className="text-3xs font-mono text-yellow-400/80 hover:text-yellow-200 px-2 py-1 rounded-lg bg-black/50 hover:bg-yellow-500/20 transition-colors flex items-center gap-1 cursor-pointer border border-yellow-500/20"
                title="Mute all notifications"
              >
                <BellOff className="w-3 h-3" />
                <span className="hidden sm:inline">Mute</span>
              </button>
              <button
                type="button"
                onClick={() => onDismiss(notif.id)}
                className="w-6 h-6 rounded-lg bg-black/50 hover:bg-rose-500/30 text-yellow-400 hover:text-rose-300 flex items-center justify-center text-xs transition-colors cursor-pointer border border-yellow-500/20"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="flex items-start gap-3.5">
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-yellow-500/30 vip-gold-bevel">
                {notif.senderAvatar || '💬'}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              </span>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <h4 className="text-sm font-black text-yellow-200 truncate font-mono flex items-center gap-1.5">
                  <span>{notif.senderName}</span>
                  <span className="text-3xs font-normal text-yellow-400/70 bg-yellow-500/10 px-1.5 py-0.2 rounded border border-yellow-500/20">
                    sent a message
                  </span>
                </h4>
                <span className="text-3xs text-yellow-300/60 font-mono shrink-0">Just now</span>
              </div>

              {/* High Contrast Clear Message Box */}
              <div className="p-2.5 rounded-xl bg-black/60 border border-yellow-500/30 text-yellow-50 text-xs sm:text-sm font-sans font-medium leading-relaxed break-words shadow-inner">
                "{notif.text}"
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-yellow-500/15" onClick={(e) => e.stopPropagation()}>
            <span className="text-3xs text-yellow-200/50 font-mono hidden sm:inline">
              Tap anywhere to reply instantly
            </span>
            <div className="flex items-center gap-2 ml-auto w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  onDismiss(notif.id);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-yellow-300/70 hover:text-yellow-200 transition-colors cursor-pointer bg-black/40 hover:bg-black/60"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  onOpenAction(notif);
                }}
                className="flex-1 sm:flex-initial px-4 py-1.5 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-300 text-slate-950 text-xs font-mono font-black shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95 vip-gold-bevel"
              >
                <Send className="w-3.5 h-3.5 fill-slate-950" />
                <span>{notif.type === 'friend_request' ? 'View Request' : 'Open & Reply'}</span>
                <ArrowRight className="w-3 h-3 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
