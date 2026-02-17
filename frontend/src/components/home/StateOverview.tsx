import { FC } from 'react';
import { Link } from 'react-router-dom';

interface State {
    _id: string;
    name: string;
    description: string;
    imageUrl: string;
}

interface Props {
    states: State[];
}

export const StateOverview: FC<Props> = ({ states }) => {
    return (
        <section className="py-20 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-10">
                {/* Section Header */}
                <div className="text-center mb-14">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Explore Incredible India</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                        From the snow-capped Himalayas to the tropical backwaters, discover diversity in every corner.
                    </p>
                </div>

                {/* States Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {states.map((state) => (
                        <Link
                            key={state._id}
                            to="/plan"
                            className="relative h-80 rounded-2xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300"
                        >
                            <img
                                src={state.imageUrl || `https://picsum.photos/seed/${state.name}/600/800`}
                                alt={state.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${state._id}/600/800`;
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent p-6 flex flex-col justify-end">
                                <h3 className="text-xl font-bold text-white mb-1">{state.name}</h3>
                                <p className="text-slate-200 text-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 line-clamp-2">
                                    {state.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};
