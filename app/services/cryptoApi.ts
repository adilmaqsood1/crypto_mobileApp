// Crypto API Service - Connects to backend API
import api from './api';

export interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
  timestamp: number;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isTriggered: boolean;
  createdAt: number;
}

// Default crypto symbols to track
export const DEFAULT_SYMBOLS = [
  'BTC',
  'ETH', 
  'SOL',
  'ADA',
  'DOT',
  'AVAX',
  'LINK',
  'MATIC',
  'UNI',
  'ATOM'
];

// Fetch live crypto prices from backend
export async function fetchCryptoPrices(symbols: string[] = DEFAULT_SYMBOLS): Promise<CryptoPrice[]> {
  try {
    // Call backend market/tickers endpoint
    // We pass symbols as comma separated string
    // The backend expects symbols without /USD typically, or we need to adjust.
    // Assuming backend handles "BTC" as "BTC/USDT" or similar.
    const cleanSymbols = symbols.map(s => s.replace('/USD', '').replace('/USDT', ''));
    const response = await api.getTickers(cleanSymbols);

    if (response.error || !response.data) {
      console.error('Error fetching crypto prices:', response.error);
      return [];
    }

    return response.data.map((item: any) => ({
      symbol: item.symbol + '/USD', // Add /USD for frontend compatibility
      name: item.name,
      price: item.current_price ?? 0,
      change: item.price_change_24h ?? 0,
      changePercent: item.price_change_percentage_24h ?? 0,
      high: item.high_24h ?? 0,
      low: item.low_24h ?? 0,
      open: item.open_price || item.current_price || 0, // Backend might not send open
      previousClose: (item.current_price ?? 0) - (item.price_change_24h ?? 0),
      volume: item.total_volume ?? 0,
      timestamp: Date.now() // or item.last_updated
    }));
  } catch (err) {
    console.error('Failed to fetch crypto prices:', err);
    return [];
  }
}

// Fetch single crypto price
export async function fetchCryptoPrice(symbol: string): Promise<CryptoPrice | null> {
  const prices = await fetchCryptoPrices([symbol]);
  return prices[0] || null;
}

// Price alert storage (using AsyncStorage in real app)
let priceAlerts: PriceAlert[] = [];

export function getPriceAlerts(): PriceAlert[] {
  return priceAlerts;
}

export function addPriceAlert(symbol: string, targetPrice: number, condition: 'above' | 'below'): PriceAlert {
  const alert: PriceAlert = {
    id: Date.now().toString(),
    symbol,
    targetPrice,
    condition,
    isTriggered: false,
    createdAt: Date.now()
  };
  priceAlerts.push(alert);
  return alert;
}

export function removePriceAlert(id: string): void {
  priceAlerts = priceAlerts.filter(a => a.id !== id);
}

export function checkPriceAlerts(prices: CryptoPrice[]): PriceAlert[] {
  const triggeredAlerts: PriceAlert[] = [];
  
  priceAlerts.forEach(alert => {
    if (alert.isTriggered) return;
    
    const priceData = prices.find(p => p.symbol === alert.symbol);
    if (!priceData) return;
    
    const triggered = alert.condition === 'above' 
      ? priceData.price >= alert.targetPrice
      : priceData.price <= alert.targetPrice;
    
    if (triggered) {
      alert.isTriggered = true;
      triggeredAlerts.push(alert);
    }
  });
  
  return triggeredAlerts;
}

// Symbol name mapping
export const CRYPTO_NAMES: Record<string, string> = {
  'BTC/USD': 'Bitcoin',
  'ETH/USD': 'Ethereum',
  'SOL/USD': 'Solana',
  'ADA/USD': 'Cardano',
  'DOT/USD': 'Polkadot',
  'AVAX/USD': 'Avalanche',
  'LINK/USD': 'Chainlink',
  'MATIC/USD': 'Polygon',
  'UNI/USD': 'Uniswap',
  'ATOM/USD': 'Cosmos',
  'NEAR/USD': 'NEAR Protocol',
  'ARB/USD': 'Arbitrum',
  'INJ/USD': 'Injective',
  'TIA/USD': 'Celestia',
  'SEI/USD': 'Sei',
  'RNDR/USD': 'Render',
  'FET/USD': 'Fetch.ai',
  'PYTH/USD': 'Pyth Network',
  'JUP/USD': 'Jupiter',
  'WLD/USD': 'Worldcoin'
};

export function getCryptoName(symbol: string): string {
  return CRYPTO_NAMES[symbol] || symbol.replace('/USD', '');
}
