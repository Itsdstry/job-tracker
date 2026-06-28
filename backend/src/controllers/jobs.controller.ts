import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client';
import { sendSuccess } from '../utils/response';

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
