import { Router } from 'express';
import authController from '../controllers/authController.js';
const { register, login, getMe, updatePermissions, getAllUsers, deleteUser } = authController;
import authMiddleware from '../middleware/auth.js';
const { protect, authorize } = authMiddleware;


const router = Router();

// Register new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Get current user profile (protected)
router.get('/profile', protect, getMe);

// Get all users (protected)
router.get('/users', protect, getAllUsers);

// Delete user (protected)
router.delete('/users/:id', protect, deleteUser);

router.put(
  '/permissions/:id',
  protect,
  authorize('admin'),
  updatePermissions
);

export default router;
