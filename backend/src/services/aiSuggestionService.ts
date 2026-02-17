// AI Suggestion Service — Rule-based NLP engine (no external AI APIs)
import { CITIES, STATES, PLACES } from './mockData';
import type { TripRequest, BudgetTier, TravelStyle } from './planner';

// ─── Types ────────────────────────────────────────────────────────
export interface TripSuggestion {
    title: string;
    description: string;
    stateCode: string;
    cityIds: string[];
    duration: number;
    budget: BudgetTier;
    highlights: string[];
    imageUrl: string;
    tags: string[];
}

export interface ParsedTripQuery {
    tripRequest: Partial<TripRequest>;
    confidence: Record<string, number>;
    suggestions: TripSuggestion[];
    detectedEntities: {
        duration?: string;
        budget?: string;
        style?: string;
        locations: string[];
        constraints: string[];
        interests: string[];
    };
}

// ─── Levenshtein Distance (fuzzy matching) ────────────────────────
function levenshtein(a: string, b: string): number {
    const la = a.length, lb = b.length;
    const dp: number[][] = Array.from({ length: la + 1 }, () => Array(lb + 1).fill(0));
    for (let i = 0; i <= la; i++) dp[i][0] = i;
    for (let j = 0; j <= lb; j++) dp[0][j] = j;
    for (let i = 1; i <= la; i++) {
        for (let j = 1; j <= lb; j++) {
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
        }
    }
    return dp[la][lb];
}

function fuzzyMatch(input: string, target: string, maxDist = 2): boolean {
    const a = input.toLowerCase().trim();
    const b = target.toLowerCase().trim();
    if (b.includes(a) || a.includes(b)) return true;
    if (Math.abs(a.length - b.length) > maxDist) return false;
    return levenshtein(a, b) <= maxDist;
}

// ─── State name alias map ─────────────────────────────────────────
const STATE_ALIASES: Record<string, string> = {
    'rajasthan': 'RAJASTHAN',
    'rajastan': 'RAJASTHAN',
    'rj': 'RAJASTHAN',
    'kerala': 'KERALA',
    'kl': 'KERALA',
    'goa': 'GOA',
    'ga': 'GOA',
    'himachal': 'HIMACHAL_PRADESH',
    'himachal pradesh': 'HIMACHAL_PRADESH',
    'hp': 'HIMACHAL_PRADESH',
    'uttar pradesh': 'UTTAR_PRADESH',
    'up': 'UTTAR_PRADESH',
    'madhya pradesh': 'MADHYA_PRADESH',
    'mp': 'MADHYA_PRADESH',
    'gujarat': 'GUJARAT',
    'gj': 'GUJARAT',
    'maharashtra': 'MAHARASHTR',
    'mh': 'MAHARASHTR',
    'tamil nadu': 'TAMIL_NADU',
    'tamilnadu': 'TAMIL_NADU',
    'tn': 'TAMIL_NADU',
    'west bengal': 'WEST_BENGA',
    'wb': 'WEST_BENGA',
    'karnataka': 'KARNATAKA',
    'ka': 'KARNATAKA',
};

// State code (UI code like 'RJ') to stateCode (data code like 'RAJASTHAN')
const UI_CODE_MAP: Record<string, string> = {
    'RJ': 'RAJASTHAN',
    'KL': 'KERALA',
    'GA': 'GOA',
    'HP': 'HIMACHAL_PRADESH',
    'UP': 'UTTAR_PRADESH',
    'MP': 'MADHYA_PRADESH',
    'GJ': 'GUJARAT',
    'MH': 'MAHARASHTR',
    'TN': 'TAMIL_NADU',
    'WB': 'WEST_BENGA',
    'KA': 'KARNATAKA',
};

// Reverse map: data stateCode → UI code
const DATA_TO_UI: Record<string, string> = {};
for (const [ui, data] of Object.entries(UI_CODE_MAP)) {
    DATA_TO_UI[data] = ui;
}

// ─── Parser Helpers ───────────────────────────────────────────────

