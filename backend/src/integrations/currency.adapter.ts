/**
 * Currency Conversion & Destination Country Currency Adapter
 * Connects to live Frankfurter ECB API with offline fallback.
 * Maps destination countries to their official local currencies.
 */

interface CurrencyRates {
  [currency: string]: number;
}

const FALLBACK_RATES: CurrencyRates = {
  USD: 1.0,
  INR: 83.5,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 154.5,
  AED: 3.67,
  THB: 35.5,
  SGD: 1.34,
  CAD: 1.38,
  AUD: 1.52,
  CHF: 0.88,
  IDR: 15800.0,
  VND: 25400.0,
  MYR: 4.65,
  SAR: 3.75,
  KRW: 1380.0,
  TRY: 34.2,
  MXN: 18.5,
  EGP: 48.5,
  ZAR: 18.2,
  NZD: 1.68,
  BRL: 5.45,
  LKR: 300.0,
  NPR: 133.5,
  MVR: 15.4,
  HKD: 7.82,
  CNY: 7.24,
  PHP: 58.2,
  QAR: 3.64
};

const SYMBOL_MAP: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AED: 'AED',
  THB: '฿',
  SGD: 'S$',
  CAD: 'CA$',
  AUD: 'A$',
  CHF: 'CHF',
  IDR: 'Rp',
  VND: '₫',
  MYR: 'RM',
  SAR: 'SAR',
  KRW: '₩',
  TRY: '₺',
  MXN: 'Mex$',
  EGP: 'E£',
  ZAR: 'R',
  NZD: 'NZ$',
  BRL: 'R$',
  LKR: 'Rs',
  NPR: 'Rs',
  MVR: 'Rf',
  HKD: 'HK$',
  CNY: '¥',
  PHP: '₱',
  QAR: 'QR'
};

interface DestinationCurrencyRule {
  currency: string;
  country: string;
  keywords: string[];
}

