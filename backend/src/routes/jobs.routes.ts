import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { getNearbyJobs, getCachedJobs } from '../controllers/jobs.controller';

const router = Router();

router.get('/cached', authenticate, getCachedJobs);
router.get('/nearby', authenticate, getNearbyJobs);

export default router;
