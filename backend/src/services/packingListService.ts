import { getClothingRecommendations } from './pdfService';

// Types
export interface Item {
    name: string;
    icon: string;
    reason: string;
    priority: 'must-have' | 'recommended' | 'optional';
}

export interface PackingList {
    essentials: Item[];
    clothing: Item[];
    accessories: Item[];
    documents: Item[];
    healthKit: Item[];
    extras: Item[];
}

interface TripResult {
    itinerary: {
        day: number;
        city: string;
        activities: { name: string; type: string; tags?: string[] }[];
    }[];
    summary: {
        totalCost: number;
        totalDistance: number;
        feasibility: string;
    };
}

interface Constraints {
    maxTravelHoursPerDay?: number;
    seniorFriendly?: boolean;
    morningReligious?: boolean;
    noNightTravel?: boolean;
}

/**
 * Generate a smart packing list based on trip activities, season, constraints, and budget.
 */
export function generatePackingList(
    tripResult: TripResult,
    month: number,
    constraints?: Constraints,
    budget?: string
): PackingList {
    // Collect unique activity types and tags across the entire trip
    const activityTypes = new Set<string>();
    const activityTags = new Set<string>();

    for (const day of tripResult.itinerary) {
        for (const act of day.activities || []) {
            if (act.type) activityTypes.add(act.type.toLowerCase());
            if (act.tags) {
                for (const tag of act.tags) activityTags.add(tag.toLowerCase());
            }
        }
    }

    const essentials = buildEssentials();
    const clothing = buildClothing(month, activityTypes, activityTags, constraints);
    const accessories = buildAccessories(activityTypes, activityTags, month);
    const documents = buildDocuments();
    const healthKit = buildHealthKit(constraints, activityTypes);
    const extras = buildExtras(budget, constraints, activityTypes);

    return { essentials, clothing, accessories, documents, healthKit, extras };
}

// ─── Essentials (always included) ───
function buildEssentials(): Item[] {
    return [
        { name: 'Phone Charger & Power Bank', icon: '🔌', reason: 'Stay connected and navigate on the go', priority: 'must-have' },
        { name: 'Water Bottle (Reusable)', icon: '💧', reason: 'Stay hydrated — tap water not safe in most areas', priority: 'must-have' },
        { name: 'Cash (₹) & Cards', icon: '💵', reason: 'Many street vendors and small shops are cash-only', priority: 'must-have' },
        { name: 'Snacks for Travel', icon: '🍪', reason: 'Useful for long journeys between cities', priority: 'recommended' },
        { name: 'Reusable Bag / Daypack', icon: '🎒', reason: 'Carry essentials while sightseeing', priority: 'recommended' },
        { name: 'Travel Adapter (if international)', icon: '🔌', reason: 'India uses Type C/D/M sockets', priority: 'recommended' },
    ];
}

// ─── Clothing ───
function buildClothing(
    month: number,
    activityTypes: Set<string>,
    activityTags: Set<string>,
    constraints?: Constraints
): Item[] {
    const items: Item[] = [];

    // Seasonal clothing from existing pdfService logic
    const seasonal = getClothingRecommendations(month);
    for (const rec of seasonal) {
        items.push({
            name: rec.item,
            icon: rec.icon,
            reason: getSeasonReason(month),
            priority: 'must-have',
        });
    }

    // Activity-based clothing
    const hasTemple = activityTypes.has('temple') || activityTypes.has('religious') || activityTags.has('religious');
    const hasDesert = activityTypes.has('desert') || activityTags.has('desert');
    const hasWildlife = activityTypes.has('wildlife') || activityTags.has('wildlife');
    const hasLake = activityTypes.has('lake') || activityTags.has('lake');

    if (hasTemple) {
        items.push(
            { name: 'Modest Clothing (covers shoulders & knees)', icon: '👗', reason: 'Required for temple & religious site entry', priority: 'must-have' },
            { name: 'Head Covering / Scarf', icon: '🧕', reason: 'Needed at gurudwaras, mosques, and some temples', priority: 'recommended' },
        );
    }

    if (hasDesert) {
        items.push(
            { name: 'Light Scarf / Shemagh', icon: '🧣', reason: 'Protects from sand and sun during desert safari', priority: 'must-have' },
        );
    }

    if (hasWildlife) {
        items.push(
            { name: 'Earth-tone Clothes', icon: '🟤', reason: 'Blend with surroundings on wildlife safaris — avoid bright colours', priority: 'recommended' },
        );
    }

    if (hasLake) {
        items.push(
            { name: 'Swimwear / Quick-dry Shorts', icon: '🩳', reason: 'Useful for lake-side activities and boating', priority: 'optional' },
        );
    }

    if (constraints?.seniorFriendly) {
        items.push(
            { name: 'Comfortable Walking Shoes (ortho-friendly)', icon: '👟', reason: 'Essential for senior-friendly pace with lots of walking', priority: 'must-have' },
        );
    }

    return deduplicateItems(items);
}

