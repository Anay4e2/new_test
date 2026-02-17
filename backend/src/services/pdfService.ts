import PDFDocument from 'pdfkit';
import { generatePackingList } from './packingListService';
import { EMERGENCY_INFO } from './mockData';

// Types
interface Activity {
    name: string;
    type: string;
    timeRequired: number;
    bestTimeOfDay: string;
    imageUrl?: string;
}

interface DayItinerary {
    day: number;
    city: string;
    activities: Activity[];
    travel?: {
        from: string;
        to: string;
        distance: number;
        duration: number;
        mode?: string;
    };
    nightStay: string;
}

interface TripSummary {
    totalCost: number;
    totalDistance: number;
    feasibility: string;
    costBreakup: {
        stay: number;
        transport?: number;
        travel?: number;
        activities: number;
        food?: number;
    };
}

interface TripResult {
    itinerary: DayItinerary[];
    summary: TripSummary;
}

// Clothing recommendations based on temperature/season
export const getClothingRecommendations = (month: number): { icon: string; item: string }[] => {
    const recommendations: { icon: string; item: string }[] = [];

    if (month >= 10 || month <= 1) {
        // Winter (Nov-Feb)
        recommendations.push({ icon: '🧥', item: 'Warm Jacket/Sweater' });
        recommendations.push({ icon: '🧣', item: 'Scarf & Gloves' });
        recommendations.push({ icon: '👖', item: 'Warm Trousers' });
    } else if (month >= 2 && month <= 4) {
        // Summer (Mar-May)
        recommendations.push({ icon: '👕', item: 'Light Cotton Clothes' });
        recommendations.push({ icon: '🧢', item: 'Hat/Cap for Sun' });
        recommendations.push({ icon: '🕶️', item: 'Sunglasses' });
    } else if (month >= 5 && month <= 8) {
        // Monsoon (Jun-Sep)
        recommendations.push({ icon: '☔', item: 'Rain Jacket/Umbrella' });
        recommendations.push({ icon: '👟', item: 'Waterproof Shoes' });
        recommendations.push({ icon: '👕', item: 'Quick-dry Clothes' });
    } else {
        // Autumn (Sep-Oct)
        recommendations.push({ icon: '👕', item: 'Light Layers' });
        recommendations.push({ icon: '👖', item: 'Comfortable Trousers' });
    }

    recommendations.push({ icon: '👟', item: 'Comfortable Walking Shoes' });
    recommendations.push({ icon: '🧴', item: 'Sunscreen' });

    return recommendations;
};

// Travel mode recommendations
const getTravelModeRecommendations = (distance: number): { icon: string; mode: string; cost: string; duration: string; recommended: boolean }[] => {
    const modes: { icon: string; mode: string; cost: string; duration: string; recommended: boolean }[] = [];

    if (distance < 100) {
        modes.push({
            icon: '🚗',
            mode: 'Self Drive/Taxi',
            cost: `₹${Math.round(distance * 12)}-₹${Math.round(distance * 20)}`,
            duration: `${(distance / 50).toFixed(1)} hrs`,
            recommended: true
        });
    } else if (distance < 500) {
        modes.push({
            icon: '🚂',
            mode: 'Train (AC)',
            cost: `₹${Math.round(distance * 2)}-₹${Math.round(distance * 3.5)}`,
            duration: `${(distance / 60).toFixed(1)} hrs`,
            recommended: true
        });
        modes.push({
            icon: '🚌',
            mode: 'Bus (Volvo)',
            cost: `₹${Math.round(distance * 1.5)}-₹${Math.round(distance * 2.5)}`,
            duration: `${(distance / 45).toFixed(1)} hrs`,
            recommended: false
        });
        modes.push({
            icon: '🚗',
            mode: 'Self Drive',
            cost: `₹${Math.round(distance * 10)}-₹${Math.round(distance * 14)}`,
            duration: `${(distance / 50).toFixed(1)} hrs`,
            recommended: false
        });
    } else {
        modes.push({
            icon: '✈️',
            mode: 'Flight',
            cost: `₹${4000 + Math.round(distance * 4)}-₹${8000 + Math.round(distance * 6)}`,
            duration: `${(distance / 700 + 2).toFixed(1)} hrs`,
            recommended: distance > 800
        });
        modes.push({
            icon: '🚂',
            mode: 'Train (AC)',
            cost: `₹${Math.round(distance * 1.5)}-₹${Math.round(distance * 3)}`,
            duration: `${(distance / 55).toFixed(1)} hrs`,
            recommended: distance <= 800
        });
    }

    return modes;
};

