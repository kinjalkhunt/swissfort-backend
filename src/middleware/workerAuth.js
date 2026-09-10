// Middleware to check if user is worker and add their workerId to request
const workerAuth = (req, res, next) => {
  if (req.user.role === 'worker') {
    if (!req.user.workerId) {
      return res.status(400).json({
        success: false,
        message: 'Worker account not linked to worker profile'
      });
    }
    req.workerId = req.user.workerId;
  }
  next();
};

export default workerAuth;
