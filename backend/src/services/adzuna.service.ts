import axios from 'axios';
import logger from '../utils/logger';

const APP_ID = process.env.ADZUNA_APP_ID;
const APP_KEY = process.env.ADZUNA_APP_KEY;
const BASE = 'https://api.adzuna.com/v1/api/jobs';

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

// Adzuna free plan does not support lat/lon geo search (returns 400).
// We reverse-geocode to a city name using Nominatim (OpenStreetMap, free, no key required)
// and use Adzuna's text-based `where` parameter instead.
const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
  try {
    const { data } = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: { lat, lon, format: 'json', zoom: 10 },
      headers: { 'User-Agent': 'job-tracker-pro/1.0' },
      timeout: 8_000,
    });
    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.county ||
      data.address?.state ||
      'Madrid'
    );
  } catch (err: any) {
    logger.warn({ lat, lon, err: err.message }, 'Reverse geocode failed, falling back to Madrid');
    return 'Madrid';
  }
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

export const searchNearby = async (
  lat: number,
  lon: number,
  radiusKm: number,
  query: string,
): Promise<NearbyJob[]> => {
  if (!APP_ID || !APP_KEY) {
    throw { statusCode: 503, message: 'Adzuna API not configured' };
  }

  const city = await reverseGeocode(lat, lon);
  logger.info({ lat, lon, city, radiusKm, query }, 'Adzuna search');

  const params = new URLSearchParams({
    app_id: APP_ID,
    app_key: APP_KEY,
    results_per_page: '20',
    where: city,
    distance: String(radiusKm),
  });
  if (query) params.set('what', query);

  // Try es first (Spain), then gb and us as fallback
  const countries = ['es', 'gb', 'us'];

  for (const country of countries) {
    try {
      const url = `${BASE}/${country}/search/1?${params}`;
      const { data } = await axios.get(url, { timeout: 15_000 });
      const results = (data.results ?? []).map(mapResult);
      logger.info({ country, city, count: results.length }, 'Adzuna results');
      return results;
    } catch (err: any) {
      const status = err.response?.status;
      logger.warn({ country, status, message: err.message }, 'Adzuna country attempt failed');
      if (status && status >= 400 && status < 500) continue;
      throw { statusCode: 502, message: 'Failed to fetch jobs from Adzuna' };
    }
  }

  throw { statusCode: 502, message: 'Failed to fetch jobs from Adzuna' };
};
