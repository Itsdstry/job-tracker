import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { searchNearby } from '../services/adzuna.service';
import { prisma } from '../prisma/client';
import { sendSuccess, sendError } from '../utils/response';

export const getCachedJobs = async (req: Request, res: Response): Promise<void> => {
  const q = ((req.query.q as string) || '').trim();
  const category = (req.query.category as string) || '';
  const region = (req.query.region as string) || '';

  const where: Prisma.RemotiveCacheWhereInput = {};

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { company: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (category) where.category = { contains: category, mode: 'insensitive' };
  if (region) where.location = { contains: region, mode: 'insensitive' };

  const jobs = await prisma.remotiveCache.findMany({
    where,
    orderBy: { publishedAt: 'desc' },
    take: 50,
    select: {
      remotiveId: true,
      title: true,
      company: true,
      category: true,
      jobType: true,
      location: true,
      salary: true,
      url: true,
      publishedAt: true,
    },
  });

  sendSuccess(res, jobs);
};

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
