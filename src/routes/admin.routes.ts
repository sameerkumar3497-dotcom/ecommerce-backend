import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

// Every route in this file needs a logged-in ADMIN
router.use(authenticate, authorize('ADMIN'));

router.get('/ping', (req, res) => {
  res.json({ message: 'Hello admin', userId: req.user?.id });
});

export default router;
