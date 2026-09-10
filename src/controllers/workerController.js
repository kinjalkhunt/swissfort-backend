import workerServices from '../services/workerServices.js';

// CREATE WORKER
const createWorker = async (req, res) => {
  try {
    const data = {
      ...req.body,
      proofImage: req.file ? req.file.path : req.body.proofImage
    };

    const result = await workerServices.createWorker(data);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// GET ALL WORKERS
const getAllWorkers = async (req, res) => {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      workerDetails: req.query.workerDetails,
      search: req.query.search,
      workerId: req.workerId // Filter by logged-in worker's ID
    };

    const result = await workerServices.getAllWorkers(filters);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET WORKER BY ID
const getWorkerById = async (req, res) => {
  try {
    const { workerId } = req.params;
    
    // If logged-in user is worker, only allow access to their own data
    if (req.workerId && req.workerId !== workerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own data.'
      });
    }
    
    const result = await workerServices.getWorkerById(workerId);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

// UPDATE WORKER
const updateWorker = async (req, res) => {
  try {
    const { workerId } = req.params;
    
    // If logged-in user is worker, only allow access to their own data
    if (req.workerId && req.workerId !== workerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own data.'
      });
    }
    
    const data = {
      ...req.body,
      proofImage: req.file ? req.file.path : req.body.proofImage
    };

    const result = await workerServices.updateWorker(workerId, data);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE WORKER
const deleteWorker = async (req, res) => {
  try {
    const { workerId } = req.params;
    const result = await workerServices.deleteWorker(workerId);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

export default {
  createWorker,
  getAllWorkers,
  getWorkerById,
  updateWorker,
  deleteWorker
};
