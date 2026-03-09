// Comprehensive Database Seed Script
// Seeds ALL collections with natural, inter-related data
// Run: npm run seed:full  (or: npx ts-node src/scripts/seedFullDatabase.ts)

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// ---------- Models ----------
import User from '../models/User';
import SavedTrip from '../models/SavedTrip';
import TripGroup from '../models/TripGroup';
import JournalEntry from '../models/JournalEntry';
import Review from '../models/Review';
import FavoritePlace from '../models/FavoritePlace';
import Expense from '../models/Expense';
import Notification from '../models/Notification';
import Postcard from '../models/Postcard';
import TravelChecklist from '../models/TravelChecklist';
import SharedTrip from '../models/SharedTrip';
import ContactQuery from '../models/ContactQuery';
import GroupItineraryRequest from '../models/GroupItineraryRequest';
import Package from '../models/Package';
import Place from '../models/Place';
import City from '../models/City';
import Hotel from '../models/Hotel';
import Restaurant from '../models/Restaurant';
import Festival from '../models/Festival';
import Route from '../models/Route';

// ═════════════════════════════════════════════════════
//  HELPER UTILITIES
// ═════════════════════════════════════════════════════

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(n, arr.length));
}
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function daysAgo(d: number) { return new Date(Date.now() - d * 86400000); }
function formatDate(d: Date) { return d.toISOString().split('T')[0]; }

// ═════════════════════════════════════════════════════
//  USERS — 12 natural Indian users + 2 admins
// ═════════════════════════════════════════════════════

const USERS = [
    // Admins
    { name: 'Krish Bavadiya', email: 'krish@krishbavadiya.store', role: 'admin', interests: ['heritage', 'photography', 'street-food'], provider: 'local' },
    { name: 'Ananya Sharma', email: 'ananya@krishbavadiya.store', role: 'admin', interests: ['architecture', 'history', 'museums'], provider: 'local' },
    // Regular users
    { name: 'Ravi Patel', email: 'ravi@krishbavadiya.store', role: 'user', interests: ['adventure', 'trekking', 'nature'], provider: 'local' },
    { name: 'Priya Mehta', email: 'priya@krishbavadiya.store', role: 'user', interests: ['temples', 'heritage', 'vegetarian-food'], provider: 'local' },
    { name: 'Arjun Reddy', email: 'arjun@krishbavadiya.store', role: 'user', interests: ['photography', 'wildlife', 'camping'], provider: 'local' },
    { name: 'Sneha Iyer', email: 'sneha@krishbavadiya.store', role: 'user', interests: ['art', 'culture', 'museums', 'cafes'], provider: 'local' },
    { name: 'Vikram Singh', email: 'vikram@krishbavadiya.store', role: 'user', interests: ['forts', 'desert', 'history'], provider: 'local' },
    { name: 'Neha Kapoor', email: 'neha@krishbavadiya.store', role: 'user', interests: ['beaches', 'nightlife', 'water-sports'], provider: 'local' },
    { name: 'Amit Joshi', email: 'amit@krishbavadiya.store', role: 'user', interests: ['budget-travel', 'trains', 'backpacking'], provider: 'local' },
    { name: 'Divya Nair', email: 'divya@krishbavadiya.store', role: 'user', interests: ['wellness', 'yoga', 'ayurveda', 'hill-stations'], provider: 'local' },
    { name: 'Rahul Gupta', email: 'rahul@krishbavadiya.store', role: 'user', interests: ['food', 'street-food', 'cooking', 'festivals'], provider: 'local' },
    { name: 'Meera Desai', email: 'meera@krishbavadiya.store', role: 'user', interests: ['palace', 'luxury', 'shopping', 'spa'], provider: 'google' },
    { name: 'Karthik Narayan', email: 'karthik@krishbavadiya.store', role: 'user', interests: ['mountains', 'trekking', 'camping'], provider: 'local' },
    { name: 'Ishita Bose', email: 'ishita@krishbavadiya.store', role: 'user', interests: ['culture', 'literature', 'heritage-walks'], provider: 'local' },
];

// ═════════════════════════════════════════════════════
//  CITIES (in existing seedDatabase.ts already)
// ═════════════════════════════════════════════════════

// We reuse cities from existing seed. Just listing city names for reference.
const CITY_NAMES = [
    'Jaipur', 'Udaipur', 'Jodhpur', 'Jaisalmer', 'Munnar', 'Alleppey', 'Kochi',
    'North Goa', 'Old Goa', 'Mumbai', 'Pune', 'Aurangabad', 'Chennai', 'Madurai',
    'Kolkata', 'Darjeeling', 'Bangalore', 'Mysore', 'Hampi', 'Ahmedabad', 'Kutch',
    'Kevadia', 'Agra', 'Varanasi', 'Delhi', 'Srinagar', 'Gulmarg', 'Pahalgam',
    'Leh', 'Nubra Valley', 'Pangong Lake', 'Shimla', 'Manali', 'Dharamshala',
    'Kasol', 'Amritsar', 'Chandigarh', 'Hyderabad', 'Rishikesh', 'Haridwar',
    'Nainital', 'Mussoorie',
];

// ═════════════════════════════════════════════════════
//  HOTELS
// ═════════════════════════════════════════════════════

const HOTELS_DATA = [
    // Jaipur
    { name: 'Pearl Palace Heritage', cityName: 'Jaipur', stateCode: 'RAJASTHAN', coordinates: { lat: 26.9110, lng: 75.7910 }, tier: 'budget', pricePerNight: 1800, rating: 4.3, amenities: ['wifi', 'restaurant', 'parking'], description: 'Charming heritage homestay near Hawa Mahal with rooftop restaurant.' },
    { name: 'Hotel Sarang Palace', cityName: 'Jaipur', stateCode: 'RAJASTHAN', coordinates: { lat: 26.9150, lng: 75.7890 }, tier: 'standard', pricePerNight: 3500, rating: 4.1, amenities: ['wifi', 'pool', 'restaurant', 'spa'], description: 'Mid-range palace hotel with courtyard pool and traditional decor.' },
    { name: 'Rambagh Palace', cityName: 'Jaipur', stateCode: 'RAJASTHAN', coordinates: { lat: 26.8983, lng: 75.8050 }, tier: 'premium', pricePerNight: 28000, rating: 4.9, amenities: ['wifi', 'pool', 'spa', 'gym', 'restaurant', 'bar'], description: 'Former royal residence, one of India\'s finest luxury hotels.' },
    // Udaipur
    { name: 'Zostel Udaipur', cityName: 'Udaipur', stateCode: 'RAJASTHAN', coordinates: { lat: 24.5830, lng: 73.6810 }, tier: 'budget', pricePerNight: 800, rating: 4.0, amenities: ['wifi', 'cafe', 'common-area'], description: 'Popular backpacker hostel with lake views and chill vibes.' },
    { name: 'Hotel Lakend', cityName: 'Udaipur', stateCode: 'RAJASTHAN', coordinates: { lat: 24.5780, lng: 73.6790 }, tier: 'standard', pricePerNight: 4800, rating: 4.4, amenities: ['wifi', 'pool', 'restaurant', 'spa'], description: 'Lakeside hotel with stunning panoramic views of Lake Fateh Sagar.' },
    { name: 'Taj Lake Palace', cityName: 'Udaipur', stateCode: 'RAJASTHAN', coordinates: { lat: 24.5733, lng: 73.6808 }, tier: 'premium', pricePerNight: 45000, rating: 4.9, amenities: ['wifi', 'pool', 'spa', 'gym', 'restaurant', 'bar', 'butler'], description: 'Floating marble palace on Lake Pichola, iconic luxury experience.' },
    // Jodhpur
    { name: 'Moustache Hostel Jodhpur', cityName: 'Jodhpur', stateCode: 'RAJASTHAN', coordinates: { lat: 26.2970, lng: 73.0180 }, tier: 'budget', pricePerNight: 700, rating: 4.2, amenities: ['wifi', 'cafe', 'rooftop'], description: 'Vibrant hostel in Blue City with fort views from rooftop.' },
    { name: 'Raas Jodhpur', cityName: 'Jodhpur', stateCode: 'RAJASTHAN', coordinates: { lat: 26.2985, lng: 73.0195 }, tier: 'premium', pricePerNight: 15000, rating: 4.7, amenities: ['wifi', 'pool', 'spa', 'restaurant', 'bar'], description: 'Boutique luxury hotel at the base of Mehrangarh Fort.' },
    // Goa
    { name: 'Pappi Chulo Hostel', cityName: 'North Goa', stateCode: 'GOA', coordinates: { lat: 15.5500, lng: 73.7500 }, tier: 'budget', pricePerNight: 900, rating: 4.1, amenities: ['wifi', 'bar', 'pool', 'common-area'], description: 'Party hostel near Anjuna beach with pool and bar.' },
    { name: 'Taj Fort Aguada', cityName: 'North Goa', stateCode: 'GOA', coordinates: { lat: 15.4920, lng: 73.7730 }, tier: 'premium', pricePerNight: 18000, rating: 4.6, amenities: ['wifi', 'pool', 'spa', 'gym', 'beach-access', 'restaurant'], description: 'Sprawling resort built around a Portuguese fort overlooking the Arabian Sea.' },
    // Kerala
    { name: 'Greenex Farms Munnar', cityName: 'Munnar', stateCode: 'KERALA', coordinates: { lat: 10.0850, lng: 77.0580 }, tier: 'budget', pricePerNight: 1500, rating: 4.3, amenities: ['wifi', 'restaurant', 'garden'], description: 'Eco-friendly farm stay surrounded by tea plantations.' },
    { name: 'Spice Tree Munnar', cityName: 'Munnar', stateCode: 'KERALA', coordinates: { lat: 10.0800, lng: 77.0620 }, tier: 'premium', pricePerNight: 12000, rating: 4.7, amenities: ['wifi', 'pool', 'spa', 'restaurant', 'nature-walks'], description: 'Boutique resort perched on a hilltop with infinity pool overlooking the Western Ghats.' },
    // Delhi & Agra
    { name: 'Madpackers Delhi', cityName: 'Delhi', stateCode: 'DELHI', coordinates: { lat: 28.6333, lng: 77.2167 }, tier: 'budget', pricePerNight: 800, rating: 4.0, amenities: ['wifi', 'cafe', 'lounge'], description: 'Award-winning hostel in the heart of New Delhi near Connaught Place.' },
    { name: 'The Oberoi New Delhi', cityName: 'Delhi', stateCode: 'DELHI', coordinates: { lat: 28.5980, lng: 77.2300 }, tier: 'premium', pricePerNight: 22000, rating: 4.8, amenities: ['wifi', 'pool', 'spa', 'gym', 'restaurant', 'bar'], description: 'Legendary 5-star overlooking the Delhi Golf Club greens.' },
    { name: 'Hotel Sidhartha Agra', cityName: 'Agra', stateCode: 'UTTAR_PRAD', coordinates: { lat: 27.1750, lng: 78.0400 }, tier: 'standard', pricePerNight: 2800, rating: 4.0, amenities: ['wifi', 'restaurant', 'rooftop'], description: 'Comfortable hotel with Taj Mahal views from rooftop restaurant.' },
    // Varanasi
    { name: 'Stops Hostel Varanasi', cityName: 'Varanasi', stateCode: 'UTTAR_PRAD', coordinates: { lat: 25.3176, lng: 83.0100 }, tier: 'budget', pricePerNight: 600, rating: 4.1, amenities: ['wifi', 'rooftop', 'cafe'], description: 'Backpacker hostel near Dashashwamedh Ghat with rooftop yoga.' },
    // Shimla & Manali
    { name: 'Hostel Triangle Manali', cityName: 'Manali', stateCode: 'HIMACHAL_P', coordinates: { lat: 32.2396, lng: 77.1887 }, tier: 'budget', pricePerNight: 700, rating: 4.2, amenities: ['wifi', 'cafe', 'bonfire'], description: 'Cozy mountain hostel with bonfire nights and trekking tours.' },
    { name: 'The Himalayan Shimla', cityName: 'Shimla', stateCode: 'HIMACHAL_P', coordinates: { lat: 31.1048, lng: 77.1734 }, tier: 'standard', pricePerNight: 4500, rating: 4.4, amenities: ['wifi', 'restaurant', 'spa', 'parking'], description: 'Heritage property on Mall Road with panoramic mountain views.' },
    // Mumbai
    { name: 'Bombay Backpackers', cityName: 'Mumbai', stateCode: 'MAHARASHTR', coordinates: { lat: 18.9500, lng: 72.8300 }, tier: 'budget', pricePerNight: 1000, rating: 3.9, amenities: ['wifi', 'cafe', 'common-area'], description: 'Social hostel in Bandra with walking tours of Mumbai.' },
    { name: 'Taj Mahal Palace Mumbai', cityName: 'Mumbai', stateCode: 'MAHARASHTR', coordinates: { lat: 18.9217, lng: 72.8332 }, tier: 'premium', pricePerNight: 30000, rating: 4.9, amenities: ['wifi', 'pool', 'spa', 'gym', 'restaurant', 'bar', 'butler'], description: 'Iconic luxury hotel at the Gateway of India, a Mumbai landmark since 1903.' },
];

