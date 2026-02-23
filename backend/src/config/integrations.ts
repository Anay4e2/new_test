/**
 * API Integration Configuration
 *
 * Controls which data sources are used across the application.
 * Set environment variables to enable real API integrations:
 *
 * MONGO_URI          - MongoDB connection string (enables database instead of in-memory mock data)
 * EXCHANGE_RATE_API_KEY - ExchangeRate-API key (enables live currency rates)
 * GOOGLE_MAPS_API_KEY   - Google Maps API (enables real distance/routing calculations)
 * OPENWEATHER_API_KEY   - OpenWeatherMap API (enables real weather data)
 * CLOUDINARY_CLOUD_NAME - Cloudinary cloud (enables cloud image uploads)
 * CLOUDINARY_API_KEY    - Cloudinary API key
 * CLOUDINARY_API_SECRET - Cloudinary API secret
 * SMTP_HOST / SMTP_USER / SMTP_PASS - SMTP (enables real email sending)
 * GOOGLE_CLIENT_ID      - Google OAuth client ID
 */

export interface IntegrationStatus {
  name: string;
  enabled: boolean;
  provider: string;
}

export function getIntegrationStatus(): IntegrationStatus[] {
  return [
    {
      name: 'Database',
      enabled: !!process.env.MONGO_URI,
      provider: process.env.MONGO_URI ? 'MongoDB' : 'In-Memory Mock Data',
    },
    {
      name: 'Image Upload',
      enabled: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY),
      provider: process.env.CLOUDINARY_CLOUD_NAME ? 'Cloudinary' : 'Base64 Data URI',
    },
    {
      name: 'Email',
      enabled: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
      provider: process.env.SMTP_HOST ? 'SMTP' : 'Console Log (dev)',
    },
    {
      name: 'Weather',
      enabled: !!process.env.OPENWEATHER_API_KEY,
      provider: process.env.OPENWEATHER_API_KEY ? 'OpenWeatherMap' : 'Static Seasonal Data',
    },
    {
      name: 'Currency Rates',
      enabled: !!process.env.EXCHANGE_RATE_API_KEY,
      provider: process.env.EXCHANGE_RATE_API_KEY ? 'ExchangeRate-API' : 'Static Rates',
    },
    {
      name: 'Maps / Distance',
      enabled: !!process.env.GOOGLE_MAPS_API_KEY,
      provider: process.env.GOOGLE_MAPS_API_KEY ? 'Google Maps' : 'Haversine Calculation',
    },
    {
      name: 'OAuth',
      enabled: !!process.env.GOOGLE_CLIENT_ID,
      provider: process.env.GOOGLE_CLIENT_ID ? 'Google OAuth' : 'Disabled',
    },
  ];
}

export function isFeatureEnabled(feature: string): boolean {
  switch (feature) {
    case 'database':
      return !!process.env.MONGO_URI;
    case 'cloudinary':
      return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
    case 'email':
      return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    case 'weather':
      return !!process.env.OPENWEATHER_API_KEY;
    case 'currency':
      return !!process.env.EXCHANGE_RATE_API_KEY;
    case 'maps':
      return !!process.env.GOOGLE_MAPS_API_KEY;
    case 'oauth':
      return !!process.env.GOOGLE_CLIENT_ID;
    default:
      return false;
  }
}
