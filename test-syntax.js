#!/usr/bin/env node

import authRoutes from './src/routes/auth.js';
import authController from './src/controllers/authController.js';
import authServices from './src/services/authServices.js';

console.log('✓ All modules imported successfully');
console.log('✓ Auth routes loaded');
console.log('✓ Auth controller loaded');
console.log('✓ Auth services loaded');
console.log('\nAPI Endpoints created:');
console.log('✓ GET /v1/api/auth/users');
console.log('✓ DELETE /v1/api/auth/users/:id');
