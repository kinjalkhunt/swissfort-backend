// import { Router } from "express";
// import { completeCuttingTrn, createCuttingEntry, deleteCuttingEntry, getAllCuttingEntries, getCuttingEntryById, getNextTrnNo, getProductById, getProducts, getSkuDetails, getSkuStockHistory, updateCuttingEntry } from "../controllers/cuttingEntryController.js";

// const router = Router()

// // Generate next TRN
// router.get('/next-trn', getNextTrnNo );

// // Get SKU from Fabric Entry
// router.get('/sku/:skuNo', getSkuDetails);

// // Get Products
// router.get('/products',getProducts);

// // Get Product
// router.get('/products/:id',getProductById );
// router.get('/sku-history/:skuNo', getSkuStockHistory);



// // ============================================
// // Cutting Entry CRUD
// // ============================================

// // Get all
// router.get( '/',getAllCuttingEntries);

// // Create
// router.post('/',createCuttingEntry);

// // Complete all draft rows belonging to one TRN
// router.patch('/trn/:trnNo/complete', completeCuttingTrn);

// // Get single
// router.get('/:id',getCuttingEntryById );

// // Update
// router.put('/:id',updateCuttingEntry);

// // Delete
// router.delete('/:id',deleteCuttingEntry);

// export default router;

import { Router } from "express";
import authMiddleware from '../middleware/auth.js';
import { checkHelperPermission } from '../middleware/roleCheck.js';
import {
  completeCuttingTrn,
  createCuttingEntry,
  deleteCuttingEntry,
  getAllCuttingEntries,
  getCuttingEntryById,
  getNextTrnNo,
  getProductById,
  getProducts,
  getSkuDetails,
  getSkuStockHistory,
  updateCuttingEntry,
} from "../controllers/cuttingEntryController.js";

const router = Router();
const { protect} = authMiddleware;

// 🔒 બધા routes પર login જરૂરી
router.use(protect);

// 🔑 Module permission: cuttingEntry
const canCutting = checkHelperPermission('cuttingEntry');

router.get('/next-trn', canCutting, getNextTrnNo);
router.get('/sku/:skuNo', canCutting, getSkuDetails);
router.get('/products', canCutting, getProducts);
router.get('/products/:id', canCutting, getProductById);
router.get('/sku-history/:skuNo', canCutting, getSkuStockHistory);

router.get('/', canCutting, getAllCuttingEntries);
router.post('/', canCutting, createCuttingEntry);
router.patch('/trn/:trnNo/complete', canCutting, completeCuttingTrn);
router.get('/:id', canCutting, getCuttingEntryById);
router.put('/:id', canCutting, updateCuttingEntry);
router.delete('/:id', canCutting, deleteCuttingEntry);

export default router;