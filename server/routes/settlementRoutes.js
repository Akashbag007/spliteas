import express from 'express';
import {
  getGroupSettlements,
  createSettlement,
  updateSettlementStatus,
  deleteSettlement,
} from '../controllers/settlementController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect);

router.route('/')
  .get(getGroupSettlements)
  .post(createSettlement);

router.route('/group/:groupId')
  .get(getGroupSettlements)
  .post(createSettlement);

router.put('/:id/settle', updateSettlementStatus);
router.delete('/:id', deleteSettlement);

export default router;
