// src/app/api/routes/route.ts
import { NextResponse } from 'next/server';

const MOCK_ROUTES = [
  { fromCity: 'Jaipur', toCity: 'Jodhpur', distance: 350, duration: 5.8, mode: 'Road' },
  { fromCity: 'Jodhpur', toCity: 'Udaipur', distance: 250, duration: 4.2, mode: 'Road' },
  { fromCity: 'Jodhpur', toCity: 'Jaisalmer', distance: 280, duration: 4.7, mode: 'Road' },
  { fromCity: 'Jaipur', toCity: 'Udaipur', distance: 400, duration: 6.7, mode: 'Road' },
  { fromCity: 'Udaipur', toCity: 'Jaisalmer', distance: 530, duration: 8.8, mode: 'Road' },
  { fromCity: 'Jaipur', toCity: 'Jaisalmer', distance: 560, duration: 9.3, mode: 'Road' },
];

export async function GET() {
  return NextResponse.json(MOCK_ROUTES, {
    headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' }
  });
}
