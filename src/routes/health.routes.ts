import { Router } from 'express';
import { pool } from '../config/db';
import { redis } from '../config/redis';

const router = Router();

router.get('/', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    await redis.ping();
    res.json({ status: 'ok', db: 'up', redis: 'up' });
  } catch (err) {
    req.log.error({ err }, 'Health check failed');
    res.status(503).json({ status: 'error' });
  }
});

export default router;
