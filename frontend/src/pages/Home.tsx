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
            <div className="h-screen w-full flex items-center justify-center bg-neutral">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral pb-10">
            <Hero />
            <FeaturedPackages packages={config.packages || []} />
            <StateOverview states={config.states || []} />

            <section className="py-20 bg-primary text-white text-center">
                <div className="container mx-auto px-6">
                    <h2 className="text-4xl font-bold font-serif mb-6">Ready to start your journey?</h2>
                    <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">Design your perfect itinerary with our intelligent trip planner.</p>
                    <a
                        href="/plan"
                        className="inline-block bg-accent hover:bg-orange-600 text-white font-bold py-4 px-12 rounded-full shadow-lg transition-all transform hover:-translate-y-1"
                    >
                        Plan My Trip Now
                    </a>
                </div>
            </section>
        </div>
    );
};
