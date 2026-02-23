import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getExchangeRates } from '../services/api';

interface CurrencyState {
  currency: string;
  rates: Record<string, number>;
  symbols: Record<string, string>;
  loaded: boolean;

  setCurrency: (code: string) => void;
  fetchRates: () => Promise<void>;
  convert: (amountINR: number) => number;
  format: (amountINR: number) => string;
  symbol: () => string;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: 'INR',
      rates: { INR: 1 },
      symbols: { INR: '₹' },
      loaded: false,

      setCurrency: (code: string) => {
        set({ currency: code });
      },

      fetchRates: async () => {
        try {
          const data = await getExchangeRates();
          if (data.success) {
            set({ rates: data.rates, symbols: data.symbols, loaded: true });
          }
        } catch {
          // Keep defaults
        }
      },

      convert: (amountINR: number) => {
        const { currency, rates } = get();
        const rate = rates[currency] || 1;
        return Math.round(amountINR * rate * 100) / 100;
      },

      format: (amountINR: number) => {
        const { currency, rates, symbols } = get();
        const rate = rates[currency] || 1;
        const converted = Math.round(amountINR * rate * 100) / 100;
        const sym = symbols[currency] || currency;

        if (currency === 'INR') {
          return `${sym}${converted.toLocaleString('en-IN')}`;
        }
        return `${sym}${converted.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      },

      symbol: () => {
        const { currency, symbols } = get();
        return symbols[currency] || currency;
      },
    }),
    {
      name: 'currency-storage',
      partialize: (state) => ({ currency: state.currency }),
    }
  )
);
