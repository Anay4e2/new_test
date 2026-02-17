import { STATION_CODES } from './trainService';

// --- Types ---
export interface BookingLink {
    provider: string;
    url: string;
    logo: string;
    mode: string;
    estimatedPrice?: { min: number; max: number };
}

// --- Airport Codes ---
export const AIRPORT_CODES: Record<string, string> = {
    // Rajasthan
    'Jaipur': 'JAI',
    'Jodhpur': 'JDH',
    'Udaipur': 'UDR',
    'Jaisalmer': 'JSA',

    // Metro Cities
    'Delhi': 'DEL',
    'New Delhi': 'DEL',
    'Mumbai': 'BOM',
    'Kolkata': 'CCU',
    'Chennai': 'MAA',
    'Bangalore': 'BLR',
    'Hyderabad': 'HYD',

    // Major Cities
    'Ahmedabad': 'AMD',
    'Pune': 'PNQ',
    'Goa': 'GOI',
    'Panaji': 'GOI',
    'Kochi': 'COK',
    'Thiruvananthapuram': 'TRV',
    'Lucknow': 'LKO',
    'Varanasi': 'VNS',
    'Bhopal': 'BHO',
    'Indore': 'IDR',
    'Chandigarh': 'IXC',
    'Amritsar': 'ATQ',
    'Srinagar': 'SXR',
    'Dehradun': 'DED',
    'Agra': 'AGR',
    'Coimbatore': 'CJB',
    'Madurai': 'IXM',
    'Mangalore': 'IXE',
    'Mysore': 'MYQ',
    'Visakhapatnam': 'VTZ',
    'Bhubaneswar': 'BBI',
    'Ranchi': 'IXR',
    'Patna': 'PAT',
    'Nagpur': 'NAG',
    'Vadodara': 'BDQ',
    'Surat': 'STV',
    'Guwahati': 'GAU',
    'Bagdogra': 'IXB',
    'Port Blair': 'IXZ',
};

// --- Price rate constants (₹/km rough estimates) ---
const PRICE_RATES: Record<string, { min: number; max: number }> = {
    train: { min: 0.8, max: 2.0 },    // Sleeper to AC First
    bus: { min: 1.0, max: 2.5 },      // State bus to Volvo AC
    flight: { min: 3.0, max: 6.0 },   // Economy
    road: { min: 10, max: 15 },       // Cab per km
};

function formatDate(date: string): string {
    // Expect YYYY-MM-DD, return DD-MM-YYYY for Indian booking sites
    const parts = date.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return date;
}

function slug(city: string): string {
    return city.toLowerCase().replace(/\s+/g, '-');
}

// --- Deep Link Generators ---

function getTrainLinks(from: string, to: string, date: string, distance: number): BookingLink[] {
    const fromCode = STATION_CODES[from] || '';
    const toCode = STATION_CODES[to] || '';
    const dateFormatted = formatDate(date);

    const links: BookingLink[] = [];

    // IRCTC (official, primary)
    if (fromCode && toCode) {
        links.push({
            provider: 'IRCTC',
            url: `https://www.irctc.co.in/nget/train-search?from=${fromCode}&to=${toCode}&date=${dateFormatted}`,
            logo: '🚂',
            mode: 'train',
            estimatedPrice: { min: Math.round(distance * PRICE_RATES.train.min), max: Math.round(distance * PRICE_RATES.train.max) },
        });
    }

    // ixigo Trains
    links.push({
        provider: 'ixigo',
        url: `https://www.ixigo.com/trains/${slug(from)}-to-${slug(to)}`,
        logo: '🔵',
        mode: 'train',
        estimatedPrice: { min: Math.round(distance * PRICE_RATES.train.min), max: Math.round(distance * PRICE_RATES.train.max) },
    });

    // Paytm Trains
    if (fromCode && toCode) {
        links.push({
            provider: 'Paytm',
            url: `https://tickets.paytm.com/railways/search/${fromCode}/${toCode}/${date}`,
            logo: '💙',
            mode: 'train',
            estimatedPrice: { min: Math.round(distance * PRICE_RATES.train.min), max: Math.round(distance * PRICE_RATES.train.max) },
        });
    }

    return links;
}

