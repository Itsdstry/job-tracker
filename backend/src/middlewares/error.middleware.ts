import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    logger.error({ err, method: req.method, url: req.url, statusCode }, message);
  } else {
    logger.warn({ method: req.method, url: req.url, statusCode }, message);
  }

  res.status(statusCode).json({ success: false, message });
};

export const notFound = (req: Request, res: Response): void => {
  logger.warn({ method: req.method, url: req.url }, 'Route not found');
  res.status(404).json({ success: false, message: 'Route not found' });
};
