import { FC } from 'react';
import { Link } from 'react-router-dom';


const guides = [
    {
        title: 'Creating Your First Trip',
        steps: [
            'Sign up or log in to your account.',
            'Navigate to "Plan Trip" from the navbar.',
            'Select your destination state and cities.',
            'Set your trip duration, budget tier, and any constraints (e.g., Senior Friendly).',
            'Click "Generate Itinerary" — the AI will build a day-wise plan.',
            'Review, customize, and save your trip.',
        ],
    },
    {
        title: 'Using Group Trip Features',
        steps: [
            'Save a trip from the Planner page.',
            'Open it from "My Trips" on the Dashboard.',
            'Click "Create Group" and give it a name.',
            'Invite friends via email or share the invite link.',
            'Members can chat, create polls, and propose changes.',
        ],
    },
    {
        title: 'Sharing & Publishing Trips',
        steps: [
            'Open a saved trip from the Dashboard.',
            'Click the share icon to generate a shareable link.',
            'To publish to the community, toggle "Publish to Community" and add tags.',
            'Published trips appear on the Explore feed for other travelers.',
        ],
    },
    {
        title: 'Using the Expense Tracker',
        steps: [
            'Open any saved trip.',
            'Switch to the "Expenses" tab.',
            'Add expenses by category (food, transport, tickets, etc.).',
            'View totals and breakdowns, and export a PDF report.',
        ],
    },
];

const quickLinks = [
    { label: 'Plan a Trip', to: '/plan', icon: '🗺️' },
    { label: 'Explore Destinations', to: '/explore', icon: '🔍' },
    { label: 'View Packages', to: '/packages', icon: '📦' },
    { label: 'Check Weather', to: '/weather', icon: '🌤️' },
    { label: 'Train Schedules', to: '/trains', icon: '🚂' },
    { label: 'Travel Safety', to: '/safety', icon: '🛡️' },
];

export const Help: FC = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-amber-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 py-12 sm:py-20 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                        Help <span className="text-blue-600">Center</span>
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Step-by-step guides and quick links to help you get the most out of TripPlanner.
                    </p>
                </div>
            </section>

            {/* Quick Links */}
            <section className="py-10 sm:py-14 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">Quick Links</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                        {quickLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-slate-900 hover:shadow-md transition-all text-center"
                            >
                                <span className="text-2xl">{link.icon}</span>
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{link.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Guides */}
            <section className="py-10 sm:py-14 px-4 sm:px-6 bg-slate-50 dark:bg-slate-900">
                <div className="max-w-4xl mx-auto space-y-8">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">How-to Guides</h2>
                    {guides.map((guide) => (
                        <div key={guide.title} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{guide.title}</h3>
                            <ol className="space-y-2.5">
                                {guide.steps.map((step, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center mt-0.5">
                                            {i + 1}
                                        </span>
                                        <span className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{step}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="py-10 sm:py-14 px-4 sm:px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Need more help?</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        Check our FAQ or reach out directly.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Link to="/faq" className="bg-blue-600 text-white px-8 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                            View FAQ
                        </Link>
                        <Link to="/contact" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-8 py-3 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            Contact Us
                        </Link>
                    </div>
                </div>
            </section>

        </div>
    );
};
