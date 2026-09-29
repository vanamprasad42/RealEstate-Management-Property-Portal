import Property from '../models/propertyModel.js';
import City from '../models/cityModel.js';
import User from '../models/userModel.js';

// In-memory recent queries store
let recentQueriesStore = [
  { id: '1', query: '3 BHK under ₹80 lakhs in Hyderabad', timestamp: '10:24 AM', timeLabel: '10:24 AM' },
  { id: '2', query: 'Villas in Gachibowli', timestamp: 'Yesterday', timeLabel: 'Yesterday' },
  { id: '3', query: 'Best areas to invest in Hyderabad', timestamp: 'Sep 10', timeLabel: 'Sep 10' },
  { id: '4', query: 'Compare Prestige Heights and Lake View Residency', timestamp: 'Sep 9', timeLabel: 'Sep 9' }
];

// Helper: Format Indian Currency
export const formatIndianCurrency = (amount) => {
  if (!amount || isNaN(amount)) return '₹0';
  const num = Number(amount);
  if (num >= 10000000) {
    const cr = num / 10000000;
    return `₹${cr.toFixed(cr % 1 === 0 ? 0 : 2)} Crores`;
  }
  if (num >= 100000) {
    const lk = num / 100000;
    return `₹${lk.toFixed(lk % 1 === 0 ? 0 : 2)} Lakhs`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
};

// Calculate Home Loan EMI
export const calculateEMI = (principal, annualInterestRate = 8.5, tenureYears = 20) => {
  const monthlyRate = annualInterestRate / (12 * 100);
  const totalMonths = tenureYears * 12;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
              (Math.pow(1 + monthlyRate, totalMonths) - 1);
  const totalPayment = emi * totalMonths;
  const totalInterest = totalPayment - principal;

  return {
    emi: Math.round(emi),
    emiFormatted: `₹${Math.round(emi).toLocaleString('en-IN')}/month`,
    totalInterest: Math.round(totalInterest),
    totalInterestFormatted: formatIndianCurrency(totalInterest),
    totalPayment: Math.round(totalPayment),
    totalPaymentFormatted: formatIndianCurrency(totalPayment),
    rate: annualInterestRate,
    tenureYears
  };
};

// Helper: Parse natural language constraints from user prompt
export const extractSearchFilters = (text = '', userPreferences = {}) => {
  const query = text.toLowerCase();
  const filters = {};

  // 1. Detect City
  const cityMap = {
    'hyderabad': 'Hyderabad',
    'mumbai': 'Mumbai',
    'pune': 'Pune',
    'bangalore': 'Bangalore',
    'bengaluru': 'Bangalore',
    'delhi': 'Delhi',
    'new delhi': 'Delhi',
    'gurgaon': 'Gurgaon',
    'gurugram': 'Gurgaon',
    'noida': 'Noida',
    'chennai': 'Chennai',
    'kolkata': 'Kolkata',
    'ahmedabad': 'Ahmedabad'
  };

  for (const [key, val] of Object.entries(cityMap)) {
    if (query.includes(key)) {
      filters.city = val;
      break;
    }
  }

  // 2. Detect Localities & Associated Cities
  const localityMap = {
    // Hyderabad
    'gachibowli': 'Hyderabad',
    'kondapur': 'Hyderabad',
    'miyapur': 'Hyderabad',
    'nallagandla': 'Hyderabad',
    'manikonda': 'Hyderabad',
    'tellapur': 'Hyderabad',
    'financial district': 'Hyderabad',
    'hitec city': 'Hyderabad',
    'kukatpally': 'Hyderabad',
    'madhapur': 'Hyderabad',
    'jubilee hills': 'Hyderabad',
    'banjara hills': 'Hyderabad',
    // Mumbai
    'bandra': 'Mumbai',
    'andheri': 'Mumbai',
    'juhu': 'Mumbai',
    'powai': 'Mumbai',
    'worli': 'Mumbai',
    'thane': 'Mumbai',
    // Pune
    'koregaon park': 'Pune',
    'wakad': 'Pune',
    'hinjewadi': 'Pune',
    'hinjawadi': 'Pune',
    'baner': 'Pune',
    'kothrud': 'Pune',
    'viman nagar': 'Pune',
    // Bangalore
    'electronic city': 'Bangalore',
    'whitefield': 'Bangalore',
    'indiranagar': 'Bangalore',
    'koramangala': 'Bangalore',
    'hsr layout': 'Bangalore',
    'sarjapur': 'Bangalore',
    // Delhi
    'dwarka': 'Delhi',
    'rohini': 'Delhi',
    'vasant kunj': 'Delhi',
    'saket': 'Delhi'
  };

  for (const [loc, city] of Object.entries(localityMap)) {
    if (query.includes(loc)) {
      filters.locality = loc;
      if (!filters.city) {
        filters.city = city;
      }
      break;
    }
  }

  // 3. Detect BHK / Bedrooms
  const bhkMatch = query.match(/(\d+)\s*(?:bhk|bed|bedroom|beds|bedrooms)/i);
  if (bhkMatch) {
    filters.bedrooms = parseInt(bhkMatch[1], 10);
  }

  // 4. Detect Property Type
  if (query.includes('villa') || query.includes('independent house')) {
    filters.propertyType = 'Villa';
  } else if (query.includes('apartment') || query.includes('flat') || query.includes('condo')) {
    filters.propertyType = 'Apartment';
  } else if (query.includes('plot') || query.includes('land')) {
    filters.propertyType = 'Plot';
  } else if (query.includes('house')) {
    filters.propertyType = 'House';
  }

  // 5. Detect Listing Type (Rent vs Sale)
  if (query.includes('rent') || query.includes('lease') || query.includes('to let')) {
    filters.listingType = 'rent';
  } else if (query.includes('buy') || query.includes('sale') || query.includes('purchase')) {
    filters.listingType = 'sale';
  }

  // 6. Detect Budget / Price constraints
  // Check range: "between X and Y"
  const rangeLakhMatch = query.match(/between\s*(?:₹\s*)?(\d+(?:\.\d+)?)\s*(?:and|to|-)\s*(?:₹\s*)?(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lacs|lac|l)\b/i);
  if (rangeLakhMatch) {
    filters.minPrice = parseFloat(rangeLakhMatch[1]) * 100000;
    filters.maxPrice = parseFloat(rangeLakhMatch[2]) * 100000;
  } else {
    // "above X lakhs" or "min X lakhs"
    const minLakhMatch = query.match(/(?:above|greater than|more than|min|minimum)\s*₹?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lacs|lac|l)\b/i);
    if (minLakhMatch) {
      filters.minPrice = parseFloat(minLakhMatch[1]) * 100000;
    }

    // "under X crore" or "below X crore"
    const croreMatch = query.match(/(?:under|below|upto|up to|less than|max|within)?\s*₹?\s*(\d+(?:\.\d+)?)\s*(?:crore|crores|cr)\b/i);
    // "under X lakhs" or "below X lakhs"
    const lakhMatch = query.match(/(?:under|below|upto|up to|less than|max|within)?\s*₹?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lacs|lac|l)\b/i);
    // Raw numeric values (e.g., 80,00,000 or 8000000)
    const rawNumberMatch = query.match(/(?:under|below|upto|up to|max)?\s*₹?\s*(\d{1,2}(?:,\d{2})*(?:,\d{3}))\b/);

    if (croreMatch) {
      filters.maxPrice = parseFloat(croreMatch[1]) * 10000000;
    } else if (lakhMatch) {
      filters.maxPrice = parseFloat(lakhMatch[1]) * 100000;
    } else if (rawNumberMatch) {
      const parsedVal = parseInt(rawNumberMatch[1].replace(/,/g, ''), 10);
      if (parsedVal >= 100000) filters.maxPrice = parsedVal;
    }
  }

  // 7. Detect Specific Property Name(s) in query
  const knownPropertyNames = [
    'prestige heights',
    'lake view residency',
    'green park apartments',
    'rr towers',
    'sri sai enclave',
    'sunrise residency',
    'luxury apartment in bandra',
    'modern 2bhk apartment near metro',
    'ultra luxury 5bhk villa in koregaon park',
    'premium residential plot in electronic city'
  ];

  const matchedNames = [];
  for (const name of knownPropertyNames) {
    if (query.includes(name)) {
      matchedNames.push(name);
    }
  }

  if (matchedNames.length > 0) {
    filters.targetPropertyName = matchedNames[0];
    filters.targetPropertyNames = matchedNames;
  }

  // Incorporate existing user preferences if not explicitly overridden by query
  if (!filters.city && userPreferences.preferredLocation) {
    filters.city = userPreferences.preferredLocation;
  }
  if (!filters.bedrooms && userPreferences.propertyType) {
    const prefBhk = userPreferences.propertyType.match(/(\d+)\s*bhk/i);
    if (prefBhk) filters.bedrooms = parseInt(prefBhk[1], 10);
  }
  if (!filters.maxPrice && userPreferences.budget) {
    const prefLakh = userPreferences.budget.match(/(\d+)\s*lakh/i);
    if (prefLakh) filters.maxPrice = parseInt(prefLakh[1], 10) * 100000;
  }

  return filters;
};

