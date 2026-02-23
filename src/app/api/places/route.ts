// src/app/api/places/route.ts
import { NextResponse } from 'next/server';
import { MOCK_PLACES } from '@/lib/mockData';

export async function GET() {
  return NextResponse.json(MOCK_PLACES, {
    headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' }
  });
}
