import { FC, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';


const faqs = [
    {
        category: 'Getting Started',
        questions: [
            {
                q: 'How do I create a trip?',
                a: 'Sign up for a free account, go to "Plan Trip", select your destinations and preferences, and our AI will generate a detailed day-wise itinerary for you.',
            },
            {
                q: 'Is TripPlanner free to use?',
                a: 'Yes! TripPlanner is free. You can create unlimited itineraries, save trips, and use all core features at no cost.',
            },
            {
                q: 'Do I need to create an account?',
                a: 'You can browse destinations without an account, but you\'ll need one to save trips, join groups, and use personalized features.',
            },
        ],
    },
    {
        category: 'Trip Planning',
        questions: [
            {
                q: 'How does the AI itinerary generation work?',
                a: 'Our algorithm analyzes travel distances, opening hours, place ratings, and your preferences (pace, budget, interests) to build an optimized day-wise plan.',
            },
            {
                q: 'Can I customize the generated itinerary?',
                a: 'Absolutely. After generation, you can reorder places, add or remove stops, adjust timing, and save multiple versions of your itinerary.',
            },
            {
                q: 'What regions does TripPlanner cover?',
                a: 'Currently we cover all major states and tourist destinations across India, with detailed data for Rajasthan, Kerala, Goa, Himachal Pradesh, and more.',
            },
            {
                q: 'Can I plan trips for senior citizens?',
                a: 'Yes! Enable the "Senior Friendly" constraint when planning. The algorithm will avoid steep climbs, reduce walking distances, and suggest accessible attractions.',
            },
        ],
    },
    {
        category: 'Group Travel',
        questions: [
            {
                q: 'How do group trips work?',
                a: 'Create a group from any saved trip, invite members via email or shareable link. Everyone can vote on changes, chat, and collaborate on the itinerary.',
            },
            {
                q: 'Can group members suggest changes?',
                a: 'Yes. Any member can submit itinerary change requests which the group can vote on. The group admin can approve or reject proposals.',
            },
        ],
    },
    {
        category: 'Account & Privacy',
        questions: [
            {
                q: 'How do I reset my password?',
                a: 'Click "Forgot Password" on the login page, enter your email, and you\'ll receive a password reset link.',
            },
            {
                q: 'Can I delete my account?',
                a: 'Yes. Contact us through the Contact page and we\'ll process your account deletion request.',
            },
            {
                q: 'Is my personal data secure?',
                a: 'We use industry-standard encryption and never share your personal data with third parties. Your trip data is private by default.',
            },
        ],
    },
];

export const FAQ: FC = () => {
    const [openIndex, setOpenIndex] = useState<string | null>(null);

    const toggle = (key: string) => {
        setOpenIndex(openIndex === key ? null : key);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-amber-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 py-12 sm:py-20 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                        Frequently Asked <span className="text-blue-600">Questions</span>
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Find answers to common questions about TripPlanner.
                    </p>
                </div>
            </section>

            {/* FAQ Sections */}
            <section className="py-10 sm:py-16 px-4 sm:px-6">
                <div className="max-w-3xl mx-auto space-y-10">
                    {faqs.map((section) => (
                        <div key={section.category}>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{section.category}</h2>
                            <div className="space-y-2">
                                {section.questions.map((item, i) => {
                                    const key = `${section.category}-${i}`;
                                    const isOpen = openIndex === key;
                                    return (
                                        <div key={key} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                                            <button
                                                onClick={() => toggle(key)}
                                                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                                            >
                                                <span className="text-sm font-medium text-slate-800 dark:text-slate-200 pr-4">{item.q}</span>
                                                <svg
                                                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                            <AnimatePresence>
                                                {isOpen && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="px-5 pb-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                                            {item.a}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="py-10 sm:py-14 px-4 sm:px-6 bg-slate-50 dark:bg-slate-900">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Still have questions?</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        Can't find what you're looking for? Reach out to our team.
                    </p>
                    <Link
                        to="/contact"
                        className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Contact Us
                    </Link>
                </div>
            </section>

        </div>
    );
};
