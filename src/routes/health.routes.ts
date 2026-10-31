import { Router } from 'express';
import { pool } from '../config/db';
import { redis } from '../config/redis';


const router = Router();

router.get('/', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    await redis.ping();
    res.json({ status: 'ok', db: 'up', redis: 'up' });
  } catch (err) {
    console.error(err);
    res.status(503).json({ status: 'error' });
  }
});

export default router;
