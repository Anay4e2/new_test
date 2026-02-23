import { FC, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { forgotPasswordApi } from '../services/api';

const PlaneIcon: FC = () => (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
);

export const ForgotPassword: FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await forgotPasswordApi(email);
            setSent(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950" />
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

            <div className="w-full relative z-10 flex items-center justify-center p-6 sm:p-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="text-center mb-8">
                        <Link to="/" className="inline-flex items-center gap-2">
                            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center">
                                <PlaneIcon />
                            </div>
                            <span className="text-xl font-bold text-white">TripPlanner</span>
                        </Link>
                    </div>

                    <div className="bg-white/[0.07] backdrop-blur-xl border border-white/[0.1] rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/20">
                        {sent ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
                                    <p className="text-blue-200/60 mb-6">
                                        If an account with <span className="text-blue-300">{email}</span> exists, we've sent a password reset link. It expires in 15 minutes.
                                    </p>
                                    <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                        ← Back to Sign In
                                    </Link>
                                </div>
                            </motion.div>
                        ) : (
                            <>
                                <div className="mb-8">
                                    <h1 className="text-2xl font-bold text-white mb-2">Forgot password?</h1>
                                    <p className="text-blue-200/60">Enter your email and we'll send you a reset link.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
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
                                                Sending...
                                            </span>
                                        ) : (
                                            'Send Reset Link'
                                        )}
                                    </button>
                                </form>

                                <div className="mt-8 text-center">
                                    <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                        ← Back to Sign In
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
