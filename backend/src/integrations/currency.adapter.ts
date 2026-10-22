/**
 * Currency Conversion Adapter
 * Connects to live Frankfurter ECB API (no auth required) with offline fallback.
 */

interface CurrencyRates {
  [currency: string]: number;
}

const FALLBACK_RATES: CurrencyRates = {
  USD: 1.0,
  EUR: 0.92,
  JPY: 154.5,
  GBP: 0.79,
  CAD: 1.38,
  AUD: 1.52,
  CHF: 0.88,
  SGD: 1.34,
  INR: 83.5
};

export class CurrencyAdapter {
  private static cachedRates: { [base: string]: { timestamp: number; rates: CurrencyRates } } = {};
  private static CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

  /**
   * Fetch current exchange rates for a base currency.
   */
  static async getRates(base = 'USD'): Promise<{ rates: CurrencyRates; source: 'live_api' | 'fallback_cache' }> {
    const baseUpper = base.toUpperCase();
    const cached = this.cachedRates[baseUpper];

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return { rates: cached.rates, source: 'fallback_cache' };
    }

    try {
      const response = await fetch(`https://api.frankfurter.app/latest?from=${baseUpper}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(4000)
      });

      if (response.ok) {
        const data = await response.json() as { rates: CurrencyRates };
        const combinedRates = { ...data.rates, [baseUpper]: 1.0 };
        this.cachedRates[baseUpper] = { timestamp: Date.now(), rates: combinedRates };
        return { rates: combinedRates, source: 'live_api' };
      }
    } catch {
      // Graceful fallback on network timeout or offline
    }

    // Build fallback rates relative to base
    const baseRateInUSD = FALLBACK_RATES[baseUpper] || 1.0;
    const computedRates: CurrencyRates = {};
    for (const [curr, rateInUSD] of Object.entries(FALLBACK_RATES)) {
      computedRates[curr] = Number((rateInUSD / baseRateInUSD).toFixed(4));
    }

    return { rates: computedRates, source: 'fallback_cache' };
  }

  /**
   * Convert an amount between currencies.
   */
  static async convert(amount: number, from: string, to: string): Promise<{ convertedAmount: number; rate: number; source: string }> {
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();

    if (fromUpper === toUpper) {
      return { convertedAmount: amount, rate: 1.0, source: 'identical_currency' };
    }

    const { rates, source } = await this.getRates(fromUpper);
    const targetRate = rates[toUpper] || (FALLBACK_RATES[toUpper] ? FALLBACK_RATES[toUpper] / (FALLBACK_RATES[fromUpper] || 1) : 1);
    const converted = Number((amount * targetRate).toFixed(2));

    return {
      convertedAmount: converted,
      rate: targetRate,
      source
    };
  }
}
