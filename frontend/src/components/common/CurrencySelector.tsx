import { FC, useEffect } from 'react';
import { useCurrencyStore } from '../../stores/currencyStore';

const CURRENCIES = [
  { code: 'INR', label: '₹ INR' },
  { code: 'USD', label: '$ USD' },
  { code: 'EUR', label: '€ EUR' },
  { code: 'GBP', label: '£ GBP' },
  { code: 'AUD', label: 'A$ AUD' },
  { code: 'CAD', label: 'C$ CAD' },
  { code: 'SGD', label: 'S$ SGD' },
  { code: 'AED', label: 'د.إ AED' },
  { code: 'JPY', label: '¥ JPY' },
];

export const CurrencySelector: FC<{ className?: string }> = ({ className }) => {
  const { currency, setCurrency, fetchRates, loaded } = useCurrencyStore();

  useEffect(() => {
    if (!loaded) fetchRates();
  }, [loaded, fetchRates]);

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      className={`bg-transparent border border-white/20 rounded-lg px-2 py-1 text-sm text-white/80 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className || ''}`}
      aria-label="Select currency"
    >
      {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code} className="bg-slate-800 text-white">
          {c.label}
        </option>
      ))}
    </select>
  );
};
