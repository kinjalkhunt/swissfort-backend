import Worker from '../models/worker.js';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// CREATE WORKER
const createWorker = async (data) => {
  const { name, mobile1, mobile2, address, workerDetails, proofImage, password } = data;

  // Check if mobile1 already exists
  const existingWorker = await Worker.findOne({ mobile1 });
  if (existingWorker) {
    throw new Error('Worker with this mobile number already exists');
  }

  // Generate worker ID
  const workerId = await Worker.generateWorkerId();

  const worker = await Worker.create({
    workerId,
    name,
    mobile1,
    mobile2: mobile2 || '',
    address,
    workerDetails,
    proofImage
  });

  // Create user account for worker
  const defaultPassword = password || mobile1; // Default password is mobile number if not provided
  const userEmail = `${mobile1}@swissfort.local`; // Generate email from mobile number

  const user = await User.create({
    name,
    email: userEmail,
    password: defaultPassword,
    role: 'worker',
    workerId: workerId,
    permissions: {
      fabricEntry: false,
      cuttingEntry: false,
      workerEntry: false,
      stock: false,
      partyMaster: false,
      productMaster: false,
      workerMaster: false,
      dashboard: false
    }
  });

  return {
    success: true,
    message: 'Worker created successfully with user account',
    worker,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      workerId: user.workerId,
      defaultPassword: defaultPassword
    }
  };
};

// GET ALL WORKERS
const getAllWorkers = async (filters = {}) => {
  const { page = 1, limit = 10, workerDetails, search, workerId } = filters;

  let query = {};

  // If workerId is provided (logged-in worker), filter to only their data
  if (workerId) {
    query.workerId = workerId;
  }

  if (workerDetails) {
    query.workerDetails = workerDetails;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { workerId: { $regex: search, $options: 'i' } },
      { mobile1: { $regex: search, $options: 'i' } }
    ];
  }

  const workers = await Worker.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Worker.countDocuments(query);

  return {
    success: true,
    workers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// GET WORKER BY ID
const getWorkerById = async (workerId) => {
  const worker = await Worker.findOne({ workerId });

  if (!worker) {
    throw new Error('Worker not found');
  }

  return {
    success: true,
    worker
  };
};

// UPDATE WORKER
const updateWorker = async (workerId, data) => {
  const worker = await Worker.findOne({ workerId });

  if (!worker) {
    throw new Error('Worker not found');
  }

  // Check if mobile1 is being updated and if it already exists
  if (data.mobile1 && data.mobile1 !== worker.mobile1) {
    const existingWorker = await Worker.findOne({ mobile1: data.mobile1 });
    if (existingWorker) {
      throw new Error('Worker with this mobile number already exists');
    }
  }

  Object.assign(worker, data);
  await worker.save();

  return {
    success: true,
    message: 'Worker updated successfully',
    worker
  };
};

// DELETE WORKER
const deleteWorker = async (workerId) => {
  const worker = await Worker.findOne({ workerId });

  if (!worker) {
    throw new Error('Worker not found');
  }

  await Worker.deleteOne({ workerId });

  return {
    success: true,
    message: 'Worker deleted successfully'
  };
};

export default {
  createWorker,
  getAllWorkers,
  getWorkerById,
  updateWorker,
  deleteWorker
};
