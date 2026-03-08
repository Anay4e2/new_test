// Routes data extracted for reuse across seed scripts
export const ROUTES_DATA = [
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
