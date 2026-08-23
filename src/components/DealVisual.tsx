import React from 'react';
import { getDealVisualImage, DEAL_ASSETS } from '../utils/dealVisuals';

interface DealVisualProps {
  deal?: {
    id?: string;
    categoryId?: string;
    title?: string;
    emoji?: string;
    imageUrl?: string;
  };
  categoryKey?: 'rivals' | 'room' | 'food' | 'drinks' | 'minecraft' | 'cats' | 'fisch' | 'brush' | 'bed' | 'rpg' | 'nutella';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showEmojiFallback?: boolean;
}

export const DealVisual: React.FC<DealVisualProps> = ({
  deal,
  categoryKey,
  size = 'md',
  className = '',
  showEmojiFallback = true,
}) => {
  let imgSrc: string | null = null;

  if (categoryKey) {
    if (categoryKey === 'rpg' || categoryKey === 'rivals') imgSrc = DEAL_ASSETS.rpgRocket;
    else if (categoryKey === 'bed' || categoryKey === 'room') imgSrc = DEAL_ASSETS.bedCleaning;
    else if (categoryKey === 'brush') imgSrc = DEAL_ASSETS.cleanBrush;
    else if (categoryKey === 'nutella' || categoryKey === 'food') imgSrc = DEAL_ASSETS.sandwichNutella;
    else if (categoryKey === 'minecraft') imgSrc = DEAL_ASSETS.mcShulker;
    else if (categoryKey === 'cats') imgSrc = DEAL_ASSETS.catCare;
    else if (categoryKey === 'fisch') imgSrc = DEAL_ASSETS.robloxFisch;
  } else if (deal) {
    imgSrc = getDealVisualImage(deal);
  }

  const sizeClasses = {
    xs: 'w-6 h-6 rounded-lg text-xs',
    sm: 'w-8 h-8 rounded-lg text-sm',
    md: 'w-11 h-11 rounded-xl text-xl',
    lg: 'w-14 h-14 rounded-2xl text-2xl',
    xl: 'w-20 h-20 rounded-2xl text-3xl',
  }[size];

  if (imgSrc) {
    return (
      <div 
        className={`relative overflow-hidden shrink-0 border border-yellow-500/40 shadow-inner group-hover:scale-105 transition-transform bg-black/80 ${sizeClasses} ${className}`}
      >
        <img
          src={imgSrc}
          alt={deal?.title || 'Abdul Deals VIP Visual'}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center"
          loading="lazy"
        />
        {/* Subtle inner highlight border */}
        <div className="absolute inset-0 ring-1 ring-inset ring-yellow-400/20 rounded-[inherit] pointer-events-none"></div>
      </div>
    );
  }

  // Fallback to emoji if no image
  return (
    <div 
      className={`shrink-0 bg-[#1c1508] border border-yellow-500/30 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform select-none ${sizeClasses} ${className}`}
    >
      {deal?.emoji || '✨'}
    </div>
  );
};
