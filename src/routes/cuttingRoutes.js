import { Router } from "express";
import { createCuttingEntry, deleteCuttingEntry, getAllCuttingEntries, getCuttingEntryById, getNextTrnNo, getProductById, getProducts, getSkuDetails, getSkuStockHistory, updateCuttingEntry } from "../controllers/cuttingEntryController.js";

const router = Router()

// Generate next TRN
router.get('/next-trn', getNextTrnNo );

// Get SKU from Fabric Entry
router.get('/sku/:skuNo', getSkuDetails);

// Get Products
router.get('/products',getProducts);

// Get Product
router.get('/products/:id',getProductById );
router.get('/sku-history/:skuNo', getSkuStockHistory);



// ============================================
// Cutting Entry CRUD
// ============================================

// Get all
router.get( '/',getAllCuttingEntries);

// Get single
router.get('/:id',getCuttingEntryById );

// Create
router.post('/',createCuttingEntry);

// Update
router.put('/:id',updateCuttingEntry);

// Delete
router.delete('/:id',deleteCuttingEntry);

export default router;