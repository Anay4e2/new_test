import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';

const icons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
} as const;

const labels = {
    light: 'Light mode',
    dark: 'Dark mode',
    system: 'System theme',
} as const;

export default function ThemeToggle() {
    const { theme, toggleTheme } = useThemeStore();
    const Icon = icons[theme];

    return (
        <button
            onClick={toggleTheme}
            className="relative p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200 group"
            aria-label={labels[theme]}
            title={labels[theme]}
        >
            <Icon className="w-5 h-5 text-slate-600 dark:text-slate-300 transition-transform duration-300 group-hover:rotate-12" />
        </button>
    );
}
