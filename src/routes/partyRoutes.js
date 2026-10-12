// import { Router } from 'express';
// const router = Router();
// import partyController from '../controllers/partyController.js';

// router.options('/parties/export', (req, res) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
//     res.status(200).send();
// });

// router.get('/parties/export', partyController.exportParties);
// router.post('/parties', partyController.createParty);
// router.get('/parties', partyController.getAllParties);
// router.get('/parties/type/:type', partyController.getPartiesByType);
// router.get('/parties/:id', partyController.getPartyById);
// router.put('/parties/:id', partyController.updateParty);
// router.delete('/parties/:id', partyController.deleteParty);


// export default router;
import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import { checkHelperPermission } from '../middleware/roleCheck.js';
import partyController from '../controllers/partyController.js';

const router = Router();
const { protect } = authMiddleware;   // ✅ ફક્ત protect

router.options('/parties/export', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.status(200).send();
});

router.use(protect);

const canParty = checkHelperPermission('partyMaster');

router.get('/parties/export', canParty, partyController.exportParties);
router.post('/parties', canParty, partyController.createParty);
router.get('/parties', canParty, partyController.getAllParties);
router.get('/parties/type/:type', canParty, partyController.getPartiesByType);
router.get('/parties/:id', canParty, partyController.getPartyById);
router.put('/parties/:id', canParty, partyController.updateParty);
router.delete('/parties/:id', canParty, partyController.deleteParty);

export default router;