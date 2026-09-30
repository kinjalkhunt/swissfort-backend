import fs from 'fs/promises';
import workerServices from '../services/workerServices.js';

const sendError = (res, error) => {
  let statusCode = error.statusCode || 500;
  let message = error.message;

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors)[0]?.message || message;
  }

  if (error.code === 11000) {
    statusCode = 409;
    message = `Worker with this ${Object.keys(error.keyValue || {})[0] || 'value'} already exists`;
  }

  res.status(statusCode).json({ success: false, message });
};

const discardUpload = async (req) => {
  if (!req.file) return;
  try {
    await fs.unlink(req.file.path);
  } catch {
    // ignore
  }
};

const withProof = (req) => ({
  ...req.body,
  ...(req.file && { proofImage: req.file.path.replace(/\\/g, '/') })
});

// GET NEXT WORKER ID
const getNextWorkerId = async (req, res) => {
  try {
    const result = await workerServices.getNextWorkerId(req.user);
    res.status(200).json(result);
  } catch (error) {
    sendError(res, error);
  }
};

// CREATE WORKER
const createWorker = async (req, res) => {
  try {
    const result = await workerServices.createWorker(withProof(req), req.user);
    res.status(201).json(result);
  } catch (error) {
    await discardUpload(req);
    sendError(res, error);
  }
};

// GET ALL WORKERS
const getAllWorkers = async (req, res) => {
  try {
    const result = await workerServices.getAllWorkers(req.query, req.user);
    res.status(200).json(result);
  } catch (error) {
    sendError(res, error);
  }
};

// GET WORKER BY ID
const getWorkerById = async (req, res) => {
  try {
    const result = await workerServices.getWorkerById(req.params.workerId, req.user);
    res.status(200).json(result);
  } catch (error) {
    sendError(res, error);
  }
};

// UPDATE WORKER
const updateWorker = async (req, res) => {
  try {
    const result = await workerServices.updateWorker(req.params.workerId, withProof(req), req.user);
    res.status(200).json(result);
  } catch (error) {
    await discardUpload(req);
    sendError(res, error);
  }
};

// DELETE WORKER
const deleteWorker = async (req, res) => {
  try {
    const result = await workerServices.deleteWorker(req.params.workerId, req.user);
    res.status(200).json(result);
  } catch (error) {
    sendError(res, error);
  }
};

export default {
  getNextWorkerId,
  createWorker,
  getAllWorkers,
  getWorkerById,
  updateWorker,
  deleteWorker
};
