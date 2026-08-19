import express from 'express';
import { createProduct, deleteProduct, getAllProducts, getProductByCode, getProductById, getProductStats, updateProduct } from '../controllers/productController.js';
import { Router } from 'express'


const router = Router();

router.get('/all', getAllProducts)
router.post('/add',createProduct);
router.get('/stats', getProductStats);
router.get('/:id',getProductById)          
router.put('/edit/:id',updateProduct)           
router.delete('/delete/:id',deleteProduct);     
router.get('/code/:code', getProductByCode);

export default router;