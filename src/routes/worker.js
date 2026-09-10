import { Router } from 'express';
import workerController from '../controllers/workerController.js';
import authMiddleware from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { checkHelperPermission } from '../middleware/roleCheck.js';
import workerAuth from '../middleware/workerAuth.js';

const { protect } = authMiddleware;
const { createWorker, getAllWorkers, getWorkerById, updateWorker, deleteWorker } = workerController;

const router = Router();

// Create worker (protected, requires workerEntry permission)
router.post('/create',protect,checkHelperPermission('workerEntry'),upload.single('proofImage'),createWorker);

// Get all workers (protected, requires workerEntry permission)
router.get(
  '/',
  protect,
  workerAuth,
  checkHelperPermission('workerEntry'),
  getAllWorkers
);

// Get worker by ID (protected, requires workerEntry permission)
router.get(
  '/:workerId',
  protect,
  workerAuth,
  checkHelperPermission('workerEntry'),
  getWorkerById
);

// Update worker (protected, requires workerEntry permission)
router.put(
  '/:workerId',
  protect,
  workerAuth,
  checkHelperPermission('workerEntry'),
  upload.single('proofImage'),
  updateWorker
);

// Delete worker (protected, requires workerEntry permission)
router.delete(
  '/:workerId',
  protect,
  workerAuth,
  checkHelperPermission('workerEntry'),
  deleteWorker
);

export default router;
