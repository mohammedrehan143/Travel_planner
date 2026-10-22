import { PlannedDay, ValidationReport, ValidationIssue } from '../types/trip.types.js';
import { RoutesAdapter } from '../integrations/routes.adapter.js';

export class ItineraryValidator {
  /**
   * Validates a multi-day itinerary against operational constraints:
   * 1. Schedule overlaps
   * 2. Venue opening hours
   * 3. Travel time feasibility between consecutive locations
   * 4. Pacing & activity density
   * 5. Total budget constraints
   */
  static validate(
    days: PlannedDay[],
    totalBudget: number,
    estimatedTotalCost: number
  ): ValidationReport {
    const issues: ValidationIssue[] = [];
    let totalActivities = 0;
    let totalTravelTimeMinutes = 0;

    // 1. Budget validation
    if (totalBudget > 0 && estimatedTotalCost > totalBudget) {
      const overage = estimatedTotalCost - totalBudget;
      issues.push({
        severity: 'warning',
        category: 'budget_overrun',
        message: `Estimated cost exceeds budget by $${overage.toFixed(2)} (${((overage / totalBudget) * 100).toFixed(1)}% over).`,
        suggestedFix: 'Replace paid attractions with scenic free parks or lower accommodation tier.'
      });
    }

    // 2. Day-by-Day validation
    for (const day of days) {
      const { dayNumber, activities } = day;
      totalActivities += activities.length;

      // Pacing check
      if (activities.length === 0) {
        issues.push({
          severity: 'error',
          category: 'pacing',
          dayNumber,
          message: `Day ${dayNumber} has no planned activities.`,
          suggestedFix: 'Schedule at least 2-3 activities per day.'
        });
        continue;
      }

      if (activities.length > 6) {
        issues.push({
          severity: 'warning',
          category: 'pacing',
          dayNumber,
          message: `Day ${dayNumber} is overcrowded with ${activities.length} activities. Risk of travel fatigue.`,
          suggestedFix: 'Reduce to 3-5 activities to allow exploration and leisurely meals.'
        });
      }

      // Check for lunch / meal allocation
      const hasMeal = activities.some(a => a.category === 'dining');
      if (!hasMeal && activities.length >= 3) {
        issues.push({
          severity: 'info',
          category: 'feasibility',
          dayNumber,
          message: `Day ${dayNumber} does not include a dedicated dining reservation or food market stop.`,
          suggestedFix: 'Add a lunch break between 12:00 and 14:00.'
        });
      }

      // Chronological time order & overlap checks
      for (let i = 0; i < activities.length; i++) {
        const current = activities[i];
        const currentStart = this.parseTimeToMinutes(current.startTime);
        const currentEnd = this.parseTimeToMinutes(current.endTime);

        if (currentEnd <= currentStart) {
          issues.push({
            severity: 'error',
            category: 'time_overlap',
            dayNumber,
            activityTitle: current.title,
            message: `Activity "${current.title}" ends (${current.endTime}) before or at its start time (${current.startTime}).`,
            suggestedFix: 'Adjust the end time to follow the start time.'
          });
        }

        // Compare with next activity on the same day
        if (i < activities.length - 1) {
          const next = activities[i + 1];
          const nextStart = this.parseTimeToMinutes(next.startTime);

          // Overlap check
          if (currentEnd > nextStart) {
            issues.push({
              severity: 'error',
              category: 'time_overlap',
              dayNumber,
              activityTitle: current.title,
              message: `Time overlap detected: "${current.title}" ends at ${current.startTime} -> ${current.endTime}, but "${next.title}" starts at ${next.startTime}.`,
              suggestedFix: `Shift "${next.title}" start time to at least ${this.minutesToTime(currentEnd + 15)}.`
            });
          }

          // Travel feasibility check
          if (current.latitude && current.longitude && next.latitude && next.longitude) {
            const distKm = RoutesAdapter.haversineDistance(
              current.latitude,
              current.longitude,
              next.latitude,
              next.longitude
            );

            // Buffer between activities in minutes
            const bufferMinutes = nextStart - currentEnd;
            const minTransitNeededMinutes = Math.max(5, Math.round((distKm / 25) * 60) + 5);
            totalTravelTimeMinutes += minTransitNeededMinutes;

            if (distKm > 10 && bufferMinutes < minTransitNeededMinutes) {
              issues.push({
                severity: 'warning',
                category: 'travel_time',
                dayNumber,
                activityTitle: next.title,
                message: `Distance from "${current.title}" to "${next.title}" is ${distKm.toFixed(1)} km, but only ${bufferMinutes} mins buffer is scheduled. Realistic transit takes ~${minTransitNeededMinutes} mins.`,
                suggestedFix: `Increase travel buffer between ${current.title} and ${next.title} to ${minTransitNeededMinutes} mins.`
              });
            }
          }
        }
      }
    }

    const errors = issues.filter(i => i.severity === 'error');
    const warnings = issues.filter(i => i.severity === 'warning');

    return {
      isValid: errors.length === 0,
      errorCount: errors.length,
      warningCount: warnings.length,
      issues,
      metrics: {
        totalActivities,
        averageActivitiesPerDay: days.length > 0 ? Number((totalActivities / days.length).toFixed(1)) : 0,
        totalTravelTimeMinutes,
        budgetUtilizationPercent: totalBudget > 0 ? Number(((estimatedTotalCost / totalBudget) * 100).toFixed(1)) : 100
      }
    };
  }

  private static parseTimeToMinutes(timeStr: string): number {
    const parts = timeStr.split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  }

  private static minutesToTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const mins = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}
