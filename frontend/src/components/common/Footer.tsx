import { FC } from 'react';
import { Link } from 'react-router-dom';

export const Footer: FC = () => {
    return (
        <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
                    {/* Brand */}
                    <div className="sm:col-span-2 md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">T</span>
                            </div>
                            <span className="font-semibold text-slate-800 dark:text-white">TripPlanner</span>
                        </Link>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                            Plan your perfect India trip with AI-powered itineraries, smart routing, and curated travel packages.
                        </p>
                    </div>

                    {/* Explore */}
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Explore</h4>
                        <ul className="space-y-2.5">
                            <li><Link to="/explore" className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Destinations</Link></li>
                            <li><Link to="/packages" className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Packages</Link></li>
                            <li><Link to="/festivals" className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Festivals</Link></li>
                            <li><Link to="/restaurants" className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Restaurants</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Company</h4>
                        <ul className="space-y-2.5">
                            <li><Link to="/about" className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About Us</Link></li>
                            <li><Link to="/services" className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Services</Link></li>
                            <li><Link to="/contact" className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact Us</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Support</h4>
                        <ul className="space-y-2.5">
                            <li><Link to="/help" className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Help Center</Link></li>
                            <li><Link to="/faq" className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">FAQ</Link></li>
                            <li><Link to="/safety" className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Travel Safety</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs text-slate-400 dark:text-slate-500">© {new Date().getFullYear()} TripPlanner. All rights reserved.</span>
                    <div className="flex items-center gap-4">
                        <Link to="/faq" className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">FAQ</Link>
                        <Link to="/help" className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Help</Link>
                        <Link to="/contact" className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Contact</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