// ─── Accessories ───
function buildAccessories(
    activityTypes: Set<string>,
    activityTags: Set<string>,
    month: number
): Item[] {
    const items: Item[] = [];

    // Universal
    items.push(
        { name: 'Sunscreen (SPF 50+)', icon: '🧴', reason: 'Strong Indian sun — essential year-round', priority: 'must-have' },
        { name: 'Travel Lock', icon: '🔒', reason: 'Secure your luggage during transit', priority: 'recommended' },
    );

    const isSummer = month >= 2 && month <= 5;
    const hasDesert = activityTypes.has('desert') || activityTags.has('desert');

    if (isSummer || hasDesert) {
        items.push(
            { name: 'Sunglasses (UV-protected)', icon: '🕶️', reason: 'Protect eyes from harsh sun and desert glare', priority: 'must-have' },
        );
    }

    if (hasDesert) {
        items.push(
            { name: 'Dust Mask / Bandana', icon: '😷', reason: 'Protection from sand during desert safaris', priority: 'recommended' },
        );
    }

    const hasWildlife = activityTypes.has('wildlife') || activityTags.has('wildlife');
    if (hasWildlife) {
        items.push(
            { name: 'Binoculars', icon: '🔭', reason: 'Spot wildlife from a distance on safari', priority: 'recommended' },
            { name: 'Mosquito Repellent', icon: '🦟', reason: 'Wildlife areas often have mosquitoes', priority: 'must-have' },
        );
    }

    const hasFort = activityTypes.has('fort') || activityTags.has('fort');
    const hasPalace = activityTypes.has('palace') || activityTags.has('palace');
    const hasMuseum = activityTypes.has('museum') || activityTags.has('museum');
    if (hasFort || hasPalace || hasMuseum) {
        items.push(
            { name: 'Camera / Extra Storage', icon: '📸', reason: 'Capture magnificent forts, palaces & museums', priority: 'recommended' },
        );
    }

    const hasMarket = activityTypes.has('market') || activityTags.has('market');
    if (hasMarket) {
        items.push(
            { name: 'Small Change / Coins', icon: '🪙', reason: 'Handy for bargaining in local markets', priority: 'optional' },
        );
    }

    return items;
}

// ─── Documents ───
function buildDocuments(): Item[] {
    return [
        { name: 'Passport / Government ID (Aadhaar / Voter ID)', icon: '🪪', reason: 'Required for hotel check-in and monument entry', priority: 'must-have' },
        { name: 'Printed / Digital Itinerary', icon: '📋', reason: 'Quick reference — not all areas have internet', priority: 'recommended' },
        { name: 'Travel Insurance Documents', icon: '📄', reason: 'Peace of mind for medical emergencies and trip issues', priority: 'recommended' },
        { name: 'Hotel Booking Confirmations', icon: '🏨', reason: 'Required at check-in', priority: 'must-have' },
        { name: 'Emergency Contact List', icon: '📞', reason: 'Keep local emergency numbers and embassy contacts', priority: 'recommended' },
    ];
}