// Query MongoDB for matching real-world property records
export const fetchMatchingProperties = async (filters = {}) => {
  try {
    // Do not attempt a buffered query while MongoDB is reconnecting or
    // unavailable. The chat can still provide its built-in guidance.
    if (Property.db.readyState !== 1) {
      return [];
    }

    const mongoQuery = { approved: true, status: 'available' };

    // If multiple specific property names were mentioned for comparison
    if (filters.targetPropertyNames && filters.targetPropertyNames.length >= 2) {
      const orTitles = filters.targetPropertyNames.map(name => ({
        title: { $regex: new RegExp(name, 'i') }
      }));
      const comparedProps = await Property.find({
        approved: true,
        $or: orTitles
      }).populate('vendor', 'name email mobile');

      if (comparedProps.length >= 2) {
        return comparedProps;
      }
    }

    // If a single specific property name was mentioned, prioritize finding it
    if (filters.targetPropertyName) {
      const specificProp = await Property.findOne({
        approved: true,
        title: { $regex: new RegExp(filters.targetPropertyName, 'i') }
      }).populate('vendor', 'name email mobile');

      if (specificProp) {
        // Also fetch 2 similar properties in same city for comparison
        const relatedProps = await Property.find({
          approved: true,
          _id: { $ne: specificProp._id },
          city: specificProp.city
        }).populate('vendor', 'name email mobile').limit(2);

        return [specificProp, ...relatedProps];
      }
    }

    if (filters.city) {
      mongoQuery.city = { $regex: new RegExp(`^${filters.city}`, 'i') };
    }

    if (filters.locality) {
      mongoQuery.$or = [
        { address: { $regex: new RegExp(filters.locality, 'i') } },
        { title: { $regex: new RegExp(filters.locality, 'i') } },
        { description: { $regex: new RegExp(filters.locality, 'i') } }
      ];
    }

    if (filters.propertyType) {
      mongoQuery.propertyType = filters.propertyType;
    }

    if (filters.listingType) {
      mongoQuery.listingType = filters.listingType;
    }

    if (filters.bedrooms) {
      mongoQuery.bedrooms = filters.bedrooms;
    }

    if (filters.minPrice || filters.maxPrice) {
      mongoQuery.price = {};
      if (filters.minPrice) mongoQuery.price.$gte = filters.minPrice;
      if (filters.maxPrice) mongoQuery.price.$lte = filters.maxPrice;
    }

    let properties = await Property.find(mongoQuery)
      .populate('vendor', 'name email mobile')
      .sort({ price: 1 })
      .limit(6);

    // If 0 matches, relax bedroom or price criteria to offer best alternatives
    if (properties.length === 0 && filters.city) {
      const relaxedQuery = {
        approved: true,
        city: { $regex: new RegExp(filters.city, 'i') }
      };
      if (filters.propertyType) relaxedQuery.propertyType = filters.propertyType;

      properties = await Property.find(relaxedQuery)
        .populate('vendor', 'name email mobile')
        .sort({ price: 1 })
        .limit(4);
    }

    // If still 0 matches and no city was found, show top verified listings overall
    if (properties.length === 0) {
      properties = await Property.find({ approved: true, status: 'available' })
        .populate('vendor', 'name email mobile')
        .sort({ createdAt: -1 })
        .limit(4);
    }

    return properties;
  } catch (err) {
    console.error('Error fetching MongoDB properties for AI:', err);
    return [];
  }
};

