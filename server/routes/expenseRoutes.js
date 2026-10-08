import express from 'express';
import {
  getGroupExpenses,
  createExpense,
  getExpenseById,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect);

router.route('/')
  .get(getGroupExpenses)
  .post(upload.single('receipt'), createExpense);

router.route('/group/:groupId')
  .get(getGroupExpenses)
  .post(upload.single('receipt'), createExpense);

router.route('/:id')
  .get(getExpenseById)
  .put(upload.single('receipt'), updateExpense)
  .delete(deleteExpense);

export default router;
