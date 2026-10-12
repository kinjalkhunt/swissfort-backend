// import { Router } from 'express';
// const router = Router();
// import {
//     createFabricEntry,
//     getAllFabricEntries,
//     addLineEntry,
//     getFabricEntryById,
//     updateFabricEntry,
//     deleteFabricEntry,
//     deleteLineEntry,
//     getNextTrnNo,
//     getFabricEntryByTrnNo,
//     getFabricSummary,
//     updateLineEntry,
//     getDraftEntry
// } from '../controllers/fabricController.js';

// router.get('/fabric/next-trn', getNextTrnNo);
// router.get('/fabric/draft', getDraftEntry);
// router.get('/fabric/trn/:trnNo', getFabricEntryByTrnNo);
// router.get('/fabric/:id', getFabricEntryById);
// router.get('/fabric', getAllFabricEntries);
// router.get('/fabric/:id/summary', getFabricSummary);

// router.post('/fabric', createFabricEntry);
// router.post('/fabric/:id/entry', addLineEntry);

// router.put('/fabric/:id/entry/:entryId', updateLineEntry);
// router.put('/fabric/:id', updateFabricEntry);

// router.delete('/fabric/:id/entry/:entryId', deleteLineEntry);
// router.delete('/fabric/:id', deleteFabricEntry);

// export default router;


import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import { checkHelperPermission } from '../middleware/roleCheck.js';
import {
  createFabricEntry,
  getAllFabricEntries,
  addLineEntry,
  getFabricEntryById,
  updateFabricEntry,
  deleteFabricEntry,
  deleteLineEntry,
  getNextTrnNo,
  getFabricEntryByTrnNo,
  getFabricSummary,
  updateLineEntry,
  getDraftEntry,
} from '../controllers/fabricController.js';

const router = Router();
const { protect } = authMiddleware;

router.use(protect);

const canFabric = checkHelperPermission('fabricEntry');

router.get('/fabric/next-trn', canFabric, getNextTrnNo);
router.get('/fabric/draft', canFabric, getDraftEntry);
router.get('/fabric/trn/:trnNo', canFabric, getFabricEntryByTrnNo);
router.get('/fabric/:id', canFabric, getFabricEntryById);
router.get('/fabric', canFabric, getAllFabricEntries);
router.get('/fabric/:id/summary', canFabric, getFabricSummary);

router.post('/fabric', canFabric, createFabricEntry);
router.post('/fabric/:id/entry', canFabric, addLineEntry);

router.put('/fabric/:id/entry/:entryId', canFabric, updateLineEntry);
router.put('/fabric/:id', canFabric, updateFabricEntry);

router.delete('/fabric/:id/entry/:entryId', canFabric, deleteLineEntry);
router.delete('/fabric/:id', canFabric, deleteFabricEntry);

export default router;