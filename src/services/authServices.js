import User from '../models/User.js';
import Worker from '../models/worker.js';
import generateToken from '../utils/generateToken.js';
import generateResetToken from '../utils/generateResetToken.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';

// REGISTER SERVICE
const registerUser = async (data) => {

  const {
    name,
    email,
    password,
    role,
    permissions
  } = data;
  console.log(`[AuthService] Registering user: ${email} with role: ${role}`);

  // CHECK USER
  const exists = await User.findOne({ email });

  if (exists) {

    throw new Error('User already exists');
  }

  // DEFAULT PERMISSIONS
  let finalPermissions = {
    fabricEntry: false,
    cuttingEntry: false,
    workerEntry: false,
    stock: false,
    partyMaster: false,
    productMaster: false,
    workerMaster: false,
    dashboard: false
  };

  // ADMIN FULL ACCESS
  if (role === 'admin') {
    finalPermissions = {
      fabricEntry: true,
      cuttingEntry: true,
      workerEntry: true,
      stock: true,
      partyMaster: true,
      productMaster: true,
      workerMaster: true,
      dashboard: true
    };
  }

  // MASTER CUSTOM ACCESS
  if (role === 'master') {

    finalPermissions =
      permissions || finalPermissions;
  }

  // CREATE USER
  const user = await User.create({
    name,
    email,
    password,
    role,
    permissions: finalPermissions
  });

  return {
    success: true,
    message: 'User registered',

    token: generateToken(user._id),

    user
  };
};

// LOGIN SERVICE
const loginUser = async (data) => {

  console.log('[AuthService] Login attempt for:', data.email);
  const { email, password } = data;

  // FIND USER
  const user = await User.findOne({ email });

  if (!user) {
    console.log('[AuthService] User not found:', email);
    throw new Error(
      'Invalid email or password'
    );
  }

  console.log('[AuthService] User found:', email, 'isActive:', user.isActive);

  // CHECK PASSWORD
  const isMatch =
    await user.comparePassword(password);

  if (!isMatch) {
    console.log('[AuthService] Password mismatch for:', email);
    throw new Error(
      'Invalid email or password'
    );
  }

  console.log('[AuthService] Password matched for:', email);

  // ACCOUNT ACTIVE?
  if (!user.isActive) {
    console.log('[AuthService] Account deactivated:', email);
    throw new Error(
      'Account is deactivated'
    );
  }

  // UPDATE LAST LOGIN
  user.lastLogin = new Date();
  await user.save();

  console.log('[AuthService] Login successful for:', email);
  return {
    success: true,

    token: generateToken(user._id),

    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    }
  };
};

// GET CURRENT USER
const getCurrentUser = async (userId) => {

  const user = await User
    .findById(userId)
    .select('-password');

  if (!user) {

    throw new Error('User not found');
  }

  return user;
};

// UPDATE PERMISSIONS
const updateUserPermissions = async (
  userId,
  permissions
) => {

  const user = await User.findById(userId);

  if (!user) {

    throw new Error('User not found');
  }

  if (user.role !== 'master') {

    throw new Error(
      'Permissions only for master'
    );
  }

  user.permissions = permissions;

  await user.save();

  return {
    success: true,
    message: 'Permissions updated',
    permissions: user.permissions
  };
};

// GET PROFILE (for profile page)
const getUserProfile = async (userId) => {

  const user = await User
    .findById(userId)
    .select('-password');

  if (!user) {

    throw new Error('User not found');
  }

  // FORMAT LAST LOGIN
  const lastLoginFormatted = user.lastLogin
    ? new Date(user.lastLogin).toLocaleString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    : 'Never';

  // FORMAT LAST PASSWORD CHANGE
  const lastPasswordChangeFormatted = user.lastPasswordChange
    ? new Date(user.lastPasswordChange).toLocaleString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    : 'Not available';

  return {
    success: true,
    user: {
      _id: user._id,
      fullName: user.name,
      email: user.email,
      role: user.role.toUpperCase(),
      permissions: user.permissions,
      isActive: user.isActive,
      lastLogin: lastLoginFormatted,
      lastPasswordChange: lastPasswordChangeFormatted,
      createdAt: user.createdAt
    }
  };
};

// UPDATE PROFILE
const updateProfile = async (userId, data) => {

  const { name, email, password } = data;

  const user = await User.findById(userId);

  if (!user) {

    throw new Error('User not found');
  }

  // CHECK IF EMAIL EXISTS (excluding current user)
  if (email && email !== user.email) {

    const emailExists = await User.findOne({ 
      email: email.toLowerCase()
    });

    if (emailExists) {

      throw new Error('Email already in use');
    }

    user.email = email.toLowerCase();
  }

  // UPDATE NAME
  if (name) {

    user.name = name;
  }

  // UPDATE PASSWORD
  if (password && password.trim()) {

    user.password = password;
    user.lastPasswordChange = new Date();
  }

  await user.save();

  return {
    success: true,
    message: 'Profile updated successfully',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      fullName: user.name,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
      lastPasswordChange: user.lastPasswordChange
    }
  };
};

