// Middleware to check if user is worker and add their workerId to request
const workerAuth = (req, res, next) => {
  if (req.user.role === 'worker') {
    req.workerId = req.user.workerId;
  }
  next();
};

export default workerAuth;
