/**
 * Currency utility helpers for formatting amounts and symbols.
 * Comprehensive destination-to-currency engine: automatically maps target travel
 * destinations and countries to their official local currency.
 */

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: 'Rs' },
  { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: 'Rf' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QR' }
];

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

/**
 * Destination & country mapping rule definition
 */
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
      // France
      'france', 'paris', 'nice', 'lyon', 'marseille', 'bordeaux', 'strasbourg', 'cannes',
      'provence', 'normandy', 'versailles', 'chamonix', 'french riviera', 'monaco',
      // Italy
      'italy', 'italia', 'rome', 'roma', 'venice', 'venezia', 'florence', 'firenze',
      'milan', 'milano', 'naples', 'napoli', 'amalfi', 'amalfi coast', 'cinque terre',
      'sicily', 'tuscany', 'bologna', 'pompeii', 'lake como', 'positano', 'capri',
      'verona', 'turin', 'sardinia', 'pisa',
      // Spain
      'spain', 'espana', 'barcelona', 'madrid', 'seville', 'sevilla', 'valencia',
      'ibiza', 'mallorca', 'majorca', 'granada', 'malaga', 'tenerife', 'canary islands',
      'cordoba', 'san sebastian', 'bilbao', 'andalusia', 'alicante',
      // Germany
      'germany', 'deutschland', 'berlin', 'munich', 'munchen', 'frankfurt', 'hamburg',
      'cologne', 'koln', 'bavaria', 'black forest', 'heidelberg', 'dresden', 'stuttgart',
      // Netherlands
      'netherlands', 'holland', 'amsterdam', 'rotterdam', 'utrecht', 'the hague', 'den haag',
      // Greece
      'greece', 'athens', 'santorini', 'mykonos', 'crete', 'rhodes', 'corfu', 'zakynthos',
      // Portugal
      'portugal', 'lisbon', 'lisboa', 'porto', 'algarve', 'sintra', 'madeira', 'azores', 'faro',
      // Austria
      'austria', 'vienna', 'wien', 'salzburg', 'innsbruck', 'hallstatt',
      // Belgium
      'belgium', 'brussels', 'bruges', 'ghent', 'antwerp',
      // Ireland
      'ireland', 'dublin', 'galway', 'cork', 'killarney', 'cliffs of moher',
      // Finland & Others
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

// Word boundary matching for short country/city codes
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
 * Automatically determine the official currency for the destination country.
 * Example:
 *  - "Tokyo, Japan" -> "JPY"
 *  - "Paris, France" -> "EUR"
 *  - "London, UK" -> "GBP"
 *  - "Goa, India" -> "INR"
 *  - "Dubai, UAE" -> "AED"
 *  - "Bangkok, Thailand" -> "THB"
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

  // Default fallback
  return 'USD';
}

/**
 * Returns human-readable country name for a destination.
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
 * Default planned budget for a given currency and duration in days.
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
 * Quick-select preset budgets appropriate for the selected destination currency.
 */
export function getBudgetPresetsForCurrency(currency: string): number[] {
  const curr = (currency || 'USD').toUpperCase().trim();

  switch (curr) {
    case 'INR':
      return [1500, 5000, 15000, 35000, 75000];
    case 'JPY':
      return [30000, 80000, 150000, 300000, 600000];
    case 'EUR':
    case 'USD':
    case 'CHF':
      return [300, 800, 1500, 3000, 6000];
    case 'GBP':
      return [250, 700, 1200, 2500, 5000];
    case 'AED':
    case 'SAR':
      return [1000, 2500, 4000, 8000, 15000];
    case 'THB':
      return [8000, 20000, 35000, 70000, 150000];
    case 'SGD':
    case 'CAD':
    case 'AUD':
    case 'NZD':
      return [400, 1200, 2000, 4000, 8000];
    case 'IDR':
      return [3000000, 8000000, 15000000, 30000000, 60000000];
    case 'VND':
      return [5000000, 12000000, 25000000, 50000000, 100000000];
    case 'KRW':
      return [300000, 800000, 1500000, 3000000, 6000000];
    case 'TRY':
      return [8000, 20000, 35000, 70000, 150000];
    case 'MXN':
      return [5000, 12000, 20000, 40000, 80000];
    case 'EGP':
      return [10000, 25000, 40000, 80000, 160000];
    case 'ZAR':
      return [4000, 10000, 18000, 35000, 70000];
    case 'BRL':
      return [1500, 3500, 6000, 12000, 25000];
    default:
      return [300, 800, 1500, 3000, 6000];
  }
}

/**
 * Returns minimum budget requirement for a currency code.
 */
export function getMinBudgetForCurrency(currency: string): number {
  const curr = (currency || 'USD').toUpperCase().trim();
  switch (curr) {
    case 'INR': return 500;
    case 'JPY': return 5000;
    case 'THB': return 1000;
    case 'AED':
    case 'SAR': return 200;
    case 'IDR': return 500000;
    case 'VND': return 1000000;
    case 'KRW': return 50000;
    case 'TRY':
    case 'MXN': return 1000;
    case 'EGP': return 2000;
    case 'ZAR': return 800;
    case 'BRL': return 300;
    default: return 50;
  }
}

/**
 * Returns the symbol for a 3-letter currency code, e.g. '₹' for INR.
 */
export function getCurrencySymbol(currencyCode?: string): string {
  if (!currencyCode) return '$';
  const upper = currencyCode.toUpperCase().trim();
  return SYMBOL_MAP[upper] || upper;
}

/**
 * Format a numeric amount with the proper currency symbol.
 * Example: formatCurrency(25000, 'INR') -> "₹25,000"
 */
export function formatCurrency(amount: number, currencyCode = 'USD', showCode = false): string {
  const symbol = getCurrencySymbol(currencyCode);
  const formatted = Number(amount || 0).toLocaleString();
  if (showCode) {
    return `${symbol}${formatted} ${currencyCode.toUpperCase()}`;
  }
  return `${symbol}${formatted}`;
}
