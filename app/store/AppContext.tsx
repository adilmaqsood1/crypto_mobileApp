import React, { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import { Holding, WatchlistItem, Notification, ScanResult, PortfolioSummary, MarketMetrics } from '../services/api';

interface AppState {
  // Portfolio
  holdings: Holding[];
  portfolioSummary: PortfolioSummary | null;
  
  // Watchlist
  watchlist: WatchlistItem[];
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // Scanner
  scanResults: ScanResult[];
  approvedOpportunities: ScanResult[];
  
  // Market
  marketMetrics: MarketMetrics | null;
  bitcoinPrice: number;
  bitcoinChange: number;
}

interface AppContextType extends AppState {
  // Portfolio actions
  setHoldings: (holdings: Holding[]) => void;
  setPortfolioSummary: (summary: PortfolioSummary) => void;
  
  // Watchlist actions
  setWatchlist: (items: WatchlistItem[]) => void;
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (coinId: string) => void;
  isInWatchlist: (coinId: string) => boolean;
  
  // Notification actions
  setNotifications: (notifications: Notification[]) => void;
  markAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Scanner actions
  setScanResults: (results: ScanResult[]) => void;
  approveOpportunity: (id: string) => void;
  setApprovedOpportunities: (opportunities: ScanResult[]) => void;
  
  // Market actions
  setMarketMetrics: (metrics: MarketMetrics) => void;
  setBitcoinPrice: (price: number, change: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    holdings: [],
    portfolioSummary: null,
    watchlist: [],
    notifications: [],
    unreadCount: 0,
    scanResults: [],
    approvedOpportunities: [],
    marketMetrics: null,
    bitcoinPrice: 0,
    bitcoinChange: 0,
  });

  // Portfolio actions
  const setHoldings = useCallback((holdings: Holding[]) => {
    setState(prev => ({ ...prev, holdings }));
  }, []);

  const setPortfolioSummary = useCallback((portfolioSummary: PortfolioSummary) => {
    setState(prev => ({ ...prev, portfolioSummary }));
  }, []);

  // Watchlist actions
  const setWatchlist = useCallback((watchlist: WatchlistItem[]) => {
    setState(prev => ({ ...prev, watchlist }));
  }, []);

  const addToWatchlist = useCallback((item: WatchlistItem) => {
    setState(prev => ({
      ...prev,
      watchlist: [...prev.watchlist, item],
    }));
  }, []);

  const removeFromWatchlist = useCallback((coinId: string) => {
    setState(prev => ({
      ...prev,
      watchlist: prev.watchlist.filter(item => item.coinId !== coinId),
    }));
  }, []);

  const isInWatchlist = useCallback((coinId: string) => {
    return state.watchlist.some(item => item.coinId === coinId);
  }, [state.watchlist]);

  // Notification actions
  const setNotifications = useCallback((notifications: Notification[]) => {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    setState(prev => ({ ...prev, notifications, unreadCount }));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setState(prev => {
      const notifications = prev.notifications.map(n =>
        n.id === id ? { ...n, isRead: true } : n
      );
      const unreadCount = notifications.filter(n => !n.isRead).length;
      return { ...prev, notifications, unreadCount };
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setState(prev => ({ ...prev, notifications: [], unreadCount: 0 }));
  }, []);

  // Scanner actions
  const setScanResults = useCallback((scanResults: ScanResult[]) => {
    setState(prev => ({ ...prev, scanResults }));
  }, []);

  const approveOpportunity = useCallback((id: string) => {
    setState(prev => {
      const opportunity = prev.scanResults.find(r => r.id === id);
      if (!opportunity) return prev;
      
      return {
        ...prev,
        scanResults: prev.scanResults.filter(r => r.id !== id),
        approvedOpportunities: [
          ...prev.approvedOpportunities,
          { ...opportunity, isApproved: true },
        ],
      };
    });
  }, []);

  const setApprovedOpportunities = useCallback((approvedOpportunities: ScanResult[]) => {
    setState(prev => ({ ...prev, approvedOpportunities }));
  }, []);

  // Market actions
  const setMarketMetrics = useCallback((marketMetrics: MarketMetrics) => {
    setState(prev => ({ ...prev, marketMetrics }));
  }, []);

  const setBitcoinPrice = useCallback((bitcoinPrice: number, bitcoinChange: number) => {
    setState(prev => ({ ...prev, bitcoinPrice, bitcoinChange }));
  }, []);

  const value = useMemo<AppContextType>(() => {
    return {
      ...state,
      setHoldings,
      setPortfolioSummary,
      setWatchlist,
      addToWatchlist,
      removeFromWatchlist,
      isInWatchlist,
      setNotifications,
      markAsRead,
      clearAllNotifications,
      setScanResults,
      approveOpportunity,
      setApprovedOpportunities,
      setMarketMetrics,
      setBitcoinPrice,
    };
  }, [
    state,
    setHoldings,
    setPortfolioSummary,
    setWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    setNotifications,
    markAsRead,
    clearAllNotifications,
    setScanResults,
    approveOpportunity,
    setApprovedOpportunities,
    setMarketMetrics,
    setBitcoinPrice,
  ]);

  return (
    <AppContext.Provider
      value={value}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
