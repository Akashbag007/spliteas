import express from 'express';
import { getGroupBalances, getUserOverview } from '../controllers/balanceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect);

router.get('/overview', getUserOverview);

router.get('/', (req, res, next) => {
  if (req.params.groupId) {
    return getGroupBalances(req, res, next);
  }
  return getUserOverview(req, res, next);
});

router.get('/group/:groupId', getGroupBalances);
router.get('/:groupId', (req, res, next) => {
  if (req.params.groupId === 'overview') {
    return getUserOverview(req, res, next);
  }
  return getGroupBalances(req, res, next);
});

export default router;
