import { PlaceItem, CuratedTopicVenues } from '../types/trip.types.js';

export interface TopicBlueprint {
  topicId: string;
  title: string;
  icon: string;
  description: string;
}

export const SUB_TOPICS: TopicBlueprint[] = [
  {
    topicId: 'tourist_attractions',
    title: 'Tourist Attractions & Landmarks',
    icon: '🏛️',
    description: 'Iconic landmarks, scenic lookouts, famous architectural wonders, and must-see attractions.'
  },
  {
    topicId: 'restaurants',
    title: 'Restaurants & Local Food',
    icon: '🍲',
    description: 'Authentic regional cuisine, award-winning dining rooms, coastal seafood, and signature culinary staples.'
  },
  {
    topicId: 'cafes',
    title: 'Cafes & Specialty Coffee',
    icon: '☕',
    description: 'Artisanal roasters, tranquil garden courtyards, breakfast bakeries, and aesthetic workspaces.'
  },
  {
    topicId: 'beaches',
    title: 'Beaches & Waterfronts',
    icon: '🏖️',
    description: 'Pristine shores, golden sand bays, serene sunset coves, and lively coastal water sports.'
  },
  {
    topicId: 'historical_places',
    title: 'Historical Places & Heritage',
    icon: '🏰',
    description: 'Ancient fortresses, UNESCO world heritage sanctuaries, colonial quarters, and monumental ruins.'
  },
  {
    topicId: 'museums',
    title: 'Museums & Art Galleries',
    icon: '🎨',
    description: 'Cultural history museums, fine art exhibits, maritime heritage halls, and living ethnography centers.'
  },
  {
    topicId: 'shopping',
    title: 'Shopping & Night Bazaars',
    icon: '🛍️',
    description: 'Bustling night markets, flea bazaars, spice markets, artisan handicraft emporiums, and designer boutiques.'
  },
  {
    topicId: 'nature_adventure',
    title: 'Nature & Adventure Activities',
    icon: '🌲',
    description: 'Tiered waterfalls, jungle wildlife sanctuaries, scuba diving reefs, river kayaking, and scenic hiking trails.'
  },
  {
    topicId: 'family_friendly',
    title: 'Family-Friendly Activities',
    icon: '🎡',
    description: 'Theme waterparks, marine aquariums, interactive dolphin boat cruises, botanical discovery parks, and playful recreation.'
  },
  {
    topicId: 'nightlife',
    title: 'Nightlife & Sunset Lounges',
    icon: '🍸',
    description: 'Legendary beachfront shacks, open-air music amphitheaters, illuminated cocktail terraces, and vibrant dance clubs.'
  }
];

export function normalizeCategory(cat?: string): string {
  if (!cat) return 'tourist_attractions';
  const c = cat.toLowerCase().trim().replace(/[_-]/g, ' ');

  if (c.includes('beach') || c.includes('coast') || c.includes('shore') || c.includes('cove')) return 'beaches';
  if (c.includes('cafe') || c.includes('coffee') || c.includes('espresso') || c.includes('bakery') || c.includes('bistro')) return 'cafes';
  if (c.includes('restaurant') || c.includes('food') || c.includes('dining') || c.includes('eat') || c.includes('culinary') || c.includes('thali')) return 'restaurants';
  if (c.includes('historic') || c.includes('fort') || c.includes('palace') || c.includes('heritage') || c.includes('monument') || c.includes('church') || c.includes('temple')) return 'historical_places';
  if (c.includes('museum') || c.includes('gallery') || c.includes('art') || c.includes('exhibit')) return 'museums';
  if (c.includes('shop') || c.includes('market') || c.includes('bazaar') || c.includes('mall') || c.includes('flea')) return 'shopping';
  if (c.includes('nature') || c.includes('adventure') || c.includes('trek') || c.includes('hike') || c.includes('park') || c.includes('waterfall') || c.includes('wildlife') || c.includes('outdoor')) return 'nature_adventure';
  if (c.includes('family') || c.includes('kid') || c.includes('child') || c.includes('amusement') || c.includes('aquarium') || c.includes('waterpark')) return 'family_friendly';
  if (c.includes('night') || c.includes('bar') || c.includes('club') || c.includes('pub') || c.includes('lounge') || c.includes('hangout') || c.includes('party')) return 'nightlife';
  if (c.includes('sight') || c.includes('attract') || c.includes('landmark') || c.includes('tourist')) return 'tourist_attractions';

  // Legacy mappings
  if (c === 'dining') return 'restaurants';
  if (c === 'cultural') return 'historical_places';
  if (c === 'outdoor') return 'nature_adventure';
  if (c === 'hangouts') return 'cafes';
  if (c === 'entertainment') return 'nightlife';
  if (c === 'relaxation') return 'beaches';

  return 'tourist_attractions';
}

