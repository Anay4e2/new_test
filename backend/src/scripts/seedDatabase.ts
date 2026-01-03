// Database Seed Script
// Run with: npx ts-node src/scripts/seedDatabase.ts

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import City from '../models/City';
import Place from '../models/Place';
import Route from '../models/Route';

dotenv.config();

// --- CITIES DATA ---
const CITIES_DATA = [
    // RAJASTHAN
    {
        name: 'Jaipur',
        stateCode: 'RAJASTHAN',
        coordinates: { lat: 26.9124, lng: 75.7873 },
        tier: 'tier1',
        description: 'The Pink City, famous for Hawa Mahal, Amer Fort, and City Palace.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&q=80',
    },
    {
        name: 'Udaipur',
        stateCode: 'RAJASTHAN',
        coordinates: { lat: 24.5854, lng: 73.7125 },
        tier: 'tier1',
        description: 'The City of Lakes, known for its romantic setting and palaces.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&q=80',
    },
    {
        name: 'Jodhpur',
        stateCode: 'RAJASTHAN',
        coordinates: { lat: 26.2389, lng: 73.0243 },
        tier: 'tier2',
        description: 'The Blue City, dominated by the massive Mehrangarh Fort.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1590449911964-b04b6b64731c?auto=format&fit=crop&q=80',
    },
    {
        name: 'Jaisalmer',
        stateCode: 'RAJASTHAN',
        coordinates: { lat: 26.9157, lng: 70.9083 },
        tier: 'tier2',
        description: 'The Golden City, located in the heart of the Thar Desert.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&q=80',
    },
    // KERALA
    {
        name: 'Munnar',
        stateCode: 'KERALA',
        coordinates: { lat: 10.0889, lng: 77.0595 },
        tier: 'tier2',
        description: 'A hill station famous for its tea estates and misty mountains.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1596323674681-424d86b856b3?auto=format&fit=crop&q=80',
    },
    {
        name: 'Alleppey',
        stateCode: 'KERALA',
        coordinates: { lat: 9.4981, lng: 76.3388 },
        tier: 'tier2',
        description: 'Known as the Venice of the East, famous for houseboat cruises.',
        idealDays: 1,
        imageUrl: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&q=80',
    },
    {
        name: 'Kochi',
        stateCode: 'KERALA',
        coordinates: { lat: 9.9312, lng: 76.2673 },
        tier: 'tier1',
        description: 'Port city known for Chinese fishing nets and colonial heritage.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=80',
    },
    // GOA
    {
        name: 'North Goa',
        stateCode: 'GOA',
        coordinates: { lat: 15.5449, lng: 73.7551 },
        tier: 'tier1',
        description: 'Famous for beaches, nightlife, and water sports.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&q=80',
    },
    {
        name: 'Old Goa',
        stateCode: 'GOA',
        coordinates: { lat: 15.5009, lng: 73.9116 },
        tier: 'tier2',
        description: 'Historic capital with UNESCO World Heritage churches.',
        idealDays: 1,
        imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&q=80',
    },
    // MAHARASHTRA
    {
        name: 'Mumbai',
        stateCode: 'MAHARASHTR',
        coordinates: { lat: 18.9220, lng: 72.8347 },
        tier: 'tier1',
        description: 'The City of Dreams, financial capital of India.',
        idealDays: 3,
        imageUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&q=80',
    },
    {
        name: 'Pune',
        stateCode: 'MAHARASHTR',
        coordinates: { lat: 18.5204, lng: 73.8567 },
        tier: 'tier1',
        description: 'Cultural capital of Maharashtra with rich history.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&q=80',
    },
    {
        name: 'Aurangabad',
        stateCode: 'MAHARASHTR',
        coordinates: { lat: 19.8762, lng: 75.3433 },
        tier: 'tier2',
        description: 'Gateway to Ajanta and Ellora caves.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&q=80',
    },
    // TAMIL NADU
    {
        name: 'Chennai',
        stateCode: 'TAMIL_NADU',
        coordinates: { lat: 13.0827, lng: 80.2707 },
        tier: 'tier1',
        description: 'Cultural capital of South India with rich heritage.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&q=80',
    },
    {
        name: 'Madurai',
        stateCode: 'TAMIL_NADU',
        coordinates: { lat: 9.9252, lng: 78.1198 },
        tier: 'tier2',
        description: 'One of the oldest cities, famous for Meenakshi Temple.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&q=80',
    },
    // WEST BENGAL
    {
        name: 'Kolkata',
        stateCode: 'WEST_BENGA',
        coordinates: { lat: 22.5726, lng: 88.3639 },
        tier: 'tier1',
        description: 'City of Joy, known for its colonial heritage and culture.',
        idealDays: 3,
        imageUrl: 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&q=80',
    },
    {
        name: 'Darjeeling',
        stateCode: 'WEST_BENGA',
        coordinates: { lat: 27.0410, lng: 88.2663 },
        tier: 'tier2',
        description: 'Queen of the Hills, famous for tea gardens and Himalayan views.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&q=80',
    },
    // KARNATAKA
    {
        name: 'Bangalore',
        stateCode: 'KARNATAKA',
        coordinates: { lat: 12.9716, lng: 77.5946 },
        tier: 'tier1',
        description: 'Silicon Valley of India, known for parks and IT industry.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1600100397608-6c5f54b32ea7?auto=format&fit=crop&q=80',
    },
    {
        name: 'Mysore',
        stateCode: 'KARNATAKA',
        coordinates: { lat: 12.2958, lng: 76.6394 },
        tier: 'tier2',
        description: 'City of Palaces, known for its royal heritage.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1600100397608-6c5f54b32ea7?auto=format&fit=crop&q=80',
    },
    {
        name: 'Hampi',
        stateCode: 'KARNATAKA',
        coordinates: { lat: 15.3350, lng: 76.4600 },
        tier: 'tier2',
        description: 'UNESCO World Heritage Site with ancient Vijayanagara ruins.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1600100397608-6c5f54b32ea7?auto=format&fit=crop&q=80',
    },
    // GUJARAT
    {
        name: 'Ahmedabad',
        stateCode: 'GUJARAT',
        coordinates: { lat: 23.0225, lng: 72.5714 },
        tier: 'tier1',
        description: 'First UNESCO World Heritage City in India.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&q=80',
    },
    {
        name: 'Kutch',
        stateCode: 'GUJARAT',
        coordinates: { lat: 23.7337, lng: 69.8597 },
        tier: 'tier2',
        description: 'Famous for the white salt desert Rann of Kutch.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&q=80',
    },
    {
        name: 'Kevadia',
        stateCode: 'GUJARAT',
        coordinates: { lat: 21.8380, lng: 73.7191 },
        tier: 'tier2',
        description: "Home to the Statue of Unity, the world's tallest statue.",
        idealDays: 1,
        imageUrl: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&q=80',
    },
    // UTTAR PRADESH
    {
        name: 'Agra',
        stateCode: 'UTTAR_PRAD',
        coordinates: { lat: 27.1767, lng: 78.0081 },
        tier: 'tier1',
        description: 'Home to the iconic Taj Mahal.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80',
    },
    {
        name: 'Varanasi',
        stateCode: 'UTTAR_PRAD',
        coordinates: { lat: 25.3176, lng: 82.9739 },
        tier: 'tier1',
        description: 'One of the oldest living cities, spiritual capital of India.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80',
    },
    // DELHI
    {
        name: 'Delhi',
        stateCode: 'NCT_DELHI',
        coordinates: { lat: 28.7041, lng: 77.1025 },
        tier: 'tier1',
        description: 'Capital city with rich Mughal heritage and modern attractions.',
        idealDays: 3,
        imageUrl: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&q=80',
    },
    // JAMMU & KASHMIR
    {
        name: 'Srinagar',
        stateCode: 'JAMMU_KASH',
        coordinates: { lat: 34.0837, lng: 74.7973 },
        tier: 'tier1',
        description: 'Paradise on Earth, famous for Dal Lake and houseboats.',
        idealDays: 3,
        imageUrl: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&q=80',
    },
    {
        name: 'Gulmarg',
        stateCode: 'JAMMU_KASH',
        coordinates: { lat: 34.0484, lng: 74.3805 },
        tier: 'tier2',
        description: 'Meadow of Flowers, popular ski resort and gondola rides.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&q=80',
    },
    {
        name: 'Pahalgam',
        stateCode: 'JAMMU_KASH',
        coordinates: { lat: 34.0161, lng: 75.3150 },
        tier: 'tier2',
        description: 'Valley of Shepherds, base for Amarnath pilgrimage.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&q=80',
    },
    // LADAKH
    {
        name: 'Leh',
        stateCode: 'LADAKH',
        coordinates: { lat: 34.1526, lng: 77.5771 },
        tier: 'tier1',
        description: 'Land of high passes, stunning monasteries and landscapes.',
        idealDays: 4,
        imageUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80',
    },
    {
        name: 'Nubra Valley',
        stateCode: 'LADAKH',
        coordinates: { lat: 34.6850, lng: 77.5650 },
        tier: 'tier2',
        description: 'Valley of flowers with sand dunes and double-humped camels.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80',
    },
    {
        name: 'Pangong Lake',
        stateCode: 'LADAKH',
        coordinates: { lat: 33.7595, lng: 78.6615 },
        tier: 'tier2',
        description: 'Iconic blue lake at 14,270 ft, featured in 3 Idiots.',
        idealDays: 1,
        imageUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80',
    },
    // HIMACHAL PRADESH
    {
        name: 'Shimla',
        stateCode: 'HIMACHAL_P',
        coordinates: { lat: 31.1048, lng: 77.1734 },
        tier: 'tier1',
        description: 'Queen of Hills, former summer capital of British India.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1597074866923-dc0589150358?auto=format&fit=crop&q=80',
    },
    {
        name: 'Manali',
        stateCode: 'HIMACHAL_P',
        coordinates: { lat: 32.2396, lng: 77.1887 },
        tier: 'tier1',
        description: 'Adventure capital with snow-capped peaks and river rafting.',
        idealDays: 3,
        imageUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80',
    },
    {
        name: 'Dharamshala',
        stateCode: 'HIMACHAL_P',
        coordinates: { lat: 32.2190, lng: 76.3234 },
        tier: 'tier2',
        description: 'Home of Dalai Lama, Tibetan culture and stunning views.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1597074866923-dc0589150358?auto=format&fit=crop&q=80',
    },
    {
        name: 'Kasol',
        stateCode: 'HIMACHAL_P',
        coordinates: { lat: 32.0101, lng: 77.3142 },
        tier: 'tier2',
        description: 'Mini Israel of India, backpacker paradise in Parvati Valley.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1597074866923-dc0589150358?auto=format&fit=crop&q=80',
    },
    // PUNJAB
    {
        name: 'Amritsar',
        stateCode: 'PUNJAB',
        coordinates: { lat: 31.6340, lng: 74.8723 },
        tier: 'tier1',
        description: 'Home to Golden Temple, spiritual center of Sikhism.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1588079975449-56356db8eb98?auto=format&fit=crop&q=80',
    },
    {
        name: 'Chandigarh',
        stateCode: 'CHANDIGARH',
        coordinates: { lat: 30.7333, lng: 76.7794 },
        tier: 'tier1',
        description: 'The City Beautiful, designed by Le Corbusier.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1588079975449-56356db8eb98?auto=format&fit=crop&q=80',
    },
    // ODISHA
    {
        name: 'Bhubaneswar',
        stateCode: 'ODISHA',
        coordinates: { lat: 20.2961, lng: 85.8245 },
        tier: 'tier1',
        description: 'Temple City of India with ancient Hindu temples.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80',
    },
    {
        name: 'Puri',
        stateCode: 'ODISHA',
        coordinates: { lat: 19.8135, lng: 85.8312 },
        tier: 'tier2',
        description: 'Sacred city with Jagannath Temple and beautiful beach.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80',
    },
    {
        name: 'Konark',
        stateCode: 'ODISHA',
        coordinates: { lat: 19.8876, lng: 86.0945 },
        tier: 'tier2',
        description: 'UNESCO site with famous Sun Temple.',
        idealDays: 1,
        imageUrl: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80',
    },
    // TELANGANA
    {
        name: 'Hyderabad',
        stateCode: 'TELANGANA',
        coordinates: { lat: 17.3850, lng: 78.4867 },
        tier: 'tier1',
        description: 'City of Pearls, famous for Charminar and biryani.',
        idealDays: 3,
        imageUrl: 'https://images.unsplash.com/photo-1600100397608-6c5f54b32ea7?auto=format&fit=crop&q=80',
    },
    // ASSAM
    {
        name: 'Guwahati',
        stateCode: 'ASSAM',
        coordinates: { lat: 26.1445, lng: 91.7362 },
        tier: 'tier1',
        description: 'Gateway to Northeast India, Kamakhya Temple.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&q=80',
    },
    {
        name: 'Kaziranga',
        stateCode: 'ASSAM',
        coordinates: { lat: 26.5775, lng: 93.1711 },
        tier: 'tier2',
        description: 'UNESCO site, home to one-horned rhinoceros.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&q=80',
    },
    // SIKKIM
    {
        name: 'Gangtok',
        stateCode: 'SIKKIM',
        coordinates: { lat: 27.3389, lng: 88.6065 },
        tier: 'tier1',
        description: 'Clean mountain city with views of Kanchenjunga.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&q=80',
    },
    {
        name: 'Pelling',
        stateCode: 'SIKKIM',
        coordinates: { lat: 27.3000, lng: 88.2333 },
        tier: 'tier2',
        description: 'Stunning Himalayan views and ancient monasteries.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&q=80',
    },
    // MEGHALAYA
    {
        name: 'Shillong',
        stateCode: 'MEGHALAYA',
        coordinates: { lat: 25.5788, lng: 91.8933 },
        tier: 'tier1',
        description: 'Scotland of the East, music and waterfalls.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&q=80',
    },
    {
        name: 'Cherrapunji',
        stateCode: 'MEGHALAYA',
        coordinates: { lat: 25.2700, lng: 91.7200 },
        tier: 'tier2',
        description: 'Wettest place on Earth, living root bridges.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&q=80',
    },
    // UTTARAKHAND
    {
        name: 'Rishikesh',
        stateCode: 'UTTARAKHAN',
        coordinates: { lat: 30.0869, lng: 78.2676 },
        tier: 'tier1',
        description: 'Yoga Capital of the World, adventure sports hub.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80',
    },
    {
        name: 'Haridwar',
        stateCode: 'UTTARAKHAN',
        coordinates: { lat: 29.9457, lng: 78.1642 },
        tier: 'tier1',
        description: 'Gateway to Gods, famous Ganga Aarti at Har Ki Pauri.',
        idealDays: 1,
        imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80',
    },
    {
        name: 'Nainital',
        stateCode: 'UTTARAKHAN',
        coordinates: { lat: 29.3919, lng: 79.4542 },
        tier: 'tier2',
        description: 'Lake District of India, scenic Naini Lake.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80',
    },
    {
        name: 'Mussoorie',
        stateCode: 'UTTARAKHAN',
        coordinates: { lat: 30.4598, lng: 78.0644 },
        tier: 'tier2',
        description: 'Queen of the Hills, colonial hill station.',
        idealDays: 2,
        imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80',
    },
];

