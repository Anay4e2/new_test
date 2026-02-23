import { Request, Response } from 'express';

// Static exchange rates relative to INR (1 INR = x foreign currency)
// Updated periodically — in production, use a live API
const BASE_RATES: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  AUD: 0.018,
  CAD: 0.016,
  SGD: 0.016,
  AED: 0.044,
  JPY: 1.78,
  THB: 0.42,
};

const SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
  AED: 'د.إ',
  JPY: '¥',
  THB: '฿',
};

let cachedRates = { ...BASE_RATES };
let lastFetchTime = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

async function fetchLiveRates(): Promise<void> {
  // Only refresh if cache expired
  if (Date.now() - lastFetchTime < CACHE_TTL) return;

  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    if (!apiKey) return; // Fall back to static rates

    const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/INR`);
    if (!response.ok) return;

    const data = await response.json();
    if (data.result === 'success' && data.conversion_rates) {
      for (const code of Object.keys(BASE_RATES)) {
        if (data.conversion_rates[code]) {
          cachedRates[code] = data.conversion_rates[code];
        }
      }
      lastFetchTime = Date.now();
    }
  } catch {
    // Silently fall back to static rates
  }
}

export const getExchangeRates = async (_req: Request, res: Response): Promise<void> => {
  await fetchLiveRates();

  res.json({
    success: true,
    base: 'INR',
    rates: cachedRates,
    symbols: SYMBOLS,
    cached: Date.now() - lastFetchTime < CACHE_TTL && lastFetchTime > 0,
  });
};

export const convertCurrency = async (req: Request, res: Response): Promise<void> => {
  const { amount, from, to } = req.query;

  if (!amount || !from || !to) {
    res.status(400).json({ success: false, message: 'amount, from, and to are required' });
    return;
  }

  await fetchLiveRates();

  const fromRate = cachedRates[String(from).toUpperCase()];
  const toRate = cachedRates[String(to).toUpperCase()];

  if (!fromRate || !toRate) {
    res.status(400).json({ success: false, message: 'Unsupported currency code' });
    return;
  }

  // Convert: amount in FROM → INR → TO
  const amountInINR = Number(amount) / fromRate;
  const converted = amountInINR * toRate;

  res.json({
    success: true,
    from: String(from).toUpperCase(),
    to: String(to).toUpperCase(),
    amount: Number(amount),
    converted: Math.round(converted * 100) / 100,
    rate: toRate / fromRate,
  });
};