// ═════════════════════════════════════════════════════
//  RESTAURANTS
// ═════════════════════════════════════════════════════

const RESTAURANTS_DATA = [
    // Jaipur
    { name: 'Lassiwala', cityName: 'Jaipur', cuisine: ['North Indian', 'Beverages'], type: 'street-food', priceRange: 'budget', averageCost: 50, rating: 4.5, mustTry: ['Famous Lassi', 'Malai Lassi'], coordinates: { lat: 26.9200, lng: 75.7920 }, openingTime: '08:00', closingTime: '22:00', vegetarian: true, description: 'The legendary lassi shop on MI Road — a Jaipur institution since 1944.' },
    { name: 'Suvarna Mahal', cityName: 'Jaipur', cuisine: ['Rajasthani', 'North Indian', 'Continental'], type: 'fine-dining', priceRange: 'expensive', averageCost: 3500, rating: 4.7, mustTry: ['Laal Maas', 'Dal Baati Churma'], coordinates: { lat: 26.8983, lng: 75.8050 }, openingTime: '19:00', closingTime: '23:00', vegetarian: false, description: 'Fine dining in the Rambagh Palace with hand-painted ceilings and royal ambiance.' },
    { name: 'Tapri Central', cityName: 'Jaipur', cuisine: ['Cafe', 'Snacks'], type: 'cafe', priceRange: 'budget', averageCost: 200, rating: 4.3, mustTry: ['Bun Maska', 'Chai'], coordinates: { lat: 26.9100, lng: 75.7850 }, openingTime: '07:00', closingTime: '23:00', vegetarian: true, description: 'Iconic chai cafe with multiple branches, a meeting point for Jaipur\'s youth.' },
    // Udaipur
    { name: 'Ambrai Restaurant', cityName: 'Udaipur', cuisine: ['Indian', 'Continental'], type: 'casual', priceRange: 'moderate', averageCost: 800, rating: 4.6, mustTry: ['Paneer Tikka', 'Lake View Thali'], coordinates: { lat: 24.5750, lng: 73.6820 }, openingTime: '12:00', closingTime: '22:30', vegetarian: false, description: 'Lakeside dining with panoramic views of City Palace and Jag Mandir.' },
    // Goa
    { name: 'Thalassa', cityName: 'North Goa', cuisine: ['Greek', 'Mediterranean'], type: 'casual', priceRange: 'moderate', averageCost: 1200, rating: 4.5, mustTry: ['Moussaka', 'Grilled Prawns'], coordinates: { lat: 15.6050, lng: 73.7410 }, openingTime: '12:00', closingTime: '23:00', vegetarian: false, description: 'Clifftop Greek restaurant in Vagator with breathtaking sunset views.' },
    { name: 'Vinayak Family Restaurant', cityName: 'North Goa', cuisine: ['Goan', 'Indian'], type: 'dhaba', priceRange: 'budget', averageCost: 250, rating: 4.2, mustTry: ['Fish Thali', 'Prawn Curry'], coordinates: { lat: 15.5400, lng: 73.7550 }, openingTime: '11:00', closingTime: '22:00', vegetarian: false, description: 'Local favourite for authentic Goan fish curry rice at honest prices.' },
    // Mumbai
    { name: 'Bademiya', cityName: 'Mumbai', cuisine: ['Mughlai', 'Kebabs'], type: 'street-food', priceRange: 'budget', averageCost: 300, rating: 4.3, mustTry: ['Seekh Kebab Roll', 'Chicken Tikka'], coordinates: { lat: 18.9260, lng: 72.8310 }, openingTime: '19:00', closingTime: '04:00', vegetarian: false, description: 'Iconic late-night kebab street stall behind Taj Hotel, a Mumbai legend.' },
    { name: 'Leopold Cafe', cityName: 'Mumbai', cuisine: ['Multi-cuisine', 'Continental'], type: 'cafe', priceRange: 'moderate', averageCost: 700, rating: 4.1, mustTry: ['Chicken Sizzler', 'Cold Coffee'], coordinates: { lat: 18.9230, lng: 72.8330 }, openingTime: '08:00', closingTime: '01:00', vegetarian: false, description: 'Historic Colaba cafe since 1871, immortalized in Shantaram.' },
    // Delhi
    { name: 'Paranthe Wali Gali', cityName: 'Delhi', cuisine: ['North Indian', 'Street Food'], type: 'street-food', priceRange: 'budget', averageCost: 150, rating: 4.4, mustTry: ['Aloo Parantha', 'Rabri'], coordinates: { lat: 28.6562, lng: 77.2300 }, openingTime: '09:00', closingTime: '22:00', vegetarian: true, description: 'Famous parantha lane in Old Delhi serving 50+ varieties since 1872.' },
    { name: 'Indian Accent', cityName: 'Delhi', cuisine: ['Modern Indian', 'Fusion'], type: 'fine-dining', priceRange: 'expensive', averageCost: 5000, rating: 4.8, mustTry: ['Daulat Ki Chaat', 'Meetha Achaar Pork Ribs'], coordinates: { lat: 28.5830, lng: 77.2050 }, openingTime: '12:00', closingTime: '23:00', vegetarian: false, description: 'Asia\'s best restaurant, reinventing Indian cuisine with global techniques.' },
    // Varanasi
    { name: 'Blue Lassi Shop', cityName: 'Varanasi', cuisine: ['Beverages', 'Desserts'], type: 'street-food', priceRange: 'budget', averageCost: 80, rating: 4.6, mustTry: ['Pomegranate Lassi', 'Mango Lassi'], coordinates: { lat: 25.3100, lng: 83.0120 }, openingTime: '07:00', closingTime: '22:00', vegetarian: true, description: 'Tiny legendary lassi shop in the narrow lanes near Kashi Vishwanath.' },
    // Kolkata
    { name: 'Peter Cat', cityName: 'Kolkata', cuisine: ['Indian', 'Continental'], type: 'casual', priceRange: 'moderate', averageCost: 600, rating: 4.3, mustTry: ['Chelo Kebab', 'Mutton Biryani'], coordinates: { lat: 22.5539, lng: 88.3519 }, openingTime: '11:00', closingTime: '23:00', vegetarian: false, description: 'Legendary Park Street restaurant famous for its signature Chelo Kebab since 1960.' },
    // Amritsar
    { name: 'Bharawan Da Dhaba', cityName: 'Amritsar', cuisine: ['Punjabi', 'North Indian'], type: 'dhaba', priceRange: 'budget', averageCost: 200, rating: 4.5, mustTry: ['Amritsari Kulcha', 'Chhole', 'Lassi'], coordinates: { lat: 31.6340, lng: 74.8723 }, openingTime: '08:00', closingTime: '23:00', vegetarian: true, description: 'Iconic dhaba near Golden Temple serving the best Amritsari kulchas.' },
    // Hyderabad
    { name: 'Paradise Biryani', cityName: 'Hyderabad', cuisine: ['Hyderabadi', 'Biryani'], type: 'casual', priceRange: 'moderate', averageCost: 400, rating: 4.4, mustTry: ['Hyderabadi Biryani', 'Double Ka Meetha'], coordinates: { lat: 17.4380, lng: 78.4740 }, openingTime: '11:00', closingTime: '23:00', vegetarian: false, description: 'The most famous biryani chain in Hyderabad, serving since 1953.' },
];

// ═════════════════════════════════════════════════════
//  FESTIVALS
// ═════════════════════════════════════════════════════

