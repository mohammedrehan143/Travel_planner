import { z } from 'zod';

export const travelStyleEnum = z.enum([
  'budget',
  'backpacking',
  'balanced',
  'cultural',
  'luxury',
  'adventure',
  'relaxed'
]);

export const tripStatusEnum = z.enum([
  'draft',
  'planning',
  'confirmed',
  'completed',
  'cancelled'
]);

export const collaboratorRoleEnum = z.enum(['owner', 'editor', 'viewer']);

export const activityCategoryEnum = z.enum([
  'sightseeing',
  'dining',
  'cultural',
  'outdoor',
  'transit',
  'shopping',
  'entertainment',
  'relaxation'
]);

export const bookingStatusEnum = z.enum([
  'not_booked',
  'booked',
  'optional',
  'reserved',
  'confirmed'
]);

export const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
export const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export const planTripSchema = z.object({
  origin: z.string().min(2, 'Origin city or address is required'),
  destination: z.string().min(2, 'Destination city or region is required'),
  startDate: z.string().regex(dateRegex, 'startDate must be formatted as YYYY-MM-DD'),
  endDate: z.string().regex(dateRegex, 'endDate must be formatted as YYYY-MM-DD'),
  travelerCount: z.number().int().min(1).max(50).default(1),
  travelCompanion: z.string().optional(),
  dietaryPreference: z.string().optional(),
  budget: z.number().nonnegative().optional().default(2000),
  currency: z.string().length(3).default('USD'),
  travelStyle: travelStyleEnum.default('balanced'),
  interests: z.array(z.string()).default([]),
  transportPreference: z.enum(['flight', 'train', 'car', 'public_transit', 'flexible']).default('flexible'),
  accommodationPreference: z.enum(['hotel', 'hostel', 'resort', 'apartment', 'villa', 'flexible']).default('hotel'),
  notes: z.string().max(1000).optional(),
  tripId: z.string().uuid().optional(),
  asyncExecution: z.boolean().default(false)
}).refine(data => data.endDate >= data.startDate, {
  message: 'endDate must be on or after startDate',
  path: ['endDate']
});

export const modifyTripSchema = z.object({
  instructions: z.string().min(3, 'Modification instruction is required'),
  targetDay: z.number().int().min(1).optional()
});

export const regenerateDaySchema = z.object({
  dayNumber: z.number().int().min(1).optional(),
  customPacing: z.enum(['relaxed', 'packed', 'adventure', 'cultural']).optional(),
  specificInterests: z.array(z.string()).optional()
});

export const updateTripSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  totalBudget: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  status: tripStatusEnum.optional(),
  coverImageUrl: z.string().url().optional(),
  interests: z.array(z.string()).optional(),
  travelStyle: travelStyleEnum.optional()
});

export const addCollaboratorSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.enum(['editor', 'viewer']).default('viewer')
});

export const updateActivitySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: activityCategoryEnum.optional(),
  startTime: z.string().regex(timeRegex).optional(),
  endTime: z.string().regex(timeRegex).optional(),
  locationName: z.string().optional(),
  locationAddress: z.string().optional(),
  estimatedCost: z.number().nonnegative().optional(),
  bookingStatus: bookingStatusEnum.optional(),
  notes: z.string().optional(),
  orderIndex: z.number().int().nonnegative().optional()
});

export const addActivitySchema = z.object({
  tripDayId: z.string().uuid(),
  title: z.string().min(1, 'Activity title is required'),
  description: z.string().optional(),
  category: activityCategoryEnum.default('sightseeing'),
  startTime: z.string().regex(timeRegex, 'startTime must be HH:MM or HH:MM:SS'),
  endTime: z.string().regex(timeRegex, 'endTime must be HH:MM or HH:MM:SS'),
  durationMinutes: z.number().int().min(1).default(60),
  locationName: z.string().min(1, 'Location name is required'),
  locationAddress: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  estimatedCost: z.number().nonnegative().default(0),
  currency: z.string().length(3).default('USD'),
  bookingRequired: z.boolean().default(false),
  bookingUrl: z.string().url().optional(),
  bookingStatus: bookingStatusEnum.default('not_booked'),
  notes: z.string().optional(),
  orderIndex: z.number().int().nonnegative().default(0)
});
