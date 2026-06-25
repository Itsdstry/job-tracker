import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  updateProfileValidator,
} from '../validators/auth.validator';

const router = Router();

router.post('/register', registerValidator, validate, authController.register);
router.post('/login', loginValidator, validate, authController.login);
router.post('/forgot-password', forgotPasswordValidator, validate, authController.forgotPassword);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, updateProfileValidator, validate, authController.updateProfile);

export default router;
