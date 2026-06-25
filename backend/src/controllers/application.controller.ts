import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as applicationService from '../services/application.service';
import { sendSuccess, sendError } from '../utils/response';

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const app = await applicationService.createApplication(req.userId!, req.body);
    sendSuccess(res, app, 'Application created', 201);
  } catch (err: any) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

export const list = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await applicationService.listApplications(req.userId!, {
      status: req.query.status as any,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string,
      order: req.query.order as 'asc' | 'desc',
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

export const exportCsv = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const csv = await applicationService.exportApplications(req.userId!, {
      status: req.query.status as any,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string,
      order: req.query.order as 'asc' | 'desc',
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="applications.csv"');
    res.status(200).send(csv);
  } catch (err: any) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

export const getById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const app = await applicationService.getApplicationById(req.userId!, req.params.id);
    sendSuccess(res, app);
  } catch (err: any) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const app = await applicationService.updateApplication(req.userId!, req.params.id, req.body);
    sendSuccess(res, app, 'Application updated');
  } catch (err: any) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await applicationService.deleteApplication(req.userId!, req.params.id);
    sendSuccess(res, null, 'Application deleted');
  } catch (err: any) {
    sendError(res, err.message, err.statusCode || 500);
  }
};
