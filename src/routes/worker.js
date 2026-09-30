import { Router } from 'express';
import workerController from '../controllers/workerController.js';
import authMiddleware from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { checkHelperPermission } from '../middleware/roleCheck.js';

const { protect } = authMiddleware;
const {
  getNextWorkerId,
  createWorker,
  getAllWorkers,
  getWorkerById,
  updateWorker,
  deleteWorker
} = workerController;

const router = Router();

const uploadProof = (req, res, next) => {
  upload.single('proofImage')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

router.use(protect, checkHelperPermission('workerMaster'));

router.get('/next-id', getNextWorkerId);
router.post('/', uploadProof, createWorker);
router.post('/create', uploadProof, createWorker);
router.get('/', getAllWorkers);
router.get('/:workerId', getWorkerById);
router.put('/:workerId', uploadProof, updateWorker);
router.delete('/:workerId', deleteWorker);

export default router;
