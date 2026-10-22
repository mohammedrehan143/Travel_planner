import { describe, it, expect } from 'vitest';
import { ItineraryValidator } from '../src/agent/validator.js';
import { PlannedDay } from '../src/types/trip.types.js';

describe('Itinerary Validator Unit Tests', () => {
  it('passes a well-formed itinerary with realistic pacing and timing', () => {
    const days: PlannedDay[] = [
      {
        dayNumber: 1,
        date: '2026-11-01',
        theme: 'Culture',
        summary: 'Museums and dining',
        dayEstimatedCost: 65,
        activities: [
          {
            title: 'Morning Museum',
            description: 'Art gallery',
            category: 'cultural',
            startTime: '09:30',
            endTime: '11:30',
            durationMinutes: 120,
            locationName: 'Art Museum',
            latitude: 48.86,
            longitude: 2.33,
            estimatedCost: 20,
            currency: 'USD',
            bookingRequired: false,
            orderIndex: 1
          },
          {
            title: 'Artisanal Lunch',
            description: 'French Bistro',
            category: 'dining',
            startTime: '12:00',
            endTime: '13:30',
            durationMinutes: 90,
            locationName: 'Bistro',
            latitude: 48.861,
            longitude: 2.332,
            estimatedCost: 30,
            currency: 'USD',
            bookingRequired: false,
            orderIndex: 2
          },
          {
            title: 'Afternoon Gardens',
            description: 'Walk through Tuileries',
            category: 'outdoor',
            startTime: '14:30',
            endTime: '16:30',
            durationMinutes: 120,
            locationName: 'Jardin des Tuileries',
            latitude: 48.863,
            longitude: 2.327,
            estimatedCost: 15,
            currency: 'USD',
            bookingRequired: false,
            orderIndex: 3
          }
        ]
      }
    ];

    const report = ItineraryValidator.validate(days, 500, 65);
    expect(report.isValid).toBe(true);
    expect(report.errorCount).toBe(0);
    expect(report.metrics.totalActivities).toBe(3);
  });

  it('detects time overlap between consecutive activities', () => {
    const days: PlannedDay[] = [
      {
        dayNumber: 1,
        date: '2026-11-01',
        theme: 'Test Day',
        summary: 'Day with overlapping events',
        dayEstimatedCost: 50,
        activities: [
          {
            title: 'Activity A',
            description: 'Ends at 12:00',
            category: 'sightseeing',
            startTime: '10:00',
            endTime: '12:00',
            durationMinutes: 120,
            locationName: 'Place A',
            latitude: 48.85,
            longitude: 2.35,
            estimatedCost: 20,
            currency: 'USD',
            bookingRequired: false,
            orderIndex: 1
          },
          {
            title: 'Activity B',
            description: 'Starts before A ends at 11:30',
            category: 'cultural',
            startTime: '11:30',
            endTime: '13:00',
            durationMinutes: 90,
            locationName: 'Place B',
            latitude: 48.85,
            longitude: 2.35,
            estimatedCost: 30,
            currency: 'USD',
            bookingRequired: false,
            orderIndex: 2
          }
        ]
      }
    ];

    const report = ItineraryValidator.validate(days, 500, 50);
    expect(report.isValid).toBe(false);
    expect(report.errorCount).toBeGreaterThanOrEqual(1);
    expect(report.issues.some(i => i.category === 'time_overlap')).toBe(true);
  });

  it('flags warning for budget overruns', () => {
    const days: PlannedDay[] = [
      {
        dayNumber: 1,
        date: '2026-11-01',
        theme: 'Luxury Day',
        summary: 'Expensive day',
        dayEstimatedCost: 1200,
        activities: [
          {
            title: 'Helicopter Tour',
            description: 'Grand scenic flight',
            category: 'entertainment',
            startTime: '10:00',
            endTime: '12:00',
            durationMinutes: 120,
            locationName: 'Heliport',
            latitude: 48.83,
            longitude: 2.27,
            estimatedCost: 1200,
            currency: 'USD',
            bookingRequired: true,
            orderIndex: 1
          }
        ]
      }
    ];

    const report = ItineraryValidator.validate(days, 1000, 1200);
    expect(report.warningCount).toBeGreaterThan(0);
    expect(report.issues.some(i => i.category === 'budget_overrun')).toBe(true);
  });

  it('flags warning for overcrowded days (> 6 activities)', () => {
    const activities = Array.from({ length: 7 }, (_, i) => ({
      title: `Activity ${i + 1}`,
      description: `Description ${i + 1}`,
      category: 'sightseeing' as const,
      startTime: `${(8 + i * 2).toString().padStart(2, '0')}:00`,
      endTime: `${(9 + i * 2).toString().padStart(2, '0')}:30`,
      durationMinutes: 90,
      locationName: `Spot ${i + 1}`,
      latitude: 48.85,
      longitude: 2.35,
      estimatedCost: 10,
      currency: 'USD',
      bookingRequired: false,
      orderIndex: i + 1
    }));

    const days: PlannedDay[] = [
      {
        dayNumber: 1,
        date: '2026-11-01',
        theme: 'Packed Day',
        summary: 'Too many items',
        dayEstimatedCost: 70,
        activities
      }
    ];

    const report = ItineraryValidator.validate(days, 2000, 70);
    expect(report.issues.some(i => i.category === 'pacing')).toBe(true);
  });
});
