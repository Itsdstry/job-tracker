import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { scrapeUrl } from '../controllers/scrape.controller';

const router = Router();

router.post('/', authenticate, scrapeUrl);

export default router;
