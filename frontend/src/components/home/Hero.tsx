import { FC } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';
import { NotificationBell } from '../common/NotificationBell';
import { useAuthStore } from '@/stores/authStore';

// Accurate Rajasthan state map SVG based on geographic outline
const RajasthanMapSVG: FC = () => (
  <svg
    viewBox="0 0 400 380"
    className="w-full h-full max-w-md mx-auto"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Rajasthan state outline - accurate geographic shape */}
    <path
      d="M85,35 L130,15 L175,8 L220,12 L260,25 L295,45 L320,70 L340,100 L355,135 L365,170 L368,210 L360,250 L345,285 L320,315 L285,340 L245,355 L200,362 L155,355 L115,335 L80,305 L55,270 L40,230 L35,190 L38,150 L50,110 L65,75 L85,35
             M35,190 L20,210 L12,240 L18,270 L35,290 L55,270
             M295,45 L310,35 L330,32 L350,40 L360,55 L355,75 L340,100"
      fill="url(#rajasthanGradient)"
      stroke="#94A3B8"
      strokeWidth="2"
    />

    {/* Gradient for terrain effect */}
    <defs>
      <linearGradient id="rajasthanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E8F5E9" />
        <stop offset="50%" stopColor="#F1F8E9" />
        <stop offset="100%" stopColor="#FFF8E1" />
      </linearGradient>
    </defs>

    {/* Desert/Thar region shading (western) */}
    <ellipse cx="100" cy="180" rx="60" ry="80" fill="#FEF3C7" opacity="0.5" />

    {/* Aravalli Hills region (diagonal across center) */}
    <path
      d="M320,70 Q280,150 240,220 Q200,290 155,355"
      stroke="#A7F3D0"
      strokeWidth="20"
      fill="none"
      opacity="0.4"
      strokeLinecap="round"
    />

    {/* Route line: Jaipur -> Udaipur -> Jodhpur */}
    <path
      d="M285,120 C260,180 220,260 195,295"
      stroke="#2563EB"
      strokeWidth="3"
      strokeDasharray="8 5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M195,295 C150,260 110,200 95,165"
      stroke="#2563EB"
      strokeWidth="3"
      strokeDasharray="8 5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M95,165 C150,130 220,110 285,120"
      stroke="#2563EB"
      strokeWidth="3"
      strokeDasharray="8 5"
      fill="none"
      strokeLinecap="round"
    />

    {/* Jaipur - capital, eastern side */}
    <circle cx="285" cy="120" r="14" fill="#2563EB" />
    <circle cx="285" cy="120" r="6" fill="white" />
    <text x="300" y="115" fontSize="14" fill="#1E293B" fontWeight="600">Jaipur</text>
    <text x="300" y="130" fontSize="10" fill="#64748B">Capital</text>

    {/* Udaipur - southern side */}
    <circle cx="195" cy="295" r="12" fill="#2563EB" />
    <circle cx="195" cy="295" r="5" fill="white" />
    <text x="210" y="300" fontSize="14" fill="#1E293B" fontWeight="600">Udaipur</text>

    {/* Jodhpur - western side */}
    <circle cx="95" cy="165" r="12" fill="#2563EB" />
    <circle cx="95" cy="165" r="5" fill="white" />
    <text x="50" y="150" fontSize="14" fill="#1E293B" fontWeight="600">Jodhpur</text>

    {/* Jaisalmer - far west (desert) */}
    <circle cx="55" cy="120" r="6" fill="#64748B" />
    <text x="25" y="108" fontSize="11" fill="#64748B">Jaisalmer</text>

    {/* Bikaner - northwest */}
    <circle cx="140" cy="65" r="6" fill="#64748B" />
    <text x="148" y="60" fontSize="11" fill="#64748B">Bikaner</text>

    {/* Neighboring state labels */}
    <text x="5" y="25" fontSize="10" fill="#94A3B8" fontWeight="500">PAKISTAN</text>
    <text x="175" y="8" fontSize="10" fill="#94A3B8" fontWeight="500">PUNJAB</text>
    <text x="320" y="25" fontSize="10" fill="#94A3B8" fontWeight="500">HARYANA</text>
    <text x="355" y="180" fontSize="10" fill="#94A3B8" fontWeight="500">UTTAR PRADESH</text>
    <text x="290" y="360" fontSize="10" fill="#94A3B8" fontWeight="500">MADHYA PRADESH</text>
    <text x="25" y="320" fontSize="10" fill="#94A3B8" fontWeight="500">GUJARAT</text>

    {/* "RAJASTHAN" title */}
    <text x="130" y="200" fontSize="22" fill="#1E3A5F" fontWeight="700" letterSpacing="3">RAJASTHAN</text>
  </svg>
);

// Feature icons
const MapIcon: FC = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
  </svg>
);

const ClockIcon: FC = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RouteIcon: FC = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
);

export const Hero: FC = () => {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <div className="min-h-[85vh] bg-white dark:bg-slate-900 transition-colors duration-200">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-10 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="font-semibold text-slate-800 dark:text-white text-lg">TripPlanner</span>
        </div>
        <div className="flex items-center gap-8">
          <Link to="/" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium">Home</Link>
          <Link to="/explore" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium">Explore</Link>
          <Link to="/plan" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm">Plan Trip</Link>
          <Link to="/plan" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm">Packages</Link>
          <Link to="/plan" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm">About</Link>
          {isAuthenticated() && (
            <Link to="/dashboard" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium">My Trips</Link>
          )}
          <NotificationBell />
          <ThemeToggle />
          {isAuthenticated() ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{user?.name}</span>
              <button
                onClick={logout}
                className="text-red-500 border border-red-300 dark:border-red-500/40 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Content */}
      <div className="flex items-center max-w-7xl mx-auto px-10 py-12 gap-8">
        {/* Left Column - Content */}
        <div className="w-1/2">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight mb-6">
            Plan Smarter Trips Across India
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed mb-8 max-w-lg">
            Create optimized multi-city itineraries, explore curated packages, and access real-time travel insights—all in one platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center gap-4 mb-12">
            <Link
              to="/plan"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-7 rounded-xl shadow-lg shadow-blue-600/25 transition-all hover:shadow-xl hover:shadow-blue-600/30 text-base"
            >
              Plan Your Trip
            </Link>
            <Link
              to="/plan"
              className="border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-medium py-2.5 px-6 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-sm"
            >
              Explore Packages
            </Link>
          </div>

          {/* Feature Highlights */}
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              <MapIcon />
              <span className="text-sm font-medium">Interactive Maps</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              <ClockIcon />
              <span className="text-sm font-medium">Real-time Travel Info</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              <RouteIcon />
              <span className="text-sm font-medium">Smart Route Optimization</span>
            </div>
          </div>
        </div>

        {/* Right Column - Rajasthan Map */}
        <div className="w-1/2 relative">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <RajasthanMapSVG />

            {/* Floating Route Card */}
            <div className="absolute bottom-8 right-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-lg max-w-[220px]">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <span>Optimized by TripPlanner</span>
              </div>
              <p className="text-slate-800 dark:text-white font-semibold text-sm mb-1">
                Jaipur → Udaipur → Jodhpur
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                5 days • 3 cities
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
