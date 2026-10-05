import { Router } from 'express';
import workerController from '../controllers/workerController.js';
import authMiddleware from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { checkHelperPermission } from '../middleware/roleCheck.js';
import workerAuth from '../middleware/workerAuth.js';

const { protect } = authMiddleware;
const { createWorker, getAllWorkers, getWorkerById, updateWorker, deleteWorker } = workerController;

const router = Router();

// Create a worker profile or, for admins, create a worker account and profile.
router.post('/create', protect, checkHelperPermission('workerMaster'), upload.single('proofImage'), createWorker);

// Export workers using the same access rules and filters as the worker list.
router.get('/export', protect, workerAuth, checkHelperPermission('workerMaster'), workerController.exportWorkers);

// Get all workers (protected, requires workerEntry permission)
router.get(
  '/',
  protect,
  workerAuth,
  checkHelperPermission('workerMaster'),
  getAllWorkers
);

// Get worker by ID (protected, requires workerEntry permission)
router.get(
  '/:workerId',
  protect,
  workerAuth,
  checkHelperPermission('workerMaster'),
  getWorkerById
);

// Update worker (protected, requires workerEntry permission)
router.put(
  '/:workerId',
  protect,
  workerAuth,
  checkHelperPermission('workerMaster'),
  upload.single('proofImage'),
  updateWorker
);

// Delete worker (protected, requires workerEntry permission)
router.delete(
  '/:workerId',
  protect,
  workerAuth,
  checkHelperPermission('workerMaster'),
  deleteWorker
);

export default router;
