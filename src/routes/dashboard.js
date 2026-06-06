import express from 'express';
import dashboardController from '../controllers/dashboardController.js';
const { getDashboard, getAllUsers } = dashboardController;
import authMiddleware from '../middleware/auth.js';
const { protect, authorize } = authMiddleware;

const router = express.Router();

// Get dashboard data (protected)
router.get('/dashboard', protect, getDashboard);

// Get all users (admin only)
router.get('/users', protect, authorize('admin'), getAllUsers);

export default router;
