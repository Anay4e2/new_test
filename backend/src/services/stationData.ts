/**
 * Comprehensive Indian Railway Station Database
 * ~500 major / commonly-searched stations across India.
 * Format: { name, code, state }
 */
export interface StationEntry {
    name: string;
    code: string;
    state: string;
}

export const STATIONS: StationEntry[] = [
    // ── DELHI / NCR ──
    { name: 'New Delhi', code: 'NDLS', state: 'Delhi' },
    { name: 'Old Delhi', code: 'DLI', state: 'Delhi' },
    { name: 'Hazrat Nizamuddin', code: 'NZM', state: 'Delhi' },
    { name: 'Anand Vihar Terminal', code: 'ANVT', state: 'Delhi' },
    { name: 'Delhi Cantt', code: 'DEC', state: 'Delhi' },
    { name: 'Delhi Sarai Rohilla', code: 'DEE', state: 'Delhi' },
    { name: 'Ghaziabad', code: 'GZB', state: 'Uttar Pradesh' },
    { name: 'Noida', code: 'NOIDA', state: 'Uttar Pradesh' },
    { name: 'Faridabad', code: 'FDB', state: 'Haryana' },
    { name: 'Gurgaon', code: 'GGN', state: 'Haryana' },

    // ── MAHARASHTRA ──
    { name: 'Mumbai CST', code: 'CSTM', state: 'Maharashtra' },
    { name: 'Mumbai Central', code: 'BCT', state: 'Maharashtra' },
    { name: 'Dadar', code: 'DR', state: 'Maharashtra' },
    { name: 'Lokmanya Tilak Terminus', code: 'LTT', state: 'Maharashtra' },
    { name: 'Bandra Terminus', code: 'BDTS', state: 'Maharashtra' },
    { name: 'Thane', code: 'TNA', state: 'Maharashtra' },
    { name: 'Kalyan Junction', code: 'KYN', state: 'Maharashtra' },
    { name: 'Panvel', code: 'PNVL', state: 'Maharashtra' },
    { name: 'Pune Junction', code: 'PUNE', state: 'Maharashtra' },
    { name: 'Nagpur', code: 'NGP', state: 'Maharashtra' },
    { name: 'Nashik Road', code: 'NK', state: 'Maharashtra' },
    { name: 'Aurangabad', code: 'AWB', state: 'Maharashtra' },
    { name: 'Solapur', code: 'SUR', state: 'Maharashtra' },
    { name: 'Kolhapur', code: 'KOP', state: 'Maharashtra' },
    { name: 'Nanded', code: 'NED', state: 'Maharashtra' },
    { name: 'Amravati', code: 'AMI', state: 'Maharashtra' },
    { name: 'Bhusawal Junction', code: 'BSL', state: 'Maharashtra' },
    { name: 'Manmad Junction', code: 'MMR', state: 'Maharashtra' },
    { name: 'Ratnagiri', code: 'RN', state: 'Maharashtra' },

    // ── KARNATAKA ──
    { name: 'Bangalore City', code: 'SBC', state: 'Karnataka' },
    { name: 'KSR Bengaluru', code: 'SBC', state: 'Karnataka' },
    { name: 'Yeshwantpur Junction', code: 'YPR', state: 'Karnataka' },
    { name: 'Mysore Junction', code: 'MYS', state: 'Karnataka' },
    { name: 'Hubli Junction', code: 'UBL', state: 'Karnataka' },
    { name: 'Mangalore Central', code: 'MAQ', state: 'Karnataka' },
    { name: 'Mangalore Junction', code: 'MAJN', state: 'Karnataka' },
    { name: 'Belgaum', code: 'BGM', state: 'Karnataka' },
    { name: 'Gulbarga', code: 'GR', state: 'Karnataka' },
    { name: 'Davangere', code: 'DVG', state: 'Karnataka' },
    { name: 'Shimoga', code: 'SMET', state: 'Karnataka' },
    { name: 'Hospet Junction', code: 'HPT', state: 'Karnataka' },

    // ── TAMIL NADU ──
    { name: 'Chennai Central', code: 'MAS', state: 'Tamil Nadu' },
    { name: 'Chennai Egmore', code: 'MS', state: 'Tamil Nadu' },
    { name: 'Tambaram', code: 'TBM', state: 'Tamil Nadu' },
    { name: 'Coimbatore Junction', code: 'CBE', state: 'Tamil Nadu' },
    { name: 'Madurai Junction', code: 'MDU', state: 'Tamil Nadu' },
    { name: 'Tiruchirappalli Junction', code: 'TPJ', state: 'Tamil Nadu' },
    { name: 'Tirunelveli Junction', code: 'TEN', state: 'Tamil Nadu' },
    { name: 'Salem Junction', code: 'SA', state: 'Tamil Nadu' },
    { name: 'Erode Junction', code: 'ED', state: 'Tamil Nadu' },
    { name: 'Vellore Cantt', code: 'VLR', state: 'Tamil Nadu' },
    { name: 'Tiruppur', code: 'TUP', state: 'Tamil Nadu' },
    { name: 'Mettupalayam', code: 'MTP', state: 'Tamil Nadu' },
    { name: 'Thanjavur Junction', code: 'TJ', state: 'Tamil Nadu' },
    { name: 'Kanyakumari', code: 'CAPE', state: 'Tamil Nadu' },
    { name: 'Rameswaram', code: 'RMM', state: 'Tamil Nadu' },
    { name: 'Nagercoil Junction', code: 'NCJ', state: 'Tamil Nadu' },

    // ── KERALA ──
    { name: 'Thiruvananthapuram Central', code: 'TVC', state: 'Kerala' },
    { name: 'Ernakulam Junction', code: 'ERS', state: 'Kerala' },
    { name: 'Ernakulam Town', code: 'ERN', state: 'Kerala' },
    { name: 'Kozhikode', code: 'CLT', state: 'Kerala' },
    { name: 'Calicut', code: 'CLT', state: 'Kerala' },
    { name: 'Thrissur', code: 'TCR', state: 'Kerala' },
    { name: 'Kannur', code: 'CAN', state: 'Kerala' },
    { name: 'Kollam Junction', code: 'QLN', state: 'Kerala' },
    { name: 'Palakkad Junction', code: 'PGT', state: 'Kerala' },
    { name: 'Alappuzha', code: 'ALLP', state: 'Kerala' },
    { name: 'Alleppey', code: 'ALLP', state: 'Kerala' },
    { name: 'Kottayam', code: 'KTYM', state: 'Kerala' },
    { name: 'Kasaragod', code: 'KGQ', state: 'Kerala' },

    // ── TELANGANA ──
    { name: 'Secunderabad Junction', code: 'SC', state: 'Telangana' },
    { name: 'Hyderabad Deccan', code: 'HYB', state: 'Telangana' },
    { name: 'Kacheguda', code: 'KCG', state: 'Telangana' },
    { name: 'Warangal', code: 'WL', state: 'Telangana' },
    { name: 'Kazipet Junction', code: 'KZJ', state: 'Telangana' },
    { name: 'Nalgonda', code: 'NLDA', state: 'Telangana' },
    { name: 'Khammam', code: 'KMT', state: 'Telangana' },

    // ── ANDHRA PRADESH ──
    { name: 'Vijayawada Junction', code: 'BZA', state: 'Andhra Pradesh' },
    { name: 'Visakhapatnam', code: 'VSKP', state: 'Andhra Pradesh' },
    { name: 'Tirupati', code: 'TPTY', state: 'Andhra Pradesh' },
    { name: 'Guntur Junction', code: 'GNT', state: 'Andhra Pradesh' },
    { name: 'Nellore', code: 'NLR', state: 'Andhra Pradesh' },
    { name: 'Rajahmundry', code: 'RJY', state: 'Andhra Pradesh' },
    { name: 'Kakinada Town', code: 'CCT', state: 'Andhra Pradesh' },
    { name: 'Anantapur', code: 'ATP', state: 'Andhra Pradesh' },
    { name: 'Kurnool City', code: 'KRNT', state: 'Andhra Pradesh' },
    { name: 'Ongole', code: 'OGL', state: 'Andhra Pradesh' },

    // ── WEST BENGAL ──
    { name: 'Howrah Junction', code: 'HWH', state: 'West Bengal' },
    { name: 'Sealdah', code: 'SDAH', state: 'West Bengal' },
    { name: 'Kolkata', code: 'KOAA', state: 'West Bengal' },
    { name: 'New Jalpaiguri', code: 'NJP', state: 'West Bengal' },
    { name: 'Asansol', code: 'ASN', state: 'West Bengal' },
    { name: 'Durgapur', code: 'DGR', state: 'West Bengal' },
    { name: 'Siliguri Junction', code: 'SGUJ', state: 'West Bengal' },
    { name: 'Bardhaman', code: 'BWN', state: 'West Bengal' },
    { name: 'Kharagpur', code: 'KGP', state: 'West Bengal' },
    { name: 'Malda Town', code: 'MLDT', state: 'West Bengal' },
    { name: 'Berhampore Court', code: 'BPC', state: 'West Bengal' },

    // ── UTTAR PRADESH ──
    { name: 'Lucknow', code: 'LKO', state: 'Uttar Pradesh' },
    { name: 'Lucknow Charbagh', code: 'LKO', state: 'Uttar Pradesh' },
    { name: 'Lucknow Junction', code: 'LJN', state: 'Uttar Pradesh' },
    { name: 'Varanasi Junction', code: 'BSB', state: 'Uttar Pradesh' },
    { name: 'Agra Cantt', code: 'AGC', state: 'Uttar Pradesh' },
    { name: 'Agra Fort', code: 'AF', state: 'Uttar Pradesh' },
    { name: 'Kanpur Central', code: 'CNB', state: 'Uttar Pradesh' },
    { name: 'Allahabad Junction', code: 'ALD', state: 'Uttar Pradesh' },
    { name: 'Prayagraj Junction', code: 'PRYJ', state: 'Uttar Pradesh' },
    { name: 'Gorakhpur Junction', code: 'GKP', state: 'Uttar Pradesh' },
    { name: 'Meerut City', code: 'MTC', state: 'Uttar Pradesh' },
    { name: 'Bareilly Junction', code: 'BE', state: 'Uttar Pradesh' },
    { name: 'Moradabad', code: 'MB', state: 'Uttar Pradesh' },
    { name: 'Aligarh Junction', code: 'ALJN', state: 'Uttar Pradesh' },
    { name: 'Mathura Junction', code: 'MTJ', state: 'Uttar Pradesh' },
    { name: 'Jhansi Junction', code: 'JHS', state: 'Uttar Pradesh' },
    { name: 'Mughal Sarai', code: 'DDU', state: 'Uttar Pradesh' },
    { name: 'Pt Deen Dayal Upadhyaya Junction', code: 'DDU', state: 'Uttar Pradesh' },
    { name: 'Sultanpur', code: 'SLN', state: 'Uttar Pradesh' },
    { name: 'Faizabad Junction', code: 'FD', state: 'Uttar Pradesh' },
    { name: 'Ayodhya', code: 'AY', state: 'Uttar Pradesh' },
    { name: 'Etawah', code: 'ETW', state: 'Uttar Pradesh' },
    { name: 'Tundla Junction', code: 'TDL', state: 'Uttar Pradesh' },

    // ── RAJASTHAN ──
    { name: 'Jaipur Junction', code: 'JP', state: 'Rajasthan' },
    { name: 'Jodhpur Junction', code: 'JU', state: 'Rajasthan' },
    { name: 'Udaipur City', code: 'UDZ', state: 'Rajasthan' },
    { name: 'Jaisalmer', code: 'JSM', state: 'Rajasthan' },
    { name: 'Bikaner Junction', code: 'BKN', state: 'Rajasthan' },
    { name: 'Ajmer Junction', code: 'AII', state: 'Rajasthan' },
    { name: 'Kota Junction', code: 'KOTA', state: 'Rajasthan' },
    { name: 'Alwar', code: 'AWR', state: 'Rajasthan' },
    { name: 'Sawai Madhopur', code: 'SWM', state: 'Rajasthan' },
    { name: 'Bharatpur Junction', code: 'BTE', state: 'Rajasthan' },
    { name: 'Chittorgarh', code: 'COR', state: 'Rajasthan' },
    { name: 'Abu Road', code: 'ABR', state: 'Rajasthan' },
    { name: 'Mount Abu', code: 'ABR', state: 'Rajasthan' },
    { name: 'Sri Ganganagar', code: 'SGNR', state: 'Rajasthan' },
    { name: 'Barmer', code: 'BME', state: 'Rajasthan' },
    { name: 'Sikar Junction', code: 'SIKR', state: 'Rajasthan' },
    { name: 'Marwar Junction', code: 'MJ', state: 'Rajasthan' },
    { name: 'Bandikui Junction', code: 'BKI', state: 'Rajasthan' },
    { name: 'Phulera Junction', code: 'FL', state: 'Rajasthan' },

    // ── GUJARAT ──
    { name: 'Ahmedabad Junction', code: 'ADI', state: 'Gujarat' },
    { name: 'Surat', code: 'ST', state: 'Gujarat' },
    { name: 'Vadodara Junction', code: 'BRC', state: 'Gujarat' },
    { name: 'Rajkot Junction', code: 'RJT', state: 'Gujarat' },
    { name: 'Junagadh', code: 'JND', state: 'Gujarat' },
    { name: 'Bhavnagar Terminus', code: 'BVP', state: 'Gujarat' },
    { name: 'Gandhidham Junction', code: 'GIMB', state: 'Gujarat' },
    { name: 'Bhuj', code: 'BHUJ', state: 'Gujarat' },
    { name: 'Dwarka', code: 'DWK', state: 'Gujarat' },
    { name: 'Jamnagar', code: 'JAM', state: 'Gujarat' },
    { name: 'Porbandar', code: 'PBR', state: 'Gujarat' },
    { name: 'Somnath', code: 'SMNH', state: 'Gujarat' },
    { name: 'Valsad', code: 'BL', state: 'Gujarat' },
    { name: 'Navsari', code: 'NVS', state: 'Gujarat' },
    { name: 'Anand Junction', code: 'ANND', state: 'Gujarat' },
    { name: 'Nadiad Junction', code: 'ND', state: 'Gujarat' },
    { name: 'Surendranagar', code: 'SUNR', state: 'Gujarat' },
    { name: 'Mehsana Junction', code: 'MSH', state: 'Gujarat' },
    { name: 'Palanpur Junction', code: 'PNU', state: 'Gujarat' },

    // ── MADHYA PRADESH ──
    { name: 'Bhopal Junction', code: 'BPL', state: 'Madhya Pradesh' },
    { name: 'Habibganj', code: 'HBJ', state: 'Madhya Pradesh' },
    { name: 'Indore Junction', code: 'INDB', state: 'Madhya Pradesh' },
    { name: 'Jabalpur Junction', code: 'JBP', state: 'Madhya Pradesh' },
    { name: 'Gwalior Junction', code: 'GWL', state: 'Madhya Pradesh' },
    { name: 'Ujjain Junction', code: 'UJN', state: 'Madhya Pradesh' },
    { name: 'Ratlam Junction', code: 'RTM', state: 'Madhya Pradesh' },
    { name: 'Itarsi Junction', code: 'ET', state: 'Madhya Pradesh' },
    { name: 'Satna Junction', code: 'STA', state: 'Madhya Pradesh' },
    { name: 'Katni Junction', code: 'KTE', state: 'Madhya Pradesh' },
    { name: 'Khajuraho', code: 'KURJ', state: 'Madhya Pradesh' },
    { name: 'Rewa', code: 'REWA', state: 'Madhya Pradesh' },

    // ── BIHAR ──
    { name: 'Patna Junction', code: 'PNBE', state: 'Bihar' },
    { name: 'Rajendra Nagar Terminal', code: 'RJPB', state: 'Bihar' },
    { name: 'Gaya Junction', code: 'GAYA', state: 'Bihar' },
    { name: 'Muzaffarpur Junction', code: 'MFP', state: 'Bihar' },
    { name: 'Darbhanga Junction', code: 'DBG', state: 'Bihar' },
    { name: 'Bhagalpur', code: 'BGP', state: 'Bihar' },
    { name: 'Samastipur Junction', code: 'SPJ', state: 'Bihar' },
    { name: 'Ara', code: 'ARA', state: 'Bihar' },
    { name: 'Buxar', code: 'BXR', state: 'Bihar' },
    { name: 'Sasaram', code: 'SSM', state: 'Bihar' },
    { name: 'Purnia Junction', code: 'PRNA', state: 'Bihar' },

    // ── ODISHA ──
    { name: 'Bhubaneswar', code: 'BBS', state: 'Odisha' },
    { name: 'Cuttack Junction', code: 'CTC', state: 'Odisha' },
    { name: 'Puri', code: 'PURI', state: 'Odisha' },
    { name: 'Berhampur', code: 'BAM', state: 'Odisha' },
    { name: 'Sambalpur', code: 'SBP', state: 'Odisha' },
    { name: 'Rourkela Junction', code: 'ROU', state: 'Odisha' },
    { name: 'Balasore', code: 'BLS', state: 'Odisha' },
    { name: 'Koraput', code: 'KRPU', state: 'Odisha' },

    // ── PUNJAB ──
    { name: 'Amritsar Junction', code: 'ASR', state: 'Punjab' },
    { name: 'Ludhiana Junction', code: 'LDH', state: 'Punjab' },
    { name: 'Jalandhar City', code: 'JUC', state: 'Punjab' },
    { name: 'Jalandhar Cantt', code: 'JRC', state: 'Punjab' },
    { name: 'Patiala', code: 'PTA', state: 'Punjab' },
    { name: 'Bhatinda Junction', code: 'BTI', state: 'Punjab' },
    { name: 'Pathankot Cantt', code: 'PTKC', state: 'Punjab' },
    { name: 'Firozpur Cantt', code: 'FZR', state: 'Punjab' },

    // ── HARYANA ──
    { name: 'Ambala Cantt', code: 'UMB', state: 'Haryana' },
    { name: 'Hisar', code: 'HSR', state: 'Haryana' },
    { name: 'Rohtak Junction', code: 'ROK', state: 'Haryana' },
    { name: 'Panipat', code: 'PNP', state: 'Haryana' },
    { name: 'Karnal', code: 'KUN', state: 'Haryana' },
    { name: 'Kurukshetra Junction', code: 'KKDE', state: 'Haryana' },
    { name: 'Sonipat', code: 'SNP', state: 'Haryana' },

    // ── UTTARAKHAND ──
    { name: 'Dehradun', code: 'DDN', state: 'Uttarakhand' },
    { name: 'Haridwar Junction', code: 'HW', state: 'Uttarakhand' },
    { name: 'Rishikesh', code: 'RKSH', state: 'Uttarakhand' },
    { name: 'Roorkee', code: 'RK', state: 'Uttarakhand' },
    { name: 'Haldwani', code: 'HDW', state: 'Uttarakhand' },
    { name: 'Kathgodam', code: 'KGM', state: 'Uttarakhand' },
    { name: 'Nainital', code: 'KGM', state: 'Uttarakhand' },
    { name: 'Ramnagar', code: 'RMR', state: 'Uttarakhand' },
    { name: 'Kotdwar', code: 'KTW', state: 'Uttarakhand' },

    // ── HIMACHAL PRADESH ──
    { name: 'Shimla', code: 'SML', state: 'Himachal Pradesh' },
    { name: 'Kalka', code: 'KLK', state: 'Himachal Pradesh' },
    { name: 'Una Himachal', code: 'UNA', state: 'Himachal Pradesh' },
    { name: 'Joginder Nagar', code: 'JDNX', state: 'Himachal Pradesh' },
    { name: 'Kangra Mandir', code: 'KGMR', state: 'Himachal Pradesh' },

    // ── CHANDIGARH ──
    { name: 'Chandigarh', code: 'CDG', state: 'Chandigarh' },

    // ── JAMMU & KASHMIR ──
    { name: 'Jammu Tawi', code: 'JAT', state: 'Jammu & Kashmir' },
    { name: 'Katra', code: 'SVDK', state: 'Jammu & Kashmir' },
    { name: 'Udhampur', code: 'UHP', state: 'Jammu & Kashmir' },
    { name: 'Srinagar', code: 'SINA', state: 'Jammu & Kashmir' },

    // ── GOA ──
    { name: 'Madgaon Junction', code: 'MAO', state: 'Goa' },
    { name: 'Goa', code: 'MAO', state: 'Goa' },
    { name: 'Vasco da Gama', code: 'VSG', state: 'Goa' },
    { name: 'Karmali', code: 'KRMI', state: 'Goa' },
    { name: 'Thivim', code: 'THVM', state: 'Goa' },

    // ── JHARKHAND ──
    { name: 'Ranchi', code: 'RNC', state: 'Jharkhand' },
    { name: 'Dhanbad Junction', code: 'DHN', state: 'Jharkhand' },
    { name: 'Bokaro Steel City', code: 'BKSC', state: 'Jharkhand' },
    { name: 'Jamshedpur', code: 'TATA', state: 'Jharkhand' },
    { name: 'Tatanagar', code: 'TATA', state: 'Jharkhand' },
    { name: 'Hazaribagh Road', code: 'HZD', state: 'Jharkhand' },
    { name: 'Jasidih Junction', code: 'JSME', state: 'Jharkhand' },
    { name: 'Deoghar', code: 'DGHR', state: 'Jharkhand' },

    // ── CHHATTISGARH ──
    { name: 'Raipur Junction', code: 'R', state: 'Chhattisgarh' },
    { name: 'Bilaspur Junction', code: 'BSP', state: 'Chhattisgarh' },
    { name: 'Durg', code: 'DURG', state: 'Chhattisgarh' },
    { name: 'Bhilai', code: 'BIA', state: 'Chhattisgarh' },
    { name: 'Korba', code: 'KRBA', state: 'Chhattisgarh' },
    { name: 'Raigarh', code: 'RIG', state: 'Chhattisgarh' },

    // ── ASSAM ──
    { name: 'Guwahati', code: 'GHY', state: 'Assam' },
    { name: 'Kamakhya', code: 'KYQ', state: 'Assam' },
    { name: 'Dibrugarh', code: 'DBRG', state: 'Assam' },
    { name: 'Tinsukia Junction', code: 'NTSK', state: 'Assam' },
    { name: 'Jorhat Town', code: 'JTTN', state: 'Assam' },
    { name: 'Silchar', code: 'SCL', state: 'Assam' },
    { name: 'Nagaon', code: 'NGON', state: 'Assam' },
    { name: 'Lumding Junction', code: 'LMG', state: 'Assam' },

    // ── NORTHEAST ──
    { name: 'Agartala', code: 'AGTL', state: 'Tripura' },
    { name: 'Imphal', code: 'IMPH', state: 'Manipur' },
    { name: 'Dimapur', code: 'DMV', state: 'Nagaland' },
    { name: 'Shillong', code: 'GHY', state: 'Meghalaya' },
    { name: 'Naharlagun', code: 'NHLN', state: 'Arunachal Pradesh' },

    // ── WEST INDIA ──
    { name: 'Jalgaon Junction', code: 'JL', state: 'Maharashtra' },
    { name: 'Akola Junction', code: 'AK', state: 'Maharashtra' },
    { name: 'Wardha Junction', code: 'WR', state: 'Maharashtra' },
    { name: 'Lonavala', code: 'LNL', state: 'Maharashtra' },
    { name: 'Satara', code: 'STR', state: 'Maharashtra' },
    { name: 'Sangli', code: 'SLI', state: 'Maharashtra' },
    { name: 'Latur', code: 'LUR', state: 'Maharashtra' },

    // ── ADDITIONAL POPULAR CITY ALIASES ──
    { name: 'Delhi', code: 'NDLS', state: 'Delhi' },
    { name: 'Mumbai', code: 'CSTM', state: 'Maharashtra' },
    { name: 'Kolkata', code: 'HWH', state: 'West Bengal' },
    { name: 'Chennai', code: 'MAS', state: 'Tamil Nadu' },
    { name: 'Bangalore', code: 'SBC', state: 'Karnataka' },
    { name: 'Bengaluru', code: 'SBC', state: 'Karnataka' },
    { name: 'Hyderabad', code: 'SC', state: 'Telangana' },
    { name: 'Ahmedabad', code: 'ADI', state: 'Gujarat' },
    { name: 'Pune', code: 'PUNE', state: 'Maharashtra' },
    { name: 'Jaipur', code: 'JP', state: 'Rajasthan' },
    { name: 'Lucknow', code: 'LKO', state: 'Uttar Pradesh' },
    { name: 'Kanpur', code: 'CNB', state: 'Uttar Pradesh' },
    { name: 'Patna', code: 'PNBE', state: 'Bihar' },
    { name: 'Bhopal', code: 'BPL', state: 'Madhya Pradesh' },
    { name: 'Indore', code: 'INDB', state: 'Madhya Pradesh' },
    { name: 'Agra', code: 'AGC', state: 'Uttar Pradesh' },
    { name: 'Varanasi', code: 'BSB', state: 'Uttar Pradesh' },
    { name: 'Kochi', code: 'ERS', state: 'Kerala' },
    { name: 'Cochin', code: 'ERS', state: 'Kerala' },
    { name: 'Trivandrum', code: 'TVC', state: 'Kerala' },
    { name: 'Madurai', code: 'MDU', state: 'Tamil Nadu' },
    { name: 'Coimbatore', code: 'CBE', state: 'Tamil Nadu' },
    { name: 'Mangalore', code: 'MAQ', state: 'Karnataka' },
    { name: 'Mysore', code: 'MYS', state: 'Karnataka' },
    { name: 'Visakhapatnam', code: 'VSKP', state: 'Andhra Pradesh' },
    { name: 'Vizag', code: 'VSKP', state: 'Andhra Pradesh' },
    { name: 'Vijayawada', code: 'BZA', state: 'Andhra Pradesh' },
    { name: 'Tirupati', code: 'TPTY', state: 'Andhra Pradesh' },
    { name: 'Nagpur', code: 'NGP', state: 'Maharashtra' },
    { name: 'Nashik', code: 'NK', state: 'Maharashtra' },
    { name: 'Aurangabad', code: 'AWB', state: 'Maharashtra' },
    { name: 'Amritsar', code: 'ASR', state: 'Punjab' },
    { name: 'Jalandhar', code: 'JUC', state: 'Punjab' },
    { name: 'Ludhiana', code: 'LDH', state: 'Punjab' },
    { name: 'Chandigarh', code: 'CDG', state: 'Chandigarh' },
    { name: 'Dehradun', code: 'DDN', state: 'Uttarakhand' },
    { name: 'Haridwar', code: 'HW', state: 'Uttarakhand' },
    { name: 'Rishikesh', code: 'RKSH', state: 'Uttarakhand' },
    { name: 'Shimla', code: 'SML', state: 'Himachal Pradesh' },
    { name: 'Jammu', code: 'JAT', state: 'Jammu & Kashmir' },
    { name: 'Ranchi', code: 'RNC', state: 'Jharkhand' },
    { name: 'Guwahati', code: 'GHY', state: 'Assam' },
    { name: 'Bhubaneswar', code: 'BBS', state: 'Odisha' },
    { name: 'Raipur', code: 'R', state: 'Chhattisgarh' },
    { name: 'Goa', code: 'MAO', state: 'Goa' },
    { name: 'Panaji', code: 'KRMI', state: 'Goa' },
    { name: 'Surat', code: 'ST', state: 'Gujarat' },
    { name: 'Vadodara', code: 'BRC', state: 'Gujarat' },
    { name: 'Rajkot', code: 'RJT', state: 'Gujarat' },
    { name: 'Jodhpur', code: 'JU', state: 'Rajasthan' },
    { name: 'Udaipur', code: 'UDZ', state: 'Rajasthan' },
    { name: 'Pushkar', code: 'AII', state: 'Rajasthan' },
    { name: 'Ajmer', code: 'AII', state: 'Rajasthan' },
    { name: 'Ranthambore', code: 'SWM', state: 'Rajasthan' },
    { name: 'Darjeeling', code: 'NJP', state: 'West Bengal' },
    { name: 'Gangtok', code: 'NJP', state: 'West Bengal' },
    { name: 'Ooty', code: 'MTP', state: 'Tamil Nadu' },
    { name: 'Manali', code: 'CDG', state: 'Himachal Pradesh' },
    { name: 'Dharamshala', code: 'PTKC', state: 'Himachal Pradesh' },
    { name: 'Gwalior', code: 'GWL', state: 'Madhya Pradesh' },
    { name: 'Ujjain', code: 'UJN', state: 'Madhya Pradesh' },
    { name: 'Allahabad', code: 'ALD', state: 'Uttar Pradesh' },
    { name: 'Prayagraj', code: 'PRYJ', state: 'Uttar Pradesh' },
    { name: 'Gorakhpur', code: 'GKP', state: 'Uttar Pradesh' },
    { name: 'Meerut', code: 'MTC', state: 'Uttar Pradesh' },
    { name: 'Bareilly', code: 'BE', state: 'Uttar Pradesh' },
    { name: 'Aligarh', code: 'ALJN', state: 'Uttar Pradesh' },
    { name: 'Mathura', code: 'MTJ', state: 'Uttar Pradesh' },
    { name: 'Jhansi', code: 'JHS', state: 'Uttar Pradesh' },
    { name: 'Bikaner', code: 'BKN', state: 'Rajasthan' },
    { name: 'Jaisalmer', code: 'JSM', state: 'Rajasthan' },
    { name: 'Bhuj', code: 'BHUJ', state: 'Gujarat' },
    { name: 'Dwarka', code: 'DWK', state: 'Gujarat' },
    { name: 'Somnath', code: 'SMNH', state: 'Gujarat' },
    { name: 'Khajuraho', code: 'KURJ', state: 'Madhya Pradesh' },
    { name: 'Dibrugarh', code: 'DBRG', state: 'Assam' },
    { name: 'Silchar', code: 'SCL', state: 'Assam' },
    { name: 'Agartala', code: 'AGTL', state: 'Tripura' },
    { name: 'Kanyakumari', code: 'CAPE', state: 'Tamil Nadu' },
    { name: 'Rameswaram', code: 'RMM', state: 'Tamil Nadu' },
];

