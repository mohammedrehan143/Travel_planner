import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('TripPilot Backend REST API Suite', () => {
  it('GET /health returns 200 and healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('TripPilot AI Backend');
  });

  it('POST /api/trips/plan creates a synchronous planned trip', async () => {
    const res = await request(app)
      .post('/api/trips/plan')
      .send({
        origin: 'Seattle, WA',
        destination: 'Tokyo, Japan',
        startDate: '2026-11-01',
        endDate: '2026-11-03',
        travelerCount: 2,
        budget: 2800,
        currency: 'USD',
        travelStyle: 'balanced',
        interests: ['food', 'temples'],
        asyncExecution: false
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('completed');
    expect(res.body.runId).toBeDefined();
    expect(res.body.itinerary).toBeDefined();
    expect(res.body.itinerary.days.length).toBe(3);
    expect(res.body.validation).toBeDefined();
  });

  it('POST /api/trips/plan returns 400 when endDate is before startDate', async () => {
    const res = await request(app)
      .post('/api/trips/plan')
      .send({
        origin: 'Seattle, WA',
        destination: 'Tokyo, Japan',
        startDate: '2026-11-05',
        endDate: '2026-11-01',
        travelerCount: 1
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
  });

  it('POST /api/trips/plan supports async execution with 202 Accepted', async () => {
    const res = await request(app)
      .post('/api/trips/plan')
      .send({
        origin: 'New York, NY',
        destination: 'Paris, France',
        startDate: '2026-12-10',
        endDate: '2026-12-13',
        travelerCount: 1,
        budget: 1500,
        asyncExecution: true
      });

    expect(res.status).toBe(202);
    expect(res.body.status).toBe('accepted');
    expect(res.body.runId).toBeDefined();
    expect(res.body.checkStatusUrl).toBeDefined();

    // Poll the status endpoint
    const statusRes = await request(app).get(`/api/agent-runs/${res.body.runId}`);
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.runId).toBe(res.body.runId);
  });

  it('GET /api/trips lists user trips', async () => {
    const res = await request(app).get('/api/trips');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.trips)).toBe(true);
  });

  it('GET /api/trips/:id fetches full trip details', async () => {
    const res = await request(app).get('/api/trips/11111111-1111-1111-1111-111111111111');
    expect(res.status).toBe(200);
    expect(res.body.trip).toBeDefined();
    expect(res.body.trip.title).toContain('Tokyo');
    expect(res.body.trip.days.length).toBeGreaterThan(0);
  });

  it('POST /api/trips/:id/modify applies natural language edits', async () => {
    const res = await request(app)
      .post('/api/trips/11111111-1111-1111-1111-111111111111/modify')
      .send({
        instructions: 'Add a local ramen dinner on Day 1 evening',
        targetDay: 1
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.changeSummary).toBeDefined();
  });

  it('POST /api/trips/:id/days/:dayNumber/regenerate refreshes day schedule', async () => {
    const res = await request(app)
      .post('/api/trips/11111111-1111-1111-1111-111111111111/days/1/regenerate')
      .send({
        customPacing: 'relaxed',
        specificInterests: ['parks', 'tea houses']
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.regeneratedDay).toBeDefined();
    expect(res.body.day).toBeDefined();
  });

  it('POST /api/trips/:id/regenerate-day supports frontend legacy alias', async () => {
    const res = await request(app)
      .post('/api/trips/11111111-1111-1111-1111-111111111111/regenerate-day')
      .send({
        dayNumber: 1,
        focus: 'Alternative local highlights and dining'
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.day).toBeDefined();
  });

  it('POST /api/trips/:id/validate revalidates an existing trip', async () => {
    const res = await request(app)
      .post('/api/trips/11111111-1111-1111-1111-111111111111/validate')
      .send();

    expect(res.status).toBe(200);
    expect(res.body.validation).toBeDefined();
    expect(res.body.validation.metrics).toBeDefined();
  });

  it('GET /api/integrations/places/search returns places', async () => {
    const res = await request(app)
      .get('/api/integrations/places/search')
      .query({ destination: 'Tokyo, Japan', query: 'shrine' });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.places)).toBe(true);
    expect(res.body.places.length).toBeGreaterThan(0);
  });

  it('GET /api/integrations/places/search with category returns >= 10 places and Google Maps links', async () => {
    const res = await request(app)
      .get('/api/integrations/places/search')
      .query({ destination: 'Goa, India', category: 'beaches', limit: 14 });

    expect(res.status).toBe(200);
    expect(res.body.places.length).toBeGreaterThanOrEqual(10);
    expect(res.body.places[0].googleMapsUrl).toBeDefined();
    expect(res.body.places[0].googleMapsUrl).toContain('google.com/maps');
    expect(res.body.categories).toBeDefined();
    expect(res.body.categories[0].count).toBeGreaterThanOrEqual(10);
  });

  it('GET /api/integrations/places/search with multiple categories returns separate lists of 10+ places', async () => {
    const res = await request(app)
      .get('/api/integrations/places/search')
      .query({
        destination: 'Goa, India',
        categories: 'beaches,restaurants,historical_places',
        limit: 12
      });

    expect(res.status).toBe(200);
    expect(res.body.categories).toBeDefined();
    expect(res.body.categories.length).toBe(3);
    for (const cat of res.body.categories) {
      expect(cat.count).toBeGreaterThanOrEqual(10);
      expect(cat.places.length).toBeGreaterThanOrEqual(10);
    }
    expect(res.body.totalPlaces).toBeGreaterThanOrEqual(30);
  });

  it('GET /api/integrations/weather returns weather forecast', async () => {
    const res = await request(app)
      .get('/api/integrations/weather')
      .query({
        destination: 'Tokyo, Japan',
        startDate: '2026-11-01',
        endDate: '2026-11-03'
      });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.forecast)).toBe(true);
  });

  it('POST /api/integrations/routes/calculate computes distance and duration', async () => {
    const res = await request(app)
      .post('/api/integrations/routes/calculate')
      .send({
        origin: 'Tokyo Station',
        destination: 'Shibuya Crossing',
        transportMode: 'transit',
        originCoords: { lat: 35.6812, lng: 139.7671 },
        destinationCoords: { lat: 35.6595, lng: 139.7005 }
      });

    expect(res.status).toBe(200);
    expect(res.body.distanceKm).toBeGreaterThan(0);
    expect(res.body.durationMinutes).toBeGreaterThan(0);
  });

  it('POST /api/agent/chat provides dynamic AI conversational advice', async () => {
    const res = await request(app)
      .post('/api/agent/chat')
      .send({
        message: 'What are the top local specialities and vegetarian spots?',
        context: { destination: 'Bangalore', currency: 'INR' }
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBeDefined();
    expect(typeof res.body.message).toBe('string');
  });

  it('POST /api/agent/chat plans and generates a new trip when requested', async () => {
    const res = await request(app)
      .post('/api/agent/chat')
      .send({
        message: 'Plan a 3-day trip to Goa with friends',
        context: { currency: 'INR' }
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.action).toBe('plan_new_trip');
    expect(res.body.createdTrip).toBeDefined();
    expect(res.body.createdTrip.destination).toBe('Goa');
    expect(res.body.createdTrip.days.length).toBeGreaterThan(0);
  });
});
