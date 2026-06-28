import { Request, Response } from 'express';
import { searchNearby } from '../services/adzuna.service';
import { sendSuccess, sendError } from '../utils/response';

export const getNearbyJobs = async (req: Request, res: Response): Promise<void> => {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);
  const radius = parseInt(req.query.radius as string) || 25;
  const q = (req.query.q as string) || '';

  if (isNaN(lat) || isNaN(lon)) {
    sendError(res, 'lat and lon are required numeric parameters', 400);
    return;
  }

  if (![1, 5, 25, 50].includes(radius)) {
    sendError(res, 'radius must be 1, 5, 25 or 50', 400);
    return;
  }

  try {
    const jobs = await searchNearby(lat, lon, radius, q);
    sendSuccess(res, jobs);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch nearby jobs', err.statusCode || 500);
  }
};
