import { FC, useState, useEffect, useRef, FormEvent } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

const PlaneIcon: FC = () => (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
);

export const VerifyOtp: FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { verifyOtp, resendOtp, isLoading, error, clearError, pendingVerificationEmail } = useAuthStore();

    const email = pendingVerificationEmail || (location.state as any)?.email || '';

    const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
    const [resendCooldown, setResendCooldown] = useState(60);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Redirect if no email to verify
    useEffect(() => {
        if (!email) {
            navigate('/register');
        }
    }, [email, navigate]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return; // only digits
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        clearError();

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(''));
            inputRefs.current[5]?.focus();
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length !== 6) return;

        const success = await verifyOtp(email, otpString);
        if (success) {
            toast.success('Email verified successfully!');
            navigate('/plan');
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        const success = await resendOtp(email);
        if (success) {
            toast.success('A new verification code has been sent');
            setResendCooldown(60);
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        }
    };

    const otpComplete = otp.every((d) => d !== '');

    return (
        <div className="min-h-screen flex relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950" />

            {/* Animated gradient orbs */}
            <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

            {/* Content */}
            <div className="w-full relative z-10 flex items-center justify-center p-4 sm:p-6 md:p-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <Link to="/" className="inline-flex items-center gap-2">
                            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center">
                                <PlaneIcon />
                            </div>
                            <span className="text-xl font-bold text-white">TripPlanner</span>
                        </Link>
                    </div>

                    {/* Glass card */}
                    <div className="bg-white/[0.07] backdrop-blur-xl border border-white/[0.1] rounded-3xl p-5 sm:p-8 md:p-10 shadow-2xl shadow-black/20">
                        {/* Mail icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                </svg>
                            </div>
                        </div>

                        <div className="mb-6 text-center">
                            <h1 className="text-2xl font-bold text-white mb-2">Verify your email</h1>
                            <p className="text-blue-200/60 text-sm">
                                We&apos;ve sent a 6-digit code to<br />
                                <span className="text-blue-300 font-medium">{email}</span>
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
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

                            {/* OTP Inputs */}
                            <div className="flex justify-center gap-3" onPaste={handlePaste}>
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => { inputRefs.current[index] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="w-12 h-14 text-center text-xl font-bold bg-white/[0.06] border border-white/[0.15] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                                        autoFocus={index === 0}
                                    />
                                ))}
                            </div>

                            {/* Verify Button */}
                            <button
                                type="submit"
                                disabled={isLoading || !otpComplete}
                                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Verifying...
                                    </span>
                                ) : (
                                    'Verify Email'
                                )}
                            </button>
                        </form>

                        {/* Resend */}
                        <div className="mt-6 text-center">
                            {resendCooldown > 0 ? (
                                <p className="text-blue-200/40 text-sm">
                                    Resend code in <span className="text-blue-300 font-medium">{resendCooldown}s</span>
                                </p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={isLoading}
                                    className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors disabled:opacity-50"
                                >
                                    Resend verification code
                                </button>
                            )}
                        </div>

                        {/* Back to register */}
                        <div className="mt-6 text-center">
                            <Link to="/register" className="text-blue-200/50 hover:text-blue-200/70 text-sm transition-colors">
                                ← Use a different email
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
