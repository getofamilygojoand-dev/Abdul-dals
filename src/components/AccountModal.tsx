import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  KeyRound,
  LogOut,
  ShoppingBag,
  Coins,
  Receipt,
  Sparkles,
  ShieldCheck,
  Clock,
  Lightbulb,
  PlusCircle,
  Zap,
  Crown,
  Flame,
  Check,
  ChevronRight,
  Tag,
  Copy,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sliders,
  FolderPlus,
  ArrowRight,
  Layers,
  Users,
  UserPlus,
  Shield,
  Gift,
  Search,
  Award,
  Trophy,
  CreditCard,
  Wallet,
} from 'lucide-react';
import { PlacedOrder, PromoCode } from '../types';
import {
  UserAccount,
  loginUserWithCode,
  loginUserWithCredentials,
  signUpUser,
  getUserAccountSpending,
  getStoredUserAccounts,
  createCustomUserAccount,
  deleteCustomUserAccount,
} from '../utils/userAccounts';
import { ACardView } from './ACardView';
import {
  resetUserACard,
  adminSetUserACardBalance,
} from '../utils/aCardStorage';
import {
  getLoyaltyStatus,
  VIP_BADGE_ORDER_THRESHOLD,
  LoyaltyStatus,
} from '../utils/loyalty';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { sound } from '../utils/audio';
import {
  getStoredPromoCodes,
  createPromoCode,
  togglePromoCodeActive,
  setPromoCodeStatus,
  resetPromoCodeUsage,
  togglePromoCodeSingleUse,
  deletePromoCode,
  generateFriendlyCode,
} from '../utils/promoCodeStorage';
import { CategoryInfo, STICKER_PRESETS } from '../utils/categoryStorage';
import { DealIdea, getAllDealIdeas } from '../data/dealIdeasData';

const CATEGORY_COLOR_THEMES = [
  { name: '24K VIP Gold', gradient: 'from-yellow-400 via-amber-400 to-yellow-600', key: 'yellow' },
  { name: 'Emerald Green', gradient: 'from-emerald-400 via-teal-500 to-emerald-600', key: 'emerald' },
  { name: 'Fire Orange', gradient: 'from-orange-500 via-amber-500 to-red-500', key: 'orange' },
  { name: 'Cyber Blue', gradient: 'from-cyan-400 via-blue-500 to-indigo-600', key: 'blue' },
  { name: 'Neon Purple', gradient: 'from-fuchsia-500 via-purple-600 to-pink-500', key: 'purple' },
  { name: 'Ruby Red', gradient: 'from-red-500 via-rose-600 to-red-700', key: 'red' },
];

const EMOJI_QUICK_PICKS = [
  '🍕', '🍔', '🥪', '🍟', '🥤', '🍩', '🍫', '🍦', '☕', '🍋',
  '🎮', '🚀', '🎯', '⚡', '🔥', '👑', '💎', '🏆', '⚽', '🏎️',
  '⛏️', '🛏️', '🧹', '🐱', '🐾', '🍿', '🎁', '📦', '💥', '✨'
];

