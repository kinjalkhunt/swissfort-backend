import workerServices from '../services/workerServices.js';
import { basename } from 'node:path';

const formatWorkerImages = (result, req) => {
  const imageUrl = (proofImage) => {
    if (!proofImage) return proofImage;
    const filename = basename(proofImage.replace(/\\/g, '/'));
    return `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(filename)}`;
  };

  if (result.worker) {
    result.worker = { ...result.worker.toObject(), proofImage: imageUrl(result.worker.proofImage) };
  }
  if (result.workers) {
    result.workers = result.workers.map((worker) => ({
      ...worker.toObject(),
      proofImage: imageUrl(worker.proofImage)
    }));
  }
  return result;
};

// CREATE WORKER
const createWorker = async (req, res) => {
  try {
    const data = {
      ...req.body,
      proofImage: req.file ? req.file.path : req.body.proofImage
    };

    const result = await workerServices.createWorker(req.user, data);
    res.status(201).json(formatWorkerImages(result, req));
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
    };

    const result = await workerServices.getAllWorkers(filters, req.user);
    res.status(200).json(formatWorkerImages(result, req));
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
    
    const result = await workerServices.getWorkerById(workerId, req.user);
    res.status(200).json(formatWorkerImages(result, req));
  } catch (error) {
    res.status(error.message.startsWith('Access denied') ? 403 : 404).json({
      success: false,
      message: error.message
    });
  }
};

// UPDATE WORKER
const updateWorker = async (req, res) => {
  try {
    const { workerId } = req.params;
    
    const data = {
      ...req.body,
      proofImage: req.file ? req.file.path : req.body.proofImage
    };

    const result = await workerServices.updateWorker(workerId, data, req.user);
    res.status(200).json(formatWorkerImages(result, req));
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
    const result = await workerServices.deleteWorker(workerId, req.user);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

// EXPORT WORKERS
const exportWorkers = async (req, res) => {
  try {
    const csv = await workerServices.exportWorkersToCSV({
      workerDetails: req.query.workerDetails,
      search: req.query.search
    }, req.user);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=Workers_${new Date().toISOString().split('T')[0]}.csv`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({
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
  deleteWorker,
  exportWorkers
};
