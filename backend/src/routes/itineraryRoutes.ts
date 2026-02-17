import { Router } from 'express';
import { generateItineraryPDF } from '../services/pdfService';
import { CITIES as MOCK_CITIES } from '../services/mockData';
import { haversineDistance } from '../services/routeOptimizer';

const router = Router();

// Validate a modified itinerary — recalculate distances, travel, feasibility
// POST /api/itinerary/validate
router.post('/validate', async (req, res) => {
    try {
        const { itinerary } = req.body as { itinerary: any[] };

        if (!itinerary || !Array.isArray(itinerary) || itinerary.length === 0) {
            res.status(400).json({ error: 'Invalid itinerary data.' });
            return;
        }

        let totalDistance = 0;
        let totalCost = 0;
        let worstFeasibility: 'comfortable' | 'tight' | 'impossible' = 'comfortable';

        const validated = itinerary.map((day: any, idx: number) => {
            // Recalculate intra-day stats
            const activityHours = (day.activities || []).reduce((sum: number, a: any) => sum + (a.timeRequired || 1), 0);
            const activityCost = (day.activities || []).reduce((sum: number, a: any) => sum + (a.entryFee || 0), 0);
            const stayCost = typeof day.nightStay === 'object' && day.nightStay?.hotel?.pricePerNight
                ? day.nightStay.hotel.pricePerNight : 0;

            let travelInfo = day.travel;

            // Recalculate travel if there's a next day with a different city
            if (idx < itinerary.length - 1) {
                const nextDay = itinerary[idx + 1];
                if (nextDay.city !== day.city) {
                    const fromCity = MOCK_CITIES.find(c => c.name === day.city);
                    const toCity = MOCK_CITIES.find(c => c.name === nextDay.city);
                    if (fromCity && toCity) {
                        const dist = Math.round(haversineDistance(
                            fromCity.coordinates.lat, fromCity.coordinates.lng,
                            toCity.coordinates.lat, toCity.coordinates.lng
                        ) * 1.3);
                        const isInterState = fromCity.stateCode !== toCity.stateCode;
                        let mode = 'Private Taxi';
                        let avgSpeed = 60;
                        if (isInterState) {
                            if (dist > 500) { mode = 'Flight'; avgSpeed = 500; }
                            else { mode = 'Train'; avgSpeed = 80; }
                        }
                        travelInfo = {
                            from: day.city,
                            to: nextDay.city,
                            distance: dist,
                            duration: Math.round((dist / avgSpeed) * 10) / 10,
                            mode,
                            isInterState,
                            fromState: fromCity.stateCode,
                            toState: toCity.stateCode,
                        };
                    }
                } else {
                    travelInfo = undefined; // Same city, no travel needed
                }
            } else {
                travelInfo = undefined; // Last day
            }

            const travelHours = travelInfo?.duration || 0;
            const totalDayHours = activityHours + travelHours;
            let feasibility: 'comfortable' | 'tight' | 'impossible' = 'comfortable';
            if (totalDayHours > 14) feasibility = 'impossible';
            else if (totalDayHours > 10) feasibility = 'tight';

            if (feasibility === 'impossible') worstFeasibility = 'impossible';
            else if (feasibility === 'tight' && worstFeasibility !== 'impossible') worstFeasibility = 'tight';

            const dayCost = activityCost + stayCost + (travelInfo ? travelInfo.distance * 8 : 0);
            totalDistance += travelInfo?.distance || 0;
            totalCost += dayCost;

            return {
                ...day,
                day: idx + 1, // Re-number
                travel: travelInfo,
                stats: {
                    totalDistance: travelInfo?.distance || 0,
                    totalCost: dayCost,
                    feasibility,
                },
            };
        });

        res.json({
            itinerary: validated,
            summary: {
                totalCost,
                totalDistance,
                feasibility: (worstFeasibility as string) === 'impossible' ? 'not recommended' : worstFeasibility,
            },
        });
    } catch (error: any) {
        console.error('Validate itinerary error:', error);
        res.status(500).json({ error: error.message || 'Validation failed' });
    }
});

// Generate PDF itinerary
// POST /api/itinerary/pdf
router.post('/pdf', async (req, res) => {
    try {
        const tripData = req.body;

        if (!tripData || !tripData.itinerary || !tripData.summary) {
            res.status(400).json({ error: 'Invalid trip data. Required: itinerary, summary' });
            return;
        }

        const pdfBuffer = await generateItineraryPDF(tripData);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=trip-itinerary-${tripData.itinerary.length}days.pdf`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);
    } catch (error: any) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: error.message || 'Failed to generate PDF' });
    }
});

export default router;
