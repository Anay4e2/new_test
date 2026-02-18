import ical, { ICalCalendarMethod, ICalEventRepeatingFreq, ICalAlarmType } from 'ical-generator';

// IST timezone
const TIMEZONE = 'Asia/Kolkata';

interface Activity {
    name: string;
    timeRequired?: number;
    entryFee?: number;
    bestTime?: string;
}

interface TravelInfo {
    from: string;
    to: string;
    distance: number;
    duration: number;
    mode: string;
}

interface NightStayInfo {
    hotel: {
        name: string;
        pricePerNight: number;
        rating?: number;
    };
    checkIn?: string;
    checkOut?: string;
}

interface MealRecommendation {
    restaurant: string;
    cuisine: string;
    estimatedCost: number;
    mustTry?: string;
}

interface DayData {
    day: number;
    city: string;
    activities?: Activity[];
    travel?: TravelInfo;
    nightStay?: string | NightStayInfo;
    meals?: {
        breakfast?: MealRecommendation;
        lunch?: MealRecommendation;
        dinner?: MealRecommendation;
    };
    weather?: {
        temp: number;
        condition: string;
    };
}

interface TripResultInput {
    itinerary: DayData[];
    summary: {
        totalCost: number;
        totalDistance: number;
        feasibility: string;
    };
}

// ----- Build event description for a day -----
function buildDayDescription(day: DayData): string {
    const lines: string[] = [];

    // Activities
    if (day.activities && day.activities.length > 0) {
        lines.push('📍 Activities:');
        day.activities.forEach((a, i) => {
            let line = `  ${i + 1}. ${a.name}`;
            if (a.timeRequired) line += ` (${a.timeRequired}h)`;
            if (a.entryFee) line += ` — ₹${a.entryFee}`;
            lines.push(line);
        });
        lines.push('');
    }

    // Travel
    if (day.travel) {
        lines.push(`🚗 Travel: ${day.travel.from} → ${day.travel.to}`);
        lines.push(`   ${day.travel.mode} • ${day.travel.distance} km • ~${day.travel.duration}h`);
        lines.push('');
    }

    // Night Stay
    if (day.nightStay) {
        if (typeof day.nightStay === 'object' && day.nightStay.hotel) {
            lines.push(`🏨 Stay: ${day.nightStay.hotel.name} (₹${day.nightStay.hotel.pricePerNight}/night)`);
        } else {
            lines.push(`🏨 Overnight in ${day.nightStay}`);
        }
        lines.push('');
    }

    // Meals
    if (day.meals) {
        const mealLines: string[] = [];
        if (day.meals.breakfast) mealLines.push(`  🌅 Breakfast: ${day.meals.breakfast.restaurant} — ${day.meals.breakfast.cuisine}`);
        if (day.meals.lunch) mealLines.push(`  ☀️ Lunch: ${day.meals.lunch.restaurant} — ${day.meals.lunch.cuisine}`);
        if (day.meals.dinner) mealLines.push(`  🌙 Dinner: ${day.meals.dinner.restaurant} — ${day.meals.dinner.cuisine}`);
        if (mealLines.length > 0) {
            lines.push('🍽️ Meals:');
            lines.push(...mealLines);
            lines.push('');
        }
    }

    // Weather
    if (day.weather) {
        lines.push(`🌤️ Weather: ${day.weather.temp}°C, ${day.weather.condition}`);
    }

    return lines.join('\n');
}

// ========== iCal File Generator ==========

export function generateICalFile(tripResult: TripResultInput, startDate: string): string {
    const cal = ical({
        name: `Trip Itinerary — ${tripResult.itinerary.length} Days`,
        timezone: TIMEZONE,
        method: ICalCalendarMethod.PUBLISH,
    });

    const base = new Date(startDate);

    tripResult.itinerary.forEach((day) => {
        const eventDate = new Date(base);
        eventDate.setDate(base.getDate() + (day.day - 1));

        const nextDate = new Date(eventDate);
        nextDate.setDate(eventDate.getDate() + 1);

        // Day event (all-day)
        const event = cal.createEvent({
            start: eventDate,
            end: nextDate,
            allDay: true,
            summary: `Day ${day.day} — ${day.city}`,
            description: buildDayDescription(day),
            location: day.city,
            timezone: TIMEZONE,
        });

        // Morning reminder
        event.createAlarm({
            type: ICalAlarmType.display,
            description: `Day ${day.day} of your trip starts today in ${day.city}!`,
            trigger: 60 * 60 * 7, // 7 AM = 7 hours after midnight (start of all-day event)
        });

        // Travel event (separate entry)
        if (day.travel) {
            const modeEmoji = day.travel.mode.toLowerCase().includes('train') ? '🚂'
                : day.travel.mode.toLowerCase().includes('flight') ? '✈️'
                    : day.travel.mode.toLowerCase().includes('bus') ? '🚌' : '🚕';

            cal.createEvent({
                start: eventDate,
                end: nextDate,
                allDay: true,
                summary: `${modeEmoji} ${day.travel.from} → ${day.travel.to}`,
                description: `${day.travel.mode} • ${day.travel.distance} km • ~${day.travel.duration}h`,
                location: `${day.travel.from} to ${day.travel.to}`,
                timezone: TIMEZONE,
            });
        }
    });

    // Reminder: 1 day before trip
    const firstEvent = cal.events()[0];
    if (firstEvent) {
        firstEvent.createAlarm({
            type: ICalAlarmType.display,
            description: 'Your trip starts tomorrow! Pack your bags! 🧳',
            triggerBefore: 24 * 60 * 60, // 24 hours before
        });
    }

    return cal.toString();
}

// ========== Google Calendar URL Generator ==========

function truncateForUrl(text: string, maxLen: number): string {
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen - 3) + '...';
}

function formatGoogleDate(date: Date): string {
    // Google Calendar format: YYYYMMDD for all-day events
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
}

export function generateGoogleCalendarUrls(tripResult: TripResultInput, startDate: string): string[] {
    const base = new Date(startDate);
    const urls: string[] = [];

    tripResult.itinerary.forEach((day) => {
        const eventDate = new Date(base);
        eventDate.setDate(base.getDate() + (day.day - 1));

        const nextDate = new Date(eventDate);
        nextDate.setDate(eventDate.getDate() + 1);

        const title = `Day ${day.day} — ${day.city}`;
        const description = truncateForUrl(buildDayDescription(day), 800);
        const dates = `${formatGoogleDate(eventDate)}/${formatGoogleDate(nextDate)}`;

        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: title,
            dates: dates,
            details: description,
            location: day.city,
            ctz: TIMEZONE,
        });

        urls.push(`https://calendar.google.com/calendar/render?${params.toString()}`);
    });

    return urls;
}
