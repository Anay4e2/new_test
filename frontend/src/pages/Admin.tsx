import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import AdminSidebar from '../components/admin/AdminSidebar';
import DashboardOverview from '../components/admin/DashboardOverview';
import PackageManager from '../components/admin/PackageManager';
import AnalyticsView from '../components/admin/AnalyticsView';
import PlacesManager from '../components/admin/PlacesManager';
import TripsManager from '../components/admin/TripsManager';
import UsersManager from '../components/admin/UsersManager';
import HotelsManager from '../components/admin/HotelsManager';
import RestaurantsManager from '../components/admin/RestaurantsManager';
import FestivalsManager from '../components/admin/FestivalsManager';
import SettingsPanel from '../components/admin/SettingsPanel';
import AuditLogViewer from '../components/admin/AuditLogViewer';
import SessionManager from '../components/admin/SessionManager';
import ContactQueriesManager from '../components/admin/ContactQueriesManager';
import { motion, AnimatePresence } from 'framer-motion';

const tabMeta: Record<string, { title: string; description: string }> = {
    overview: { title: 'Dashboard', description: 'Overview of your platform activity' },
    users: { title: 'User Management', description: 'Manage users and admins separately' },
    places: { title: 'Places', description: 'Manage tourist attractions and POIs' },
    hotels: { title: 'Hotels', description: 'Manage hotel listings' },
    restaurants: { title: 'Restaurants', description: 'Manage restaurant listings' },
    festivals: { title: 'Festivals', description: 'Manage festival events' },
    trips: { title: 'Trips', description: 'Manage user trips' },
    packages: { title: 'Packages', description: 'Manage travel packages' },
    analytics: { title: 'Analytics', description: 'View platform metrics and usage data' },
    audit: { title: 'Audit Logs', description: 'Review system activity logs' },
    sessions: { title: 'Sessions', description: 'Manage active user sessions' },
    queries: { title: 'Contact Queries', description: 'View and manage user contact submissions' },
    settings: { title: 'Settings', description: 'Configure application settings' },
};

export const Admin: FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) { navigate('/admin-login'); return; }
        if (user?.role !== 'admin') { navigate('/'); return; }
    }, [isAuthenticated, user, navigate]);

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <DashboardOverview />;
            case 'users': return <UsersManager />;
            case 'places': return <PlacesManager />;
            case 'hotels': return <HotelsManager />;
            case 'restaurants': return <RestaurantsManager />;
            case 'festivals': return <FestivalsManager />;
            case 'trips': return <TripsManager />;
            case 'packages': return <PackageManager />;
            case 'analytics': return <AnalyticsView />;
            case 'audit': return <AuditLogViewer />;
            case 'sessions': return <SessionManager />;
            case 'queries': return <ContactQueriesManager />;
            case 'settings': return <SettingsPanel />;
            default: return <DashboardOverview />;
        }
    };

    if (!user || user.role !== 'admin') return null;

    const meta = tabMeta[activeTab] || tabMeta.overview;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-white transition-colors duration-300">
            <AdminSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                collapsed={sidebarCollapsed}
                setCollapsed={setSidebarCollapsed}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />

            <main className={`min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
                    {/* Page Header */}
                    <div className="mb-8 pl-12 lg:pl-0">
                        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">{meta.title}</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{meta.description}</p>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {renderContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};
