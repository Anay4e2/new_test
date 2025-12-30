import { FC } from 'react';
import { motion } from 'framer-motion';

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
    <section className="py-20 bg-secondary/20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text mb-4 font-serif">Explore Incredible India</h2>
            <div className="w-24 h-1 bg-accent mx-auto rounded-full"></div>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">From the snow-capped Himalayas to the tropical backwaters, discover diversity in every corner.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {states.map((state, index) => (
                <motion.div
                    key={state._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="relative h-96 rounded-2xl overflow-hidden group cursor-pointer shadow-md"
                >
                    <img
                        src={state.imageUrl}
                        alt={state.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end transform transition-all duration-300">
                        <h3 className="text-2xl font-bold text-white mb-2">{state.name}</h3>
                        <p className="text-gray-200 text-sm opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                            {state.description}
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>
      </div>
    </section>
  );
};