const DESTINATION_CURRENCY_RULES: DestinationCurrencyRule[] = [
  // 1. Japan
  {
    currency: 'JPY',
    country: 'Japan',
    keywords: [
      'japan', 'nippon', 'nihon', 'tokyo', 'kyoto', 'osaka', 'sapporo', 'hiroshima',
      'nara', 'fukuoka', 'nagoya', 'yokohama', 'kobe', 'hakone', 'mount fuji', 'mt fuji',
      'fuji', 'kanazawa', 'kamakura', 'nikko', 'takayama', 'niseko', 'okinawa', 'hokkaido',
      'shinjuku', 'shibuya', 'ginza', 'akihabara', 'sendai', 'matsumoto'
    ]
  },
  // 2. United Kingdom
  {
    currency: 'GBP',
    country: 'United Kingdom',
    keywords: [
      'united kingdom', 'great britain', 'britain', 'england', 'scotland', 'wales',
      'northern ireland', 'london', 'edinburgh', 'manchester', 'liverpool', 'glasgow',
      'oxford', 'cambridge', 'birmingham', 'bath', 'bristol', 'york', 'belfast',
      'cardiff', 'brighton', 'cotswolds', 'highlands', 'isle of skye', 'stonehenge',
      'windsor', 'cornwall', 'leeds'
    ]
  },
  // 3. Eurozone
  {
    currency: 'EUR',
    country: 'Eurozone',
    keywords: [
      'france', 'paris', 'nice', 'lyon', 'marseille', 'bordeaux', 'strasbourg', 'cannes',
      'provence', 'normandy', 'versailles', 'chamonix', 'french riviera', 'monaco',
      'italy', 'italia', 'rome', 'roma', 'venice', 'venezia', 'florence', 'firenze',
      'milan', 'milano', 'naples', 'napoli', 'amalfi', 'amalfi coast', 'cinque terre',
      'sicily', 'tuscany', 'bologna', 'pompeii', 'lake como', 'positano', 'capri',
      'verona', 'turin', 'sardinia', 'pisa',
      'spain', 'espana', 'barcelona', 'madrid', 'seville', 'sevilla', 'valencia',
      'ibiza', 'mallorca', 'majorca', 'granada', 'malaga', 'tenerife', 'canary islands',
      'cordoba', 'san sebastian', 'bilbao', 'andalusia', 'alicante',
      'germany', 'deutschland', 'berlin', 'munich', 'munchen', 'frankfurt', 'hamburg',
      'cologne', 'koln', 'bavaria', 'black forest', 'heidelberg', 'dresden', 'stuttgart',
      'netherlands', 'holland', 'amsterdam', 'rotterdam', 'utrecht', 'the hague', 'den haag',
      'greece', 'athens', 'santorini', 'mykonos', 'crete', 'rhodes', 'corfu', 'zakynthos',
      'portugal', 'lisbon', 'lisboa', 'porto', 'algarve', 'sintra', 'madeira', 'azores', 'faro',
      'austria', 'vienna', 'wien', 'salzburg', 'innsbruck', 'hallstatt',
      'belgium', 'brussels', 'bruges', 'ghent', 'antwerp',
      'ireland', 'dublin', 'galway', 'cork', 'killarney', 'cliffs of moher',
      'finland', 'helsinki', 'rovaniemi', 'lapland', 'malta', 'valletta', 'cyprus',
      'slovakia', 'bratislava', 'slovenia', 'ljubljana', 'estonia', 'tallinn', 'latvia',
      'riga', 'lithuania', 'vilnius', 'luxembourg'
    ]
  },
  // 4. India
  {
    currency: 'INR',
    country: 'India',
    keywords: [
      'india', 'bharat', 'hindustan', 'goa', 'panaji', 'calangute', 'anjuna', 'baga',
      'candolim', 'vagator', 'palolem', 'colva', 'manali', 'shimla', 'dharamshala',
      'mcleodganj', 'kasol', 'kullu', 'spiti', 'ladakh', 'leh', 'kashmir', 'srinagar',
      'gulmarg', 'pahalgam', 'jaipur', 'udaipur', 'jodhpur', 'jaisalmer', 'pushkar',
      'agra', 'taj mahal', 'varanasi', 'banaras', 'kashi', 'delhi', 'new delhi',
      'mumbai', 'bombay', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 'madras',
      'kolkata', 'calcutta', 'pune', 'ahmedabad', 'amritsar', 'golden temple', 'rishikesh',
      'haridwar', 'nainital', 'mussoorie', 'munnar', 'alleppey', 'alappuzha', 'kochi',
      'cochin', 'varkala', 'wayanad', 'thekkady', 'hampi', 'mysore', 'mysuru', 'coorg',
      'madikeri', 'ooty', 'kodaikanal', 'pondicherry', 'puducherry', 'darjeeling',
      'gangtok', 'sikkim', 'meghalaya', 'shillong', 'kaziranga', 'assam', 'andaman',
      'port blair', 'havelock', 'kerala', 'rajasthan', 'himachal', 'himachal pradesh', 'uttarakhand'
    ]
  },
  // 5. United Arab Emirates
  {
    currency: 'AED',
    country: 'United Arab Emirates',
    keywords: [
      'united arab emirates', 'emirates', 'dubai', 'abu dhabi', 'sharjah',
      'ras al khaimah', 'fujairah', 'ajman', 'burj khalifa', 'palm jumeirah', 'deira'
    ]
  },
  // 6. Thailand
  {
    currency: 'THB',
    country: 'Thailand',
    keywords: [
      'thailand', 'siam', 'bangkok', 'phuket', 'chiang mai', 'pattaya', 'krabi',
      'koh samui', 'koh phangan', 'koh tao', 'hua hin', 'ayutthaya', 'phi phi',
      'railay', 'chiang rai'
    ]
  },
  // 7. Singapore
  {
    currency: 'SGD',
    country: 'Singapore',
    keywords: ['singapore', 'sentosa', 'marina bay', 'changi']
  },
  // 8. United States
  {
    currency: 'USD',
    country: 'United States',
    keywords: [
      'united states', 'america', 'california', 'new york', 'florida',
      'texas', 'hawaii', 'nevada', 'colorado', 'massachusetts', 'illinois', 'arizona',
      'oregon', 'georgia', 'louisiana', 'utah', 'alaska', 'new york city', 'manhattan',
      'brooklyn', 'los angeles', 'san francisco', 'las vegas', 'vegas', 'chicago',
      'miami', 'orlando', 'seattle', 'boston', 'washington dc', 'austin', 'san diego',
      'honolulu', 'maui', 'oahu', 'kauai', 'new orleans', 'denver', 'philadelphia',
      'grand canyon', 'yosemite', 'yellowstone', 'nashville', 'san jose'
    ]
  },
  // 9. Canada
  {
    currency: 'CAD',
    country: 'Canada',
    keywords: [
      'canada', 'toronto', 'vancouver', 'montreal', 'banff', 'calgary', 'ottawa',
      'quebec', 'quebec city', 'whistler', 'niagara falls', 'victoria', 'jasper', 'halifax'
    ]
  },
  // 10. Australia
  {
    currency: 'AUD',
    country: 'Australia',
    keywords: [
      'australia', 'aussie', 'sydney', 'melbourne', 'brisbane', 'perth', 'gold coast',
      'cairns', 'adelaide', 'great barrier reef', 'tasmania', 'hobart', 'whitsundays',
      'byron bay', 'darwin', 'canberra'
    ]
  },
  // 11. Switzerland
  {
    currency: 'CHF',
    country: 'Switzerland',
    keywords: [
      'switzerland', 'swiss', 'zurich', 'geneva', 'lucerne', 'interlaken', 'zermatt',
      'basel', 'matterhorn', 'jungfrau', 'lausanne', 'bern', 'st moritz', 'grindelwald', 'montreux'
    ]
  },
  // 12. Indonesia
  {
    currency: 'IDR',
    country: 'Indonesia',
    keywords: [
      'indonesia', 'bali', 'jakarta', 'ubud', 'lombok', 'seminyak', 'kuta',
      'canggu', 'nusa dua', 'uluwatu', 'komodo', 'yogyakarta', 'gili', 'gili islands',
      'raja ampat', 'sanur', 'jimbaran'
    ]
  },
  // 13. Vietnam
  {
    currency: 'VND',
    country: 'Vietnam',
    keywords: [
      'vietnam', 'hanoi', 'ho chi minh', 'ho chi minh city', 'saigon', 'da nang',
      'hoi an', 'ha long', 'halong bay', 'phu quoc', 'nha trang', 'sapa', 'hue', 'mekong'
    ]
  },
  // 14. Malaysia
  {
    currency: 'MYR',
    country: 'Malaysia',
    keywords: [
      'malaysia', 'kuala lumpur', 'penang', 'george town', 'langkawi', 'malacca',
      'melaka', 'kota kinabalu', 'borneo', 'genting', 'cameron highlands', 'johor bahru', 'kuching'
    ]
  },
  // 15. Saudi Arabia
  {
    currency: 'SAR',
    country: 'Saudi Arabia',
    keywords: [
      'saudi arabia', 'saudi', 'ksa', 'riyadh', 'jeddah', 'mecca', 'makkah',
      'medina', 'madinah', 'alula', 'al-ula', 'dammam', 'khobar', 'diriyah', 'abha', 'taif'
    ]
  },
  // 16. South Korea
  {
    currency: 'KRW',
    country: 'South Korea',
    keywords: [
      'south korea', 'korea', 'seoul', 'busan', 'jeju', 'jeju island', 'incheon',
      'daegu', 'gyeongju'
    ]
  },
  // 17. Turkey
  {
    currency: 'TRY',
    country: 'Turkey',
    keywords: [
      'turkey', 'turkiye', 'türkiye', 'istanbul', 'cappadocia', 'antalya', 'bodrum',
      'ankara', 'izmir', 'pamukkale', 'fethiye', 'marmaris', 'ephesus'
    ]
  },
  // 18. Mexico
  {
    currency: 'MXN',
    country: 'Mexico',
    keywords: [
      'mexico', 'cancun', 'mexico city', 'cdmx', 'tulum', 'playa del carmen', 'cabo',
      'cabo san lucas', 'puerto vallarta', 'oaxaca', 'guadalajara', 'riviera maya', 'cozumel', 'chichen itza'
    ]
  },
  // 19. Egypt
  {
    currency: 'EGP',
    country: 'Egypt',
    keywords: [
      'egypt', 'cairo', 'giza', 'luxor', 'aswan', 'sharm el sheikh', 'hurghada', 'alexandria', 'nile'
    ]
  },
  // 20. South Africa
  {
    currency: 'ZAR',
    country: 'South Africa',
    keywords: [
      'south africa', 'cape town', 'johannesburg', 'kruger', 'kruger national park',
      'durban', 'stellenbosch', 'garden route', 'pretoria'
    ]
  },
  // 21. New Zealand
  {
    currency: 'NZD',
    country: 'New Zealand',
    keywords: [
      'new zealand', 'auckland', 'queenstown', 'christchurch', 'rotorua', 'wellington',
      'milford sound', 'taupo', 'hobbiton'
    ]
  },
  // 22. Brazil
  {
    currency: 'BRL',
    country: 'Brazil',
    keywords: [
      'brazil', 'brasil', 'rio de janeiro', 'sao paulo', 'são paulo', 'salvador',
      'iguazu', 'iguazu falls', 'amazon', 'brasilia'
    ]
  },
  // 23. Sri Lanka
  {
    currency: 'LKR',
    country: 'Sri Lanka',
    keywords: [
      'sri lanka', 'ceylon', 'colombo', 'kandy', 'galle', 'ella', 'sigiriya', 'mirissa', 'nuwara eliya'
    ]
  },
  // 24. Nepal
  {
    currency: 'NPR',
    country: 'Nepal',
    keywords: ['nepal', 'kathmandu', 'pokhara', 'everest', 'annapurna', 'chitwan', 'bhaktapur', 'lumbini']
  },
  // 25. Maldives
  {
    currency: 'MVR',
    country: 'Maldives',
    keywords: ['maldives', 'male', 'maafushi', 'hulhumale']
  },
  // 26. China & Hong Kong
  {
    currency: 'HKD',
    country: 'Hong Kong',
    keywords: ['hong kong', 'kowloon']
  },
  {
    currency: 'CNY',
    country: 'China',
    keywords: ['china', 'beijing', 'shanghai', 'guangzhou', 'shenzhen', "xi'an", 'xian', 'chengdu', 'great wall', 'hangzhou']
  },
  // 27. Philippines
  {
    currency: 'PHP',
    country: 'Philippines',
    keywords: ['philippines', 'manila', 'boracay', 'palawan', 'cebu', 'siargao', 'el nido', 'coron', 'bohol']
  },
  // 28. Qatar
  {
    currency: 'QAR',
    country: 'Qatar',
    keywords: ['qatar', 'doha']
  }
];

