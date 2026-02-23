// src/app/api/config/route.ts
import { NextResponse } from 'next/server';
import { MOCK_STATES, MOCK_CITIES } from '@/lib/mockData';

export async function GET() {
  // In a real app, this would query MongoDB
  return NextResponse.json(
    { states: MOCK_STATES, cities: MOCK_CITIES },
    { headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' } }
  );
}
