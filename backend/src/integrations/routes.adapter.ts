import { RouteLeg } from '../types/trip.types.js';

export class RoutesAdapter {
  /**
   * Calculate distance and travel time between two coordinates or location names.
   */
  static async calculateRoute(
    origin: string,
    destination: string,
    transportMode: 'walking' | 'driving' | 'transit' | 'cycling' = 'transit',
    originCoords?: { lat: number; lng: number },
    destCoords?: { lat: number; lng: number }
  ): Promise<RouteLeg & { source: 'osrm_live' | 'geodesic_estimation' }> {
    if (originCoords && destCoords) {
      // Try live OSRM public API for driving/walking
      try {
        const profile = transportMode === 'walking' ? 'foot' : transportMode === 'cycling' ? 'bicycle' : 'car';
        const url = `https://router.project-osrm.org/route/v1/${profile}/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}?overview=false`;
        const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          const data = (await res.json()) as any;
          if (data.routes && data.routes.length > 0) {
            const osrmRoute = data.routes[0];
            const distanceKm = Number((osrmRoute.distance / 1000).toFixed(2));
            const durationMinutes = Math.max(5, Math.round(osrmRoute.duration / 60));

            return {
              fromLocation: origin,
              toLocation: destination,
              distanceKm,
              durationMinutes,
              transportMode,
              source: 'osrm_live'
            };
          }
        }
      } catch {
        // Fall back to geodesic estimation
      }

      // Geodesic (Haversine) calculation
      const distKm = this.haversineDistance(
        originCoords.lat,
        originCoords.lng,
        destCoords.lat,
        destCoords.lng
      );
      const durationMin = this.estimateDurationMinutes(distKm, transportMode);

      return {
        fromLocation: origin,
        toLocation: destination,
        distanceKm: Number(distKm.toFixed(2)),
        durationMinutes: durationMin,
        transportMode,
        source: 'geodesic_estimation'
      };
    }

    // Default intra-city buffer if coordinates omitted
    return {
      fromLocation: origin,
      toLocation: destination,
      distanceKm: 3.5,
      durationMinutes: transportMode === 'walking' ? 45 : 20,
      transportMode,
      source: 'geodesic_estimation'
    };
  }

  /**
   * Haversine formula for great circle distance in kilometers.
   */
  static haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private static estimateDurationMinutes(
    distKm: number,
    mode: 'walking' | 'driving' | 'transit' | 'cycling'
  ): number {
    switch (mode) {
      case 'walking':
        return Math.max(5, Math.round((distKm / 4.5) * 60));
      case 'cycling':
        return Math.max(5, Math.round((distKm / 15) * 60));
      case 'driving':
        return Math.max(8, Math.round((distKm / 35) * 60) + 5); // +5 min traffic/parking
      case 'transit':
      default:
        return Math.max(12, Math.round((distKm / 25) * 60) + 7); // +7 min transfer/wait
    }
  }
}