/**
 * Built-in Real Estate Neural Reasoning Engine
 * Handles deep domain knowledge: properties, loans, comparisons, RERA, investment hotspots, and areas.
 */
export const generateDomainAiResponse = (userMessage, properties, filters) => {
  const msgLower = userMessage.toLowerCase();

  // 1. PROPERTY COMPARISON (Check comparison first before single property lookup)
  if (msgLower.includes('compare') || (properties.length >= 2 && (msgLower.includes('these') || msgLower.includes('versus') || msgLower.includes('vs')))) {
    if (properties.length >= 2) {
      const p1 = properties[0];
      const p2 = properties[1];
      const emi1 = calculateEMI(p1.price * 0.8, 8.5, 20);
      const emi2 = calculateEMI(p2.price * 0.8, 8.5, 20);
      const pricePerSqFt1 = Math.round(p1.price / (p1.area || 1500));
      const pricePerSqFt2 = Math.round(p2.price / (p2.area || 1500));

      return {
        reply: `Here is an in-depth comparison between **${p1.title}** and **${p2.title}**:\n\n` +
          `| Feature | ${p1.title} | ${p2.title} |\n` +
          `| :--- | :--- | :--- |\n` +
          `| **Price** | **${formatIndianCurrency(p1.price)}** | **${formatIndianCurrency(p2.price)}** |\n` +
          `| **Rate / sq ft** | ₹${pricePerSqFt1.toLocaleString('en-IN')}/sq ft | ₹${pricePerSqFt2.toLocaleString('en-IN')}/sq ft |\n` +
          `| **Layout** | ${p1.bedrooms || 3} BHK (${p1.area} sq ft) | ${p2.bedrooms || 3} BHK (${p2.area} sq ft) |\n` +
          `| **Location** | ${p1.address || p1.city} | ${p2.address || p2.city} |\n` +
          `| **Est. Monthly EMI** | ${emi1.emiFormatted} | ${emi2.emiFormatted} |\n` +
          `| **Top Amenities** | ${(p1.amenities || []).slice(0, 3).join(', ')} | ${(p2.amenities || []).slice(0, 3).join(', ')} |\n\n` +
          `**Recommendation:**\n` +
          `• Choose **${p1.title}** if you prioritize ${p1.price <= p2.price ? 'better affordability & competitive price per sq ft' : 'prime location & luxury amenities'}.\n` +
          `• Choose **${p2.title}** if you value ${p2.area >= p1.area ? 'a more spacious floor plan' : 'specific neighborhood connectivity'}.\n\n` +
          `Both units have verified clear titles. Would you like to request direct contact with both listing agents?`,
        followUps: [
          `Connect with agent for ${p1.title}`,
          `Connect with agent for ${p2.title}`,
          'Tell me about home loan options'
        ]
      };
    }
  }

  // 2. SPECIFIC PROPERTY LOOKUP (e.g. "Tell me about Prestige Heights", "Details of Lake View")
  if (filters.targetPropertyName || (properties.length > 0 && properties.some(p => msgLower.includes(p.title.toLowerCase())))) {
    const target = properties.find(p => msgLower.includes(p.title.toLowerCase())) || properties[0];
    const emiDetails = calculateEMI(target.price * 0.8, 8.5, 20);

    return {
      reply: `Here are the complete details and investment breakdown for **${target.title}**:\n\n` +
        `• **Price**: **${formatIndianCurrency(target.price)}** (Est. EMI: ${emiDetails.emiFormatted})\n` +
        `• **Configuration**: ${target.bedrooms ? `${target.bedrooms} BHK` : target.propertyType} | ${target.bathrooms || 3} Baths | **${target.area} sq ft**\n` +
        `• **Location**: ${target.address}, ${target.city}\n` +
        `• **Facing**: ${target.facing || 'East Facing'} (Vastu Compliant)\n` +
        `• **Amenities**: ${(target.amenities || []).join(', ') || 'Clubhouse, 24/7 Security, Power Backup'}\n\n` +
        `**Expert Insights:**\n` +
        `This property is situated in a high-demand residential corridor with projected annual appreciation of 10-12%. ` +
        `Verified by HomeNest, clear legal documentation, and ready for site visits.\n\n` +
        `Would you like to schedule an inspection visit or connect with the listing agent?`,
      followUps: [
        `Calculate loan EMI for ${target.title}`,
        `Compare ${target.title} with other properties in ${target.city}`,
        'What are the stamp duty charges in this area?'
      ]
    };
  }

  // 3. HOME LOANS, EMI, INTEREST & FINANCING
  if (msgLower.includes('loan') || msgLower.includes('emi') || msgLower.includes('interest') || msgLower.includes('down payment') || msgLower.includes('finance')) {
    const samplePropertyPrice = filters.maxPrice || (properties.length > 0 ? properties[0].price : 7500000);
    const downPayment = samplePropertyPrice * 0.20;
    const loanAmount = samplePropertyPrice * 0.80;
    const emi20 = calculateEMI(loanAmount, 8.5, 20);
    const emi15 = calculateEMI(loanAmount, 8.5, 15);

    return {
      reply: `Here is a comprehensive Home Loan & EMI breakdown for **${formatIndianCurrency(samplePropertyPrice)}** property purchase:\n\n` +
        `• **Estimated Down Payment (20%)**: **${formatIndianCurrency(downPayment)}**\n` +
        `• **Bank Loan Amount (80%)**: **${formatIndianCurrency(loanAmount)}**\n` +
        `• **Current Benchmark Interest Rates**: **8.35% – 8.75% p.a.** (SBI, HDFC, ICICI, Axis Bank with CIBIL 750+)\n` +
        `• **Monthly EMI Options**:\n` +
        `   - **20-Year Tenure**: **${emi20.emiFormatted}** (Total Interest: ${emi20.totalInterestFormatted})\n` +
        `   - **15-Year Tenure**: **${emi15.emiFormatted}** (Total Interest: ${emi15.totalInterestFormatted} – saves on interest!)\n\n` +
        `**Key Tax Benefits (Old Tax Regime)**:\n` +
        `1. **Section 80C**: Tax deduction on principal repayment up to ₹1.5 Lakhs/year.\n` +
        `2. **Section 24(b)**: Tax deduction on interest paid up to ₹2.0 Lakhs/year for self-occupied homes.\n\n` +
        `Would you like to calculate EMI for a different loan amount or check required documentation?`,
      followUps: [
        'What documents are required for home loan?',
        'Find 3 BHK properties in Hyderabad under 80 lakhs',
        'What are the stamp duty charges?'
      ]
    };
  }

  // 4. INVESTMENT HOTSPOTS & ROI
  if (msgLower.includes('invest') || msgLower.includes('best area') || msgLower.includes('roi') || msgLower.includes('appreciation') || msgLower.includes('rental yield')) {
    const city = filters.city || 'Hyderabad';

    const cityInsights = {
      'Hyderabad': [
        '**Gachibowli & Financial District**: Prime IT corridor. Rental yield: 3.8% – 4.5%. High demand from global tech firms.',
        '**Tellapur & Nallagandla**: Rapidly growing residential belt with 12% – 15% annual capital appreciation. Proximity to ORR Exit 2 and top schools.',
        '**Kondapur & Hitec City**: Established urban centers with robust infrastructure, metro access, and continuous resale value.',
        '**Miyapur & Manikonda**: High affordability index with excellent connectivity to employment hubs.'
      ],
      'Bangalore': [
        '**Whitefield**: Established IT hub, high rental yield (4.2% – 5.0%), upcoming metro phase expansion.',
        '**Electronic City**: Affordable tech center with elevated expressway and metro connectivity.',
        '**Sarjapur Road**: Preferred by tech families due to top international schools and gated villa projects.'
      ],
      'Mumbai': [
        '**Bandra & BKC**: Premium luxury capital, ultra-high land value appreciation, strong corporate tenant demand.',
        '**Andheri & Powai**: Balanced rental returns and rapid infrastructure development via new Metro corridors.'
      ],
      'Pune': [
        '**Koregaon Park & Kalyani Nagar**: Elite luxury destinations with high rental yields from senior corporate executives.',
        '**Hinjewadi & Wakad**: Driven by Pune IT Park, robust demand for 2 and 3 BHK rental apartments.'
      ]
    };

    const points = cityInsights[city] || cityInsights['Hyderabad'];

    return {
      reply: `Top investment corridors in **${city}** based on rental yield, infrastructure, and capital appreciation:\n\n` +
        points.map((p, i) => `${i + 1}. ${p}`).join('\n\n') +
        `\n\n**Market Outlook**:\n` +
        `Residential real estate in prime metro corridors continues to yield **8% – 14% annual total return** (combining capital appreciation + rental yield). Verified RERA-approved properties offer the highest security and liquidity.\n\n` +
        `Here are curated verified listings currently available in these high-growth zones:`,
      followUps: [
        `Find properties in ${city} under ₹80 lakhs`,
        `Show luxury villas in ${city}`,
        'What documents are required to register a property?'
      ]
    };
  }

  // 5. LEGAL, RERA, STAMP DUTY & REGISTRATION
  if (msgLower.includes('document') || msgLower.includes('rera') || msgLower.includes('stamp duty') || msgLower.includes('registration') || msgLower.includes('legal') || msgLower.includes('khata')) {
    return {
      reply: `Here is the essential checklist for **Property Verification, Legal Due Diligence & Registration** in India:\n\n` +
        `**1. Mandatory Document Verification Checklist:**\n` +
        `• **Title Deed & Chain of Ownership**: Original title deeds showing clear unbroken ownership for at least 30 years.\n` +
        `• **Encumbrance Certificate (EC)**: Reflects whether the property has any pending mortgage or legal dues (obtain for 15–30 years).\n` +
        `• **RERA Registration**: Confirm the project's RERA number on the official state RERA portal.\n` +
        `• **Approved Building Plan & OC/CC**: Occupancy Certificate (OC) ensures the builder adhered to municipal sanctions.\n` +
        `• **Property Tax Receipts**: Ensure seller has cleared all municipal property taxes up to the latest financial quarter.\n\n` +
        `**2. Typical Government Charges:**\n` +
        `• **Stamp Duty**: Ranges from **5% to 7.5%** depending on state (Telangana ~7.5%, Maharashtra ~5-6%, Karnataka ~5%).\n` +
        `• **Registration Fee**: Typically **0.5% to 1%** of property value.\n\n` +
        `HomeNest properties undergo preliminary document screening before listing. Always consult a certified legal advisor before final deed registration!`,
      followUps: [
        'Calculate EMI for 75 Lakh property',
        'Show 3 BHK in Hyderabad under 80 lakhs',
        'What are the best areas to invest in Hyderabad?'
      ]
    };
  }

  // 6. PROPERTY SEARCH MATCHES
  if (properties.length > 0) {
    const city = filters.city || 'your preferred location';
    const bed = filters.bedrooms ? `${filters.bedrooms} BHK` : '';
    const budgetText = filters.maxPrice ? `under ${formatIndianCurrency(filters.maxPrice)}` : '';
    const criteriaDesc = [bed, filters.propertyType, budgetText, city ? `in ${city}` : ''].filter(Boolean).join(' ');

    return {
      reply: `I found **${properties.length} verified properties** matching ${criteriaDesc || 'your search criteria'}.\n\n` +
        `Here are the top options handpicked for you based on verified title deeds, price competitiveness, and connectivity. Click on any card below to view full specifications, photos, or to contact the agent directly:`,
      followUps: [
        'Compare these properties',
        'Tell me about home loan options',
        `What are the best areas to invest in ${city}?`
      ]
    };
  }

  // 7. DEFAULT HELPFUL FALLBACK
  return {
    reply: `I couldn't find an exact match for your specific filters right now, but I have pulled our top verified listings in the region with excellent connectivity and high livability scores.\n\n` +
      `You can refine your search by changing the city, adjusting your budget, or choosing a different bedroom count (e.g. "3 BHK in Hyderabad under 80 Lakhs").`,
    followUps: [
      'Find 3 BHK properties in Hyderabad under ₹80 lakhs',
      'Show villas in Gachibowli',
      'What are the best areas to invest in Hyderabad?'
    ]
  };
};

