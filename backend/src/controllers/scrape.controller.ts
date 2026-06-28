import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { scrapeJob } from '../services/scrape.service';
import { sendSuccess, sendError } from '../utils/response';

export const scrapeUrl = async (req: AuthRequest, res: Response): Promise<void> => {
  const { url } = req.body as { url?: string };

  if (!url || typeof url !== 'string') {
    sendError(res, 'url is required', 400);
    return;
  }

  try {
    new URL(url); // validate URL format
  } catch {
    sendError(res, 'Invalid URL format', 400);
    return;
  }

  const protocol = new URL(url).protocol;
  if (protocol !== 'http:' && protocol !== 'https:') {
    sendError(res, 'Only http and https URLs are allowed', 400);
    return;
  }

  try {
    const result = await scrapeJob(url);
    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message || 'Scrape failed', err.statusCode || 500);
  }
};