const FESTIVALS_DATA = [
    { name: 'Pushkar Camel Fair', cityName: 'Jaipur', stateCode: 'RAJASTHAN', month: 11, approximateDate: 'Nov 10-18', duration: 8, type: 'fair', description: 'World\'s largest camel fair with trading, races, and cultural performances in the desert town of Pushkar.', highlights: ['Camel races', 'Hot air balloon rides', 'Moustache competition', 'Night cultural shows'], impact: 'must-see', crowdLevel: 'extreme', travelAdvisory: 'Book accommodation 3+ months in advance.' },
    { name: 'Jaipur Literature Festival', cityName: 'Jaipur', stateCode: 'RAJASTHAN', month: 1, approximateDate: 'Jan 23-27', duration: 5, type: 'cultural', description: 'The world\'s largest free literary festival, bringing together authors and thinkers.', highlights: ['Author talks', 'Poetry recitals', 'Book launches', 'Music evenings'], impact: 'worth-attending', crowdLevel: 'high' },
    { name: 'Mewar Festival', cityName: 'Udaipur', stateCode: 'RAJASTHAN', month: 3, approximateDate: 'Mar 25-27', duration: 3, type: 'cultural', description: 'Spring festival celebrating the arrival of spring with processions and cultural events around the lake city.', highlights: ['Gangaur procession', 'Boat race on Lake Pichola', 'Folk dances'], impact: 'worth-attending', crowdLevel: 'moderate' },
    { name: 'Desert Festival', cityName: 'Jaisalmer', stateCode: 'RAJASTHAN', month: 2, approximateDate: 'Feb 14-16', duration: 3, type: 'cultural', description: 'Vibrant festival in the golden dunes with folk music, dance, and camel polo.', highlights: ['Camel polo', 'Mr. Desert competition', 'Folk performances', 'Turban tying'], impact: 'must-see', crowdLevel: 'high' },
    { name: 'Onam', cityName: 'Kochi', stateCode: 'KERALA', month: 8, approximateDate: 'Aug 20-30', duration: 10, type: 'religious', description: 'Kerala\'s biggest festival celebrating the return of King Mahabali with boat races and flower carpets.', highlights: ['Vallamkali boat race', 'Pookalam flower carpet', 'Onam Sadhya feast', 'Kathakali dance'], impact: 'must-see', crowdLevel: 'extreme', travelAdvisory: 'Traffic congestion during boat races, plan travel accordingly.' },
    { name: 'Sunburn Festival', cityName: 'North Goa', stateCode: 'GOA', month: 12, approximateDate: 'Dec 28-30', duration: 3, type: 'music', description: 'Asia\'s largest electronic dance music festival held on the beaches of Goa.', highlights: ['International DJs', 'Beach stages', 'Food village', 'Art installations'], impact: 'worth-attending', crowdLevel: 'extreme', travelAdvisory: 'Goa hotel prices peak during this period.' },
    { name: 'Ganesh Chaturthi', cityName: 'Mumbai', stateCode: 'MAHARASHTR', month: 9, approximateDate: 'Sep 7-17', duration: 10, type: 'religious', description: 'Mumbai\'s grandest festival with massive Ganesh idols and lively processions through the streets.', highlights: ['Lalbaugcha Raja', 'Visarjan procession', 'Street food', 'Live music'], impact: 'must-see', crowdLevel: 'extreme', travelAdvisory: 'Major road closures during visarjan. Check routes in advance.' },
    { name: 'Durga Puja', cityName: 'Kolkata', stateCode: 'WEST_BENGA', month: 10, approximateDate: 'Oct 10-15', duration: 5, type: 'religious', description: 'Kolkata transforms into an open-air art gallery with thousands of ornate pandals celebrating Goddess Durga.', highlights: ['Pandal hopping', 'Dhunuchi dance', 'Sindoor khela', 'Street food'], impact: 'must-see', crowdLevel: 'extreme', travelAdvisory: 'BookRockets during Puja. Pandal hop by walking, not driving.' },
    { name: 'Golden Temple Langar', cityName: 'Amritsar', stateCode: 'PUNJAB', month: 4, approximateDate: 'Apr 14', duration: 1, type: 'religious', description: 'Baisakhi celebrations at the Golden Temple with special langar feeding 100,000+ devotees.', highlights: ['Special prayers', 'Nagar kirtan procession', 'Community langar', 'Light show'], impact: 'must-see', crowdLevel: 'extreme' },
    { name: 'Dev Deepawali', cityName: 'Varanasi', stateCode: 'UTTAR_PRAD', month: 11, approximateDate: 'Nov 15', duration: 1, type: 'religious', description: 'A million diyas (lamps) illuminate the ghats of Varanasi — the festival of lights of the gods.', highlights: ['Ghat illumination', 'Aarti ceremony', 'Floating diyas', 'Cultural performances'], impact: 'must-see', crowdLevel: 'extreme', travelAdvisory: 'Ghats extremely crowded. Arrive early for viewing spots.' },
    { name: 'International Yoga Festival', cityName: 'Rishikesh', stateCode: 'UTTARAKHAN', month: 3, approximateDate: 'Mar 1-7', duration: 7, type: 'cultural', description: 'Week-long yoga festival on the banks of the Ganges attracting practitioners from 100+ countries.', highlights: ['Yoga sessions', 'Meditation workshops', 'Ganga Aarti', 'Ayurveda talks'], impact: 'worth-attending', crowdLevel: 'moderate' },
    { name: 'Mysore Dasara', cityName: 'Mysore', stateCode: 'KARNATAKA', month: 10, approximateDate: 'Oct 3-12', duration: 10, type: 'cultural', description: 'Royal Dasara procession with the golden howdah elephant, illuminated palace, and cultural events.', highlights: ['Elephant procession', 'Palace illumination', 'Torchlight parade', 'Wrestling matches'], impact: 'must-see', crowdLevel: 'high' },
];

// ═════════════════════════════════════════════════════
//  PACKAGES
// ═════════════════════════════════════════════════════

const PACKAGES_DATA = [
    { id: 'rajasthan-royal-7d', title: 'Royal Rajasthan Circuit', state: 'RAJASTHAN', days: 7, price: 35000, description: 'Experience the royal heritage of Rajasthan — from the Pink City to the Golden City.', tags: ['heritage', 'forts', 'desert', 'popular'], cities: ['Jaipur', 'Jodhpur', 'Jaisalmer', 'Udaipur'], isActive: true },
    { id: 'kerala-backwaters-5d', title: 'Kerala Backwaters & Hills', state: 'KERALA', days: 5, price: 22000, description: 'From lush tea hills to serene backwater houseboats — the best of God\'s Own Country.', tags: ['nature', 'houseboat', 'hill-station', 'relaxing'], cities: ['Kochi', 'Munnar', 'Alleppey'], isActive: true },
    { id: 'goa-beach-4d', title: 'Goa Beach Getaway', state: 'GOA', days: 4, price: 15000, description: 'Sun, sand, and seafood — the perfect Goan beach vacation.', tags: ['beach', 'nightlife', 'food', 'water-sports'], cities: ['North Goa', 'Old Goa'], isActive: true },
    { id: 'golden-triangle-5d', title: 'Golden Triangle Classic', state: 'MULTI_STATE', days: 5, price: 25000, description: 'India\'s most iconic circuit connecting Delhi, Agra, and Jaipur.', tags: ['taj-mahal', 'heritage', 'must-visit', 'popular'], cities: ['Delhi', 'Agra', 'Jaipur'], isActive: true },
    { id: 'himachal-mountain-6d', title: 'Himachal Mountain Trail', state: 'HIMACHAL_P', days: 6, price: 20000, description: 'Snow-capped peaks, pine forests, and charming hill towns of Himachal Pradesh.', tags: ['mountains', 'adventure', 'nature', 'snow'], cities: ['Shimla', 'Manali', 'Kasol', 'Dharamshala'], isActive: true },
    { id: 'spiritual-varanasi-3d', title: 'Spiritual Varanasi & Rishikesh', state: 'MULTI_STATE', days: 3, price: 12000, description: 'A soul-stirring journey through India\'s holiest cities along the sacred Ganges.', tags: ['spiritual', 'heritage', 'yoga', 'ganges'], cities: ['Varanasi', 'Rishikesh'], isActive: true },
    { id: 'south-india-karnataka-5d', title: 'Karnataka Heritage Trail', state: 'KARNATAKA', days: 5, price: 18000, description: 'Ancient ruins, royal palaces, and modern garden city — the best of Karnataka.', tags: ['heritage', 'palace', 'ruins', 'culture'], cities: ['Bangalore', 'Mysore', 'Hampi'], isActive: true },
    { id: 'ladakh-adventure-8d', title: 'Ladakh Adventure Expedition', state: 'LADAKH', days: 8, price: 45000, description: 'High-altitude adventure through the land of high passes — Leh, Nubra, and Pangong.', tags: ['adventure', 'mountains', 'lakes', 'road-trip'], cities: ['Leh', 'Nubra Valley', 'Pangong Lake'], isActive: true },
    // Honeymoon packages
    { id: 'udaipur-honeymoon-4d', title: 'Udaipur Romantic Escape', state: 'RAJASTHAN', days: 4, price: 32000, description: 'A dreamy honeymoon by the lakes of Udaipur — boat rides, palace dinners, and sunset views.', tags: ['honeymoon', 'luxury', 'heritage'], cities: ['Udaipur'], isActive: true },
    { id: 'kashmir-honeymoon-6d', title: 'Kashmir Paradise Honeymoon', state: 'KASHMIR', days: 6, price: 40000, description: 'Shikara rides on Dal Lake, meadows of Gulmarg, and the valleys of Pahalgam — the ultimate honeymoon.', tags: ['honeymoon', 'nature', 'luxury'], cities: ['Srinagar', 'Gulmarg', 'Pahalgam'], isActive: true },
    { id: 'kerala-honeymoon-5d', title: 'Kerala Honeymoon Bliss', state: 'KERALA', days: 5, price: 30000, description: 'Houseboat romance in Alleppey, misty mornings in Munnar, and colonial charm of Kochi.', tags: ['honeymoon', 'nature', 'relaxation'], cities: ['Kochi', 'Munnar', 'Alleppey'], isActive: true },
    { id: 'goa-honeymoon-4d', title: 'Goa Romantic Getaway', state: 'GOA', days: 4, price: 22000, description: 'Beach sunsets, candlelight dinners, and heritage walks for the perfect Goan honeymoon.', tags: ['honeymoon', 'beaches', 'luxury'], cities: ['North Goa', 'Old Goa'], isActive: true },
    // Weekend Getaways
    { id: 'jaipur-weekend-2d', title: 'Jaipur Weekend Escape', state: 'RAJASTHAN', days: 2, price: 8000, description: 'A quick heritage fix — forts, palaces, and street food in the Pink City over a weekend.', tags: ['weekend getaways', 'heritage', 'culture'], cities: ['Jaipur'], isActive: true },
    { id: 'rishikesh-weekend-2d', title: 'Rishikesh Adventure Weekend', state: 'UTTARAKHAND', days: 2, price: 6000, description: 'White water rafting, yoga by the Ganges, and cafe hopping — the perfect adventure weekend.', tags: ['weekend getaways', 'adventure', 'nature'], cities: ['Rishikesh'], isActive: true },
    { id: 'agra-weekend-2d', title: 'Agra Taj Mahal Weekend', state: 'UTTAR_PRADESH', days: 2, price: 7000, description: 'See the Taj Mahal at sunrise, explore Agra Fort, and feast on Mughlai cuisine.', tags: ['weekend getaways', 'heritage', 'culture'], cities: ['Agra'], isActive: true },
    { id: 'nainital-weekend-2d', title: 'Nainital Lake Weekend', state: 'UTTARAKHAND', days: 2, price: 5500, description: 'Boating on Naini Lake, Mall Road strolls, and Snow View Point — a refreshing hill station escape.', tags: ['weekend getaways', 'nature', 'relaxation'], cities: ['Nainital'], isActive: true },
    // Wildlife & Nature
    { id: 'kaziranga-wildlife-4d', title: 'Kaziranga Rhino Safari', state: 'ASSAM', days: 4, price: 18000, description: 'Elephant and jeep safaris to spot the one-horned rhinoceros in UNESCO Kaziranga National Park.', tags: ['wildlife & nature', 'adventure', 'culture'], cities: ['Guwahati', 'Kaziranga'], isActive: true },
    { id: 'meghalaya-nature-5d', title: 'Meghalaya Living Root Bridges', state: 'MEGHALAYA', days: 5, price: 16000, description: 'Trek to living root bridges, see the wettest place on earth, and explore crystal-clear rivers.', tags: ['wildlife & nature', 'adventure', 'culture'], cities: ['Shillong', 'Cherrapunji'], isActive: true },
    { id: 'himachal-nature-5d', title: 'Himachal Valley & Peaks', state: 'HIMACHAL_P', days: 5, price: 15000, description: 'Snow-capped peaks, pine forests, and roaring rivers through Shimla, Manali, and the Solang Valley.', tags: ['wildlife & nature', 'adventure', 'nature'], cities: ['Shimla', 'Manali'], isActive: true },
    { id: 'kutch-rann-nature-4d', title: 'Rann of Kutch White Desert', state: 'GUJARAT', days: 4, price: 14000, description: 'Explore the vast white salt desert, colorful tribal villages, and the Asiatic wild ass sanctuary.', tags: ['wildlife & nature', 'culture', 'adventure'], cities: ['Kutch', 'Ahmedabad'], isActive: true },
];

