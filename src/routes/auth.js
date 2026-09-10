import { Router } from 'express';
import authController from '../controllers/authController.js';
const { register, login, workerLogin, getMe, getProfile, updateProfile, forgotPassword, resetPassword, updatePermissions, getAllUsers, deleteUser } = authController;
import authMiddleware from '../middleware/auth.js';
const { protect, authorize } = authMiddleware;


const router = Router();

// Register new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Worker login (using mobile number)
router.post('/worker-login', workerLogin);

// Forgot password (public)
router.post('/forgot-password', forgotPassword);

// Reset password (public)
router.post('/reset-password', resetPassword);

// Get current user profile (protected)
router.get('/profile', protect, getMe);

// Get profile page data (protected)
router.get('/profile-page', protect, getProfile);

// Update profile (protected)
router.put('/profile', protect, updateProfile);

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
