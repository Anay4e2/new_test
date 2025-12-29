// src/app/api/generate-trip/route.ts
import { NextResponse } from 'next/server';
import { generateTrip, TripRequest } from '@/lib/planner';

export async function POST(request: Request) {
  try {
    const body: TripRequest = await request.json();

    // Validate inputs
    if (!body.selectedCityIds || body.selectedCityIds.length === 0) {
      return NextResponse.json({ error: 'No cities selected' }, { status: 400 });
    }

    const result = await generateTrip(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Planner Error:', error);
    return NextResponse.json({ error: 'Failed to generate trip' }, { status: 500 });
  }
}
