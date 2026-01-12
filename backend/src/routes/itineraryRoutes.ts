import { Router } from 'express';
import { generateItineraryPDF } from '../services/pdfService';

const router = Router();

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
