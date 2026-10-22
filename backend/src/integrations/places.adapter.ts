import { PlaceItem } from '../types/trip.types.js';
import { env } from '../config/env.js';

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface CuratedPlaceCatalog {
  [cityKey: string]: {
    center: { lat: number; lng: number };
    places: PlaceItem[];
  };
}

const CURATED_PLACES: CuratedPlaceCatalog = {
  tokyo: {
    center: { lat: 35.6762, lng: 139.6503 },
    places: [
      {
        id: 'tyo-001',
        name: 'Senso-ji Temple & Nakamise-dori',
        category: 'cultural',
        address: '2 Chome-3-1 Asakusa, Taito City, Tokyo 111-0032',
        lat: 35.714765,
        lng: 139.796655,
        rating: 4.7,
        reviewCount: 38400,
        priceLevel: 1,
        estimatedCost: 0,
        openingHours: {
          openTime: '06:00',
          closeTime: '17:00',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Tokyo\'s oldest and most significant Buddhist temple, renowned for its giant red lantern and lively souvenir market.',
        photoUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff'
      },
      {
        id: 'tyo-002',
        name: 'Meiji Jingu Shrine',
        category: 'cultural',
        address: '1-1 Yoyogikamizonocho, Shibuya City, Tokyo 151-8557',
        lat: 35.676397,
        lng: 139.699325,
        rating: 4.6,
        reviewCount: 29500,
        priceLevel: 1,
        estimatedCost: 0,
        openingHours: {
          openTime: '06:00',
          closeTime: '18:00',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Grand Shinto shrine enveloped in an evergreen forest of over 100,000 trees donated from across Japan.',
        photoUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989'
      },
      {
        id: 'tyo-003',
        name: 'Tokyo Skytree Observation Deck',
        category: 'sightseeing',
        address: '1 Chome-1-2 Oshiage, Sumida City, Tokyo 131-0045',
        lat: 35.710063,
        lng: 139.8107,
        rating: 4.5,
        reviewCount: 42000,
        priceLevel: 2,
        estimatedCost: 22,
        openingHours: {
          openTime: '10:00',
          closeTime: '21:00',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'The tallest broadcasting tower in the world offering sweeping 360-degree panoramas of Tokyo and Mount Fuji.',
        photoUrl: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc'
      },
      {
        id: 'tyo-004',
        name: 'Shibuya Crossing & Hachiko Memorial',
        category: 'sightseeing',
        address: '2 Chome-2-1 Dogenzaka, Shibuya City, Tokyo 150-0043',
        lat: 35.6595,
        lng: 139.7005,
        rating: 4.7,
        reviewCount: 52000,
        priceLevel: 1,
        estimatedCost: 0,
        openingHours: {
          openTime: '00:00',
          closeTime: '23:59',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'The world\'s busiest pedestrian intersection, pulsing with giant video screens and energetic Tokyo city life.',
        photoUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26'
      },
      {
        id: 'tyo-005',
        name: 'teamLab Planets TOKYO',
        category: 'entertainment',
        address: '6 Chome-1-16 Toyosu, Koto City, Tokyo 135-0061',
        lat: 35.6496,
        lng: 139.7898,
        rating: 4.8,
        reviewCount: 31000,
        priceLevel: 3,
        estimatedCost: 36,
        openingHours: {
          openTime: '09:00',
          closeTime: '22:00',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Immersive body-interactive digital art museum where visitors walk barefoot through water and mirrored crystal rooms.',
        photoUrl: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9'
      },
      {
        id: 'tyo-006',
        name: 'Akihabara Electric Town & Retro Games',
        category: 'entertainment',
        address: 'Sotokanda, Chiyoda City, Tokyo 101-0021',
        lat: 35.698383,
        lng: 139.771972,
        rating: 4.5,
        reviewCount: 22000,
        priceLevel: 2,
        estimatedCost: 15,
        openingHours: {
          openTime: '10:00',
          closeTime: '20:00',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'The global epicenter of anime, manga, retro video games, and multi-floor hobbyist electronics.',
        photoUrl: 'https://images.unsplash.com/photo-1583095117900-58d3408a0114'
      },
      {
        id: 'tyo-007',
        name: 'Toyosu Fish Market & Sushi Dai',
        category: 'dining',
        address: '6 Chome-6-1 Toyosu, Koto City, Tokyo 135-0061',
        lat: 35.6447,
        lng: 139.7844,
        rating: 4.6,
        reviewCount: 14000,
        priceLevel: 3,
        estimatedCost: 45,
        openingHours: {
          openTime: '06:00',
          closeTime: '14:00',
          daysOpen: ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday'],
          isOpenToday: true
        },
        description: 'World-famous fresh seafood market where master sushi chefs prepare pristine seasonal sashimi and omakase.',
        photoUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c'
      },
      {
        id: 'tyo-008',
        name: 'Shinjuku Gyoen National Garden',
        category: 'outdoor',
        address: '11 Naitomachi, Shinjuku City, Tokyo 160-0014',
        lat: 35.685175,
        lng: 139.710052,
        rating: 4.7,
        reviewCount: 27000,
        priceLevel: 1,
        estimatedCost: 5,
        openingHours: {
          openTime: '09:00',
          closeTime: '17:30',
          daysOpen: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Lush imperial botanical park blending traditional Japanese landscape gardening with English and French formal gardens.',
        photoUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e'
      }
    ]
  },
  paris: {
    center: { lat: 48.8566, lng: 2.3522 },
    places: [
      {
        id: 'par-001',
        name: 'Eiffel Tower & Champ de Mars',
        category: 'sightseeing',
        address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris',
        lat: 48.85837,
        lng: 2.294481,
        rating: 4.7,
        reviewCount: 95000,
        priceLevel: 2,
        estimatedCost: 28,
        openingHours: {
          openTime: '09:30',
          closeTime: '23:45',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'The monumental wrought-iron icon of Paris, offering panoramic views across the Seine and city rooftops.',
        photoUrl: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f'
      },
      {
        id: 'par-002',
        name: 'Louvre Museum',
        category: 'cultural',
        address: 'Rue de Rivoli, 75001 Paris',
        lat: 48.860611,
        lng: 2.337644,
        rating: 4.8,
        reviewCount: 88000,
        priceLevel: 2,
        estimatedCost: 22,
        openingHours: {
          openTime: '09:00',
          closeTime: '18:00',
          daysOpen: ['Monday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'The world\'s largest art museum, home to the Mona Lisa, Venus de Milo, and Winged Victory of Samothrace.',
        photoUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a'
      },
      {
        id: 'par-003',
        name: 'Musée d\'Orsay',
        category: 'cultural',
        address: '1 Rue de la Légion d\'Honneur, 75007 Paris',
        lat: 48.859961,
        lng: 2.326561,
        rating: 4.8,
        reviewCount: 45000,
        priceLevel: 2,
        estimatedCost: 16,
        openingHours: {
          openTime: '09:30',
          closeTime: '18:00',
          daysOpen: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Housed in a grand Beaux-Arts railway station, featuring world-leading Impressionist masterpieces by Monet, Van Gogh, and Renoir.',
        photoUrl: 'https://images.unsplash.com/photo-1584448141569-69f342da535c'
      },
      {
        id: 'par-004',
        name: 'Montmartre & Sacré-Cœur Basilica',
        category: 'cultural',
        address: '35 Rue du Chevalier de la Barre, 75018 Paris',
        lat: 48.886705,
        lng: 2.343104,
        rating: 4.7,
        reviewCount: 54000,
        priceLevel: 1,
        estimatedCost: 0,
        openingHours: {
          openTime: '06:30',
          closeTime: '22:30',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Charming bohemian hilltop quarter with cobblestone alleys, portrait artists, and the radiant white dome of Sacré-Cœur.',
        photoUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34'
      },
      {
        id: 'par-005',
        name: 'Seine River Cruise on Bateaux Parisiens',
        category: 'sightseeing',
        address: 'Port de la Bourdonnais, 75007 Paris',
        lat: 48.8592,
        lng: 2.2934,
        rating: 4.6,
        reviewCount: 22000,
        priceLevel: 2,
        estimatedCost: 18,
        openingHours: {
          openTime: '10:00',
          closeTime: '22:30',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Gliding boat tour along the Seine viewing Notre-Dame, the Conciergerie, and Parisian bridges illuminated at night.',
        photoUrl: 'https://images.unsplash.com/photo-1520939817895-060bdef4ad1b'
      }
    ]
  },
  bangalore: {
    center: { lat: 12.9716, lng: 77.5946 },
    places: [
      {
        id: 'blr-001',
        name: 'Bangalore Palace & Royal Heritage Grounds',
        category: 'cultural',
        address: 'Vasanth Nagar, Bengaluru, Karnataka 560052',
        lat: 12.9982,
        lng: 77.5921,
        rating: 4.6,
        reviewCount: 34000,
        priceLevel: 2,
        estimatedCost: 250,
        openingHours: {
          openTime: '10:00',
          closeTime: '17:30',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Tudor-style royal palace inspired by England\'s Windsor Castle, featuring vintage artifacts, woodcarvings, and expansive grounds.'
      },
      {
        id: 'blr-002',
        name: 'Lalbagh Botanical Garden & Glass House',
        category: 'outdoor',
        address: 'Mavalli, Bengaluru, Karnataka 560004',
        lat: 12.9507,
        lng: 77.5848,
        rating: 4.7,
        reviewCount: 48000,
        priceLevel: 1,
        estimatedCost: 30,
        openingHours: {
          openTime: '06:00',
          closeTime: '19:00',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Historic 240-acre botanical haven founded by Hyder Ali, renowned for century-old trees, tranquil lake, and the iconic Victorian Glass House.'
      },
      {
        id: 'blr-003',
        name: 'Cubbon Park & State Central Library',
        category: 'outdoor',
        address: 'Kasturba Road, Sampangi Rama Nagara, Bengaluru 560001',
        lat: 12.9763,
        lng: 77.5929,
        rating: 4.6,
        reviewCount: 42000,
        priceLevel: 1,
        estimatedCost: 0,
        openingHours: {
          openTime: '06:00',
          closeTime: '18:00',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'The green lung of Bangalore spanning 300 acres with shaded bamboo groves, colonial red terracotta libraries, and statues.'
      },
      {
        id: 'blr-004',
        name: 'Vidhana Soudha & Attara Kacheri',
        category: 'sightseeing',
        address: 'Dr Ambedkar Veedhi, Sampangi Rama Nagara, Bengaluru 560001',
        lat: 12.9797,
        lng: 77.5907,
        rating: 4.7,
        reviewCount: 28000,
        priceLevel: 1,
        estimatedCost: 0,
        openingHours: {
          openTime: '09:00',
          closeTime: '17:30',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          isOpenToday: true
        },
        description: 'Imposing seat of the Karnataka state legislature built in Neo-Dravidian granite architecture, illuminated on weekend evenings.'
      },
      {
        id: 'blr-005',
        name: 'Tipu Sultan\'s Summer Palace',
        category: 'cultural',
        address: 'Tippu Sultan Palace Rd, Chamrajpet, Bengaluru 560018',
        lat: 12.9593,
        lng: 77.5738,
        rating: 4.4,
        reviewCount: 16000,
        priceLevel: 1,
        estimatedCost: 20,
        openingHours: {
          openTime: '08:30',
          closeTime: '17:30',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Exquisite Indo-Islamic wooden architecture adorned with carved teak pillars, floral frescoes, and a museum of historical memorabilia.'
      },
      {
        id: 'blr-006',
        name: 'VV Puram Food Street (Thindi Beedi)',
        category: 'dining',
        address: 'Old Market Rd, Sajjan Rao Circle, Bengaluru 560004',
        lat: 12.9532,
        lng: 77.5779,
        rating: 4.6,
        reviewCount: 31000,
        priceLevel: 1,
        estimatedCost: 150,
        openingHours: {
          openTime: '17:30',
          closeTime: '23:30',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Bangalore\'s most celebrated pure-vegetarian street food promenade serving hot paddus, butter masala dosas, Congress bun, and rabdi.'
      },
      {
        id: 'blr-007',
        name: 'Visvesvaraya Industrial & Technological Museum',
        category: 'entertainment',
        address: 'Kasturba Rd, Near Cubbon Park, Bengaluru 560001',
        lat: 12.9753,
        lng: 77.5962,
        rating: 4.6,
        reviewCount: 22000,
        priceLevel: 1,
        estimatedCost: 85,
        openingHours: {
          openTime: '09:30',
          closeTime: '18:00',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Interactive science wonderland with working engine displays, space galleries, dinosaur simulations, and flight simulators.'
      },
      {
        id: 'blr-008',
        name: 'Commercial Street & Brigade Road Walk',
        category: 'shopping',
        address: 'Commercial St, Tasker Town, Shivaji Nagar, Bengaluru 560001',
        lat: 12.9822,
        lng: 77.6083,
        rating: 4.5,
        reviewCount: 39000,
        priceLevel: 2,
        estimatedCost: 0,
        openingHours: {
          openTime: '10:30',
          closeTime: '21:30',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Vibrant pedestrian shopping district buzzing with artisanal silks, boutique apparel, jewelry, handicrafts, and bustling cafes.'
      }
    ]
  },
  saudi: {
    center: { lat: 24.7136, lng: 46.6753 },
    places: [
      {
        id: 'sau-001',
        name: 'Kingdom Centre Sky Bridge',
        category: 'sightseeing',
        address: 'King Fahd Rd, Al Olaya, Riyadh 12214, Saudi Arabia',
        lat: 24.7114,
        lng: 46.6744,
        rating: 4.6,
        reviewCount: 31000,
        priceLevel: 2,
        estimatedCost: 69,
        openingHours: {
          openTime: '12:00',
          closeTime: '23:00',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Spectacular 300-meter-high curved sky bridge offering unhindered panoramic vistas of Riyadh\'s glistening desert metropolis.'
      },
      {
        id: 'sau-002',
        name: 'Al Masmak Palace Museum',
        category: 'cultural',
        address: 'Al Thumairi St, Al Dirah, Riyadh 12634, Saudi Arabia',
        lat: 24.6312,
        lng: 46.7133,
        rating: 4.7,
        reviewCount: 22000,
        priceLevel: 1,
        estimatedCost: 0,
        openingHours: {
          openTime: '08:00',
          closeTime: '21:00',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Iconic 19th-century clay and mud-brick citadel that played a pivotal historical role in the unification of Saudi Arabia.'
      },
      {
        id: 'sau-003',
        name: 'Historic Diriyah & At-Turaif UNESCO Site',
        category: 'cultural',
        address: 'At-Turaif District, Diriyah 13711, Saudi Arabia',
        lat: 24.7339,
        lng: 46.5752,
        rating: 4.8,
        reviewCount: 27000,
        priceLevel: 2,
        estimatedCost: 50,
        openingHours: {
          openTime: '10:00',
          closeTime: '00:00',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'The historic birthplace of the Saudi nation, featuring restored Najdi adobe mud architecture, courtyards, and fine dining.'
      },
      {
        id: 'sau-004',
        name: 'National Museum of Saudi Arabia',
        category: 'cultural',
        address: 'Al Murabba, Riyadh 12631, Saudi Arabia',
        lat: 24.6477,
        lng: 46.7107,
        rating: 4.7,
        reviewCount: 19000,
        priceLevel: 1,
        estimatedCost: 10,
        openingHours: {
          openTime: '09:00',
          closeTime: '20:00',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          isOpenToday: true
        },
        description: 'Premier national museum displaying Arabian antiquities, pre-Islamic rock art, meteorites, and centuries of Islamic civilization.'
      },
      {
        id: 'sau-005',
        name: 'Boulevard Riyadh City',
        category: 'entertainment',
        address: 'Hittin District, Riyadh 13516, Saudi Arabia',
        lat: 24.7709,
        lng: 46.6028,
        rating: 4.6,
        reviewCount: 41000,
        priceLevel: 2,
        estimatedCost: 50,
        openingHours: {
          openTime: '16:00',
          closeTime: '02:00',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Vast entertainment and leisure paradise featuring synchronized dancing fountains, international pavilions, music, and dining.'
      },
      {
        id: 'sau-006',
        name: 'Souq Al Zal Traditional Market',
        category: 'shopping',
        address: 'Ad Dirah, Riyadh 12633, Saudi Arabia',
        lat: 24.6308,
        lng: 46.7155,
        rating: 4.6,
        reviewCount: 14000,
        priceLevel: 1,
        estimatedCost: 0,
        openingHours: {
          openTime: '16:00',
          closeTime: '22:30',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Oldest bazaar in Riyadh filled with aromas of burning oud, authentic handwoven carpets, antiques, and traditional daggers.'
      }
    ]
  }
};

export class PlacesAdapter {
  /**
   * Search for places matching a query and category in a destination.
   */
  static async searchPlaces(
    query: string,
    destination: string,
    category?: string,
    limit = 10,
    lat?: number,
    lng?: number
  ): Promise<{ places: PlaceItem[]; source: 'google_places' | 'curated_catalog' | 'osm_geocoder' }> {
    const destLower = destination.toLowerCase().trim();
    let catalogKey: string | undefined = undefined;

    if (destLower.includes('bangalore') || destLower.includes('bengaluru')) catalogKey = 'bangalore';
    else if (destLower.includes('saudi') || destLower.includes('riyadh')) catalogKey = 'saudi';
    else if (destLower.includes('paris')) catalogKey = 'paris';
    else if (destLower.includes('tokyo') || destLower.includes('japan')) catalogKey = 'tokyo';
    else {
      const firstWord = destLower.split(/[, ]+/)[0];
      if (CURATED_PLACES[firstWord]) catalogKey = firstWord;
    }

    // 1. If Google Maps API Key is provided, use Google Places API
    if (env.MAPS_API_KEY) {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
          `${query} in ${destination}`
        )}${lat !== undefined && lng !== undefined ? `&location=${lat},${lng}&radius=5000` : ''}&key=${env.MAPS_API_KEY}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const data = (await res.json()) as { results?: any[] };
          if (data.results && data.results.length > 0) {
            const places: PlaceItem[] = data.results.slice(0, limit).map((r: any) => ({
              id: r.place_id,
              name: r.name,
              category: category || (r.types?.[0]?.replace('_', ' ') ?? 'sightseeing'),
              address: r.formatted_address,
              lat: r.geometry.location.lat,
              lng: r.geometry.location.lng,
              rating: r.rating || 4.5,
              reviewCount: r.user_ratings_total || 100,
              priceLevel: r.price_level || 2,
              estimatedCost: (r.price_level || 2) * 15,
              openingHours: {
                openTime: '09:00',
                closeTime: '18:00',
                daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                isOpenToday: r.opening_hours?.open_now ?? true
              },
              description: `Popular spot in ${destination}`
            }));
            return { places, source: 'google_places' };
          }
        }
      } catch {
        // Fall back gracefully
      }
    }

    // 2. Check Curated High-Fidelity Catalog
    const catalog = catalogKey ? CURATED_PLACES[catalogKey] : undefined;
    if (catalog) {
      let filtered = catalog.places;
      if (category) {
        filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
      }
      if (query && query.trim() !== '') {
        const qLower = query.toLowerCase();
        const queryMatches = filtered.filter(
          p => p.name.toLowerCase().includes(qLower) || p.description?.toLowerCase().includes(qLower)
        );
        if (queryMatches.length > 0) {
          filtered = queryMatches;
        }
      }
      if (lat !== undefined && lng !== undefined) {
        filtered = filtered.sort((a, b) => distanceKm(lat, lng, a.lat, a.lng) - distanceKm(lat, lng, b.lat, b.lng));
      }
      return { places: filtered.slice(0, limit), source: 'curated_catalog' };
    }

    // 3. OpenStreetMap Nominatim Geocoder & Dynamic Fallback
    try {
      const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        `${query} ${destination}`
      )}&limit=${limit}${lat !== undefined && lng !== undefined ? `&viewbox=${lng - 0.05},${lat + 0.05},${lng + 0.05},${lat - 0.05}&bounded=1` : ''}`;
      const res = await fetch(geoUrl, {
        headers: { 'User-Agent': 'TripPilotAI/1.0' },
        signal: AbortSignal.timeout(3500)
      });
      if (res.ok) {
        const data = (await res.json()) as any[];
        if (Array.isArray(data) && data.length > 0) {
          const places: PlaceItem[] = data.map((item, idx) => ({
            id: `osm-${item.osm_id || idx}`,
            name: item.display_name.split(',')[0],
            category: category || 'sightseeing',
            address: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            rating: 4.5,
            reviewCount: 350,
            priceLevel: 2,
            estimatedCost: 15,
            openingHours: {
              openTime: '09:00',
              closeTime: '18:00',
              daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
              isOpenToday: true
            },
            description: `${item.type || 'Attraction'} in ${destination}`
          }));
          if (lat !== undefined && lng !== undefined) {
            places.sort((a, b) => distanceKm(lat, lng, a.lat, a.lng) - distanceKm(lat, lng, b.lat, b.lng));
          }
          return { places, source: 'osm_geocoder' };
        }
      }
    } catch {
      // Fall through to synthetic generation
    }

    // 4. City-Centered Synthesized POIs for arbitrary destinations
    const center = await this.getDestinationCoordinates(destination);
    const baseLat = center.lat;
    const baseLng = center.lng;
    const samplePlaces: PlaceItem[] = [
      {
        id: 'synth-001',
        name: `${destination} Historic Heritage Center`,
        category: 'cultural',
        address: `Central Heritage Promenade, ${destination}`,
        lat: baseLat + 0.005,
        lng: baseLng + 0.005,
        rating: 4.7,
        reviewCount: 1200,
        priceLevel: 1,
        estimatedCost: 0,
        openingHours: {
          openTime: '08:00',
          closeTime: '20:00',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: `Historic heart of ${destination} filled with cultural landmarks, paved pedestrian paths, and local heritage.`
      },
      {
        id: 'synth-002',
        name: `${destination} Central Cultural Museum`,
        category: 'cultural',
        address: `Museum Avenue, ${destination}`,
        lat: baseLat + 0.012,
        lng: baseLng - 0.008,
        rating: 4.6,
        reviewCount: 890,
        priceLevel: 2,
        estimatedCost: 18,
        openingHours: {
          openTime: '10:00',
          closeTime: '17:30',
          daysOpen: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: `Premier regional gallery showcasing art, historic treasures, and local exhibitions in ${destination}.`
      },
      {
        id: 'synth-003',
        name: `${destination} Panoramic Vista Point & Gardens`,
        category: 'sightseeing',
        address: `Skyline Boulevard, ${destination}`,
        lat: baseLat - 0.015,
        lng: baseLng + 0.01,
        rating: 4.8,
        reviewCount: 1540,
        priceLevel: 1,
        estimatedCost: 0,
        openingHours: {
          openTime: '06:00',
          closeTime: '22:00',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: `Scenic viewpoint offering sweeping views of the cityscape and natural surrounding horizon in ${destination}.`
      }
    ];

    return { places: samplePlaces.slice(0, limit), source: 'curated_catalog' };
  }

  /**
   * Get specific details for a place.
   */
  static async getPlaceDetails(placeName: string, destination: string): Promise<PlaceItem | null> {
    const { places } = await this.searchPlaces(placeName, destination, undefined, 5);
    const exact = places.find(p => p.name.toLowerCase().includes(placeName.toLowerCase()));
    return exact || places[0] || null;
  }

  /**
   * Resolve coordinates for a destination city.
   */
  static async getDestinationCoordinates(destination: string): Promise<{ lat: number; lng: number }> {
    const destLower = destination.toLowerCase().trim();

    if (destLower.includes('bangalore') || destLower.includes('bengaluru')) {
      return { lat: 12.9716, lng: 77.5946 };
    }
    if (destLower.includes('saudi') || destLower.includes('riyadh')) {
      return { lat: 24.7136, lng: 46.6753 };
    }
    if (destLower.includes('jeddah')) {
      return { lat: 21.5433, lng: 39.1728 };
    }
    if (destLower.includes('delhi')) {
      return { lat: 28.6139, lng: 77.2090 };
    }
    if (destLower.includes('mumbai')) {
      return { lat: 19.0760, lng: 72.8777 };
    }
    if (destLower.includes('dubai')) {
      return { lat: 25.2048, lng: 55.2708 };
    }
    if (destLower.includes('paris')) {
      return { lat: 48.8566, lng: 2.3522 };
    }
    if (destLower.includes('tokyo') || destLower.includes('japan')) {
      return { lat: 35.6762, lng: 139.6503 };
    }
    if (destLower.includes('london')) {
      return { lat: 51.5074, lng: -0.1278 };
    }
    if (destLower.includes('york')) {
      return { lat: 40.7128, lng: -74.0060 };
    }

    try {
      const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        destination
      )}&limit=1`;
      const res = await fetch(geoUrl, {
        headers: { 'User-Agent': 'TripPilotAI/1.0' },
        signal: AbortSignal.timeout(3500)
      });
      if (res.ok) {
        const data = (await res.json()) as any[];
        if (data.length > 0) {
          return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
      }
    } catch {
      // Fallback
    }

    // Default to city coordinates if matched or neutral equatorial
    if (destLower.includes('india')) return { lat: 12.9716, lng: 77.5946 };
    if (destLower.includes('middle east') || destLower.includes('arab')) return { lat: 24.7136, lng: 46.6753 };
    return { lat: 12.9716, lng: 77.5946 }; // Default to Bangalore center
  }

  /**
   * Verify if a place is open at a given time and day of week.
   */
  static checkOpeningHours(
    place: PlaceItem,
    dayOfWeek: string,
    time: string
  ): { isOpen: boolean; reason?: string } {
    if (!place.openingHours) {
      return { isOpen: true }; // Default open if unlisted
    }

    const { daysOpen, openTime, closeTime } = place.openingHours;

    if (!daysOpen.map(d => d.toLowerCase()).includes(dayOfWeek.toLowerCase())) {
      return {
        isOpen: false,
        reason: `${place.name} is closed on ${dayOfWeek}. Open on: ${daysOpen.join(', ')}.`
      };
    }

    if (time < openTime || time > closeTime) {
      return {
        isOpen: false,
        reason: `${place.name} is open from ${openTime} to ${closeTime}. Current activity time is ${time}.`
      };
    }

    return { isOpen: true };
  }
}
