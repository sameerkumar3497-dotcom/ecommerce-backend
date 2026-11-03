import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Protected (need a valid access token)
router.get('/me', authenticate, authController.me);
router.post('/logout-all', authenticate, authController.logoutAll);

export default router;