// ═════════════════════════════════════════════════════
//  TRIP TEMPLATES (for SavedTrips)
// ═════════════════════════════════════════════════════

function buildTrip(title: string, cities: string[], duration: number, budget: 'budget' | 'standard' | 'premium', isPublic: boolean, tags: string[]): { title: string; tripRequest: any; tripResult: any; isPublic: boolean; tags: string[] } {
    const itinerary = [];
    const startDate = daysAgo(randInt(5, 120));
    for (let d = 1; d <= duration; d++) {
        const city = cities[(d - 1) % cities.length];
        const date = new Date(startDate.getTime() + (d - 1) * 86400000);
        itinerary.push({
            day: d,
            date: formatDate(date),
            city,
            activities: [
                { name: `Explore ${city} landmarks`, duration: 3, cost: randInt(200, 1000), type: 'sightseeing' },
                { name: `Local food tour in ${city}`, duration: 2, cost: randInt(300, 800), type: 'food' },
            ],
            travel: d > 1 ? { from: cities[(d - 2) % cities.length], to: city, mode: 'road', duration: randInt(2, 6), cost: randInt(300, 2000) } : null,
            nightStay: { hotel: `${budget === 'premium' ? 'Premium' : budget === 'standard' ? 'Comfort' : 'Budget'} Stay ${city}`, cost: budget === 'premium' ? randInt(8000, 20000) : budget === 'standard' ? randInt(2500, 5000) : randInt(600, 1500) },
            meals: { breakfast: randInt(100, 500), lunch: randInt(200, 800), dinner: randInt(300, 1200) },
            weather: { temp: randInt(18, 38), condition: pick(['Sunny', 'Partly Cloudy', 'Clear', 'Warm']) },
            stats: { totalDistance: randInt(10, 200), totalCost: randInt(2000, 15000), feasibility: 'comfortable' as const },
        });
    }
    const totalCost = itinerary.reduce((s, d) => s + d.stats.totalCost, 0);
    const totalDistance = itinerary.reduce((s, d) => s + d.stats.totalDistance, 0);
    return {
        title,
        tripRequest: { stateCodes: [...new Set(cities.map(() => 'RAJASTHAN'))], selectedCityIds: cities, duration, budget, travelStyle: budget === 'budget' ? 'fast' : 'relaxed', constraints: { maxTravelHoursPerDay: 6, seniorFriendly: false, morningReligious: false, noNightTravel: false } },
        tripResult: {
            itinerary,
            warnings: [],
            summary: { totalCost, totalDistance, feasibility: 'comfortable', costBreakup: { stay: Math.round(totalCost * 0.35), transport: Math.round(totalCost * 0.2), activities: Math.round(totalCost * 0.25), food: Math.round(totalCost * 0.2) } },
        },
        isPublic,
        tags,
    };
}

const TRIP_TEMPLATES = [
    // User 0 (Krish) trips
    { userIdx: 0, ...buildTrip('Rajasthan Royal Heritage Tour', ['Jaipur', 'Jodhpur', 'Jaisalmer', 'Udaipur'], 7, 'premium', true, ['heritage', 'forts', 'desert']), isFavorite: true, likes: 24, notes: 'Amazing trip! Jaisalmer sunset was unforgettable.' },
    { userIdx: 0, ...buildTrip('Weekend Delhi Food Crawl', ['Delhi'], 2, 'budget', true, ['food', 'street-food', 'weekend']), isFavorite: false, likes: 12, notes: '' },
    // User 2 (Ravi) trips
    { userIdx: 2, ...buildTrip('Himachal Adventure Trek', ['Manali', 'Kasol', 'Dharamshala'], 6, 'budget', true, ['mountains', 'trekking', 'adventure']), isFavorite: true, likes: 31, notes: 'The Kheerganga trek was life-changing.' },
    { userIdx: 2, ...buildTrip('Rishikesh Rafting Weekend', ['Rishikesh', 'Haridwar'], 3, 'budget', false, ['adventure', 'rafting', 'spiritual']), isFavorite: false, likes: 0, notes: '' },
    // User 3 (Priya) trips
    { userIdx: 3, ...buildTrip('South India Temple Trail', ['Chennai', 'Madurai'], 4, 'standard', true, ['temples', 'heritage', 'cultural']), isFavorite: true, likes: 18, notes: 'Meenakshi Temple at sunrise is magical.' },
    { userIdx: 3, ...buildTrip('Varanasi Spiritual Journey', ['Varanasi'], 3, 'budget', true, ['spiritual', 'ganges', 'old-city']), isFavorite: true, likes: 42, notes: 'The evening Ganga Aarti is something everyone must experience.' },
    // User 4 (Arjun) trips
    { userIdx: 4, ...buildTrip('Ladakh Road Trip', ['Leh', 'Nubra Valley', 'Pangong Lake'], 8, 'standard', true, ['adventure', 'road-trip', 'mountains', 'lakes']), isFavorite: true, likes: 56, notes: 'Khardung La pass at 18,380 feet — absolutely breathtaking!' },
    // User 5 (Sneha) trips
    { userIdx: 5, ...buildTrip('Kolkata Art & Culture', ['Kolkata'], 3, 'standard', true, ['art', 'culture', 'food']), isFavorite: false, likes: 9, notes: '' },
    { userIdx: 5, ...buildTrip('Karnataka Heritage Explorer', ['Bangalore', 'Mysore', 'Hampi'], 5, 'standard', false, ['heritage', 'ruins', 'palace']), isFavorite: true, likes: 0, notes: 'Hampi ruins are incredible — plan at least 2 full days here.' },
    // User 6 (Vikram) trips
    { userIdx: 6, ...buildTrip('Jodhpur & Jaisalmer Desert Safari', ['Jodhpur', 'Jaisalmer'], 4, 'standard', true, ['desert', 'forts', 'camping']), isFavorite: true, likes: 22, notes: 'Camping under the stars in Sam Sand Dunes was the highlight.' },
    // User 7 (Neha) trips
    { userIdx: 7, ...buildTrip('Goa Beach Holiday', ['North Goa', 'Old Goa'], 5, 'standard', true, ['beach', 'nightlife', 'food', 'relaxing']), isFavorite: true, likes: 33, notes: 'Thalassa sunset dinner was 10/10.' },
    // User 8 (Amit) trips
    { userIdx: 8, ...buildTrip('Budget Rajasthan Backpacking', ['Jaipur', 'Jodhpur', 'Udaipur'], 5, 'budget', true, ['budget', 'backpacking', 'hostels']), isFavorite: false, likes: 15, notes: 'You can do Rajasthan under ₹15,000! Hostels are great.' },
    { userIdx: 8, ...buildTrip('Mumbai to Goa by Train', ['Mumbai', 'North Goa'], 4, 'budget', true, ['trains', 'beach', 'budget']), isFavorite: true, likes: 27, notes: 'Konkan Railway route is one of the most scenic in India.' },
    // User 9 (Divya) trips
    { userIdx: 9, ...buildTrip('Kerala Wellness Retreat', ['Kochi', 'Munnar', 'Alleppey'], 5, 'premium', true, ['wellness', 'ayurveda', 'nature', 'houseboat']), isFavorite: true, likes: 38, notes: 'The houseboat cruise through Alleppey backwaters is pure bliss.' },
    // User 10 (Rahul) trips
    { userIdx: 10, ...buildTrip('Amritsar Food Pilgrimage', ['Amritsar'], 2, 'budget', true, ['food', 'spiritual', 'punjabi']), isFavorite: true, likes: 20, notes: 'Golden Temple langar + Bharawan Da Dhaba = food heaven.' },
    // User 11 (Meera) trips
    { userIdx: 11, ...buildTrip('Udaipur Luxury Getaway', ['Udaipur'], 3, 'premium', true, ['luxury', 'palace', 'romantic']), isFavorite: true, likes: 15, notes: 'Taj Lake Palace dinner was unforgettable. Pure royalty.' },
    // User 12 (Karthik) trips
    { userIdx: 12, ...buildTrip('Kashmir Paradise', ['Srinagar', 'Gulmarg', 'Pahalgam'], 6, 'standard', true, ['mountains', 'nature', 'valley']), isFavorite: true, likes: 41, notes: 'Kashmir truly is paradise on earth. Gulmarg in winter is magical.' },
    // User 13 (Ishita) trips
    { userIdx: 13, ...buildTrip('Golden Triangle Heritage Walk', ['Delhi', 'Agra', 'Jaipur'], 5, 'standard', true, ['heritage', 'history', 'culture']), isFavorite: false, likes: 11, notes: '' },
];

// ═════════════════════════════════════════════════════
//  REVIEWS (for places from existing seed)
// ═════════════════════════════════════════════════════

