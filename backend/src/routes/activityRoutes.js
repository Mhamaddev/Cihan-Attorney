import express from 'express';
import Activity from '../models/Activity.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

/*
 * The audit trail is oversight, not operational data: it records who did what,
 * which is exactly the information a non-admin should not be able to read
 * about colleagues. Locked to admins at the router so no handler added later
 * can accidentally be left open.
 */
router.use(authenticateToken, requireAdmin);

router.get('/', async (_req, res) => {
  try {
    const entries = await Activity.recent();
    res.json(entries);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ message: 'Error fetching activity', error: error.message });
  }
});

export default router;
