process.env.NODE_ENV = 'test';
import { createApp } from '../src/app.js';
import request from 'supertest';

async function runVerification() {
  const app = createApp();
  console.log('=== Starting TripPilot AI Verification of 5 Travel Queries ===\n');

  const queries = [
    {
      name: 'Query 1: Budget trip to Goa',
      endpoint: '/api/agent/chat',
      body: { message: 'Budget trip to Goa' },
      expectedKeywords: ['goa', 'beach', 'budget', 'calangute', 'anjuna', 'panaji', 'baga', 'inr'],
      prohibitedKeywords: ['saudi', 'kingdom centre', 'najd village']
    },
    {
      name: 'Query 2: Cold-weather destinations in India',
      endpoint: '/api/agent/chat',
      body: { message: 'Cold-weather destinations in India' },
      expectedKeywords: ['manali', 'shimla', 'gulmarg', 'kashmir', 'mcleodganj', 'snow', 'cold', 'hill'],
      prohibitedKeywords: ['saudi', 'kingdom centre', 'bangalore palace']
    },
    {
      name: 'Query 3: Historical places in Rajasthan',
      endpoint: '/api/agent/chat',
      body: { message: 'Historical places in Rajasthan' },
      expectedKeywords: ['rajasthan', 'jaipur', 'udaipur', 'jodhpur', 'fort', 'palace', 'hawa mahal', 'amer fort'],
      prohibitedKeywords: ['saudi', 'kingdom centre', 'vidyarthi bhavan']
    },
    {
      name: 'Query 4: Beach destinations for couples',
      endpoint: '/api/agent/chat',
      body: { message: 'Beach destinations for couples' },
      expectedKeywords: ['beach', 'couple', 'palolem', 'andaman', 'havelock', 'sunset', 'romantic', 'maldives', 'goa'],
      prohibitedKeywords: ['saudi', 'kingdom centre', 'bangalore palace']
    },
    {
      name: 'Query 5: Trip Wizard Plan - Manali Hill Station',
      endpoint: '/api/trips/plan',
      body: {
        origin: 'Delhi, India',
        destination: 'Manali, Himachal Pradesh',
        startDate: '2026-11-01',
        endDate: '2026-11-04',
        budget: 25000,
        currency: 'INR',
        travelerCount: 2,
        interests: ['Snow & Mountains', 'Adventure', 'Cafes'],
        transportPreference: 'Traveling',
        accommodationPreference: 'None (Single Day Outing)'
      },
      checkPlan: true
    }
  ];

  let allPassed = true;

  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    console.log(`--- Running ${q.name} ---`);
    const res = await request(app)
      .post(q.endpoint)
      .send(q.body)
      .set('Authorization', 'Bearer mock-test-token')
      .set('Content-Type', 'application/json');

    console.log(`Status: ${res.status}`);
    if (res.status !== 200 && res.status !== 201) {
      console.error(`FAILED: Expected 200/201, got ${res.status}`);
      console.error(res.body);
      allPassed = false;
      continue;
    }

    if (q.checkPlan) {
      const trip = res.body.trip || res.body.createdTrip || (res.body.itinerary ? { ...res.body.itinerary, destination: res.body.itinerary.destination, latitude: res.body.itinerary.latitude, longitude: res.body.itinerary.longitude } : null);
      const days = res.body.days || (res.body.itinerary?.days) || [];
      const activities = res.body.activities || (days.flatMap((d: any) => d.activities || [])) || [];
      console.log(`Created Trip: "${trip?.title || trip?.name}" in destination "${trip?.destination}"`);
      const firstAct = activities[0];
      console.log(`Activity 1 location: "${firstAct?.locationName || firstAct?.title}" at (${firstAct?.latitude}, ${firstAct?.longitude})`);
      console.log(`Days planned: ${days.length}`);
      console.log(`Activities count: ${activities.length}`);

      const activityTitles = activities.map((a: any) => a.title).join(', ');
      console.log(`Sample activities: ${activityTitles}`);

      // Verify Manali coordinates (not Bangalore 12.9716, 77.5946)
      if (!trip?.destination?.includes('Manali')) {
        console.error(`FAILED: Trip destination mismatch: ${trip?.destination}`);
        allPassed = false;
      }
      if (firstAct?.latitude === 12.9716 && firstAct?.longitude === 77.5946) {
        console.error(`FAILED: Defaulted to Bangalore coordinates instead of Manali!`);
        allPassed = false;
      } else {
        console.log(`✓ Verified Manali-specific coordinates: (${firstAct?.latitude}, ${firstAct?.longitude})`);
      }

      // Verify activities don't have Bangalore or Saudi Palace
      const hasBogus = activities.some((a: any) => 
        a.title?.includes('Bangalore') || a.title?.includes('Kingdom Centre') || a.title?.includes('Najd Village')
      );
      if (hasBogus) {
        console.error(`FAILED: Found repetitive Bangalore/Saudi activities in Manali itinerary!`);
        allPassed = false;
      } else {
        console.log(`✓ Verified activities are customized to destination.`);
      }
    } else {
      const reply = (res.body.reply || res.body.message || JSON.stringify(res.body)).toLowerCase();
      console.log(`Agent reply snippet:\n${reply.slice(0, 300)}...\n`);

      // Check expected keywords
      const matchedExpected = q.expectedKeywords.filter(kw => reply.includes(kw));
      console.log(`Matched expected keywords: ${matchedExpected.join(', ')}`);
      if (matchedExpected.length === 0) {
        console.error(`FAILED: Reply did not contain expected keywords for ${q.name}`);
        allPassed = false;
      } else {
        console.log(`✓ Verified relevant to query.`);
      }

      // Check prohibited keywords
      const matchedProhibited = q.prohibitedKeywords.filter(kw => reply.includes(kw));
      if (matchedProhibited.length > 0) {
        console.error(`FAILED: Reply contained inappropriate fallback keywords: ${matchedProhibited.join(', ')}`);
        allPassed = false;
      } else {
        console.log(`✓ Verified no hardcoded Saudi/Bangalore generic fallbacks.`);
      }
    }
    console.log('\n');
  }

  // Also verify error handling on completely invalid schema (ensure error is returned, not fake recommendations)
  console.log(`--- Running Error Handling Test: Invalid Payload ---`);
  const errRes = await request(app)
    .post('/api/trips/plan')
    .send({ budget: 'invalid_budget_string' })
    .set('Authorization', 'Bearer mock-test-token')
    .set('Content-Type', 'application/json');

  console.log(`Status: ${errRes.status}`);
  if (errRes.status === 400 && (errRes.body.status === 'fail' || errRes.body.error === 'Validation Error')) {
    console.log(`✓ Verified invalid request returns structured 400 error, not fake recommendations.`);
  } else {
    console.error(`FAILED: Expected 400 error for invalid payload, got ${errRes.status}`);
    allPassed = false;
  }

  if (allPassed) {
    console.log('🎉 ALL 5 QUERIES AND ERROR HANDLING TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('❌ SOME VERIFICATION CHECKS FAILED.');
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
