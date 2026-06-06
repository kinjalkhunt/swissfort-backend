import express from 'express';
import authRoutes from './auth.js';
import dashboardRoutes from './dashboard.js';
import fabricRoutes from './fabricRoutes.js'; 
import partyRoutes from './partyRoutes.js';

const indexRouter = express.Router();
 
indexRouter.use('/api/auth', authRoutes);
indexRouter.use('/api', dashboardRoutes);
indexRouter.use('/api', fabricRoutes)
indexRouter.use('/api',partyRoutes);

export default indexRouter;