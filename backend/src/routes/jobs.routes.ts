import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { getNearbyJobs } from '../controllers/jobs.controller';

const router = Router();

router.get('/nearby', authenticate, getNearbyJobs);

export default router;