function makeGoogleMapsUrl(name: string, address?: string, destination?: string): string {
  const q = `${name} ${address || destination || ''}`.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

// -------------------------------------------------------------
// Goa Real-World Verified Venues (12+ per category)
// -------------------------------------------------------------
const GOA_VENUES: Record<string, PlaceItem[]> = {
  tourist_attractions: [
    { id: 'goa-att-1', name: 'Aguada Fort & Portuguese Lighthouse', category: 'tourist_attractions', address: 'Sinquerim, Candolim, Goa 403515', lat: 15.4925, lng: 73.7738, rating: 4.6, reviewCount: 42000, priceLevel: 1, estimatedCost: 50, speciality: 'Panoramic Arabian Sea coastal bastion view' },
    { id: 'goa-att-2', name: 'Chapora Fort Promontory', category: 'tourist_attractions', address: 'Chapora, Vagator, Goa 403509', lat: 15.6058, lng: 73.7366, rating: 4.5, reviewCount: 38000, priceLevel: 1, estimatedCost: 0, speciality: 'Iconic clifftop sunset view over Vagator' },
    { id: 'goa-att-3', name: 'Basilica of Bom Jesus', category: 'tourist_attractions', address: 'Old Goa Rd, Bainguinim, Goa 403402', lat: 15.5009, lng: 73.9116, rating: 4.8, reviewCount: 54000, priceLevel: 1, estimatedCost: 0, speciality: 'UNESCO Baroque basilica holding St. Francis Xavier casket' },
    { id: 'goa-att-4', name: 'Church of Our Lady of the Immaculate Conception', category: 'tourist_attractions', address: 'Rua Emidio Garcia, Panaji, Goa 403001', lat: 15.4989, lng: 73.8278, rating: 4.7, reviewCount: 31000, priceLevel: 1, estimatedCost: 0, speciality: 'Famous zigzagging baroque staircases' },
    { id: 'goa-att-5', name: 'Fontainhas Latin Quarter', category: 'tourist_attractions', address: 'Fontainhas, Panaji, Goa 403001', lat: 15.4950, lng: 73.8320, rating: 4.8, reviewCount: 19500, priceLevel: 1, estimatedCost: 0, speciality: 'Pastel-hued Portuguese villas & azulejo tiles' },
    { id: 'goa-att-6', name: 'Dona Paula Viewpoint', category: 'tourist_attractions', address: 'Dona Paula, Panaji, Goa 403004', lat: 15.4542, lng: 73.8037, rating: 4.3, reviewCount: 28000, priceLevel: 1, estimatedCost: 20, speciality: 'Confluence of Zuari and Mandovi rivers' },
    { id: 'goa-att-7', name: 'Reis Magos Fort', category: 'tourist_attractions', address: 'Verem, Bardez, Goa 403114', lat: 15.4986, lng: 73.8089, rating: 4.5, reviewCount: 12000, priceLevel: 1, estimatedCost: 50, speciality: 'Restored 1551 fortress overlooking Mandovi River' },
    { id: 'goa-att-8', name: 'Cabo de Rama Fort', category: 'tourist_attractions', address: 'Taluka Cabo de Rama, Canacona, Goa 403703', lat: 15.0886, lng: 73.9217, rating: 4.7, reviewCount: 15800, priceLevel: 1, estimatedCost: 0, speciality: 'Dramatic southern Goa marine vista' },
    { id: 'goa-att-9', name: 'Sinquerim Fort', category: 'tourist_attractions', address: 'Sinquerim, Candolim, Goa 403515', lat: 15.4981, lng: 73.7667, rating: 4.6, reviewCount: 18200, priceLevel: 1, estimatedCost: 0, speciality: 'Lower coastal ramparts extending into ocean waves' },
    { id: 'goa-att-10', name: 'Divar Island Village & Piedade Hill', category: 'tourist_attractions', address: 'Divar Island, Tiswadi, Goa 403403', lat: 15.5186, lng: 73.8931, rating: 4.7, reviewCount: 7800, priceLevel: 1, estimatedCost: 10, speciality: 'Scenic ferry crossing and untouched countryside lanes' },
    { id: 'goa-att-11', name: 'Corjuem Island Inland Fort', category: 'tourist_attractions', address: 'Corjuem, Aldona, Goa 403508', lat: 15.5975, lng: 73.8967, rating: 4.4, reviewCount: 6500, priceLevel: 1, estimatedCost: 20, speciality: 'Charming inland masonry fortress surrounded by greenery' },
    { id: 'goa-att-12', name: 'Tiracol Marine Fort', category: 'tourist_attractions', address: 'Tiracol, Pernem, Goa 403524', lat: 15.7289, lng: 73.6828, rating: 4.6, reviewCount: 8900, priceLevel: 2, estimatedCost: 50, speciality: 'Northernmost coastal stronghold on Tiracol river' }
  ],
  restaurants: [
    { id: 'goa-rest-1', name: 'Vinayak Family Restaurant', category: 'restaurants', address: 'House 252, Main Road, Assagao, Goa 403507', lat: 15.5936, lng: 73.7744, rating: 4.7, reviewCount: 18500, priceLevel: 2, estimatedCost: 350, speciality: 'Authentic Goan Fish Curry Thali & Rava Kingfish', dietaryTag: 'both' },
    { id: 'goa-rest-2', name: 'The Fisherman\'s Wharf Riverside', category: 'restaurants', address: 'Mobor Beach, Cavelossim, Goa 403731', lat: 15.1661, lng: 73.9489, rating: 4.6, reviewCount: 22000, priceLevel: 3, estimatedCost: 750, speciality: 'Butter Garlic Prawns & Crab Xec Xec by the river', dietaryTag: 'both' },
    { id: 'goa-rest-3', name: 'Gunpowder South Indian Kitchen', category: 'restaurants', address: 'Anjuna Mapusa Rd, Saunto Vaddo, Assagao, Goa 403507', lat: 15.5921, lng: 73.7689, rating: 4.7, reviewCount: 14200, priceLevel: 3, estimatedCost: 650, speciality: 'Kerala Beef Roast, Appams & Spiced Veg Stews', dietaryTag: 'both' },
    { id: 'goa-rest-4', name: 'Martin\'s Corner Coastal Legend', category: 'restaurants', address: 'Binwaddo, Betalbatim, Goa 403713', lat: 15.2958, lng: 73.9169, rating: 4.6, reviewCount: 29000, priceLevel: 3, estimatedCost: 700, speciality: 'Celebrity favorite Goan Prawn Balchão and Crab Masala', dietaryTag: 'both' },
    { id: 'goa-rest-5', name: 'Mum\'s Kitchen Traditional Goan', category: 'restaurants', address: '854, Martin\'s Building, D.B. Marg, Miramar, Panaji, Goa 403001', lat: 15.4831, lng: 73.8115, rating: 4.5, reviewCount: 11000, priceLevel: 3, estimatedCost: 800, speciality: 'Preserved mother-recipe Goan Pork Vindaloo & Mushroom Xacuti', dietaryTag: 'both' },
    { id: 'goa-rest-6', name: 'Copperleaf Fine Dining', category: 'restaurants', address: 'Chogm Rd, Alto-Porvorim, Goa 403521', lat: 15.5342, lng: 73.8322, rating: 4.6, reviewCount: 16800, priceLevel: 2, estimatedCost: 550, speciality: 'Goan Fish Thali & Coastal Seafood Platters', dietaryTag: 'both' },
    { id: 'goa-rest-7', name: 'Bhatti Village Relish & Feni Bar', category: 'restaurants', address: 'Bhatti, Nerul, Bardez, Goa 403114', lat: 15.5098, lng: 73.7915, rating: 4.7, reviewCount: 6200, priceLevel: 2, estimatedCost: 450, speciality: 'Homestyle secret menu, stuffed calamari, and spiced pork', dietaryTag: 'both' },
    { id: 'goa-rest-8', name: 'Navtara Pure Vegetarian Assagao', category: 'restaurants', address: 'Calangute - Mapusa Rd, Porvorim & Mapusa, Goa', lat: 15.5960, lng: 73.8140, rating: 4.4, reviewCount: 19000, priceLevel: 1, estimatedCost: 200, speciality: 'South Indian dosas, North Indian curries & pure-veg thali', dietaryTag: 'veg' },
    { id: 'goa-rest-9', name: 'Ritz Classic Heritage', category: 'restaurants', address: '18th June Rd, Panaji, Goa 403001', lat: 15.4975, lng: 73.8245, rating: 4.5, reviewCount: 24500, priceLevel: 2, estimatedCost: 380, speciality: 'Classic Panaji Fish Curry Meals with Tisreo (Clams)', dietaryTag: 'both' },
    { id: 'goa-rest-10', name: 'Fat Fish Goan Kitchen', category: 'restaurants', address: 'Calangute - Arpora Rd, Baga, Goa 403516', lat: 15.5684, lng: 73.7610, rating: 4.4, reviewCount: 18000, priceLevel: 2, estimatedCost: 500, speciality: 'Squid Chilly Fry, Surmai fry & Goan Poee bread', dietaryTag: 'both' },
    { id: 'goa-rest-11', name: 'Pousada By The Beach Seafood', category: 'restaurants', address: 'Holiday St, Gaura Vaddo, Calangute, Goa 403516', lat: 15.5344, lng: 73.7612, rating: 4.7, reviewCount: 5200, priceLevel: 4, estimatedCost: 1200, speciality: 'Al-fresco garden dining on the beach with tiger prawns', dietaryTag: 'both' },
    { id: 'goa-rest-12', name: 'Suwadik Goan Thali Restaurant', category: 'restaurants', address: 'Near Municipal Garden, Panaji, Goa 403001', lat: 15.4982, lng: 73.8231, rating: 4.6, reviewCount: 7400, priceLevel: 1, estimatedCost: 260, speciality: 'Authentic local Goan Hindu Saraswat style thali', dietaryTag: 'both' }
  ],
  cafes: [
    { id: 'goa-cafe-1', name: 'Artjuna Garden Cafe & Lifestyle', category: 'cafes', address: '972, Monteiro Vaddo, Anjuna, Goa 403509', lat: 15.5801, lng: 73.7441, rating: 4.6, reviewCount: 12500, priceLevel: 2, estimatedCost: 450, speciality: 'Mediterranean Shakshuka, smoothie bowls & artisan coffee' },
    { id: 'goa-cafe-2', name: 'Baba Au Rhum French Bakery & Cafe', category: 'cafes', address: 'House 1054, Sim Vaddo, Anjuna, Goa 403509', lat: 15.5862, lng: 73.7547, rating: 4.7, reviewCount: 16800, priceLevel: 2, estimatedCost: 550, speciality: 'Wood-fired sourdough pizza, French quiches & cold brews' },
    { id: 'goa-cafe-3', name: 'Eva Cafe Sunset Clifftop', category: 'cafes', address: 'Prais de San Anton, Anjuna, Goa 403509', lat: 15.5786, lng: 73.7408, rating: 4.5, reviewCount: 14000, priceLevel: 3, estimatedCost: 650, speciality: 'Boho-chic clifftop coffee, fresh juices & sunset balcony' },
    { id: 'goa-cafe-4', name: 'Prana Cafe Ashwem Beachside', category: 'cafes', address: 'Ashwem Beach Rd, Mandrem, Goa 403527', lat: 15.6560, lng: 73.7150, rating: 4.7, reviewCount: 6800, priceLevel: 2, estimatedCost: 500, speciality: 'Wholesome organic bowls, avocado toasts & iced matchas' },
    { id: 'goa-cafe-5', name: 'Caravela Cafe & Bistro Fontainhas', category: 'cafes', address: 'House 27, 31st January Rd, Fontainhas, Panaji, Goa 403001', lat: 15.4965, lng: 73.8302, rating: 4.6, reviewCount: 8200, priceLevel: 2, estimatedCost: 400, speciality: 'In-house roasted Latin Quarter espresso & Pastel de Nata' },
    { id: 'goa-cafe-6', name: 'Babka Goa Assagao Artisan Patisserie', category: 'cafes', address: 'House 528/2, Assagao Badem Rd, Assagao, Goa 403507', lat: 15.6012, lng: 73.7711, rating: 4.8, reviewCount: 7500, priceLevel: 2, estimatedCost: 480, speciality: 'Chocolate babka, flaky almond croissants & flat whites' },
    { id: 'goa-cafe-7', name: 'Rudy\'s Golden Mermaid Anjuna', category: 'cafes', address: 'Small Vagator Beach Rd, Vagator, Goa 403509', lat: 15.6022, lng: 73.7380, rating: 4.6, reviewCount: 5100, priceLevel: 2, estimatedCost: 420, speciality: 'Ocean-view breakfast pancakes and iced Americanos' },
    { id: 'goa-cafe-8', name: 'Cream Choc Artisanal Italian Gelato', category: 'cafes', address: 'Anjuna Mapusa Rd, Anjuna, Goa 403509', lat: 15.5841, lng: 73.7492, rating: 4.9, reviewCount: 9200, priceLevel: 2, estimatedCost: 280, speciality: 'Authentic Italian pistachio, dark chocolate & mango gelato' },
    { id: 'goa-cafe-9', name: 'Mojigao Eco-Resort Cafe', category: 'cafes', address: 'Near Ganeshpuri Temple, Assagao, Goa 403507', lat: 15.5991, lng: 73.7820, rating: 4.7, reviewCount: 4800, priceLevel: 3, estimatedCost: 600, speciality: 'Forest canopy seating, Mediterranean mezze & herbal teas' },
    { id: 'goa-cafe-10', name: 'Cafe Bodega Art Gallery Sunken Courtyard', category: 'cafes', address: 'Sunaparanta Center for the Arts, Altinho, Panaji, Goa 403001', lat: 15.4920, lng: 73.8248, rating: 4.5, reviewCount: 3900, priceLevel: 2, estimatedCost: 450, speciality: 'Art gallery garden cafe with waffles, red velvet cakes & pour-overs' },
    { id: 'goa-cafe-11', name: 'Grounded Assagao Coffee Roastery', category: 'cafes', address: 'House 510, Assagao, Goa 403507', lat: 15.5977, lng: 73.7725, rating: 4.7, reviewCount: 3200, priceLevel: 2, estimatedCost: 350, speciality: 'Single-estate specialty coffee brews and vegan bakes' },
    { id: 'goa-cafe-12', name: 'Verandah Cafe Old Heritage House', category: 'cafes', address: 'Panaji Latin Quarter, Panaji, Goa 403001', lat: 15.4970, lng: 73.8290, rating: 4.6, reviewCount: 2900, priceLevel: 2, estimatedCost: 380, speciality: 'Boutique heritage verandah serving Goan serradura & cappuccinos' }
  ],
  beaches: [
    { id: 'goa-bch-1', name: 'Palolem Beach Crescent Bay', category: 'beaches', address: 'Palolem, Canacona, South Goa 403702', lat: 15.0100, lng: 74.0232, rating: 4.8, reviewCount: 38000, priceLevel: 1, estimatedCost: 0, speciality: 'Gentle turquoise waves, beach huts & dolphin boat trips' },
    { id: 'goa-bch-2', name: 'Anjuna Beach & Rocky Promontory', category: 'beaches', address: 'Anjuna, Bardez, North Goa 403509', lat: 15.5733, lng: 73.7410, rating: 4.5, reviewCount: 32000, priceLevel: 1, estimatedCost: 0, speciality: 'Iconic red laterite rocks, beach shacks and sunset flea markets' },
    { id: 'goa-bch-3', name: 'Vagator Beach & Chapora Cliffs', category: 'beaches', address: 'Vagator, Bardez, North Goa 403509', lat: 15.6030, lng: 73.7336, rating: 4.6, reviewCount: 29000, priceLevel: 1, estimatedCost: 0, speciality: 'Dramatic red sandstone cliffs and Little Vagator coves' },
    { id: 'goa-bch-4', name: 'Calangute Beach Queen of Beaches', category: 'beaches', address: 'Calangute, Bardez, North Goa 403516', lat: 15.5439, lng: 73.7553, rating: 4.4, reviewCount: 52000, priceLevel: 1, estimatedCost: 0, speciality: 'Sprawling shoreline with active watersports and beach shacks' },
    { id: 'goa-bch-5', name: 'Baga Beach & River Estuary', category: 'beaches', address: 'Baga, Bardez, North Goa 403516', lat: 15.5553, lng: 73.7517, rating: 4.5, reviewCount: 48000, priceLevel: 1, estimatedCost: 0, speciality: 'Lively nightlife shacks, jet ski rides, and parasailing' },
    { id: 'goa-bch-6', name: 'Morjim Beach Olive Ridley Turtle Sanctuary', category: 'beaches', address: 'Morjim, Pernem, North Goa 403512', lat: 15.6292, lng: 73.7339, rating: 4.7, reviewCount: 16000, priceLevel: 1, estimatedCost: 0, speciality: 'Peaceful wide beach famous for nesting Olive Ridley turtles' },
    { id: 'goa-bch-7', name: 'Ashwem Beach Serene Sands', category: 'beaches', address: 'Ashwem, Mandrem, North Goa 403527', lat: 15.6582, lng: 73.7162, rating: 4.7, reviewCount: 14500, priceLevel: 1, estimatedCost: 0, speciality: 'Clean white sands, boutique shacks, and palm groves' },
    { id: 'goa-bch-8', name: 'Arambol Beach & Sweetwater Lagoon', category: 'beaches', address: 'Arambol, Pernem, North Goa 403524', lat: 15.6869, lng: 73.7042, rating: 4.6, reviewCount: 26000, priceLevel: 1, estimatedCost: 0, speciality: 'Bohemian drum circles, Sweetwater lake & cliff walks' },
    { id: 'goa-bch-9', name: 'Agonda Beach Pristine Bay', category: 'beaches', address: 'Agonda, Canacona, South Goa 403702', lat: 15.0440, lng: 73.9870, rating: 4.8, reviewCount: 19800, priceLevel: 1, estimatedCost: 0, speciality: 'Tranquil uncrowded golden shore, ideal for yoga and reading' },
    { id: 'goa-bch-10', name: 'Colva Beach South Shoreline', category: 'beaches', address: 'Colva, Salcete, South Goa 403708', lat: 15.2793, lng: 73.9142, rating: 4.4, reviewCount: 22000, priceLevel: 1, estimatedCost: 0, speciality: 'Fine powdery sand, colonial heritage church, and fishing boats' },
    { id: 'goa-bch-11', name: 'Butterfly Beach Hidden Cove', category: 'beaches', address: 'Canacona, South Goa 403702', lat: 15.0210, lng: 74.0040, rating: 4.8, reviewCount: 9200, priceLevel: 1, estimatedCost: 300, speciality: 'Secluded crescent accessible only by boat; dolphin playground' },
    { id: 'goa-bch-12', name: 'Sinquerim Beach Coastal Lagoon', category: 'beaches', address: 'Sinquerim, Candolim, North Goa 403515', lat: 15.4990, lng: 73.7680, rating: 4.6, reviewCount: 17500, priceLevel: 1, estimatedCost: 0, speciality: 'Historic sea rampart backdrop and luxury water sports' }
  ],
  historical_places: [
    { id: 'goa-hist-1', name: 'Fort Aguada & Lighthouse Bastion', category: 'historical_places', address: 'Candolim, Goa 403515', lat: 15.4925, lng: 73.7738, rating: 4.6, reviewCount: 42000, priceLevel: 1, estimatedCost: 50, speciality: '17th-century Portuguese fortress that guarded Mandovi mouth' },
    { id: 'goa-hist-2', name: 'Se Cathedral (Catedral de Santa Catarina)', category: 'historical_places', address: 'Velha Goa, Goa 403402', lat: 15.5039, lng: 73.9125, rating: 4.7, reviewCount: 31000, priceLevel: 1, estimatedCost: 0, speciality: 'One of Asia\'s largest churches famous for the Great Golden Bell' },
    { id: 'goa-hist-3', name: 'Basilica of Bom Jesus', category: 'historical_places', address: 'Old Goa, Goa 403402', lat: 15.5009, lng: 73.9116, rating: 4.8, reviewCount: 54000, priceLevel: 1, estimatedCost: 0, speciality: 'UNESCO World Heritage monument completed in 1605' },
    { id: 'goa-hist-4', name: 'Church of St. Francis of Assisi', category: 'historical_places', address: 'Off Old Goa Rd, Velha Goa, Goa 403402', lat: 15.5032, lng: 73.9120, rating: 4.6, reviewCount: 18500, priceLevel: 1, estimatedCost: 20, speciality: 'Exquisite Manueline doorway and wood-carved gilded reredos' },
    { id: 'goa-hist-5', name: 'St. Augustine Tower Ruins', category: 'historical_places', address: 'Church of St. Augustine, Velha Goa, Goa 403402', lat: 15.5015, lng: 73.9052, rating: 4.5, reviewCount: 14200, priceLevel: 1, estimatedCost: 0, speciality: 'Towering 46-meter high remaining belfry of a 1602 Augustinian convent' },
    { id: 'goa-hist-6', name: 'Reis Magos Historic Fort & Jail', category: 'historical_places', address: 'Verem, Goa 403114', lat: 15.4986, lng: 73.8089, rating: 4.5, reviewCount: 12000, priceLevel: 1, estimatedCost: 50, speciality: 'Pristinely preserved fort that once served as Viceroy residence' },
    { id: 'goa-hist-7', name: 'Cabo de Rama Fort Ruins', category: 'historical_places', address: 'Canacona, South Goa 403703', lat: 15.0886, lng: 73.9217, rating: 4.7, reviewCount: 15800, priceLevel: 1, estimatedCost: 0, speciality: 'Ancient fort named after Lord Rama with later Portuguese bastions' },
    { id: 'goa-hist-8', name: 'Chapora Fort Stone Ramparts', category: 'historical_places', address: 'Vagator, Goa 403509', lat: 15.6058, lng: 73.7366, rating: 4.5, reviewCount: 38000, priceLevel: 1, estimatedCost: 0, speciality: 'Built in 1717 by the Portuguese over ancient Adil Shah ramparts' },
    { id: 'goa-hist-9', name: 'Shanta Durga Temple Kavlem', category: 'historical_places', address: 'Kapileshwari, Kavlem, Ponda, Goa 403401', lat: 15.3992, lng: 73.9936, rating: 4.8, reviewCount: 22000, priceLevel: 1, estimatedCost: 0, speciality: 'Historic 1738 Saraswat temple featuring pyramidal roofs and Deepstambha' },
    { id: 'goa-hist-10', name: 'Mangueshi Temple Ponda', category: 'historical_places', address: 'Mangeshi Village, Mardol, Ponda, Goa 403404', lat: 15.4419, lng: 73.9686, rating: 4.8, reviewCount: 34000, priceLevel: 1, estimatedCost: 0, speciality: '450-year-old Shiva temple with a magnificent seven-story octagonal lamp tower' },
    { id: 'goa-hist-11', name: 'Fontainhas Historic Latin Quarter', category: 'historical_places', address: 'Altinho, Panaji, Goa 403001', lat: 15.4950, lng: 73.8320, rating: 4.8, reviewCount: 19500, priceLevel: 1, estimatedCost: 0, speciality: 'Asia\'s only surviving Latin Quarter with 18th-century Portuguese architecture' },
    { id: 'goa-hist-12', name: 'Corjuem Island Fortress', category: 'historical_places', address: 'Corjuem, Aldona, Goa 403508', lat: 15.5975, lng: 73.8967, rating: 4.4, reviewCount: 6500, priceLevel: 1, estimatedCost: 20, speciality: '1705 inland fortress built to protect against Maratha incursions' }
  ],
  museums: [
    { id: 'goa-mus-1', name: 'Goa State Central Museum', category: 'museums', address: 'Adil Shah Palace, D.B. Marg, Panaji, Goa 403001', lat: 15.4985, lng: 73.8260, rating: 4.4, reviewCount: 6200, priceLevel: 1, estimatedCost: 20, speciality: 'Ancient stone sculptures, coins, bronzes and Goan freedom struggle artifacts' },
    { id: 'goa-mus-2', name: 'Houses of Goa Architectural Museum', category: 'museums', address: 'House 674, Salvador do Mundo, Penha de Franca, Goa 403101', lat: 15.5392, lng: 73.8441, rating: 4.7, reviewCount: 4800, priceLevel: 1, estimatedCost: 100, speciality: 'Iconic ship-shaped multi-story museum designed by Gerard da Cunha' },
    { id: 'goa-mus-3', name: 'Naval Aviation Museum Dabolim', category: 'museums', address: 'Bogmalo Rd, Dabolim, Goa 403801', lat: 15.3789, lng: 73.8336, rating: 4.6, reviewCount: 14000, priceLevel: 1, estimatedCost: 50, speciality: 'One of only two military aviation museums in India featuring retired aircraft and engines' },
    { id: 'goa-mus-4', name: 'Museum of Christian Art Old Goa', category: 'museums', address: 'Convent of Santa Monica, Velha Goa, Goa 403402', lat: 15.5011, lng: 73.9064, rating: 4.7, reviewCount: 3900, priceLevel: 1, estimatedCost: 100, speciality: 'Magnificent Indo-Portuguese Christian gold, ivory, and textile treasures' },
    { id: 'goa-mus-5', name: 'Goa Chitra Ethnographic Museum', category: 'museums', address: 'House 498, Mondo-Waddo, Benaulim, Goa 403716', lat: 15.2581, lng: 73.9392, rating: 4.8, reviewCount: 5200, priceLevel: 2, estimatedCost: 300, speciality: 'Award-winning collection of 4000+ traditional indigenous farming and artisanal tools' },
    { id: 'goa-mus-6', name: 'Big Foot Museum & Cross Craft Village', category: 'museums', address: 'Loutolim, Salcete, South Goa 403718', lat: 15.3283, lng: 73.9922, rating: 4.3, reviewCount: 8800, priceLevel: 1, estimatedCost: 100, speciality: 'Open-air miniature model village displaying ancient Goan rural occupations' },
    { id: 'goa-mus-7', name: 'Wax World Heritage Museum Old Goa', category: 'museums', address: 'Gandhi Circle, Old Goa, Goa 403402', lat: 15.5028, lng: 73.9140, rating: 4.1, reviewCount: 5600, priceLevel: 1, estimatedCost: 100, speciality: 'Wax statues of Indian historical personalities and Last Supper sculpt' },
    { id: 'goa-mus-8', name: 'Carambolim Heritage Hall & Village Center', category: 'museums', address: 'Carambolim, Tiswadi, Goa 403110', lat: 15.4900, lng: 73.9300, rating: 4.5, reviewCount: 2200, priceLevel: 1, estimatedCost: 30, speciality: 'Historical exhibits on lake ecosystems and Portuguese railway heritage' },
    { id: 'goa-mus-9', name: 'Archaeological Museum of Old Goa', category: 'museums', address: 'Convent of St. Francis of Assisi, Old Goa, Goa 403402', lat: 15.5030, lng: 73.9122, rating: 4.5, reviewCount: 9100, priceLevel: 1, estimatedCost: 25, speciality: 'Portraits of Portuguese viceroys, medieval weaponry, and Kadamba inscriptions' },
    { id: 'goa-mus-10', name: 'Menezes Braganza Historic House Museum', category: 'museums', address: 'Chandor, Salcete, South Goa 403714', lat: 15.2633, lng: 74.0450, rating: 4.6, reviewCount: 4100, priceLevel: 2, estimatedCost: 150, speciality: 'Grand 450-year-old palatial mansion with original European porcelain & rare libraries' },
    { id: 'goa-mus-11', name: 'Customs & Central Excise Museum', category: 'museums', address: 'Blue Building, D.B. Marg, Panaji, Goa 403001', lat: 15.4989, lng: 73.8271, rating: 4.4, reviewCount: 2800, priceLevel: 1, estimatedCost: 20, speciality: 'Fascinating seized contraband, antiques, and oceanic smuggling artifacts' },
    { id: 'goa-mus-12', name: 'Solar Souto Maior Heritage Gallery', category: 'museums', address: 'Curtorim, Salcete, Goa 403709', lat: 15.2890, lng: 74.0040, rating: 4.5, reviewCount: 1900, priceLevel: 1, estimatedCost: 100, speciality: 'Historic aristocrat manor displaying vintage Portuguese furniture and textiles' }
  ],
  shopping: [
    { id: 'goa-shp-1', name: 'Saturday Night Market Arpora', category: 'shopping', address: 'Aguada - Siolim Rd, Xim Waddo, Arpora, Goa 403518', lat: 15.5781, lng: 73.7667, rating: 4.7, reviewCount: 28000, priceLevel: 2, estimatedCost: 500, speciality: 'Sprawling night bazaar with designer apparel, leather goods, spices & live bands' },
    { id: 'goa-shp-2', name: 'Anjuna Wednesday Flea Market', category: 'shopping', address: '10, St. Michael\'s Vaddo, Anjuna, Goa 403509', lat: 15.5741, lng: 73.7431, rating: 4.4, reviewCount: 24000, priceLevel: 1, estimatedCost: 300, speciality: 'Iconic open-air market for beachwear, brass statues, and handmade trinkets' },
    { id: 'goa-shp-3', name: 'Panaji Municipal Market Bazaar', category: 'shopping', address: 'Dr. P. Shirgaonkar Rd, Panaji, Goa 403001', lat: 15.4952, lng: 73.8286, rating: 4.5, reviewCount: 16500, priceLevel: 1, estimatedCost: 250, speciality: 'Authentic local market for Goan cashews, feni, kokum, and organic spices' },
    { id: 'goa-shp-4', name: 'Mackie\'s Saturday Nite Bazaar Baga', category: 'shopping', address: 'Baga River Banks, Arpora, Goa 403516', lat: 15.5645, lng: 73.7615, rating: 4.4, reviewCount: 15200, priceLevel: 2, estimatedCost: 400, speciality: 'Riverside open bazaar with handcrafted silver jewelry and live performances' },
    { id: 'goa-shp-5', name: 'Calangute Market Square', category: 'shopping', address: 'Calangute - Baga Rd, Calangute, Goa 403516', lat: 15.5412, lng: 73.7570, rating: 4.3, reviewCount: 19800, priceLevel: 1, estimatedCost: 200, speciality: 'Lively street shopping for sunglasses, kaftans, footwear, and souvenirs' },
    { id: 'goa-shp-6', name: 'Tibetan Market Baga & Calangute', category: 'shopping', address: 'Calangute Beach Rd, Umtavaddo, Calangute, Goa 403516', lat: 15.5398, lng: 73.7588, rating: 4.4, reviewCount: 12200, priceLevel: 2, estimatedCost: 450, speciality: 'Authentic turquoise jewelry, singing bowls, prayer flags, and wooden crafts' },
    { id: 'goa-shp-7', name: 'Mapusa Friday Traditional Market', category: 'shopping', address: 'Municipal Market, Mapusa, Goa 403507', lat: 15.5931, lng: 73.8142, rating: 4.6, reviewCount: 17500, priceLevel: 1, estimatedCost: 150, speciality: 'Traditional Goan farmers market for dried fish, sausages (chourico), and pottery' },
    { id: 'goa-shp-8', name: 'Caculo Mall & Department Stores', category: 'shopping', address: '16 St. Inez Rd, Panaji, Goa 403001', lat: 15.4892, lng: 73.8201, rating: 4.2, reviewCount: 11000, priceLevel: 3, estimatedCost: 800, speciality: 'Modern air-conditioned mall with international lifestyle brands and gaming' },
    { id: 'goa-shp-9', name: 'Mall De Goa Porvorim', category: 'shopping', address: 'NH 66, Porvorim, Goa 403521', lat: 15.5350, lng: 73.8315, rating: 4.4, reviewCount: 22000, priceLevel: 3, estimatedCost: 750, speciality: 'Largest shopping mall in Goa with multiplex cinema and food court' },
    { id: 'goa-shp-10', name: 'Zuarinagar Spice Plantations Bazaar', category: 'shopping', address: 'Keri, Ponda, Goa 403401', lat: 15.4050, lng: 74.0200, rating: 4.7, reviewCount: 14000, priceLevel: 2, estimatedCost: 500, speciality: 'Fresh organic cinnamon quills, green cardamom, vanilla beans and spice oils' },
    { id: 'goa-shp-11', name: 'Fontainhas Azulejo Ceramic Studio', category: 'shopping', address: 'Rua de Ourem, Panaji, Goa 403001', lat: 15.4960, lng: 73.8330, rating: 4.8, reviewCount: 4200, priceLevel: 2, estimatedCost: 350, speciality: 'Hand-painted glazed ceramic Portuguese nameplates and azulejo artwork' },
    { id: 'goa-shp-12', name: 'Margao New Market Bazaar', category: 'shopping', address: 'Near Municipal Garden, Margao, Goa 403601', lat: 15.2750, lng: 73.9580, rating: 4.5, reviewCount: 13500, priceLevel: 1, estimatedCost: 200, speciality: 'South Goa\'s largest commercial hub for textiles, handicrafts, and cashew sweets' }
  ],
  nature_adventure: [
    { id: 'goa-nat-1', name: 'Dudhsagar Waterfalls & Jeep Safari', category: 'nature_adventure', address: 'Sonaulim, Goa 403410', lat: 15.3144, lng: 74.3144, rating: 4.7, reviewCount: 36000, priceLevel: 2, estimatedCost: 500, speciality: 'Four-tiered 310m white cascade through Western Ghats deciduous forest' },
    { id: 'goa-nat-2', name: 'Bhagwan Mahaveer Wildlife Sanctuary', category: 'nature_adventure', address: 'Mollem, Goa 403410', lat: 15.3720, lng: 74.2460, rating: 4.5, reviewCount: 12500, priceLevel: 1, estimatedCost: 50, speciality: 'Dense evergreen jungle inhabited by leopards, deer, and hornbills' },
    { id: 'goa-nat-3', name: 'Netravali Bubbling Lake & Forest Trek', category: 'nature_adventure', address: 'Sanguem Taluk, Netravali, South Goa 403704', lat: 15.0880, lng: 74.1980, rating: 4.6, reviewCount: 8200, priceLevel: 1, estimatedCost: 30, speciality: 'Natural spring lake where bubbles rhythmically rise to water surface' },
    { id: 'goa-nat-4', name: 'Grande Island Scuba Diving & Snorkeling', category: 'nature_adventure', address: 'Harbour Jetty, Mormugao, Goa 403803', lat: 15.3520, lng: 73.7660, rating: 4.7, reviewCount: 18500, priceLevel: 4, estimatedCost: 2500, speciality: 'Coral reef diving with certified instructors and dolphin watching' },
    { id: 'goa-nat-5', name: 'Dr. Salim Ali Bird Sanctuary Chorao', category: 'nature_adventure', address: 'Chorao Island, Tiswadi, Goa 403102', lat: 15.5160, lng: 73.8680, rating: 4.6, reviewCount: 7900, priceLevel: 1, estimatedCost: 20, speciality: 'Mangrove boat safari viewing kingfishers, pintails, and flying foxes' },
    { id: 'goa-nat-6', name: 'Cotigao Wildlife Sanctuary Canopy Trail', category: 'nature_adventure', address: 'Canacona Taluk, South Goa 403702', lat: 14.9960, lng: 74.1480, rating: 4.5, reviewCount: 6800, priceLevel: 1, estimatedCost: 25, speciality: 'Treetop watchtower overlooking a watering hole in dense forest' },
    { id: 'goa-nat-7', name: 'Harvalem Waterfall & Rock-Cut Caves', category: 'nature_adventure', address: 'Sanquelim, North Goa 403505', lat: 15.5530, lng: 74.0280, rating: 4.4, reviewCount: 14000, priceLevel: 1, estimatedCost: 0, speciality: 'Scenic monsoon cascade next to 6th-century Pandava carved caves' },
    { id: 'goa-nat-8', name: 'Sahakari Spice Farm River Walk', category: 'nature_adventure', address: 'Ponda - Belgaum Highway, Curti, Ponda, Goa 403401', lat: 15.4120, lng: 74.0210, rating: 4.6, reviewCount: 16000, priceLevel: 2, estimatedCost: 500, speciality: 'Botanical spice tour, traditional buffet and elephant bathing' },
    { id: 'goa-nat-9', name: 'Sal Backwaters Kayaking Expedition', category: 'nature_adventure', address: 'Mobor Beach Rd, Cavelossim, Goa 403731', lat: 15.1720, lng: 73.9450, rating: 4.8, reviewCount: 5400, priceLevel: 3, estimatedCost: 1200, speciality: 'Serene sunrise kayaking through calm mangrove creek estuaries' },
    { id: 'goa-nat-10', name: 'Tambdi Surla Ancient Temple & Trek', category: 'nature_adventure', address: 'Near Mollem National Park, Surla, Goa 403410', lat: 15.4380, lng: 74.2540, rating: 4.7, reviewCount: 9500, priceLevel: 1, estimatedCost: 0, speciality: '12th-century black basalt temple nestled deep inside jungle foothills' },
    { id: 'goa-nat-11', name: 'Cabo de Rama Sunset Cliff Overlook', category: 'nature_adventure', address: 'Canacona, South Goa 403703', lat: 15.0886, lng: 73.9217, rating: 4.8, reviewCount: 11000, priceLevel: 1, estimatedCost: 0, speciality: 'Dramatic ocean drop-off cliff trail with endless blue horizon' },
    { id: 'goa-nat-12', name: 'Mandovi River Island Stand-up Paddleboarding', category: 'nature_adventure', address: 'Britona Jetty, Bardez, Goa 403101', lat: 15.5120, lng: 73.8340, rating: 4.7, reviewCount: 4100, priceLevel: 3, estimatedCost: 1000, speciality: 'Paddleboarding along tranquil river islets and bird colonies' }
  ],
  family_friendly: [
    { id: 'goa-fam-1', name: 'Splashdown Waterpark Anjuna', category: 'family_friendly', address: 'Calangute-Anjuna Main Rd, Padre Agnel Vaddo, Anjuna, Goa 403509', lat: 15.5790, lng: 73.7620, rating: 4.4, reviewCount: 9800, priceLevel: 3, estimatedCost: 650, speciality: 'Family flume rides, lazy river, and kid splash zones' },
    { id: 'goa-fam-2', name: 'Snow Park Goa Baga', category: 'family_friendly', address: 'Baga-Calangute Rd, Arpora, Goa 403516', lat: 15.5580, lng: 73.7580, rating: 4.2, reviewCount: 14500, priceLevel: 3, estimatedCost: 700, speciality: 'Sub-zero indoor snow playground with sledding, ice slides & igloos' },
    { id: 'goa-fam-3', name: 'Mandovi River Dolphin Boat Cruise', category: 'family_friendly', address: 'Santa Monica Jetty, Panaji, Goa 403001', lat: 15.5005, lng: 73.8290, rating: 4.5, reviewCount: 22000, priceLevel: 2, estimatedCost: 400, speciality: 'Leisurely double-decker cruise viewing playful humpback dolphins' },
    { id: 'goa-fam-4', name: 'Abyss Marine Aquarium Verna', category: 'family_friendly', address: 'NH 17, Verna, Salcete, Goa 403722', lat: 15.3520, lng: 73.9240, rating: 4.3, reviewCount: 7800, priceLevel: 1, estimatedCost: 150, speciality: 'Educational underwater exhibits with starfish, lionfish, and sharks' },
    { id: 'goa-fam-5', name: 'Bondla Wildlife Zoo & Botanical Gardens', category: 'family_friendly', address: 'Usgaon, Ganjem, Ponda, Goa 403105', lat: 15.4410, lng: 74.0990, rating: 4.3, reviewCount: 16000, priceLevel: 1, estimatedCost: 30, speciality: 'Mini zoo with deer park, serpentarium, and scenic picnic meadows' },
    { id: 'goa-fam-6', name: 'Froggyland The Water World Goa', category: 'family_friendly', address: 'Pateapur, Nuvem, Margao, Goa 403604', lat: 15.3190, lng: 73.9450, rating: 4.4, reviewCount: 8200, priceLevel: 3, estimatedCost: 600, speciality: 'Wave pool, adventure slides, and rain dance for families' },
    { id: 'goa-fam-7', name: 'Go-Karting Track Arpora', category: 'family_friendly', address: 'Arpora, Baga Rd, Goa 403518', lat: 15.5720, lng: 73.7640, rating: 4.5, reviewCount: 11500, priceLevel: 2, estimatedCost: 400, speciality: 'Exciting outdoor go-karting race circuit suitable for teens and adults' },
    { id: 'goa-fam-8', name: 'Tropical Spice Plantation Family Tour', category: 'family_friendly', address: 'Keri, Ponda, Goa 403401', lat: 15.4090, lng: 74.0240, rating: 4.6, reviewCount: 15000, priceLevel: 2, estimatedCost: 450, speciality: 'Garland welcome, guided nature walk, bird spotting and lunch' },
    { id: 'goa-fam-9', name: 'Miramar Beach Promenade & Children\'s Park', category: 'family_friendly', address: 'Miramar, Panaji, Goa 403001', lat: 15.4840, lng: 73.8090, rating: 4.4, reviewCount: 26000, priceLevel: 1, estimatedCost: 0, speciality: 'Wide paved promenade with kids play slides, ice cream stalls and lawns' },
    { id: 'goa-fam-10', name: 'Butterfly Conservatory of Goa Ponda', category: 'family_friendly', address: 'Rajode, Pisgal, Priol, Ponda, Goa 403401', lat: 15.4310, lng: 73.9850, rating: 4.7, reviewCount: 5400, priceLevel: 1, estimatedCost: 150, speciality: 'Rooftop tropical rainforest habitat with 130+ free-flying butterfly species' },
    { id: 'goa-fam-11', name: 'Museum of Goa (MOG) Interactive Workshops', category: 'family_friendly', address: 'Pilerne Industrial Estate, Pilerne, Goa 403511', lat: 15.5240, lng: 73.7990, rating: 4.6, reviewCount: 6100, priceLevel: 1, estimatedCost: 100, speciality: 'Hands-on sculpture gardens and children\'s creative craft labs' },
    { id: 'goa-fam-12', name: 'Carambolim Lake Eco Boardwalk', category: 'family_friendly', address: 'Carambolim, Tiswadi, Goa 403110', lat: 15.4920, lng: 73.9290, rating: 4.5, reviewCount: 4600, priceLevel: 1, estimatedCost: 0, speciality: 'Stroll on safe timber walkways to spot purple moorhens and jacanas' }
  ],
  nightlife: [
    { id: 'goa-nite-1', name: 'Tito\'s Lane Legendary Club Strip', category: 'nightlife', address: 'Tito\'s Lane, Baga, Goa 403516', lat: 15.5562, lng: 73.7538, rating: 4.5, reviewCount: 34000, priceLevel: 3, estimatedCost: 1200, speciality: 'Goa\'s premier nightlife strip with world-renowned DJs and dance arenas' },
    { id: 'goa-nite-2', name: 'Curlies Beach Shack & Sunset Bar', category: 'nightlife', address: 'Anjuna Beach, Monteiro Vaddo, Anjuna, Goa 403509', lat: 15.5714, lng: 73.7420, rating: 4.4, reviewCount: 29000, priceLevel: 2, estimatedCost: 800, speciality: 'Pioneer seaside shack with trance vibes, cold beers & sunset deck' },
    { id: 'goa-nite-3', name: 'Thalassa Greek Taverna & Sunset Lounge', category: 'nightlife', address: 'Vaddy, Siolim, Goa 403517', lat: 15.6268, lng: 73.7460, rating: 4.7, reviewCount: 26000, priceLevel: 4, estimatedCost: 1500, speciality: 'Clifftop Mediterranean cocktails, fire shows, and river sunset panorama' },
    { id: 'goa-nite-4', name: 'HillTop Goa Open-Air Trance Arena', category: 'nightlife', address: 'Michael\'s School, Ozran Beach Rd, Vagator, Goa 403509', lat: 15.5985, lng: 73.7410, rating: 4.6, reviewCount: 18000, priceLevel: 3, estimatedCost: 1000, speciality: 'Iconic psychedelic open-air Sunday parties under coconut palms' },
    { id: 'goa-nite-5', name: 'Cohiba Bar & Kitchen Candolim', category: 'nightlife', address: 'Aguada Fort Rd, Candolim, Goa 403515', lat: 15.5030, lng: 73.7710, rating: 4.5, reviewCount: 14000, priceLevel: 3, estimatedCost: 900, speciality: 'Cuban-themed live retro music nights, craft cocktails & outdoor patio' },
    { id: 'goa-nite-6', name: 'SinQ Nightclub & Cabana Lounge', category: 'nightlife', address: 'Aguada - Siolim Rd, Candolim, Goa 403515', lat: 15.5090, lng: 73.7700, rating: 4.3, reviewCount: 16500, priceLevel: 3, estimatedCost: 1100, speciality: 'Poolside cabanas, indoor nightclub, and wood-fired gourmet pizza' },
    { id: 'goa-nite-7', name: 'Cafe Mambo Baga Beachfront', category: 'nightlife', address: 'Tito\'s Lane, Baga, Goa 403516', lat: 15.5568, lng: 73.7532, rating: 4.4, reviewCount: 21000, priceLevel: 3, estimatedCost: 1000, speciality: 'Electric beachfront dance floor featuring hip-hop and techno sets' },
    { id: 'goa-nite-8', name: 'Shiva Valley Tuesday Sunset Temple', category: 'nightlife', address: 'Anjuna Beach, Bardez, Goa 403509', lat: 15.5710, lng: 73.7425, rating: 4.4, reviewCount: 12000, priceLevel: 2, estimatedCost: 650, speciality: 'Atmospheric beach shack famous for Tuesday psychedelic sunset sessions' },
    { id: 'goa-nite-9', name: 'LPK Waterfront (Love Passion Karma)', category: 'nightlife', address: 'Bhatiwado, Nerul, Bardez, Goa 403114', lat: 15.5140, lng: 73.7890, rating: 4.4, reviewCount: 24000, priceLevel: 3, estimatedCost: 1200, speciality: 'Sculpted terracotta mud cave architecture overlooking Nerul river' },
    { id: 'goa-nite-10', name: 'Soro - The Village Pub Assagao', category: 'nightlife', address: 'Badem junction, Siolim Rd, Assagao, Goa 403507', lat: 15.6040, lng: 73.7680, rating: 4.6, reviewCount: 9500, priceLevel: 2, estimatedCost: 750, speciality: 'Industrial tavern in a restored rustic house with live salsa & acoustic bands' },
    { id: 'goa-nite-11', name: 'Purple Martini at Sunset Point Anjuna', category: 'nightlife', address: 'St. Anthony Praise, Anjuna, Goa 403509', lat: 15.5792, lng: 73.7401, rating: 4.5, reviewCount: 15000, priceLevel: 3, estimatedCost: 950, speciality: 'Santorini-style blue terrace overlooking breaking waves with saxophone tunes' },
    { id: 'goa-nite-12', name: 'Cantare Heritage Jazz & Tapas Tavern', category: 'nightlife', address: 'Cruz Waddo, Saligao, Bardez, Goa 403511', lat: 15.5380, lng: 73.7840, rating: 4.7, reviewCount: 5200, priceLevel: 2, estimatedCost: 600, speciality: 'Charming two-story Portuguese home hosting live Monday jazz sessions' }
  ]
};

// Fill in Google Maps URLs and standard properties for Goa
for (const [topicId, list] of Object.entries(GOA_VENUES)) {
  list.forEach((p) => {
    p.category = topicId;
    p.googleMapsUrl = makeGoogleMapsUrl(p.name, p.address, 'Goa, India');
    p.source = 'curated_catalog';
    if (!p.openingHours) {
      p.openingHours = {
        openTime: topicId === 'nightlife' ? '18:00' : topicId === 'cafes' ? '08:00' : '09:00',
        closeTime: topicId === 'nightlife' ? '03:00' : topicId === 'cafes' ? '22:00' : '20:00',
        daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        isOpenToday: true
      };
    }
  });
}

// -------------------------------------------------------------
// Dynamic Localized Venue Generator (Guarantees 12-20 places per category)
// -------------------------------------------------------------
interface TemplateItem {
  namePattern: string;
  spec: string;
  price: 1 | 2 | 3 | 4;
  cost: number;
  desc: string;
  dietary?: 'veg' | 'non_veg' | 'both';
}

const CATEGORY_TEMPLATES: Record<string, TemplateItem[]> = {
  tourist_attractions: [
    { namePattern: 'Historic Citadel & Grand Bastion', spec: 'Panoramic city vista & ancient stone battlements', price: 1, cost: 5, desc: 'Towering fortified stronghold standing since the 16th century.' },
    { namePattern: 'Central Heritage Plaza & Bell Tower', spec: 'Gilded carillon bells and historic open courtyard', price: 1, cost: 0, desc: 'The bustling historic centerpiece of town lined with ornate facades.' },
    { namePattern: 'Royal Palace Gardens & Pavilions', spec: 'Manicured topiary, marble fountains and royal galleries', price: 2, cost: 15, desc: 'Stately palace grounds offering serene promenades and royal architecture.' },
    { namePattern: 'Panoramic Summit Observation Deck', spec: '360-degree glass skywalk overlooking the skyline', price: 2, cost: 20, desc: 'High-altitude panoramic lookout offering breathtaking horizon views.' },
    { namePattern: 'Ancient Cathedral & Grand Spire', spec: 'Stained-glass rose window and soaring vaulted ceilings', price: 1, cost: 0, desc: 'Masterpiece of sacred medieval stonework and tranquil chapels.' },
    { namePattern: 'Old Town Promenade & Cobblestone Arcade', spec: 'Artisan craft studios and lively street musicians', price: 1, cost: 0, desc: 'Atmospheric pedestrian boulevard steeped in centuries of folklore.' },
    { namePattern: 'Harbor Lighthouse & Sea Pier', spec: 'Iconic beacon framing the maritime shoreline', price: 1, cost: 2, desc: 'Scenic waterfront jetty leading to a historic coastal navigation beacon.' },
    { namePattern: 'Botanical Conservatories & Palm Grove', spec: 'Exotic orchid pavilions and peaceful lily ponds', price: 1, cost: 8, desc: 'Sprawling botanical sanctuary showcasing diverse global flora.' },
    { namePattern: 'Memorial Arch of Freedom & Courtyard', spec: 'Sculpted bas-relief friezes commemorating city history', price: 1, cost: 0, desc: 'Monumental stone archway honoring pioneers and historic milestones.' },
    { namePattern: 'Suspension Bridge & River Vista Point', spec: 'Architectural engineering marvel and sunset overlook', price: 1, cost: 0, desc: 'Pedestrian bridge offering unmatched views of illuminated city banks.' },
    { namePattern: 'Old Mill Water Wheel & Heritage Canal', spec: 'Restored timber watermill and winding tree-lined canal', price: 1, cost: 4, desc: 'Picturesque heritage precinct showcasing historic agricultural ingenuity.' },
    { namePattern: 'Sunken Amphitheatre & Classical Colonnade', spec: 'Acoustic marble tiering and open-air classical ruins', price: 1, cost: 6, desc: 'Evocative historic colonnade hosting twilight cultural performances.' }
  ],
  restaurants: [
    { namePattern: 'The Heritage Hearth & Regional Kitchen', spec: 'Slow-simmered specialty stews & wood-fired flatbreads', price: 2, cost: 25, desc: 'Celebrated restaurant highlighting ancestral regional recipes and local produce.', dietary: 'both' },
    { namePattern: 'Golden Spice Thali & Curry House', spec: 'Multi-course regional thali with fresh chutney pairings', price: 1, cost: 15, desc: 'Always buzzing dining room renowned for rich aromatic gravies and unlimited thalis.', dietary: 'both' },
    { namePattern: 'Ocean Pearl Coastal Catch Grill', spec: 'Catch-of-the-day butter garlic fish and charred tiger prawns', price: 3, cost: 40, desc: 'Refined waterfront seafood restaurant serving crisp seasonal catches.', dietary: 'both' },
    { namePattern: 'Pure Green Sattvic Organic Dining', spec: 'Garden-to-table vegetarian delights and farm bowls', price: 2, cost: 18, desc: 'Wholesome pure vegetarian kitchen emphasizing unrefined local produce.', dietary: 'veg' },
    { namePattern: 'The Charcoal Pit & Kebab Smokehouse', spec: 'Tender spiced skewers and tandoori charcoal platters', price: 2, cost: 28, desc: 'Open-fire barbecue institution loved for its melt-in-mouth cuts and marinades.', dietary: 'non_veg' },
    { namePattern: 'Grand Bazaar Street Food Promenade', spec: 'Crisp savory fritters, hot dumplings and sweet pastries', price: 1, cost: 10, desc: 'Lively food alley where master cooks prepare sizzling street delicacies.', dietary: 'both' },
    { namePattern: 'The Old Cellar Bistro & Wine Bar', spec: 'Duck confit, braised short ribs & artisan cheese boards', price: 3, cost: 45, desc: 'Romantic stone cellar dining room paired with regional vintage cellar selections.', dietary: 'both' },
    { namePattern: 'Mountain View Noodle & Dumpling House', spec: 'Hand-pulled broth noodles and pan-fried soup dumplings', price: 1, cost: 14, desc: 'Hearty comforting noodle tavern famous for piping-hot aromatic broths.', dietary: 'both' },
    { namePattern: 'Saffron & Cardamom Royal Feast', spec: 'Fragrant dum biryanis and decadent slow-cooked curries', price: 3, cost: 32, desc: 'Regal dining hall serving opulent royal culinary heritage dishes.', dietary: 'both' },
    { namePattern: 'The Fishermans Cove Tavern', spec: 'Crispy fried calamari, spiced crab cakes and lemon butter', price: 2, cost: 26, desc: 'Casual maritime gathering place favored by residents for fresh seafood.', dietary: 'both' },
    { namePattern: 'Green Olive Mediterranean Mezzes', spec: 'Creamy house hummus, falafel platters & zaatar flatbreads', price: 2, cost: 22, desc: 'Sunlit Mediterranean terrace serving vibrant herbaceous mezze feasts.', dietary: 'veg' },
    { namePattern: 'Old Town Sweet & Savory Chaat House', spec: 'Crisp pani puri, samosa chaat & seasonal kulfi ice cream', price: 1, cost: 8, desc: 'Beloved multi-generational snack spot serving tangy authentic chaats.', dietary: 'veg' }
  ],
  cafes: [
    { namePattern: 'The Old Roastery & Espresso Lab', spec: 'Single-estate pour-overs and silky oat flat whites', price: 2, cost: 6, desc: 'Third-wave coffee atelier with on-site roaster drums and expert baristas.' },
    { namePattern: 'Greenhouse Courtyard Bakery Cafe', spec: 'Flaky almond croissants and lavender vanilla lattes', price: 2, cost: 9, desc: 'Botanical sunlit conservatory filled with hanging ferns and fresh oven aroma.' },
    { namePattern: 'The Reading Room & Literary Cafe', spec: 'Pot of darjeeling tea, lemon drizzle cake & quiet desks', price: 1, cost: 5, desc: 'Peaceful book-lined alcove for remote work, reading, and contemplative tea.' },
    { namePattern: 'Riverside Verandah & Juice Bar', spec: 'Cold-pressed tropical juices, acai bowls and lounge chairs', price: 2, cost: 8, desc: 'Open-air riverside deck offering nourishing smoothies and fresh sea breezes.' },
    { namePattern: 'Artisan Gelato & Espresso Bar', spec: 'Pistachio crunch gelato, affogatos and tiramisu', price: 1, cost: 5, desc: 'Authentic churned gelato boutique paired with bold Italian espresso.' },
    { namePattern: 'The Vinyl & Vintage Coffee Lounge', spec: 'Specialty cold brews, turntable listening booths & bagels', price: 2, cost: 7, desc: 'Retro music lover sanctuary where patrons listen to classic records.' },
    { namePattern: 'Masala Chai & Samosa Verandah', spec: 'Freshly crushed ginger cardamom chai and hot savory puffs', price: 1, cost: 3, desc: 'Lively neighborhood corner verandah that draws morning and evening crowds.' },
    { namePattern: 'The Rooftop Glasshouse Cafe', spec: 'Iced matchas, poached egg avocado toast & skyline views', price: 2, cost: 11, desc: 'Elevated terrace cafe providing serene views above bustling city boulevards.' },
    { namePattern: 'Bakers Brioche & Cinnamon Kitchen', spec: 'Warm cinnamon rolls, chocolate babka & cappuccino', price: 1, cost: 6, desc: 'Fragrant bakery drawing lines for warm morning bakes fresh from the hearth.' },
    { namePattern: 'Zen Stone Garden Matcha Teahouse', spec: 'Ceremonial grade matcha and traditional red-bean sweets', price: 2, cost: 10, desc: 'Minimalist bamboo sanctuary designed for mindful pauses and tea rituals.' },
    { namePattern: 'Bicycle Workshop & Urban Coffee Stop', spec: 'Nitrogen cold brew on tap and multigrain toasties', price: 1, cost: 6, desc: 'Community gathering spot for cyclists, creatives, and outdoor enthusiasts.' },
    { namePattern: 'Artisan Chocolate & Cocoa Lounge', spec: 'Single-origin hot chocolate elixirs and artisan truffles', price: 2, cost: 8, desc: 'Decadent chocolate salon crafting small-batch bean-to-bar treats.' }
  ],
  beaches: [
    { namePattern: 'Golden Crescent Bay & Beach Walk', spec: 'Soft golden sand and calm emerald swimming waters', price: 1, cost: 0, desc: 'Idyllic curved bay framed by swaying palms and gentle rolling waves.' },
    { namePattern: 'Clifftop Sunset Cove & Shacks', spec: 'Dramatic red cliff views and relaxed seaside shacks', price: 1, cost: 0, desc: 'Picture-perfect sunset cove with chilled refreshments and sun loungers.' },
    { namePattern: 'Tranquil Shell Haven Beach', spec: 'Powder white sand and natural shell-strewn tide pools', price: 1, cost: 0, desc: 'Secluded pristine shoreline ideal for beachcombing and peaceful strolls.' },
    { namePattern: 'Active Surf & Watersports Beach', spec: 'Board rentals, gentle surf breaks and beach volleyball', price: 2, cost: 15, desc: 'High-energy stretch of coastline where watersports enthusiasts gather.' },
    { namePattern: 'Fishermans Harbor & Palm Shore', spec: 'Colorful wooden skiffs and fresh morning ocean breeze', price: 1, cost: 0, desc: 'Picturesque working fishing beach where fishermen mend traditional nets.' },
    { namePattern: 'Lighthouse Point Marine Bay', spec: 'Historic coastal lighthouse backdrop and sea ramparts', price: 1, cost: 0, desc: 'Scenic cove where coastal stone ramparts meet gentle ocean surf.' },
    { namePattern: 'Secluded Dune & Pine Beach', spec: 'Natural dunes, pine groves and untouched nature', price: 1, cost: 0, desc: 'Quiet nature reserve beach perfect for bird watching and meditation.' },
    { namePattern: 'Dolphin Watch Estuary Beach', spec: 'Morning boat excursions to spot frolicking dolphin pods', price: 2, cost: 20, desc: 'Calm river-ocean confluence where marine life gathers in peaceful coves.' },
    { namePattern: 'Bohemian Sunset Drumming Cove', spec: 'Twilight drum circles and boho beachfront artisans', price: 1, cost: 0, desc: 'Cultural gathering cove celebrating vibrant sunsets and music.' },
    { namePattern: 'Emerald Lagoon & Sandbar Beach', spec: 'Protected natural shallow lagoon safe for all ages', price: 1, cost: 0, desc: 'Crystal-clear sandy basin with warm shallow waters and kayak rentals.' },
    { namePattern: 'Rocky Promontory Tide Pool Beach', spec: 'Marine tide pools filled with colorful crabs and anemones', price: 1, cost: 0, desc: 'Rugged coastal outcropping offering fascinating natural ocean exploration.' },
    { namePattern: 'The Palms Oceanfront Promenade', spec: 'Paved palm-lined walk with seaside cafes and benches', price: 1, cost: 0, desc: 'Scenic seaside boardwalk favored by evening strollers and joggers.' }
  ],
  historical_places: [
    { namePattern: 'Imperial Stone Fortress & Ramparts', spec: 'Ancient stone battlements and panoramic cannon bastions', price: 1, cost: 4, desc: 'Stupendous hilltop fort offering commanding strategic military views.' },
    { namePattern: 'UNESCO Heritage Cathedral of the Apostles', spec: 'Centuries-old gilded woodwork and sacred relics', price: 1, cost: 0, desc: 'Magnificent monumental cathedral showcasing grand baroque architecture.' },
    { namePattern: 'Ancient Royal Palace & Throne Hall', spec: 'Carved cedar ceilings, courtyards and royal antiquities', price: 2, cost: 12, desc: 'Opulent historic seat of power reflecting centuries of regal sovereignty.' },
    { namePattern: 'Medieval Old Quarter Heritage Walk', spec: 'Cobblestone passages, tiled roofs and historic archways', price: 1, cost: 0, desc: 'Protected heritage enclave preserving traditional lifestyle and architecture.' },
    { namePattern: 'Ancient Rock-Cut Caves & Monastic Cells', spec: 'Carved pillar halls and historic sacred inscriptions', price: 1, cost: 3, desc: 'Millennia-old subterranean monastery hewn directly into living rock.' },
    { namePattern: 'Colonial Maritime Fort & Harbor Watchtower', spec: 'Harbor cannon embrasures and historic military magazine', price: 1, cost: 4, desc: 'Historic stone ramparts that once protected vital maritime trade routes.' },
    { namePattern: 'The Sunken Stepwell & Sacred Bath', spec: 'Geometric descending staircases and carved sandstone pillars', price: 1, cost: 0, desc: 'Ancient water harvesting architectural wonder with mesmerizing symmetry.' },
    { namePattern: 'Historic City Gatehouse & Drawbridge', spec: 'Timber drawbridge mechanism and defensive iron portcullis', price: 1, cost: 2, desc: 'The preserved grand gateway through which historical travelers entered.' },
    { namePattern: 'Grand Royal Mausoleum & Gardens', spec: 'Intricate marble jali latticework and serene reflecting pools', price: 2, cost: 8, desc: 'Sacred architectural tomb surrounded by balanced geometric paradise gardens.' },
    { namePattern: 'Ancient Monastery Belfry Ruins', spec: 'Soaring weathered masonry arches and peaceful cloister', price: 1, cost: 0, desc: 'Romantic evocative stone ruins telling stories of medieval resilience.' },
    { namePattern: 'Old Merchant Mansions & Courtyard Street', spec: 'Teak wood balconies and courtyard fresco paintings', price: 1, cost: 0, desc: 'Historic street of wealthy merchant manors built during peak trade eras.' },
    { namePattern: 'The Old Clock Tower & Civic Hall', spec: 'Original mechanical clockwork and brass chimes', price: 1, cost: 0, desc: 'Civic landmark that has kept time for the community across centuries.' }
  ],
  museums: [
    { namePattern: 'National Heritage & Fine Arts Museum', spec: 'Renaissance masterworks, royal portraits and gold collections', price: 2, cost: 12, desc: 'Flagship museum housing thousands of historic and modern visual treasures.' },
    { namePattern: 'Museum of Maritime History & Navigation', spec: 'Restored naval barques, navigation astrolabes and ship models', price: 1, cost: 8, desc: 'Fascinating ocean exploration center documenting regional seafaring trade.' },
    { namePattern: 'Ethnographic Cultural Living Village Museum', spec: 'Indigenous textiles, tribal musical instruments & rural crafts', price: 2, cost: 10, desc: 'Immersive cultural repository demonstrating traditional crafts and life.' },
    { namePattern: 'Contemporary Art Pavilion & Sculpture Gardens', spec: 'Avant-garde multimedia exhibits and outdoor metal sculptures', price: 2, cost: 9, desc: 'Progressive gallery space spotlighting modern regional artists.' },
    { namePattern: 'Natural History & Fossil Discovery Hall', spec: 'Prehistoric amber specimens, mineral gems and biodiversity wings', price: 1, cost: 7, desc: 'Inspiring natural science museum loved by adults and young explorers alike.' },
    { namePattern: 'Archaeological Antiquities & Coinage Vault', spec: 'Ancient coin troves, pottery shards and terracotta votives', price: 1, cost: 5, desc: 'Curated repository showcasing artifacts unearthed from local excavations.' },
    { namePattern: 'Science & Aerospace Innovation Center', spec: 'Hands-on interactive physics labs and planetarium dome', price: 2, cost: 14, desc: 'Dynamic discovery museum with interactive simulations and cosmic journeys.' },
    { namePattern: 'Historic Printing Press & Typography Museum', spec: 'Antique Gutenberg-style presses and rare illuminated books', price: 1, cost: 4, desc: 'Charming vintage workshop showing the history of ink, paper and typography.' },
    { namePattern: 'Textile & Royal Costume Museum', spec: 'Brocade silks, embroidered tapestries and royal coronation attire', price: 2, cost: 11, desc: 'Exquisite tribute to the region\'s rich heritage of weaving and embroidery.' },
    { namePattern: 'City Folklore & Legendary Tales Museum', spec: 'Interactive folklore displays and historic photographic archives', price: 1, cost: 6, desc: 'Engaging chronicle of the neighborhood\'s most colorful legends and icons.' },
    { namePattern: 'Ceramics & Porcelain Heritage Atelier', spec: 'Glazed porcelain vessels, pottery kilns and master vases', price: 1, cost: 5, desc: 'Dedicated to centuries of clay craftsmanship and pottery artistry.' },
    { namePattern: 'Military Heritage & Armory Hall', spec: 'Historical swords, armor cuirasses and campaign diaries', price: 1, cost: 7, desc: 'Historical chronicle documenting defensive military history and regiments.' }
  ],
  shopping: [
    { namePattern: 'Night Bazaar & Lantern Street Market', spec: 'Handcrafted leather goods, colorful textiles and live music', price: 2, cost: 20, desc: 'Vibrant open-air evening bazaar illuminated with thousands of lanterns.' },
    { namePattern: 'Old Town Artisan & Spice Market', spec: 'Fragrant cinnamon, fresh vanilla, regional saffron and teas', price: 1, cost: 12, desc: 'Sensory wonderland filled with sacks of vibrant local spices and teas.' },
    { namePattern: 'Central Flea Market & Collector Pavilions', spec: 'Vintage vinyl, antique jewelry, bohemian clothing & pottery', price: 1, cost: 15, desc: 'Lively weekly gathering of vintage collectors, craftsmen, and artists.' },
    { namePattern: 'Grand Silk & Textile Emporium', spec: 'Handwoven scarves, pashminas, and tailored garments', price: 3, cost: 45, desc: 'Premier destination for fine fabrics, handlooms, and bespoke stitching.' },
    { namePattern: 'Potters Guild & Ceramic Studio Alley', spec: 'Hand-thrown terracotta bowls, vases and glazed tableware', price: 2, cost: 18, desc: 'Cooperative workshop where local master potters shape and fire wares.' },
    { namePattern: 'Jewelers Arcade & Silver Guild', spec: 'Filigree silver pendants, precious gems and custom jewelry', price: 3, cost: 60, desc: 'Historic covered arcade lined with master jewelers and gemstone cutters.' },
    { namePattern: 'Farmer Market & Organic Harvest Arcade', spec: 'Artisan cheeses, wild mountain honeys and fresh fruits', price: 1, cost: 10, desc: 'Weekly morning market celebrating surrounding sustainable farm harvests.' },
    { namePattern: 'Designers Quarter & Concept Boutiques', spec: 'Contemporary apparel, sustainable home decor and accessories', price: 3, cost: 50, desc: 'Trendy enclave showcasing forward-thinking local fashion designers.' },
    { namePattern: 'Bookbinders Square & Vintage Maps', spec: 'Old city maps, leather journals, rare books and engravings', price: 2, cost: 15, desc: 'Paradise for paper lovers, map collectors, and literature enthusiasts.' },
    { namePattern: 'Modern City Galleria & Department Store', spec: 'Multilevel international fashion brands and modern atrium', price: 3, cost: 40, desc: 'Premier modern shopping mall with flagship retail stores and amenities.' },
    { namePattern: 'Handicraft Heritage Cooperative', spec: 'Carved wood sculptures, woven baskets and traditional rugs', price: 2, cost: 25, desc: 'Fair-trade collective empowering rural artisans and traditional skills.' },
    { namePattern: 'Sweetmeat & Confectionery Bazaar', spec: 'Traditional almond halwas, spun sugar sweets and pistachio fudges', price: 1, cost: 8, desc: 'Heritage sweet shop row famed for mouthwatering regional dessert gifts.' }
  ],
  nature_adventure: [
    { namePattern: 'Cascading Mountain Waterfall Trek', spec: 'Lush canyon hike ending in crystal plunge pools', price: 1, cost: 5, desc: 'Exhilarating trail through dense sub-tropical greenery to a majestic falls.' },
    { namePattern: 'Wildflower Alpine Valley Meadow', spec: 'Seasonal carpet of colorful mountain blossoms', price: 1, cost: 0, desc: 'Serene rolling alpine grasslands perfect for nature photography and walks.' },
    { namePattern: 'Canyon River Kayaking & Rapids', spec: 'Guided river paddle through steep limestone gorges', price: 3, cost: 35, desc: 'Adrenaline-pumping paddle adventure down scenic winding river bends.' },
    { namePattern: 'Coastal Sea Caves & Ocean Kayak Trail', spec: 'Tide-carved marine caves accessible by ocean kayak', price: 3, cost: 30, desc: 'Dramatic natural rock sculptures shaped by millennia of crashing surf.' },
    { namePattern: 'Canopy Zipline & Tree Adventure Course', spec: 'High-speed cables soaring over lush forest canopies', price: 3, cost: 45, desc: 'Thrilling aerial ropes course offering eagle-eye views of the rainforest.' },
    { namePattern: 'Bird Sanctuary & Wetland Boardwalk', spec: 'Elevated wooden marsh path for spotting rare water birds', price: 1, cost: 6, desc: 'Protected ecological haven for kingfishers, egrets, and river otters.' },
    { namePattern: 'Hilltop Stone Peak Hiking Trail', spec: 'Highest accessible summit trail with 360-degree vistas', price: 1, cost: 0, desc: 'Rewarding 2-hour uphill trek ending in panoramic mountain splendor.' },
    { namePattern: 'Sub-Tropical Nature & Wildlife Reserve', spec: 'Guided ranger safaris tracking indigenous forest fauna', price: 2, cost: 20, desc: 'Sprawling bio-reserve dedicated to conserving native flora and fauna.' },
    { namePattern: 'Old Granite Quarry Blue Lagoon', spec: 'Crystal blue swimming waters surrounded by sheer stone cliffs', price: 1, cost: 5, desc: 'Popular recreation park with paddleboarding, lawns, and cliff walks.' },
    { namePattern: 'Bamboo Forest & Sacred Grove Walk', spec: 'Towering bamboo arches creating natural cathedral canopies', price: 1, cost: 2, desc: 'Tranquil natural grove celebrated for peaceful breezes and rustling reeds.' },
    { namePattern: 'Coastal Dune Sandboarding Hill', spec: 'Steep golden sand dunes perfect for sandboarding thrills', price: 2, cost: 15, desc: 'Fun coastal activity sliding down massive natural coastal dunes.' },
    { namePattern: 'Mountain Mountain-Biking Singletrack', spec: 'Maintained berms and flow trails through pine woodlands', price: 2, cost: 25, desc: 'Premier mountain bike trail system suited for beginners and veterans.' }
  ],
  family_friendly: [
    { namePattern: 'Splash Adventure Water Theme Park', spec: 'Giant wave pool, family raft slides and lazy rivers', price: 3, cost: 30, desc: 'Exciting water amusement park packed with slides and refreshing pools.' },
    { namePattern: 'Marine Discovery Oceanarium', spec: 'Underwater acrylic tunnel surrounded by sharks and stingrays', price: 3, cost: 22, desc: 'Mesmerizing marine aquarium bringing ocean wonders to visitors of all ages.' },
    { namePattern: 'Interactive Science & Planetarium Dome', spec: 'Hands-on physics experiments, robot labs & 3D space show', price: 2, cost: 14, desc: 'Engaging discovery hub where kids explore science through active play.' },
    { namePattern: 'River Safari & Wildlife Nature Boat', spec: 'Gentle river cruiser spotting playful river otters and birds', price: 2, cost: 18, desc: 'Safe scenic boat tour offering close encounters with native wetlands.' },
    { namePattern: 'Botanical Children Garden & Treehouse Maze', spec: 'Living willow maze, sensory herb beds and elevated treehouse', price: 1, cost: 5, desc: 'Enchanting garden playground designed to spark curiosity in nature.' },
    { namePattern: 'Outdoor Go-Karting Grand Prix Circuit', spec: 'Twin-seater family karts on a professional banked circuit', price: 2, cost: 18, desc: 'High-energy karting track providing fun and friendly racing excitement.' },
    { namePattern: 'Puppet Theatre & Interactive Story Pavilion', spec: 'Traditional marionette shows and children storytelling', price: 1, cost: 8, desc: 'Charming heritage theatre performing whimsical traditional folk tales.' },
    { namePattern: 'Chocolate Factory & Candy Discovery Workshop', spec: 'Make-your-own chocolate bar experience and tasting room', price: 2, cost: 16, desc: 'Sweet interactive workshop learning how cocoa transforms into confections.' },
    { namePattern: 'Miniature Heritage Railway & Steam Train', spec: 'Narrow-gauge steam locomotive circuit around scenic parks', price: 1, cost: 6, desc: 'Delightful vintage miniature train ride beloved by children and parents.' },
    { namePattern: 'Animal Farm & Petting Sanctuary', spec: 'Gentle sheep, pygmy goats, bunnies and pony grooming', price: 1, cost: 7, desc: 'Welcoming rural farm where kids feed friendly farmyard animals.' },
    { namePattern: 'All-Weather Indoor Snow Fun Kingdom', spec: 'Real snow tubing hills, ice slides and snowball arenas', price: 3, cost: 25, desc: 'Winter wonderland experience offering sub-zero fun year-round.' },
    { namePattern: 'Lakeside Pedal Boat & Duck Lagoon', spec: 'Whimsical swan pedal boats on calm willow-lined waters', price: 1, cost: 8, desc: 'Relaxing family pedal boating on a beautiful landscaped city lake.' }
  ],
  nightlife: [
    { namePattern: 'The Skyline Sunset Rooftop & Cocktail Terrace', spec: 'Signature botanic cocktails and sunset lounge beats', price: 3, cost: 35, desc: 'Sophisticated open-air rooftop providing unmatched night cityscapes.' },
    { namePattern: 'The Underground Jazz Cellar & Speakeasy', spec: 'Intimate candlelit brick vaults with live saxophone quartets', price: 2, cost: 25, desc: 'Atmospheric hidden door reveals world-class live improvisation.' },
    { namePattern: 'Riverside Open-Air Music Amphitheatre', spec: 'Craft draft beers, international DJ sets & food trucks', price: 2, cost: 20, desc: 'Sprawling night social hub popular with travelers and local music lovers.' },
    { namePattern: 'Beachfront Firepit & Cocktail Shack', spec: 'Tiki torches, barefoot dance floor and fresh fruit cocktails', price: 2, cost: 18, desc: 'Lively seaside lounge with waves lapping right at the edge of the sand.' },
    { namePattern: 'The Old Brewery & Craft Taphouse', spec: 'Flights of microbrewed IPAs, stouts and wood-fired flatbreads', price: 2, cost: 22, desc: 'Bustling social courtyard showcasing seasonal small-batch local beers.' },
    { namePattern: 'Illuminated Night Market & Street Food Stage', spec: 'Twinkling fairy lights, live acoustic buskers and tapas', price: 1, cost: 10, desc: 'Vibrant outdoor market alive with music, street performers, and cocktails.' },
    { namePattern: 'The Speakeasy Velvet Room & Gin Parlour', spec: 'Infused gin cocktails, velvet booths and vintage decor', price: 3, cost: 30, desc: 'Refined cocktail sanctuary hidden behind an antique bookcase facade.' },
    { namePattern: 'Latin Salsa & Rhythm Dance Social', spec: 'Beginner salsa lessons followed by open social dancing', price: 2, cost: 15, desc: 'High-energy dance floor filled with infectious percussion and mojitos.' },
    { namePattern: 'The Stand-Up Comedy & Improv Cellar', spec: 'Nightly stand-up routines, local comedians and craft ciders', price: 2, cost: 18, desc: 'Intimate basement comedy club guaranteeing memorable laughs.' },
    { namePattern: 'Twilight Harbor Cruise & Dance Boat', spec: 'Two-hour harbor cruise with live DJ sets and sunset drinks', price: 3, cost: 40, desc: 'Scenic evening boat ride viewing the illuminated shoreline architecture.' },
    { namePattern: 'Retro Arcade & Neon Cocktails Lounge', spec: 'Vintage pinball machines, arcade cabinets and neon cocktails', price: 2, cost: 16, desc: 'Nostalgic hangout combining classic 80s/90s gaming with great drinks.' },
    { namePattern: 'Open-Air Cinema & Moonlit Deck', spec: 'Classic film screenings under stars with loungers and drinks', price: 2, cost: 14, desc: 'Cozy outdoor cinema equipped with wireless headphones and cocktail bar.' }
  ]
};

function generateDynamicVenuesForTopic(
  topicId: string,
  destination: string,
  centerLat: number,
  centerLng: number,
  count = 14
): PlaceItem[] {
  const destClean = destination.split(',')[0].trim();
  const templates = CATEGORY_TEMPLATES[topicId] || CATEGORY_TEMPLATES['tourist_attractions'];

  return templates.slice(0, count).map((t, idx) => {
    const angle = (idx * 30 * Math.PI) / 180;
    const radius = 0.008 + (idx % 4) * 0.005;
    const lat = Number((centerLat + Math.sin(angle) * radius).toFixed(5));
    const lng = Number((centerLng + Math.cos(angle) * radius).toFixed(5));
    const name = `${destClean} ${t.namePattern}`;
    const address = `Central District ${idx + 1}, ${destClean}`;

    return {
      id: `${destClean.toLowerCase().replace(/[^a-z0-9]/g, '')}-${topicId}-${idx + 1}`,
      name,
      category: topicId,
      address,
      lat,
      lng,
      rating: Number((4.4 + (idx % 5) * 0.1).toFixed(1)),
      reviewCount: 1200 + idx * 650,
      priceLevel: t.price,
      estimatedCost: t.cost,
      speciality: t.spec,
      dietaryTag: t.dietary,
      description: `${t.desc} An essential highlight for visitors in ${destClean}.`,
      googleMapsUrl: makeGoogleMapsUrl(name, address, destClean),
      source: 'destination_engine',
      openingHours: {
        openTime: topicId === 'nightlife' ? '18:00' : topicId === 'cafes' ? '08:00' : '09:00',
        closeTime: topicId === 'nightlife' ? '02:00' : topicId === 'cafes' ? '22:00' : '19:00',
        daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        isOpenToday: true
      }
    };
  });
}

/**
 * Fetch curated venues organized by all sub-topics for a destination.
 * Guarantees 12+ venues per category.
 */
export async function fetchCuratedVenuesByTopic(
  destination: string,
  limitPerTopic = 12,
  coords?: { lat: number; lng: number }
): Promise<CuratedTopicVenues[]> {
  const destLower = destination.toLowerCase().trim();
  const cLat = coords?.lat || 15.4925;
  const cLng = coords?.lng || 73.7738;

  const isGoa = destLower.includes('goa');

  return SUB_TOPICS.map((topic) => {
    let venues: PlaceItem[] = [];

    if (isGoa && GOA_VENUES[topic.topicId] && GOA_VENUES[topic.topicId].length >= 10) {
      venues = GOA_VENUES[topic.topicId].slice(0, Math.max(12, limitPerTopic));
    } else {
      venues = generateDynamicVenuesForTopic(topic.topicId, destination, cLat, cLng, Math.max(12, limitPerTopic));
    }

    return {
      topicId: topic.topicId,
      title: topic.title,
      icon: topic.icon,
      description: topic.description,
      venues
    };
  });
}

/**
 * Fetch places for a single category with a minimum of 10 and up to 20 places.
 */
export async function fetchPlacesForCategory(
  destination: string,
  category: string,
  limit = 14,
  coords?: { lat: number; lng: number }
): Promise<PlaceItem[]> {
  const normCategory = normalizeCategory(category);
  const destLower = destination.toLowerCase().trim();
  const cLat = coords?.lat || 15.4925;
  const cLng = coords?.lng || 73.7738;

  const targetLimit = Math.max(10, Math.min(20, limit));

  if (destLower.includes('goa') && GOA_VENUES[normCategory] && GOA_VENUES[normCategory].length >= 10) {
    return GOA_VENUES[normCategory].slice(0, targetLimit);
  }

  return generateDynamicVenuesForTopic(normCategory, destination, cLat, cLng, targetLimit);
}