// --- PLACES DATA ---
const PLACES_DATA = [
    // JAIPUR
    { name: 'Amber Fort', cityName: 'Jaipur', type: 'Fort', coordinates: { lat: 26.9855, lng: 75.8513 }, description: 'Magnificent hilltop fort with stunning architecture.', visitDuration: '3 hours', timeRequired: 3, openingTime: '08:00', closingTime: '17:30', bestTimeOfDay: 'morning', rating: 4.8, tags: ['history', 'photography'], priceTier: 'medium' },
    { name: 'Hawa Mahal', cityName: 'Jaipur', type: 'Palace', coordinates: { lat: 26.9239, lng: 75.8267 }, description: 'Iconic pink palace with 953 windows.', visitDuration: '1 hour', timeRequired: 1, openingTime: '09:00', closingTime: '16:30', bestTimeOfDay: 'morning', rating: 4.5, tags: ['architecture', 'iconic'], priceTier: 'low' },
    { name: 'City Palace Jaipur', cityName: 'Jaipur', type: 'Palace', coordinates: { lat: 26.9258, lng: 75.8237 }, description: 'Royal palace complex with museums.', visitDuration: '2 hours', timeRequired: 2, openingTime: '09:30', closingTime: '17:00', bestTimeOfDay: 'afternoon', rating: 4.6, tags: ['history', 'museum'], priceTier: 'high' },
    { name: 'Nahargarh Fort', cityName: 'Jaipur', type: 'Fort', coordinates: { lat: 26.9386, lng: 75.8163 }, description: 'Fort with panoramic views, perfect for sunset.', visitDuration: '2 hours', timeRequired: 2, openingTime: '10:00', closingTime: '22:00', bestTimeOfDay: 'evening', rating: 4.5, tags: ['views', 'sunset'], priceTier: 'medium' },
    // UDAIPUR
    { name: 'City Palace Udaipur', cityName: 'Udaipur', type: 'Palace', coordinates: { lat: 24.5764, lng: 73.6835 }, description: 'Grand palace on Lake Pichola.', visitDuration: '3 hours', timeRequired: 3, openingTime: '09:30', closingTime: '17:30', bestTimeOfDay: 'morning', rating: 4.7, tags: ['history', 'lake_view'], priceTier: 'high' },
    { name: 'Lake Pichola', cityName: 'Udaipur', type: 'Lake', coordinates: { lat: 24.5726, lng: 73.6744 }, description: 'Artificial lake with boat rides.', visitDuration: '2 hours', timeRequired: 2, openingTime: '00:00', closingTime: '23:59', bestTimeOfDay: 'evening', rating: 4.8, tags: ['nature', 'romantic'], priceTier: 'medium' },
    // JODHPUR
    { name: 'Mehrangarh Fort', cityName: 'Jodhpur', type: 'Fort', coordinates: { lat: 26.2975, lng: 73.0185 }, description: 'One of the largest forts in India.', visitDuration: '3 hours', timeRequired: 3, openingTime: '09:00', closingTime: '17:00', bestTimeOfDay: 'morning', rating: 4.9, tags: ['history', 'must-visit'], priceTier: 'medium' },
    { name: 'Umaid Bhawan Palace', cityName: 'Jodhpur', type: 'Palace', coordinates: { lat: 26.2808, lng: 73.0474 }, description: 'Art Deco palace and museum.', visitDuration: '2 hours', timeRequired: 2, openingTime: '10:00', closingTime: '16:30', bestTimeOfDay: 'any', rating: 4.6, tags: ['luxury', 'museum'], priceTier: 'high' },
    // JAISALMER
    { name: 'Jaisalmer Fort', cityName: 'Jaisalmer', type: 'Fort', coordinates: { lat: 26.9124, lng: 70.9127 }, description: 'Living fort with residents inside.', visitDuration: '3 hours', timeRequired: 3, openingTime: '00:00', closingTime: '23:59', bestTimeOfDay: 'morning', rating: 4.7, tags: ['history', 'living_fort'], priceTier: 'free' },
    { name: 'Sam Sand Dunes', cityName: 'Jaisalmer', type: 'Desert', coordinates: { lat: 26.8375, lng: 70.5283 }, description: 'Dunes for camel rides and camping.', visitDuration: '4 hours', timeRequired: 4, openingTime: '00:00', closingTime: '23:59', bestTimeOfDay: 'evening', rating: 4.6, tags: ['adventure', 'sunset'], priceTier: 'medium' },
    // KERALA
    { name: 'Tea Museum Munnar', cityName: 'Munnar', type: 'Museum', coordinates: { lat: 10.0889, lng: 77.0595 }, description: 'Learn about tea production.', visitDuration: '1 hour', timeRequired: 1, openingTime: '09:00', closingTime: '17:00', bestTimeOfDay: 'morning', rating: 4.4, tags: ['nature', 'tea'], priceTier: 'low' },
    { name: 'Alleppey Backwaters', cityName: 'Alleppey', type: 'Lake', coordinates: { lat: 9.4981, lng: 76.3388 }, description: 'Famous houseboat cruises.', visitDuration: '4 hours', timeRequired: 4, openingTime: '00:00', closingTime: '23:59', bestTimeOfDay: 'evening', rating: 4.8, tags: ['nature', 'romantic'], priceTier: 'medium' },
    { name: 'Chinese Fishing Nets', cityName: 'Kochi', type: 'Landmark', coordinates: { lat: 9.9639, lng: 76.2424 }, description: 'Iconic fishing nets.', visitDuration: '1 hour', timeRequired: 1, openingTime: '00:00', closingTime: '23:59', bestTimeOfDay: 'evening', rating: 4.3, tags: ['iconic', 'photography'], priceTier: 'free' },
    // GOA
    { name: 'Calangute Beach', cityName: 'North Goa', type: 'Beach', coordinates: { lat: 15.5449, lng: 73.7551 }, description: 'Queen of Goan beaches.', visitDuration: '3 hours', timeRequired: 3, openingTime: '00:00', closingTime: '23:59', bestTimeOfDay: 'evening', rating: 4.3, tags: ['beach', 'nightlife'], priceTier: 'low' },
    { name: 'Basilica of Bom Jesus', cityName: 'Old Goa', type: 'Church', coordinates: { lat: 15.5009, lng: 73.9116 }, description: 'UNESCO World Heritage church.', visitDuration: '1 hour', timeRequired: 1, openingTime: '09:00', closingTime: '18:30', bestTimeOfDay: 'morning', rating: 4.6, tags: ['heritage', 'UNESCO'], priceTier: 'free' },
    // MAHARASHTRA
    { name: 'Gateway of India', cityName: 'Mumbai', type: 'Monument', coordinates: { lat: 18.9220, lng: 72.8347 }, description: 'Iconic arch monument.', visitDuration: '1 hour', timeRequired: 1, openingTime: '00:00', closingTime: '23:59', bestTimeOfDay: 'evening', rating: 4.5, tags: ['landmark', 'iconic'], priceTier: 'free' },
    { name: 'Elephanta Caves', cityName: 'Mumbai', type: 'Cave', coordinates: { lat: 18.9633, lng: 72.9315 }, description: 'UNESCO cave temples.', visitDuration: '3 hours', timeRequired: 3, openingTime: '09:00', closingTime: '17:00', bestTimeOfDay: 'morning', rating: 4.4, tags: ['heritage', 'UNESCO'], priceTier: 'medium' },
    { name: 'Ajanta Caves', cityName: 'Aurangabad', type: 'Cave', coordinates: { lat: 20.5519, lng: 75.7033 }, description: 'UNESCO Buddhist cave paintings.', visitDuration: '4 hours', timeRequired: 4, openingTime: '09:00', closingTime: '17:00', bestTimeOfDay: 'morning', rating: 4.7, tags: ['heritage', 'UNESCO'], priceTier: 'medium' },
    // TAMIL NADU
    { name: 'Marina Beach', cityName: 'Chennai', type: 'Beach', coordinates: { lat: 13.0500, lng: 80.2824 }, description: 'One of the longest urban beaches.', visitDuration: '2 hours', timeRequired: 2, openingTime: '00:00', closingTime: '23:59', bestTimeOfDay: 'evening', rating: 4.4, tags: ['beach'], priceTier: 'free' },
    { name: 'Meenakshi Amman Temple', cityName: 'Madurai', type: 'Temple', coordinates: { lat: 9.9195, lng: 78.1193 }, description: 'Ancient temple with stunning gopurams.', visitDuration: '2 hours', timeRequired: 2, openingTime: '05:00', closingTime: '21:00', bestTimeOfDay: 'morning', rating: 4.8, tags: ['religious', 'heritage'], priceTier: 'free' },
    // WEST BENGAL
    { name: 'Victoria Memorial', cityName: 'Kolkata', type: 'Monument', coordinates: { lat: 22.5448, lng: 88.3426 }, description: 'Marble monument and museum.', visitDuration: '2 hours', timeRequired: 2, openingTime: '10:00', closingTime: '18:00', bestTimeOfDay: 'afternoon', rating: 4.7, tags: ['heritage', 'museum'], priceTier: 'medium' },
    { name: 'Howrah Bridge', cityName: 'Kolkata', type: 'Landmark', coordinates: { lat: 22.5851, lng: 88.3468 }, description: 'Iconic cantilever bridge.', visitDuration: '1 hour', timeRequired: 1, openingTime: '00:00', closingTime: '23:59', bestTimeOfDay: 'evening', rating: 4.5, tags: ['landmark', 'iconic'], priceTier: 'free' },
    { name: 'Tiger Hill', cityName: 'Darjeeling', type: 'Viewpoint', coordinates: { lat: 26.9959, lng: 88.2644 }, description: 'Famous sunrise viewpoint.', visitDuration: '2 hours', timeRequired: 2, openingTime: '04:00', closingTime: '08:00', bestTimeOfDay: 'morning', rating: 4.6, tags: ['views', 'sunrise'], priceTier: 'low' },
    // KARNATAKA
    { name: 'Mysore Palace', cityName: 'Mysore', type: 'Palace', coordinates: { lat: 12.3052, lng: 76.6552 }, description: 'Royal palace famous for Dasara.', visitDuration: '2 hours', timeRequired: 2, openingTime: '10:00', closingTime: '17:30', bestTimeOfDay: 'morning', rating: 4.7, tags: ['heritage', 'royal'], priceTier: 'medium' },
    { name: 'Hampi Ruins', cityName: 'Hampi', type: 'Heritage', coordinates: { lat: 15.3350, lng: 76.4600 }, description: 'UNESCO Vijayanagara ruins.', visitDuration: '6 hours', timeRequired: 6, openingTime: '06:00', closingTime: '18:00', bestTimeOfDay: 'morning', rating: 4.8, tags: ['heritage', 'UNESCO'], priceTier: 'low' },
    { name: 'Lalbagh Botanical Garden', cityName: 'Bangalore', type: 'Garden', coordinates: { lat: 12.9507, lng: 77.5848 }, description: 'Historic garden with glass house.', visitDuration: '2 hours', timeRequired: 2, openingTime: '06:00', closingTime: '19:00', bestTimeOfDay: 'morning', rating: 4.5, tags: ['nature'], priceTier: 'low' },
    // GUJARAT
    { name: 'Statue of Unity', cityName: 'Kevadia', type: 'Monument', coordinates: { lat: 21.8380, lng: 73.7191 }, description: "World's tallest statue.", visitDuration: '3 hours', timeRequired: 3, openingTime: '08:00', closingTime: '18:00', bestTimeOfDay: 'morning', rating: 4.6, tags: ['landmark', 'modern'], priceTier: 'medium' },
    { name: 'Rann of Kutch', cityName: 'Kutch', type: 'Desert', coordinates: { lat: 23.7337, lng: 69.8597 }, description: 'Vast white salt desert.', visitDuration: '4 hours', timeRequired: 4, openingTime: '00:00', closingTime: '23:59', bestTimeOfDay: 'evening', rating: 4.7, tags: ['nature', 'unique'], priceTier: 'medium' },
    { name: 'Sabarmati Ashram', cityName: 'Ahmedabad', type: 'Museum', coordinates: { lat: 23.0607, lng: 72.5804 }, description: "Gandhi's former home.", visitDuration: '1.5 hours', timeRequired: 1.5, openingTime: '08:30', closingTime: '18:30', bestTimeOfDay: 'morning', rating: 4.6, tags: ['history', 'Gandhi'], priceTier: 'free' },
    // UTTAR PRADESH
    { name: 'Taj Mahal', cityName: 'Agra', type: 'Monument', coordinates: { lat: 27.1751, lng: 78.0421 }, description: 'Iconic marble mausoleum.', visitDuration: '3 hours', timeRequired: 3, openingTime: '06:00', closingTime: '18:30', bestTimeOfDay: 'morning', rating: 4.9, tags: ['UNESCO', 'must-visit'], priceTier: 'high' },
    { name: 'Agra Fort', cityName: 'Agra', type: 'Fort', coordinates: { lat: 27.1795, lng: 78.0211 }, description: 'UNESCO Mughal fort.', visitDuration: '2 hours', timeRequired: 2, openingTime: '06:00', closingTime: '18:00', bestTimeOfDay: 'morning', rating: 4.6, tags: ['UNESCO', 'history'], priceTier: 'medium' },
    { name: 'Dashashwamedh Ghat', cityName: 'Varanasi', type: 'Ghat', coordinates: { lat: 25.3109, lng: 83.0107 }, description: 'Main ghat for Ganga Aarti.', visitDuration: '2 hours', timeRequired: 2, openingTime: '00:00', closingTime: '23:59', bestTimeOfDay: 'evening', rating: 4.7, tags: ['religious', 'spiritual'], priceTier: 'free' },
    // DELHI
    { name: 'Red Fort', cityName: 'Delhi', type: 'Fort', coordinates: { lat: 28.6562, lng: 77.2410 }, description: 'Iconic Mughal fort, UNESCO site.', visitDuration: '2 hours', timeRequired: 2, openingTime: '09:30', closingTime: '16:30', bestTimeOfDay: 'morning', rating: 4.5, tags: ['heritage', 'UNESCO'], priceTier: 'medium' },
    { name: 'India Gate', cityName: 'Delhi', type: 'Monument', coordinates: { lat: 28.6129, lng: 77.2295 }, description: 'War memorial and landmark.', visitDuration: '1 hour', timeRequired: 1, openingTime: '00:00', closingTime: '23:59', bestTimeOfDay: 'evening', rating: 4.6, tags: ['landmark', 'iconic'], priceTier: 'free' },
    { name: 'Qutub Minar', cityName: 'Delhi', type: 'Monument', coordinates: { lat: 28.5245, lng: 77.1855 }, description: 'UNESCO site, tallest brick minaret.', visitDuration: '1.5 hours', timeRequired: 1.5, openingTime: '07:00', closingTime: '17:00', bestTimeOfDay: 'morning', rating: 4.5, tags: ['heritage', 'UNESCO'], priceTier: 'medium' },
    // KASHMIR
    { name: 'Dal Lake', cityName: 'Srinagar', type: 'Lake', coordinates: { lat: 34.0837, lng: 74.8600 }, description: 'Jewel of Srinagar with shikaras and houseboats.', visitDuration: '3 hours', timeRequired: 3, openingTime: '00:00', closingTime: '23:59', bestTimeOfDay: 'evening', rating: 4.9, tags: ['nature', 'romantic', 'iconic'], priceTier: 'medium' },
    { name: 'Mughal Gardens', cityName: 'Srinagar', type: 'Garden', coordinates: { lat: 34.0850, lng: 74.8380 }, description: 'Beautiful Mughal-era terraced gardens.', visitDuration: '2 hours', timeRequired: 2, openingTime: '09:00', closingTime: '19:00', bestTimeOfDay: 'morning', rating: 4.6, tags: ['nature', 'heritage'], priceTier: 'low' },
    { name: 'Gulmarg Gondola', cityName: 'Gulmarg', type: 'Adventure', coordinates: { lat: 34.0500, lng: 74.3900 }, description: 'One of the highest cable cars in the world.', visitDuration: '4 hours', timeRequired: 4, openingTime: '09:00', closingTime: '17:00', bestTimeOfDay: 'morning', rating: 4.8, tags: ['adventure', 'views', 'skiing'], priceTier: 'high' },
    { name: 'Betaab Valley', cityName: 'Pahalgam', type: 'Valley', coordinates: { lat: 34.0200, lng: 75.3100 }, description: 'Picturesque valley named after Bollywood movie.', visitDuration: '2 hours', timeRequired: 2, openingTime: '00:00', closingTime: '23:59', bestTimeOfDay: 'afternoon', rating: 4.5, tags: ['nature', 'photography'], priceTier: 'low' },
    // LADAKH
    { name: 'Pangong Tso', cityName: 'Pangong Lake', type: 'Lake', coordinates: { lat: 33.7595, lng: 78.6615 }, description: 'Stunning high-altitude lake with changing colors.', visitDuration: '4 hours', timeRequired: 4, openingTime: '00:00', closingTime: '23:59', bestTimeOfDay: 'morning', rating: 4.9, tags: ['nature', 'photography', 'iconic'], priceTier: 'medium' },
    { name: 'Thiksey Monastery', cityName: 'Leh', type: 'Monastery', coordinates: { lat: 33.9135, lng: 77.6660 }, description: 'Stunning 12-story monastery resembling Potala Palace.', visitDuration: '2 hours', timeRequired: 2, openingTime: '06:00', closingTime: '18:00', bestTimeOfDay: 'morning', rating: 4.7, tags: ['religious', 'heritage'], priceTier: 'low' },
    { name: 'Shanti Stupa', cityName: 'Leh', type: 'Monument', coordinates: { lat: 34.1638, lng: 77.5850 }, description: 'White-domed Buddhist stupa with panoramic views.', visitDuration: '1 hour', timeRequired: 1, openingTime: '05:00', closingTime: '21:00', bestTimeOfDay: 'evening', rating: 4.6, tags: ['religious', 'views'], priceTier: 'free' },
    { name: 'Hunder Sand Dunes', cityName: 'Nubra Valley', type: 'Desert', coordinates: { lat: 34.6850, lng: 77.4900 }, description: 'Cold desert with Bactrian camels.', visitDuration: '3 hours', timeRequired: 3, openingTime: '00:00', closingTime: '23:59', bestTimeOfDay: 'evening', rating: 4.5, tags: ['adventure', 'unique'], priceTier: 'medium' },
    // HIMACHAL PRADESH
    { name: 'Mall Road Shimla', cityName: 'Shimla', type: 'Landmark', coordinates: { lat: 31.1048, lng: 77.1734 }, description: 'Main shopping and walking street of Shimla.', visitDuration: '2 hours', timeRequired: 2, openingTime: '00:00', closingTime: '23:59', bestTimeOfDay: 'evening', rating: 4.4, tags: ['shopping', 'walking'], priceTier: 'free' },
    { name: 'Jakhu Temple', cityName: 'Shimla', type: 'Temple', coordinates: { lat: 31.1100, lng: 77.1800 }, description: 'Ancient Hanuman temple with giant statue.', visitDuration: '1.5 hours', timeRequired: 1.5, openingTime: '05:00', closingTime: '21:00', bestTimeOfDay: 'morning', rating: 4.3, tags: ['religious', 'views'], priceTier: 'free' },
    { name: 'Rohtang Pass', cityName: 'Manali', type: 'Mountain Pass', coordinates: { lat: 32.3725, lng: 77.2488 }, description: 'High mountain pass with snow activities.', visitDuration: '4 hours', timeRequired: 4, openingTime: '09:00', closingTime: '16:00', bestTimeOfDay: 'morning', rating: 4.7, tags: ['adventure', 'snow', 'views'], priceTier: 'medium' },
    { name: 'Solang Valley', cityName: 'Manali', type: 'Valley', coordinates: { lat: 32.3167, lng: 77.1500 }, description: 'Adventure sports hub with paragliding and skiing.', visitDuration: '4 hours', timeRequired: 4, openingTime: '00:00', closingTime: '23:59', bestTimeOfDay: 'morning', rating: 4.6, tags: ['adventure', 'nature'], priceTier: 'medium' },
    { name: 'McLeod Ganj', cityName: 'Dharamshala', type: 'Town', coordinates: { lat: 32.2379, lng: 76.3234 }, description: 'Little Lhasa, home to Dalai Lama.', visitDuration: '4 hours', timeRequired: 4, openingTime: '00:00', closingTime: '23:59', bestTimeOfDay: 'morning', rating: 4.7, tags: ['spiritual', 'Tibetan', 'culture'], priceTier: 'free' },
    { name: 'Kheerganga', cityName: 'Kasol', type: 'Trek', coordinates: { lat: 32.0500, lng: 77.5000 }, description: 'Popular trek with hot springs at the top.', visitDuration: '8 hours', timeRequired: 8, openingTime: '00:00', closingTime: '23:59', bestTimeOfDay: 'morning', rating: 4.8, tags: ['trekking', 'adventure'], priceTier: 'low' },
    // PUNJAB
    { name: 'Golden Temple', cityName: 'Amritsar', type: 'Temple', coordinates: { lat: 31.6200, lng: 74.8765 }, description: 'Holiest Gurdwara and spiritual center of Sikhism.', visitDuration: '3 hours', timeRequired: 3, openingTime: '00:00', closingTime: '23:59', bestTimeOfDay: 'evening', rating: 4.9, tags: ['religious', 'must-visit', 'iconic'], priceTier: 'free' },
    { name: 'Jallianwala Bagh', cityName: 'Amritsar', type: 'Memorial', coordinates: { lat: 31.6208, lng: 74.8797 }, description: 'Historic memorial of the 1919 massacre.', visitDuration: '1 hour', timeRequired: 1, openingTime: '06:30', closingTime: '19:30', bestTimeOfDay: 'morning', rating: 4.5, tags: ['history', 'memorial'], priceTier: 'free' },
    { name: 'Wagah Border', cityName: 'Amritsar', type: 'Landmark', coordinates: { lat: 31.6047, lng: 74.5734 }, description: 'Famous border ceremony with Pakistan.', visitDuration: '3 hours', timeRequired: 3, openingTime: '16:00', closingTime: '18:00', bestTimeOfDay: 'evening', rating: 4.7, tags: ['unique', 'patriotic'], priceTier: 'free' },
    { name: 'Rock Garden', cityName: 'Chandigarh', type: 'Garden', coordinates: { lat: 30.7525, lng: 76.8086 }, description: 'Sculpture garden made from recycled materials.', visitDuration: '2 hours', timeRequired: 2, openingTime: '09:00', closingTime: '19:00', bestTimeOfDay: 'afternoon', rating: 4.5, tags: ['art', 'unique'], priceTier: 'low' },
    // UTTARAKHAND
    { name: 'Laxman Jhula', cityName: 'Rishikesh', type: 'Bridge', coordinates: { lat: 30.1200, lng: 78.3200 }, description: 'Iconic suspension bridge over Ganges.', visitDuration: '1 hour', timeRequired: 1, openingTime: '00:00', closingTime: '23:59', bestTimeOfDay: 'evening', rating: 4.5, tags: ['iconic', 'religious'], priceTier: 'free' },
    { name: 'Triveni Ghat', cityName: 'Rishikesh', type: 'Ghat', coordinates: { lat: 30.1040, lng: 78.2933 }, description: 'Sacred bathing ghat on River Ganges.', visitDuration: '1.5 hours', timeRequired: 1.5, openingTime: '00:00', closingTime: '23:59', bestTimeOfDay: 'evening', rating: 4.6, tags: ['religious', 'spiritual'], priceTier: 'free' },
    { name: 'Har Ki Pauri', cityName: 'Haridwar', type: 'Ghat', coordinates: { lat: 29.9570, lng: 78.1540 }, description: 'Sacred ghat for evening Ganga Aarti.', visitDuration: '2 hours', timeRequired: 2, openingTime: '00:00', closingTime: '23:59', bestTimeOfDay: 'evening', rating: 4.8, tags: ['religious', 'must-visit'], priceTier: 'free' },
    { name: 'Naini Lake', cityName: 'Nainital', type: 'Lake', coordinates: { lat: 29.3919, lng: 79.4630 }, description: 'Beautiful emerald lake surrounded by hills.', visitDuration: '2 hours', timeRequired: 2, openingTime: '06:00', closingTime: '18:00', bestTimeOfDay: 'morning', rating: 4.6, tags: ['nature', 'boating'], priceTier: 'low' },
    { name: 'Kempty Falls', cityName: 'Mussoorie', type: 'Waterfall', coordinates: { lat: 30.4833, lng: 78.0333 }, description: 'Popular waterfall near Mussoorie.', visitDuration: '1.5 hours', timeRequired: 1.5, openingTime: '08:00', closingTime: '18:00', bestTimeOfDay: 'morning', rating: 4.3, tags: ['nature', 'waterfall'], priceTier: 'low' },
    // ODISHA
    { name: 'Jagannath Temple', cityName: 'Puri', type: 'Temple', coordinates: { lat: 19.8048, lng: 85.8180 }, description: 'Sacred Hindu temple, one of Char Dhams.', visitDuration: '2 hours', timeRequired: 2, openingTime: '05:00', closingTime: '23:00', bestTimeOfDay: 'morning', rating: 4.8, tags: ['religious', 'heritage'], priceTier: 'free' },
    { name: 'Konark Sun Temple', cityName: 'Konark', type: 'Temple', coordinates: { lat: 19.8876, lng: 86.0945 }, description: 'UNESCO site, 13th century sun temple.', visitDuration: '2 hours', timeRequired: 2, openingTime: '06:00', closingTime: '20:00', bestTimeOfDay: 'morning', rating: 4.7, tags: ['heritage', 'UNESCO'], priceTier: 'medium' },
    { name: 'Lingaraja Temple', cityName: 'Bhubaneswar', type: 'Temple', coordinates: { lat: 20.2359, lng: 85.8315 }, description: 'Finest example of Kalinga architecture.', visitDuration: '1.5 hours', timeRequired: 1.5, openingTime: '05:00', closingTime: '21:00', bestTimeOfDay: 'morning', rating: 4.6, tags: ['religious', 'heritage'], priceTier: 'free' },
    // TELANGANA
    { name: 'Charminar', cityName: 'Hyderabad', type: 'Monument', coordinates: { lat: 17.3616, lng: 78.4747 }, description: 'Iconic mosque and monument of Hyderabad.', visitDuration: '1 hour', timeRequired: 1, openingTime: '09:30', closingTime: '17:30', bestTimeOfDay: 'morning', rating: 4.5, tags: ['heritage', 'iconic'], priceTier: 'low' },
    { name: 'Golconda Fort', cityName: 'Hyderabad', type: 'Fort', coordinates: { lat: 17.3833, lng: 78.4011 }, description: 'Medieval fortress with acoustic architecture.', visitDuration: '3 hours', timeRequired: 3, openingTime: '08:00', closingTime: '17:30', bestTimeOfDay: 'morning', rating: 4.6, tags: ['heritage', 'history'], priceTier: 'medium' },
    // ASSAM & NORTHEAST
    { name: 'Kamakhya Temple', cityName: 'Guwahati', type: 'Temple', coordinates: { lat: 26.1664, lng: 91.7053 }, description: 'Ancient Shakti Peetha on Nilachal Hill.', visitDuration: '2 hours', timeRequired: 2, openingTime: '05:30', closingTime: '22:00', bestTimeOfDay: 'morning', rating: 4.6, tags: ['religious', 'heritage'], priceTier: 'free' },
    { name: 'Kaziranga Safari', cityName: 'Kaziranga', type: 'Safari', coordinates: { lat: 26.5775, lng: 93.1711 }, description: 'Elephant and jeep safaris to see rhinos.', visitDuration: '4 hours', timeRequired: 4, openingTime: '05:30', closingTime: '10:00', bestTimeOfDay: 'morning', rating: 4.8, tags: ['wildlife', 'UNESCO'], priceTier: 'high' },
    { name: 'MG Marg', cityName: 'Gangtok', type: 'Landmark', coordinates: { lat: 27.3314, lng: 88.6138 }, description: 'Clean pedestrian street in heart of Gangtok.', visitDuration: '2 hours', timeRequired: 2, openingTime: '00:00', closingTime: '23:59', bestTimeOfDay: 'evening', rating: 4.4, tags: ['shopping', 'walking'], priceTier: 'free' },
    { name: 'Tsomgo Lake', cityName: 'Gangtok', type: 'Lake', coordinates: { lat: 27.3753, lng: 88.7608 }, description: 'Glacial lake at 12,400 ft altitude.', visitDuration: '2 hours', timeRequired: 2, openingTime: '06:00', closingTime: '15:00', bestTimeOfDay: 'morning', rating: 4.6, tags: ['nature', 'scenic'], priceTier: 'medium' },
    { name: 'Living Root Bridges', cityName: 'Cherrapunji', type: 'Natural Wonder', coordinates: { lat: 25.2850, lng: 91.7300 }, description: 'Unique bridges made from living tree roots.', visitDuration: '4 hours', timeRequired: 4, openingTime: '00:00', closingTime: '23:59', bestTimeOfDay: 'morning', rating: 4.9, tags: ['nature', 'unique', 'trekking'], priceTier: 'low' },
    { name: 'Elephant Falls', cityName: 'Shillong', type: 'Waterfall', coordinates: { lat: 25.5377, lng: 91.8410 }, description: 'Three-tiered waterfall near Shillong.', visitDuration: '1 hour', timeRequired: 1, openingTime: '09:00', closingTime: '17:00', bestTimeOfDay: 'morning', rating: 4.3, tags: ['nature', 'waterfall'], priceTier: 'low' },
];

