import { Router } from 'express';
import * as applicationController from '../controllers/application.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import {
  createApplicationValidator,
  updateApplicationValidator,
  listApplicationsValidator,
} from '../validators/application.validator';

const router = Router();

router.use(authenticate);

router.get('/', listApplicationsValidator, validate, applicationController.list);
router.get('/export', listApplicationsValidator, validate, applicationController.exportCsv);
router.post('/', createApplicationValidator, validate, applicationController.create);
router.get('/:id', applicationController.getById);
router.put('/:id', updateApplicationValidator, validate, applicationController.update);
router.delete('/:id', applicationController.remove);

export default router;
