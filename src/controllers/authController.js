// import User from '../models/User.js';
// import generateToken from '../utils/generateToken.js';

import authServices from "../services/authServices.js";
// // @desc    Register user (Admin only)
// // @route   POST /api/auth/register
// const register = async (req, res, next) => {
//   try {
//     // const errors = validationResult(req);
//     // if (!errors.isEmpty()) {
//     //   return res.status(400).json({ errors: errors.array() });
//     // }

//     const { name, email, password, role, assignedBy, permissions } = req.body;

//     // Check if user exists
//     const exists = await User.findOne({ email });
//     if (exists) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     // DEFAULT PERMISSIONS
//     let finalPermissions = {
//       fabricEntry: false,
//       cuttingEntry: false,
//       workerEntry: false,
//       stock: false
//     };

//     // ADMIN => FULL ACCESS
//     if (role === 'admin') {

//       finalPermissions = {
//         fabricEntry: true,
//         cuttingEntry: true,
//         workerEntry: true,
//         stock: true
//       };
//     }

//     // MASTER => ADMIN DECIDES
//     if (role === 'master') {

//       finalPermissions = permissions || finalPermissions;
//     }
//     // Create user
//     const user = await User.create({
//       name,
//       email,
//       password,
//       role,
//       // assignedBy: assignedBy || null,
//       permissions: finalPermissions
//     });

//     // res.status(201).json({
//     //   _id: user._id,
//     //   name: user.name,
//     //   email: user.email,
//     //   role: user.role,
//     //   token: generateToken(user._id)
//     // });

//     res.status(201).json({
//       success: true,
//       message: 'User registered',
//       token: generateToken(user._id),
//       user
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Login user
// // @route   POST /api/auth/login
// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });

//     if (!user || !(await user.comparePassword(password))) {
//       return res.status(401).json({ message: 'Invalid email or password' });
//     }

//     if (!user.isActive) {
//       return res.status(401).json({ message: 'Account is deactivated' });
//     }

//     // res.json({
//     //   _id: user._id,
//     //   name: user.name,
//     //   email: user.email,
//     //   role: user.role,
//     //   permissions: user.permissions,
//     //   token: generateToken(user._id)
//     // });

//     res.status(200).json({
//       success: true,

//       token: generateToken(user._id),

//       user: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         permissions: user.permissions
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Get current user
// // @route   GET /api/auth/me
// const getMe = async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id).select('-password');
//     res.json(user);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   } 
// };

// const updatePermissions = async (req, res) => {

//   try {

//     const user = await User.findById(req.params.id);

//     if (!user) {

//       return res.status(404).json({
//         message: 'User not found'
//       });
//     }

//     if (user.role !== 'master') {

//       return res.status(400).json({
//         message: 'Permissions only for master'
//       });
//     }

//     user.permissions = req.body.permissions;

//     await user.save();

//     res.json({
//       success: true,
//       message: 'Permissions updated',
//       permissions: user.permissions
//     });

//   } catch (error) {

//     res.status(500).json({
//       message: error.message
//     });
//   }
// };

// export default { register, login, getMe, updatePermissions };



// REGISTER
const register = async (req, res) => {

  try {

    const result =
      await authServices.registerUser(
        req.body
      );

    res.status(201).json(result);

  } catch (error) {

    res.status(400).json({
      message: error.message
    });
  }
};

// LOGIN
const login = async (req, res) => {

  try {

    const result =
      await authServices.loginUser(
        req.body
      );

    res.status(200).json(result);

  } catch (error) {

    res.status(401).json({
      message: error.message
    });
  }
};

// GET ME
const getMe = async (req, res) => {

  try {

    const user =
      await authServices.getCurrentUser(
        req.user._id
      );

    res.status(200).json(user);

  } catch (error) {

    res.status(404).json({
      message: error.message
    });
  }
};

// UPDATE PERMISSIONS
const updatePermissions = async (
  req,
  res
) => {

  try {

    const result =
      await authServices.updateUserPermissions(
        req.params.id,
        req.body.permissions
      );

    res.status(200).json(result);

  } catch (error) {

    res.status(400).json({
      message: error.message
    });
  }
};

// GET ALL USERS
const getAllUsers = async (req, res) => {

  try {

    const result =
      await authServices.getAllUsers();

    res.status(200).json(result);

  } catch (error) {

    res.status(404).json({
      message: error.message
    });
  }
};

// DELETE USER
const deleteUser = async (req, res) => {

  try {

    const result =
      await authServices.deleteUser(
        req.params.id
      );

    res.status(200).json(result);

  } catch (error) {

    res.status(404).json({
      message: error.message
    });
  }
};

export default {
  register,
  login,
  getMe,
  updatePermissions,
  getAllUsers,
  deleteUser
};