// GET ALL USERS
const getAllUsers = async () => {

  const users = await User
    .find()
    .select('-password');

  if (!users || users.length === 0) {

    throw new Error('No users found');
  }

  return {
    success: true,
    count: users.length,
    users
  };
};

// DELETE USER
const deleteUser = async (userId) => {

  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    throw new Error('User not found');
  }

  return {
    success: true,
    message: 'User deleted successfully',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email
    }
  };
};

// FORGOT PASSWORD
const forgotPassword = async (email) => {

  console.log('[AuthService] Forgot password request for:', email);

  const user = await User.findOne({ 
    email: email.toLowerCase() 
  });

  if (!user) {

    throw new Error('User not found');
  }

  // GENERATE RESET TOKEN
  const { token, hash, expiry } = generateResetToken();

  // SAVE TOKEN HASH TO DATABASE (not the actual token)
  user.passwordResetToken = hash;
  user.passwordResetTokenExpiry = expiry;
  console.log('user.passwordResetToken', user.passwordResetToken);
  console.log('user.passwordResetTokenExpiry', user.passwordResetTokenExpiry);
  
  await user.save();

  // SEND PASSWORD RESET EMAIL
  try {

    await sendEmail.sendPasswordResetEmail(
      user.email,
      token,
      user.name
    );

  } catch (emailError) {

    console.error('[AuthService] Email sending failed:', emailError.message);
    
    // CLEAR THE RESET TOKEN IF EMAIL FAILS
    user.passwordResetToken = null;
    user.passwordResetTokenExpiry = null;
    await user.save();

    throw new Error('Failed to send reset email. Please try again later.');
  }

  // RETURN SUCCESS
  return {
    success: true,
    message: 'Password reset link sent to your email',
    email: user.email
  };
};

// RESET PASSWORD
const resetPassword = async (resetToken, newPassword) => {

  console.log('[AuthService] Password reset attempt');

  if (!resetToken || !newPassword) {

    throw new Error('Token and new password are required');
  }

  // HASH THE TOKEN TO COMPARE WITH STORED HASH
  const tokenHash = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // FIND USER WITH MATCHING TOKEN AND VALID EXPIRY
  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetTokenExpiry: { $gt: new Date() }
  });

  if (!user) {

    throw new Error('Invalid or expired reset token');
  }

  // UPDATE PASSWORD
  user.password = newPassword;
  user.passwordResetToken = null;
  user.passwordResetTokenExpiry = null;
  user.lastPasswordChange = new Date();

  await user.save();

  console.log('[AuthService] Password reset successful for:', user.email);

  return {
    success: true,
    message: 'Password reset successfully',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email
    }
  };
};

// WORKER LOGIN (using mobile number)
const loginWorker = async (data) => {
  console.log('[AuthService] Worker login attempt for:', data.mobile);
  const { mobile, password } = data;

  // FIND WORKER BY MOBILE NUMBER
  const worker = await Worker.findOne({ mobile1: mobile });

  if (!worker) {
    console.log('[AuthService] Worker not found:', mobile);
    throw new Error('Invalid mobile number or password');
  }

  // FIND USER ACCOUNT LINKED TO THIS WORKER
  const user = await User.findOne({ workerId: worker.workerId });

  if (!user) {
    console.log('[AuthService] User account not found for worker:', worker.workerId);
    throw new Error('Worker account not linked to user. Please contact admin.');
  }

  // CHECK PASSWORD
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    console.log('[AuthService] Password mismatch for worker:', mobile);
    throw new Error('Invalid mobile number or password');
  }

  // ACCOUNT ACTIVE?
  if (!user.isActive) {
    console.log('[AuthService] Worker account deactivated:', mobile);
    throw new Error('Account is deactivated');
  }

  // UPDATE LAST LOGIN
  user.lastLogin = new Date();
  await user.save();

  console.log('[AuthService] Worker login successful for:', mobile);

  return {
    success: true,
    token: generateToken(user._id),
    user: {
      _id: user._id,
      name: user.name,
      workerId: user.workerId,
      role: user.role
    },
    worker: {
      workerId: worker.workerId,
      name: worker.name,
      mobile1: worker.mobile1,
      workerDetails: worker.workerDetails
    }
  };
};

export default {
  registerUser,
  loginUser,
  loginWorker,
  getCurrentUser,
  getUserProfile,
  updateProfile,
  updateUserPermissions,
  forgotPassword,
  resetPassword,
  getAllUsers,
  deleteUser
};