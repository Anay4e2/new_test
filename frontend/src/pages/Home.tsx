import { FC, useEffect, useState } from 'react';
import { Hero, FeaturedPackages, StateOverview } from '@/components/home';
import { getConfig } from '@/services/api';

export const Home: FC = () => {
    const [config, setConfig] = useState<{ states: any[], packages: any[] }>({ states: [], packages: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getConfig();
                setConfig(data);
            } catch (error) {
                console.error("Failed to fetch home data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-neutral dark:bg-slate-900">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral dark:bg-slate-900 pb-10">
            <Hero />
            <FeaturedPackages packages={config.packages || []} />
            <StateOverview states={config.states || []} />

            <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-3xl font-bold mb-4">Ready to start your journey?</h2>
                    <p className="text-lg mb-8 text-blue-100 max-w-2xl mx-auto">
                        Design your perfect itinerary with our intelligent trip planner.
                    </p>
                    <a
                        href="/plan"
                        className="inline-block bg-white text-blue-600 hover:bg-blue-50 font-bold py-3 px-10 rounded-xl shadow-lg transition-all hover:shadow-xl"
                    >
                        Plan My Trip Now
                    </a>
                </div>
            </section>
        </div>
    );
};
