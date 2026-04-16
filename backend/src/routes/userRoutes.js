import express from 'express';
import { getUserById, getUsers } from '../controllers/userController.js';
import { adminOnly, protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, adminOnly);
router.get('/', getUsers);
router.get('/:id', getUserById);

export default router;