const STORE_ADDITION_IDEAS = [
  {
    id: 'idea-1',
    category: '🏎️ New Categories & Passes',
    title: 'Sim Racing & VR Station Passes',
    desc: 'Add 15-minute and 1-hour Sim Racing Cockpit or Oculus VR Passes for 15.00 AED.',
    badge: 'Popular Request',
  },
  {
    id: 'idea-2',
    category: '☕ VIP Subscriptions',
    title: 'Unlimited Karak & Coffee Monthly Card',
    desc: 'Offer a 50 AED/month VIP Card granting 1 free Karak or Cold Coffee every single day.',
    badge: 'High Loyalty',
  },
  {
    id: 'idea-3',
    category: '🎟️ Promo & Coupon Codes',
    title: 'Discount Code Generator (ABDUL10)',
    desc: 'Allow Abdul Owner to generate custom 10%, 20%, or 50% discount codes at checkout.',
    badge: 'Store Feature',
  },
  {
    id: 'idea-4',
    category: '🏆 VIP Points & Rewards',
    title: '1 AED = 1 Loyalty Point Engine',
    desc: 'Let customers earn points on every AED spent, redeemable for free snacks or game time.',
    badge: 'Gamification',
  },
  {
    id: 'idea-5',
    category: '🥪 Munchie Combos',
    title: 'Late Night Midnight Snack Box',
    desc: 'Bundle 1 Grilled Cheese Toastie + 1 Slushie + 1 Chips for a discounted 12 AED package.',
    badge: 'High Profit',
  },
  {
    id: 'idea-6',
    category: '📲 Instant Order Notifications',
    title: 'WhatsApp Direct Order Dispatcher',
    desc: 'Auto-send receipt copy & live order updates directly to Abdul Owner\'s WhatsApp number.',
    badge: 'Automation',
  },
  {
    id: 'idea-7',
    category: '⏰ Flash Sales',
    title: '30-Minute Daily Flash Sale Timer',
    desc: 'Trigger a live countdown timer offering 40% off selected categories during quiet hours.',
    badge: 'Sales Booster',
  },
  {
    id: 'idea-8',
    category: '🎯 eSports Tournaments',
    title: 'FIFA / Rivals Tournament Entry Passes',
    desc: 'Sell 10 AED tournament tickets with a live leaderboard and 1st place prize pool.',
    badge: 'Community',
  },
];

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAccount: UserAccount | null;
  onLoginSuccess: (account: UserAccount) => void;
  onLogout: () => void;
  placedOrders: PlacedOrder[];
  onUpdateOrderStatus?: (orderId: string, newStatus: PlacedOrder['status']) => void;
  onClearAllOrders?: () => void;
  onOpenIdeasModal?: () => void;
  onAddIdeaToCatalog?: (idea: DealIdea) => void;
  onOpenPromoGenerator?: () => void;
  categoriesList?: CategoryInfo[];
  activeCategory?: string;
  onSelectCategory?: (categoryId: string) => void;
  onSaveCategory?: (category: Omit<CategoryInfo, 'id'>) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onOpenAddCategoryModal?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  activeAccount,
  onLoginSuccess,
  onLogout,
  placedOrders,
  onUpdateOrderStatus,
  onClearAllOrders,
  onOpenIdeasModal,
  onAddIdeaToCatalog,
  onOpenPromoGenerator,
  categoriesList = [],
  activeCategory = 'all',
  onSelectCategory,
  onSaveCategory,
  onDeleteCategory,
  onOpenAddCategoryModal,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'acard' | 'orders' | 'loyalty' | 'accounts' | 'promo' | 'categories' | 'ideas'>('summary');
  
  // Auth Form State (Sign In vs Sign Up)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Sign Up Form State
  const [signUpName, setSignUpName] = useState('');
  const [signUpDob, setSignUpDob] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpEmoji, setSignUpEmoji] = useState('⭐');
  const [signUpError, setSignUpError] = useState<string | null>(null);

  const [copiedIdeaId, setCopiedIdeaId] = useState<string | null>(null);
  const [copiedPromoCode, setCopiedPromoCode] = useState<string | null>(null);
  const [copiedMemberCode, setCopiedMemberCode] = useState<string | null>(null);
  const [ideaVaultSearch, setIdeaVaultSearch] = useState('');
  const [ideaVaultCategory, setIdeaVaultCategory] = useState('all');
  const [ideaVaultAddedIds, setIdeaVaultAddedIds] = useState<Set<string>>(new Set());

  // Accounts List State
  const [accountsList, setAccountsList] = useState<UserAccount[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberCode, setNewMemberCode] = useState('');
  const [newMemberEmoji, setNewMemberEmoji] = useState('⭐');
  const [newMemberRole, setNewMemberRole] = useState('VIP Member');
  const [memberCreateError, setMemberCreateError] = useState('');
  const [memberCreateSuccess, setMemberCreateSuccess] = useState('');

  // Embedded Promo Code Management for Abdul Owner (Code 2015)
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [newPromoCodeName, setNewPromoCodeName] = useState('');
  const [newDirhamOff, setNewDirhamOff] = useState<number>(5);
  const [newMinSpend, setNewMinSpend] = useState<number>(0);
  const [newDescription, setNewDescription] = useState('');
  const [newIsSingleUse, setNewIsSingleUse] = useState<boolean>(true);
  const [promoCreateError, setPromoCreateError] = useState('');
  const [promoCreateSuccess, setPromoCreateSuccess] = useState('');

  // Owner A-Card Management for Users
  const [editingCardUserCode, setEditingCardUserCode] = useState<string | null>(null);
  const [customCardBalanceInput, setCustomCardBalanceInput] = useState<string>('');
  const [cardAdminFeedback, setCardAdminFeedback] = useState<{ [code: string]: { type: 'success' | 'error'; msg: string } }>({});

  // Category Studio State for Code 2015 Abdul Owner
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🍕');
  const [newCatSubEmoji, setNewCatSubEmoji] = useState('🥤');
  const [newCatBadge, setNewCatBadge] = useState('🔥 HOT DEAL');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatTheme, setNewCatTheme] = useState(CATEGORY_COLOR_THEMES[0]);
  const [catCreateError, setCatCreateError] = useState('');
  const [catCreateSuccess, setCatCreateSuccess] = useState('');

  // Load promo codes and accounts whenever modal opens or tab changes
  useEffect(() => {
    if (isOpen) {
      setPromoCodes(getStoredPromoCodes());
      setAccountsList(getStoredUserAccounts());
      if (activeAccount?.isOwner && !newPromoCodeName) {
        setNewPromoCodeName(generateFriendlyCode(5));
      }
    }
  }, [isOpen, activeAccount]);

  const refreshAccounts = () => {
    setAccountsList(getStoredUserAccounts());
  };

  const refreshPromoCodes = () => {
    setPromoCodes(getStoredPromoCodes());
  };

  const handleRollAccountCode = () => {
    sound.playPop();
    const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
    setNewMemberCode(randomDigits);
  };

  const handleCreateMemberSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setMemberCreateError('');
    setMemberCreateSuccess('');

    const targetCode = newMemberCode.trim();
    const targetName = newMemberName.trim();

    if (!targetCode || !targetName) {
      sound.playError();
      setMemberCreateError('Please enter both member name and 4-digit code.');
      return;
    }

    const res = createCustomUserAccount({
      code: targetCode,
      name: targetName,
      avatarEmoji: newMemberEmoji,
      roleTitle: newMemberRole,
    });

    if (res.success && res.account) {
      sound.playCashRegister();
      setMemberCreateSuccess(`✓ Created passcode "${res.account.code}" for ${res.account.name}!`);
      refreshAccounts();
      setNewMemberName('');
      setNewMemberCode('');
    } else {
      sound.playError();
      setMemberCreateError(res.error || 'Failed to create member passcode.');
    }
  };

  const handleDeleteMember = (code: string, name: string) => {
    sound.playClick();
    if (confirm(`Remove passcode for ${name} (${code})?`)) {
      const updated = deleteCustomUserAccount(code);
      setAccountsList(updated);
    }
  };

  const handleCopyMemberCode = (code: string) => {
    sound.playPop();
    navigator.clipboard.writeText(code);
    setCopiedMemberCode(code);
    setTimeout(() => setCopiedMemberCode(null), 2500);
  };

  const handleOwnerResetUserCard = (targetUser: UserAccount) => {
    sound.playClick();
    if (confirm(`Completely reset A-Card for ${targetUser.name} (${targetUser.code})? This will wipe the card, all transactions, and set balance to 0 AED.`)) {
      const res = resetUserACard(targetUser.code);
      if (res.success) {
        sound.playCashRegister();
        setCardAdminFeedback((prev) => ({
          ...prev,
          [targetUser.code]: { type: 'success', msg: `✓ Completely reset ${targetUser.name}'s A-Card.` },
        }));
        refreshAccounts();
      } else {
        sound.playError();
        setCardAdminFeedback((prev) => ({
          ...prev,
          [targetUser.code]: { type: 'error', msg: res.error || 'Failed to reset card.' },
        }));
      }
    }
  };

  const handleOwnerSetUserBalance = (targetUser: UserAccount, newBal: number) => {
    sound.playPop();
    const res = adminSetUserACardBalance(targetUser.code, newBal, `👑 Balance adjusted by Abdul Owner (Code 2015)`);
    if (res.success) {
      sound.playCashRegister();
      setCardAdminFeedback((prev) => ({
        ...prev,
        [targetUser.code]: { type: 'success', msg: `✓ Set ${targetUser.name}'s A-Card balance to ${newBal.toFixed(2)} AED!` },
      }));
      setEditingCardUserCode(null);
      setCustomCardBalanceInput('');
      refreshAccounts();
    } else {
      sound.playError();
      setCardAdminFeedback((prev) => ({
        ...prev,
        [targetUser.code]: { type: 'error', msg: res.error || 'Failed to update balance.' },
      }));
    }
  };

  const handleRollCode = (dirhamVal?: number) => {
    sound.playPop();
    const generated = generateFriendlyCode(dirhamVal || newDirhamOff);
    setNewPromoCodeName(generated);
  };

  const handleCreatePromoSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPromoCreateError('');
    setPromoCreateSuccess('');

    const targetCode = newPromoCodeName.trim() || generateFriendlyCode(newDirhamOff);
    if (targetCode === '2015') {
      setPromoCreateError('Promo code cannot be "2015". Choose a voucher name like Rsd0y.');
      sound.playError();
      return;
    }

    const res = createPromoCode(
      targetCode,
      newDirhamOff,
      newDescription.trim() || `VIP ${newDirhamOff.toFixed(2)} AED Off Voucher`,
      newMinSpend,
      newIsSingleUse
    );

    if (res.success && res.promoCode) {
      sound.playCashRegister();
      setPromoCreateSuccess(`✓ Created code "${res.promoCode.code}" (-${res.promoCode.dirhamOff.toFixed(2)} AED off, ${newIsSingleUse ? '1-Time Use' : 'Multi-Use'})!`);
      refreshPromoCodes();
      // Prepare next code suggestion
      setNewPromoCodeName(generateFriendlyCode(newDirhamOff));
      setNewDescription('');
    } else {
      sound.playError();
      setPromoCreateError(res.error || 'Failed to create promo code.');
    }
  };

  const handleQuickCreatePreset = (dirhamAmount: number, label: string) => {
    setPromoCreateError('');
    setPromoCreateSuccess('');
    const code = generateFriendlyCode(dirhamAmount);
    const res = createPromoCode(
      code,
      dirhamAmount,
      `VIP ${label} - ${dirhamAmount.toFixed(2)} AED Off`,
      0,
      true
    );
    if (res.success && res.promoCode) {
      sound.playCashRegister();
      setPromoCreateSuccess(`✓ Created ${label} code "${res.promoCode.code}" (1-Time Use)!`);
      refreshPromoCodes();
    } else {
      sound.playError();
      setPromoCreateError(res.error || 'Failed to create promo code.');
    }
  };

  const handleTogglePromo = (id: string, currentActive: boolean) => {
    sound.playClick();
    const updated = setPromoCodeStatus(id, !currentActive);
    setPromoCodes(updated);
  };

  const handleResetUsage = (id: string) => {
    sound.playCashRegister();
    const updated = resetPromoCodeUsage(id);
    setPromoCodes(updated);
    setPromoCreateSuccess('✓ Voucher usage reset to Available (0/1 used)!');
    setTimeout(() => setPromoCreateSuccess(''), 2500);
  };

  const handleDeletePromo = (id: string, code: string) => {
    sound.playClick();
    if (confirm(`Delete promo code "${code}"?`)) {
      const updated = deletePromoCode(id);
      setPromoCodes(updated);
    }
  };

  const handleCopyCode = (code: string) => {
    sound.playPop();
    navigator.clipboard.writeText(code);
    setCopiedPromoCode(code);
    setTimeout(() => setCopiedPromoCode(null), 2500);
  };

  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);

    const identifier = loginIdentifier.trim() || inputCode.trim();
    if (!identifier) {
      setLoginError('Please enter your name or passcode.');
      sound.playError();
      return;
    }

    const res = loginUserWithCredentials({
      nameOrCode: identifier,
      password: loginPassword.trim() || undefined,
    });

    if (res.success && res.account) {
      sound.playVipFanfare();
      setLoginError(null);
      setLoginIdentifier('');
      setLoginPassword('');
      setInputCode('');
      onLoginSuccess(res.account);
    } else {
      sound.playPop();
      setLoginError(res.error || 'Invalid credentials');
    }
  };

  const handleSignUpSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSignUpError(null);

    const name = signUpName.trim();
    const dob = signUpDob.trim();
    const pass = signUpPassword.trim();

    if (!name) {
      sound.playError();
      setSignUpError('Please enter your name.');
      return;
    }
    if (!dob) {
      sound.playError();
      setSignUpError('Please enter your date of birth.');
      return;
    }
    if (!pass) {
      sound.playError();
      setSignUpError('Please create a password.');
      return;
    }

    const res = signUpUser({
      name,
      dateOfBirth: dob,
      password: pass,
      avatarEmoji: signUpEmoji,
    });

    if (res.success && res.account) {
      sound.playVipFanfare();
      setSignUpError(null);
      setSignUpName('');
      setSignUpDob('');
      setSignUpPassword('');
      onLoginSuccess(res.account);
    } else {
      sound.playError();
      setSignUpError(res.error || 'Failed to sign up.');
    }
  };

  // Calculate spending details if logged in
  const spending = activeAccount
    ? getUserAccountSpending(activeAccount, placedOrders)
    : null;

  // Calculate Loyalty & VIP Badge Status (5 orders threshold)
  const loyaltyStatus = React.useMemo(() => {
    return getLoyaltyStatus(activeAccount, placedOrders);
  }, [activeAccount, placedOrders]);

  // Monthly Spending Trends Line Graph data for the last 3 months
  const monthlyTrendsData = React.useMemo(() => {
    const now = new Date();
    const months = [];
    const orders = spending?.userOrders || [];

    for (let i = 2; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthShort = targetDate.toLocaleString('default', { month: 'short' });
      const monthIdx = targetDate.getMonth();
      const year = targetDate.getFullYear();

      const monthOrders = orders.filter((ord) => {
        const d = new Date(ord.createdAt);
        return d.getMonth() === monthIdx && d.getFullYear() === year;
      });

      const spent = monthOrders.reduce((sum, ord) => sum + (ord.finalTotalAed || 0), 0);

      months.push({
        month: monthShort,
        spending: Number(spent.toFixed(2)),
        ordersCount: monthOrders.length,
      });
    }

    return months;
  }, [spending]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0e0a03] border-2 border-yellow-400/70 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] vip-gold-bevel">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-yellow-500/20 via-amber-500/10 to-yellow-500/20 border-b border-yellow-400/30 flex items-center justify-between relative">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 shadow-md font-black text-xl">
              {activeAccount ? activeAccount.avatarEmoji : '👑'}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5 font-mono">
                {activeAccount ? activeAccount.name : 'VIP Member Portal'}
              </h2>
              <p className="text-3xs text-yellow-300/80 font-bold uppercase tracking-wider">
                {activeAccount ? `Account Code: ${activeAccount.code} • ${activeAccount.roleTitle}` : 'Sign Up or Sign In to Abdul Deals'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-900/80 text-yellow-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer border border-yellow-400/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 scrollbar-thin">
          
          {!activeAccount ? (
            /* NOT LOGGED IN VIEW - DUAL SIGN UP & SIGN IN TABS */
            <div className="space-y-5 animate-fade-in">
              {/* Tab Switcher: Sign Up vs Sign In */}
              <div className="flex bg-[#161108] p-1.5 rounded-2xl border border-yellow-400/30 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setAuthMode('signup');
                    setSignUpError(null);
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 font-mono ${
                    authMode === 'signup'
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-md vip-gold-bevel'
                      : 'text-yellow-200/70 hover:text-white hover:bg-yellow-500/10'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>📝 1. Sign Up (New)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setAuthMode('login');
                    setLoginError(null);
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 font-mono ${
                    authMode === 'login'
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-md vip-gold-bevel'
                      : 'text-yellow-200/70 hover:text-white hover:bg-yellow-500/10'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>🔑 2. Sign In</span>
                </button>
              </div>

              {/* ================= SIGN UP TAB ================= */}
              {authMode === 'signup' && (
                <form onSubmit={handleSignUpSubmit} className="space-y-4 animate-fade-in">
                  <div className="text-center space-y-1">
                    <h3 className="text-base font-black text-white">Create Your VIP Account</h3>
                    <p className="text-xs text-yellow-100/75 max-w-sm mx-auto">
                      First write your name, date of birth, and password and you made it!
                    </p>
                  </div>

                  {/* 1. Name Input with unique name reminder */}
                  <div className="space-y-1">
                    <label className="text-3xs font-mono uppercase text-yellow-400 font-black tracking-wider flex items-center justify-between">
                      <span>1. Full Name</span>
                      <span className="text-yellow-400/80 font-normal">No copycat names</span>
                    </label>
                    <input
                      type="text"
                      value={signUpName}
                      onChange={(e) => {
                        setSignUpName(e.target.value);
                        setSignUpError(null);
                      }}
                      placeholder="e.g. Ali Ahmed, Tariq, etc."
                      className="w-full px-4 py-3 bg-[#181308] border-2 border-yellow-400/50 focus:border-yellow-300 rounded-xl text-sm font-bold text-white placeholder:text-yellow-600/50 outline-none"
                    />
                  </div>

                  {/* 2. Date of Birth */}
                  <div className="space-y-1">
                    <label className="text-3xs font-mono uppercase text-yellow-400 font-black tracking-wider">
                      2. Date of Birth
                    </label>
                    <input
                      type="date"
                      value={signUpDob}
                      onChange={(e) => {
                        setSignUpDob(e.target.value);
                        setSignUpError(null);
                      }}
                      className="w-full px-4 py-3 bg-[#181308] border-2 border-yellow-400/50 focus:border-yellow-300 rounded-xl text-sm font-bold text-white outline-none"
                    />
                  </div>

                  {/* 3. Password */}
                  <div className="space-y-1">
                    <label className="text-3xs font-mono uppercase text-yellow-400 font-black tracking-wider">
                      3. Password / Passcode
                    </label>
                    <input
                      type="password"
                      value={signUpPassword}
                      onChange={(e) => {
                        setSignUpPassword(e.target.value);
                        setSignUpError(null);
                      }}
                      placeholder="Create your secret password"
                      className="w-full px-4 py-3 bg-[#181308] border-2 border-yellow-400/50 focus:border-yellow-300 rounded-xl text-sm font-bold text-white placeholder:text-yellow-600/50 outline-none"
                    />
                  </div>

                  {/* 4. Pick Avatar */}
                  <div className="space-y-1.5">
                    <label className="text-3xs font-mono uppercase text-yellow-400 font-black tracking-wider">
                      4. Pick Your VIP Avatar ({signUpEmoji})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['⭐', '👑', '⚡', '💎', '🎮', '🍕', '🚀', '🐱', '🏆', '🔥', '🎁'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            sound.playPop();
                            setSignUpEmoji(emoji);
                          }}
                          className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer border ${
                            signUpEmoji === emoji
                              ? 'bg-yellow-400 text-slate-950 border-yellow-200 scale-110 shadow-md'
                              : 'bg-black/60 border-yellow-500/20 hover:border-yellow-400'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {signUpError && (
                    <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs font-bold leading-relaxed animate-shake">
                      ⚠️ {signUpError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-yellow-400 text-slate-950 font-black rounded-2xl text-sm shadow-xl hover:scale-[1.02] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 vip-gold-bevel font-mono"
                  >
                    <Sparkles className="w-4 h-4 stroke-[2.5]" />
                    <span>✨ Create Account & Sign In</span>
                  </button>
                </form>
              )}

              {/* ================= LOG IN TAB ================= */}
              {authMode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fade-in">
                  <div className="text-center space-y-1">
                    <h3 className="text-base font-black text-white">Log In to Your VIP Account</h3>
                    <p className="text-xs text-yellow-100/75 max-w-sm mx-auto">
                      Enter your Name or Code, and your Password.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-3xs font-mono uppercase text-yellow-400 font-black tracking-wider">
                      Name or Passcode
                    </label>
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => {
                        setLoginIdentifier(e.target.value);
                        setLoginError(null);
                      }}
                      placeholder="Enter your name or passcode"
                      className="w-full px-4 py-3 bg-[#181308] border-2 border-yellow-400/50 focus:border-yellow-300 rounded-xl text-sm font-bold text-white placeholder:text-yellow-600/50 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-3xs font-mono uppercase text-yellow-400 font-black tracking-wider">
                      Password
                    </label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setLoginError(null);
                      }}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 bg-[#181308] border-2 border-yellow-400/50 focus:border-yellow-300 rounded-xl text-sm font-bold text-white placeholder:text-yellow-600/50 outline-none"
                    />
                  </div>

                  {loginError && (
                    <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs font-bold leading-relaxed animate-shake">
                      ⚠️ {loginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-yellow-400 text-slate-950 font-black rounded-2xl text-sm shadow-xl hover:scale-[1.02] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 vip-gold-bevel font-mono"
                  >
                    <KeyRound className="w-4 h-4 stroke-[2.5]" />
                    <span>Sign In To Account</span>
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* LOGGED IN ACCOUNT DASHBOARD */
            <div className="space-y-5 animate-fade-in">
              
              {/* User Profile Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-yellow-500/15 via-amber-500/10 to-yellow-500/15 border border-yellow-400/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-300 to-amber-400 flex items-center justify-center text-2xl text-slate-950 shadow-lg relative">
                    {activeAccount.avatarEmoji}
                    {loyaltyStatus.hasVipBadge && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 border-2 border-slate-950 flex items-center justify-center text-3xs shadow-md" title="VIP Badge Earned">
                        🎖️
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-base font-black text-white">
                        {activeAccount.name}
                      </h3>
                      {loyaltyStatus.hasVipBadge ? (
                        <span className="text-3xs px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 border border-yellow-200 font-black flex items-center gap-1 shadow-sm vip-gold-bevel">
                          <Award className="w-3 h-3 text-slate-950" />
                          <span>VIP Badge</span>
                        </span>
                      ) : (
                        <span className="text-3xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 border border-yellow-400/30 font-bold flex items-center gap-1">
                          <span>⭐ {loyaltyStatus.totalOrders}/5 Orders to VIP Badge</span>
                        </span>
                      )}
                      <span className="text-3xs px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 font-bold">
                        Logged In
                      </span>
                    </div>
                    <p className="text-3xs font-mono font-bold text-yellow-300/80 mt-0.5">
                      Code: {activeAccount.code} • {activeAccount.roleTitle}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    sound.playClick();
                    onLogout();
                  }}
                  className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 hover:scale-105 active:scale-95"
                  title="Sign out of account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit</span>
                </button>
              </div>

              {/* LOYALTY TRACKING & VIP BADGE MILESTONE BANNER */}
              <div 
                id="loyalty-vip-badge-tracker"
                className={`p-4 rounded-2xl border-2 transition-all shadow-xl space-y-3 ${
                  loyaltyStatus.hasVipBadge
                    ? 'bg-gradient-to-br from-amber-950/70 via-[#1a1406] to-yellow-950/70 border-amber-400/80 vip-gold-bevel'
                    : 'bg-gradient-to-br from-[#161108] to-[#120d04] border-yellow-500/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-lg shrink-0 ${
                      loyaltyStatus.hasVipBadge
                        ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 ring-2 ring-yellow-300/60 animate-pulse'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {loyaltyStatus.hasVipBadge ? '🎖️' : '⭐'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                          VIP Loyalty Rewards Status
                        </h4>
                        {loyaltyStatus.hasVipBadge ? (
                          <span className="text-3xs font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase">
                            VIP Badge Unlocked 👑
                          </span>
                        ) : (
                          <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/30">
                            {loyaltyStatus.ordersNeededForVip} More Order{loyaltyStatus.ordersNeededForVip === 1 ? '' : 's'} Needed
                          </span>
                        )}
                      </div>
                      <p className="text-3xs text-yellow-200/80 leading-tight mt-0.5">
                        {loyaltyStatus.hasVipBadge
                          ? `Congratulations! You placed ${loyaltyStatus.totalOrders} total orders and earned the VIP Badge on your account.`
                          : `Place 5 total orders to automatically earn the official VIP Badge on your account!`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playPop();
                      setActiveTab('loyalty');
                    }}
                    className="px-2.5 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-xl text-3xs font-mono font-black border border-yellow-400/30 cursor-pointer shrink-0 transition-all hover:scale-105"
                  >
                    View Perks →
                  </button>
                </div>

                {/* 5-Step Visual Checkpoint Tracker */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-3xs font-mono font-bold text-yellow-300/80">
                    <span>Order Progress</span>
                    <span className="text-yellow-400 font-black font-mono">
                      {loyaltyStatus.totalOrders} of 5 Orders ({loyaltyStatus.progressPercent}%)
                    </span>
                  </div>

                  {/* Step circles */}
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {[1, 2, 3, 4, 5].map((stepNumber) => {
                      const isCompleted = loyaltyStatus.totalOrders >= stepNumber || loyaltyStatus.isOwner;
                      const isTargetVip = stepNumber === 5;

                      return (
                        <div
                          key={stepNumber}
                          className={`p-1.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                            isCompleted
                              ? isTargetVip
                                ? 'bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-500 text-slate-950 border-yellow-200 font-black shadow-md vip-gold-bevel'
                                : 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50 font-bold'
                              : 'bg-black/40 text-yellow-200/40 border-yellow-500/15'
                          }`}
                        >
                          <span className="text-xs">
                            {isCompleted ? (isTargetVip ? '🎖️' : '✓') : isTargetVip ? '👑' : stepNumber}
                          </span>
                          <span className="text-4xs font-mono mt-0.5 truncate max-w-full font-black">
                            {isTargetVip ? 'VIP Badge' : `Order #${stepNumber}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-black/60 border border-yellow-500/30 overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-300 transition-all duration-500 rounded-full"
                      style={{ width: `${loyaltyStatus.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Total Money Spent Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-400/20 via-yellow-400/10 to-amber-500/20 border-2 border-yellow-400/60 shadow-xl space-y-2 text-center vip-gold-bevel">
                <div className="inline-flex items-center gap-1.5 text-2xs font-black uppercase text-yellow-300 tracking-wider">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  Total Money Spent
                </div>
                <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400 bg-clip-text text-transparent tracking-tight">
                  {spending?.totalSpentAed.toFixed(2)} AED
                </div>
                <div className="text-3xs font-bold text-yellow-100/70">
                  Across {spending?.ordersCount || 0} order{spending?.ordersCount === 1 ? '' : 's'} placed under {activeAccount.name}
                </div>
              </div>

              {/* Official A Card Quick Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#1c1507] via-black to-[#130f05] border-2 border-yellow-500/40 shadow-lg flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 text-base font-black shrink-0 shadow-md">
                    💳
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-white">Official A Card</span>
                      <span
                        className={`text-3xs font-black px-1.5 py-0.2 rounded font-mono ${
                          activeAccount?.aCard?.status === 'active'
                            ? 'bg-emerald-400 text-slate-950'
                            : activeAccount?.aCard?.status === 'pending_order'
                            ? 'bg-amber-400 text-slate-950 animate-pulse'
                            : 'bg-yellow-400 text-slate-950'
                        }`}
                      >
                        {activeAccount?.aCard?.status === 'active'
                          ? 'Active & Working'
                          : activeAccount?.aCard?.status === 'pending_order'
                          ? 'Send to Abdul'
                          : '1.00 AED'}
                      </span>
                    </div>
                    <p className="text-3xs text-yellow-200/80 truncate">
                      {activeAccount?.aCard?.status === 'active'
                        ? `Balance: ${activeAccount.aCard.balanceAed.toFixed(2)} AED (Card: ${activeAccount.aCard.cardNumber})`
                        : activeAccount?.aCard?.status === 'pending_order'
                        ? `Order #${activeAccount.aCard.orderId || ''} placed • Send to Abdul to start working!`
                        : 'Submit 1.00 AED order & send to Abdul to start working!'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    sound.playPop();
                    setActiveTab('acard');
                  }}
                  className="px-3 py-2 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-300 text-slate-950 rounded-xl text-3xs font-black font-mono transition-all cursor-pointer shadow-md vip-gold-bevel active:scale-95 shrink-0"
                >
                  {activeAccount?.aCard?.status === 'active'
                    ? 'Manage Card →'
                    : activeAccount?.aCard?.status === 'pending_order'
                    ? 'Send to Abdul →'
                    : 'Get A Card (1.00 AED) →'}
                </button>
              </div>

              {/* Abdul Owner (Code 2015) Exclusive Promo Code Generator Banner */}
              {activeAccount.isOwner && onOpenPromoGenerator && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/70 via-black/80 to-yellow-950/70 border-2 border-amber-400/70 shadow-lg flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 text-base font-black shrink-0 shadow-md">
                      🎟️
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-white">Dirham-Off Code Generator</span>
                        <span className="bg-amber-400 text-slate-950 text-3xs font-black px-1.5 py-0.2 rounded font-mono">
                          Owner
                        </span>
                      </div>
                      <p className="text-3xs text-yellow-200/80 truncate">
                        Generate custom Dirhams off codes and vouchers anytime!
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      sound.playCashRegister();
                      onOpenPromoGenerator();
                    }}
                    className="px-3 py-2 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-300 text-slate-950 rounded-xl text-3xs font-black font-mono transition-all cursor-pointer shadow-md vip-gold-bevel active:scale-95 shrink-0"
                  >
                    Open Generator →
                  </button>
                </div>
              )}

              {/* Navigation Tabs */}
              <div className="flex bg-[#161108] p-1 rounded-xl border border-yellow-400/30 gap-1 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => {
                    sound.playPop();
                    setActiveTab('summary');
                  }}
                  className={`flex-1 min-w-[90px] py-2 px-1 text-3xs sm:text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 ${
                    activeTab === 'summary'
                      ? 'bg-yellow-400 text-slate-950 shadow-md'
                      : 'text-yellow-300/70 hover:text-white'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Breakdown</span>
                </button>

                {/* A Card (1.00 AED) Tab */}
                <button
                  onClick={() => {
                    sound.playPop();
                    setActiveTab('acard');
                  }}
                  className={`flex-1 min-w-[95px] py-2 px-1 text-3xs sm:text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 ${
                    activeTab === 'acard'
                      ? 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 shadow-md vip-gold-bevel'
                      : activeAccount?.aCard
                      ? 'text-yellow-300 hover:text-white bg-yellow-500/10 border border-yellow-400/30'
                      : 'text-yellow-300/70 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {activeAccount?.aCard ? `A Card (${activeAccount.aCard.balanceAed.toFixed(2)} AED)` : '💳 A Card'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    sound.playPop();
                    setActiveTab('orders');
                  }}
                  className={`flex-1 min-w-[80px] py-2 px-1 text-3xs sm:text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 ${
                    activeTab === 'orders'
                      ? 'bg-yellow-400 text-slate-950 shadow-md'
                      : 'text-yellow-300/70 hover:text-white'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Orders ({spending?.ordersCount || 0})</span>
                </button>

                {/* Loyalty & VIP Badge Tab */}
                <button
                  onClick={() => {
                    sound.playPop();
                    setActiveTab('loyalty');
                  }}
                  className={`flex-1 min-w-[95px] py-2 px-1 text-3xs sm:text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 ${
                    activeTab === 'loyalty'
                      ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 shadow-md vip-gold-bevel'
                      : loyaltyStatus.hasVipBadge
                      ? 'text-amber-300 hover:text-white bg-amber-500/10 border border-amber-400/30'
                      : 'text-yellow-300/70 hover:text-white'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                  <span className="truncate">
                    {loyaltyStatus.hasVipBadge ? '🎖️ VIP Badge' : `Loyalty (${loyaltyStatus.totalOrders}/5)`}
                  </span>
                </button>

                {/* Member Passcodes Management for Abdul Owner Code 2015 */}
                {activeAccount.isOwner && (
                  <button
                    onClick={() => {
                      sound.playPop();
                      setActiveTab('accounts');
                    }}
                    className={`flex-1 min-w-[100px] py-2 px-1 text-3xs sm:text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 relative shrink-0 ${
                      activeTab === 'accounts'
                        ? 'bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-500 text-slate-950 shadow-md'
                        : 'text-sky-300 hover:text-white bg-sky-500/10 border border-sky-400/20'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                    <span className="truncate">👥 Passcodes ({accountsList.length})</span>
                  </button>
                )}

                {/* Promo Code Generator Tab for Abdul Owner Code 2015 */}
                {activeAccount.isOwner && (
                  <button
                    onClick={() => {
                      sound.playCashRegister();
                      setActiveTab('promo');
                    }}
                    className={`flex-1 min-w-[100px] py-2 px-1 text-3xs sm:text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 relative shrink-0 ${
                      activeTab === 'promo'
                        ? 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-400 text-slate-950 shadow-md'
                        : 'text-amber-300 hover:text-white bg-amber-500/10 border border-amber-400/20'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5 shrink-0 text-amber-500 fill-amber-400" />
                    <span className="truncate">🎟️ Promos ({promoCodes.filter((p) => p.isActive).length})</span>
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                  </button>
                )}

                {/* Categories Studio Tab for Abdul Owner Code 2015 ONLY */}
                {activeAccount.code === '2015' && (
                  <button
                    onClick={() => {
                      sound.playPop();
                      setActiveTab('categories');
                    }}
                    className={`flex-1 min-w-[105px] py-2 px-1 text-3xs sm:text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 relative shrink-0 ${
                      activeTab === 'categories'
                        ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 text-slate-950 shadow-md'
                        : 'text-emerald-300 hover:text-white bg-emerald-500/10 border border-emerald-400/20'
                    }`}
                  >
                    <FolderPlus className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span className="truncate">📂 Categories ({categoriesList.filter((c) => c.id !== 'all').length})</span>
                  </button>
                )}

                {/* Ideas Tab for Abdul Owner Code 2015 ONLY */}
                {activeAccount.code === '2015' && (
                  <button
                    onClick={() => {
                      sound.playPop();
                      setActiveTab('ideas');
                    }}
                    className={`flex-1 min-w-[80px] py-2 px-1 text-3xs sm:text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 relative shrink-0 ${
                      activeTab === 'ideas'
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-md'
                        : 'text-amber-300 hover:text-amber-200 bg-amber-400/10'
                    }`}
                  >
                    <Lightbulb className="w-3.5 h-3.5 shrink-0 text-amber-500 fill-amber-400" />
                    <span className="truncate">💡 Ideas</span>
                  </button>
                )}
              </div>

              {/* TAB 1: Itemized Summary ("What money was spent for") */}
              {activeTab === 'summary' && (
                <div className="space-y-3">
                  {/* For Abdul Owner: Highlighted Promo Engine Widget */}
                  {activeAccount.isOwner && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/60 via-[#181206] to-yellow-950/70 border-2 border-amber-400/70 shadow-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🎟️</span>
                          <div>
                            <h4 className="text-xs font-black text-white flex items-center gap-1.5 font-mono">
                              <span>Abdul Owner Dirham-Off Codes</span>
                              <span className="text-3xs bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded font-sans">
                                Owner
                              </span>
                            </h4>
                            <p className="text-3xs text-yellow-300/80">
                              Active customer discount codes currently live in your store:
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            sound.playCashRegister();
                            setActiveTab('promo');
                          }}
                          className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-3xs rounded-lg transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                          + Create New →
                        </button>
                      </div>

                      {/* Active Codes Quick Pills */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {promoCodes.filter((p) => p.isActive).slice(0, 4).map((p) => (
                          <div
                            key={p.id}
                            className="p-2 rounded-xl bg-black/50 border border-yellow-500/30 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-black text-xs text-yellow-300">
                                  {p.code}
                                </span>
                                <span className="bg-emerald-500/20 text-emerald-300 text-3xs font-mono font-black px-1.5 py-0.2 rounded border border-emerald-500/30">
                                  -{p.dirhamOff.toFixed(2)} AED
                                </span>
                              </div>
                              <div className="text-3xs text-yellow-100/60 truncate">
                                {p.description}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(p.code)}
                              className="px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded text-3xs font-mono font-black cursor-pointer shrink-0 transition-colors"
                              title="Copy code to clipboard"
                            >
                              {copiedPromoCode === p.code ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Quick Presets Generator Bar */}
                      <div className="pt-1 border-t border-yellow-500/20 flex items-center justify-between gap-1 flex-wrap">
                        <span className="text-3xs text-yellow-400/80 font-bold">Quick Generate:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuickCreatePreset(2, '2 AED Off')}
                            className="px-2 py-0.5 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 border border-yellow-500/30 rounded text-3xs font-mono font-black transition-colors cursor-pointer"
                          >
                            +2 AED
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickCreatePreset(5, '5 AED Off')}
                            className="px-2 py-0.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-500/40 rounded text-3xs font-mono font-black transition-colors cursor-pointer"
                          >
                            +5 AED (Rsd0y)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickCreatePreset(10, '10 AED Off')}
                            className="px-2 py-0.5 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 border border-yellow-500/30 rounded text-3xs font-mono font-black transition-colors cursor-pointer"
                          >
                            +10 AED
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* For Abdul Owner ONLY: Category Creator & Chooser Widget */}
                  {activeAccount.code === '2015' && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-[#0c1810] to-[#041009] border-2 border-emerald-400/70 shadow-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📂</span>
                          <div>
                            <h4 className="text-xs font-black text-white flex items-center gap-1.5 font-mono">
                              <span>Abdul Owner Category Studio</span>
                              <span className="text-3xs bg-emerald-400 text-slate-950 font-black px-1.5 py-0.2 rounded font-sans">
                                Owner
                              </span>
                            </h4>
                            <p className="text-3xs text-emerald-200/80">
                              Make custom categories with stickers, or choose any category:
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            sound.playPop();
                            setActiveTab('categories');
                          }}
                          className="px-3 py-2 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 rounded-xl text-3xs font-black font-mono transition-all cursor-pointer shadow-md active:scale-95 shrink-0 flex items-center gap-1"
                        >
                          <FolderPlus className="w-3 h-3" />
                          <span>Category Studio →</span>
                        </button>
                      </div>

                      {/* Quick Category Chips */}
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {categoriesList.map((cat) => {
                          const isCurrent = activeCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                sound.playPop();
                                if (onSelectCategory) {
                                  onSelectCategory(cat.id);
                                }
                                onClose();
                              }}
                              className={`px-2.5 py-1 rounded-lg text-3xs font-mono font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                                isCurrent
                                  ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow'
                                  : 'bg-black/60 text-emerald-200 border-emerald-500/30 hover:border-emerald-400 hover:text-white'
                              }`}
                            >
                              <span>{cat.emoji}</span>
                              <span>{cat.name}</span>
                              {cat.badge && (
                                <span className="opacity-75 text-4xs">({cat.badge.split(' ')[0]})</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Monthly Spending Trends (Last 3 Months) Line Graph using Recharts */}
                  <div className="p-4 rounded-2xl bg-[#140f06] border-2 border-yellow-500/40 shadow-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📈</span>
                        <div>
                          <h4 className="text-xs font-black text-white font-mono flex items-center gap-1.5">
                            <span>Monthly Spending Trends (Last 3 Months)</span>
                          </h4>
                          <p className="text-3xs text-yellow-200/70">
                            Visual spending trajectory across the last 3 months (AED)
                          </p>
                        </div>
                      </div>
                      <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
                        Trends
                      </span>
                    </div>

                    <div className="h-44 w-full pt-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyTrendsData} margin={{ top: 10, right: 15, left: -15, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2d200a" vertical={false} />
                          <XAxis 
                            dataKey="month" 
                            stroke="#ca8a04" 
                            fontSize={11} 
                            tickLine={false} 
                            axisLine={{ stroke: '#523c14' }}
                          />
                          <YAxis 
                            stroke="#ca8a04" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={{ stroke: '#523c14' }}
                            tickFormatter={(val) => `${val} AED`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#120d04',
                              border: '1px solid #eab308',
                              borderRadius: '12px',
                              fontSize: '11px',
                              color: '#ffffff',
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.8)',
                            }}
                            formatter={(value: any) => [`${Number(value).toFixed(2)} AED`, 'Total Spent']}
                            labelStyle={{ color: '#facc15', fontWeight: 'bold' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="spending"
                            stroke="#facc15"
                            strokeWidth={3}
                            dot={{ fill: '#fbbf24', stroke: '#78350f', strokeWidth: 2, r: 4 }}
                            activeDot={{ fill: '#ffffff', stroke: '#f59e0b', strokeWidth: 3, r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="text-xs font-black text-yellow-300/90 uppercase tracking-wider flex items-center justify-between">
                    <span>Purchased Items & Breakdown</span>
                    <span>Total Cost</span>
                  </div>

                  {spending?.itemizedSummary && spending.itemizedSummary.length > 0 ? (
                    <div className="space-y-2">
                      {spending.itemizedSummary.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-[#161108] border border-yellow-400/25 flex items-center justify-between gap-3 hover:border-yellow-400/50 transition-all"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-black text-white truncate">
                              {item.title}
                            </div>
                            <div className="text-3xs font-bold text-yellow-300/70">
                              Quantity Bought: {item.totalQty}x
                            </div>
                          </div>
                          <div className="text-xs font-black text-amber-300 whitespace-nowrap bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/30">
                            {item.totalSpentAed.toFixed(2)} AED
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center rounded-2xl bg-[#140e06] border border-dashed border-yellow-500/30 text-yellow-200/60 text-xs font-bold space-y-1">
                      <div>No purchases recorded yet for {activeAccount.name}.</div>
                      <div className="text-3xs text-yellow-400/70">Buy items in the store to automatically add to your account history!</div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Full Orders List */}
              {activeTab === 'orders' && (
                <div className="space-y-3">
                  {activeAccount.isOwner && (
                    <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/50 text-3xs font-black text-amber-300 uppercase tracking-wider flex items-center justify-between gap-2">
                      <span>👑 Owner Control: Managing All Customer Orders</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black">{spending?.ordersCount || 0} TOTAL</span>
                        {onClearAllOrders && (
                          <button
                            onClick={() => {
                              sound.playClick();
                              if (confirm('Are you sure you want to clear/reset all order history?')) {
                                onClearAllOrders();
                              }
                            }}
                            className="px-2 py-0.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-500/40 rounded text-3xs font-black transition-all cursor-pointer"
                          >
                            Reset History
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {spending?.userOrders && spending.userOrders.length > 0 ? (
                    <div className="space-y-3">
                      {spending.userOrders.map((ord) => {
                        const currentStatus = ord.status || 'in_progress';
                        return (
                          <div
                            key={ord.id}
                            className="p-3.5 rounded-2xl bg-[#161108] border border-yellow-400/30 space-y-2.5"
                          >
                            {/* Order Header */}
                            <div className="flex items-center justify-between text-3xs font-bold text-yellow-300/80 border-b border-yellow-500/20 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-white">#{ord.id}</span>
                                {ord.customerName && (
                                  <span className="px-2 py-0.5 rounded-md bg-yellow-400/15 text-yellow-300 font-bold">
                                    👤 {ord.customerName} {ord.userCode ? `(Code: ${ord.userCode})` : ''}
                                  </span>
                                )}
                              </div>
                              <span className="flex items-center gap-1 text-yellow-400/80">
                                <Clock className="w-3 h-3 text-yellow-400" />
                                {new Date(ord.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Order Items */}
                            <div className="space-y-1 text-xs">
                              {ord.items.map((it, i) => (
                                <div key={i} className="flex items-center justify-between text-white font-medium">
                                  <span>{it.quantity}x {it.title}</span>
                                  <span className="font-mono text-yellow-200/90">{it.totalAed.toFixed(2)} AED</span>
                                </div>
                              ))}
                            </div>

                            {/* Status & Total */}
                            <div className="flex items-center justify-between pt-2 border-t border-yellow-500/20 text-xs font-black">
                              <div className="flex items-center gap-1.5">
                                <span className="text-3xs text-yellow-300/70 uppercase">Status:</span>
                                {currentStatus === 'delivered' && (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-3xs">
                                    ✓ Delivered
                                  </span>
                                )}
                                {currentStatus === 'not_delivered' && (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-3xs">
                                    ⚠️ Not Delivered
                                  </span>
                                )}
                                {currentStatus === 'denied' && (
                                  <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-3xs">
                                    ✕ Denied
                                  </span>
                                )}
                                {(currentStatus === 'in_progress' || currentStatus === 'pending' || currentStatus === 'accepted' || currentStatus === 'completed') && (
                                  <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold text-3xs">
                                    ⏳ In Progress
                                  </span>
                                )}
                              </div>
                              <span className="text-amber-300 font-mono text-sm">{ord.finalTotalAed.toFixed(2)} AED</span>
                            </div>

                            {/* Abdul Owner (Code 2015) Status Update Controls */}
                            {activeAccount.isOwner && onUpdateOrderStatus && (
                              <div className="pt-2 border-t border-yellow-500/20 space-y-1">
                                <div className="text-3xs font-black uppercase text-yellow-400/90 tracking-wider">
                                  Owner Action: Mark Order Status
                                </div>
                                <div className="grid grid-cols-4 gap-1.5">
                                  <button
                                    onClick={() => {
                                      sound.playClick();
                                      onUpdateOrderStatus(ord.id, 'in_progress');
                                    }}
                                    className={`py-1.5 px-1 rounded-lg text-3xs font-black transition-all cursor-pointer border ${
                                      currentStatus === 'in_progress'
                                        ? 'bg-sky-400 text-slate-950 border-sky-300 font-black shadow-xs'
                                        : 'bg-sky-950/40 hover:bg-sky-900/60 text-sky-300 border-sky-500/30'
                                    }`}
                                  >
                                    ⏳ In Progress
                                  </button>

                                  <button
                                    onClick={() => {
                                      sound.playClick();
                                      onUpdateOrderStatus(ord.id, 'delivered');
                                    }}
                                    className={`py-1.5 px-1 rounded-lg text-3xs font-black transition-all cursor-pointer border ${
                                      currentStatus === 'delivered'
                                        ? 'bg-emerald-400 text-slate-950 border-emerald-300 font-black shadow-xs'
                                        : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/30'
                                    }`}
                                  >
                                    ✓ Delivered
                                  </button>

                                  <button
                                    onClick={() => {
                                      sound.playClick();
                                      onUpdateOrderStatus(ord.id, 'not_delivered');
                                    }}
                                    className={`py-1.5 px-1 rounded-lg text-3xs font-black transition-all cursor-pointer border ${
                                      currentStatus === 'not_delivered'
                                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-xs'
                                        : 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-500/30'
                                    }`}
                                  >
                                    ⚠️ Not Delivered
                                  </button>

                                  <button
                                    onClick={() => {
                                      sound.playClick();
                                      onUpdateOrderStatus(ord.id, 'denied');
                                    }}
                                    className={`py-1.5 px-1 rounded-lg text-3xs font-black transition-all cursor-pointer border ${
                                      currentStatus === 'denied'
                                        ? 'bg-rose-500 text-white border-rose-300 font-black shadow-xs'
                                        : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-500/30'
                                    }`}
                                  >
                                    ✕ Denied
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center rounded-2xl bg-[#140e06] border border-dashed border-yellow-500/30 text-yellow-200/60 text-xs font-bold">
                      No order receipts found.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2.2: VIP Loyalty Rewards & Badge System */}
              {activeTab === 'loyalty' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Big Loyalty Header Banner */}
                  <div className={`p-5 rounded-2xl border-2 shadow-xl space-y-3 ${
                    loyaltyStatus.hasVipBadge
                      ? 'bg-gradient-to-br from-amber-950/80 via-[#201807] to-yellow-950/80 border-amber-400/80 vip-gold-bevel'
                      : 'bg-gradient-to-br from-[#161108] via-[#120d04] to-[#0c0903] border-yellow-500/40'
                  }`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg shrink-0 ${
                          loyaltyStatus.hasVipBadge
                            ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 ring-2 ring-yellow-200 shadow-yellow-500/20'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {loyaltyStatus.hasVipBadge ? '🎖️' : '⭐'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-black text-white font-mono">
                              VIP Loyalty & Rewards Club
                            </h4>
                            {loyaltyStatus.hasVipBadge ? (
                              <span className="text-3xs font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 border border-yellow-200 uppercase tracking-wider shadow-xs">
                                🎖️ VIP Badge Holder
                              </span>
                            ) : (
                              <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded-full bg-yellow-400/15 text-yellow-300 border border-yellow-400/30">
                                {loyaltyStatus.totalOrders} / {VIP_BADGE_ORDER_THRESHOLD} Orders Placed
                              </span>
                            )}
                          </div>
                          <p className="text-3xs font-bold text-yellow-200/80 mt-0.5">
                            {loyaltyStatus.hasVipBadge
                              ? `You have unlocked the official VIP Badge! Total Orders: ${loyaltyStatus.totalOrders}`
                              : `Place ${loyaltyStatus.ordersNeededForVip} more order${loyaltyStatus.ordersNeededForVip === 1 ? '' : 's'} to earn your official VIP Badge!`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-black text-amber-300">
                          {loyaltyStatus.progressPercent}%
                        </span>
                        <div className="text-4xs text-yellow-400/70 font-mono uppercase">VIP Progress</div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-3 rounded-full bg-black/70 border border-yellow-500/30 overflow-hidden relative p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-yellow-200 transition-all duration-700 rounded-full shadow-sm"
                        style={{ width: `${loyaltyStatus.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* 5-Step Order Milestone Tracker */}
                  <div className="p-4 rounded-2xl bg-[#140e05] border border-yellow-500/30 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-black text-yellow-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                        <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                        <span>5-Order VIP Badge Milestone Roadmap</span>
                      </h5>
                      <span className="text-3xs text-yellow-400/70 font-mono">5 Orders = VIP</span>
                    </div>

                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((orderIndex) => {
                        const isUnlocked = loyaltyStatus.totalOrders >= orderIndex || loyaltyStatus.isOwner;
                        const matchingOrder = spending?.userOrders ? spending.userOrders[orderIndex - 1] : null;
                        const isFinalVip = orderIndex === 5;

                        return (
                          <div
                            key={orderIndex}
                            className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                              isUnlocked
                                ? isFinalVip
                                  ? 'bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/10 border-amber-400/60 shadow-md'
                                  : 'bg-yellow-500/15 border-yellow-400/40 text-yellow-200'
                                : 'bg-black/40 border-yellow-500/15 text-yellow-200/40'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                                isUnlocked
                                  ? isFinalVip
                                    ? 'bg-gradient-to-br from-yellow-300 to-amber-500 text-slate-950 shadow-md'
                                    : 'bg-yellow-400 text-slate-950 shadow-xs'
                                  : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-500/60'
                              }`}>
                                {isUnlocked ? (isFinalVip ? '🎖️' : '✓') : orderIndex}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-black truncate flex items-center gap-1.5">
                                  <span className={isUnlocked ? (isFinalVip ? 'text-yellow-200 font-extrabold' : 'text-white') : 'text-yellow-200/40'}>
                                    {isFinalVip ? 'Milestone #5: VIP Badge' : `Order #${orderIndex}`}
                                  </span>
                                  {isUnlocked && (
                                    <span className="text-4xs px-1.5 py-0.2 rounded bg-emerald-400/20 text-emerald-300 font-mono font-bold">
                                      Completed
                                    </span>
                                  )}
                                  {!isUnlocked && isFinalVip && (
                                    <span className="text-4xs px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono font-bold">
                                      Goal: Earn VIP Badge
                                    </span>
                                  )}
                                </div>
                                <div className="text-3xs font-mono text-yellow-300/60 truncate mt-0.5">
                                  {matchingOrder
                                    ? `Order #${matchingOrder.id} • ${new Date(matchingOrder.createdAt).toLocaleDateString()} (${matchingOrder.finalTotalAed.toFixed(2)} AED)`
                                    : isFinalVip
                                    ? 'Place 5 total orders to unlock the official VIP Badge!'
                                    : `Place order #${orderIndex} in the store to fill this step.`}
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              {isUnlocked ? (
                                <span className="text-xs text-emerald-400 font-black flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" />
                                  <span className="text-3xs font-mono">Done</span>
                                </span>
                              ) : (
                                <span className="text-3xs font-mono font-bold text-yellow-500/60">
                                  Pending
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* VIP Badge Perks & Privileges Card */}
                  <div className="p-4 rounded-2xl bg-[#161108] border border-yellow-400/30 space-y-3">
                    <h5 className="text-xs font-black text-yellow-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                      <span>VIP Badge Privileges & Benefits</span>
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-3xs">
                      <div className="p-2.5 rounded-xl bg-black/40 border border-yellow-500/20 space-y-0.5">
                        <div className="font-black text-yellow-200 flex items-center gap-1">
                          <span>🎖️ Official Account VIP Badge</span>
                        </div>
                        <p className="text-yellow-100/70">
                          Golden VIP flair displayed on your profile card, checkout drawer, and community chat.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-black/40 border border-yellow-500/20 space-y-0.5">
                        <div className="font-black text-yellow-200 flex items-center gap-1">
                          <span>👑 Priority Order Fulfillment</span>
                        </div>
                        <p className="text-yellow-100/70">
                          Orders placed by VIP Badge members receive express preparation and instant hotline routing.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-black/40 border border-yellow-500/20 space-y-0.5">
                        <div className="font-black text-yellow-200 flex items-center gap-1">
                          <span>🎟️ Secret 24K Promotions</span>
                        </div>
                        <p className="text-yellow-100/70">
                          Exclusive access to seasonal gift vouchers and custom owner promo codes.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-black/40 border border-yellow-500/20 space-y-0.5">
                        <div className="font-black text-yellow-200 flex items-center gap-1">
                          <span>💬 VIP Community & Direct Calls</span>
                        </div>
                        <p className="text-yellow-100/70">
                          Verified status in direct messaging, friends lounge, and 1-on-1 audio calls.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 1.5: Official A Card Management (Buy for 1.00 AED, Random Card #, Up to 10,000 AED) */}
              {activeTab === 'acard' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <ACardView
                    activeAccount={activeAccount}
                    onAccountUpdated={(updated) => {
                      onLoginSuccess(updated);
                    }}
                  />
                </div>
              )}

              {/* TAB 2.5: Abdul Owner Passcodes & Member Accounts Manager */}
              {activeTab === 'accounts' && activeAccount.isOwner && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Header Banner */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-500/20 via-cyan-500/10 to-blue-600/20 border-2 border-sky-400/60 text-sky-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-sky-400 shrink-0" />
                        <span className="font-black text-xs text-white uppercase tracking-wider font-mono">
                          Owner • Passcodes & Member Manager
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-sky-400 text-slate-950 font-black text-3xs uppercase">
                        {accountsList.length} Active Accounts
                      </span>
                    </div>
                    <p className="text-3xs text-sky-100/80 leading-relaxed font-medium">
                      Create passcodes for friends, family, or customers. Anyone can sign in with their code and their purchases will be safely saved!
                    </p>
                  </div>

                  {/* Create Passcode Form */}
                  <form
                    onSubmit={handleCreateMemberSubmit}
                    className="p-4 rounded-2xl bg-[#161108] border-2 border-sky-400/40 space-y-3 shadow-xl"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-sky-300 flex items-center gap-1.5 uppercase tracking-wider">
                        <UserPlus className="w-3.5 h-3.5 text-sky-400" />
                        <span>Create Passcode for Another Person</span>
                      </h4>
                      <span className="text-3xs text-sky-300/70 font-mono">No Invalid Codes</span>
                    </div>

                    {memberCreateSuccess && (
                      <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-3xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{memberCreateSuccess}</span>
                      </div>
                    )}

                    {memberCreateError && (
                      <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-3xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{memberCreateError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Name */}
                      <div className="space-y-1">
                        <label className="text-3xs font-black uppercase text-yellow-300/80 tracking-wider">
                          Person's Name:
                        </label>
                        <input
                          type="text"
                          value={newMemberName}
                          onChange={(e) => setNewMemberName(e.target.value)}
                          placeholder="e.g. Ali / Friend / Cousin"
                          className="w-full px-3 py-2 bg-[#0e0a03] border border-sky-400/40 focus:border-sky-300 rounded-xl text-xs font-bold text-white outline-none"
                        />
                      </div>

                      {/* Code */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-3xs font-black uppercase text-yellow-300/80 tracking-wider">
                            Passcode (4 Digits):
                          </label>
                          <button
                            type="button"
                            onClick={handleRollAccountCode}
                            className="text-3xs text-sky-400 hover:text-sky-300 font-bold underline cursor-pointer"
                          >
                            🎲 Roll Random
                          </button>
                        </div>
                        <input
                          type="text"
                          value={newMemberCode}
                          onChange={(e) => setNewMemberCode(e.target.value)}
                          placeholder="e.g. 2024, 7777, 5555"
                          maxLength={8}
                          className="w-full px-3 py-2 bg-[#0e0a03] border border-sky-400/40 focus:border-sky-300 rounded-xl text-xs font-mono font-black text-sky-300 tracking-widest outline-none"
                        />
                      </div>
                    </div>

                    {/* Emoji Avatar Select */}
                    <div className="space-y-1">
                      <label className="text-3xs font-black uppercase text-yellow-300/80 tracking-wider">
                        Avatar Icon:
                      </label>
                      <div className="flex flex-wrap gap-1.5 p-2 bg-[#0e0a03] rounded-xl border border-sky-400/30">
                        {['⭐', '👑', '🎮', '🍕', '🚀', '🔥', '🏆', '💎', '🍔', '🥤', '⚡', '🐱'].map((em) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => {
                              sound.playPop();
                              setNewMemberEmoji(em);
                            }}
                            className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                              newMemberEmoji === em
                                ? 'bg-sky-400 text-slate-950 scale-110 shadow-md ring-2 ring-sky-300'
                                : 'bg-slate-900/60 hover:bg-slate-800'
                            }`}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Submit button */}
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-500 hover:from-sky-300 hover:to-cyan-400 text-slate-950 font-black rounded-xl text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                    >
                      <UserPlus className="w-4 h-4 stroke-[2.5]" />
                      <span>Create & Save Person's Passcode</span>
                    </button>
                  </form>

                  {/* Registered Passcodes List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-3xs font-black uppercase text-yellow-300/90 tracking-wider">
                      <span>All Registered Passcodes ({accountsList.length}):</span>
                      <span className="text-sky-400">1-Tap Copy Code</span>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                      {accountsList.map((acc) => {
                        const isCopied = copiedMemberCode === acc.code;
                        const isBuiltin = ['1980', '2017', '1992', '2015'].includes(acc.code);

                        return (
                          <div
                            key={acc.code}
                            className="p-3 rounded-2xl bg-[#161108] border border-sky-400/30 hover:border-sky-400/60 transition-all flex flex-col gap-2.5"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-sky-950/80 border border-sky-400/40 flex items-center justify-center text-lg shadow-inner shrink-0">
                                  {acc.avatarEmoji}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-black text-white flex items-center gap-1.5 truncate">
                                    <span>{acc.name}</span>
                                    {acc.isOwner && (
                                      <span className="text-3xs bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded font-mono">
                                        Owner
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-3xs text-yellow-300/80 font-mono flex items-center gap-2 mt-0.5">
                                    <span className="font-bold">{acc.roleTitle}</span>
                                    <span>•</span>
                                    <span className="text-sky-300 font-black tracking-wider">
                                      Code: {acc.code}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleCopyMemberCode(acc.code)}
                                  className={`px-2.5 py-1.5 rounded-lg text-3xs font-mono font-black flex items-center gap-1 transition-all cursor-pointer border ${
                                    isCopied
                                      ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow'
                                      : 'bg-sky-950/60 hover:bg-sky-900 text-sky-300 border-sky-500/40 hover:text-white'
                                  }`}
                                >
                                  {isCopied ? (
                                    <>
                                      <Check className="w-3 h-3 text-slate-950" />
                                      <span>Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 text-sky-400" />
                                      <span>Copy Code</span>
                                    </>
                                  )}
                                </button>

                                {!isBuiltin && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMember(acc.code, acc.name)}
                                    className="p-1.5 bg-rose-950/40 hover:bg-rose-900 text-rose-400 hover:text-rose-200 rounded-lg text-3xs cursor-pointer transition-colors border border-rose-500/30"
                                    title="Delete custom passcode"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Owner A-Card Management Row */}
                            <div className="pt-2 border-t border-yellow-500/15 bg-black/40 -mx-3 -mb-3 p-3 rounded-b-2xl flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-3xs font-mono">
                                  <CreditCard className="w-3.5 h-3.5 text-yellow-400" />
                                  <span className="font-bold text-yellow-200/90">A-Card:</span>
                                  {acc.aCard ? (
                                    <span className="font-black text-emerald-400">
                                      {acc.aCard.balanceAed.toFixed(2)} AED ({acc.aCard.status})
                                    </span>
                                  ) : (
                                    <span className="text-yellow-500/50 italic">No card issued</span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCardUserCode(editingCardUserCode === acc.code ? null : acc.code);
                                      setCustomCardBalanceInput(acc.aCard ? String(acc.aCard.balanceAed) : '0');
                                    }}
                                    className="px-2 py-0.5 rounded-md bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-400/40 text-yellow-300 font-mono font-bold text-4xs transition-all cursor-pointer"
                                  >
                                    {editingCardUserCode === acc.code ? 'Close' : '👑 Edit Balance'}
                                  </button>

                                  {acc.aCard && (
                                    <button
                                      type="button"
                                      onClick={() => handleOwnerResetUserCard(acc)}
                                      className="px-2 py-0.5 rounded-md bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-mono font-bold text-4xs transition-all cursor-pointer"
                                      title="Completely reset user card"
                                    >
                                      Reset Card
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Admin Card Feedback */}
                              {cardAdminFeedback[acc.code] && (
                                <p className={`text-4xs font-mono font-bold ${
                                  cardAdminFeedback[acc.code].type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                  {cardAdminFeedback[acc.code].msg}
                                </p>
                              )}

                              {/* Owner Balance Adjustment Panel */}
                              {editingCardUserCode === acc.code && (
                                <div className="p-2.5 rounded-xl bg-[#1c1408] border border-yellow-500/30 space-y-2 animate-in fade-in duration-150">
                                  <div className="flex items-center justify-between text-4xs font-mono font-bold text-yellow-300">
                                    <span>SET EXACT BALANCE (0 - 10,000 AED):</span>
                                    <span>Current: {acc.aCard?.balanceAed?.toFixed(2) || '0.00'} AED</span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="number"
                                      min="0"
                                      max="10000"
                                      step="1"
                                      value={customCardBalanceInput}
                                      onChange={(e) => setCustomCardBalanceInput(e.target.value)}
                                      placeholder="e.g. 50"
                                      className="flex-1 px-2.5 py-1.5 bg-black/80 border border-yellow-500/40 rounded-lg text-xs font-mono font-bold text-white focus:outline-hidden"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const val = parseFloat(customCardBalanceInput);
                                        if (!isNaN(val) && val >= 0) {
                                          handleOwnerSetUserBalance(acc, val);
                                        }
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-yellow-500 text-slate-950 font-black font-mono text-3xs hover:bg-yellow-400 transition-all cursor-pointer"
                                    >
                                      Save
                                    </button>
                                  </div>

                                  {/* Quick preset buttons */}
                                  <div className="flex flex-wrap gap-1 pt-1">
                                    <span className="text-4xs font-mono text-yellow-400/70 mr-1 self-center">Presets:</span>
                                    {[0, 1, 5, 10, 20, 50, 100, 500, 1000].map((preset) => (
                                      <button
                                        key={preset}
                                        type="button"
                                        onClick={() => handleOwnerSetUserBalance(acc, preset)}
                                        className="px-1.5 py-0.5 rounded bg-yellow-500/10 hover:bg-yellow-500/25 border border-yellow-500/20 text-yellow-300 text-4xs font-mono font-bold transition-all cursor-pointer"
                                      >
                                        {preset === 0 ? '0 (Wipe)' : `${preset} AED`}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Abdul Owner Promo Codes Manager */}
              {activeTab === 'promo' && activeAccount.isOwner && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Header Banner */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-amber-600/20 border-2 border-amber-400/60 text-amber-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="font-black text-xs text-white uppercase tracking-wider font-mono">
                          Owner • Dirham-Off Promo Generator
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-3xs uppercase font-mono">
                        {promoCodes.length} Stored
                      </span>
                    </div>
                    <p className="text-3xs text-yellow-100/80 leading-relaxed font-medium">
                      Create short 5-character codes (like <strong className="text-yellow-300">Rsd0y</strong>) to give customers exact Dirham discounts at checkout!
                    </p>
                  </div>

                  {/* 1-Click Fast Presets */}
                  <div className="space-y-1.5">
                    <span className="text-3xs font-black text-yellow-400 uppercase tracking-wider flex items-center gap-1 font-mono">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>1-Click Preset Generators:</span>
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickCreatePreset(2, '2 AED Off')}
                        className="p-2 bg-[#181308] hover:bg-amber-950/60 border border-yellow-500/30 hover:border-yellow-400 rounded-xl text-center transition-all cursor-pointer group active:scale-95 shadow-sm"
                      >
                        <div className="text-xs font-mono font-black text-amber-300 group-hover:text-yellow-200">
                          -2.00 AED
                        </div>
                        <div className="text-3xs text-yellow-500/70 font-medium">Quick Snack</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickCreatePreset(5, '5 AED Off (Rsd0y)')}
                        className="p-2 bg-gradient-to-br from-amber-500/20 to-yellow-500/10 hover:from-amber-500/30 border border-amber-400/50 hover:border-amber-300 rounded-xl text-center transition-all cursor-pointer group active:scale-95 shadow-sm"
                      >
                        <div className="text-xs font-mono font-black text-yellow-300 group-hover:text-white">
                          -5.00 AED
                        </div>
                        <div className="text-3xs text-amber-300 font-bold">Rsd0y VIP</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickCreatePreset(10, '10 AED Off')}
                        className="p-2 bg-[#181308] hover:bg-amber-950/60 border border-yellow-500/30 hover:border-yellow-400 rounded-xl text-center transition-all cursor-pointer group active:scale-95 shadow-sm"
                      >
                        <div className="text-xs font-mono font-black text-amber-300 group-hover:text-yellow-200">
                          -10.00 AED
                        </div>
                        <div className="text-3xs text-yellow-500/70 font-medium">Mega Pass</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickCreatePreset(1, '1 AED Off')}
                        className="p-2 bg-[#181308] hover:bg-amber-950/60 border border-yellow-500/30 hover:border-yellow-400 rounded-xl text-center transition-all cursor-pointer group active:scale-95 shadow-sm"
                      >
                        <div className="text-xs font-mono font-black text-amber-300 group-hover:text-yellow-200">
                          -1.00 AED
                        </div>
                        <div className="text-3xs text-yellow-500/70 font-medium">Mini Treat</div>
                      </button>
                    </div>
                  </div>

                  {/* Custom Code Generator Form */}
                  <form onSubmit={handleCreatePromoSubmit} className="p-3.5 rounded-2xl bg-[#140e06] border border-yellow-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xs font-black uppercase text-yellow-400 tracking-wider flex items-center gap-1.5 font-mono">
                        <Plus className="w-3.5 h-3.5 text-yellow-400" />
                        <span>Custom Promo Code Creator</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRollCode()}
                        className="text-3xs text-yellow-300 hover:text-white font-mono font-bold flex items-center gap-1 cursor-pointer bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/30"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Roll Code</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Code Name */}
                      <div className="space-y-1">
                        <label className="text-3xs font-bold text-yellow-300/80 uppercase font-mono">
                          Code Name (e.g. Rsd0y)
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={newPromoCodeName}
                            onChange={(e) => setNewPromoCodeName(e.target.value)}
                            placeholder="e.g. Rsd0y"
                            maxLength={12}
                            className="flex-1 px-3 py-2 bg-black border border-yellow-500/40 focus:border-yellow-300 rounded-xl text-xs font-mono font-bold text-yellow-300 uppercase tracking-widest focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Dirham Off Amount */}
                      <div className="space-y-1">
                        <label className="text-3xs font-bold text-yellow-300/80 uppercase font-mono">
                          Dirhams Off (AED)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={0.5}
                            step={0.5}
                            value={newDirhamOff}
                            onChange={(e) => setNewDirhamOff(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                            className="w-full px-3 py-2 bg-black border border-yellow-500/40 focus:border-yellow-300 rounded-xl text-xs font-mono font-bold text-emerald-300 focus:outline-none pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-3xs font-mono font-bold text-yellow-500/70">
                            AED
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Min Spend and Single-Use */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-3xs font-bold text-yellow-300/80 uppercase font-mono">
                          Usage Rule
                        </label>
                        <button
                          type="button"
                          onClick={() => setNewIsSingleUse(!newIsSingleUse)}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer text-left flex items-center justify-between ${
                            newIsSingleUse
                              ? 'bg-amber-400/20 text-yellow-300 border-amber-400/50'
                              : 'bg-black/60 text-slate-400 border-slate-700'
                          }`}
                        >
                          <span>{newIsSingleUse ? '1-Time Use Only (Single-Use)' : 'Multiple Uses Allowed'}</span>
                          <span className="text-3xs px-1.5 py-0.5 rounded bg-yellow-400 text-slate-950 font-black">
                            {newIsSingleUse ? '1x' : 'Multi'}
                          </span>
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-3xs font-bold text-yellow-300/80 uppercase font-mono">
                          Min Cart Spend (0 = Any)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={newMinSpend}
                            onChange={(e) => setNewMinSpend(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-full px-3 py-2 bg-black border border-yellow-500/40 focus:border-yellow-300 rounded-xl text-xs font-mono font-bold text-yellow-200 focus:outline-none pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-3xs font-mono font-bold text-yellow-500/70">
                            AED
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <label className="text-3xs font-bold text-yellow-300/80 uppercase font-mono">
                        Description / Note
                      </label>
                      <input
                        type="text"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="e.g. VIP Member Perk"
                        className="w-full px-3 py-2 bg-black border border-yellow-500/40 focus:border-yellow-300 rounded-xl text-xs text-yellow-200 placeholder:text-yellow-600/40 focus:outline-none"
                      />
                    </div>

                    {promoCreateError && (
                      <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-200 text-3xs flex items-center gap-1.5 font-mono">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{promoCreateError}</span>
                      </div>
                    )}

                    {promoCreateSuccess && (
                      <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-3xs flex items-center gap-1.5 font-mono">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{promoCreateSuccess}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-300 text-slate-950 font-black rounded-xl text-xs font-mono transition-all cursor-pointer shadow-md vip-gold-bevel active:scale-98 flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>Save & Activate Promo Code</span>
                    </button>
                  </form>

                  {/* Stored Promo Codes List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-3xs font-black text-yellow-400 uppercase tracking-wider font-mono">
                      <span>All Active & Stored Promo Codes:</span>
                      <span>{promoCodes.filter((p) => p.isActive && !p.isUsed).length} Available</span>
                    </div>

                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
                      {promoCodes.map((p) => {
                        const isUsedUp = p.isUsed || (p.isSingleUse && (p.usageCount || 0) >= (p.maxUses || 1));
                        const isAvailable = p.isActive && !isUsedUp;

                        return (
                          <div
                            key={p.id}
                            className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                              isAvailable
                                ? 'bg-[#181308] border-yellow-500/40 hover:border-yellow-400'
                                : 'bg-black/40 border-slate-800 opacity-60'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-black text-xs text-yellow-300 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-500/30">
                                  {p.code}
                                </span>
                                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-3xs font-mono font-black px-1.5 py-0.2 rounded">
                                  -{p.dirhamOff.toFixed(2)} AED
                                </span>
                                
                                {isAvailable ? (
                                  <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/60 text-3xs font-mono font-bold px-1.5 py-0.2 rounded flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Available
                                  </span>
                                ) : isUsedUp ? (
                                  <span className="bg-rose-950/80 text-rose-300 border border-rose-500/60 text-3xs font-mono font-bold px-1.5 py-0.2 rounded">
                                    Used (1x Done)
                                  </span>
                                ) : (
                                  <span className="bg-amber-950/80 text-amber-300 border border-amber-500/60 text-3xs font-mono font-bold px-1.5 py-0.2 rounded">
                                    Expired
                                  </span>
                                )}

                                <span className="bg-yellow-500/10 text-yellow-300 text-3xs font-mono px-1.5 py-0.2 rounded">
                                  {p.isSingleUse ? '1-Time' : 'Multi'}
                                </span>
                              </div>
                              <p className="text-3xs text-yellow-100/70 truncate mt-1">
                                {p.description || 'VIP Promo Code'}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                              {/* Copy Button */}
                              <button
                                type="button"
                                onClick={() => handleCopyCode(p.code)}
                                className="px-2.5 py-1.5 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 hover:text-white rounded-lg text-3xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors border border-yellow-500/30"
                                title="Copy code"
                              >
                                <Copy className="w-3 h-3" />
                                <span>{copiedPromoCode === p.code ? 'Copied!' : 'Copy'}</span>
                              </button>

                              {/* Toggle or Reset Button */}
                              {isUsedUp ? (
                                <button
                                  type="button"
                                  onClick={() => handleResetUsage(p.id)}
                                  className="px-2 py-1.5 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 rounded-lg text-3xs font-mono font-bold cursor-pointer transition-colors border border-emerald-500/40"
                                  title="Reset 1-time use so it can be used again"
                                >
                                  Make Available
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleTogglePromo(p.id, p.isActive)}
                                  className={`px-2 py-1.5 rounded-lg text-3xs font-mono font-bold cursor-pointer transition-colors border ${
                                    p.isActive
                                      ? 'bg-rose-950/60 text-rose-300 border-rose-500/40 hover:bg-rose-900'
                                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900'
                                  }`}
                                  title={p.isActive ? 'Mark Expired' : 'Mark Available'}
                                >
                                  {p.isActive ? 'Make Expired' : 'Make Available'}
                                </button>
                              )}

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => handleDeletePromo(p.id, p.code)}
                                className="p-1.5 bg-rose-950/40 hover:bg-rose-900 text-rose-400 hover:text-rose-200 rounded-lg text-3xs cursor-pointer transition-colors border border-rose-500/30"
                                title="Delete code"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: Categories Studio for Abdul Owner ONLY */}
              {activeTab === 'categories' && activeAccount.code === '2015' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Header Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/70 via-[#0a1810] to-[#041009] border-2 border-emerald-400/60 shadow-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
                          <FolderPlus className="w-4 h-4 text-slate-950" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-mono">
                              Category Studio
                            </h3>
                            <span className="text-3xs bg-emerald-400 text-slate-950 font-black px-1.5 py-0.2 rounded font-mono">
                              Owner Only
                            </span>
                          </div>
                          <p className="text-3xs text-emerald-200/80 font-medium">
                            Create custom catalog categories & stickers, and choose any category to view
                          </p>
                        </div>
                      </div>
                      <span className="text-3xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-black border border-emerald-500/30">
                        {categoriesList.length} Categories
                      </span>
                    </div>
                  </div>

                  {/* Make Category Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newCatName.trim()) {
                        setCatCreateError('Please enter a category name.');
                        sound.playError();
                        return;
                      }
                      if (onSaveCategory) {
                        sound.playCashRegister();
                        onSaveCategory({
                          name: newCatName.trim(),
                          emoji: newCatEmoji.trim() || '🏷️',
                          subEmoji: newCatSubEmoji.trim() || undefined,
                          badge: newCatBadge.trim() || '🔥 HOT DEAL',
                          description: newCatDesc.trim() || `Exclusive catalog deals in ${newCatName.trim()}`,
                          gradient: newCatTheme.gradient,
                          themeColor: newCatTheme.key,
                          store: 'abdul',
                        });
                        setCatCreateSuccess(`✓ Category "${newCatName.trim()}" created & selected!`);
                        setNewCatName('');
                        setNewCatDesc('');
                        setCatCreateError('');
                        setTimeout(() => setCatCreateSuccess(''), 3000);
                      }
                    }}
                    className="p-4 rounded-2xl bg-[#140f06] border border-yellow-500/30 space-y-3 shadow-lg"
                  >
                    <div className="flex items-center justify-between border-b border-yellow-500/20 pb-2">
                      <span className="text-xs font-black text-yellow-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                        <span>✨ Make New Category (Owner Exclusive)</span>
                      </span>
                      <span className="text-3xs text-yellow-500/70 font-mono font-bold">
                        Custom Catalog Expansion
                      </span>
                    </div>

                    {catCreateError && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-3xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{catCreateError}</span>
                      </div>
                    )}

                    {catCreateSuccess && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-3xs font-black font-mono flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{catCreateSuccess}</span>
                      </div>
                    )}

                    {/* Name and Emojis */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="block text-3xs font-bold text-yellow-300 uppercase tracking-wider mb-1">
                          Category Name:
                        </label>
                        <input
                          type="text"
                          value={newCatName}
                          onChange={(e) => {
                            setNewCatName(e.target.value);
                            setCatCreateError('');
                          }}
                          placeholder="e.g. Pizza & Burgers / Minecraft Gear"
                          className="w-full px-3 py-2 bg-black/60 border border-yellow-500/30 focus:border-yellow-400 rounded-xl text-xs text-white placeholder-yellow-500/40 focus:outline-none font-bold"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-3xs font-bold text-yellow-300 uppercase tracking-wider mb-1">
                          Icons / Emojis:
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={newCatEmoji}
                            onChange={(e) => setNewCatEmoji(e.target.value)}
                            className="w-1/2 px-1.5 py-1.5 bg-black/60 border border-yellow-500/30 text-center rounded-xl text-sm text-white focus:outline-none"
                            maxLength={2}
                          />
                          <input
                            type="text"
                            value={newCatSubEmoji}
                            onChange={(e) => setNewCatSubEmoji(e.target.value)}
                            className="w-1/2 px-1.5 py-1.5 bg-black/60 border border-yellow-500/30 text-center rounded-xl text-sm text-white focus:outline-none"
                            placeholder="2nd"
                            maxLength={2}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick Pick Emojis */}
                    <div>
                      <span className="text-3xs text-yellow-500/70 font-bold uppercase tracking-wider mb-1 block">
                        Quick Emoji Suggestions:
                      </span>
                      <div className="flex flex-wrap gap-1 bg-black/50 p-1.5 rounded-xl border border-yellow-500/20 max-h-16 overflow-y-auto">
                        {EMOJI_QUICK_PICKS.map((em, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setNewCatEmoji(em)}
                            className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-transform hover:scale-110 cursor-pointer ${
                              newCatEmoji === em ? 'bg-yellow-400/30 border border-yellow-400' : 'bg-[#181308]'
                            }`}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sticker Tag */}
                    <div>
                      <label className="block text-3xs font-bold text-yellow-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-yellow-400" />
                        <span>Category Sticker / Badge:</span>
                      </label>
                      <input
                        type="text"
                        value={newCatBadge}
                        onChange={(e) => setNewCatBadge(e.target.value)}
                        placeholder="e.g. 🔥 HOT DEAL / ⚡ FLASH SALE / 👑 24K VIP"
                        className="w-full px-3 py-1.5 bg-black/60 border border-yellow-500/30 focus:border-yellow-400 rounded-xl text-xs text-white placeholder-yellow-500/40 focus:outline-none font-semibold mb-1.5"
                      />

                      {/* Quick Sticker Presets */}
                      <div className="flex flex-wrap gap-1 bg-black/50 p-1.5 rounded-xl border border-yellow-500/20 max-h-20 overflow-y-auto">
                        {STICKER_PRESETS.slice(0, 10).map((st, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              sound.playPop();
                              setNewCatBadge(st.label);
                            }}
                            className={`px-2 py-0.5 rounded text-3xs font-black transition-all cursor-pointer border ${
                              newCatBadge === st.label
                                ? 'bg-yellow-400 text-slate-950 border-yellow-300'
                                : 'bg-[#161007] text-yellow-200/90 border-yellow-500/30 hover:border-yellow-400'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Theme Selector */}
                    <div>
                      <span className="text-3xs text-yellow-500/70 font-bold uppercase tracking-wider mb-1 block">
                        Visual Color Theme:
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                        {CATEGORY_COLOR_THEMES.map((theme, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setNewCatTheme(theme)}
                            className={`p-1.5 rounded-lg text-3xs font-bold text-center transition-all cursor-pointer border flex flex-col items-center gap-0.5 ${
                              newCatTheme.name === theme.name
                                ? 'border-yellow-400 bg-yellow-400/20 ring-1 ring-yellow-400'
                                : 'border-yellow-500/20 bg-black/40 hover:border-yellow-400'
                            }`}
                          >
                            <div className={`w-full h-2 rounded bg-gradient-to-r ${theme.gradient}`} />
                            <span className="text-white truncate text-3xs w-full">{theme.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-3xs font-bold text-yellow-300 uppercase tracking-wider mb-1">
                        Category Description:
                      </label>
                      <input
                        type="text"
                        value={newCatDesc}
                        onChange={(e) => setNewCatDesc(e.target.value)}
                        placeholder="What deals belong in this category..."
                        className="w-full px-3 py-1.5 bg-black/60 border border-yellow-500/30 focus:border-yellow-400 rounded-xl text-xs text-white placeholder-yellow-500/40 focus:outline-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 font-mono"
                    >
                      <FolderPlus className="w-4 h-4 stroke-[2.5]" />
                      <span>✨ Create Category & Choose in Catalog</span>
                    </button>
                  </form>

                  {/* Choose / Switch Any Category Section */}
                  <div className="p-4 rounded-2xl bg-[#140f06] border border-yellow-500/30 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between border-b border-yellow-500/20 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-black text-white">
                          Choose / Switch Category ({categoriesList.length})
                        </span>
                      </div>
                      <span className="text-3xs text-yellow-300/70 font-mono">
                        Click any to view deals
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                      {categoriesList.map((cat) => {
                        const isCurrent = activeCategory === cat.id;

                        return (
                          <div
                            key={cat.id}
                            className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                              isCurrent
                                ? 'bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border-emerald-400 shadow-md ring-1 ring-emerald-400/40'
                                : 'bg-black/50 border-yellow-500/20 hover:border-yellow-500/40 hover:bg-[#1c1508]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-xl shrink-0 p-1.5 rounded-lg bg-black/60 border border-yellow-500/20">
                                {cat.emoji}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-black text-white truncate">
                                    {cat.name}
                                  </span>
                                  {cat.badge && (
                                    <span className="text-3xs px-1.5 py-0.2 rounded-full font-mono font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-500/30">
                                      {cat.badge}
                                    </span>
                                  )}
                                  {isCurrent && (
                                    <span className="text-3xs px-1.5 py-0.2 rounded-full font-mono font-black bg-emerald-400 text-slate-950">
                                      Active Now
                                    </span>
                                  )}
                                  {cat.isCustom && (
                                    <span className="text-3xs px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 font-mono">
                                      Custom
                                    </span>
                                  )}
                                </div>
                                <p className="text-3xs text-yellow-200/60 truncate mt-0.5">
                                  {cat.description || 'Category deals and items'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  sound.playPop();
                                  if (onSelectCategory) {
                                    onSelectCategory(cat.id);
                                  }
                                  onClose();
                                }}
                                className={`px-3 py-1.5 rounded-lg text-3xs font-mono font-black transition-all cursor-pointer flex items-center gap-1 border ${
                                  isCurrent
                                    ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                                    : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border-emerald-500/40'
                                }`}
                              >
                                <span>{isCurrent ? 'Viewing' : 'Choose'}</span>
                                <ArrowRight className="w-3 h-3" />
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
                                  className="p-1.5 bg-rose-950/40 hover:bg-rose-900 text-rose-400 rounded-lg text-3xs transition-colors border border-rose-500/30 cursor-pointer"
                                  title="Delete Custom Category"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Ideas On What Else To Add (Abdul Owner Code 2015 Only) */}
              {activeTab === 'ideas' && activeAccount.code === '2015' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Header Banner */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-amber-600/20 border-2 border-amber-400/60 text-amber-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="font-black text-xs text-white uppercase tracking-wider font-mono">
                          👑 2015 OWNER IDEA VAULT (SO MANY IDEAS TO ADD)
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-3xs uppercase font-mono">
                        50+ READY IDEAS
                      </span>
                    </div>
                    <p className="text-3xs text-yellow-100/80 leading-relaxed font-medium">
                      Browse all high-margin gaming boosts, room care, warm buns, iced karak & Minecraft OP survival ideas. Click <strong>"⚡ + Add to Store"</strong> on any item to publish it immediately!
                    </p>
                  </div>

                  {/* Open Full Ideas Modal Hub Button */}
                  {onOpenIdeasModal && (
                    <button
                      onClick={() => {
                        sound.playCashRegister();
                        onOpenIdeasModal();
                      }}
                      className="w-full p-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-between transition-all cursor-pointer group active:scale-98 font-mono vip-gold-bevel"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-slate-950 animate-bounce" />
                        <span>Open 50+ Full-Screen Idea Catalog Studio</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}

                  {/* Filter & Search Bar */}
                  <div className="p-3 rounded-2xl bg-[#140f06] border border-amber-500/30 space-y-2.5">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {[
                        { id: 'all', name: 'All', emoji: '💡' },
                        { id: 'rivals', name: 'Gaming', emoji: '🎮' },
                        { id: 'room', name: 'Room', emoji: '🛏️' },
                        { id: 'food', name: 'Food', emoji: '🥪' },
                        { id: 'drinks', name: 'Drinks', emoji: '🧋' },
                        { id: 'minecraft', name: 'Minecraft', emoji: '⛏️' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            sound.playPop();
                            setIdeaVaultCategory(cat.id);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-3xs font-black transition-all cursor-pointer shrink-0 border ${
                            ideaVaultCategory === cat.id
                              ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-mono'
                              : 'bg-black/60 text-amber-200/80 border-amber-500/30 hover:border-amber-400'
                          }`}
                        >
                          {cat.emoji} {cat.name}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400/60" />
                      <input
                        type="text"
                        value={ideaVaultSearch}
                        onChange={(e) => setIdeaVaultSearch(e.target.value)}
                        placeholder="Search 50+ ideas by name or profit..."
                        className="w-full pl-8 pr-3 py-1.5 bg-black/70 border border-amber-500/30 focus:border-amber-400 rounded-xl text-xs text-white placeholder-amber-500/40 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* 50+ Deal Ideas List with 1-Click Add */}
                  <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                    {getAllDealIdeas()
                      .filter((idea) => {
                        const matchesCat = ideaVaultCategory === 'all' || idea.categoryId === ideaVaultCategory;
                        const q = ideaVaultSearch.toLowerCase().trim();
                        const matchesQ = !q ||
                          idea.title.toLowerCase().includes(q) ||
                          idea.description.toLowerCase().includes(q) ||
                          idea.tag.toLowerCase().includes(q) ||
                          idea.whyItWorks.toLowerCase().includes(q);
                        return matchesCat && matchesQ;
                      })
                      .map((idea) => {
                        const isAdded = ideaVaultAddedIds.has(idea.id);
                        return (
                          <div
                            key={idea.id}
                            className={`p-3.5 rounded-2xl border transition-all space-y-2 group ${
                              isAdded
                                ? 'bg-emerald-950/20 border-emerald-500/50'
                                : 'bg-[#161108] border-amber-400/30 hover:border-amber-400/70'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-3xs font-black uppercase text-amber-400/90 tracking-wider font-mono">
                                {idea.categoryName}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {idea.profitTag && (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/30 text-amber-300 text-3xs font-black font-mono">
                                    {idea.profitTag}
                                  </span>
                                )}
                                <span className="text-xs font-mono font-black text-amber-300">
                                  {idea.priceAed.toFixed(2)} AED
                                </span>
                              </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                              <span className="text-2xl shrink-0">{idea.emoji}</span>
                              <div className="min-w-0">
                                <h4 className="text-xs font-black text-white group-hover:text-amber-300 transition-colors">
                                  {idea.title}
                                </h4>
                                <p className="text-3xs text-yellow-100/70 leading-relaxed mt-0.5 font-medium line-clamp-2">
                                  {idea.description}
                                </p>
                              </div>
                            </div>

                            <div className="p-2 rounded-xl bg-black/60 border border-amber-500/20 text-3xs text-yellow-200/80 flex items-start gap-1.5">
                              <Lightbulb className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-amber-300">Selling Tip: </span>
                                <span>{idea.whyItWorks}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-amber-500/20">
                              <span className="text-3xs text-amber-400/60 font-mono">
                                {idea.unit}
                              </span>

                              {onAddIdeaToCatalog && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    sound.playCashRegister();
                                    onAddIdeaToCatalog(idea);
                                    setIdeaVaultAddedIds((prev) => new Set([...prev, idea.id]));
                                  }}
                                  className={`px-3 py-1.5 rounded-xl text-3xs font-black font-mono transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-md ${
                                    isAdded
                                      ? 'bg-emerald-500 text-slate-950'
                                      : 'bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-yellow-300 hover:to-amber-300 text-slate-950'
                                  }`}
                                >
                                  {isAdded ? (
                                    <>
                                      <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
                                      <span>✓ Added to Store!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Zap className="w-3 h-3 text-slate-950 fill-slate-950" />
                                      <span>⚡ + Add to Live Catalog</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Secondary Store Expansion Ideas Section */}
                  <div className="pt-2 border-t border-amber-500/30">
                    <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>8 Major Store Upgrades & VIP Features</span>
                    </h4>
                    <div className="space-y-2">
                      {STORE_ADDITION_IDEAS.map((idea) => {
                        const isCopied = copiedIdeaId === idea.id;
                        return (
                          <div
                            key={idea.id}
                            className="p-3 rounded-xl bg-black/60 border border-amber-500/20 text-3xs text-yellow-100/80 flex items-center justify-between gap-2"
                          >
                            <div>
                              <div className="font-black text-white">{idea.title}</div>
                              <div className="text-3xs text-yellow-300/70">{idea.desc}</div>
                            </div>
                            <button
                              onClick={() => {
                                sound.playPop();
                                setCopiedIdeaId(idea.id);
                                setTimeout(() => setCopiedIdeaId(null), 2000);
                              }}
                              className="px-2 py-1 bg-amber-950/80 hover:bg-amber-900 border border-amber-400/40 text-amber-300 rounded-lg text-3xs font-black transition-all cursor-pointer shrink-0"
                            >
                              {isCopied ? '✓ Saved' : 'Save'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Action */}
              <button
                onClick={() => {
                  sound.playClick();
                  onClose();
                }}
                className="w-full py-3 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-yellow-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg hover:scale-[1.01] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 vip-gold-bevel"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Continue Shopping</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
