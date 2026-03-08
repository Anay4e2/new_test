import { FC, useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import ThemeToggle from './ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { LanguageSelector } from './LanguageSelector';
import { Menu, X, User, LogOut, LayoutDashboard, Star, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

const publicLinks = [
    { to: '/', label: 'Home' },
    { to: '/explore', label: 'Explore' },
    { to: '/plan', label: 'Plan Trip' },
    { to: '/packages', label: 'Packages' },
    { to: '/weather', label: 'Weather' },
    { to: '/safety', label: 'Safety' },
    { to: '/restaurants', label: 'Restaurants' },
    { to: '/trains', label: 'Trains' },
    { to: '/festivals', label: 'Festivals' },
];

const authLinks = [
    { to: '/dashboard', label: 'My Trips' },
];

function getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export const Navbar: FC = () => {
    const { isAuthenticated, user, logout } = useAuthStore();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Close user dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Hide navbar on admin pages (admin panel has its own sidebar)
    if (location.pathname === '/admin' || location.pathname.startsWith('/admin/')) {
        return null;
    }

    const allLinks = [...publicLinks, ...(isAuthenticated() ? authLinks : [])];

    return (
        <nav className="sticky top-0 z-50 backdrop-blur bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800" role="navigation" aria-label="Main navigation">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 shrink-0">
                        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xs">T</span>
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-white text-sm">TripPlanner</span>
                    </Link>

                    {/* Desktop links */}
                    <div className="hidden lg:flex items-center gap-1">
                        {allLinks.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={clsx(
                                    'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                                    location.pathname === link.to
                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right side controls */}
                    <div className="flex items-center gap-2">
                        <NotificationBell />
                        <LanguageSelector />
                        <ThemeToggle />
                        {isAuthenticated() ? (
                            <div className="hidden sm:block relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    aria-label="User menu"
                                >
                                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                                        {getInitials(user?.name)}
                                    </div>
                                    <span className="text-xs font-medium max-w-[80px] truncate text-slate-700 dark:text-slate-200">{user?.name?.split(' ')[0]}</span>
                                    <ChevronDown size={12} className={clsx('transition-transform text-slate-400', userMenuOpen && 'rotate-180')} />
                                </button>
                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
                                        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                                            <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{user?.name}</p>
                                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                                        </div>
                                        <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                                            <User size={14} /> Profile
                                        </Link>
                                        <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                                            <LayoutDashboard size={14} /> Dashboard
                                        </Link>
                                        <Link to="/my-reviews" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                                            <Star size={14} /> My Reviews
                                        </Link>
                                        <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1">
                                            <button onClick={() => { logout(); setUserMenuOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                                                <LogOut size={14} /> Log Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="hidden sm:inline-flex px-3 py-1 rounded-md text-xs font-medium transition-colors border text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            >
                                Sign In
                            </Link>
                        )}

                        {/* Mobile menu toggle */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="lg:hidden p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile dropdown */}
            {mobileOpen && (
                <div className="lg:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-1 max-h-[70vh] overflow-y-auto">
                    {allLinks.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setMobileOpen(false)}
                            className={clsx(
                                'block px-3 py-2.5 rounded-md text-sm font-medium',
                                location.pathname === link.to
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}
                    {isAuthenticated() ? (
                        <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                            <Link to="/profile" onClick={() => setMobileOpen(false)} className="text-sm text-slate-700 dark:text-slate-200 font-medium">{user?.name}</Link>
                            <button onClick={() => { logout(); setMobileOpen(false); }} className="text-red-500 text-sm font-medium">Logout</button>
                        </div>
                    ) : (
                        <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-blue-600 dark:text-blue-400 text-sm font-medium">Sign In</Link>
                    )}
                </div>
            )}
        </nav>
    );
};
