// const jwt = require("jsonwebtoken");

// module.exports = (req, res, next) => {

//   try {

//     const token = req.headers.authorization;

//     if (!token) {
//       return res.status(401).json({
//         message: "No Token"
//       });
//     }

//     const verified = jwt.verify(token, process.env.JWT_SECRET);

//     req.user = verified;

//     next();

//   } catch (error) {

//     res.status(401).json({
//       message: "Invalid Token"
//     });
//   }
// };



// const protect = async (req, res, next) => {
//   let token;

//   if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//     try {
//       token = req.headers.authorization.split(' ')[1];
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       req.user = await User.findById(decoded.id).select('-password');
      
//       if (!req.user.isActive) {
//         return res.status(401).json({ message: 'User account is deactivated' });
//       }
      
//       next();
//     } catch (error) {
//       return res.status(401).json({ message: 'Not authorized, token failed' });
//     }
//   }

//   if (!token) {
//     return res.status(401).json({ message: 'Not authorized, no token' });
//   }
// };

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
// Role-based access control
const protect = async (req, res, next) => {

  try {

    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {

      return res.status(401).json({
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = await User
      .findById(decoded.id)
      .select('-password');

    if (!req.user) {

      return res.status(401).json({
        message: 'User not found'
      });
    }

    next();

  } catch (error) {

    return res.status(401).json({
      message: 'Invalid token'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. ${req.user.role} role is not authorized to access this resource.`
      });
    }
    next();
  };
};

export default { protect, authorize };