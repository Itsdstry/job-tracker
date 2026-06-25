import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as dashboardService from '../services/dashboard.service';
import { sendSuccess, sendError } from '../utils/response';

export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await dashboardService.getStats(req.userId!);
    sendSuccess(res, stats);
  } catch (err: any) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

export const getCharts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const charts = await dashboardService.getCharts(req.userId!);
    sendSuccess(res, charts);
  } catch (err: any) {
    sendError(res, err.message, err.statusCode || 500);
  }
};