// Pre-built lookup: lowercase name → StationEntry
const stationByName = new Map<string, StationEntry>();
// Pre-built lookup: lowercase code → StationEntry
const stationByCode = new Map<string, StationEntry>();

for (const s of STATIONS) {
    const key = s.name.toLowerCase();
    if (!stationByName.has(key)) stationByName.set(key, s);
    const codeKey = s.code.toLowerCase();
    if (!stationByCode.has(codeKey)) stationByCode.set(codeKey, s);
}

/**
 * Resolve any user input (city name, station name, or station code) to a station code.
 * Case-insensitive.
 */
export function resolveStation(input: string): StationEntry | undefined {
    const lower = input.trim().toLowerCase();
    return stationByName.get(lower) || stationByCode.get(lower);
}

/**
 * Search stations by prefix / substring (for autocomplete).
 * Returns up to `limit` matches, preferring prefix matches.
 */
export function searchStations(query: string, limit = 15): StationEntry[] {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];

    const prefixMatches: StationEntry[] = [];
    const substringMatches: StationEntry[] = [];
    const seen = new Set<string>(); // dedupe by code+name

    for (const s of STATIONS) {
        const key = `${s.code}-${s.name.toLowerCase()}`;
        if (seen.has(key)) continue;

        const nameLower = s.name.toLowerCase();
        const codeLower = s.code.toLowerCase();

        if (nameLower.startsWith(q) || codeLower.startsWith(q)) {
            seen.add(key);
            prefixMatches.push(s);
        } else if (nameLower.includes(q) || codeLower.includes(q)) {
            seen.add(key);
            substringMatches.push(s);
        }

        if (prefixMatches.length + substringMatches.length >= limit * 2) break;
    }

    return [...prefixMatches, ...substringMatches].slice(0, limit);
}
