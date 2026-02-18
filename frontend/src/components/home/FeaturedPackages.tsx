import { FC } from 'react';
import { Link } from 'react-router-dom';

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
    <section className="py-20 bg-white dark:bg-slate-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-10">
        {/* Section Header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Curated Travel Packages</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Handpicked itineraries designed to immerse you in the authentic beauty of India.
          </p>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-lg transition-all duration-300 group"
            >
              {/* Image */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={pkg.image || `https://picsum.photos/seed/${pkg.id}/600/400`}
                  alt={pkg.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${pkg.title}/600/400`;
                  }}
                />
                <div className="absolute top-4 right-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-blue-600 dark:text-blue-400 shadow-sm">
                  {pkg.days} Days
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-blue-600 dark:text-blue-400 uppercase text-xs font-semibold tracking-wider">{pkg.state}</span>
                  <span className="text-slate-900 dark:text-white font-bold">₹{pkg.price.toLocaleString()}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {pkg.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2">{pkg.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {pkg.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTA Button */}
                <Link
                  to="/packages"
                  className="block w-full text-center border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white font-semibold py-2.5 rounded-xl transition-colors duration-200"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
