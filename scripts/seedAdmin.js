import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../src/models/User.js';
import connectDB from '../src/config/database.js';

const seedAdmin = async () => {
  try {
    await connectDB();
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@swissfort.com' });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('Email: admin@swissfort.com');
      console.log('Password: admin123');
      process.exit(0);
    }
    
    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@swissfort.com',
      password: 'admin123',
      role: 'admin',
      isActive: true
    });
    
    console.log('✅ Admin user created successfully');
    console.log('Email: admin@swissfort.com');
    console.log('Password: admin123');
    console.log('Role: admin');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
