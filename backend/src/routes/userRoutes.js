import express from 'express';
import {
  getUserById,
  getUsers,
  getMyProfile,
  updateMyProfile,
  getMyAddresses,
  addAddress,
  setDefaultAddress,
  deleteAddress,
} from '../controllers/userController.js';
import { adminOnly, protect } from '../middleware/auth.js';

const router = express.Router();

// ── Authenticated user routes (no admin required) ───────────────────────────
router.get('/profile/me', protect, getMyProfile);
router.put('/profile/me', protect, updateMyProfile);
router.get('/profile/addresses', protect, getMyAddresses);
router.post('/profile/addresses', protect, addAddress);
router.patch('/profile/addresses/:addrId/default', protect, setDefaultAddress);
router.delete('/profile/addresses/:addrId', protect, deleteAddress);

// ── Admin-only routes ────────────────────────────────────────────────────────
router.use(protect, adminOnly);
router.get('/', getUsers);
router.get('/:id', getUserById);

export default router;
