import { FC } from 'react';
import { Link } from 'react-router-dom';

// Accurate Rajasthan state map SVG derived from GeoJSON boundary data
const RajasthanMapSVG: FC = () => (
  <svg
    viewBox="0 0 400 400"
    className="w-full h-auto max-w-md mx-auto"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="rajasthanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E8F5E9" />
        <stop offset="50%" stopColor="#F1F8E9" />
        <stop offset="100%" stopColor="#FFF8E1" />
      </linearGradient>
    </defs>

    {/* Rajasthan state outline — accurate geographic boundary */}
    <path
      d="M201,26 L225,34 L231,48 L236,56 L251,62 L264,63 L268,79 L277,98 L290,110 L289,119 L289,123 L293,129 L297,126 L302,121 L302,115 L310,117 L312,123 L319,116 L327,113 L329,131 L328,139 L335,136 L337,133 L342,133 L346,139 L350,149 L357,155 L360,163 L354,167 L360,169 L361,173 L350,181 L357,180 L365,175 L375,176 L378,175 L384,177 L379,184 L366,192 L352,201 L338,209 L325,219 L314,227 L313,246 L326,254 L338,254 L346,251 L349,261 L339,264 L326,269 L328,278 L331,284 L332,295 L324,293 L326,305 L322,311 L316,306 L309,308 L298,306 L295,313 L289,322 L279,325 L277,328 L271,328 L270,317 L276,319 L282,315 L282,307 L280,297 L286,292 L283,286 L257,283 L256,275 L265,277 L259,272 L262,268 L253,271 L248,276 L242,273 L242,279 L246,285 L242,285 L240,285 L236,293 L241,297 L242,306 L247,318 L244,333 L237,342 L228,352 L236,357 L223,363 L212,360 L205,350 L192,346 L184,336 L180,323 L174,318 L167,308 L167,299 L163,301 L144,294 L135,292 L131,288 L119,288 L113,286 L98,287 L82,284 L67,253 L65,236 L44,230 L44,196 L15,181 L50,124 L69,137 L104,129 L125,109 L146,80 L164,65 L174,47 L196,21 Z"
      fill="url(#rajasthanGradient)"
      stroke="#94A3B8"
      strokeWidth="1.5"
    />

    {/* Desert/Thar region shading (western) */}
    <ellipse cx="90" cy="190" rx="55" ry="70" fill="#FEF3C7" opacity="0.4" />

    {/* Aravalli Hills region (NE to SW diagonal) */}
    <path
      d="M290,110 Q240,180 200,250 Q180,290 193,290"
      stroke="#A7F3D0"
      strokeWidth="18"
      fill="none"
      opacity="0.35"
      strokeLinecap="round"
    />

    {/* Route line: Jaipur -> Udaipur */}
    <path
      d="M281,176 C265,210 230,260 193,290"
      stroke="#2563EB"
      strokeWidth="2.5"
      strokeDasharray="8 5"
      fill="none"
      strokeLinecap="round"
    />
    {/* Route line: Udaipur -> Jodhpur */}
    <path
      d="M193,290 C175,260 165,235 164,209"
      stroke="#2563EB"
      strokeWidth="2.5"
      strokeDasharray="8 5"
      fill="none"
      strokeLinecap="round"
    />
    {/* Route line: Jodhpur -> Jaipur */}
    <path
      d="M164,209 C190,190 235,178 281,176"
      stroke="#2563EB"
      strokeWidth="2.5"
      strokeDasharray="8 5"
      fill="none"
      strokeLinecap="round"
    />

    {/* Jaipur - capital, eastern side */}
    <circle cx="281" cy="176" r="13" fill="#2563EB" />
    <circle cx="281" cy="176" r="5.5" fill="white" />
    <text x="298" y="172" fontSize="14" fill="#1E293B" fontWeight="600">Jaipur</text>
    <text x="298" y="186" fontSize="10" fill="#64748B">Capital</text>

    {/* Udaipur - southern */}
    <circle cx="193" cy="290" r="11" fill="#2563EB" />
    <circle cx="193" cy="290" r="4.5" fill="white" />
    <text x="205" y="285" fontSize="14" fill="#1E293B" fontWeight="600">Udaipur</text>

    {/* Jodhpur - western */}
    <circle cx="164" cy="209" r="11" fill="#2563EB" />
    <circle cx="164" cy="209" r="4.5" fill="white" />
    <text x="110" y="200" fontSize="14" fill="#1E293B" fontWeight="600">Jodhpur</text>

    {/* Jaisalmer - far west */}
    <circle cx="75" cy="176" r="5" fill="#64748B" />
    <text x="30" y="170" fontSize="11" fill="#64748B">Jaisalmer</text>

    {/* Bikaner - north */}
    <circle cx="176" cy="122" r="5" fill="#64748B" />
    <text x="184" y="117" fontSize="11" fill="#64748B">Bikaner</text>

    {/* Neighboring state/country labels */}
    <text x="5" y="140" fontSize="10" fill="#94A3B8" fontWeight="500">PAKISTAN</text>
    <text x="190" y="18" fontSize="10" fill="#94A3B8" fontWeight="500">PUNJAB</text>
    <text x="320" y="100" fontSize="10" fill="#94A3B8" fontWeight="500">HARYANA</text>
    <text x="340" y="220" fontSize="9" fill="#94A3B8" fontWeight="500">UTTAR PR.</text>
    <text x="40" y="310" fontSize="10" fill="#94A3B8" fontWeight="500">GUJARAT</text>

    {/* "RAJASTHAN" title */}
    <text x="115" y="245" fontSize="20" fill="#1E3A5F" fontWeight="700" letterSpacing="4" opacity="0.7">RAJASTHAN</text>
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
  return (
    <div className="min-h-[60vh] md:min-h-[85vh] bg-white dark:bg-slate-900 transition-colors duration-200">
      {/* Hero Content */}
      <div className="flex flex-col md:flex-row items-start max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-6 md:py-8 gap-6 md:gap-8">
        {/* Left Column - Content */}
        <div className="w-full md:w-1/2 pt-4 md:pt-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight mb-4 md:mb-6">
            Plan Smarter Trips Across India
          </h1>
          <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 leading-relaxed mb-6 md:mb-8 max-w-lg">
            Create optimized multi-city itineraries, explore curated packages, and access real-time travel insights—all in one platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-8 md:mb-12">
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
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 md:gap-10">
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
        <div className="w-full md:w-1/2 relative">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm">
            <RajasthanMapSVG />

            {/* Floating Route Card */}
            <div className="mt-3 md:mt-0 md:absolute md:-bottom-2 md:right-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-lg max-w-full md:max-w-[220px]">
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
