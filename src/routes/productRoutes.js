// import express from 'express';
// import { createProduct, deleteProduct, getAllProducts, getProductByCode, getProductById, getProductStats, updateProduct } from '../controllers/productController.js';
// import { Router } from 'express'


// const router = Router();

// router.get('/all', getAllProducts)
// router.post('/add',createProduct);
// router.get('/stats', getProductStats);
// router.get('/:id',getProductById)          
// router.put('/edit/:id',updateProduct)           
// router.delete('/delete/:id',deleteProduct);     
// router.get('/code/:code', getProductByCode);

// export default router;

import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import { checkHelperPermission } from '../middleware/roleCheck.js';
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductByCode,
  getProductById,
  getProductStats,
  updateProduct,
} from '../controllers/productController.js';

const router = Router();
const { protect } = authMiddleware;   
    
// router.use(protect);
const canProduct = checkHelperPermission('productMaster');

router.get('/all', canProduct, getAllProducts);
router.post('/add', canProduct, createProduct);
router.get('/stats', canProduct, getProductStats);
router.get('/:id', canProduct, getProductById);
router.put('/edit/:id', canProduct, updateProduct);
router.delete('/delete/:id', canProduct, deleteProduct);
router.get('/code/:code', canProduct, getProductByCode);

export default router;