import { z } from 'zod';
import { travelStyleEnum, activityCategoryEnum, bookingStatusEnum } from './trip.schema.js';

export const searchPlacesInputSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  destination: z.string().min(1, 'Destination is required'),
  category: z.string().optional(),
  limit: z.number().int().min(1).max(25).default(10)
});

export const getPlaceDetailsInputSchema = z.object({
  placeName: z.string().min(1, 'Place name is required'),
  destination: z.string().min(1, 'Destination is required'),
  placeId: z.string().optional()
});

export const getWeatherForecastInputSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  startDate: z.string(),
  endDate: z.string(),
  lat: z.number().optional(),
  lng: z.number().optional()
});

export const calculateRouteInputSchema = z.object({
  origin: z.string().min(1, 'Origin point is required'),
  destination: z.string().min(1, 'Destination point is required'),
  transportMode: z.enum(['walking', 'driving', 'transit', 'cycling']).default('transit'),
  originCoords: z.object({ lat: z.number(), lng: z.number() }).optional(),
  destinationCoords: z.object({ lat: z.number(), lng: z.number() }).optional()
});

export const checkOpeningHoursInputSchema = z.object({
  placeName: z.string().min(1, 'Place name is required'),
  dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  checkTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:MM')
});

export const estimateTripBudgetInputSchema = z.object({
  destination: z.string(),
  durationDays: z.number().int().positive(),
  travelerCount: z.number().int().positive(),
  travelStyle: travelStyleEnum,
  totalBudget: z.number().nonnegative(),
  currency: z.string().default('USD')
});

export const activityPlanSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: activityCategoryEnum,
  startTime: z.string(),
  endTime: z.string(),
  durationMinutes: z.number(),
  locationName: z.string(),
  locationAddress: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  estimatedCost: z.number(),
  currency: z.string().default('USD'),
  bookingRequired: z.boolean().default(false),
  bookingUrl: z.string().optional(),
  bookingStatus: bookingStatusEnum.default('not_booked'),
  notes: z.string().optional(),
  orderIndex: z.number()
});

export const dayPlanSchema = z.object({
  dayNumber: z.number().int().positive(),
  date: z.string(),
  theme: z.string(),
  summary: z.string(),
  activities: z.array(activityPlanSchema)
});

export const generateItineraryInputSchema = z.object({
  destination: z.string(),
  origin: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  durationDays: z.number(),
  travelerCount: z.number(),
  travelCompanion: z.string().optional(),
  travelStyle: travelStyleEnum,
  interests: z.array(z.string()),
  totalBudget: z.number(),
  currency: z.string()
});

export const validateItineraryInputSchema = z.object({
  totalBudget: z.number(),
  currency: z.string().default('USD'),
  days: z.array(dayPlanSchema)
});

export const updateTripInputSchema = z.object({
  tripId: z.string().uuid(),
  updates: z.record(z.any())
});

export const saveTripInputSchema = z.object({
  userId: z.string(),
  itinerary: z.record(z.any())
});
