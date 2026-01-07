import { FC } from 'react';
import { motion } from 'framer-motion';

export const Hero: FC = () => {
  return (
    <div className="relative h-[80vh] w-full bg-[url('https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80')] bg-cover bg-center">
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col items-center justify-center text-center p-6">
        <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6 font-serif drop-shadow-lg"
        >
          Discover the Soul of India
        </motion.h1>
        <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-secondary mb-8 max-w-2xl font-light drop-shadow-md"
        >
          Curated journeys through heritage, nature, and culture. Experience luxury travel like never before.
        </motion.p>
        <motion.a
            href="/plan"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-accent hover:bg-orange-600 text-white font-semibold py-4 px-10 rounded-full text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
        >
          Start Planning Your Trip
        </motion.a>
      </div>
    </div>
  );
};