function getBusLinks(from: string, to: string, date: string, distance: number): BookingLink[] {
    return [
        {
            provider: 'RedBus',
            url: `https://www.redbus.in/bus-tickets/${slug(from)}-to-${slug(to)}?date=${formatDate(date)}`,
            logo: '🔴',
            mode: 'bus',
            estimatedPrice: { min: Math.round(distance * PRICE_RATES.bus.min), max: Math.round(distance * PRICE_RATES.bus.max) },
        },
        {
            provider: 'AbhiBus',
            url: `https://www.abhibus.com/bus-tickets/${slug(from)}-to-${slug(to)}`,
            logo: '🟠',
            mode: 'bus',
            estimatedPrice: { min: Math.round(distance * PRICE_RATES.bus.min), max: Math.round(distance * PRICE_RATES.bus.max) },
        },
        {
            provider: 'Paytm Bus',
            url: `https://tickets.paytm.com/bus/search/${slug(from)}/${slug(to)}/${date}`,
            logo: '💙',
            mode: 'bus',
            estimatedPrice: { min: Math.round(distance * PRICE_RATES.bus.min), max: Math.round(distance * PRICE_RATES.bus.max) },
        },
    ];
}

function getFlightLinks(from: string, to: string, date: string, distance: number): BookingLink[] {
    const fromCode = AIRPORT_CODES[from];
    const toCode = AIRPORT_CODES[to];

    if (!fromCode || !toCode) return []; // No airport at one/both ends

    return [
        {
            provider: 'MakeMyTrip',
            url: `https://www.makemytrip.com/flight/search?itinerary=${fromCode}-${toCode}-${date}&tripType=O&paxType=A-1_C-0_I-0&cabinClass=E`,
            logo: '🟡',
            mode: 'flight',
            estimatedPrice: { min: Math.round(distance * PRICE_RATES.flight.min), max: Math.round(distance * PRICE_RATES.flight.max) },
        },
        {
            provider: 'Google Flights',
            url: `https://www.google.com/travel/flights?q=Flights%20${fromCode}%20to%20${toCode}%20on%20${date}`,
            logo: '🔵',
            mode: 'flight',
            estimatedPrice: { min: Math.round(distance * PRICE_RATES.flight.min), max: Math.round(distance * PRICE_RATES.flight.max) },
        },
        {
            provider: 'ixigo Flights',
            url: `https://www.ixigo.com/flights/${slug(from)}-to-${slug(to)}-${date}`,
            logo: '🔵',
            mode: 'flight',
            estimatedPrice: { min: Math.round(distance * PRICE_RATES.flight.min), max: Math.round(distance * PRICE_RATES.flight.max) },
        },
    ];
}

function getCabLinks(from: string, to: string, distance: number): BookingLink[] {
    return [
        {
            provider: 'Uber',
            url: 'https://m.uber.com/',
            logo: '⬛',
            mode: 'cab',
            estimatedPrice: { min: Math.round(distance * PRICE_RATES.road.min), max: Math.round(distance * PRICE_RATES.road.max) },
        },
        {
            provider: 'Ola',
            url: 'https://book.olacabs.com/',
            logo: '🟢',
            mode: 'cab',
            estimatedPrice: { min: Math.round(distance * PRICE_RATES.road.min), max: Math.round(distance * PRICE_RATES.road.max) },
        },
    ];
}

// --- Main Export ---

export function generateBookingLinks(from: string, to: string, date: string, mode: string, distance?: number): BookingLink[] {
    const dist = distance || 300; // fallback if not provided
    const normalizedMode = mode?.toLowerCase() || 'all';

    const links: BookingLink[] = [];

    if (normalizedMode === 'train' || normalizedMode === 'all') {
        links.push(...getTrainLinks(from, to, date, dist));
    }
    if (normalizedMode === 'bus' || normalizedMode === 'all') {
        links.push(...getBusLinks(from, to, date, dist));
    }
    if (normalizedMode === 'flight' || normalizedMode === 'all') {
        links.push(...getFlightLinks(from, to, date, dist));
    }
    if (normalizedMode === 'road' || normalizedMode === 'cab' || normalizedMode === 'private taxi' || normalizedMode === 'all') {
        links.push(...getCabLinks(from, to, dist));
    }

    return links;
}
