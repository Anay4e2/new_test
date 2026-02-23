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
    if (!body.duration || body.duration < 1 || body.duration > 30) {
      return NextResponse.json({ error: 'Duration must be between 1 and 30 days' }, { status: 400 });
    }
    if (body.budget && !['budget', 'standard', 'premium'].includes(body.budget)) {
      return NextResponse.json({ error: 'Invalid budget tier' }, { status: 400 });
    }
    if (body.travelStyle && !['relaxed', 'fast'].includes(body.travelStyle)) {
      return NextResponse.json({ error: 'Invalid travel style' }, { status: 400 });
    }

    // Try backend API first
    const backendUrl = process.env.BACKEND_URL;
    if (backendUrl) {
      try {
        const response = await fetch(`${backendUrl}/api/generate-trip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }
      } catch {
        // Fall through to local planner
      }
    }

    const result = await generateTrip(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Planner Error:', error);
    return NextResponse.json({ error: 'Failed to generate trip' }, { status: 500 });
  }
}