// --- ROUTES DATA ---
const ROUTES_DATA = [
    // Rajasthan
    { fromCity: 'Jaipur', toCity: 'Udaipur', distance: 393, transportOptions: [{ mode: 'road', duration: 6.5, estimatedCost: { min: 800, max: 1500 }, frequency: 'Continuous', comfort: 'standard' }, { mode: 'bus', duration: 7, estimatedCost: { min: 400, max: 800 }, frequency: 'Hourly', comfort: 'budget' }] },
    { fromCity: 'Jaipur', toCity: 'Jodhpur', distance: 335, transportOptions: [{ mode: 'road', duration: 5.5, estimatedCost: { min: 700, max: 1400 }, frequency: 'Continuous', comfort: 'standard' }, { mode: 'train', duration: 5, estimatedCost: { min: 300, max: 1500 }, frequency: '4 daily', comfort: 'standard' }] },
    { fromCity: 'Jodhpur', toCity: 'Jaisalmer', distance: 285, transportOptions: [{ mode: 'road', duration: 5, estimatedCost: { min: 600, max: 1200 }, frequency: 'Continuous', comfort: 'standard' }] },
    { fromCity: 'Udaipur', toCity: 'Jodhpur', distance: 250, transportOptions: [{ mode: 'road', duration: 4.5, estimatedCost: { min: 500, max: 1000 }, frequency: 'Continuous', comfort: 'standard' }] },
    // Delhi connections
    { fromCity: 'Delhi', toCity: 'Jaipur', distance: 280, transportOptions: [{ mode: 'road', duration: 5, estimatedCost: { min: 600, max: 1200 }, frequency: 'Continuous', comfort: 'standard' }, { mode: 'train', duration: 4.5, estimatedCost: { min: 300, max: 2000 }, frequency: '10+ daily', comfort: 'standard' }] },
    { fromCity: 'Delhi', toCity: 'Agra', distance: 230, transportOptions: [{ mode: 'road', duration: 3.5, estimatedCost: { min: 500, max: 1000 }, frequency: 'Continuous', comfort: 'standard' }, { mode: 'train', duration: 2, estimatedCost: { min: 400, max: 1500 }, frequency: 'Hourly', comfort: 'standard' }] },
    { fromCity: 'Agra', toCity: 'Varanasi', distance: 565, transportOptions: [{ mode: 'road', duration: 10, estimatedCost: { min: 1200, max: 2500 }, frequency: 'Continuous', comfort: 'standard' }, { mode: 'train', duration: 8, estimatedCost: { min: 400, max: 2000 }, frequency: '5 daily', comfort: 'standard' }] },
    // Kerala
    { fromCity: 'Kochi', toCity: 'Munnar', distance: 130, transportOptions: [{ mode: 'road', duration: 4, estimatedCost: { min: 400, max: 800 }, frequency: 'Continuous', comfort: 'standard' }] },
    { fromCity: 'Kochi', toCity: 'Alleppey', distance: 53, transportOptions: [{ mode: 'road', duration: 1.5, estimatedCost: { min: 200, max: 400 }, frequency: 'Continuous', comfort: 'standard' }] },
    { fromCity: 'Munnar', toCity: 'Alleppey', distance: 170, transportOptions: [{ mode: 'road', duration: 5, estimatedCost: { min: 500, max: 1000 }, frequency: 'Continuous', comfort: 'standard' }] },
    // Karnataka
    { fromCity: 'Bangalore', toCity: 'Mysore', distance: 145, transportOptions: [{ mode: 'road', duration: 3, estimatedCost: { min: 300, max: 600 }, frequency: 'Continuous', comfort: 'standard' }, { mode: 'train', duration: 2.5, estimatedCost: { min: 100, max: 400 }, frequency: 'Hourly', comfort: 'standard' }] },
    { fromCity: 'Bangalore', toCity: 'Hampi', distance: 350, transportOptions: [{ mode: 'road', duration: 6, estimatedCost: { min: 700, max: 1400 }, frequency: 'Continuous', comfort: 'standard' }] },
    // Maharashtra
    { fromCity: 'Mumbai', toCity: 'Pune', distance: 150, transportOptions: [{ mode: 'road', duration: 3, estimatedCost: { min: 300, max: 600 }, frequency: 'Continuous', comfort: 'standard' }, { mode: 'train', duration: 3.5, estimatedCost: { min: 100, max: 300 }, frequency: 'Every 30 min', comfort: 'standard' }] },
    { fromCity: 'Mumbai', toCity: 'North Goa', distance: 590, transportOptions: [{ mode: 'road', duration: 10, estimatedCost: { min: 1200, max: 2500 }, frequency: 'Continuous', comfort: 'standard' }, { mode: 'flight', duration: 1, estimatedCost: { min: 2000, max: 5000 }, frequency: '5 daily', comfort: 'premium' }] },
    { fromCity: 'Pune', toCity: 'Aurangabad', distance: 235, transportOptions: [{ mode: 'road', duration: 4.5, estimatedCost: { min: 500, max: 1000 }, frequency: 'Continuous', comfort: 'standard' }] },
    // Goa
    { fromCity: 'North Goa', toCity: 'Old Goa', distance: 15, transportOptions: [{ mode: 'road', duration: 0.5, estimatedCost: { min: 50, max: 150 }, frequency: 'Continuous', comfort: 'standard' }] },
    // Gujarat
    { fromCity: 'Ahmedabad', toCity: 'Kutch', distance: 400, transportOptions: [{ mode: 'road', duration: 7, estimatedCost: { min: 800, max: 1600 }, frequency: 'Continuous', comfort: 'standard' }] },
    { fromCity: 'Ahmedabad', toCity: 'Kevadia', distance: 200, transportOptions: [{ mode: 'road', duration: 3.5, estimatedCost: { min: 400, max: 800 }, frequency: 'Continuous', comfort: 'standard' }] },
    // West Bengal
    { fromCity: 'Kolkata', toCity: 'Darjeeling', distance: 600, transportOptions: [{ mode: 'road', duration: 12, estimatedCost: { min: 1200, max: 2500 }, frequency: 'Continuous', comfort: 'standard' }, { mode: 'train', duration: 10, estimatedCost: { min: 400, max: 1500 }, frequency: '1 daily', comfort: 'standard' }] },
    // Tamil Nadu
    { fromCity: 'Chennai', toCity: 'Madurai', distance: 460, transportOptions: [{ mode: 'road', duration: 8, estimatedCost: { min: 900, max: 1800 }, frequency: 'Continuous', comfort: 'standard' }, { mode: 'train', duration: 7, estimatedCost: { min: 300, max: 1200 }, frequency: '5 daily', comfort: 'standard' }] },
    // Cross-state major routes
    { fromCity: 'Delhi', toCity: 'Mumbai', distance: 1400, transportOptions: [{ mode: 'flight', duration: 2, estimatedCost: { min: 3000, max: 10000 }, frequency: 'Every 30 min', comfort: 'premium' }, { mode: 'train', duration: 16, estimatedCost: { min: 500, max: 3000 }, frequency: '6 daily', comfort: 'standard' }] },
    { fromCity: 'Delhi', toCity: 'Kolkata', distance: 1500, transportOptions: [{ mode: 'flight', duration: 2, estimatedCost: { min: 3000, max: 10000 }, frequency: 'Hourly', comfort: 'premium' }, { mode: 'train', duration: 17, estimatedCost: { min: 500, max: 3000 }, frequency: '10 daily', comfort: 'standard' }] },
    { fromCity: 'Mumbai', toCity: 'Bangalore', distance: 980, transportOptions: [{ mode: 'flight', duration: 1.5, estimatedCost: { min: 2500, max: 8000 }, frequency: 'Every 30 min', comfort: 'premium' }, { mode: 'train', duration: 12, estimatedCost: { min: 400, max: 2000 }, frequency: '4 daily', comfort: 'standard' }] },
    { fromCity: 'Chennai', toCity: 'Bangalore', distance: 350, transportOptions: [{ mode: 'road', duration: 6, estimatedCost: { min: 700, max: 1400 }, frequency: 'Continuous', comfort: 'standard' }, { mode: 'train', duration: 5, estimatedCost: { min: 200, max: 800 }, frequency: 'Hourly', comfort: 'standard' }] },
    // Kashmir & Ladakh
    { fromCity: 'Delhi', toCity: 'Srinagar', distance: 876, transportOptions: [{ mode: 'flight', duration: 1.5, estimatedCost: { min: 3000, max: 8000 }, frequency: '10 daily', comfort: 'premium' }] },
    { fromCity: 'Srinagar', toCity: 'Gulmarg', distance: 51, transportOptions: [{ mode: 'road', duration: 1.5, estimatedCost: { min: 400, max: 800 }, frequency: 'Continuous', comfort: 'standard' }] },
    { fromCity: 'Srinagar', toCity: 'Pahalgam', distance: 95, transportOptions: [{ mode: 'road', duration: 2.5, estimatedCost: { min: 500, max: 1000 }, frequency: 'Continuous', comfort: 'standard' }] },
    { fromCity: 'Delhi', toCity: 'Leh', distance: 1000, transportOptions: [{ mode: 'flight', duration: 1.5, estimatedCost: { min: 4000, max: 12000 }, frequency: '5 daily', comfort: 'premium' }] },
    { fromCity: 'Leh', toCity: 'Nubra Valley', distance: 150, transportOptions: [{ mode: 'road', duration: 5, estimatedCost: { min: 800, max: 1500 }, frequency: 'Continuous', comfort: 'standard' }] },
    { fromCity: 'Leh', toCity: 'Pangong Lake', distance: 160, transportOptions: [{ mode: 'road', duration: 5, estimatedCost: { min: 800, max: 1500 }, frequency: 'Continuous', comfort: 'standard' }] },
    // Himachal Pradesh
    { fromCity: 'Delhi', toCity: 'Shimla', distance: 350, transportOptions: [{ mode: 'road', duration: 7, estimatedCost: { min: 700, max: 1400 }, frequency: 'Continuous', comfort: 'standard' }, { mode: 'train', duration: 10, estimatedCost: { min: 400, max: 1500 }, frequency: '2 daily', comfort: 'standard' }] },
    { fromCity: 'Delhi', toCity: 'Manali', distance: 540, transportOptions: [{ mode: 'road', duration: 12, estimatedCost: { min: 1000, max: 2000 }, frequency: 'Continuous', comfort: 'standard' }, { mode: 'bus', duration: 13, estimatedCost: { min: 600, max: 1200 }, frequency: 'Hourly', comfort: 'budget' }] },
    { fromCity: 'Shimla', toCity: 'Manali', distance: 250, transportOptions: [{ mode: 'road', duration: 7, estimatedCost: { min: 600, max: 1200 }, frequency: 'Continuous', comfort: 'standard' }] },
    { fromCity: 'Delhi', toCity: 'Dharamshala', distance: 480, transportOptions: [{ mode: 'road', duration: 10, estimatedCost: { min: 900, max: 1800 }, frequency: 'Continuous', comfort: 'standard' }] },
    { fromCity: 'Manali', toCity: 'Kasol', distance: 75, transportOptions: [{ mode: 'road', duration: 2.5, estimatedCost: { min: 300, max: 600 }, frequency: 'Continuous', comfort: 'standard' }] },
    // Punjab & Chandigarh
    { fromCity: 'Delhi', toCity: 'Amritsar', distance: 450, transportOptions: [{ mode: 'road', duration: 8, estimatedCost: { min: 900, max: 1800 }, frequency: 'Continuous', comfort: 'standard' }, { mode: 'train', duration: 6, estimatedCost: { min: 400, max: 1500 }, frequency: '10 daily', comfort: 'standard' }] },
    { fromCity: 'Delhi', toCity: 'Chandigarh', distance: 250, transportOptions: [{ mode: 'road', duration: 4.5, estimatedCost: { min: 500, max: 1000 }, frequency: 'Continuous', comfort: 'standard' }, { mode: 'train', duration: 3, estimatedCost: { min: 300, max: 1000 }, frequency: 'Hourly', comfort: 'standard' }] },
    { fromCity: 'Chandigarh', toCity: 'Shimla', distance: 115, transportOptions: [{ mode: 'road', duration: 3.5, estimatedCost: { min: 400, max: 800 }, frequency: 'Continuous', comfort: 'standard' }] },
    // Uttarakhand
    { fromCity: 'Delhi', toCity: 'Rishikesh', distance: 240, transportOptions: [{ mode: 'road', duration: 5.5, estimatedCost: { min: 500, max: 1000 }, frequency: 'Continuous', comfort: 'standard' }, { mode: 'train', duration: 5, estimatedCost: { min: 300, max: 800 }, frequency: '5 daily', comfort: 'standard' }] },
    { fromCity: 'Delhi', toCity: 'Haridwar', distance: 215, transportOptions: [{ mode: 'road', duration: 5, estimatedCost: { min: 450, max: 900 }, frequency: 'Continuous', comfort: 'standard' }, { mode: 'train', duration: 4.5, estimatedCost: { min: 250, max: 700 }, frequency: 'Hourly', comfort: 'standard' }] },
    { fromCity: 'Haridwar', toCity: 'Rishikesh', distance: 25, transportOptions: [{ mode: 'road', duration: 0.5, estimatedCost: { min: 100, max: 200 }, frequency: 'Continuous', comfort: 'standard' }] },
    { fromCity: 'Delhi', toCity: 'Nainital', distance: 300, transportOptions: [{ mode: 'road', duration: 6, estimatedCost: { min: 600, max: 1200 }, frequency: 'Continuous', comfort: 'standard' }] },
    { fromCity: 'Delhi', toCity: 'Mussoorie', distance: 290, transportOptions: [{ mode: 'road', duration: 6, estimatedCost: { min: 600, max: 1200 }, frequency: 'Continuous', comfort: 'standard' }] },
    // Odisha
    { fromCity: 'Kolkata', toCity: 'Bhubaneswar', distance: 440, transportOptions: [{ mode: 'road', duration: 7, estimatedCost: { min: 800, max: 1600 }, frequency: 'Continuous', comfort: 'standard' }, { mode: 'train', duration: 6, estimatedCost: { min: 400, max: 1200 }, frequency: '10 daily', comfort: 'standard' }] },
    { fromCity: 'Bhubaneswar', toCity: 'Puri', distance: 60, transportOptions: [{ mode: 'road', duration: 1.5, estimatedCost: { min: 200, max: 400 }, frequency: 'Continuous', comfort: 'standard' }] },
    { fromCity: 'Puri', toCity: 'Konark', distance: 35, transportOptions: [{ mode: 'road', duration: 1, estimatedCost: { min: 150, max: 300 }, frequency: 'Continuous', comfort: 'standard' }] },
    // Telangana
    { fromCity: 'Bangalore', toCity: 'Hyderabad', distance: 570, transportOptions: [{ mode: 'road', duration: 8, estimatedCost: { min: 1000, max: 2000 }, frequency: 'Continuous', comfort: 'standard' }, { mode: 'train', duration: 6, estimatedCost: { min: 400, max: 1200 }, frequency: '5 daily', comfort: 'standard' }, { mode: 'flight', duration: 1, estimatedCost: { min: 2000, max: 5000 }, frequency: 'Hourly', comfort: 'premium' }] },
    { fromCity: 'Mumbai', toCity: 'Hyderabad', distance: 710, transportOptions: [{ mode: 'flight', duration: 1.5, estimatedCost: { min: 2500, max: 6000 }, frequency: '10 daily', comfort: 'premium' }, { mode: 'train', duration: 12, estimatedCost: { min: 500, max: 1500 }, frequency: '5 daily', comfort: 'standard' }] },
    // Northeast India
    { fromCity: 'Kolkata', toCity: 'Guwahati', distance: 1000, transportOptions: [{ mode: 'flight', duration: 1.5, estimatedCost: { min: 3000, max: 8000 }, frequency: '5 daily', comfort: 'premium' }, { mode: 'train', duration: 18, estimatedCost: { min: 500, max: 2000 }, frequency: '3 daily', comfort: 'standard' }] },
    { fromCity: 'Guwahati', toCity: 'Kaziranga', distance: 200, transportOptions: [{ mode: 'road', duration: 4, estimatedCost: { min: 500, max: 1000 }, frequency: 'Continuous', comfort: 'standard' }] },
    { fromCity: 'Guwahati', toCity: 'Shillong', distance: 100, transportOptions: [{ mode: 'road', duration: 2.5, estimatedCost: { min: 300, max: 600 }, frequency: 'Continuous', comfort: 'standard' }] },
    { fromCity: 'Shillong', toCity: 'Cherrapunji', distance: 55, transportOptions: [{ mode: 'road', duration: 1.5, estimatedCost: { min: 200, max: 400 }, frequency: 'Continuous', comfort: 'standard' }] },
    { fromCity: 'Kolkata', toCity: 'Gangtok', distance: 600, transportOptions: [{ mode: 'road', duration: 12, estimatedCost: { min: 1200, max: 2500 }, frequency: 'Continuous', comfort: 'standard' }] },
    { fromCity: 'Darjeeling', toCity: 'Gangtok', distance: 100, transportOptions: [{ mode: 'road', duration: 4, estimatedCost: { min: 400, max: 800 }, frequency: 'Continuous', comfort: 'standard' }] },
    { fromCity: 'Gangtok', toCity: 'Pelling', distance: 130, transportOptions: [{ mode: 'road', duration: 4, estimatedCost: { min: 500, max: 1000 }, frequency: 'Continuous', comfort: 'standard' }] },
];

async function seedDatabase() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trip_planner';
        console.log(`Connecting to MongoDB at ${mongoUri}...`);
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        console.log('\nClearing existing data...');
        await City.deleteMany({});
        await Place.deleteMany({});
        await Route.deleteMany({});
        console.log('Cleared existing data');

        console.log('\nSeeding cities...');
        const cities = await City.insertMany(CITIES_DATA);
        console.log(`Inserted ${cities.length} cities`);

        console.log('\nSeeding places...');
        const places = await Place.insertMany(PLACES_DATA);
        console.log(`Inserted ${places.length} places`);

        console.log('\nSeeding routes...');
        const routes = await Route.insertMany(ROUTES_DATA);
        console.log(`Inserted ${routes.length} routes`);

        console.log('\n=== Seed Complete ===');
        console.log(`Cities: ${cities.length}`);
        console.log(`Places: ${places.length}`);
        console.log(`Routes: ${routes.length}`);

        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
