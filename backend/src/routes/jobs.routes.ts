import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { getCachedJobs } from '../controllers/jobs.controller';

const router = Router();

router.get('/cached', authenticate, getCachedJobs);

export default router;
