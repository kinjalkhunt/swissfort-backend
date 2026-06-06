import dotenv from "dotenv";
import express from 'express';
import cors from 'cors';
import connectDB from './src/config/database.js';
import indexRouter from './src/routes/index.js';

const app = express();
const PORT = process.env.PORT || 3000;
dotenv.config();

connectDB();

app.use(cors());
app.use(express.json());

app.use('/v1',indexRouter);

app.get('/', (req, res) => {
  res.json({ 
    message: 'SwissFort Backend API is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      dashboard: '/api/dashboard'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
