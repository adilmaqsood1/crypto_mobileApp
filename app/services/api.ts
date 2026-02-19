// API Service Layer with Axios-like structure
// Using fetch for React Native compatibility

const API_BASE_URL = 'https://api.hikmahai.io/api';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

class ApiService {
  private token: string | null = null;
  private onSessionExpired: (() => void) | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  setSessionExpiredHandler(handler: () => void) {
    this.onSessionExpired = handler;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401 && this.onSessionExpired) {
          this.onSessionExpired();
        }
        return {
          data: null,
          error: data?.detail || data?.message || 'Request failed',
          status: response.status,
        };
      }

      return { data, error: null, status: response.status };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  // Auth endpoints
  async login(username: string, password: string) {
    // Backend expects { username, password }
    return this.request<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async signup(email: string, password: string, name: string) {
    // Backend expects { email, password, username, full_name }
    // We'll use email as username for simplicity or derive it
    const username = email.split('@')[0];
    return this.request<{ access_token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        password, 
        username, 
        full_name: name,
        user_type: 'individual' 
      }),
    });
  }

  async logout() {
    // Backend doesn't have explicit logout (JWT), just client side clear
    return { data: { success: true }, error: null, status: 200 };
  }

  // Dashboard endpoints
  async getTickers(symbols: string[]) {
    try {
      const response = await this.request<any[]>(`/market/tickers?symbols=${symbols.join(',')}&limit=${symbols.length}`);
      if (response.data) {
        return response;
      }
      throw new Error('No data');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Request failed';
      if (!__DEV__) {
        return { data: null, error: errorMessage, status: 0 };
      }
      const mockTickers = symbols.map(symbol => ({
        symbol: symbol.includes('/') ? symbol.split('/')[0] : symbol,
        name: symbol.includes('/') ? symbol.split('/')[0] : symbol,
        current_price: 50000 + Math.random() * 1000,
        price_change_24h: 100 + Math.random() * 50,
        price_change_percentage_24h: 2.5,
        high_24h: 52000,
        low_24h: 49000,
        total_volume: 1000000,
        market_cap: 1000000000000
      }));
      return { data: mockTickers, error: null, status: 200 };
    }
  }

  async getNews() {
    // Using Saudi Financial news as default
    const response = await this.request<any[]>('/news/saudi-financial');
    if (response.data) {
        return {
            data: response.data.map((item: any) => ({
                id: item.url || Math.random().toString(), // Use URL as ID if id missing
                title: item.title,
                source: item.source || 'Hikmah News',
                time: item.published_date || 'Just now',
                url: item.url,
                imageUrl: item.image_url || 'https://via.placeholder.com/150'
            })),
            error: null,
            status: response.status
        };
    }
    return { data: [], error: response.error, status: response.status };
  }

  async getBitcoinPrice() {
    // Use realtime endpoints to get BTC data
    try {
      const [historyRes, overviewRes] = await Promise.all([
        this.request<any>('/realtime/historical-ticks?symbol=BTC&limit=500'),
        this.request<any>('/realtime/market-overview')
      ]);

      const historyData = historyRes.data?.data || [];
      const overviewData = overviewRes.data?.data || {};
      const btcData = overviewData.bitcoin || {};

      // If we have history data, use it. If not, generate fallback mock data in dev only
      let finalHistory = [];
      if (historyData.length > 0) {
        finalHistory = historyData.map((h: any) => ({ timestamp: h.timestamp, price: h.price ?? 0 }));
      } else if (__DEV__) {
        const now = Date.now();
        const points = 288; // 24 hours * 12 points/hour
        let price = btcData.price || 50000;
        
        for (let i = points; i >= 0; i--) {
          const timestamp = now - (i * 5 * 60 * 1000);
          // Volatility: 0.5% standard deviation
          const change = (Math.random() - 0.5) * 0.01; 
          price = price * (1 + change);
          finalHistory.push({ timestamp, price });
        }
      }

      if (finalHistory.length > 0 || btcData.price) {
        return {
          data: {
            price: btcData.price ?? 0,
            change24h: 0,
            changePercent24h: btcData.change_24h ?? 0,
            high24h: 0,
            low24h: 0,
            volume24h: 0,
            marketCap: 0,
            history: finalHistory
          } as BitcoinPrice,
          error: null,
          status: 200
        };
      }
      throw new Error('No data from API');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Request failed';
      if (!__DEV__) {
        return { data: null, error: errorMessage, status: 0 };
      }
      const now = Date.now();
      const points = 288; // 24 hours * 12 points/hour (every 5 mins)
      const mockHistory = [];
      let currentPrice = 50000;
      
      // Generate data going back 24 hours to fill the default 1D view
      for (let i = points; i >= 0; i--) {
        const timestamp = now - (i * 5 * 60 * 1000); // 5 minute intervals
        
        // Random walk with mean reversion and volatility to create "heartbeat" look
        // Volatility 0.2% per step
        const change = (Math.random() - 0.5) * 0.004; 
        currentPrice = currentPrice * (1 + change);
        
        // Add some sine wave for trend
        currentPrice += Math.sin(i / 20) * 50;
        
        mockHistory.push({
          timestamp,
          price: currentPrice
        });
      }
      
      return {
        data: {
          price: mockHistory[mockHistory.length - 1].price,
          change24h: 0,
          changePercent24h: 2.5,
          high24h: Math.max(...mockHistory.map(h => h.price)),
          low24h: Math.min(...mockHistory.map(h => h.price)),
          volume24h: 1000000,
          marketCap: 1000000000000,
          history: mockHistory
        } as BitcoinPrice,
        error: null, // Suppress error to show mock data
        status: 200
      };
    }
  }

  async getMarketMetrics() {
    const response = await this.request<any>('/realtime/market-overview');
    if (response.data && response.data.data) {
        const data = response.data.data;
        return {
            data: {
                fearGreedIndex: data.fear_greed?.value ?? 50,
                fearGreedLabel: data.fear_greed?.label ?? 'Neutral',
                btcDominance: data.bitcoin?.dominance ?? 0,
                totalMarketCap: data.market_cap?.value ?? 0,
                totalVolume24h: 0 // Not provided in overview
            } as MarketMetrics,
            error: null,
            status: response.status
        };
    }
    return { data: null, error: response.error, status: response.status };
  }

  async getPortfolioSummary() {
    try {
      const [summaryRes, performanceRes, holdingsRes] = await Promise.all([
        this.request<any>('/crypto-portfolio/summary'),
        this.request<any>('/crypto-portfolio/performance?period=24h'),
        this.request<any[]>('/crypto-portfolio/holdings')
      ]);

      if (summaryRes.data) {
        const summary = summaryRes.data;
        const performanceObj = performanceRes.data;
        const performance = Array.isArray(performanceObj) 
          ? performanceObj 
          : (performanceObj && typeof performanceObj === 'object' && 'performance_data' in performanceObj 
              ? (performanceObj as any).performance_data 
              : []);
        const holdings = holdingsRes.data || [];
        
        const investedFromHoldings = holdings.reduce((sum, h) => {
          const qty = Number(h.amount) || Number(h.total_amount) || 0;
          const entry = Number(h.avg_price) || Number(h.average_price) || 0;
          return sum + qty * entry;
        }, 0);
        const currentFromHoldings = holdings.reduce((sum, h) => {
          return sum + (Number(h.value) || Number(h.total_value) || 0);
        }, 0);

        const currentValue = Number(summary.total_value) || currentFromHoldings || 0;
        const totalPnL = Number(summary.total_pnl) || Number(summary.total_unrealized_pnl) || (currentValue - investedFromHoldings);
        const totalPnLPercent = Number(summary.total_pnl_percent) || Number(summary.total_unrealized_pnl_percent) || (investedFromHoldings ? (totalPnL / investedFromHoldings) * 100 : 0);
        const totalInvested = investedFromHoldings || (currentValue - totalPnL);

        let dailyPnL = 0;
        let dailyPnLPercent = 0;

        if (performance.length > 0) {
          const sortedPerf = [...performance].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
          const startValue = Number(sortedPerf[0]?.portfolio);
          const endValue = Number(sortedPerf[sortedPerf.length - 1]?.portfolio);

          if (Number.isFinite(startValue) && Number.isFinite(endValue)) {
            dailyPnL = endValue - startValue;
            dailyPnLPercent = startValue !== 0 ? (dailyPnL / startValue) * 100 : 0;
          }
        }

        return {
          data: {
            totalInvested,
            currentValue,
            totalPnL,
            totalPnLPercent,
            dailyPnL,
            dailyPnLPercent
          } as PortfolioSummary,
          error: null,
          status: 200
        };
      }
      
      // If API fails or returns no data, return null or error
      // But for better UX, if it's just an error, we might fall back to 0s or handle upstream
      if (summaryRes.error) {
         return { data: null, error: summaryRes.error, status: summaryRes.status };
      }
      
    } catch (error) {
       console.error("Error fetching portfolio summary:", error);
       if (!__DEV__) {
         const errorMessage = error instanceof Error ? error.message : 'Request failed';
         return { data: null, error: errorMessage, status: 0 };
       }
    }
    
    // Fallback/Mock data if request fails (e.g. offline or no auth)
    return {
        data: {
            totalInvested: 0,
            currentValue: 0,
            totalPnL: 0,
            totalPnLPercent: 0,
            dailyPnL: 0,
            dailyPnLPercent: 0
        } as PortfolioSummary,
        error: null,
        status: 200
    };
  }

  async getPortfolioPerformance(period: string = '24h') {
    return this.request<PortfolioPerformancePoint[]>(`/crypto-portfolio/performance?period=${period}`);
  }

  // Portfolio endpoints
  async getHoldings() {
    const response = await this.request<any[]>('/crypto-portfolio/holdings');
    if (response.data) {
        const holdings = response.data.map((h: any) => ({
            id: h.id || h.symbol,
            coinId: h.coin_id || h.symbol.toLowerCase(),
            symbol: h.symbol,
            name: h.name,
            icon: h.image || `https://assets.coingecko.com/coins/images/1/small/${h.symbol.toLowerCase()}.png`, // Fallback
            quantity: h.amount ?? h.total_amount ?? 0,
            avgBuyPrice: h.avg_price ?? h.average_price ?? 0,
            currentPrice: h.current_price ?? 0,
            investedValue: (h.amount ?? h.total_amount ?? 0) * (h.avg_price ?? h.average_price ?? 0),
            currentValue: h.value ?? h.total_value ?? 0,
            pnl: h.pnl ?? h.unrealized_pnl ?? 0,
            pnlPercent: h.pnl_percent ?? h.unrealized_pnl_percent ?? 0
        }));
        return { data: holdings, error: null, status: response.status };
    }
    return { data: null, error: response.error, status: response.status };
  }

  async addHolding(coinId: string, quantity: number, buyPrice: number) {
    // coinId usually is symbol in this backend context for simplicity, or we need a symbol
    // Assuming coinId is passed as symbol (e.g. "BTC") or we need to look it up.
    // The backend expects: { symbol, amount, avg_price, ... }
    const symbol = coinId.toUpperCase(); // Simplification
    return this.request<Holding>('/crypto-portfolio/holdings', {
      method: 'POST',
      body: JSON.stringify({ 
          symbol: symbol, 
          total_amount: quantity, 
          average_price: buyPrice,
          coin_id: coinId 
      }),
    });
  }

  async removeHolding(symbol: string) {
    return this.request(`/crypto-portfolio/holdings/${symbol}`, {
      method: 'DELETE',
    });
  }

  // Scanner endpoints
  async scanOpportunities(interval: string, strategy: string) {
    const mode = strategy === 'Volume' ? 'volume-spike' : strategy === 'Hikmah' ? 'buy' : 'buy';
    
    // Determine the endpoint based on authentication or specific needs
    // For now, using the open endpoint for buy opportunities as it doesn't require auth
    // and returns top 100 symbols. Adjust if authenticated endpoint is preferred.
    // If strategy is Volume, use volume-spike as requested
    const effectiveStrategy = strategy === 'Volume' ? 'volume-spike' : strategy;
    
    // The simple scanner endpoint accepts 'mode' or 'strategy' parameters depending on implementation
    // Assuming 'mode' maps to strategy type based on previous usage
    const endpoint = `/simple/buy-opportunities?interval=${encodeURIComponent(interval)}&strategy=${encodeURIComponent(effectiveStrategy)}`;
    
    const response = await this.request<any>(endpoint);

    if (response.data && response.data.opportunities) {
      const results = response.data.opportunities.map((item: any) => ({
        id: item.id || Math.random().toString(),
        symbol: item.symbol || '',
        name: item.name || '',
        category: item.category || 'Crypto',
        price: item.current_price ?? 0,
        change1h: item.price_change_24h ?? 0, // Mapping 24h to 1h for now as API might return 24h
        change24h: item.price_change_24h ?? 0,
        change7d: 0, // Not provided in open endpoint
        marketCap: item.market_cap ?? 0,
        volume24h: item.volume_24h ?? 0,
        momentum: item.ek_score ?? 0, // Using EK Score as momentum proxy
        rsi: item.rsi ?? 50,
        ekScore: item.ek_score ?? 0,
        ohlc5m: { open: 0, high: 0, low: 0, close: 0 },
        sparkline: item.last_7_days || [],
        isApproved: false, // Open endpoint results are not approved/persisted yet
        status: 'potential'
      }));
      return { data: results, error: null, status: response.status };
    }
    return { data: [], error: response.error, status: response.status };
  }

  async approveOpportunity(opportunityId: string) {
    // Not implemented in backend yet?
    return { data: null, error: 'Not implemented', status: 501 };
  }

  async getApprovedOpportunities() {
    const response = await this.request<any[]>('/scanner/approved-trades');
    if (response.data) {
        const results = response.data.map((item: any) => ({
            id: item.id || Math.random().toString(),
            symbol: item.symbol || '',
            name: item.name || '',
            category: item.category || 'Crypto',
            price: item.entry_price ?? 0,
            change1h: item.return_1h ?? 0,
            change24h: item.return_1h ?? 0, // Using 1h as proxy if 24h not in ApprovedTrade
            change7d: 0,
            marketCap: 0, // Not in ApprovedTrade
            volume24h: item.volume ?? 0,
            momentum: item.ek_score ?? 0, // Using EK Score as momentum proxy
            rsi: item.rsi ?? 50,
            ekScore: item.ek_score ?? 0,
            ohlc5m: { open: 0, high: 0, low: 0, close: 0 },
            sparkline: [],
            isApproved: true,
            status: item.status || 'pending'
        }));
        return { data: results, error: null, status: response.status };
    }
    return { data: [], error: response.error, status: response.status };
  }

  async getClosedTrades(limit: number = 50, daysBack: number = 30) {
    const response = await this.request<ClosedTrade[]>(`/scanner/closed-trades?limit=${limit}&days_back=${daysBack}`);
    return { data: response.data || [], error: response.error, status: response.status };
  }

  // Courses endpoints
  async getCourses() {
    // Placeholder - backend might not have courses
    return { data: [], error: null, status: 200 };
  }

  async getCourseById(courseId: string) {
    return { data: null, error: 'Not found', status: 404 };
  }

  // Watchlist endpoints
  async getWatchlist() {
    const response = await this.request<any[]>('/watchlist');
    if (response.data) {
        // Map backend watchlist to frontend with safety defaults
        const watchlist = response.data.map((item: any) => ({
            id: item.id || Math.random().toString(),
            coinId: item.coinId || item.symbol?.toLowerCase() || '',
            symbol: item.symbol || '',
            name: item.name || '',
            icon: item.icon || item.image || '',
            price: item.price ?? 0,
            change24h: item.change24h ?? 0,
            changePercent24h: item.changePercent24h ?? 0,
            marketCap: item.marketCap ?? 0,
            volume24h: item.volume24h ?? 0,
            sparkline: item.sparkline || []
        }));
        return { data: watchlist, error: null, status: response.status };
    }
    return { data: [], error: response.error, status: response.status };
  }

  async addToWatchlist(coinId: string) {
    return this.request<WatchlistItem>('/watchlist', {
      method: 'POST',
      body: JSON.stringify({ symbol: coinId }),
    });
  }

  async removeFromWatchlist(coinId: string) {
    return this.request(`/watchlist/${coinId}`, {
      method: 'DELETE',
    });
  }

  // Notifications endpoints
  async getNotifications() {
    return this.request<Notification[]>('/notifications');
  }

  async markNotificationRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }

  async clearNotifications() {
    return this.request('/notifications', {
      method: 'DELETE',
    });
  }

  // User endpoints
  async getUserProfile() {
    const response = await this.request<any>('/auth/profile');
    if (response.data) {
        return {
            data: {
                id: response.data.id,
                email: response.data.email,
                name: response.data.full_name,
                avatar: response.data.avatar_url,
                createdAt: response.data.created_at
            },
            error: null,
            status: response.status
        };
    }
    return { data: null, error: response.error, status: response.status };
  }

  async updateUserProfile(data: Partial<User>) {
    return this.request<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ full_name: data.name, ...data }),
    });
  }

  // Trading Bot endpoints
  async getTradingBotStatus() {
    return this.request<TradingBotStatus>('/trading-bot/status');
  }

  async getTradingBotCredentials() {
    return this.request<TradingBotCredentialResponse[]>('/trading-bot/credentials');
  }

  async saveTradingBotCredentials(data: TradingBotCredentialRequest) {
    return this.request<TradingBotCredentialResponse>('/trading-bot/credentials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async revokeTradingBotCredentials() {
    return this.request<{ success: boolean; message: string }>('/trading-bot/credentials', {
      method: 'DELETE',
    });
  }

  async executeTradingBotSignal(data: TradingBotExecutionRequest) {
    return this.request<TradingBotExecutionResponse>('/trading-bot/execute', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTradingBotExecutions(status?: string, limit: number = 200) {
    let url = `/trading-bot/executions?limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    return this.request<TradingBotExecutionResponse[]>(url);
  }

  // Auto-Trade Config endpoints
  async getAutoTradeConfig() {
    return this.request<AutoTradeConfig>('/simple/auto-trade/config');
  }

  async setAutoTradeConfig(config: AutoTradeConfig) {
    return this.request<AutoTradeConfig>('/simple/auto-trade/config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }
}

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface BitcoinPrice {
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
  history: { timestamp: number; price: number }[];
}

export interface MarketMetrics {
  fearGreedIndex: number;
  fearGreedLabel: string;
  btcDominance: number;
  totalMarketCap: number;
  totalVolume24h: number;
}

export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  dailyPnL: number;
  dailyPnLPercent: number;
}

export interface PortfolioPerformancePoint {
  time: string;
  btc: number;
  eth: number;
  portfolio: number;
  volume: number;
  sentiment: number;
}

export interface Holding {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  icon: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  investedValue: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
}

export interface ScanResult {
  id: string;
  symbol: string;
  name: string;
  category: string;
  price: number;
  change1h: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  momentum: number;
  rsi: number;
  ekScore: number;
  ohlc5m: { open: number; high: number; low: number; close: number };
  sparkline: number[];
  isApproved?: boolean;
  status?: string;
}

export interface PartialFill {
  qty: number;
  price: number;
  reason: string;
  at: string;
}

export interface ClosedTrade {
  id: string;
  symbol: string;
  category: string;
  trade_type: 'buy' | 'sell';
  entry_price: number;
  exit_price: number;
  quantity: number;
  invested_amount: number;
  exit_value: number;
  pnl_amount: number;
  pnl_percentage: number;
  partial_fills?: PartialFill[];
  entry_time: string;
  exit_time: string;
  duration: number;
  return_percent: number;
  strategy: string;
  momentum_trigger: string;
  interval_selected: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  lessons: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  instructor: string;
  rating: number;
  enrolled: number;
}

export interface CourseDetail extends Course {
  syllabus: { title: string; duration: string }[];
  overview: string;
}

export interface WatchlistItem {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  icon: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  marketCap: number;
  volume24h: number;
  sparkline: number[];
}

export interface Notification {
  id: string;
  type: 'trade' | 'alert' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface TradingBotStatus {
  credentials_connected: boolean;
  auto_trade_enabled: boolean;
  exchange: string | null;
  testnet: boolean | null;
}

export interface TradingBotCredentialResponse {
  exchange: string;
  api_key_preview: string;
  permissions: string[];
  testnet: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
}

export interface TradingBotCredentialRequest {
  exchange?: string;
  api_key?: string;
  api_secret?: string;
  passphrase?: string;
  permissions?: string[];
  testnet?: boolean;
}

export interface TradingBotExecutionResponse {
  id: string;
  status: string;
  symbol: string;
  side: string;
  order_type: string;
  quantity: number;
  price: number | null;
  exchange: string;
  created_at: string;
}

export interface TradingBotExecutionRequest {
  signal_id?: string;
  symbol?: string;
  side?: string;
  order_type?: string;
  quantity: number;
  price?: number;
  idempotency_key?: string;
}

export interface AutoTradeConfig {
  enabled: boolean;
  max_total_usd: number;
  per_trade_usd?: number;
  mode?: string;
  interval?: string;
  symbols?: string[];
  close_strategy?: string;
  lookback?: string;
  max_symbols?: number;
}

export const api = new ApiService();
export default api;
