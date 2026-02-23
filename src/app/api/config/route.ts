// src/app/api/config/route.ts
import { NextResponse } from 'next/server';
import { MOCK_STATES, MOCK_CITIES } from '@/lib/mockData';

export async function GET() {
  // Try backend API first, fall back to mock data
  const backendUrl = process.env.BACKEND_URL;
  if (backendUrl) {
    try {
      const response = await fetch(`${backendUrl}/api/config`, { next: { revalidate: 3600 } });
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fall through to mock data
    }
  }

  return NextResponse.json(
    { states: MOCK_STATES, cities: MOCK_CITIES },
    { headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' } }
  );
}
