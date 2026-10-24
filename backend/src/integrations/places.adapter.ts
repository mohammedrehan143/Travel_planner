import { PlaceItem, CuratedTopicVenues, CategoryPlacesResult, PlacesSearchResponse } from '../types/trip.types.js';
import { env } from '../config/env.js';
import {
  fetchCuratedVenuesByTopic,
  fetchPlacesForCategory,
  normalizeCategory,
  SUB_TOPICS,
  TopicBlueprint
} from './curatedVenuesByTopic.js';

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
  },
  goa: {
    center: { lat: 15.2993, lng: 74.1240 },
    places: [
      {
        id: 'goa-001',
        name: 'Fort Aguada & 1864 Portuguese Lighthouse',
        category: 'sightseeing',
        address: 'Aguada Fort Rd, Candolim, Goa 403515',
        lat: 15.4920,
        lng: 73.7735,
        rating: 4.6,
        reviewCount: 38000,
        priceLevel: 1,
        estimatedCost: 50,
        openingHours: {
          openTime: '09:00',
          closeTime: '17:30',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Commanding 17th-century Portuguese fortress overlooking the Arabian Sea, featuring a historic 4-tiered lighthouse and stone ramparts.'
      },
      {
        id: 'goa-002',
        name: 'Basilica of Bom Jesus (UNESCO World Heritage Site)',
        category: 'cultural',
        address: 'Old Goa Rd, Bainguinim, Goa 403402',
        lat: 15.5009,
        lng: 73.9116,
        rating: 4.7,
        reviewCount: 42000,
        priceLevel: 1,
        estimatedCost: 0,
        openingHours: {
          openTime: '09:00',
          closeTime: '18:30',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Magnificent 1605 Baroque basilica holding the sacred mortal remains of St. Francis Xavier, renowned for ornate gilded woodwork and marble altars.'
      },
      {
        id: 'goa-003',
        name: 'Fontainhas Latin Quarter Heritage Walk',
        category: 'cultural',
        address: 'Fontainhas, Altinho, Panaji, Goa 403001',
        lat: 15.4989,
        lng: 73.8278,
        rating: 4.6,
        reviewCount: 22000,
        priceLevel: 1,
        estimatedCost: 0,
        openingHours: {
          openTime: '07:00',
          closeTime: '21:00',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Asia\'s only surviving Latin Quarter featuring narrow cobblestone alleys lined with vibrant pastel Portuguese villas, tiled roofs, and heritage cafes.'
      },
      {
        id: 'goa-004',
        name: 'Anjuna Beach & Sun-Kissed Flea Market Promenade',
        category: 'relaxation',
        address: 'Anjuna Beach, Anjuna, Goa 403509',
        lat: 15.5733,
        lng: 73.7410,
        rating: 4.5,
        reviewCount: 29000,
        priceLevel: 1,
        estimatedCost: 0,
        openingHours: {
          openTime: '06:00',
          closeTime: '23:00',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Iconic golden shoreline framed by red laterite cliffs, swaying coconut palms, world-famous beach shacks, and vibrant flea market culture.'
      },
      {
        id: 'goa-005',
        name: 'Vinayak Family Restaurant - Authentic Goan Seafood & Thali',
        category: 'dining',
        address: 'House No. 252, Main Road, Assagao, Goa 403507',
        lat: 15.5898,
        lng: 73.7845,
        rating: 4.7,
        reviewCount: 16500,
        priceLevel: 2,
        estimatedCost: 280,
        openingHours: {
          openTime: '12:30',
          closeTime: '22:30',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Celebrated local culinary haven famous for authentic Goan Fish Curry Thali, Prawn Balchão, Rava Fried Kingfish, and refreshing Sol Kadhi.'
      },
      {
        id: 'goa-006',
        name: 'Palolem Beach & Butterfly Island Cove',
        category: 'relaxation',
        address: 'Palolem Beach, Canacona, South Goa 403702',
        lat: 15.0100,
        lng: 74.0232,
        rating: 4.8,
        reviewCount: 34000,
        priceLevel: 1,
        estimatedCost: 0,
        openingHours: {
          openTime: '06:00',
          closeTime: '23:00',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Idyllic crescent bay in South Goa renowned for tranquil calm waters, beachside wooden huts, dolphin-spotting boat trips, and couples sunset dining.'
      }
    ]
  },
  rajasthan: {
    center: { lat: 26.9124, lng: 75.7873 },
    places: [
      {
        id: 'raj-001',
        name: 'Amer Fort & Sheesh Mahal (Mirror Palace)',
        category: 'cultural',
        address: 'Devi Singhpura, Amer, Jaipur, Rajasthan 302001',
        lat: 26.9855,
        lng: 75.8513,
        rating: 4.8,
        reviewCount: 58000,
        priceLevel: 2,
        estimatedCost: 150,
        openingHours: {
          openTime: '08:00',
          closeTime: '17:30',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Imposing 16th-century Rajput-Mughal hilltop fortress constructed of red sandstone and marble, housing the glittering Sheesh Mahal mirror hall.'
      },
      {
        id: 'raj-002',
        name: 'Hawa Mahal (Palace of Winds)',
        category: 'sightseeing',
        address: 'Hawa Mahal Rd, Badi Choupad, Jaipur, Rajasthan 302002',
        lat: 26.9239,
        lng: 75.8267,
        rating: 4.6,
        reviewCount: 46000,
        priceLevel: 1,
        estimatedCost: 50,
        openingHours: {
          openTime: '09:00',
          closeTime: '17:00',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Iconic 1799 pink sandstone palace facade featuring 953 intricately carved jharokha honeycomb windows designed for royal breezes.'
      },
      {
        id: 'raj-003',
        name: 'City Palace Complex & Mubarak Mahal',
        category: 'cultural',
        address: 'Tulsi Marg, Gangori Bazaar, Jaipur, Rajasthan 302002',
        lat: 26.9258,
        lng: 75.8237,
        rating: 4.7,
        reviewCount: 39000,
        priceLevel: 2,
        estimatedCost: 200,
        openingHours: {
          openTime: '09:30',
          closeTime: '17:00',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Sprawling royal citadel blending Rajput and Mughal architectural styles, housing royal museums, ceremonial courtyards, and the Peacock Gate.'
      },
      {
        id: 'raj-004',
        name: 'Mehrangarh Fort Citadel (Jodhpur)',
        category: 'cultural',
        address: 'P.B# 165, The Fort, Jodhpur, Rajasthan 342006',
        lat: 26.2978,
        lng: 73.0185,
        rating: 4.9,
        reviewCount: 48000,
        priceLevel: 2,
        estimatedCost: 200,
        openingHours: {
          openTime: '09:00',
          closeTime: '17:00',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'One of India\'s largest and most magnificent citadels perched 400 feet above the blue city of Jodhpur, containing expansive palace galleries.'
      },
      {
        id: 'raj-005',
        name: 'Laxmi Mishthan Bhandar (LMB) - Pure Royal Rajasthani Dining',
        category: 'dining',
        address: 'Johari Bazar, Jaipur, Rajasthan 302003',
        lat: 26.9205,
        lng: 75.8260,
        rating: 4.5,
        reviewCount: 24000,
        priceLevel: 2,
        estimatedCost: 450,
        openingHours: {
          openTime: '08:00',
          closeTime: '23:00',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Historic culinary institution serving authentic royal Rajasthani Dal Baati Churma, Gatte ki Sabzi, Ker Sangri, and freshly baked Pyaaz Kachoris.'
      }
    ]
  },
  manali: {
    center: { lat: 32.2432, lng: 77.1892 },
    places: [
      {
        id: 'man-001',
        name: 'Solang Valley & Alpine Adventure Panorama',
        category: 'outdoor',
        address: 'Solang Valley, Manali, Himachal Pradesh 175103',
        lat: 32.3166,
        lng: 77.1575,
        rating: 4.7,
        reviewCount: 35000,
        priceLevel: 1,
        estimatedCost: 100,
        openingHours: {
          openTime: '08:00',
          closeTime: '18:00',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Spectacular alpine mountain valley surrounded by snow-draped Himalayan ridges, cedar forests, and scenic viewpoints.'
      },
      {
        id: 'man-002',
        name: 'Hadimba Devi 1553 Cedar Pagoda Shrine',
        category: 'cultural',
        address: 'Hadimba Temple Rd, Old Manali, Himachal Pradesh 175131',
        lat: 32.2483,
        lng: 77.1804,
        rating: 4.6,
        reviewCount: 41000,
        priceLevel: 1,
        estimatedCost: 20,
        openingHours: {
          openTime: '08:00',
          closeTime: '18:00',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Historic 16th-century four-tiered wooden pagoda temple carved with mythological motifs nestled amid towering deodar forests.'
      },
      {
        id: 'man-003',
        name: 'Old Manali Riverside Village & Artisan Cafes',
        category: 'relaxation',
        address: 'Old Manali, Manali, Himachal Pradesh 175131',
        lat: 32.2536,
        lng: 77.1772,
        rating: 4.7,
        reviewCount: 18000,
        priceLevel: 1,
        estimatedCost: 0,
        openingHours: {
          openTime: '08:00',
          closeTime: '22:00',
          daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          isOpenToday: true
        },
        description: 'Peaceful bohemian mountain hamlet featuring traditional Himachali stone houses, riverside apple orchards, and indie cafes.'
      }
    ]
  }
};

export class PlacesAdapter {
  /**
   * Helper to deduplicate places while keeping the most complete records.
   */
  private static deduplicatePlaces(places: PlaceItem[]): PlaceItem[] {
    const seen = new Map<string, PlaceItem>();

    for (const place of places) {
      const normalizedKey = (
        place.id ||
        place.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      ).trim();

      if (!seen.has(normalizedKey)) {
        seen.set(normalizedKey, place);
      } else {
        // Merge records: preserve the one with higher ratings or fuller details
        const existing = seen.get(normalizedKey)!;
        if ((place.rating && !existing.rating) || (place.reviewCount || 0) > (existing.reviewCount || 0)) {
          seen.set(normalizedKey, { ...existing, ...place });
        }
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Search for places for a single category, targeting a minimum of 10 and up to 20 places.
   */
  static async searchPlacesByCategory(
    destination: string,
    category: string,
    limit = 14,
    coords?: { lat: number; lng: number }
  ): Promise<{ places: PlaceItem[]; source: 'google_places' | 'curated_catalog' | 'osm_geocoder' | 'destination_engine' }> {
    const targetLimit = Math.max(10, Math.min(20, limit));
    const normCategory = normalizeCategory(category);
    let resolvedCoords = coords;

    if (!resolvedCoords) {
      try {
        resolvedCoords = await this.getDestinationCoordinates(destination);
      } catch {
        resolvedCoords = { lat: 15.4925, lng: 73.7738 };
      }
    }

    // Category query formulating
    const categoryQueryMap: Record<string, string> = {
      tourist_attractions: `Top tourist attractions and landmarks in ${destination}`,
      restaurants: `Popular restaurants and local food in ${destination}`,
      cafes: `Best cafes and specialty coffee in ${destination}`,
      beaches: `Best beaches and waterfronts in ${destination}`,
      historical_places: `Historical places and heritage monuments in ${destination}`,
      museums: `Famous museums and art galleries in ${destination}`,
      shopping: `Popular shopping markets and night bazaars in ${destination}`,
      nature_adventure: `Nature and adventure activities in ${destination}`,
      family_friendly: `Family-friendly attractions and activities in ${destination}`,
      nightlife: `Popular nightlife, lounges and sunset hangouts in ${destination}`
    };

    const searchQuery = categoryQueryMap[normCategory] || `${category} in ${destination}`;
    let rawPlaces: PlaceItem[] = [];
    let source: 'google_places' | 'curated_catalog' | 'osm_geocoder' | 'destination_engine' = 'curated_catalog';

    // 1. Google Places API (if API Key is configured)
    if (env.MAPS_API_KEY) {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
          searchQuery
        )}${resolvedCoords ? `&location=${resolvedCoords.lat},${resolvedCoords.lng}&radius=15000` : ''}&key=${env.MAPS_API_KEY}`;

        const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
        if (res.ok) {
          const data = (await res.json()) as { results?: any[]; next_page_token?: string; status?: string };
          if (data.results && data.results.length > 0) {
            rawPlaces = data.results.map((r: any) => ({
              id: r.place_id,
              name: r.name,
              category: normCategory,
              address: r.formatted_address,
              lat: r.geometry?.location?.lat || resolvedCoords!.lat,
              lng: r.geometry?.location?.lng || resolvedCoords!.lng,
              rating: r.rating || 4.5,
              reviewCount: r.user_ratings_total || 120,
              priceLevel: r.price_level || 2,
              estimatedCost: (r.price_level || 2) * 15,
              photoUrl: r.photos?.[0]?.photo_reference
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${r.photos[0].photo_reference}&key=${env.MAPS_API_KEY}`
                : undefined,
              description: `${r.name} is a renowned ${normCategory.replace('_', ' ')} spot in ${destination}.`,
              googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${r.name} ${r.formatted_address || destination}`
              )}&query_place_id=${r.place_id}`,
              source: 'google_places',
              openingHours: {
                openTime: normCategory === 'nightlife' ? '18:00' : '09:00',
                closeTime: normCategory === 'nightlife' ? '02:00' : '20:00',
                daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                isOpenToday: r.opening_hours?.open_now ?? true
              }
            }));
            source = 'google_places';
          }
        }
      } catch (err: any) {
        console.warn(`[PlacesAdapter] Google Places query error: ${err.message}`);
      }
    }

    // 2. Curated & Localized Catalog Fallback (guarantees >= 10 results per category)
    if (rawPlaces.length < targetLimit) {
      const curatedResults = await fetchPlacesForCategory(destination, normCategory, targetLimit, resolvedCoords);
      if (rawPlaces.length === 0) {
        rawPlaces = curatedResults;
        source = 'curated_catalog';
      } else {
        // Merge curated places to fill up to targetLimit
        rawPlaces = [...rawPlaces, ...curatedResults];
      }
    }

    // Deduplicate without losing results
    const deduped = this.deduplicatePlaces(rawPlaces);
    const finalPlaces = deduped.slice(0, targetLimit);

    // Diagnostics log (never logs API keys)
    console.log(
      `[PlacesAdapter] Search for "${destination}" [Category: ${normCategory}] -> Raw: ${rawPlaces.length}, Deduped: ${deduped.length}, Returned: ${finalPlaces.length} (Source: ${source})`
    );

    return { places: finalPlaces, source };
  }

  /**
   * Search across multiple categories independently and return separate lists of 10-20 places per category.
   */
  static async searchMultipleCategories(
    destination: string,
    categories: string[],
    limitPerCategory = 14
  ): Promise<PlacesSearchResponse> {
    const coords = await this.getDestinationCoordinates(destination);
    const targetLimit = Math.max(10, Math.min(20, limitPerCategory));
    const categoryResults: CategoryPlacesResult[] = [];
    const allPlaces: PlaceItem[] = [];

    let totalRawCount = 0;
    let primarySource: 'google_places' | 'curated_catalog' | 'osm_geocoder' | 'destination_engine' = 'curated_catalog';

    for (const cat of categories) {
      const normCat = normalizeCategory(cat);
      const blueprint = SUB_TOPICS.find(t => t.topicId === normCat) || {
        topicId: normCat,
        title: normCat.replace('_', ' ').toUpperCase(),
        icon: '📍',
        description: `Curated ${normCat} places in ${destination}`
      };

      const result = await this.searchPlacesByCategory(destination, normCat, targetLimit, coords);
      totalRawCount += result.places.length;
      if (result.source === 'google_places') primarySource = 'google_places';

      categoryResults.push({
        category: normCat,
        categoryLabel: blueprint.title,
        count: result.places.length,
        places: result.places,
        hasMore: false
      });

      allPlaces.push(...result.places);
    }

    const dedupedAll = this.deduplicatePlaces(allPlaces);

    console.log(
      `[PlacesAdapter] Multi-Category Search for "${destination}" (${categories.length} categories) -> Total Raw: ${totalRawCount}, Unique Places: ${dedupedAll.length}`
    );

    return {
      destination,
      categories: categoryResults,
      totalPlaces: dedupedAll.length,
      source: primarySource,
      places: dedupedAll,
      diagnostics: {
        requestedCategories: categories,
        rawCount: totalRawCount,
        dedupedCount: dedupedAll.length,
        queriesProcessed: categories.length
      }
    };
  }

  /**
   * Search for places matching a query and category in a destination.
   * Guarantees at least 10 relevant places per category whenever requested.
   */
  static async searchPlaces(
    query: string,
    destination: string,
    category?: string,
    limit = 10,
    lat?: number,
    lng?: number,
    categories?: string[]
  ): Promise<{
    places: PlaceItem[];
    categories?: CategoryPlacesResult[];
    totalPlaces?: number;
    destination?: string;
    source: 'google_places' | 'curated_catalog' | 'osm_geocoder' | 'destination_engine';
    diagnostics?: {
      requestedCategories: string[];
      rawCount: number;
      dedupedCount: number;
      queriesProcessed: number;
    };
  }> {
    const targetLimit = Math.max(10, Math.min(20, limit));

    // Check if multiple categories were provided as an array or comma-separated string
    const multiCats = categories && categories.length > 0
      ? categories
      : category && category.includes(',')
      ? category.split(',').map(s => s.trim()).filter(Boolean)
      : null;

    if (multiCats && multiCats.length > 1) {
      return await this.searchMultipleCategories(destination, multiCats, targetLimit);
    }

    const targetCategory = category || (query && normalizeCategory(query) !== 'tourist_attractions' ? query : undefined);

    if (targetCategory) {
      const res = await this.searchPlacesByCategory(
        destination,
        targetCategory,
        targetLimit,
        lat !== undefined && lng !== undefined ? { lat, lng } : undefined
      );

      const blueprint = SUB_TOPICS.find(t => t.topicId === normalizeCategory(targetCategory));
      return {
        places: res.places,
        categories: [
          {
            category: normalizeCategory(targetCategory),
            categoryLabel: blueprint?.title || targetCategory,
            count: res.places.length,
            places: res.places
          }
        ],
        totalPlaces: res.places.length,
        destination,
        source: res.source,
        diagnostics: {
          requestedCategories: [targetCategory],
          rawCount: res.places.length,
          dedupedCount: res.places.length,
          queriesProcessed: 1
        }
      };
    }

    // General query search
    const coords = lat !== undefined && lng !== undefined
      ? { lat, lng }
      : await this.getDestinationCoordinates(destination);

    // Retrieve rich multi-topic places
    const defaultCategories = ['tourist_attractions', 'restaurants', 'cafes', 'beaches'];
    const multiRes = await this.searchMultipleCategories(destination, defaultCategories, Math.ceil(targetLimit / 2));

    let filtered = multiRes.places;
    const destLower = destination.toLowerCase().trim();

    // Check if known city catalog has specific matches for this query
    if (query && query.trim() !== '') {
      const qLower = query.toLowerCase().trim();
      const matchingCurated: PlaceItem[] = [];

      for (const [cityKey, cityData] of Object.entries(CURATED_PLACES)) {
        if (destLower.includes(cityKey)) {
          for (const cp of cityData.places) {
            const cpText = `${cp.name} ${cp.description || ''} ${cp.category}`.toLowerCase();
            if (cpText.includes(qLower)) {
              matchingCurated.push({
                ...cp,
                googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cp.name} ${cp.address || destination}`)}`,
                source: 'curated_catalog'
              });
            }
          }
        }
      }

      const matches = multiRes.places.filter(
        p => p.name.toLowerCase().includes(qLower) || p.description?.toLowerCase().includes(qLower) || p.category.toLowerCase().includes(qLower)
      );

      const combined = this.deduplicatePlaces([...matchingCurated, ...matches, ...multiRes.places]);
      filtered = combined;
    }

    const finalPlaces = filtered.slice(0, targetLimit);

    return {
      places: finalPlaces,
      categories: multiRes.categories,
      totalPlaces: finalPlaces.length,
      destination,
      source: multiRes.source,
      diagnostics: {
        requestedCategories: defaultCategories,
        rawCount: multiRes.places.length,
        dedupedCount: finalPlaces.length,
        queriesProcessed: defaultCategories.length
      }
    };
  }

  /**
   * Get specific details for a place.
   */
  static async getPlaceDetails(placeName: string, destination: string): Promise<PlaceItem | null> {
    const destLower = destination.toLowerCase().trim();
    const pLower = placeName.toLowerCase().trim();

    // 1. Check known high-fidelity curated catalog first
    for (const [cityKey, cityData] of Object.entries(CURATED_PLACES)) {
      if (destLower.includes(cityKey)) {
        const found = cityData.places.find(
          p => p.name.toLowerCase().includes(pLower) || pLower.includes(p.name.toLowerCase())
        );
        if (found) {
          const item = { ...found };
          if (!item.googleMapsUrl) {
            item.googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.name} ${item.address || destination}`)}`;
          }
          return item;
        }
      }
    }

    // 2. Search places
    const { places } = await this.searchPlaces(placeName, destination, undefined, 10);
    const exact = places.find(p => p.name.toLowerCase().includes(pLower) || pLower.includes(p.name.toLowerCase()));
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
    if (destLower.includes('goa')) {
      return { lat: 15.2993, lng: 74.1240 };
    }
    if (destLower.includes('rajasthan') || destLower.includes('jaipur')) {
      return { lat: 26.9124, lng: 75.7873 };
    }
    if (destLower.includes('udaipur')) {
      return { lat: 24.5854, lng: 73.7125 };
    }
    if (destLower.includes('jodhpur')) {
      return { lat: 26.2918, lng: 73.0168 };
    }
    if (destLower.includes('manali') || destLower.includes('himachal')) {
      return { lat: 32.2432, lng: 77.1892 };
    }
    if (destLower.includes('shimla')) {
      return { lat: 31.1048, lng: 77.1734 };
    }
    if (destLower.includes('kashmir') || destLower.includes('gulmarg') || destLower.includes('srinagar')) {
      return { lat: 34.0837, lng: 74.7973 };
    }
    if (destLower.includes('kerala') || destLower.includes('kochi') || destLower.includes('cochin')) {
      return { lat: 9.9312, lng: 76.2673 };
    }
    if (destLower.includes('munnar')) {
      return { lat: 10.0889, lng: 77.0595 };
    }
    if (destLower.includes('agra')) {
      return { lat: 27.1767, lng: 78.0081 };
    }
    if (destLower.includes('varanasi')) {
      return { lat: 25.3176, lng: 82.9739 };
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
    if (destLower.includes('rome') || destLower.includes('italy')) {
      return { lat: 41.9028, lng: 12.4964 };
    }
    if (destLower.includes('singapore')) {
      return { lat: 1.3521, lng: 103.8198 };
    }
    if (destLower.includes('zermatt') || destLower.includes('switzerland') || destLower.includes('swiss')) {
      return { lat: 45.9765, lng: 7.7491 };
    }
    if (destLower.includes('bali') || destLower.includes('indonesia')) {
      return { lat: -8.4095, lng: 115.1889 };
    }
    if (destLower.includes('maldives')) {
      return { lat: 3.2028, lng: 73.2207 };
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

  /**
   * Return curated venues organized by sub-topic with > 10 venues per topic.
   */
  static async getCuratedVenuesByTopic(
    destination: string,
    limitPerTopic = 12
  ): Promise<CuratedTopicVenues[]> {
    const coords = await this.getDestinationCoordinates(destination);
    return await fetchCuratedVenuesByTopic(destination, limitPerTopic, coords);
  }
}
