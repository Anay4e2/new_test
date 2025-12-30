import { FC } from 'react';
import { motion } from 'framer-motion';

interface Package {
    id: string;
    title: string;
    state: string;
    days: number;
    price: number;
    image: string;
    description: string;
    tags: string[];
}

interface Props {
    packages: Package[];
}

export const FeaturedPackages: FC<Props> = ({ packages }) => {
  return (
    <section className="py-20 bg-neutral">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text mb-4 font-serif">Curated Experiences</h2>
            <div className="w-24 h-1 bg-accent mx-auto rounded-full"></div>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">Handpicked itineraries designed to immerse you in the authentic beauty of India.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {packages.map((pkg, index) => (
            <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group border border-gray-100"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                    src={pkg.image}
                    alt={pkg.title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-primary shadow-sm">
                    {pkg.days} Days
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-accent uppercase text-xs font-bold tracking-wider">{pkg.state}</span>
                    <span className="text-text font-bold">₹{pkg.price.toLocaleString()}</span>
                </div>
                <h3 className="text-2xl font-bold text-text mb-3 font-serif group-hover:text-primary transition-colors">{pkg.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{pkg.description}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                    {pkg.tags.map(tag => (
                        <span key={tag} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">{tag}</span>
                    ))}
                </div>
                <button className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold py-2 rounded-xl transition-colors duration-300">
                    View Itinerary
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