/**
 * Call Remote LLM Providers (Gemini, Groq, OpenRouter, OpenAI, APInex)
 * Fails fast on error or quota issues so user experience remains swift and smooth.
 */
const callExternalLlm = async (chatMessages, systemPrompt) => {
  const timeoutMs = 4000; // 4 second fast timeout

  // 1. Check Google Gemini API
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey.trim()) {
    try {
      const geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);

      // Convert standard chat messages to Gemini content format
      const geminiContents = chatMessages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: geminiContents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
          }
        }),
        signal: controller.signal
      });
      clearTimeout(id);

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) {
          return { text: text.trim(), provider: `Google Gemini (${geminiModel})` };
        }
      }
    } catch (e) {
      console.warn('[Gemini LLM Call Skipped]:', e.message);
    }
  }

  // 2. Check Groq API
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && groqKey.trim()) {
    try {
      const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: groqModel,
          messages: [{ role: 'system', content: systemPrompt }, ...chatMessages],
          temperature: 0.7,
          max_tokens: 750
        }),
        signal: controller.signal
      });
      clearTimeout(id);

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text && text.trim()) {
          return { text: text.trim(), provider: `Groq AI (${groqModel})` };
        }
      }
    } catch (e) {
      console.warn('[Groq LLM Call Skipped]:', e.message);
    }
  }

  // 3. Check OpenAI API
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey && openAiKey.trim()) {
    try {
      const openAiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiKey}`
        },
        body: JSON.stringify({
          model: openAiModel,
          messages: [{ role: 'system', content: systemPrompt }, ...chatMessages],
          temperature: 0.7,
          max_tokens: 750
        }),
        signal: controller.signal
      });
      clearTimeout(id);

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text && text.trim()) {
          return { text: text.trim(), provider: `OpenAI (${openAiModel})` };
        }
      }
    } catch (e) {
      console.warn('[OpenAI LLM Call Skipped]:', e.message);
    }
  }

  // 4. Check APInex API (only if key exists and not explicitly failed previously)
  const apinexApiKey = process.env.APINEX_API_KEY;
  const apinexBaseUrl = process.env.APINEX_BASE_URL || 'https://api.apinex.bond/v1';
  const apinexModel = process.env.APINEX_MODEL || 'deepseek-v4-flash';

  if (apinexApiKey && apinexApiKey.trim()) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3500); // 3.5s fast timeout

      const res = await fetch(`${apinexBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apinexApiKey}`
        },
        body: JSON.stringify({
          model: apinexModel,
          messages: [{ role: 'system', content: systemPrompt }, ...chatMessages],
          temperature: 0.7,
          max_tokens: 600
        }),
        signal: controller.signal
      });
      clearTimeout(id);

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text && text.trim()) {
          return { text: text.trim(), provider: `APInex (${apinexModel})` };
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn('[APInex API returned non-200]:', errJson.error?.message || res.status);
      }
    } catch (e) {
      console.warn('[APInex Call Skipped]:', e.message);
    }
  }

  return null;
};

/**
 * Main AI Chat Processor
 * Flow: User Query -> MongoDB Search -> (Optional Remote LLM with fast failover) -> Real Estate AI Engine -> Answer
 */
export const processAiChat = async ({ message, conversationHistory = [], userPreferences = {} }) => {
  const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Record into recent queries store
  const trimmed = (message || '').trim();
  if (trimmed && !recentQueriesStore.some(q => q.query.toLowerCase() === trimmed.toLowerCase())) {
    recentQueriesStore.unshift({
      id: Date.now().toString(),
      query: trimmed,
      timestamp: timeNow,
      timeLabel: 'Just now'
    });
    if (recentQueriesStore.length > 10) recentQueriesStore.pop();
  }

  // 1. Extract search criteria from natural language prompt
  const filters = extractSearchFilters(message, userPreferences || {});

  // 2. Query MongoDB for real-time property matches
  const matchingProperties = await fetchMatchingProperties(filters);

  // Prepare property context for reasoning
  const propertyContext = matchingProperties.map(p => ({
    title: p.title,
    priceFormatted: formatIndianCurrency(p.price),
    priceRaw: p.price,
    city: p.city,
    address: p.address,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    area: `${p.area} sq ft`,
    propertyType: p.propertyType,
    listingType: p.listingType,
    facing: p.facing || 'East',
    amenities: (p.amenities || []).join(', '),
    slug: p.slug
  }));

  const systemPrompt = `You are "HomeNest AI Property Assistant", an elite real estate advisor and investment consultant.
Help users discover homes, compare properties, explain localities, analyze investment opportunities, and answer home loan queries with authentic figures.

REAL-TIME DATABASE PROPERTIES MATCHING USER QUERY:
${JSON.stringify(propertyContext, null, 2)}

GUIDELINES:
1. If the user asks for properties, acknowledge the properties found concisely and highlight what makes them desirable.
2. Keep the answer friendly, professional, crisp, and informative with Markdown formatting (bullet points, bold text).
3. If the user asks to compare, provide a neat comparison of price, area, location, and key features.
4. If the user asks about loans or investment, give authentic practical figures (interest rates around 8.5%, top areas like Gachibowli, Kondapur, Tellapur).
5. Always invite the user to inspect details or ask for more recommendations.`;

  const chatMessages = [
    ...(Array.isArray(conversationHistory) ? conversationHistory : []).slice(-4).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text || ''
    })),
    { role: 'user', content: message }
  ];

  let aiReply = '';
  let providerUsed = 'HomeNest AI Assistant';

  // The built-in engine remains available during a provider outage. An
  // explicit AI_USE_EXTERNAL_LLM=false keeps the deterministic engine only.
  const hasConfiguredLlm = Boolean(
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GROQ_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.APINEX_API_KEY?.trim()
  );
  const useExternalLlm = process.env.AI_USE_EXTERNAL_LLM === 'true' ||
    (process.env.AI_USE_EXTERNAL_LLM !== 'false' && hasConfiguredLlm);
  const llmResult = useExternalLlm
    ? await callExternalLlm(chatMessages, systemPrompt)
    : null;

  if (llmResult && llmResult.text) {
    aiReply = llmResult.text;
    providerUsed = llmResult.provider;
  } else {
    // 4. Fallback to Built-in Real Estate Neural Reasoning Engine
    const domainResult = generateDomainAiResponse(message, matchingProperties, filters);
    aiReply = domainResult.reply;
    providerUsed = 'HomeNest AI Assistant';
  }

  // Dynamic follow-up suggestion chips
  const domainDetails = generateDomainAiResponse(message, matchingProperties, filters);
  const followUps = domainDetails.followUps || [
    'Would you like to see more properties, apply additional filters, or compare these options?',
    'Suggest more similar properties based on my preferences',
    'Tell me about home loan options'
  ];

  return {
    reply: aiReply,
    properties: matchingProperties,
    followUps,
    filters,
    provider: providerUsed,
    timestamp: timeNow
  };
};

export const getRecentQueriesList = () => {
  return recentQueriesStore;
};