const REVIEW_TEMPLATES = [
    // Amber Fort reviews
    { userIdx: 0, placeId: 'amber-fort', placeName: 'Amber Fort', cityName: 'Jaipur', rating: 5, title: 'Absolutely magnificient!', comment: 'The mirror work in Sheesh Mahal is breathtaking. Go early morning to avoid crowds. The light-and-sound show in the evening is worth staying for.', visitDate: daysAgo(30) },
    { userIdx: 3, placeId: 'amber-fort', placeName: 'Amber Fort', cityName: 'Jaipur', rating: 5, title: 'A must-visit in Jaipur', comment: 'Spent 3 hours here and could have stayed longer. The architecture is stunning. Hire a guide — the stories make it come alive.', visitDate: daysAgo(45) },
    { userIdx: 6, placeId: 'amber-fort', placeName: 'Amber Fort', cityName: 'Jaipur', rating: 4, title: 'Great fort, crowded though', comment: 'Beautiful fort but it gets very crowded by afternoon. The elephant rides are being phased out which is good. Take the Jeep ride up.', visitDate: daysAgo(60) },
    // Hawa Mahal
    { userIdx: 5, placeId: 'hawa-mahal', placeName: 'Hawa Mahal', cityName: 'Jaipur', rating: 4, title: 'Iconic but quick visit', comment: 'The facade is incredible for photos. Inside is smaller than expected. Best viewed from the cafe across the street.', visitDate: daysAgo(20) },
    // Taj Mahal
    { userIdx: 13, placeId: 'taj-mahal', placeName: 'Taj Mahal', cityName: 'Agra', rating: 5, title: 'No photo does it justice', comment: 'Seeing the Taj Mahal at sunrise — when the marble changes from pink to white to gold — is a once-in-a-lifetime experience. Arrive at gate opening.', visitDate: daysAgo(35) },
    { userIdx: 4, placeId: 'taj-mahal', placeName: 'Taj Mahal', cityName: 'Agra', rating: 5, title: 'Emotional experience', comment: 'As a photographer, I have visited many monuments worldwide but the Taj Mahal stands apart. The symmetry, the inlay work, the story behind it — everything is perfect.', visitDate: daysAgo(90) },
    // Mehrangarh Fort
    { userIdx: 6, placeId: 'mehrangarh-fort', placeName: 'Mehrangarh Fort', cityName: 'Jodhpur', rating: 5, title: 'Best fort in India', comment: 'Mehrangarh is in a league of its own. The audio guide is excellent. The views of the Blue City below are stunning. Allow 3-4 hours minimum.', visitDate: daysAgo(50) },
    { userIdx: 2, placeId: 'mehrangarh-fort', placeName: 'Mehrangarh Fort', cityName: 'Jodhpur', rating: 5, title: 'Towering and impressive', comment: 'This fort is massive! The museum inside has an incredible collection. The zip-line off the fort walls is a must-do for adventure lovers.', visitDate: daysAgo(80) },
    // Alleppey backwaters
    { userIdx: 9, placeId: 'alleppey-backwaters', placeName: 'Alleppey Backwaters', cityName: 'Alleppey', rating: 5, title: 'Pure serenity', comment: 'The overnight houseboat cruise is worth every rupee. Waking up to the sounds of birds in the backwaters with fresh Kerala breakfast — magical.', visitDate: daysAgo(25) },
    // Golden Temple
    { userIdx: 10, placeId: 'golden-temple', placeName: 'Golden Temple', cityName: 'Amritsar', rating: 5, title: 'Spiritual and humbling', comment: 'The Golden Temple at 4am during Palki Sahib ceremony was the most spiritual experience of my life. The langar feeds 100,000 people daily — volunteer if you can.', visitDate: daysAgo(15) },
    // Varanasi Ghats
    { userIdx: 3, placeId: 'dashashwamedh-ghat', placeName: 'Dashashwamedh Ghat', cityName: 'Varanasi', rating: 5, title: 'The soul of India', comment: 'The evening Ganga Aarti is indescribable. Arrive by 5pm to get a good spot. The energy, the chanting, the fire — it transcends religion.', visitDate: daysAgo(40) },
    // Mumbai Gateway
    { userIdx: 7, placeId: 'gateway-of-india', placeName: 'Gateway of India', cityName: 'Mumbai', rating: 4, title: 'Mumbai\'s iconic landmark', comment: 'A must-visit! Best at sunset. Take the ferry to Elephanta Caves from here. The area around it with Taj Hotel is perfect for evening walks.', visitDate: daysAgo(55) },
    // Hampi
    { userIdx: 5, placeId: 'hampi-ruins', placeName: 'Hampi Ruins', cityName: 'Hampi', rating: 5, title: 'Like stepping back in time', comment: 'Hampi is surreal. Rent a bicycle and explore the ruins over 2 days. Sunset from Matanga Hill is unforgettable. Stay on the hippie island side.', visitDate: daysAgo(70) },
];

// ═════════════════════════════════════════════════════
//  MAIN SEED FUNCTION
// ═════════════════════════════════════════════════════