// ─── Health Kit ───
function buildHealthKit(constraints?: Constraints, activityTypes?: Set<string>): Item[] {
    const items: Item[] = [
        { name: 'First Aid Basics (bandages, antiseptic)', icon: '🩹', reason: 'Minor cuts and scrapes during sightseeing', priority: 'must-have' },
        { name: 'ORS Packets / Electrolytes', icon: '💊', reason: 'Combat dehydration — common in Indian heat', priority: 'must-have' },
        { name: 'Stomach Medicine (Imodium, antacid)', icon: '💊', reason: 'Adjusting to new cuisine can be hard on the stomach', priority: 'recommended' },
        { name: 'Insect Repellent Cream', icon: '🧴', reason: 'Mosquitoes are prevalent in many regions', priority: 'recommended' },
        { name: 'Hand Sanitizer', icon: '🧴', reason: 'Not all places have soap — hygiene on the go', priority: 'must-have' },
    ];

    if (constraints?.seniorFriendly) {
        items.push(
            { name: 'Personal Medications (full supply)', icon: '💊', reason: 'Carry enough for entire trip — pharmacies may not stock all brands', priority: 'must-have' },
            { name: 'Walking Stick / Cane', icon: '🦯', reason: 'Many heritage sites have uneven terrain and steps', priority: 'recommended' },
            { name: 'Knee Support / Brace', icon: '🦵', reason: 'Helpful for fort climbs and temple stairs', priority: 'optional' },
        );
    }

    const hasWildlife = activityTypes?.has('wildlife') || activityTypes?.has('park');
    if (hasWildlife) {
        items.push(
            { name: 'Anti-malaria Tablets', icon: '💊', reason: 'Precaution for wildlife and forested areas', priority: 'optional' },
        );
    }

    return items;
}

// ─── Extras (budget & constraint-based) ───
function buildExtras(
    budget?: string,
    constraints?: Constraints,
    activityTypes?: Set<string>
): Item[] {
    const items: Item[] = [];

    if (budget === 'budget') {
        items.push(
            { name: 'Padlock for Hostel Lockers', icon: '🔐', reason: 'Budget hostels often provide lockers but not locks', priority: 'must-have' },
            { name: 'Travel Towel (quick-dry)', icon: '🏖️', reason: 'Budget stays may not always provide clean towels', priority: 'recommended' },
            { name: 'Earplugs & Eye Mask', icon: '😴', reason: 'Shared dorms can be noisy', priority: 'recommended' },
        );
    }

    if (budget === 'premium') {
        items.push(
            { name: 'Formal Dinner Attire', icon: '👔', reason: 'Some heritage hotels and fine-dining restaurants have dress codes', priority: 'recommended' },
            { name: 'Light Blazer / Shawl', icon: '🧥', reason: 'Evening events at premium venues', priority: 'optional' },
        );
    }

    if (constraints?.morningReligious) {
        items.push(
            { name: 'Prayer Items / Religious Offerings', icon: '🙏', reason: 'For morning temple and religious ceremonies', priority: 'recommended' },
            { name: 'Small Towel for Ablutions', icon: '🧻', reason: 'Needed at gurudwaras and some temples', priority: 'optional' },
        );
    }

    // General extras
    items.push(
        { name: 'Ziplock Bags', icon: '🏷️', reason: 'Keep electronics dry and organise small items', priority: 'optional' },
        { name: 'Notebook & Pen', icon: '📝', reason: 'Jot down memories, directions, and local tips', priority: 'optional' },
    );

    return items;
}

// ─── Helpers ───
function getSeasonReason(month: number): string {
    if (month >= 10 || month <= 1) return 'Winter season — temperatures can drop significantly, especially at night';
    if (month >= 2 && month <= 4) return 'Summer season — expect high temperatures and intense sun';
    if (month >= 5 && month <= 8) return 'Monsoon season — heavy rains are likely';
    return 'Autumn season — pleasant but variable weather';
}

function deduplicateItems(items: Item[]): Item[] {
    const seen = new Set<string>();
    return items.filter(item => {
        const key = item.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
