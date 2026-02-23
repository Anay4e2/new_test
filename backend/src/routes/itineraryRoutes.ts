import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { generateItineraryPDF } from '../services/pdfService';
import { CITIES as MOCK_CITIES } from '../services/mockData';
import { haversineDistance } from '../services/routeOptimizer';
import { formatItineraryForWhatsApp } from '../services/whatsappService';
import { sendItineraryEmail } from '../services/emailService';
import { generatePackingList } from '../services/packingListService';
import { generateBookingLinks } from '../services/bookingLinksService';
import { generateICalFile, generateGoogleCalendarUrls } from '../services/calendarService';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

const emailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { error: 'Too many email requests. Try again later.' }
});

// Validate a modified itinerary â€” recalculate distances, travel, feasibility
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
        res.status(500).json({ error: 'Validation failed' });
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
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

// Generate Packing List
// POST /api/itinerary/packing-list
router.post('/packing-list', async (req, res) => {
    try {
        const { tripResult, month, constraints, budget } = req.body;

        if (!tripResult || !tripResult.itinerary || !tripResult.summary) {
            res.status(400).json({ error: 'Invalid trip data. Required: tripResult (with itinerary and summary)' });
            return;
        }

        const currentMonth = typeof month === 'number' ? month : new Date().getMonth();
        const packingList = generatePackingList(tripResult, currentMonth, constraints, budget);
        res.json(packingList);
    } catch (error: any) {
        console.error('Error generating packing list:', error);
        res.status(500).json({ error: 'Failed to generate packing list' });
    }
});

// Generate WhatsApp-friendly text
// POST /api/itinerary/whatsapp-text
router.post('/whatsapp-text', async (req, res) => {
    try {
        const tripResult = req.body;

        if (!tripResult || !tripResult.itinerary || !tripResult.summary) {
            res.status(400).json({ error: 'Invalid trip data. Required: itinerary, summary' });
            return;
        }

        const text = formatItineraryForWhatsApp(tripResult);
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;

        res.json({ text, whatsappUrl });
    } catch (error: any) {
        console.error('Error generating WhatsApp text:', error);
        res.status(500).json({ error: 'Failed to generate WhatsApp text' });
    }
});

// Send itinerary via email
// POST /api/itinerary/send-email
router.post('/send-email', authMiddleware, emailLimiter, async (req, res) => {
    try {
        const { email, tripResult, attachPdf = false } = req.body;

        if (!email || !tripResult || !tripResult.itinerary || !tripResult.summary) {
            res.status(400).json({ error: 'Required: email, tripResult (with itinerary and summary)' });
            return;
        }

        const result = await sendItineraryEmail(email, tripResult, attachPdf);
        res.json(result);
    } catch (error: any) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

// Get booking deep links for a travel segment
// GET /api/itinerary/booking-links?from=Jaipur&to=Jodhpur&date=2026-03-15&mode=train&distance=300
router.get('/booking-links', (req, res) => {
    try {
        const { from, to, date, mode, distance } = req.query;

        if (!from || !to) {
            res.status(400).json({ error: 'Required query params: from, to' });
            return;
        }

        const travelDate = (date as string) || new Date().toISOString().split('T')[0];
        const travelMode = (mode as string) || 'all';
        const dist = distance ? parseInt(distance as string, 10) : undefined;

        const links = generateBookingLinks(from as string, to as string, travelDate, travelMode, dist);
        res.json({ links, disclaimer: 'Prices are estimates. Check booking site for current fares.' });
    } catch (error: any) {
        console.error('Error generating booking links:', error);
        res.status(500).json({ error: 'Failed to generate booking links' });
    }
});

// Download iCal file for trip
// POST /api/itinerary/calendar/ical
router.post('/calendar/ical', (req, res) => {
    try {
        const { tripResult, startDate } = req.body;

        if (!tripResult || !tripResult.itinerary || !startDate) {
            res.status(400).json({ error: 'Required: tripResult (with itinerary), startDate' });
            return;
        }

        const icsContent = generateICalFile(tripResult, startDate);
        const buffer = Buffer.from(icsContent, 'utf-8');

        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=trip-itinerary-${tripResult.itinerary.length}days.ics`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    } catch (error: any) {
        console.error('Error generating iCal:', error);
        res.status(500).json({ error: 'Failed to generate iCal file' });
    }
});

// Get Google Calendar URLs for trip
// POST /api/itinerary/calendar/google-urls
router.post('/calendar/google-urls', (req, res) => {
    try {
        const { tripResult, startDate } = req.body;

        if (!tripResult || !tripResult.itinerary || !startDate) {
            res.status(400).json({ error: 'Required: tripResult (with itinerary), startDate' });
            return;
        }

        const urls = generateGoogleCalendarUrls(tripResult, startDate);
        res.json({ urls });
    } catch (error: any) {
        console.error('Error generating Google Calendar URLs:', error);
        res.status(500).json({ error: 'Failed to generate Calendar URLs' });
    }
});

export default router;