const SHORT_CODE_MAP: Record<string, { currency: string; country: string }> = {
  uk: { currency: 'GBP', country: 'United Kingdom' },
  usa: { currency: 'USD', country: 'United States' },
  us: { currency: 'USD', country: 'United States' },
  uae: { currency: 'AED', country: 'United Arab Emirates' },
  jp: { currency: 'JPY', country: 'Japan' },
  in: { currency: 'INR', country: 'India' },
  ind: { currency: 'INR', country: 'India' },
  nz: { currency: 'NZD', country: 'New Zealand' },
  hk: { currency: 'HKD', country: 'Hong Kong' },
  sg: { currency: 'SGD', country: 'Singapore' },
  ch: { currency: 'CHF', country: 'Switzerland' }
};

/**
 * Detect the destination country's official currency.
 */
export function detectCurrencyForDestination(destination: string): string {
  if (!destination || typeof destination !== 'string') {
    return 'INR';
  }

  const clean = destination.toLowerCase().trim();
  if (!clean) return 'INR';

  // Check standalone short codes e.g. "UK", "USA", "UAE" using word boundary
  for (const [code, info] of Object.entries(SHORT_CODE_MAP)) {
    const regex = new RegExp(`\\b${code}\\b`, 'i');
    if (regex.test(clean)) {
      return info.currency;
    }
  }

  // Check comprehensive destination rules
  for (const rule of DESTINATION_CURRENCY_RULES) {
    for (const kw of rule.keywords) {
      if (clean.includes(kw)) {
        return rule.currency;
      }
    }
  }

  return 'USD';
}

