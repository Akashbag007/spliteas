import express from 'express';
import { getProfile, updateProfile, updatePassword, searchUsers } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/me', getProfile);
router.put('/me', updateProfile);
router.put('/me/password', updatePassword);
router.get('/search', searchUsers);

export default router;
