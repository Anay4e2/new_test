import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import AdminSidebar from '../components/admin/AdminSidebar';
import DashboardOverview from '../components/admin/DashboardOverview';
import PackageManager from '../components/admin/PackageManager';
import AnalyticsView from '../components/admin/AnalyticsView';
import { motion, AnimatePresence } from 'framer-motion';

export const Admin: FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (!isAuthenticated()) { navigate('/login'); return; }
        if (user?.role !== 'admin') { navigate('/'); return; }
    }, [isAuthenticated, user, navigate]);

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <DashboardOverview />;
            case 'packages': return <PackageManager />;
            case 'analytics': return <AnalyticsView />;
            default: return <DashboardOverview />;
        }
    };

    if (!user || user.role !== 'admin') return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-white transition-colors duration-300">
            <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="pl-64 min-h-screen transition-all duration-300">
                <div className="max-w-7xl mx-auto px-8 py-10">
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
