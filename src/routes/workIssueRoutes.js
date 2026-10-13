// import express from 'express';
// import authMiddleware from '../middleware/auth.js';
// import {
//   createEntry,
//   updateEntry,
//   deleteEntry,
//   deleteMultipleEntries,
//   getAllEntries,
//   getEntryById,
//   getAvailableSizes,
//   getInitData,
// } from '../controllers/workIssueControll.js';

// const router = express.Router();
// const { protect, authorize } = authMiddleware;

// router.get('/init', getInitData);
// router.get('/available-sizes', getAvailableSizes);
// router.post('/', createEntry);
// router.get('/', getAllEntries);
// router.get('/:id', getEntryById);
// router.put('/:id', updateEntry);       // 🔥 NEW edit route
// router.delete('/:id', deleteEntry);    // single delete (was missing before)
// router.delete('/bulk', protect, authorize('admin'), deleteMultipleEntries);

// export default router;

import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { checkHelperPermission } from '../middleware/roleCheck.js';
import {
  createEntry,
  deleteMultipleEntries,
  getAllEntries,
  getAvailableSizes,
  getEntryById,
  getInitData,
  updateEntry,
} from '../controllers/workIssueController.js';

const router = express.Router();
const { protect, authorize } = authMiddleware;

router.use(protect);

const canWorker = checkHelperPermission('workerEntry');

router.get('/init', canWorker, getInitData);
router.get('/available-sizes', canWorker, getAvailableSizes);
router.post('/', canWorker, createEntry);
router.get('/', canWorker, getAllEntries);
router.get('/:id', canWorker, getEntryById);
router.put('/:id', canWorker, updateEntry);
// router.delete('/:id', canWorker, deleteEntries);

// Bulk delete: only admin
router.delete('/bulk', authorize('admin'), deleteMultipleEntries);

export default router;