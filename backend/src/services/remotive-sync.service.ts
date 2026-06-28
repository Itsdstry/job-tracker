import cron from 'node-cron';
import { prisma } from '../prisma/client';
import logger from '../utils/logger';

const REMOTIVE_URL = 'https://remotive.com/api/remote-jobs?limit=100';
const STALE_DAYS = 30;

interface RemotiveApiJob {
  id: number;
  title: string;
  company_name: string;
  category: string;
  job_type: string;
  candidate_required_location: string;
  salary: string;
  url: string;
  publication_date: string;
}

export const syncRemotiveJobs = async (): Promise<void> => {
  logger.info('Remotive sync started');

  let jobs: RemotiveApiJob[];
  try {
    const res = await fetch(REMOTIVE_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as { jobs: RemotiveApiJob[] };
    jobs = data.jobs ?? [];
  } catch (err: any) {
    logger.error({ err: err.message }, 'Remotive sync fetch failed');
    return;
  }

  let upserted = 0;
  for (const job of jobs) {
    try {
      await prisma.remotiveCache.upsert({
        where: { remotiveId: job.id },
        update: {
          title: job.title,
          company: job.company_name,
          category: job.category ?? '',
          jobType: job.job_type ?? '',
          location: job.candidate_required_location ?? '',
          salary: job.salary ?? '',
          url: job.url,
          publishedAt: new Date(job.publication_date),
        },
        create: {
          remotiveId: job.id,
          title: job.title,
          company: job.company_name,
          category: job.category ?? '',
          jobType: job.job_type ?? '',
          location: job.candidate_required_location ?? '',
          salary: job.salary ?? '',
          url: job.url,
          publishedAt: new Date(job.publication_date),
        },
      });
      upserted++;
    } catch (err: any) {
      logger.warn({ remotiveId: job.id, err: err.message }, 'Failed to upsert job');
    }
  }

  // Remove jobs not seen in the last STALE_DAYS days
  const staleThreshold = new Date();
  staleThreshold.setDate(staleThreshold.getDate() - STALE_DAYS);
  const { count: deleted } = await prisma.remotiveCache.deleteMany({
    where: { syncedAt: { lt: staleThreshold } },
  });

  logger.info({ upserted, deleted, total: jobs.length }, 'Remotive sync finished');
};

export const startRemotiveSyncCron = (): void => {
  // Initial sync on startup, then every 6 hours
  syncRemotiveJobs();
  cron.schedule('0 */6 * * *', syncRemotiveJobs);
  logger.info('Remotive sync cron scheduled (every 6 hours)');
};
