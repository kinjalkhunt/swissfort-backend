import dotenv from "dotenv";
import express from 'express';
import cors from 'cors';
import connectDB from './src/config/database.js';
import indexRouter from './src/routes/index.js';

const app = express();
const PORT = process.env.PORT || 3000;
dotenv.config();

connectDB();

// OR more specific CORS
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Disposition', 'Content-Length'],
    credentials: true
}));app.use(express.json());
app.use(express.urlencoded({ extended: true }));


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
  res.status(err.statusCode || 500).json({
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
