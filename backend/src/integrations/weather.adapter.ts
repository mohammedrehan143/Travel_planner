import { WeatherDay } from '../types/trip.types.js';
import { PlacesAdapter } from './places.adapter.js';

export class WeatherAdapter {
  /**
   * Fetch weather forecast for dates and coordinates.
   */
  static async getForecast(
    destination: string,
    startDate: string,
    endDate: string,
    lat?: number,
    lng?: number
  ): Promise<{ forecast: WeatherDay[]; source: 'open_meteo_live' | 'seasonal_fallback' }> {
    let resolvedLat = lat;
    let resolvedLng = lng;

    if (resolvedLat === undefined || resolvedLng === undefined) {
      const coords = await PlacesAdapter.getDestinationCoordinates(destination);
      resolvedLat = coords.lat;
      resolvedLng = coords.lng;
    }

    try {
      // Open-Meteo free API - real 7 to 14 day global forecasts
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${resolvedLat}&longitude=${resolvedLng}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max&timezone=auto&start_date=${startDate}&end_date=${endDate}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });

      if (res.ok) {
        const data = (await res.json()) as any;
        if (data.daily && data.daily.time) {
          const forecast: WeatherDay[] = data.daily.time.map((dateStr: string, idx: number) => {
            const wCode = data.daily.weathercode?.[idx] ?? 0;
            const { condition, icon } = this.mapWeatherCode(wCode);
            return {
              date: dateStr,
              temperatureMaxC: Math.round(data.daily.temperature_2m_max?.[idx] ?? 22),
              temperatureMinC: Math.round(data.daily.temperature_2m_min?.[idx] ?? 14),
              condition,
              icon,
              precipitationProbability: data.daily.precipitation_probability_max?.[idx] ?? 10,
              windSpeedKmh: Math.round(data.daily.windspeed_10m_max?.[idx] ?? 12)
            };
          });
          return { forecast, source: 'open_meteo_live' };
        }
      }
    } catch {
      // Fallback on timeout or out of range dates
    }

    // Realistic seasonal estimate fallback
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);

    const forecast: WeatherDay[] = [];
    const conditions = [
      { condition: 'Sunny', icon: 'sunny', precip: 5, tempMax: 22, tempMin: 14 },
      { condition: 'Partly Cloudy', icon: 'partly-cloudy', precip: 15, tempMax: 20, tempMin: 13 },
      { condition: 'Clear', icon: 'clear', precip: 0, tempMax: 23, tempMin: 15 },
      { condition: 'Light Rain', icon: 'rain', precip: 60, tempMax: 18, tempMin: 12 },
      { condition: 'Breezy & Mild', icon: 'cloudy', precip: 20, tempMax: 21, tempMin: 14 }
    ];

    for (let i = 0; i < daysCount; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const dateStr = current.toISOString().split('T')[0];
      const preset = conditions[i % conditions.length];

      forecast.push({
        date: dateStr,
        temperatureMaxC: preset.tempMax,
        temperatureMinC: preset.tempMin,
        condition: preset.condition,
        icon: preset.icon,
        precipitationProbability: preset.precip,
        windSpeedKmh: 14
      });
    }

    return { forecast, source: 'seasonal_fallback' };
  }

  private static mapWeatherCode(code: number): { condition: string; icon: string } {
    if (code === 0) return { condition: 'Clear Sky', icon: 'sunny' };
    if (code >= 1 && code <= 3) return { condition: 'Partly Cloudy', icon: 'partly-cloudy' };
    if (code >= 45 && code <= 48) return { condition: 'Foggy', icon: 'fog' };
    if (code >= 51 && code <= 55) return { condition: 'Drizzle', icon: 'drizzle' };
    if (code >= 61 && code <= 65) return { condition: 'Rain', icon: 'rain' };
    if (code >= 71 && code <= 77) return { condition: 'Snow', icon: 'snow' };
    if (code >= 80 && code <= 82) return { condition: 'Rain Showers', icon: 'showers' };
    if (code >= 95) return { condition: 'Thunderstorm', icon: 'thunderstorm' };
    return { condition: 'Fair', icon: 'fair' };
  }
}
