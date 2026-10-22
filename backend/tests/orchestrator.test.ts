import { describe, it, expect } from 'vitest';
import { AgentOrchestrator } from '../src/agent/orchestrator.js';
import { AgentRunService } from '../src/services/agentRun.service.js';

describe('Agent Orchestrator Full Planning Cycle Suite', () => {
  it('executes full 10-step planning workflow and tracks state', async () => {
    const result = await AgentOrchestrator.planTrip({
      origin: 'San Francisco, CA',
      destination: 'Tokyo, Japan',
      startDate: '2026-11-01',
      endDate: '2026-11-04',
      travelerCount: 2,
      travelStyle: 'balanced',
      interests: ['culinary', 'cultural'],
      budget: 3000,
      currency: 'USD',
      userId: '00000000-0000-0000-0000-000000000001'
    });

    expect(result).toBeDefined();
    expect(result.runId).toBeDefined();
    expect(result.itinerary).toBeDefined();
    expect(result.itinerary.days.length).toBe(4);
    expect(result.validation).toBeDefined();
    expect(result.validation.isValid).toBe(true);

    // Verify persistent agent run
    const run = await AgentRunService.getRun(result.runId);
    expect(run).toBeDefined();
    expect(run?.status).toBe('completed');
    expect(run?.progress_percent).toBe(100);
    expect(run?.logs.length).toBeGreaterThanOrEqual(6);
  });

  it('modifies an itinerary with natural language prompt', async () => {
    const plan = await AgentOrchestrator.planTrip({
      origin: 'New York, NY',
      destination: 'Paris, France',
      startDate: '2026-12-01',
      endDate: '2026-12-03',
      travelerCount: 1,
      travelStyle: 'cultural',
      interests: ['art'],
      budget: 1800,
      currency: 'EUR'
    });

    const modified = await AgentOrchestrator.modifyItinerary(plan.itinerary, {
      tripId: 'test-trip-id',
      instructions: 'Add authentic wine and cheese tasting dinner on Day 1',
      targetDay: 1
    });

    expect(modified.changeSummary).toBeDefined();
    expect(modified.modifiedItinerary.days[0].activities.some(a => a.category === 'dining')).toBe(true);
  });

  it('regenerates a specific day with custom pacing', async () => {
    const plan = await AgentOrchestrator.planTrip({
      origin: 'London, UK',
      destination: 'Tokyo, Japan',
      startDate: '2026-11-10',
      endDate: '2026-11-12',
      travelerCount: 1,
      travelStyle: 'adventure',
      interests: ['tech'],
      budget: 2000,
      currency: 'USD'
    });

    const regen = await AgentOrchestrator.regenerateDay(plan.itinerary, {
      tripId: 'test-trip-id',
      dayNumber: 2,
      customPacing: 'relaxed',
      specificInterests: ['parks', 'tea ceremony']
    });

    expect(regen.regeneratedDay.dayNumber).toBe(2);
    expect(regen.regeneratedDay.theme).toContain('Relaxed');
    expect(regen.regeneratedDay.activities.length).toBeLessThanOrEqual(3);
  });
});
