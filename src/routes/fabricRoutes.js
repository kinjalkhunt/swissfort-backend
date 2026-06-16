import { Router } from 'express';
const router = Router();
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
    // getDraftEntry
} from '../controllers/fabricController.js';

router.get('/fabric/next-trn', getNextTrnNo);
// router.get('/fabric/draft', getDraftEntry);
router.get('/fabric/trn/:trnNo', getFabricEntryByTrnNo);
router.get('/fabric/:id', getFabricEntryById);
router.get('/fabric', getAllFabricEntries);
router.get('/fabric/:id/summary', getFabricSummary);

router.post('/fabric', createFabricEntry);
router.post('/fabric/:id/entry', addLineEntry);

router.put('/fabric/:id/entry/:entryId', updateLineEntry);
router.put('/fabric/:id', updateFabricEntry);

router.delete('/fabric/:id/entry/:entryId', deleteLineEntry);
router.delete('/fabric/:id', deleteFabricEntry);

export default router;