// Generate PDF and return as Buffer
export const generateItineraryPDF = (result: TripResult): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        try {
            const { itinerary, summary } = result;
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const currentMonth = new Date().getMonth();

            // ============================================
            // HEADER
            // ============================================
            doc.rect(0, 0, doc.page.width, 80).fill('#2c3e50');

            doc.fontSize(28).fillColor('#ffffff')
                .text('Your Journey Itinerary', 50, 25, { align: 'center' });

            doc.fontSize(12).fillColor('#ecf0f1')
                .text(`${itinerary.length} Days  •  ${Math.round(summary.totalDistance)} km  •  ₹${summary.totalCost.toLocaleString()}`,
                    50, 55, { align: 'center' });

            doc.moveDown(3);
            doc.fillColor('#000000');

            // ============================================
            // TRIP OVERVIEW
            // ============================================
            doc.fontSize(14).fillColor('#2980b9').text('📊 TRIP OVERVIEW', { underline: true });
            doc.moveDown(0.5);

            doc.fontSize(11).fillColor('#333333');
            doc.text(`• Total Duration: ${itinerary.length} days`);
            doc.text(`• Total Distance: ${Math.round(summary.totalDistance)} km`);
            doc.text(`• Estimated Cost: ₹${summary.totalCost.toLocaleString()}`);
            doc.text(`• Trip Pace: ${summary.feasibility}`);
            doc.moveDown(1);

            // ============================================
            // DAY-BY-DAY ITINERARY
            // ============================================
            doc.fontSize(14).fillColor('#2980b9').text('📅 DAY-BY-DAY ITINERARY', { underline: true });
            doc.moveDown(0.5);

            for (const day of itinerary) {
                // Check if we need a new page
                if (doc.y > doc.page.height - 150) {
                    doc.addPage();
                }

                // Day header
                doc.fontSize(12).fillColor('#34495e').text(`Day ${day.day} - ${day.city}`, { continued: false });
                doc.moveTo(50, doc.y).lineTo(250, doc.y).stroke('#bdc3c7');
                doc.moveDown(0.3);

                // Activities
                if (day.activities && day.activities.length > 0) {
                    doc.fontSize(10).fillColor('#333333');
                    for (const act of day.activities) {
                        doc.text(`  📍 ${act.name}`, { continued: false });
                        doc.fontSize(9).fillColor('#7f8c8d')
                            .text(`      ${act.type} • ${act.timeRequired}h • ${act.bestTimeOfDay}`);
                        doc.fillColor('#333333').fontSize(10);
                    }
                } else {
                    doc.fontSize(10).fillColor('#95a5a6')
                        .text('  Free day for leisure or local exploration.');
                }

                // Travel info
                if (day.travel) {
                    doc.moveDown(0.3);
                    doc.fontSize(10).fillColor('#e67e22')
                        .text(`  🚗 Travel to ${day.travel.to}: ${Math.round(day.travel.distance)}km (~${Math.round(day.travel.duration)}h)`);
                }

                // Night stay
                doc.fontSize(10).fillColor('#333333')
                    .text(`  🌙 Overnight: ${day.nightStay}`);
                doc.moveDown(0.8);
            }

            // ============================================
            // ROUTE MAP SECTION
            // ============================================
            if (doc.y > doc.page.height - 200) {
                doc.addPage();
            }

            const cities = [...new Set(itinerary.map(d => d.city))];
            doc.fontSize(14).fillColor('#2980b9').text('🗺️ YOUR ROUTE', { underline: true });
            doc.moveDown(0.5);

            doc.fontSize(11).fillColor('#333333').text(`Route: ${cities.join(' → ')}`);
            doc.moveDown(0.5);

            cities.forEach((city, i) => {
                doc.fontSize(10).text(`  ${i + 1}. ${city}`);
            });
            doc.moveDown(1);

            // ============================================
            // TRAVEL OPTIONS
            // ============================================
            if (summary.totalDistance > 0) {
                if (doc.y > doc.page.height - 200) {
                    doc.addPage();
                }

                doc.fontSize(14).fillColor('#2980b9').text('🚀 RECOMMENDED TRAVEL OPTIONS', { underline: true });
                doc.moveDown(0.5);

                doc.fontSize(10).fillColor('#7f8c8d')
                    .text(`Total Distance: ${Math.round(summary.totalDistance)} km`);
                doc.moveDown(0.5);

                const travelModes = getTravelModeRecommendations(summary.totalDistance);
                for (const mode of travelModes) {
                    doc.fontSize(10).fillColor(mode.recommended ? '#27ae60' : '#333333')
                        .text(`  ${mode.icon} ${mode.mode}${mode.recommended ? ' ⭐ RECOMMENDED' : ''}`);
                    doc.fontSize(9).fillColor('#7f8c8d')
                        .text(`      Duration: ${mode.duration} | Cost: ${mode.cost}`);
                }
                doc.moveDown(1);
            }

            // ============================================
            // PACKING LIST (full categorized)
            // ============================================
            doc.addPage();

            doc.fontSize(18).fillColor('#2c3e50').text('🎒 PACKING LIST', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(9).fillColor('#7f8c8d').text('Auto-generated based on your itinerary, season & preferences');
            doc.moveDown(1);

            const packingList = generatePackingList(result, currentMonth);
            const categories: { key: keyof typeof packingList; label: string; icon: string }[] = [
                { key: 'essentials', label: 'ESSENTIALS', icon: '⚡' },
                { key: 'clothing', label: 'CLOTHING', icon: '👕' },
                { key: 'accessories', label: 'ACCESSORIES', icon: '🎒' },
                { key: 'documents', label: 'DOCUMENTS', icon: '📄' },
                { key: 'healthKit', label: 'HEALTH KIT', icon: '💊' },
                { key: 'extras', label: 'EXTRAS', icon: '✨' },
            ];

            for (const cat of categories) {
                const items = packingList[cat.key];
                if (!items || items.length === 0) continue;

                if (doc.y > doc.page.height - 100) {
                    doc.addPage();
                }

                doc.fontSize(11).fillColor('#2980b9').text(`${cat.icon} ${cat.label}`, { underline: true });
                doc.moveDown(0.3);

                for (const item of items) {
                    if (doc.y > doc.page.height - 40) {
                        doc.addPage();
                    }
                    const priorityLabel = item.priority === 'must-have' ? '★' : item.priority === 'recommended' ? '●' : '○';
                    doc.fontSize(9).fillColor('#333333')
                        .text(`  ${priorityLabel} ${item.icon} ${item.name}`, { continued: false });
                    doc.fontSize(8).fillColor('#7f8c8d')
                        .text(`      ${item.reason}`);
                }
                doc.moveDown(0.5);
            }
            doc.moveDown(1);

            // ============================================
            // COST BREAKDOWN
            // ============================================
            if (doc.y > doc.page.height - 180) {
                doc.addPage();
            }

            doc.fontSize(14).fillColor('#2980b9').text('💰 COST BREAKDOWN', { underline: true });
            doc.moveDown(0.5);

            doc.fontSize(10).fillColor('#333333');
            if (summary.costBreakup.stay > 0) {
                doc.text(`  Accommodation: ₹${summary.costBreakup.stay.toLocaleString()}`);
            }
            const transportCost = summary.costBreakup.transport || summary.costBreakup.travel || 0;
            if (transportCost > 0) {
                doc.text(`  Transport: ₹${transportCost.toLocaleString()}`);
            }
            if (summary.costBreakup.activities > 0) {
                doc.text(`  Activities: ₹${summary.costBreakup.activities.toLocaleString()}`);
            }
            if (summary.costBreakup.food && summary.costBreakup.food > 0) {
                doc.text(`  Food: ₹${summary.costBreakup.food.toLocaleString()}`);
            }

            doc.moveDown(0.3);
            doc.moveTo(50, doc.y).lineTo(200, doc.y).stroke('#bdc3c7');
            doc.moveDown(0.3);

            doc.fontSize(11).fillColor('#2c3e50')
                .text(`  TOTAL: ₹${summary.totalCost.toLocaleString()}`, { continued: false });

            // ============================================
            // EMERGENCY CONTACTS
            // ============================================
            const tripCities = [...new Set(itinerary.map(d => d.city))];
            const citiesWithInfo = tripCities.filter(c => {
                const key = Object.keys(EMERGENCY_INFO).find(k => k.toLowerCase() === c.toLowerCase());
                return !!key;
            });

            if (citiesWithInfo.length > 0) {
                doc.addPage();
                doc.fontSize(18).fillColor('#c0392b').text('🆘 EMERGENCY CONTACTS', { underline: true });
                doc.moveDown(0.5);
                doc.fontSize(9).fillColor('#7f8c8d').text('Keep this page handy during your trip');
                doc.moveDown(1);

                // Universal numbers
                doc.fontSize(11).fillColor('#2c3e50').text('📞 Universal Emergency Numbers', { underline: true });
                doc.moveDown(0.3);
                doc.fontSize(10).fillColor('#333333');
                doc.text('  🚔 Police: 100');
                doc.text('  🚑 Ambulance: 108');
                doc.text('  🚒 Fire: 101');
                doc.text('  📞 Tourist Helpline: 1363');
                doc.text('  👩 Women Helpline: 1091');
                doc.moveDown(1);

                // Per-city info
                for (const cityName of citiesWithInfo) {
                    const key = Object.keys(EMERGENCY_INFO).find(k => k.toLowerCase() === cityName.toLowerCase())!;
                    const info = EMERGENCY_INFO[key];

                    if (doc.y > doc.page.height - 180) {
                        doc.addPage();
                    }

                    doc.fontSize(12).fillColor('#c0392b').text(`📍 ${info.cityName}`, { underline: true });
                    doc.moveDown(0.3);

                    // Police
                    doc.fontSize(10).fillColor('#333333');
                    doc.text(`  🏛️ ${info.police.station}: ${info.police.number}`);
                    doc.fontSize(9).fillColor('#7f8c8d').text(`      ${info.police.address}`);

                    // Hospitals
                    for (const h of info.hospital) {
                        if (doc.y > doc.page.height - 60) doc.addPage();
                        doc.fontSize(10).fillColor('#333333');
                        doc.text(`  🏥 ${h.name}${h.hasEmergency ? ' (24/7 ER)' : ''}: ${h.number}`);
                        doc.fontSize(9).fillColor('#7f8c8d').text(`      ${h.address}`);
                    }

                    // Nearest Airport
                    doc.fontSize(10).fillColor('#333333');
                    doc.text(`  ✈️ Nearest Airport: ${info.nearestAirport.name} (${info.nearestAirport.code}) — ${info.nearestAirport.distanceKm} km`);
                    doc.moveDown(0.8);
                }
            }

            // ============================================
            // FOOTER
            // ============================================
            doc.moveDown(2);
            doc.fontSize(9).fillColor('#95a5a6')
                .text(`Generated by Trip Planner ✨ on ${new Date().toLocaleDateString()}`, { align: 'center' });

            // Finalize PDF
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

export default { generateItineraryPDF };
