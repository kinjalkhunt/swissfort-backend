import { Router } from 'express';
const router = Router();
import fabricController from '../controllers/fabricController.js';

router.post('/fabric', fabricController.createEntry);
router.get('/fabric', fabricController.getAllEntries);
router.post('/fabric/:id/entries', fabricController.addEntryToFabric);
router.get('/fabric/:id', fabricController.getEntryById);
router.put('/fabric/:id', fabricController.updateEntry);
router.delete('/fabric/:id', fabricController.deleteEntry);
router.delete('/fabric/:fabricId/entries/:entryId', fabricController.deleteEntryFromFabric);


export default router;