/**
 * Detect human-readable country name for a destination.
 */
export function getCountryForDestination(destination: string): string {
  if (!destination || typeof destination !== 'string') return '';
  const clean = destination.toLowerCase().trim();
  if (!clean) return '';

  for (const [code, info] of Object.entries(SHORT_CODE_MAP)) {
    const regex = new RegExp(`\\b${code}\\b`, 'i');
    if (regex.test(clean)) {
      return info.country;
    }
  }

  for (const rule of DESTINATION_CURRENCY_RULES) {
    for (const kw of rule.keywords) {
      if (clean.includes(kw)) {
        return rule.country;
      }
    }
  }

  return '';
}

/**
 * Returns a reasonable default planned budget for a destination currency and duration.
 */
export function getDefaultBudgetForCurrency(currency: string, durationDays = 3): number {
  const curr = (currency || 'USD').toUpperCase().trim();
  const days = Math.max(1, durationDays);

  switch (curr) {
    case 'INR':
      return Math.max(500, days * 3500);
    case 'JPY':
      return Math.max(10000, days * 45000);
    case 'EUR':
    case 'USD':
    case 'CHF':
      return Math.max(150, days * 350);
    case 'GBP':
      return Math.max(120, days * 280);
    case 'AED':
    case 'SAR':
      return Math.max(300, days * 1200);
    case 'THB':
      return Math.max(2000, days * 8500);
    case 'SGD':
    case 'CAD':
    case 'AUD':
    case 'NZD':
      return Math.max(200, days * 450);
    case 'IDR':
      return Math.max(1000000, days * 4000000);
    case 'VND':
      return Math.max(2000000, days * 7000000);
    case 'KRW':
      return Math.max(100000, days * 400000);
    case 'TRY':
      return Math.max(2000, days * 8000);
    case 'MXN':
      return Math.max(1500, days * 6000);
    case 'EGP':
      return Math.max(3000, days * 12000);
    case 'ZAR':
      return Math.max(1500, days * 5500);
    case 'BRL':
      return Math.max(500, days * 1800);
    default:
      return Math.max(150, days * 350);
  }
}

