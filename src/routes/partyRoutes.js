import { Router } from 'express';
const router = Router();
import partyController from '../controllers/partyController.js';

router.post('/parties', partyController.createParty);
router.get('/parties', partyController.getAllParties);
router.get('/parties/type/:type', partyController.getPartiesByType);
router.get('/parties/:id', partyController.getPartyById);
router.put('/parties/:id', partyController.updateParty);
router.delete('/parties/:id', partyController.deleteParty);

export default router;