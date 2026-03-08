/**
 * Add more travel packages to the database.
 * Run: npx ts-node src/scripts/addPackages.ts
 */
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Package from '../models/Package';

const NEW_PACKAGES = [
  {
    id: 'golden-triangle',
    title: 'Golden Triangle Classic',
    state: 'Multi-State',
    days: 6,
    price: 28000,
    image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&h=400&fit=crop',
    description: 'The iconic Delhi-Agra-Jaipur circuit covering the Taj Mahal, Amber Fort, and Mughal heritage.',
    tags: ['Heritage', 'Culture', 'Popular'],
    cities: ['Delhi', 'Agra', 'Jaipur'],
  },
  {
    id: 'himachal-adventure',
    title: 'Himachal Mountain Explorer',
    state: 'Himachal Pradesh',
    days: 7,
    price: 22000,
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&h=400&fit=crop',
    description: 'Trek through Shimla, Manali, and Kasol with stunning Himalayan views and adventure sports.',
    tags: ['Adventure', 'Mountains', 'Trekking'],
    cities: ['Shimla', 'Manali', 'Kasol'],
  },
  {
    id: 'varanasi-spiritual',
    title: 'Varanasi Spiritual Journey',
    state: 'Uttar Pradesh',
    days: 4,
    price: 12000,
    image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=600&h=400&fit=crop',
    description: 'Witness the Ganga Aarti, explore ancient temples, and experience the soul of India in Varanasi.',
    tags: ['Spiritual', 'Culture', 'Photography'],
    cities: ['Varanasi'],
  },
  {
    id: 'karnataka-heritage',
    title: 'Karnataka Heritage & Nature',
    state: 'Karnataka',
    days: 6,
    price: 20000,
    image: 'https://images.unsplash.com/photo-1600100397608-69a3f4438d67?w=600&h=400&fit=crop',
    description: 'From the royal Mysore Palace to the ancient ruins of Hampi and the gardens of Bangalore.',
    tags: ['Heritage', 'Nature', 'History'],
    cities: ['Bangalore', 'Mysore', 'Hampi'],
  },
  {
    id: 'gujarat-cultural',
    title: 'Vibrant Gujarat',
    state: 'Gujarat',
    days: 6,
    price: 18000,
    image: 'https://images.unsplash.com/photo-1609947017136-9daf32e2c939?w=600&h=400&fit=crop',
    description: 'Visit the Rann of Kutch, Statue of Unity, Dwarka temple, and the colorful streets of Ahmedabad.',
    tags: ['Culture', 'Spiritual', 'Nature'],
    cities: ['Ahmedabad', 'Kutch', 'Kevadia', 'Dwarka', 'Somnath'],
  },
  {
    id: 'maharashtra-explorer',
    title: 'Maharashtra Highlights',
    state: 'Maharashtra',
    days: 5,
    price: 22000,
    image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&h=400&fit=crop',
    description: 'Mumbai city life, Ajanta-Ellora caves in Aurangabad, and the scenic Western Ghats.',
    tags: ['City', 'Heritage', 'Caves'],
    cities: ['Mumbai', 'Aurangabad'],
  },
  {
    id: 'tamil-nadu-temples',
    title: 'Tamil Nadu Temple Trail',
    state: 'Tamil Nadu',
    days: 5,
    price: 16000,
    image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&h=400&fit=crop',
    description: 'Explore the magnificent Meenakshi Temple in Madurai and the cultural hub of Chennai.',
    tags: ['Spiritual', 'Heritage', 'Culture'],
    cities: ['Chennai', 'Madurai'],
  },
  {
    id: 'madhya-pradesh-heart',
    title: 'Heart of India',
    state: 'Madhya Pradesh',
    days: 6,
    price: 17000,
    image: 'https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=600&h=400&fit=crop',
    description: 'Khajuraho temples, the holy city of Ujjain, Bhopal lakes, and medieval Orchha.',
    tags: ['Heritage', 'Spiritual', 'History'],
    cities: ['Bhopal', 'Khajuraho', 'Ujjain', 'Orchha'],
  },
  {
    id: 'rajasthan-desert-safari',
    title: 'Rajasthan Desert Safari',
    state: 'Rajasthan',
    days: 5,
    price: 20000,
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=600&h=400&fit=crop',
    description: 'Camel safaris in Jaisalmer, the blue city of Jodhpur, and the golden Thar desert.',
    tags: ['Adventure', 'Desert', 'Photography'],
    cities: ['Jodhpur', 'Jaisalmer'],
  },
  {
    id: 'kolkata-culture',
    title: 'Kolkata Cultural Escape',
    state: 'West Bengal',
    days: 4,
    price: 14000,
    image: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=600&h=400&fit=crop',
    description: 'Victoria Memorial, Howrah Bridge, street food trails, and the artistic soul of Bengal.',
    tags: ['Culture', 'Food', 'City'],
    cities: ['Kolkata'],
  },
  {
    id: 'kerala-ayurveda',
    title: 'Kerala Ayurveda & Wellness',
    state: 'Kerala',
    days: 6,
    price: 30000,
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&h=400&fit=crop',
    description: 'Rejuvenate with traditional Ayurvedic treatments in Kochi and peaceful backwaters of Alleppey.',
    tags: ['Wellness', 'Relaxation', 'Ayurveda'],
    cities: ['Kochi', 'Alleppey'],
  },
  {
    id: 'honeymoon-special',
    title: 'Romantic India Honeymoon',
    state: 'Multi-State',
    days: 8,
    price: 45000,
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop',
    description: 'Udaipur lakes, Munnar hills, and Alleppey houseboats — the perfect romantic getaway.',
    tags: ['Honeymoon', 'Luxury', 'Romance'],
    cities: ['Udaipur', 'Munnar', 'Alleppey'],
  },
  {
    id: 'budget-backpacker',
    title: 'Budget Backpacker India',
    state: 'Multi-State',
    days: 10,
    price: 15000,
    image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&h=400&fit=crop',
    description: 'Backpack through Varanasi, Jaipur, and Goa on a shoestring budget with hostels and street food.',
    tags: ['Budget', 'Backpacking', 'Friends'],
    cities: ['Varanasi', 'Jaipur', 'North Goa'],
  },
  {
    id: 'photography-tour',
    title: 'India Through the Lens',
    state: 'Multi-State',
    days: 9,
    price: 32000,
    image: 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=600&h=400&fit=crop',
    description: 'Capture Jaisalmer sunsets, Varanasi ghats, Hampi ruins, and the colorful streets of Jodhpur.',
    tags: ['Photography', 'Culture', 'Art'],
    cities: ['Jaisalmer', 'Varanasi', 'Hampi', 'Jodhpur'],
  },
  {
    id: 'family-fun',
    title: 'Family Fun India',
    state: 'Multi-State',
    days: 7,
    price: 35000,
    image: 'https://images.unsplash.com/photo-1585135497273-1a86d9d0209a?w=600&h=400&fit=crop',
    description: 'Kid-friendly trip through Jaipur forts, Goa beaches, and Mumbai attractions.',
    tags: ['Family', 'Kids', 'Fun'],
    cities: ['Jaipur', 'North Goa', 'Mumbai'],
  },
  {
    id: 'wildlife-safari',
    title: 'Wildlife Safari India',
    state: 'Multi-State',
    days: 7,
    price: 28000,
    image: 'https://images.unsplash.com/photo-1535338454528-1b22dc446b4c?w=600&h=400&fit=crop',
    description: 'Tiger spotting at Ranthambore, leopards in MP, and bird sanctuaries across Rajasthan.',
    tags: ['Wildlife', 'Nature', 'Safari'],
    cities: ['Jaipur', 'Bhopal'],
  },
  {
    id: 'agra-lucknow-heritage',
    title: 'UP Heritage Corridor',
    state: 'Uttar Pradesh',
    days: 5,
    price: 16000,
    image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&h=400&fit=crop',
    description: 'Taj Mahal in Agra, Nawabi cuisine in Lucknow, and the sacred temples of Mathura.',
    tags: ['Heritage', 'Food', 'History'],
    cities: ['Agra', 'Lucknow', 'Mathura'],
  },
];

async function addPackages() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/trip_planner';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  let added = 0;
  let skipped = 0;

  for (const pkg of NEW_PACKAGES) {
    const existing = await Package.findOne({ id: pkg.id });
    if (existing) {
      console.log(`  ⏭ "${pkg.title}" already exists, skipping`);
      skipped++;
    } else {
      await Package.create(pkg);
      console.log(`  ✓ Added "${pkg.title}"`);
      added++;
    }
  }

  const total = await Package.countDocuments();
  console.log(`\nDone — added ${added}, skipped ${skipped}, total packages: ${total}`);
  await mongoose.disconnect();
}

addPackages().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
