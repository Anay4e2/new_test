import { FC } from 'react';
import { Link } from 'react-router-dom';


export const About: FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-amber-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            About <span className="text-blue-600">TripPlanner</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            We help travelers discover India's incredible destinations with personalized itineraries,
            smart route planning, and curated travel packages — all in one place.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-10 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">Our Mission</h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Travel planning in India can be overwhelming — hundreds of cities, thousands of
              heritage sites, temples, palaces, and experiences to choose from. We built TripPlanner
              to simplify this process.
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Our platform uses smart algorithms to build feasible, day-wise itineraries that
              respect your pace, preferences, and budget — whether you're traveling solo, with
              family, or in a group.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">50+</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Cities Covered</div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-amber-600 mb-1">500+</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Places to Visit</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">1000+</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Trips Planned</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">4.8★</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-8 sm:mb-10 text-center">What We Offer</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Smart Itineraries</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                AI-powered day-wise plans that optimize for travel time, opening hours, and your pace preferences.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Cost Estimation</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Get detailed budget breakdowns with hotel, transport, and entry fee estimates before you travel.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Group Travel</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Collaborate on trip planning with friends and family using shared itineraries and group features.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 sm:py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">Ready to Plan Your Trip?</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Start exploring destinations and build your perfect itinerary today.
          </p>
          <Link
            to="/explore"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Start Exploring
          </Link>
        </div>
      </section>

    </div>
  );
};
