import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

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

    throw new Error(
      'Invalid email or password'
    );
  }

  // CHECK PASSWORD
  const isMatch =
    await user.comparePassword(password);

  if (!isMatch) {

    throw new Error(
      'Invalid email or password'
    );
  }

  // ACCOUNT ACTIVE?
  if (!user.isActive) {

    throw new Error(
      'Account is deactivated'
    );
  }

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

export default {
  registerUser,
  loginUser,
  getCurrentUser,
  updateUserPermissions,
  getAllUsers,
  deleteUser
};