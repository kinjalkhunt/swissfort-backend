const roleCheck = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. ${req.user.role} role cannot access this resource` 
      });
    }
    next();
  };
};

// Helper permission check
const checkHelperPermission = (permission) => {
  return (req, res, next) => {

    // Admin has full access
    if (req.user.role === 'admin') {
      return next();
    }

    // Master permission check
    if (!req.user.permissions[permission]) {
      return res.status(403).json({
        message: `Access denied for ${permission}`
      });
    }

    next();
  };
};

export default { roleCheck, checkHelperPermission };