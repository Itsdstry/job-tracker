import axios from 'axios';
import logger from '../utils/logger';

const APP_ID = process.env.ADZUNA_APP_ID;
const APP_KEY = process.env.ADZUNA_APP_KEY;
const BASE = 'https://api.adzuna.com/v1/api/jobs';

// Countries tried in order when geo search fails on the primary country
const FALLBACK_COUNTRIES = ['gb', 'us'];

export interface NearbyJob {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  salaryMin: number | null;
  salaryMax: number | null;
  created: string;
  category: string;
}

const buildParams = (lat: number, lon: number, radiusKm: number, query: string) => {
  const p = new URLSearchParams({
    app_id: APP_ID!,
    app_key: APP_KEY!,
    results_per_page: '20',
    latitude: String(lat),
    longitude: String(lon),
    distance: String(radiusKm),
  });
  // Always include a keyword — some country endpoints reject empty geo searches
  p.set('what', query || 'developer engineer designer manager');
  return p;
};

const mapResult = (r: any): NearbyJob => ({
  id: r.id,
  title: r.title,
  company: r.company?.display_name ?? '',
  location: r.location?.display_name ?? '',
  url: r.redirect_url,
  salaryMin: r.salary_min ?? null,
  salaryMax: r.salary_max ?? null,
  created: r.created,
  category: r.category?.label ?? '',
});

const tryCountry = async (
  country: string,
  lat: number,
  lon: number,
  radiusKm: number,
  query: string,
): Promise<NearbyJob[] | null> => {
  const url = `${BASE}/${country}/search/1?${buildParams(lat, lon, radiusKm, query)}`;
  try {
    const { data } = await axios.get(url, { timeout: 15_000 });
    return (data.results ?? []).map(mapResult);
  } catch (err: any) {
    const status = err.response?.status;
    logger.warn({ country, status, message: err.message }, 'Adzuna country attempt failed');
    // Only retry on client errors (4xx) — 5xx or timeout should propagate
    if (status && status >= 400 && status < 500) return null;
    throw err;
  }
};

export const searchNearby = async (
  lat: number,
  lon: number,
  radiusKm: number,
  query: string,
  primaryCountry = 'es',
): Promise<NearbyJob[]> => {
  if (!APP_ID || !APP_KEY) {
    throw { statusCode: 503, message: 'Adzuna API not configured' };
  }

  const countries = [primaryCountry, ...FALLBACK_COUNTRIES.filter((c) => c !== primaryCountry)];

  for (const country of countries) {
    try {
      const results = await tryCountry(country, lat, lon, radiusKm, query);
      if (results !== null) {
        if (country !== primaryCountry) {
          logger.info({ country, count: results.length }, 'Adzuna fallback country succeeded');
        }
        return results;
      }
    } catch (err: any) {
      logger.error({ country, message: err.message }, 'Adzuna non-retryable error');
      throw { statusCode: 502, message: 'Failed to fetch jobs from Adzuna' };
    }
  }

  logger.error({ countries, lat, lon }, 'All Adzuna country endpoints failed');
  throw { statusCode: 502, message: 'Failed to fetch jobs from Adzuna' };
};