function parseDuration(query: string): { value: number; confidence: number; raw: string } | null {
    const q = query.toLowerCase();

    // "weekend" / "weekender"
    if (/\bweekend\b/.test(q)) return { value: 2, confidence: 0.9, raw: 'weekend' };

    // "a week" / "one week"
    if (/\b(a|one)\s+week\b/.test(q)) return { value: 7, confidence: 0.95, raw: 'a week' };
    if (/\btwo\s+weeks?\b/.test(q)) return { value: 14, confidence: 0.95, raw: 'two weeks' };

    // "3-4 days" range → take average
    const rangeMatch = q.match(/(\d+)\s*[-–to]+\s*(\d+)\s*days?/);
    if (rangeMatch) {
        const avg = Math.round((parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2);
        return { value: avg, confidence: 0.8, raw: rangeMatch[0] };
    }

    // "5 days" / "5 day"
    const daysMatch = q.match(/(\d+)\s*days?/);
    if (daysMatch) return { value: parseInt(daysMatch[1]), confidence: 1.0, raw: daysMatch[0] };

    // "5 nights"
    const nightsMatch = q.match(/(\d+)\s*nights?/);
    if (nightsMatch) return { value: parseInt(nightsMatch[1]) + 1, confidence: 0.9, raw: nightsMatch[0] };

    // "a fortnight"
    if (/\bfortnight\b/.test(q)) return { value: 14, confidence: 0.9, raw: 'fortnight' };

    return null;
}

function parseBudget(query: string): { value: BudgetTier; confidence: number; raw: string } | null {
    const q = query.toLowerCase();

    // Rupee amounts
    const amountMatch = q.match(/(?:₹|rs\.?|inr)\s*(\d[\d,]*)/i);
    if (amountMatch) {
        const amount = parseInt(amountMatch[1].replace(/,/g, ''));
        if (amount <= 5000) return { value: 'budget', confidence: 0.85, raw: amountMatch[0] };
        if (amount <= 15000) return { value: 'standard', confidence: 0.85, raw: amountMatch[0] };
        return { value: 'premium', confidence: 0.85, raw: amountMatch[0] };
    }

    // Keywords
    const budgetWords: [RegExp, BudgetTier, number][] = [
        [/\b(cheap|budget|economical?|affordable|low[\s-]?cost|backpack)\b/, 'budget', 0.9],
        [/\b(mid[\s-]?range|moderate|standard|comfortable|decent)\b/, 'standard', 0.85],
        [/\b(luxury|luxurious|premium|high[\s-]?end|5[\s-]?star|five[\s-]?star|splurge|lavish|upscale|royal)\b/, 'premium', 0.95],
    ];

    for (const [regex, tier, conf] of budgetWords) {
        const match = q.match(regex);
        if (match) return { value: tier, confidence: conf, raw: match[0] };
    }

    return null;
}

function parseStyle(query: string): { value: TravelStyle; confidence: number; raw: string } | null {
    const q = query.toLowerCase();

    const styleWords: [RegExp, TravelStyle, number][] = [
        [/\b(relaxed|slow\s*pace|chill|leisurely|easy[\s-]?going|laid[\s-]?back|lazy|honeymoon)\b/, 'relaxed', 0.9],
        [/\b(packed|fast|adventure|adventurous|action[\s-]?packed|quick|sprint|whirlwind|intense)\b/, 'fast', 0.9],
    ];

    for (const [regex, style, conf] of styleWords) {
        const match = q.match(regex);
        if (match) return { value: style, confidence: conf, raw: match[0] };
    }

    return null;
}

function parseLocations(query: string): {
    stateCode: string | null;
    cityIds: string[];
    confidence: number;
    rawLocations: string[];
} {
    const q = query.toLowerCase();
    let stateCode: string | null = null;
    const cityIds: string[] = [];
    const rawLocations: string[] = [];
    let confidence = 0;

    // Check state aliases (direct keyword match)
    for (const [alias, code] of Object.entries(STATE_ALIASES)) {
        if (q.includes(alias)) {
            stateCode = code;
            rawLocations.push(alias);
            confidence = 1.0;
            break;
        }
    }

    // Check for city names (exact or fuzzy)
    for (const city of CITIES) {
        const cityLower = city.name.toLowerCase();
        if (q.includes(cityLower)) {
            cityIds.push(city._id);
            rawLocations.push(city.name);
            // Infer state from city
            if (!stateCode) {
                stateCode = city.stateCode;
                confidence = 0.95;
            }
        } else {
            // Fuzzy match — check each word in the query
            const words = q.split(/\s+/);
            for (const word of words) {
                if (word.length >= 4 && fuzzyMatch(word, cityLower, 2)) {
                    cityIds.push(city._id);
                    rawLocations.push(city.name);
                    if (!stateCode) {
                        stateCode = city.stateCode;
                        confidence = 0.7;  // lower confidence for fuzzy
                    }
                    break;
                }
            }
        }
    }

    // Thematic location detection — "desert trip" → Rajasthan/Jaisalmer
    const thematicMap: [RegExp, string, string[]][] = [
        [/\bdesert\b/, 'RAJASTHAN', ['jaisalmer', 'jodhpur']],
        [/\bbackwater/, 'KERALA', ['alleppey', 'kochi']],
        [/\btea\s*(garden|estate|plantation)/, 'KERALA', ['munnar']],
        [/\bbeach(es)?\b/, 'GOA', ['north_goa']],
        [/\bgolden\s*triangle\b/, 'RAJASTHAN', ['jaipur']],
        [/\btaj\s*mahal\b/, 'UTTAR_PRADESH', ['agra']],
        [/\bvaranasi|banaras|kashi\b/, 'UTTAR_PRADESH', ['varanasi']],
        [/\bhouseboat\b/, 'KERALA', ['alleppey']],
    ];

    for (const [regex, state, cities] of thematicMap) {
        if (regex.test(q) && !stateCode) {
            stateCode = state;
            rawLocations.push(q.match(regex)?.[0] || '');
            confidence = 0.75;
            for (const cid of cities) {
                if (!cityIds.includes(cid)) cityIds.push(cid);
            }
        }
    }

    if (!confidence && stateCode) confidence = 0.9;

    return { stateCode, cityIds, confidence, rawLocations: [...new Set(rawLocations)] };
}

function parseConstraints(query: string): {
    constraints: Partial<TripRequest['constraints']>;
    raw: string[];
} {
    const q = query.toLowerCase();
    const constraints: Partial<TripRequest['constraints']> = {};
    const raw: string[] = [];

    // Senior-friendly
    if (/\b(parent|parents|elderly|senior|grandparent|old\s*age|60\+|70\+)\b/.test(q)) {
        constraints.seniorFriendly = true;
        raw.push('senior-friendly');
    }

    // Morning religious
    if (/\b(temple\s*tour|spiritual|pilgrim|religious|mandir|darshan|pooja|puja)\b/.test(q)) {
        constraints.morningReligious = true;
        raw.push('morning-religious');
    }

    // No night travel
    if (/\b(no\s*night\s*travel|daytime\s*only|avoid\s*night)\b/.test(q)) {
        constraints.noNightTravel = true;
        raw.push('no-night-travel');
    }

    return { constraints, raw };
}

function parseInterests(query: string): string[] {
    const q = query.toLowerCase();
    const interests: string[] = [];

    const interestMap: [RegExp, string][] = [
        [/\b(fort|forts|palace|palaces|heritage|historical)\b/, 'heritage'],
        [/\b(food|culinary|cuisine|foodie|food\s*tour|street\s*food)\b/, 'food'],
        [/\b(desert|dunes|camel|safari)\b/, 'desert'],
        [/\b(spiritual|temple|religious|sacred|pilgrimage)\b/, 'spiritual'],
        [/\b(honeymoon|romantic|couple|romance)\b/, 'honeymoon'],
        [/\b(adventure|trek|trekking|hiking|sports)\b/, 'adventure'],
        [/\b(nature|wildlife|lake|mountain|hill)\b/, 'nature'],
        [/\b(beach|sun|sand|water\s*sports)\b/, 'beach'],
        [/\b(museum|art|gallery|culture|cultural)\b/, 'culture'],
        [/\b(family|kids|children)\b/, 'family'],
        [/\b(photo|photography|instagram)\b/, 'photography'],
    ];

    for (const [regex, interest] of interestMap) {
        if (regex.test(q)) interests.push(interest);
    }

    return interests;
}

// ─── Main Parser ──────────────────────────────────────────────────

export function parseNaturalLanguageQuery(query: string): ParsedTripQuery {
    const duration = parseDuration(query);
    const budget = parseBudget(query);
    const style = parseStyle(query);
    const locations = parseLocations(query);
    const { constraints, raw: constraintRaw } = parseConstraints(query);
    const interests = parseInterests(query);

    // Honeymoon inference: relaxed + premium
    const q = query.toLowerCase();
    let inferredStyle = style?.value;
    let inferredBudget = budget?.value;
    if (/\bhoneymoon\b/.test(q)) {
        if (!inferredStyle) inferredStyle = 'relaxed';
        if (!inferredBudget) inferredBudget = 'premium';
    }

    // Build the state code for the UI (convert from data stateCode if needed)
    const uiStateCode = locations.stateCode ? (DATA_TO_UI[locations.stateCode] || locations.stateCode) : undefined;

    const tripRequest: Partial<TripRequest> = {
        ...(uiStateCode && { stateCode: uiStateCode }),
        ...(locations.cityIds.length > 0 && { selectedCityIds: locations.cityIds }),
        ...(duration && { duration: duration.value }),
        ...(inferredBudget && { budget: inferredBudget }),
        ...(inferredStyle && { travelStyle: inferredStyle }),
        constraints: {
            maxTravelHoursPerDay: constraints.seniorFriendly ? 4 : 6,
            seniorFriendly: constraints.seniorFriendly || false,
            morningReligious: constraints.morningReligious || false,
            noNightTravel: constraints.noNightTravel ?? true,
        },
    };

    const confidence: Record<string, number> = {
        duration: duration?.confidence || 0,
        budget: budget?.confidence || (inferredBudget ? 0.7 : 0),
        style: style?.confidence || (inferredStyle ? 0.7 : 0),
        location: locations.confidence,
        constraints: constraintRaw.length > 0 ? 0.9 : 0,
    };

    // Get suggestions based on detected interests + locations
    const suggestions = suggestTrips(interests.length > 0 ? interests : ['heritage', 'nature']);

    return {
        tripRequest,
        confidence,
        suggestions: suggestions.slice(0, 3),
        detectedEntities: {
            duration: duration?.raw,
            budget: budget?.raw || (inferredBudget || undefined),
            style: style?.raw || (inferredStyle || undefined),
            locations: locations.rawLocations,
            constraints: constraintRaw,
            interests,
        },
    };
}

// ─── Curated Trip Ideas ───────────────────────────────────────────

const TRIP_IDEAS: TripSuggestion[] = [
    {
        title: 'Heritage Rajasthan: Forts & Palaces',
        description: 'Explore the grandeur of Rajput architecture through magnificent forts and ornate palaces across the Land of Kings.',
        stateCode: 'RJ',
        cityIds: ['jaipur', 'jodhpur', 'udaipur'],
        duration: 7,
        budget: 'standard',
        highlights: ['Amber Fort', 'Mehrangarh Fort', 'City Palace Udaipur', 'Hawa Mahal'],
        imageUrl: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&h=400&fit=crop',
        tags: ['heritage', 'culture', 'photography', 'family'],
    },
    {
        title: 'Spiritual Varanasi & Mathura',
        description: 'Immerse in the spiritual heartbeat of India — from the sacred ghats of Varanasi to the birthplace of Lord Krishna.',
        stateCode: 'UP',
        cityIds: ['varanasi', 'mathura'],
        duration: 5,
        budget: 'budget',
        highlights: ['Ganga Aarti', 'Kashi Vishwanath', 'Krishna Janmabhoomi', 'Sarnath'],
        imageUrl: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=600&h=400&fit=crop',
        tags: ['spiritual', 'heritage', 'culture'],
    },
    {
        title: 'Backwaters & Spices of Kerala',
        description: 'Cruise through palm-fringed backwaters, trek misty tea gardens, and savor the flavours of God\'s Own Country.',
        stateCode: 'KL',
        cityIds: ['kochi', 'alleppey', 'munnar'],
        duration: 6,
        budget: 'standard',
        highlights: ['Houseboat Cruise', 'Tea Museum', 'Fort Kochi', 'Chinese Fishing Nets'],
        imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&h=400&fit=crop',
        tags: ['nature', 'honeymoon', 'food', 'beach'],
    },
    {
        title: 'Desert Adventure: Jaisalmer & Jodhpur',
        description: 'Feel the golden sands under your feet with camel safaris, desert camps, and the magnificent Blue City.',
        stateCode: 'RJ',
        cityIds: ['jaisalmer', 'jodhpur'],
        duration: 4,
        budget: 'standard',
        highlights: ['Sam Sand Dunes', 'Jaisalmer Fort', 'Mehrangarh Fort', 'Desert Camping'],
        imageUrl: 'https://images.unsplash.com/photo-1624806992066-5ffcf7ca186b?w=600&h=400&fit=crop',
        tags: ['desert', 'adventure', 'photography', 'heritage'],
    },
    {
        title: 'Golden Triangle Sprint',
        description: 'India\'s most iconic circuit — the Taj Mahal, Jaipur\'s forts, and a taste of Mughal grandeur, packed tight.',
        stateCode: 'UP',
        cityIds: ['agra', 'jaipur'],
        duration: 5,
        budget: 'standard',
        highlights: ['Taj Mahal', 'Agra Fort', 'Amber Fort', 'Hawa Mahal'],
        imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&h=400&fit=crop',
        tags: ['heritage', 'culture', 'photography', 'family'],
    },
    {
        title: 'Royal Honeymoon in Udaipur',
        description: 'Romance amid lakes, palaces, and sunset boat rides in India\'s most romantic city.',
        stateCode: 'RJ',
        cityIds: ['udaipur'],
        duration: 4,
        budget: 'premium',
        highlights: ['Lake Pichola Boat Ride', 'City Palace', 'Saheliyon Ki Bari', 'Lakeside Dining'],
        imageUrl: 'https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=600&h=400&fit=crop',
        tags: ['honeymoon', 'nature', 'food'],
    },
    {
        title: 'Sacred Gujarat Pilgrimage',
        description: 'Visit the holy shrines of Somnath and Dwarka, India\'s timeless pilgrimage destinations on the western coast.',
        stateCode: 'GJ',
        cityIds: ['dwarka', 'somnath', 'ahmedabad'],
        duration: 5,
        budget: 'budget',
        highlights: ['Somnath Temple', 'Dwarkadhish Temple', 'Sabarmati Ashram', 'Nageshwar Jyotirlinga'],
        imageUrl: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=600&h=400&fit=crop',
        tags: ['spiritual', 'heritage', 'culture'],
    },
    {
        title: 'Temples of Madhya Pradesh',
        description: 'Discover UNESCO-listed Khajuraho sculptures, the Mahakaleshwar jyotirlinga, and medieval Orchha.',
        stateCode: 'MP',
        cityIds: ['khajuraho', 'ujjain', 'orchha'],
        duration: 6,
        budget: 'budget',
        highlights: ['Western Group of Temples', 'Mahakaleshwar Temple', 'Orchha Fort', 'Sanchi Stupa'],
        imageUrl: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600&h=400&fit=crop',
        tags: ['heritage', 'spiritual', 'culture', 'photography'],
    },
    {
        title: 'Mughal Trail: Agra & Lucknow',
        description: 'Walk through the grandest chapters of Mughal history — from the Taj to Lucknow\'s Nawabi heritage.',
        stateCode: 'UP',
        cityIds: ['agra', 'lucknow'],
        duration: 5,
        budget: 'standard',
        highlights: ['Taj Mahal', 'Agra Fort', 'Bara Imambara', 'Tunday Kababi'],
        imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&h=400&fit=crop',
        tags: ['heritage', 'culture', 'food'],
    },
    {
        title: 'Beach Bliss: Goa Getaway',
        description: 'Sun, sand, seafood, and colonial charm — the perfect laid-back coastal escape.',
        stateCode: 'GA',
        cityIds: ['north_goa', 'old_goa'],
        duration: 4,
        budget: 'standard',
        highlights: ['Calangute Beach', 'Basilica of Bom Jesus', 'Water Sports', 'Night Markets'],
        imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&h=400&fit=crop',
        tags: ['beach', 'adventure', 'food', 'honeymoon'],
    },
];

export function suggestTrips(interests: string[]): TripSuggestion[] {
    if (!interests || interests.length === 0) return TRIP_IDEAS;

    const lowerInterests = interests.map(i => i.toLowerCase());

    // Score each idea by how many tags match the interests
    const scored = TRIP_IDEAS.map(idea => {
        const matchCount = idea.tags.filter(tag => lowerInterests.includes(tag)).length;
        return { idea, score: matchCount };
    });

    // Sort by score descending, then filter those with at least 1 match
    scored.sort((a, b) => b.score - a.score);

    const matched = scored.filter(s => s.score > 0).map(s => s.idea);
    return matched.length > 0 ? matched : TRIP_IDEAS.slice(0, 5);
}