/**
 * Returns currency symbol.
 */
export function getCurrencySymbol(currencyCode?: string): string {
  if (!currencyCode) return '$';
  const upper = currencyCode.toUpperCase().trim();
  return SYMBOL_MAP[upper] || upper;
}

export class CurrencyAdapter {
  private static cachedRates: { [base: string]: { timestamp: number; rates: CurrencyRates } } = {};
  private static CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

  /**
   * Fetch current exchange rates for a base currency.
   */
  static async getRates(base = 'USD'): Promise<{ rates: CurrencyRates; source: 'live_api' | 'fallback_cache' }> {
    const baseUpper = base.toUpperCase();
    const cached = this.cachedRates[baseUpper];

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return { rates: cached.rates, source: 'fallback_cache' };
    }

    try {
      const response = await fetch(`https://api.frankfurter.app/latest?from=${baseUpper}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(4000)
      });

      if (response.ok) {
        const data = await response.json() as { rates: CurrencyRates };
        const combinedRates = { ...data.rates, [baseUpper]: 1.0 };
        this.cachedRates[baseUpper] = { timestamp: Date.now(), rates: combinedRates };
        return { rates: combinedRates, source: 'live_api' };
      }
    } catch {
      // Graceful fallback on network timeout or offline
    }

    // Build fallback rates relative to base
    const baseRateInUSD = FALLBACK_RATES[baseUpper] || 1.0;
    const computedRates: CurrencyRates = {};
    for (const [curr, rateInUSD] of Object.entries(FALLBACK_RATES)) {
      computedRates[curr] = Number((rateInUSD / baseRateInUSD).toFixed(4));
    }

    return { rates: computedRates, source: 'fallback_cache' };
  }

  /**
   * Convert an amount between currencies.
   */
  static async convert(amount: number, from: string, to: string): Promise<{ convertedAmount: number; rate: number; source: string }> {
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();

    if (fromUpper === toUpper) {
      return { convertedAmount: amount, rate: 1.0, source: 'identical_currency' };
    }

    const { rates, source } = await this.getRates(fromUpper);
    const targetRate = rates[toUpper] || (FALLBACK_RATES[toUpper] ? FALLBACK_RATES[toUpper] / (FALLBACK_RATES[fromUpper] || 1) : 1);
    const converted = Number((amount * targetRate).toFixed(2));

    return {
      convertedAmount: converted,
      rate: targetRate,
      source
    };
  }

  static detectCurrencyForDestination = detectCurrencyForDestination;
  static getCountryForDestination = getCountryForDestination;
  static getDefaultBudgetForCurrency = getDefaultBudgetForCurrency;
  static getCurrencySymbol = getCurrencySymbol;
}
