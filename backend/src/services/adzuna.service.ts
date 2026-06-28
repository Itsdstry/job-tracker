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

export const searchNearby = async (
  lat: number,
  lon: number,
  radiusKm: number,
  query: string,
  country = 'es',
): Promise<NearbyJob[]> => {
  if (!APP_ID || !APP_KEY) {
    throw { statusCode: 503, message: 'Adzuna API not configured' };
  }

  const params = new URLSearchParams({
    app_id: APP_ID,
    app_key: APP_KEY,
    results_per_page: '20',
    latitude: String(lat),
    longitude: String(lon),
    distance: String(radiusKm),
    sort_by: 'date',
  });
  if (query) params.set('what', query);

  const url = `${BASE}/${country}/search/1?${params}`;

  try {
    const { data } = await axios.get(url, { timeout: 15_000 });
    return (data.results ?? []).map((r: any): NearbyJob => ({
      id: r.id,
      title: r.title,
      company: r.company?.display_name ?? '',
      location: r.location?.display_name ?? '',
      url: r.redirect_url,
      salaryMin: r.salary_min ?? null,
      salaryMax: r.salary_max ?? null,
      created: r.created,
      category: r.category?.label ?? '',
    }));
  } catch (err: any) {
    const status = err.response?.status;
    const body = err.response?.data;
    logger.error({ message: err.message, status, body, lat, lon, radiusKm }, 'Adzuna API error');
    throw { statusCode: 502, message: 'Failed to fetch jobs from Adzuna' };
  }
};
