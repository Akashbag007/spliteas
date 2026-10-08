import express from 'express';
import {
  getGroupAnalytics,
  getMonthlyAnalytics,
  getCategoryAnalytics,
  getGlobalAnalytics,
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/group/:groupId', getGroupAnalytics);
router.get('/monthly', getMonthlyAnalytics);
router.get('/categories', getCategoryAnalytics);
router.get('/global', getGlobalAnalytics);

export default router;
