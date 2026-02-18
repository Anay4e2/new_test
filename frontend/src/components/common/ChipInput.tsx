import { FC, useState, KeyboardEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChipInputProps {
    label: string;
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    className?: string;
}

const ChipInput: FC<ChipInputProps> = ({ label, value, onChange, placeholder, className = '' }) => {
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addChip();
        } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
            removeChip(value.length - 1);
        }
    };

    const addChip = () => {
        const trimmed = inputValue.trim();
        if (!trimmed) return;

        if (value.includes(trimmed)) {
            setError('Tag already exists');
            return;
        }

        onChange([...value, trimmed]);
        setInputValue('');
        setError('');
    };

    const removeChip = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 2000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    return (
        <div className={className}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {label}
            </label>
            <div className={`
                flex flex-wrap gap-2 items-center w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 
                border rounded-xl transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500
                ${error ? 'border-red-300 dark:border-red-500/50' : 'border-slate-200 dark:border-slate-600'}
            `}>
                <AnimatePresence mode="popLayout">
                    {value.map((chip, index) => (
                        <motion.span
                            key={chip + index}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            layout
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm bg-white dark:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-500 shadow-sm"
                        >
                            {chip}
                            <button
                                type="button"
                                onClick={() => removeChip(index)}
                                className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </motion.span>
                    ))}
                </AnimatePresence>

                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setError('');
                    }}
                    onKeyDown={handleKeyDown}
                    onBlur={() => addChip()}
                    placeholder={value.length === 0 ? placeholder : ''}
                    className="flex-1 bg-transparent min-w-[120px] outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400"
                />
            </div>
            {error && (
                <p className="mt-1 text-xs text-red-500 animate-pulse">{error}</p>
            )}
        </div>
    );
};

export default ChipInput;
