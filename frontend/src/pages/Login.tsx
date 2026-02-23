import { FC, useState, FormEvent, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: any) => void;
                    renderButton: (element: HTMLElement, config: any) => void;
                };
            };
        };
    }
}

// Icons
const EyeIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const EyeSlashIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
);

const PlaneIcon: FC = () => (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
);

export const Login: FC = () => {
    const navigate = useNavigate();
    const { login, googleLogin, isLoading, error, clearError } = useAuthStore();
    const { t } = useTranslation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const googleBtnRef = useRef<HTMLDivElement>(null);
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    useEffect(() => {
        if (!googleClientId) return;

        const handleCredentialResponse = async (response: any) => {
            clearError();
            const success = await googleLogin(response.credential);
            if (success) navigate('/plan');
        };

        const initGoogle = () => {
            if (window.google && googleBtnRef.current) {
                window.google.accounts.id.initialize({
                    client_id: googleClientId,
                    callback: handleCredentialResponse,
                });
                window.google.accounts.id.renderButton(googleBtnRef.current, {
                    theme: 'filled_blue',
                    size: 'large',
                    width: googleBtnRef.current.offsetWidth,
                    text: 'signin_with',
                });
            }
        };

        if (window.google) {
            initGoogle();
        } else {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = initGoogle;
            document.head.appendChild(script);
        }
    }, [googleClientId]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        clearError();

        const success = await login(email, password);
        if (success) {
            navigate('/plan');
        }
    };

    return (
        <div className="min-h-screen flex relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950" />

            {/* Animated gradient orbs */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

            {/* Left panel — branding */}
            <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-12">
                <Link to="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <PlaneIcon />
                    </div>
                    <span className="text-2xl font-bold text-white tracking-tight">TripPlanner</span>
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="max-w-lg"
                >
                    <h2 className="text-4xl font-bold text-white leading-tight mb-4">
                        Your next adventure <br />starts here.
                    </h2>
                    <p className="text-blue-200/70 text-lg leading-relaxed">
                        Plan smart multi-city itineraries across India with real-time insights, optimized routes, and community-driven recommendations.
                    </p>

                    {/* Stats */}
                    <div className="flex gap-8 mt-10">
                        {[
                            { value: '500+', label: 'Destinations' },
                            { value: '10K+', label: 'Trips Created' },
                            { value: '4.9★', label: 'User Rating' },
                        ].map((stat) => (
                            <div key={stat.label}>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                                <p className="text-blue-300/60 text-sm mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <p className="text-blue-300/40 text-sm">© 2026 TripPlanner. All rights reserved.</p>
            </div>

            {/* Right panel — form */}
            <div className="w-full lg:w-1/2 relative z-10 flex items-center justify-center p-6 sm:p-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-8">
                        <Link to="/" className="inline-flex items-center gap-2">
                            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center">
                                <PlaneIcon />
                            </div>
                            <span className="text-xl font-bold text-white">TripPlanner</span>
                        </Link>
                    </div>

                    {/* Glass card */}
                    <div className="bg-white/[0.07] backdrop-blur-xl border border-white/[0.1] rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/20">
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-white mb-2">{t('auth.welcomeBack')}</h1>
                            <p className="text-blue-200/60">{t('auth.signInSubtitle')}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Error */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-300 text-sm flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    {error}
                                </motion.div>
                            )}

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-blue-100/80 mb-2">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                                    placeholder="you@example.com"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-blue-100/80 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 pr-12 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/70 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeSlashIcon className="w-5 h-5" />
                                        ) : (
                                            <EyeIcon className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Forgot password */}
                            <div className="flex justify-end">
                                <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                                    Forgot password?
                                </Link>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Signing in...
                                    </span>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        {/* Google Sign-In */}
                        {googleClientId && (
                            <>
                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-white/10" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-3 bg-transparent text-blue-200/40">or</span>
                                    </div>
                                </div>
                                <div ref={googleBtnRef} className="w-full flex justify-center" />
                            </>
                        )}

                        {/* Register link */}
                        <div className="mt-8 text-center">
                            <p className="text-blue-200/50">
                                Don't have an account?{' '}
                                <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                    Create one
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Back to Home */}
                    <div className="mt-6 text-center">
                        <Link to="/" className="text-blue-300/40 hover:text-blue-300/70 text-sm transition-colors">
                            ← Back to Home
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
