import React, { useState, useEffect, useMemo } from 'react';
import { 
  CategoryId, 
  DealItem, 
  CartItem, 
  PlacedOrder,
  AuthorizedPerson 
} from './types';
import { CATEGORIES, ABDUL_RULES_AND_NOTES, ABDUL_CONTACT } from './data/dealsData';
import { DealIdea, DEAL_IDEAS_LIST } from './data/dealIdeasData';
import { getStoredDeals, saveStoredDeals, updateDealInCatalog, addDealToCatalog, deleteDealFromCatalog, resetCatalogToDefaults } from './utils/catalogStorage';
import { getStoredCategories, addCategoryToStorage, deleteCategoryFromStorage, CategoryInfo } from './utils/categoryStorage';
import { getAuthSession, clearAuthSession } from './utils/authStorage';
import { getCategoryBackground } from './utils/dealVisuals';
import { HeaderNavbar } from './components/HeaderNavbar';
import { HeroBanner } from './components/HeroBanner';
import { VipCardLounge } from './components/VipCardLounge';
import { OwnerIdeaVault } from './components/OwnerIdeaVault';
import { CategorySection } from './components/CategorySection';
import { CartDrawer } from './components/CartDrawer';
import { ReceiptModal } from './components/ReceiptModal';
import { DiscountPolicyModal } from './components/DiscountPolicyModal';
import { EditDealModal } from './components/EditDealModal';
import { DealIdeasModal } from './components/DealIdeasModal';
import { PasscodeModal } from './components/PasscodeModal';
import { AddCategoryModal } from './components/AddCategoryModal';
import { AccountModal } from './components/AccountModal';
import { PromoCodeGeneratorModal } from './components/PromoCodeGeneratorModal';
import { CommunityLoungeModal } from './components/CommunityLoungeModal';
import { LiveNotificationToast, NotificationItem } from './components/LiveNotificationToast';
import { redeemPromoCode } from './utils/promoCodeStorage';
import { MobileBottomNav } from './components/MobileBottomNav';
import { 
  UserAccount, 
  getActiveUserAccount, 
  saveActiveUserAccount, 
  seedInitialUserOrders,
  getStoredUserAccounts 
} from './utils/userAccounts';
import { 
  getNotificationSettings, 
  toggleNotifications, 
  subscribeToLiveUpdates, 
  getUnreadDMsCountForUser,
  getPendingIncomingRequests,
  getStoredDirectMessages 
} from './utils/communityChatStorage';
import { 
  ShoppingBag, 
  Sparkles, 
  Coins, 
  ArrowUp, 
  Search, 
  BadgePercent,
  Lightbulb,
  Crown,
  Plus,
  PhoneCall,
  Zap,
  KeyRound,
  MessageSquare
} from 'lucide-react';
import { sound } from './utils/audio';

const STORAGE_KEYS = {
  CART: 'abdul_deals_cart_v2',
  ORDERS: 'abdul_deals_orders_v2',
  SOUND: 'abdul_deals_sound_v2',
  MY_LAST_ORDER: 'abdul_deals_my_last_order_v2',
};

