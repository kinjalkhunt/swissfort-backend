import express from 'express';
import authRoutes from './auth.js';
import dashboardRoutes from './dashboard.js';
import fabricRoutes from './fabricRoutes.js'; 
import partyRoutes from './partyRoutes.js';
import productRoutes from './productRoutes.js';
import cuttingRoutes from './cuttingRoutes.js';
import workerRoutes from './worker.js';



const indexRouter = express.Router();
 
indexRouter.use('/api/auth', authRoutes);
indexRouter.use('/api', dashboardRoutes);
indexRouter.use('/api', fabricRoutes)
indexRouter.use('/api', partyRoutes);
indexRouter.use('/api/products', productRoutes);
indexRouter.use('/api/cutting-entries', cuttingRoutes);
indexRouter.use('/api/workers', workerRoutes);

export default indexRouter;