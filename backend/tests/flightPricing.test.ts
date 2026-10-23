import { describe, it, expect } from 'vitest';
import {
  getAccurateFlightEstimate,
  isIntraCity,
  isInternational,
  convertFromUSD,
  convertFromINR
} from '../src/agent/flightPricing.js';

describe('Accurate Flight Pricing Engine Suite', () => {
  describe('Intra-City & Local Outings Detection', () => {
    it('correctly identifies same-city travel and assigns zero flight cost', () => {
      const estimates = [
        getAccurateFlightEstimate('Bangalore', 'Bangalore', 'INR'),
        getAccurateFlightEstimate('Bengaluru', 'Bengaluru, Karnataka', 'INR'),
        getAccurateFlightEstimate('Tokyo', 'Tokyo, Japan', 'USD'),
        getAccurateFlightEstimate('Paris', 'Paris, France', 'EUR'),
        getAccurateFlightEstimate('Riyadh', 'Riyadh, Saudi Arabia', 'SAR')
      ];

      estimates.forEach(est => {
        expect(est.cost).toBe(0);
        expect(est.isIntraCity).toBe(true);
        expect(est.isInternational).toBe(false);
        expect(est.airlines).toContain('No Flight Needed');
      });
    });
  });

  describe('Domestic Airfare Benchmarks', () => {
    it('estimates realistic domestic airfare for India routes', () => {
      const goaTrip = getAccurateFlightEstimate('Bengaluru', 'Goa', 'INR');
      expect(goaTrip.cost).toBeGreaterThanOrEqual(5000);
      expect(goaTrip.cost).toBeLessThanOrEqual(8000);
      expect(goaTrip.isInternational).toBe(false);
      expect(goaTrip.airlines).toContain('IndiGo');

      const delhiTrip = getAccurateFlightEstimate('Mumbai', 'New Delhi', 'INR');
      expect(delhiTrip.cost).toBeGreaterThanOrEqual(5000);
      expect(delhiTrip.cost).toBeLessThanOrEqual(8000);
      expect(delhiTrip.isInternational).toBe(false);
    });

    it('estimates realistic domestic airfare for US routes in USD', () => {
      const nyToSf = getAccurateFlightEstimate('New York, NY', 'San Francisco, CA', 'USD');
      expect(nyToSf.cost).toBeGreaterThanOrEqual(250);
      expect(nyToSf.cost).toBeLessThanOrEqual(450);
      expect(nyToSf.isInternational).toBe(false);
    });
  });

  describe('International Flight Fare Accuracy from India (INR)', () => {
    it('estimates accurate market rate for Dubai / UAE (~₹24,000 INR)', () => {
      const res = getAccurateFlightEstimate('Bengaluru', 'Dubai, UAE', 'INR');
      expect(res.isInternational).toBe(true);
      expect(res.cost).toBe(24000);
      expect(res.airlines).toContain('Emirates');
      expect(res.description).toContain('DXB/AUH');
    });

    it('estimates accurate market rate for Saudi Arabia (~₹32,000 INR)', () => {
      const res = getAccurateFlightEstimate('Bengaluru', 'Riyadh, Saudi Arabia', 'INR');
      expect(res.isInternational).toBe(true);
      expect(res.cost).toBe(32000);
      expect(res.airlines).toContain('Saudia');
      expect(res.description).toContain('RUH/JED');
    });

    it('estimates accurate market rate for Thailand (~₹18,500 INR)', () => {
      const res = getAccurateFlightEstimate('Delhi', 'Bangkok, Thailand', 'INR');
      expect(res.isInternational).toBe(true);
      expect(res.cost).toBe(18500);
      expect(res.airlines).toContain('Thai Airways');
    });

    it('estimates accurate market rate for Singapore (~₹21,000 INR)', () => {
      const res = getAccurateFlightEstimate('Bengaluru', 'Singapore', 'INR');
      expect(res.isInternational).toBe(true);
      expect(res.cost).toBe(21000);
      expect(res.airlines).toContain('Singapore Airlines');
    });

    it('estimates accurate market rate for Bali (~₹36,000 INR)', () => {
      const res = getAccurateFlightEstimate('Mumbai', 'Bali, Indonesia', 'INR');
      expect(res.isInternational).toBe(true);
      expect(res.cost).toBe(36000);
      expect(res.airlines).toContain('Batik Air');
    });

    it('estimates accurate market rate for France / Paris (~₹62,000 INR)', () => {
      const res = getAccurateFlightEstimate('Bengaluru', 'Paris, France', 'INR');
      expect(res.isInternational).toBe(true);
      expect(res.cost).toBe(62000);
      expect(res.airlines).toContain('Air France');
    });

    it('estimates accurate market rate for United Kingdom / London (~₹65,000 INR)', () => {
      const res = getAccurateFlightEstimate('Bengaluru', 'London, United Kingdom', 'INR');
      expect(res.isInternational).toBe(true);
      expect(res.cost).toBe(65000);
      expect(res.airlines).toContain('British Airways');
    });

    it('estimates accurate market rate for Japan / Tokyo (~₹55,000 INR)', () => {
      const res = getAccurateFlightEstimate('Bengaluru', 'Tokyo, Japan', 'INR');
      expect(res.isInternational).toBe(true);
      expect(res.cost).toBe(55000);
      expect(res.airlines).toContain('All Nippon Airways');
    });

    it('estimates accurate market rate for United States / New York (~₹88,000 INR)', () => {
      const res = getAccurateFlightEstimate('Bengaluru', 'New York, USA', 'INR');
      expect(res.isInternational).toBe(true);
      expect(res.cost).toBe(88000);
      expect(res.airlines).toContain('Air India');
    });

    it('estimates accurate market rate for Australia / Sydney (~₹72,000 INR)', () => {
      const res = getAccurateFlightEstimate('Bengaluru', 'Sydney, Australia', 'INR');
      expect(res.isInternational).toBe(true);
      expect(res.cost).toBe(72000);
      expect(res.airlines).toContain('Qantas');
    });
  });

  describe('Global Cross-Border Routes & Multi-Currency Handling', () => {
    it('estimates realistic SFO to Tokyo fare in USD ($920)', () => {
      const res = getAccurateFlightEstimate('San Francisco, CA', 'Tokyo, Japan', 'USD');
      expect(res.isInternational).toBe(true);
      expect(res.cost).toBe(920);
      expect(res.currency).toBe('USD');
      expect(res.airlines).toContain('ANA');
    });

    it('estimates realistic New York to Paris fare in EUR (€690)', () => {
      const res = getAccurateFlightEstimate('New York, NY', 'Paris, France', 'EUR');
      expect(res.isInternational).toBe(true);
      expect(res.cost).toBeGreaterThanOrEqual(600);
      expect(res.cost).toBeLessThanOrEqual(800);
      expect(res.currency).toBe('EUR');
      expect(res.airlines).toContain('Air France');
    });

    it('estimates realistic London to Switzerland fare in CHF (CHF 160)', () => {
      const res = getAccurateFlightEstimate('London, UK', 'Zermatt & Lucerne, Switzerland', 'CHF');
      expect(res.isInternational).toBe(true);
      expect(res.cost).toBeGreaterThanOrEqual(130);
      expect(res.cost).toBeLessThanOrEqual(250);
      expect(res.currency).toBe('CHF');
      expect(res.airlines).toContain('SWISS');
    });
  });

  describe('Legacy Erroneous Data Detection & Auto-Correction', () => {
    it('detects and corrects the false ₹5,800 domestic fallback on international trips', () => {
      const falseLegacyEstimate = {
        cost: 5800,
        currency: 'INR',
        airlines: 'IndiGo / Air India / Domestic Carrier',
        description: 'Estimated domestic intercity round-trip airfare per person'
      };

      const correctedDubai = getAccurateFlightEstimate(
        'Bengaluru',
        'Dubai, UAE',
        'INR',
        falseLegacyEstimate
      );
      expect(correctedDubai.cost).toBe(24000); // Corrected from 5800!
      expect(correctedDubai.airlines).toContain('Emirates');

      const correctedParis = getAccurateFlightEstimate(
        'Bengaluru',
        'Paris, France',
        'INR',
        falseLegacyEstimate
      );
      expect(correctedParis.cost).toBe(62000); // Corrected from 5800!
      expect(correctedParis.airlines).toContain('Air France');
    });

    it('detects and corrects false $5,800 USD on international trips', () => {
      const bogusUSDEstimate = {
        cost: 5800,
        currency: 'USD',
        airlines: 'IndiGo / Air India / Domestic Carrier',
        description: 'Estimated domestic intercity round-trip airfare per person'
      };

      const correctedTokyo = getAccurateFlightEstimate(
        'San Francisco, CA',
        'Tokyo, Japan',
        'USD',
        bogusUSDEstimate
      );
      expect(correctedTokyo.cost).toBe(920); // Corrected from astronomical $5,800!
    });
  });
});