export default function App() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Catalog Deals State (Synced with localStorage)
  const [deals, setDeals] = useState<DealItem[]>(() => getStoredDeals());

  // Cart State (Sanitizing to ensure mega base is always 20.00 AED)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      if (!saved) return [];
      const parsed: CartItem[] = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item) => {
        if (
          item.deal.id === 'mc-build-pro-base' ||
          item.deal.title.toLowerCase().includes('mega base')
        ) {
          return {
            ...item,
            deal: {
              ...item.deal,
              id: 'mc-build-pro-base',
              priceAed: 20.0,
              priceFormatted: '20.00 AED',
              tag: 'Mega Base 20 AED',
              highlight: '👑 20 AED Mega Base',
            },
          };
        }
        return item;
      });
    } catch {
      return [];
    }
  });

  // Active User Account State (Codes: 1980 [Mazhar Iqbal], 2017 [Hamdaan], 1992 [Sara Batul], 2015 [Abdul])
  const [activeUserAccount, setActiveUserAccount] = useState<UserAccount | null>(() => getActiveUserAccount());
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Orders State (Reset completely so all accounts start at 0 orders until a real purchase is submitted)
  const [placedOrders, setPlacedOrders] = useState<PlacedOrder[]>(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
      localStorage.removeItem(STORAGE_KEYS.MY_LAST_ORDER);
      localStorage.removeItem('abdul_deals_initial_user_orders_seeded_v1');
    } catch {
      // ignore
    }
    return [];
  });

  // Current customer's own local receipt (for visitor's private confirmation)
  const [myRecentOrder, setMyRecentOrder] = useState<PlacedOrder | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MY_LAST_ORDER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SOUND);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Active Store ('abdul')
  const activeStore = 'abdul';

  // Categories State (Synced with localStorage)
  const [categoriesList, setCategoriesList] = useState<CategoryInfo[]>(() => getStoredCategories());
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);

  // Filter categories for Abdul Deals VIP Catalog
  const storeCategories = useMemo(() => {
    return categoriesList.filter((cat) => {
      if (cat.id === 'all') return true;
      const catStore = cat.store || 'abdul';
      return catStore === 'abdul' || catStore === 'both';
    });
  }, [categoriesList]);

  const handleSaveCategory = (newCat: Omit<CategoryInfo, 'id'>) => {
    const updated = addCategoryToStorage(newCat);
    setCategoriesList(updated);
    const newlyCreated = updated[updated.length - 1];
    if (newlyCreated) {
      setActiveCategory(newlyCreated.id as any);
      setTimeout(() => {
        handleScrollToSection(newlyCreated.id);
      }, 100);
    }
  };

  const handleDeleteCategory = (catId: string) => {
    const updated = deleteCategoryFromStorage(catId);
    setCategoriesList(updated);
    if (activeCategory === catId) {
      setActiveCategory('all');
    }
  };

  // Code Unlock State ('2015' for Abdul Deals)
  const [isAbdulUnlocked, setIsAbdulUnlocked] = useState<boolean>(false);
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);

  // Clear any legacy persisted unlock states from localStorage on mount
  useEffect(() => {
    localStorage.removeItem('isAbdulUnlocked');
    localStorage.removeItem('isHamdaanUnlocked');
  }, []);

  const isCurrentStoreUnlocked = isAbdulUnlocked;

  // Modal Visibility States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isEditDealModalOpen, setIsEditDealModalOpen] = useState(false);
  const [isIdeasModalOpen, setIsIdeasModalOpen] = useState(false);
  const [isPromoGeneratorOpen, setIsPromoGeneratorOpen] = useState(false);
  const [isCommunityLoungeOpen, setIsCommunityLoungeOpen] = useState(false);
  const [communityInitialTab, setCommunityInitialTab] = useState<'dms' | 'friends' | 'call'>('dms');
  const [communityFriendToDM, setCommunityFriendToDM] = useState<UserAccount | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCommunityCount, setUnreadCommunityCount] = useState<number>(0);
  const [notifSettings, setNotifSettings] = useState(() => getNotificationSettings());
  const [currentReceiptOrder, setCurrentReceiptOrder] = useState<PlacedOrder | null>(null);

  // Auth / Admin State
  const [currentUser, setCurrentUser] = useState<AuthorizedPerson | null>(() => {
    const session = getAuthSession();
    return session.isLoggedIn && session.currentUser ? session.currentUser : null;
  });

  // Deal Editing State (for catalog updates)
  const [selectedDealToEdit, setSelectedDealToEdit] = useState<DealItem | null>(null);
  const [defaultCategoryForNewDeal, setDefaultCategoryForNewDeal] = useState<string>('rivals');

  // Save cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  // Save orders to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(placedOrders));
    } catch (e) {
      console.error(e);
    }
  }, [placedOrders]);

  // Save my recent order
  useEffect(() => {
    try {
      if (myRecentOrder) {
        localStorage.setItem(STORAGE_KEYS.MY_LAST_ORDER, JSON.stringify(myRecentOrder));
      }
    } catch (e) {
      console.error(e);
    }
  }, [myRecentOrder]);

  // Live DMs & 1-on-1 Calls Notifications Listener
  useEffect(() => {
    const updateUnread = () => {
      const dmsUnread = activeUserAccount ? getUnreadDMsCountForUser(activeUserAccount.code) : 0;
      const pendingReqs = activeUserAccount ? getPendingIncomingRequests(activeUserAccount.code).length : 0;
      setUnreadCommunityCount(dmsUnread + pendingReqs);
      setNotifSettings(getNotificationSettings());
    };

    updateUnread();

    const unsubscribe = subscribeToLiveUpdates((event) => {
      updateUnread();
      const settings = getNotificationSettings();
      if (!settings.enabled) return;

      const myCode = activeUserAccount?.code?.toLowerCase().trim();
      const myName = activeUserAccount?.name?.toLowerCase().trim();

      if (event.type === 'direct_message' && event.payload) {
        const recipientCode = event.payload.recipientCode?.toLowerCase().trim();
        const senderCode = event.payload.senderCode?.toLowerCase().trim();
        if (myCode && recipientCode === myCode && senderCode !== myCode) {
          if (settings.sound && soundEnabled) sound.playVipFanfare();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate([120, 80, 120]); } catch (_) {}
          }

          // Browser Web Notification if tab is inactive or minimized
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              const sysNotif = new Notification(`Abdul Deals • ${event.payload.senderName}`, {
                body: `${event.payload.senderName}: ${event.payload.text}`,
                tag: `abdul-deals-dm-${event.payload.senderCode}`,
              });
              sysNotif.onclick = () => {
                window.focus();
                const allAccounts = getStoredUserAccounts();
                const senderAcc = allAccounts.find((a) => a.code === event.payload.senderCode);
                if (senderAcc) {
                  setCommunityFriendToDM(senderAcc);
                  setCommunityInitialTab('dms');
                }
                setIsCommunityLoungeOpen(true);
                sysNotif.close();
              };
            } catch (e) {
              console.warn('Native notification failed:', e);
            }
          }

          if (settings.showToasts) {
            const notif: NotificationItem = {
              id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              type: 'dm',
              title: 'Abdul Deals • New Message',
              senderName: event.payload.senderName,
              senderAvatar: event.payload.senderAvatar || '✉️',
              text: event.payload.text,
              timestamp: Date.now(),
              data: { senderCode: event.payload.senderCode },
            };
            setNotifications((prev) => [notif, ...prev.slice(0, 3)]);
          }
        }
      } else if (event.type === 'direct_call_start' && event.payload) {
        const recipientCode = event.payload.recipientCode?.toLowerCase().trim();
        const callerCode = event.payload.callerCode?.toLowerCase().trim();
        if (myCode && recipientCode === myCode && callerCode !== myCode) {
          if (settings.sound && soundEnabled) sound.playVipFanfare();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate([200, 100, 200, 100, 300]); } catch (_) {}
          }

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              const sysNotif = new Notification(`Abdul Deals • Incoming Call`, {
                body: `${event.payload.callerName} is calling you directly!`,
                tag: `abdul-deals-call-${event.payload.callerCode}`,
              });
              sysNotif.onclick = () => {
                window.focus();
                setIsCommunityLoungeOpen(true);
                setCommunityInitialTab('call');
                sysNotif.close();
              };
            } catch (e) {
              console.warn(e);
            }
          }

          if (settings.showToasts) {
            const notif: NotificationItem = {
              id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              type: 'dm',
              title: 'Abdul Deals • Incoming Call',
              senderName: event.payload.callerName,
              senderAvatar: event.payload.callerAvatar || '📞',
              text: `${event.payload.callerName} is calling you directly! Click to answer.`,
              timestamp: Date.now(),
              data: { senderCode: event.payload.callerCode },
            };
            setNotifications((prev) => [notif, ...prev.slice(0, 3)]);
          }
        }
      } else if (event.type === 'friend_request' && event.payload) {
        const toCode = event.payload.toUserCode?.toLowerCase().trim();
        const toName = event.payload.toUserName?.toLowerCase().trim();
        if ((myCode && toCode === myCode) || (myName && toName === myName)) {
          if (settings.sound && soundEnabled) sound.playVipFanfare();
          if (settings.showToasts) {
            const notif: NotificationItem = {
              id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              type: 'friend_request',
              title: 'Friend Request',
              senderName: event.payload.fromUserName,
              senderAvatar: event.payload.fromUserAvatar || '👤',
              text: `${event.payload.fromUserName} (VIP ${event.payload.fromUserCode}) sent you a friend request! Click to view & accept.`,
              timestamp: Date.now(),
              data: { senderCode: event.payload.fromUserCode },
            };
            setNotifications((prev) => [notif, ...prev.slice(0, 3)]);
          }
        }
      } else if (event.type === 'friend_accepted' && event.payload) {
        const fromCode = event.payload.fromUserCode?.toLowerCase().trim();
        if (myCode && fromCode === myCode) {
          if (settings.sound && soundEnabled) sound.playVipFanfare();
          if (settings.showToasts) {
            const notif: NotificationItem = {
              id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              type: 'friend_accepted',
              title: 'Friend Request Accepted',
              senderName: 'VIP Friends',
              senderAvatar: '🤝',
              text: `Your friend request was accepted! You can now send DMs and start 1-on-1 calls.`,
              timestamp: Date.now(),
            };
            setNotifications((prev) => [notif, ...prev.slice(0, 3)]);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [activeUserAccount, isCommunityLoungeOpen, soundEnabled]);

  // Event listener for opening Account Modal directly to A Card tab or modal
  useEffect(() => {
    const handleOpenACard = () => {
      setIsAccountModalOpen(true);
    };
    window.addEventListener('abdul_open_account_modal_acard', handleOpenACard);
    return () => window.removeEventListener('abdul_open_account_modal_acard', handleOpenACard);
  }, []);

  // Auto-dismiss old notifications after 7 seconds
  useEffect(() => {
    if (notifications.length === 0) return;
    const timer = setTimeout(() => {
      setNotifications((prev) => prev.slice(1));
    }, 7000);
    return () => clearTimeout(timer);
  }, [notifications]);

  // Cart total calculations
  const totalCartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const totalCartAed = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.customPriceAed ?? item.deal.priceAed) * item.quantity, 0);
  }, [cartItems]);

  // Handle adding items to cart (with optional treat timings & custom pricing)
  const handleAddToCart = (deal: DealItem, quantity: number, treatTimings?: string[], customPrice?: number) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.deal.id === deal.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        if (treatTimings && treatTimings.length > 0) {
          updated[existingIndex].treatTimings = treatTimings;
        }
        if (customPrice !== undefined) {
          updated[existingIndex].customPriceAed = customPrice;
        }
        return updated;
      }
      return [...prev, { deal, quantity, treatTimings, customPriceAed: customPrice }];
    });
  };

  // Handle updating quantity in cart
  const handleUpdateCartQty = (dealId: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.deal.id === dealId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Handle removing item from cart
  const handleRemoveCartItem = (dealId: string) => {
    setCartItems((prev) => prev.filter((item) => item.deal.id !== dealId));
  };

  // Handle clearing cart
  const handleClearCart = () => {
    setCartItems([]);
  };

  // Handle order submission from checkout
  const handleOrderPlaced = (order: PlacedOrder) => {
    if (order.promoCode) {
      redeemPromoCode(order.promoCode, order.id);
    }
    setPlacedOrders((prev) => [order, ...prev]);
    setMyRecentOrder(order);
    setCartItems([]);
    setIsCartOpen(false);
    setCurrentReceiptOrder(order);
  };

  // Handle status updates from Abdul Owner (Code 2015)
  const handleUpdateOrderStatus = (orderId: string, newStatus: PlacedOrder['status']) => {
    setPlacedOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
    );
  };

  // Deal Management Handlers
  const handleOpenEditDealModal = (deal: DealItem | null, defaultCategory: string = 'rivals') => {
    setSelectedDealToEdit(deal);
    setDefaultCategoryForNewDeal(defaultCategory);
    setIsEditDealModalOpen(true);
  };

  const handleOpenAddDealForCurrentStore = (defaultCat?: string) => {
    const validCats = storeCategories.filter((c) => c.id !== 'all');
    if (validCats.length === 0) {
      setIsAddCategoryModalOpen(true);
      return;
    }
    const catToUse = defaultCat && validCats.some((c) => c.id === defaultCat)
      ? defaultCat
      : validCats[0].id;
    handleOpenEditDealModal(null, catToUse);
  };

  const handleSaveDeal = (savedDeal: DealItem) => {
    if (selectedDealToEdit) {
      const updated = updateDealInCatalog(savedDeal);
      setDeals([...updated]);
    } else {
      const updated = addDealToCatalog(savedDeal);
      setDeals([...updated]);
    }
  };

  const handleDeleteDeal = (dealId: string) => {
    const updated = deleteDealFromCatalog(dealId);
    setDeals([...updated]);
  };

  // Add deal directly from ideas catalog
  const handleAddIdeaToCatalog = (idea: DealIdea) => {
    const newDeal: DealItem = {
      id: `deal-idea-${idea.id}-${Date.now()}`,
      categoryId: idea.categoryId,
      categoryName: idea.categoryName,
      store: activeStore,
      title: idea.title,
      originalText: idea.title,
      priceAed: idea.priceAed,
      priceFormatted: `${idea.priceAed.toFixed(2)} AED`,
      unit: idea.unit,
      emoji: idea.emoji,
      tag: idea.tag,
      description: idea.description,
      highlight: idea.highlight,
      tier: idea.tier,
      isCustom: true,
    };
    const updated = addDealToCatalog(newDeal);
    setDeals([...updated]);
  };

  // Sound toggle
  const handleToggleSound = () => {
    const next = sound.toggleSound();
    setSoundEnabled(next);
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND, JSON.stringify(next));
    } catch {}
  };

  // Scroll to section helper
  const handleScrollToSection = (sectionId: string) => {
    setActiveCategory(sectionId as CategoryId);
    const el = document.getElementById(`section-${sectionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filtered Deals by Store Portal and Search/Category
  const filteredDeals = useMemo(() => {
    const validCategoryIds = new Set(storeCategories.map((c) => c.id));

    let list = deals.filter((d) => {
      if (validCategoryIds.has(d.categoryId)) return true;
      if (d.store) {
        return d.store === 'both' || d.store === activeStore;
      }
      return false;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.categoryName.toLowerCase().includes(q) ||
          d.tag.toLowerCase().includes(q) ||
          (d.originalText && d.originalText.toLowerCase().includes(q))
      );
    }
    if (activeCategory !== 'all') {
      list = list.filter((d) => d.categoryId === activeCategory);
    }
    return list;
  }, [deals, searchQuery, activeCategory, storeCategories, activeStore]);

  // Group deals by category for rendering
  const categoryGroups = useMemo(() => {
    const groups: { [key: string]: DealItem[] } = {};

    storeCategories.forEach((cat) => {
      if (cat.id !== 'all') {
        groups[cat.id] = [];
      }
    });

    filteredDeals.forEach((deal) => {
      if (!groups[deal.categoryId]) {
        groups[deal.categoryId] = [];
      }
      groups[deal.categoryId].push(deal);
    });

    return groups;
  }, [filteredDeals, storeCategories]);

  const activeBgImage = activeCategory !== 'all' ? getCategoryBackground(activeCategory) : null;

  return (
    <div className="min-h-screen bg-[#070502] text-slate-100 flex flex-col font-sans selection:bg-yellow-400 selection:text-slate-950 relative overflow-x-hidden">
      
      {/* Full-Page Dynamic Atmospheric Thematic Background Wallpaper */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {activeBgImage ? (
          <div key={activeCategory} className="absolute inset-0 transition-all duration-700">
            <img
              src={activeBgImage}
              alt={`${activeCategory} full background`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center filter brightness-65 contrast-110 saturate-125 scale-105"
            />
            {/* Multi-layered rich dark vignette & gradient overlay for text readability & vivid visual glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#070502]/85 via-[#090603]/75 to-[#050301]/95"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#070502]/90 via-transparent to-[#070502]/90"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(234,179,8,0.15),transparent_75%)]"></div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#0e0a04] via-[#090703] to-[#040301]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(234,179,8,0.18),rgba(255,255,255,0))]"></div>
          </div>
        )}
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <HeaderNavbar
          activeCategory={activeCategory}
          onSelectCategory={(id) => {
            setActiveCategory(id);
            if (id !== 'all') {
              handleScrollToSection(id);
            }
          }}
          cartCount={totalCartCount}
          cartTotalAed={totalCartAed}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenDiscountModal={() => setIsDiscountModalOpen(true)}
          onOpenIdeasModal={() => setIsIdeasModalOpen(true)}
          onOpenAddDealModal={() => handleOpenEditDealModal(null, activeCategory === 'all' ? 'rivals' : activeCategory)}
          onOpenAddCategoryModal={() => setIsAddCategoryModalOpen(true)}
          categoriesList={storeCategories}
          isStoreUnlocked={isCurrentStoreUnlocked}
          onOpenPasscodeModal={() => setIsPasscodeModalOpen(true)}
          activeStore={activeStore}
          onOpenMyRecentReceipt={() => {
            if (myRecentOrder) setCurrentReceiptOrder(myRecentOrder);
          }}
          hasRecentLocalOrder={!!myRecentOrder}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          activeAccount={activeUserAccount}
          onOpenAccountModal={() => setIsAccountModalOpen(true)}
          onOpenPromoGenerator={() => setIsPromoGeneratorOpen(true)}
          onOpenCommunityLounge={() => {
            setCommunityInitialTab('dms');
            setIsCommunityLoungeOpen(true);
          }}
          unreadCommunityCount={unreadCommunityCount}
          isNotificationsMuted={!notifSettings.enabled}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-28 md:pb-20">
          
          {/* ABDUL DEALS CATALOG VIEW */}
          <>
            {/* Active Category Page Header Banner if a single category is selected */}
            {activeCategory !== 'all' && activeBgImage && (
                <div className="mb-6 rounded-3xl overflow-hidden border-2 border-yellow-400/50 shadow-2xl relative bg-black/80">
                  <div className="h-44 sm:h-56 relative w-full overflow-hidden">
                    <img
                      src={activeBgImage}
                      alt={activeCategory}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center filter brightness-90 contrast-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/60"></div>
                    
                    <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                      <div>
                        <span className="text-3xs font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-yellow-400 text-slate-950 font-mono shadow-md inline-block mb-1.5">
                          ACTIVE THEME PAGE: {categoriesList.find(c => c.id === activeCategory)?.name || activeCategory}
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black text-white drop-shadow-md">
                          {categoriesList.find(c => c.id === activeCategory)?.name || activeCategory}
                        </h2>
                        <p className="text-xs sm:text-sm text-yellow-200/90 font-medium max-w-xl mt-0.5">
                          {activeCategory === 'rivals' && 'Roblox Rivals Arena featuring RPG Rocket Launcher, Tactical AK-47 & Weapon Rack.'}
                          {activeCategory === 'food' && 'Hot crispy burgers, grilled buns, and rich Nutella hazelnut jars.'}
                          {activeCategory === 'drinks' && 'Iced fresh lemonade, traditional spiced Karak chai & steaming green tea.'}
                          {activeCategory === 'minecraft' && 'Diamond Pickaxe, Netherite Axe, Sword, Heavy Mace & Minecraft voxel blocks.'}
                          {activeCategory === 'room' && 'Spotless bed making, Middle Room care, and scrub brush maintenance.'}
                          {activeCategory === 'cats' && 'Cat litter box daily cleaning and cat treats feeding.'}
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveCategory('all')}
                        className="px-3.5 py-1.5 bg-black/80 hover:bg-yellow-400 hover:text-slate-950 text-yellow-300 border border-yellow-400/40 rounded-xl text-xs font-bold transition-all cursor-pointer self-start sm:self-auto backdrop-blur-sm"
                      >
                        ← View All Categories
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Hero Banner (Shown when on All or general view) */}
              {activeCategory === 'all' && (
                <>
                  <HeroBanner
                    onOpenDiscountModal={() => setIsDiscountModalOpen(true)}
                    onScrollToSection={handleScrollToSection}
                    onOpenCart={() => setIsCartOpen(true)}
                    onOpenIdeasModal={() => setIsIdeasModalOpen(true)}
                    onOpenAddDealModal={() => handleOpenAddDealForCurrentStore('rivals')}
                    isStoreUnlocked={isCurrentStoreUnlocked}
                    onOpenPasscodeModal={() => setIsPasscodeModalOpen(true)}
                    isOwner2015={activeUserAccount?.code === '2015'}
                  />

                  {/* 24K VIP Member Lounge & Digital Pass Card */}
                  <VipCardLounge
                    onOpenDiscountModal={() => setIsDiscountModalOpen(true)}
                    onOpenCart={() => setIsCartOpen(true)}
                  />

                  {/* 👑 2015 OWNER IDEA VAULT: SO MANY IDEAS TO ADD (Exclusively visible when logged into Owner Code 2015) */}
                  {activeUserAccount?.isOwner && activeUserAccount?.code === '2015' && (
                    <OwnerIdeaVault
                      onAddIdeaToCatalog={handleAddIdeaToCatalog}
                      existingDealTitles={deals.map((d) => d.title)}
                      onOpenEditDealModal={(cat) => handleOpenAddDealForCurrentStore(cat || 'rivals')}
                      onSelectCategory={(catId) => {
                        setActiveCategory(catId as any);
                        handleScrollToSection(catId);
                      }}
                    />
                  )}
                </>
              )}
            </>

          {/* Search Results Banner if active */}
          {searchQuery && (
            <div className="my-8 p-4 bg-slate-900/80 border border-white/[0.08] rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-white">
                  Search results for <span className="text-amber-400">"{searchQuery}"</span>
                </span>
                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                  {filteredDeals.length} found
                </span>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-slate-400 hover:text-white underline cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          )}

          {/* Dynamic Category Sections for the active store */}
          <div className="mt-8 space-y-12">
            {storeCategories
              .filter((cat) => cat.id !== 'all')
              .map((cat) => {
                if (activeCategory !== 'all' && activeCategory !== cat.id) return null;
                const dealsForCat = categoryGroups[cat.id] || [];

                if (dealsForCat.length === 0 && activeCategory === 'all') {
                  return null;
                }

                return (
                  <CategorySection
                    key={cat.id}
                    categoryId={cat.id as any}
                    categoryName={cat.name}
                    categoryEmoji={cat.emoji}
                    subEmoji={cat.subEmoji || '✨'}
                    badge={cat.badge || 'VIP'}
                    description={cat.description}
                    gradient={cat.gradient || 'from-yellow-400 via-amber-400 to-yellow-600'}
                    deals={dealsForCat}
                    cartItems={cartItems}
                    onAddToCart={handleAddToCart}
                    onUpdateCartQty={handleUpdateCartQty}
                    currentUser={currentUser}
                    onEditDeal={handleOpenEditDealModal}
                    onAddDealToCategory={(catId) => handleOpenAddDealForCurrentStore(catId)}
                    isStoreUnlocked={isCurrentStoreUnlocked}
                    activeAccount={activeUserAccount}
                    onOpenAccountModal={() => setIsAccountModalOpen(true)}
                  />
                );
              })}
          </div>

        {/* Empty state if search found nothing */}
        {filteredDeals.length === 0 && (
          <div className="py-16 text-center text-slate-400 bg-slate-900/40 border border-white/[0.06] rounded-3xl p-8">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-white/[0.06] flex items-center justify-center text-2xl mx-auto mb-4">
              🔍
            </div>
            <h3 className="text-base font-bold text-white mb-2">No matching deals found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
              Try searching for "Green tea", "Chai", "Rivals", "Bed", "Nutella", "Oven", "1T", or "Base".
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="px-5 py-2.5 bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Interactive Deal Ideas Showcase Deck */}
        <div className="mt-12 p-6 sm:p-8 bg-gradient-to-br from-[#241908] via-[#161005] to-[#0c0903] border-2 border-yellow-500/40 rounded-3xl shadow-2xl relative overflow-hidden ring-1 ring-yellow-400/20">
          <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-400/15 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/20 border border-yellow-400/50 text-yellow-300 text-3xs font-black uppercase tracking-wider">
                <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
                <span>24K ROYAL EXPANSION GUIDE • 20+ EXCLUSIVE VIP IDEAS</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span className="bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-300 bg-clip-text text-transparent drop-shadow-sm">
                  Looking to Add More VIP Deals to Your Store?
                </span>
                <span>💡</span>
              </h3>
              <p className="text-xs sm:text-sm text-yellow-100/85 leading-relaxed font-normal">
                We've brainstormed 20+ high-demand VIP services modeled directly on Abdul Deals: <strong>Rivals VIP Duo Boosts</strong>, <strong>Instant Wardrobe Folding</strong>, <strong>Hot 2-Min Indomie Noodles</strong>, <strong>Saffron Karak Tea</strong>, and <strong>Minecraft OP Netherite Kits</strong>! Click below to review and add them in 1 click.
              </p>
            </div>

            <button
              onClick={() => {
                sound.playCashRegister();
                setIsIdeasModalOpen(true);
              }}
              className="px-6 py-3.5 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-yellow-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer shrink-0 select-none vip-gold-bevel"
            >
              <Lightbulb className="w-4 h-4 text-slate-950" />
              <span>Explore & Add VIP Ideas</span>
              <span className="bg-slate-950 text-yellow-400 text-3xs px-2 py-0.5 rounded-full font-mono font-black">
                20+
              </span>
            </button>
          </div>
        </div>

        {/* Abdul Guarantees & Policy Banner */}
        <div className="mt-14 pt-10 border-t-2 border-yellow-500/30">
          <div className="text-center mb-8">
            <h3 className="text-lg font-black text-white flex items-center justify-center gap-2">
              <Crown className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-300 bg-clip-text text-transparent drop-shadow-sm font-black">
                Abdul Deals Official 24K VIP Service Standards
              </span>
            </h3>
            <p className="text-xs text-yellow-200/80 mt-1">
              Fixed pricing in UAE Dirhams (AED) and Fils with direct in-person discount options • Call Abdul directly at <strong className="text-yellow-300 font-mono font-black">{ABDUL_CONTACT.phoneDisplay}</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ABDUL_RULES_AND_NOTES.map((rule, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 bg-gradient-to-b from-[#1c1508] to-[#120e06] border-2 border-yellow-500/25 rounded-2xl space-y-1.5 hover:border-yellow-400/60 transition-colors shadow-lg"
              >
                <div className="text-sm font-black text-yellow-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>{rule.title}</span>
                </div>
                <p className="text-xs text-yellow-100/85 leading-relaxed">
                  {rule.description}
                </p>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Floating Bottom Quick Checkout Bar on Desktop/Tablet (When cart has items) */}
      {totalCartCount > 0 && !isCartOpen && (
        <div className="hidden md:block fixed bottom-5 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-md animate-in slide-in-from-bottom duration-300">
          <div className="p-3.5 bg-gradient-to-r from-[#201708] via-[#140e04] to-[#0c0802] border-2 border-yellow-400/60 rounded-2xl shadow-2xl shadow-yellow-950/90 flex items-center justify-between gap-3 backdrop-blur-xl ring-1 ring-yellow-400/30">
            <div className="flex items-center gap-3 pl-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center font-black text-sm relative shadow-md vip-gold-bevel">
                <ShoppingBag className="w-5 h-5 text-slate-950" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-3xs flex items-center justify-center border border-white font-mono font-bold">
                  {totalCartCount}
                </span>
              </div>
              <div>
                <div className="text-3xs font-black uppercase tracking-wider text-yellow-400">
                  Total 24K VIP Order
                </div>
                <div className="text-base font-black text-yellow-300 font-mono drop-shadow-sm">
                  {totalCartAed.toFixed(2)} AED
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playCashRegister();
                setIsCartOpen(true);
              }}
              className="py-2.5 px-5 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-300 active:scale-98 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-yellow-500/25 transition-all flex items-center gap-2 cursor-pointer vip-gold-bevel"
            >
              <span>View Cart & Receipt</span>
              <span className="text-sm">→</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Fixed for phone viewports) */}
      <MobileBottomNav
        cartCount={totalCartCount}
        cartTotalAed={totalCartAed}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenDiscountModal={() => setIsDiscountModalOpen(true)}
        onOpenPasscodeModal={() => setIsPasscodeModalOpen(true)}
        activeStore={activeStore}
        onGoToTop={() => {
          setActiveCategory('all');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectCategory={(id) => {
          setActiveCategory(id);
          if (id !== 'all') {
            handleScrollToSection(id);
          }
        }}
        activeCategory={activeCategory}
        activeAccount={activeUserAccount}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
      />

      {/* Floating Quick Live DM Bubble for Mobile */}
      <button
        onClick={() => {
          sound.playPop();
          setCommunityInitialTab('dms');
          setIsCommunityLoungeOpen(true);
        }}
        className="md:hidden fixed bottom-18 right-3.5 z-40 p-3 rounded-full bg-gradient-to-tr from-cyan-600 via-sky-500 to-cyan-400 text-slate-950 shadow-[0_4px_20px_rgba(6,182,212,0.5)] border-2 border-white/80 active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
        title="Open Direct Messages & Calls"
      >
        <MessageSquare className="w-5 h-5 text-slate-950 fill-current" />
        {unreadCommunityCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-black text-3xs font-mono border-2 border-slate-950 animate-bounce shadow-md">
            {unreadCommunityCount}
          </span>
        )}
      </button>

      {/* Footer */}
      <footer className="bg-gradient-to-t from-[#060402] to-[#0c0803] border-t-2 border-yellow-500/30 py-8 text-center text-yellow-200/70 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-black text-yellow-300">
            <Crown className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-300 bg-clip-text text-transparent font-black">Abdul Deals 24K Royal VIP</span>
            <span className="select-none">✨ ⛏️ 🛏️ 🍋 🥪</span>
          </div>

          <div className="text-3xs text-yellow-300/80 flex items-center gap-2 font-medium">
            <span>VIP Hotline: <strong className="font-mono text-yellow-300 font-bold">{ABDUL_CONTACT.phoneDisplay}</strong></span>
            <span>•</span>
            <span>Official UAE Dirhams Store & Live Receipt Generator</span>
          </div>

          <div className="flex items-center gap-4 text-3xs font-semibold">
            <button
              onClick={() => setIsIdeasModalOpen(true)}
              className="hover:text-yellow-300 text-yellow-400 transition-colors cursor-pointer flex items-center gap-1 font-bold"
            >
              <Lightbulb className="w-3 h-3" />
              <span>Deal Ideas</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setIsDiscountModalOpen(true)}
              className="hover:text-yellow-300 transition-colors cursor-pointer"
            >
              VIP Discounts
            </button>
            <span>•</span>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-yellow-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3 h-3" />
            </button>
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onOrderPlaced={handleOrderPlaced}
        activeAccount={activeUserAccount}
        placedOrders={placedOrders}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        onOpenPromoGenerator={() => setIsPromoGeneratorOpen(true)}
      />

      {/* VIP User Account & Sign In Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        activeAccount={activeUserAccount}
        onLoginSuccess={(acc) => {
          setActiveUserAccount(acc);
        }}
        onLogout={() => {
          saveActiveUserAccount(null);
          setActiveUserAccount(null);
        }}
        placedOrders={placedOrders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onClearAllOrders={() => setPlacedOrders([])}
        onOpenIdeasModal={() => setIsIdeasModalOpen(true)}
        onAddIdeaToCatalog={handleAddIdeaToCatalog}
        onOpenPromoGenerator={() => setIsPromoGeneratorOpen(true)}
        categoriesList={storeCategories}
        activeCategory={activeCategory}
        onSelectCategory={(catId) => {
          setActiveCategory(catId as any);
          setIsAccountModalOpen(false);
          handleScrollToSection(catId);
        }}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
        onOpenAddCategoryModal={() => {
          setIsAccountModalOpen(false);
          setIsAddCategoryModalOpen(true);
        }}
      />

      {/* Customer Receipt Modal */}
      <ReceiptModal
        order={currentReceiptOrder}
        onClose={() => setCurrentReceiptOrder(null)}
        placedOrders={placedOrders}
      />

      {/* Dirham-Off Promo Code Generator Modal (Code 2015 Abdul Owner Tool) */}
      <PromoCodeGeneratorModal
        isOpen={isPromoGeneratorOpen}
        onClose={() => setIsPromoGeneratorOpen(false)}
        activeAccount={activeUserAccount}
        onOwnerLoginSuccess={(acc) => {
          setActiveUserAccount(acc);
        }}
      />

      {/* In-person Discount Policy Modal */}
      <DiscountPolicyModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
      />

      {/* Edit or Create Deal Modal */}
      <EditDealModal
        isOpen={isEditDealModalOpen}
        onClose={() => setIsEditDealModalOpen(false)}
        dealToEdit={selectedDealToEdit}
        defaultCategoryId={defaultCategoryForNewDeal}
        categoriesList={storeCategories}
        onSaveDeal={handleSaveDeal}
        onDeleteDeal={handleDeleteDeal}
        canDelete={true}
      />

      {/* Add Custom Category & Sticker Modal (Code 2015 Studio) */}
      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        activeStore={activeStore}
        onSaveCategory={handleSaveCategory}
        categoriesList={storeCategories}
        activeCategory={activeCategory}
        onSelectCategory={(catId) => {
          setActiveCategory(catId as any);
          setIsAddCategoryModalOpen(false);
          handleScrollToSection(catId);
        }}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* Deal Ideas & Expansions Modal (2015 Owner Only) */}
      <DealIdeasModal
        isOpen={isIdeasModalOpen}
        onClose={() => setIsIdeasModalOpen(false)}
        onAddIdeaToCatalog={handleAddIdeaToCatalog}
        existingDealTitles={deals.map((d) => d.title)}
        isOwner2015={activeUserAccount?.code === '2015'}
        onUnlockWithCode={(code) => {
          if (code === '2015') {
            const ownerAcc = getStoredUserAccounts().find((a) => a.code === '2015');
            if (ownerAcc) {
              setActiveUserAccount(ownerAcc);
              saveActiveUserAccount(ownerAcc);
            }
            setIsAbdulUnlocked(true);
            return true;
          }
          return false;
        }}
      />

      {/* Passcode Unlock Modal */}
      <PasscodeModal
        isOpen={isPasscodeModalOpen}
        onClose={() => setIsPasscodeModalOpen(false)}
        activeStore={activeStore}
        isUnlocked={isCurrentStoreUnlocked}
        onUnlockSuccess={() => {
          setIsAbdulUnlocked(true);
        }}
      />

      {/* Community Lounge: Live Chat, DMs, Friends & Voice Call Modal */}
      <CommunityLoungeModal
        isOpen={isCommunityLoungeOpen}
        onClose={() => setIsCommunityLoungeOpen(false)}
        currentUser={activeUserAccount}
        onOpenAuth={() => {
          setIsCommunityLoungeOpen(false);
          setIsAccountModalOpen(true);
        }}
        allDeals={deals}
        onAddToCart={handleAddToCart}
        initialTab={communityInitialTab}
        initialFriendToDM={communityFriendToDM}
      />

      {/* Floating In-App Live Notifications */}
      <LiveNotificationToast
        notifications={notifications}
        onDismiss={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
        onMuteAll={() => {
          const updated = toggleNotifications();
          setNotifSettings(updated);
          setNotifications([]);
        }}
        isMuted={!notifSettings.enabled}
        onOpenAction={(notif) => {
          setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
          if (notif.type === 'dm' && notif.data?.senderCode) {
            const allAccounts = getStoredUserAccounts();
            const senderAcc = allAccounts.find((a) => a.code === notif.data.senderCode);
            if (senderAcc) {
              setCommunityFriendToDM(senderAcc);
              setCommunityInitialTab('dms');
            } else {
              setCommunityInitialTab('dms');
            }
          } else if (notif.type === 'friend_request' || notif.type === 'friend_accepted') {
            setCommunityInitialTab('friends');
          } else {
            setCommunityInitialTab('dms');
          }
          setIsCommunityLoungeOpen(true);
        }}
      />

      </div>
    </div>
  );
}
