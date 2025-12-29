// src/app/api/config/route.ts
import { NextResponse } from 'next/server';
import { MOCK_STATES, MOCK_CITIES } from '@/lib/mockData';

export async function GET() {
  // In a real app, this would query MongoDB
  // const states = await State.find({});
  return NextResponse.json({
    states: MOCK_STATES,
    cities: MOCK_CITIES,
  });
}