async function seedFullDatabase() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/trip_planner';
        console.log(`\n🔌 Connecting to MongoDB...`);
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        // ─── Clear user-generated collections (preserve cities/places/routes) ───
        console.log('🗑️  Clearing user-generated collections...');
        await Promise.all([
            User.deleteMany({}),
            SavedTrip.deleteMany({}),
            TripGroup.deleteMany({}),
            JournalEntry.deleteMany({}),
            Review.deleteMany({}),
            FavoritePlace.deleteMany({}),
            Expense.deleteMany({}),
            Notification.deleteMany({}),
            Postcard.deleteMany({}),
            TravelChecklist.deleteMany({}),
            SharedTrip.deleteMany({}),
            ContactQuery.deleteMany({}),
            GroupItineraryRequest.deleteMany({}),
            Package.deleteMany({}),
            Hotel.deleteMany({}),
            Restaurant.deleteMany({}),
            Festival.deleteMany({}),
        ]);
        console.log('✅ Cleared\n');

        // ═════  1. USERS  ═════
        console.log('👤 Seeding users...');
        const hashedPassword = await bcrypt.hash('Test@1234', 10);
        const userDocs = await User.insertMany(
            USERS.map(u => ({
                ...u,
                password: hashedPassword,
                isVerified: true,
                createdAt: daysAgo(randInt(30, 365)),
            }))
        );
        console.log(`   ✅ ${userDocs.length} users (password: Test@1234)`);

        // ═════  2. HOTELS  ═════
        console.log('🏨 Seeding hotels...');
        const hotelDocs = await Hotel.insertMany(HOTELS_DATA);
        console.log(`   ✅ ${hotelDocs.length} hotels`);

        // ═════  3. RESTAURANTS  ═════
        console.log('🍽️  Seeding restaurants...');
        const restaurantDocs = await Restaurant.insertMany(RESTAURANTS_DATA);
        console.log(`   ✅ ${restaurantDocs.length} restaurants`);

        // ═════  4. FESTIVALS  ═════
        console.log('🎪 Seeding festivals...');
        const festivalDocs = await Festival.insertMany(FESTIVALS_DATA);
        console.log(`   ✅ ${festivalDocs.length} festivals`);

        // ═════  5. PACKAGES  ═════
        console.log('📦 Seeding packages...');
        const packageDocs = await Package.insertMany(PACKAGES_DATA);
        console.log(`   ✅ ${packageDocs.length} packages`);

        // ═════  6. SAVED TRIPS  ═════
        console.log('🗺️  Seeding trips...');
        const tripDocs: any[] = [];
        for (const tmpl of TRIP_TEMPLATES) {
            const user = userDocs[tmpl.userIdx];
            // Build likedBy from random other users
            const otherUsers = userDocs.filter((_, i) => i !== tmpl.userIdx);
            const likedBy = pickN(otherUsers, Math.min(tmpl.likes, otherUsers.length)).map(u => u._id);

            const trip = await SavedTrip.create({
                userId: user._id,
                title: tmpl.title,
                tripRequest: tmpl.tripRequest,
                tripResult: tmpl.tripResult,
                isFavorite: tmpl.isFavorite,
                notes: tmpl.notes,
                isPublic: tmpl.isPublic,
                likes: likedBy.length,
                likedBy,
                tags: tmpl.tags,
                createdAt: daysAgo(randInt(5, 180)),
            });
            tripDocs.push(trip);
        }
        console.log(`   ✅ ${tripDocs.length} trips`);

        // ═════  7. TRIP GROUPS (3 group trips)  ═════
        console.log('👥 Seeding trip groups...');

        // Group 1: Rajasthan group trip (Krish owns, invites Ravi, Priya, Vikram)
        const group1 = await TripGroup.create({
            tripId: tripDocs[0]._id, // Krish's Rajasthan trip
            ownerId: userDocs[0]._id,
            name: 'Rajasthan Gang Trip 2026',
            inviteCode: crypto.randomBytes(6).toString('hex'),
            members: [
                { userId: userDocs[0]._id, email: 'krish@krishbavadiya.store', name: 'Krish Bavadiya', role: 'owner', status: 'accepted', invitedAt: daysAgo(60), respondedAt: daysAgo(60) },
                { userId: userDocs[2]._id, email: 'ravi@krishbavadiya.store', name: 'Ravi Patel', role: 'editor', status: 'accepted', invitedAt: daysAgo(58), respondedAt: daysAgo(57) },
                { userId: userDocs[3]._id, email: 'priya@krishbavadiya.store', name: 'Priya Mehta', role: 'editor', status: 'accepted', invitedAt: daysAgo(58), respondedAt: daysAgo(56) },
                { userId: userDocs[6]._id, email: 'vikram@krishbavadiya.store', name: 'Vikram Singh', role: 'viewer', status: 'accepted', invitedAt: daysAgo(55), respondedAt: daysAgo(54) },
            ],
            chat: [
                { userId: userDocs[0]._id, userName: 'Krish Bavadiya', message: 'Hey everyone! Who\'s excited for Rajasthan? 🏰', timestamp: daysAgo(55) },
                { userId: userDocs[2]._id, userName: 'Ravi Patel', message: 'Can\'t wait! Do we have the camel safari booked for Jaisalmer?', timestamp: daysAgo(54) },
                { userId: userDocs[3]._id, userName: 'Priya Mehta', message: 'I\'d love to visit some temples in Jaipur too. Birla Mandir at sunset?', timestamp: daysAgo(54) },
                { userId: userDocs[6]._id, userName: 'Vikram Singh', message: 'Mehrangarh Fort zip-line is a MUST. Booking it right now! 🎿', timestamp: daysAgo(53) },
                { userId: userDocs[0]._id, userName: 'Krish Bavadiya', message: 'Added all of those! Check the updated itinerary. Also booked Rambagh Palace for Jaipur nights 🤴', timestamp: daysAgo(52) },
            ],
            polls: [
                {
                    question: 'Which hotel in Jaisalmer?',
                    options: [
                        { text: 'Suryagarh (Luxury)', votes: [userDocs[0]._id, userDocs[3]._id] },
                        { text: 'Mystic Jaisalmer (Standard)', votes: [userDocs[2]._id] },
                        { text: 'Desert camp under stars', votes: [userDocs[6]._id] },
                    ],
                    createdBy: userDocs[0]._id,
                    isActive: false,
                    createdAt: daysAgo(50),
                },
            ],
            maxMembers: 6,
        });

        // Group 2: Goa trip (Neha owns, invites Sneha, Meera, Amit)
        const group2 = await TripGroup.create({
            tripId: tripDocs[10]._id, // Neha's Goa trip
            ownerId: userDocs[7]._id,
            name: 'Goa Girls + Budget Bros',
            inviteCode: crypto.randomBytes(6).toString('hex'),
            members: [
                { userId: userDocs[7]._id, email: 'neha@krishbavadiya.store', name: 'Neha Kapoor', role: 'owner', status: 'accepted', invitedAt: daysAgo(40), respondedAt: daysAgo(40) },
                { userId: userDocs[5]._id, email: 'sneha@krishbavadiya.store', name: 'Sneha Iyer', role: 'editor', status: 'accepted', invitedAt: daysAgo(38), respondedAt: daysAgo(37) },
                { userId: userDocs[11]._id, email: 'meera@krishbavadiya.store', name: 'Meera Desai', role: 'editor', status: 'accepted', invitedAt: daysAgo(38), respondedAt: daysAgo(36) },
                { userId: userDocs[8]._id, email: 'amit@krishbavadiya.store', name: 'Amit Joshi', role: 'viewer', status: 'accepted', invitedAt: daysAgo(35), respondedAt: daysAgo(34) },
                { userId: undefined, email: 'friend.external@krishbavadiya.store', name: 'External Friend', role: 'viewer', status: 'invited', invitedAt: daysAgo(35) },
            ],
            chat: [
                { userId: userDocs[7]._id, userName: 'Neha Kapoor', message: 'Goa plan is ON! 🏖️ Dec 20-24 works for everyone?', timestamp: daysAgo(37) },
                { userId: userDocs[5]._id, userName: 'Sneha Iyer', message: 'Count me in! Can we visit some art galleries in Panjim too?', timestamp: daysAgo(36) },
                { userId: userDocs[11]._id, userName: 'Meera Desai', message: 'I want to do the sunset cruise! And Thalassa for dinner 🍷', timestamp: daysAgo(36) },
                { userId: userDocs[8]._id, userName: 'Amit Joshi', message: 'I\'ll find us the cheapest beach shacks! Budget mode activated 💰', timestamp: daysAgo(35) },
            ],
            polls: [
                {
                    question: 'Sunburn Festival on Dec 28 — extend trip?',
                    options: [
                        { text: 'Yes! Stay till Dec 30', votes: [userDocs[7]._id, userDocs[11]._id] },
                        { text: 'No, too expensive', votes: [userDocs[8]._id] },
                        { text: 'Maybe, depends on lineup', votes: [userDocs[5]._id] },
                    ],
                    createdBy: userDocs[7]._id,
                    isActive: true,
                    createdAt: daysAgo(30),
                },
            ],
            maxMembers: 8,
        });

        // Group 3: Ladakh trip (Arjun owns, invites Karthik, Ravi)
        const group3 = await TripGroup.create({
            tripId: tripDocs[6]._id, // Arjun's Ladakh trip
            ownerId: userDocs[4]._id,
            name: 'Ladakh Riders 2026',
            inviteCode: crypto.randomBytes(6).toString('hex'),
            members: [
                { userId: userDocs[4]._id, email: 'arjun@krishbavadiya.store', name: 'Arjun Reddy', role: 'owner', status: 'accepted', invitedAt: daysAgo(90), respondedAt: daysAgo(90) },
                { userId: userDocs[12]._id, email: 'karthik@krishbavadiya.store', name: 'Karthik Narayan', role: 'editor', status: 'accepted', invitedAt: daysAgo(88), respondedAt: daysAgo(87) },
                { userId: userDocs[2]._id, email: 'ravi@krishbavadiya.store', name: 'Ravi Patel', role: 'editor', status: 'accepted', invitedAt: daysAgo(88), respondedAt: daysAgo(85) },
            ],
            chat: [
                { userId: userDocs[4]._id, userName: 'Arjun Reddy', message: 'Ladakh bike trip is happening! 🏔️ June is the best window before monsoon.', timestamp: daysAgo(85) },
                { userId: userDocs[12]._id, userName: 'Karthik Narayan', message: 'I\'ve been dreaming of Khardung La forever! Let\'s rent Royal Enfields in Leh.', timestamp: daysAgo(84) },
                { userId: userDocs[2]._id, userName: 'Ravi Patel', message: 'Should we do Pangong Lake for 2 nights? Heard the camping there is surreal.', timestamp: daysAgo(83) },
                { userId: userDocs[4]._id, userName: 'Arjun Reddy', message: 'Yes! I\'ve added a camp night at Pangong. Also applying for Inner Line Permits now.', timestamp: daysAgo(82) },
            ],
            polls: [],
            maxMembers: 5,
        });

        const groupDocs = [group1, group2, group3];
        console.log(`   ✅ ${groupDocs.length} trip groups`);

        // ═════  8. GROUP ITINERARY REQUESTS  ═════
        console.log('📋 Seeding group itinerary requests...');
        const itineraryRequests = await GroupItineraryRequest.insertMany([
            { groupId: group1._id, requesterId: userDocs[2]._id, requesterName: 'Ravi Patel', type: 'add_activity', title: 'Add zip-line at Mehrangarh', description: 'I found a great zip-line experience at Mehrangarh Fort. ₹1200 per person, takes about 1 hour. Views are incredible!', dayNumber: 3, status: 'approved', votes: [{ userId: userDocs[0]._id, vote: 'approve', votedAt: daysAgo(49) }, { userId: userDocs[3]._id, vote: 'approve', votedAt: daysAgo(48) }], resolvedBy: userDocs[0]._id, resolvedAt: daysAgo(48) },
            { groupId: group1._id, requesterId: userDocs[3]._id, requesterName: 'Priya Mehta', type: 'add_activity', title: 'Visit Birla Mandir at sunset', description: 'Beautiful white marble temple in Jaipur, especially gorgeous at sunset. Free entry.', dayNumber: 1, status: 'approved', votes: [{ userId: userDocs[0]._id, vote: 'approve', votedAt: daysAgo(47) }], resolvedBy: userDocs[0]._id, resolvedAt: daysAgo(47) },
            { groupId: group1._id, requesterId: userDocs[6]._id, requesterName: 'Vikram Singh', type: 'change_hotel', title: 'Switch to desert camp in Jaisalmer', description: 'Instead of hotel, let\'s do a real desert camp at Sam Dunes. Under-the-stars sleeping, camel ride, folk music.', dayNumber: 5, status: 'pending', votes: [{ userId: userDocs[2]._id, vote: 'approve', votedAt: daysAgo(45) }] },
            { groupId: group2._id, requesterId: userDocs[5]._id, requesterName: 'Sneha Iyer', type: 'add_activity', title: 'Art gallery visit in Panjim', description: 'There\'s a great contemporary art gallery in Fontainhas (Panjim). Takes about 2 hours. Very Instagram-worthy.', dayNumber: 2, status: 'approved', votes: [{ userId: userDocs[7]._id, vote: 'approve', votedAt: daysAgo(32) }], resolvedBy: userDocs[7]._id, resolvedAt: daysAgo(32) },
            { groupId: group3._id, requesterId: userDocs[12]._id, requesterName: 'Karthik Narayan', type: 'modify_route', title: 'Add Tso Moriri to the route', description: 'Tso Moriri is less crowded than Pangong and equally beautiful. We can do a loop: Leh → Pangong → Tso Moriri → Leh.', dayNumber: 6, status: 'pending', votes: [{ userId: userDocs[4]._id, vote: 'approve', votedAt: daysAgo(80) }] },
        ]);
        console.log(`   ✅ ${itineraryRequests.length} itinerary requests`);

        // ═════  9. JOURNAL ENTRIES  ═════
        console.log('📖 Seeding journal entries...');
        const journalData = [
            { userIdx: 0, tripIdx: 0, day: 1, city: 'Jaipur', title: 'Arrived in the Pink City', content: 'Just landed in Jaipur. The energy here is incredible — pink buildings everywhere, chaotic but charming streets, and the smell of chai from every corner. Checked into Rambagh Palace, which is literally a royal residence. Explored the local markets in the evening and tried some amazing kachori-samosa from a street stall near Johari Bazaar.', mood: 'amazing', isPublic: true },
            { userIdx: 0, tripIdx: 0, day: 3, city: 'Jodhpur', title: 'Mehrangarh blew my mind', content: 'Spent the entire morning at Mehrangarh Fort. The audio guide narrated by the royal family is brilliant. Standing at the ramparts looking down at the blue-painted houses — I understand why they call it the Blue City. Had lunch at a rooftop café with fort views. The zip-line across the fort was a rush!', mood: 'amazing', isPublic: true },
            { userIdx: 0, tripIdx: 0, day: 5, city: 'Jaisalmer', title: 'Desert nights under the stars', content: 'The Sam Sand Dunes camel safari at sunset was surreal. Watched the sun melt into the desert. At night, we slept under the open sky at the desert camp — no tent, just blankets and a million stars. The folk musicians played Rajasthani songs around the bonfire. This is the India I came to see.', mood: 'amazing', isPublic: true },
            { userIdx: 2, tripIdx: 2, day: 2, city: 'Kasol', title: 'Kheerganga Trek begins', content: 'Started the Kheerganga trek early morning from Barshaini. The trail through pine forests along the Parvati river is beautiful. Legs are hurting but the views keep pushing you forward. Reached the top by afternoon — the natural hot spring at the summit was the best reward. Slept in a tent tonight.', mood: 'tired', isPublic: true },
            { userIdx: 3, tripIdx: 5, day: 1, city: 'Varanasi', title: 'First morning on the Ghats', content: 'Took a sunrise boat ride on the Ganges at 5am. Watching the city wake up — the sadhus meditating, the washermen at work, the bells and chanting from every temple — it\'s overwhelming in the best way. Varanasi is the oldest living city and you can feel it in every stone.', mood: 'amazing', isPublic: true },
            { userIdx: 3, tripIdx: 5, day: 2, city: 'Varanasi', title: 'Ganga Aarti and old lanes', content: 'Lost myself in the narrow lanes of Varanasi today. Every turn reveals a little temple, a silk weaver\'s workshop, or a chai stall. The evening Ganga Aarti at Dashashwamedh Ghat was the most powerful spiritual experience — thousands of people, synchronised fire rituals, and the river glowing.', mood: 'happy', isPublic: true },
            { userIdx: 4, tripIdx: 6, day: 1, city: 'Leh', title: 'First day in Ladakh!', content: 'Flew into Leh — wow, the landing through the mountains is an experience itself. Spending today acclimatizing. The air is so thin at 11,500 feet. Explored Leh Palace and the markets. Having butter tea (po cha) for the first time. It\'s an acquired taste but I think I like it.', mood: 'happy', isPublic: true },
            { userIdx: 4, tripIdx: 6, day: 5, city: 'Pangong Lake', title: 'Pangong: painting come alive', content: 'Drove 5 hours from Leh to Pangong Lake through Chang La pass. When the lake appeared — I actually gasped. The blue is unreal. It keeps changing color as clouds move. We\'re camping right on the shore tonight. No phone signal but who needs it? This is freedom.', mood: 'amazing', isPublic: true },
            { userIdx: 7, tripIdx: 10, day: 1, city: 'North Goa', title: 'Beach life begins', content: 'Arrived in Goa and immediately hit Anjuna Beach. The vibe is exactly what I needed — chill music, cold drinks, warm sand. Found a beach shack that does amazing prawn curry rice for ₹250. This is going to be a good trip. Watched the sunset from Chapora Fort — Dil Chahta Hai moment!', mood: 'happy', isPublic: true },
            { userIdx: 9, tripIdx: 13, day: 3, city: 'Alleppey', title: 'Houseboat heaven', content: 'Spent the night on a traditional Kerala kettuvallam (houseboat) cruising through Alleppey backwaters. Fresh fish curry cooked on board, coconut trees reflecting in the water, zero noise except birds. This is the most peaceful I\'ve felt in years. Kerala Ayurveda massage at the dock — absolute bliss.', mood: 'amazing', isPublic: true },
            { userIdx: 10, tripIdx: 14, day: 1, city: 'Amritsar', title: 'Golden Temple & food coma', content: 'Visited the Golden Temple at 4am for the morning prayers. The reflection in the water, the hymns, the peace — indescribable. Ate at the langar (community kitchen) — 100,000 people fed daily for FREE. Then destroyed my diet at Bharawan Da Dhaba — the kulchas are criminally good.', mood: 'amazing', isPublic: true },
            { userIdx: 12, tripIdx: 16, day: 2, city: 'Gulmarg', title: 'Gulmarg gondola ride', content: 'Took Asia\'s highest cable car (gondola) to 13,780 feet in Gulmarg. The meadows, pine forests, and snow-capped peaks all around — it looks like a Windows wallpaper but REAL. Did some skiing for the first time — fell about 50 times but worth it!', mood: 'happy', isPublic: true },
        ];

        const journalDocs = await JournalEntry.insertMany(
            journalData.map(j => ({
                userId: userDocs[j.userIdx]._id,
                tripId: tripDocs[j.tripIdx]._id,
                day: j.day,
                city: j.city,
                title: j.title,
                content: j.content,
                mood: j.mood,
                photos: [],
                isPublic: j.isPublic,
                createdAt: daysAgo(randInt(5, 100)),
            }))
        );
        console.log(`   ✅ ${journalDocs.length} journal entries`);

        // ═════  10. REVIEWS  ═════
        console.log('⭐ Seeding reviews...');
        const reviewDocs = await Review.insertMany(
            REVIEW_TEMPLATES.map(r => ({
                userId: userDocs[r.userIdx]._id,
                userName: USERS[r.userIdx].name,
                placeId: r.placeId,
                placeName: r.placeName,
                cityName: r.cityName,
                rating: r.rating,
                title: r.title,
                comment: r.comment,
                visitDate: r.visitDate,
                photos: [],
                helpfulCount: randInt(0, 15),
                helpfulBy: pickN(userDocs.filter((_, i) => i !== r.userIdx), randInt(0, 5)).map(u => u._id),
            }))
        );
        console.log(`   ✅ ${reviewDocs.length} reviews`);

        // ═════  11. FAVORITE PLACES  ═════
        console.log('❤️  Seeding favorites...');
        const favoritesData = [
            { userIdx: 0, placeId: 'amber-fort', placeName: 'Amber Fort', cityName: 'Jaipur' },
            { userIdx: 0, placeId: 'mehrangarh-fort', placeName: 'Mehrangarh Fort', cityName: 'Jodhpur' },
            { userIdx: 2, placeId: 'kheerganga-trek', placeName: 'Kheerganga Trek', cityName: 'Kasol' },
            { userIdx: 3, placeId: 'meenakshi-temple', placeName: 'Meenakshi Temple', cityName: 'Madurai' },
            { userIdx: 3, placeId: 'dashashwamedh-ghat', placeName: 'Dashashwamedh Ghat', cityName: 'Varanasi' },
            { userIdx: 4, placeId: 'pangong-lake', placeName: 'Pangong Lake', cityName: 'Pangong Lake' },
            { userIdx: 4, placeId: 'taj-mahal', placeName: 'Taj Mahal', cityName: 'Agra' },
            { userIdx: 5, placeId: 'hampi-ruins', placeName: 'Hampi Ruins', cityName: 'Hampi' },
            { userIdx: 5, placeId: 'victoria-memorial', placeName: 'Victoria Memorial', cityName: 'Kolkata' },
            { userIdx: 6, placeId: 'mehrangarh-fort', placeName: 'Mehrangarh Fort', cityName: 'Jodhpur' },
            { userIdx: 6, placeId: 'jaisalmer-fort', placeName: 'Jaisalmer Fort', cityName: 'Jaisalmer' },
            { userIdx: 7, placeId: 'chapora-fort', placeName: 'Chapora Fort', cityName: 'North Goa' },
            { userIdx: 8, placeId: 'hawa-mahal', placeName: 'Hawa Mahal', cityName: 'Jaipur' },
            { userIdx: 9, placeId: 'alleppey-backwaters', placeName: 'Alleppey Backwaters', cityName: 'Alleppey' },
            { userIdx: 10, placeId: 'golden-temple', placeName: 'Golden Temple', cityName: 'Amritsar' },
            { userIdx: 11, placeId: 'city-palace-udaipur', placeName: 'City Palace Udaipur', cityName: 'Udaipur' },
            { userIdx: 12, placeId: 'dal-lake', placeName: 'Dal Lake', cityName: 'Srinagar' },
            { userIdx: 13, placeId: 'taj-mahal', placeName: 'Taj Mahal', cityName: 'Agra' },
            { userIdx: 13, placeId: 'city-palace-jaipur', placeName: 'City Palace Jaipur', cityName: 'Jaipur' },
        ];
        const favDocs = await FavoritePlace.insertMany(
            favoritesData.map(f => ({
                userId: userDocs[f.userIdx]._id,
                placeId: f.placeId,
                placeName: f.placeName,
                cityName: f.cityName,
                addedAt: daysAgo(randInt(5, 120)),
            }))
        );
        console.log(`   ✅ ${favDocs.length} favorites`);

        // ═════  12. EXPENSES  ═════
        console.log('💰 Seeding expenses...');
        const expenseData: any[] = [];
        // Generate realistic expenses for several trips
        const tripsWithExpenses = [
            { tripIdx: 0, userIdx: 0, cities: ['Jaipur', 'Jodhpur', 'Jaisalmer', 'Udaipur'], days: 7 },
            { tripIdx: 2, userIdx: 2, cities: ['Manali', 'Kasol', 'Dharamshala'], days: 6 },
            { tripIdx: 5, userIdx: 3, cities: ['Varanasi'], days: 3 },
            { tripIdx: 6, userIdx: 4, cities: ['Leh', 'Nubra Valley', 'Pangong Lake'], days: 8 },
            { tripIdx: 10, userIdx: 7, cities: ['North Goa', 'Old Goa'], days: 5 },
            { tripIdx: 13, userIdx: 9, cities: ['Kochi', 'Munnar', 'Alleppey'], days: 5 },
        ];
        const expCategories: Array<'stay' | 'transport' | 'food' | 'activities' | 'shopping' | 'tips'> = ['stay', 'transport', 'food', 'activities', 'shopping', 'tips'];
        const expPayments: Array<'cash' | 'upi' | 'card'> = ['cash', 'upi', 'card'];
        const expDescriptions: Record<string, string[]> = {
            stay: ['Hotel room', 'Hostel dorm', 'Houseboat', 'Resort', 'Homestay', 'Camp tent'],
            transport: ['Auto rickshaw', 'Cab to airport', 'Local bus', 'Bike rental', 'Train ticket', 'Uber ride'],
            food: ['Lunch at local restaurant', 'Street food snacks', 'Dinner at cafe', 'Breakfast buffet', 'Tea & snacks', 'Thali meal'],
            activities: ['Museum entry', 'Fort entry ticket', 'Guided tour', 'Water sports', 'Boat ride', 'Temple donation'],
            shopping: ['Souvenirs', 'Local handicrafts', 'Spices & tea', 'Textiles', 'Jewelery'],
            tips: ['Hotel tip', 'Guide tip', 'Restaurant tip', 'Driver tip'],
        };

        for (const te of tripsWithExpenses) {
            for (let d = 1; d <= te.days; d++) {
                const numExpenses = randInt(3, 6);
                for (let e = 0; e < numExpenses; e++) {
                    const cat = pick(expCategories);
                    expenseData.push({
                        userId: userDocs[te.userIdx]._id,
                        tripId: tripDocs[te.tripIdx]._id,
                        category: cat,
                        amount: cat === 'stay' ? randInt(600, 15000) : cat === 'transport' ? randInt(50, 3000) : cat === 'food' ? randInt(50, 1500) : cat === 'activities' ? randInt(100, 2000) : cat === 'shopping' ? randInt(200, 5000) : randInt(50, 500),
                        description: pick(expDescriptions[cat]),
                        day: d,
                        city: te.cities[(d - 1) % te.cities.length],
                        paymentMethod: pick(expPayments),
                    });
                }
            }
        }
        const expDocs = await Expense.insertMany(expenseData);
        console.log(`   ✅ ${expDocs.length} expenses`);

        // ═════  13. NOTIFICATIONS  ═════
        console.log('🔔 Seeding notifications...');
        const notifData: any[] = [];
        const notifTypes: Array<{ type: string; title: string; message: string }> = [
            { type: 'trip_reminder', title: 'Your Rajasthan trip is coming up!', message: 'Your trip starts in 3 days. Make sure to pack your bags and check the weather forecast.' },
            { type: 'weather_alert', title: 'Weather Alert: Jaipur', message: 'Temperature expected to reach 42°C in Jaipur tomorrow. Stay hydrated and avoid midday sun.' },
            { type: 'review_prompt', title: 'How was Amber Fort?', message: 'You visited Amber Fort recently. Share your experience to help other travelers!' },
            { type: 'festival_alert', title: 'Pushkar Camel Fair is happening!', message: 'The Pushkar Camel Fair starts next week. Consider adding Pushkar to your Rajasthan itinerary.' },
            { type: 'group_request', title: 'New group invite', message: 'Neha Kapoor invited you to join "Goa Beach Trip". Tap to view and respond.' },
            { type: 'system', title: 'Welcome to TripPlanner!', message: 'Start planning your next Indian adventure. Explore over 40 cities and hundreds of attractions.' },
            { type: 'price_change', title: 'Price drop: Kerala packages', message: 'Kerala Backwaters packages are now 20% off for monsoon season. Book now!' },
        ];

        for (let i = 0; i < userDocs.length; i++) {
            const numNotifs = randInt(3, 7);
            for (let n = 0; n < numNotifs; n++) {
                const tmpl = pick(notifTypes);
                notifData.push({
                    userId: userDocs[i]._id,
                    type: tmpl.type,
                    title: tmpl.title,
                    message: tmpl.message,
                    isRead: Math.random() > 0.4,
                    priority: pick(['low', 'medium', 'high']),
                    createdAt: daysAgo(randInt(1, 60)),
                });
            }
        }
        const notifDocs = await Notification.insertMany(notifData);
        console.log(`   ✅ ${notifDocs.length} notifications`);

        // ═════  14. POSTCARDS  ═════
        console.log('💌 Seeding postcards...');
        const postcardDocs = await Postcard.insertMany([
            { userId: userDocs[0]._id, tripId: tripDocs[0]._id, imageUrl: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800', template: 'classic', title: 'Greetings from Jaipur!', message: 'Wish you were here in the Pink City! The forts are incredible.', recipientEmail: 'ravi@krishbavadiya.store', sentAt: daysAgo(28) },
            { userId: userDocs[4]._id, tripId: tripDocs[6]._id, imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', template: 'adventure', title: 'Pangong Lake Vibes', message: 'The bluest water I\'ve ever seen. Ladakh is another planet!', recipientEmail: 'sneha@krishbavadiya.store', sentAt: daysAgo(60) },
            { userId: userDocs[7]._id, tripId: tripDocs[10]._id, imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800', template: 'beach', title: 'Goa Sunsets!', message: 'Living the beach life! Missing you all back home 🏖️', recipientEmail: 'divya@krishbavadiya.store', sentAt: daysAgo(15) },
            { userId: userDocs[9]._id, tripId: tripDocs[13]._id, imageUrl: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800', template: 'nature', title: 'Kerala Backwaters', message: 'On a houseboat in Alleppey. Pure serenity. You must visit!', recipientEmail: 'priya@krishbavadiya.store', sentAt: daysAgo(20) },
            { userId: userDocs[12]._id, tripId: tripDocs[16]._id, imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', template: 'mountains', title: 'Kashmir Calling', message: 'Dal Lake shikara ride in Srinagar. This is paradise.', recipientEmail: 'arjun@krishbavadiya.store', sentAt: daysAgo(40) },
        ]);
        console.log(`   ✅ ${postcardDocs.length} postcards`);

        // ═════  15. TRAVEL CHECKLISTS  ═════
        console.log('✅ Seeding checklists...');
        const checklistDocs = await TravelChecklist.insertMany([
            {
                userId: userDocs[0]._id, tripId: tripDocs[0]._id, title: 'Rajasthan Trip Packing',
                items: [
                    { label: 'Passport / Aadhar Card', checked: true, category: 'documents' },
                    { label: 'Hotel confirmation printouts', checked: true, category: 'documents' },
                    { label: 'Sunscreen SPF 50+', checked: true, category: 'essentials' },
                    { label: 'Water bottle (insulated)', checked: true, category: 'essentials' },
                    { label: 'Light cotton clothes', checked: true, category: 'clothing' },
                    { label: 'Comfortable walking shoes', checked: true, category: 'clothing' },
                    { label: 'Sunhat / Cap', checked: false, category: 'clothing' },
                    { label: 'Camera + extra battery', checked: true, category: 'electronics' },
                    { label: 'Portable charger', checked: true, category: 'electronics' },
                    { label: 'Toothbrush & toiletries bag', checked: true, category: 'toiletries' },
                ],
            },
            {
                userId: userDocs[4]._id, tripId: tripDocs[6]._id, title: 'Ladakh Expedition Gear',
                items: [
                    { label: 'Inner Line Permit printed', checked: true, category: 'documents' },
                    { label: 'Altitude sickness medicine (Diamox)', checked: true, category: 'essentials' },
                    { label: 'Thermal inner wear', checked: true, category: 'clothing' },
                    { label: 'Down jacket', checked: true, category: 'clothing' },
                    { label: 'Waterproof hiking boots', checked: true, category: 'clothing' },
                    { label: 'Sunglasses (UV protection)', checked: true, category: 'essentials' },
                    { label: 'Dry bags for electronics', checked: false, category: 'electronics' },
                    { label: 'GoPro + mount', checked: true, category: 'electronics' },
                    { label: 'First aid kit', checked: true, category: 'essentials' },
                    { label: 'Lip balm & moisturizer', checked: true, category: 'toiletries' },
                ],
            },
            {
                userId: userDocs[7]._id, tripId: tripDocs[10]._id, title: 'Goa Beach Essentials',
                items: [
                    { label: 'Swimsuit', checked: true, category: 'clothing' },
                    { label: 'Beach towel', checked: true, category: 'essentials' },
                    { label: 'Sunscreen reef-safe', checked: true, category: 'toiletries' },
                    { label: 'Flip flops', checked: true, category: 'clothing' },
                    { label: 'Waterproof phone pouch', checked: false, category: 'electronics' },
                    { label: 'Cash for beach shacks', checked: true, category: 'essentials' },
                    { label: 'Party outfit for nightlife', checked: true, category: 'clothing' },
                ],
            },
        ]);
        console.log(`   ✅ ${checklistDocs.length} checklists`);

        // ═════  16. SHARED TRIPS  ═════
        console.log('🔗 Seeding shared trips...');
        const sharedDocs = await SharedTrip.insertMany([
            { shareId: 'rajasthan-royal-2026', tripRequest: tripDocs[0].tripRequest, tripResult: tripDocs[0].tripResult, createdBy: userDocs[0]._id, viewCount: 142, expiresAt: new Date(Date.now() + 30 * 86400000) },
            { shareId: 'ladakh-road-trip-arjun', tripRequest: tripDocs[6].tripRequest, tripResult: tripDocs[6].tripResult, createdBy: userDocs[4]._id, viewCount: 89, expiresAt: new Date(Date.now() + 30 * 86400000) },
            { shareId: 'varanasi-spiritual-priya', tripRequest: tripDocs[5].tripRequest, tripResult: tripDocs[5].tripResult, createdBy: userDocs[3]._id, viewCount: 67, expiresAt: new Date(Date.now() + 30 * 86400000) },
        ]);
        console.log(`   ✅ ${sharedDocs.length} shared trips`);

        // ═════  17. CONTACT QUERIES  ═════
        console.log('📬 Seeding contact queries...');
        const contactDocs = await ContactQuery.insertMany([
            { name: 'Ravi Patel', email: 'ravi@krishbavadiya.store', subject: 'Can I export my trip as PDF?', message: 'I created a trip itinerary for Himachal and wanted to share it with my friends as a PDF. Is there a way to export or download the trip plan? It would be super helpful for offline use during the trek.', status: 'resolved', adminNote: 'Added PDF export feature in v2.1' },
            { name: 'Sneha Iyer', email: 'sneha@krishbavadiya.store', subject: 'Bug: Map not loading in Karnataka trip', message: 'When I open my Karnataka Heritage Trail trip, the map shows a blank grey area instead of the route. I\'ve tried refreshing multiple times. Using Chrome on Windows 11. Screenshot attached to my email.', status: 'in-progress', adminNote: 'Investigating Leaflet tile loading issue' },
            { name: 'Amit Joshi', email: 'amit@krishbavadiya.store', subject: 'Feature request: Train booking integration', message: 'It would be amazing if TripPlanner could integrate with IRCTC for direct train booking. Currently I have to copy the train details manually and go to IRCTC separately. Would save so much time!', status: 'new' },
            { name: 'Divya Nair', email: 'divya@krishbavadiya.store', subject: 'Add Ayurveda centers to places', message: 'Kerala is famous for Ayurveda but the places section doesn\'t have Ayurveda centers or wellness retreats listed. Can you add this category? Especially in Kochi and Alleppey areas.', status: 'new' },
            { name: 'External Visitor', email: 'visitor@krishbavadiya.store', subject: 'Partnership inquiry for hotel listings', message: 'I own a boutique hotel in Udaipur and would love to be listed on your platform. We offer heritage rooms with lake views. Please share the process for getting our hotel listed. Looking forward to hearing from you.', status: 'new' },
        ]);
        console.log(`   ✅ ${contactDocs.length} contact queries`);

        // ═════════════════════════════════════════════
        //  FINAL SUMMARY
        // ═════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════');
        console.log('  🎉 FULL DATABASE SEED COMPLETE!');
        console.log('═══════════════════════════════════════');
        console.log(`  👤 Users:            ${userDocs.length} (password: Test@1234)`);
        console.log(`  🏨 Hotels:           ${hotelDocs.length}`);
        console.log(`  🍽️  Restaurants:      ${restaurantDocs.length}`);
        console.log(`  🎪 Festivals:        ${festivalDocs.length}`);
        console.log(`  📦 Packages:         ${packageDocs.length}`);
        console.log(`  🗺️  Trips:            ${tripDocs.length}`);
        console.log(`  👥 Trip Groups:      ${groupDocs.length}`);
        console.log(`  📋 Itinerary Reqs:   ${itineraryRequests.length}`);
        console.log(`  📖 Journals:         ${journalDocs.length}`);
        console.log(`  ⭐ Reviews:          ${reviewDocs.length}`);
        console.log(`  ❤️  Favorites:        ${favDocs.length}`);
        console.log(`  💰 Expenses:         ${expDocs.length}`);
        console.log(`  🔔 Notifications:    ${notifDocs.length}`);
        console.log(`  💌 Postcards:        ${postcardDocs.length}`);
        console.log(`  ✅ Checklists:       ${checklistDocs.length}`);
        console.log(`  🔗 Shared Trips:     ${sharedDocs.length}`);
        console.log(`  📬 Contact Queries:  ${contactDocs.length}`);
        console.log('═══════════════════════════════════════');
        console.log('\n  📧 All emails: @krishbavadiya.store');
        console.log('  🔑 All passwords: Test@1234');
        console.log('  🔐 Admins: krish@krishbavadiya.store, ananya@krishbavadiya.store\n');

    } catch (error) {
        console.error('❌ Seed failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

seedFullDatabase();
