import Worker from '../models/worker.js';
import User from '../models/User.js';
import json2csv from 'json2csv';

const { Parser } = json2csv;

const buildWorkerQuery = (filters = {}, user) => {
  const { workerDetails, search } = filters;
  const conditions = [];

  if (user.role === 'worker') {
    conditions.push({
      $or: [{ userId: user._id }, ...(user.workerId ? [{ workerId: user.workerId }] : [])]
    });
  }

  if (workerDetails) {
    conditions.push({ workerDetails });
  }

  if (search) {
    conditions.push({ $or: [
      { name: { $regex: search, $options: 'i' } },
      { workerId: { $regex: search, $options: 'i' } },
      { mobile1: { $regex: search, $options: 'i' } }
    ] });
  }

  return conditions.length ? { $and: conditions } : {};
};

// CREATE WORKER
const createWorker = async (user, data) => {
  const { name, mobile1, mobile2, address, workerDetails, proofImage, password } = data;

  const existingWorker = await Worker.findOne({ mobile1 });
  if (existingWorker) {
    throw new Error('Worker with this mobile number already exists');
  }

  if (user.role === 'worker') {
    const existingProfile = await Worker.findOne({
      $or: [{ userId: user._id }, ...(user.workerId ? [{ workerId: user.workerId }] : [])]
    });
    if (existingProfile) {
      throw new Error('Worker profile already exists');
    }
  } else if (user.role !== 'admin') {
    throw new Error('Only workers can create their own profile');
  }

  const workerId = await Worker.generateWorkerId();
  let linkedUser = user;

  if (user.role === 'admin') {
    const userEmail = `${mobile1}@swissfort.local`;
    if (await User.findOne({ email: userEmail })) {
      throw new Error('A user account with this mobile number already exists');
    }

    linkedUser = await User.create({
      name,
      email: userEmail,
      password: password || mobile1,
      role: 'worker',
      workerId,
      permissions: {}
    });
  }

  const worker = await Worker.create({
    workerId,
    name,
    mobile1,
    mobile2: mobile2 || '',
    address,
    workerDetails,
    proofImage,
    userId: linkedUser._id,
    createdBy: user._id
  });

  linkedUser.workerId = workerId;
  linkedUser.name = name;
  await linkedUser.save();

  return {
    success: true,
    message: user.role === 'admin' ? 'Worker created successfully with user account' : 'Worker profile created successfully',
    worker,
    ...(user.role === 'admin' && {
      user: {
        _id: linkedUser._id,
        name: linkedUser.name,
        email: linkedUser.email,
        role: linkedUser.role,
        workerId: linkedUser.workerId,
        defaultPassword: password || mobile1
      }
    })
  };
};

// GET ALL WORKERS
const getAllWorkers = async (filters = {}, user) => {
  const { page = 1, limit = 10 } = filters;
  const query = buildWorkerQuery(filters, user);

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

// EXPORT WORKERS
const exportWorkersToCSV = async (filters = {}, user) => {
  const workers = await Worker.find(buildWorkerQuery(filters, user)).sort({ createdAt: -1 });
  const fields = [
    { label: 'Worker ID', value: 'workerId' },
    { label: 'Name', value: 'name' },
    { label: 'Mobile 1', value: 'mobile1' },
    { label: 'Mobile 2', value: 'mobile2' },
    { label: 'Address', value: 'address' },
    { label: 'Worker Details', value: 'workerDetails' },
    { label: 'Proof Image', value: 'proofImage' }
  ];

  return new Parser({ fields }).parse(workers);
};

// GET WORKER BY ID
const getWorkerById = async (workerId, user) => {
  const query = { workerId };
  if (user.role === 'worker') {
    query.$or = [{ userId: user._id }, ...(user.workerId ? [{ workerId: user.workerId }] : [])];
  }
  const worker = await Worker.findOne(query);

  if (!worker) {
    throw new Error('Worker not found');
  }

  return {
    success: true,
    worker
  };
};

// UPDATE WORKER
const updateWorker = async (workerId, data, user) => {
  const query = { workerId };
  if (user.role === 'worker') {
    query.$or = [{ userId: user._id }, ...(user.workerId ? [{ workerId: user.workerId }] : [])];
  }
  const worker = await Worker.findOne(query);

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

  const { workerId: ignoredWorkerId, userId: ignoredUserId, createdBy: ignoredCreatedBy, ...updates } = data;
  Object.assign(worker, updates);
  await worker.save();

  return {
    success: true,
    message: 'Worker updated successfully',
    worker
  };
};

// DELETE WORKER
const deleteWorker = async (workerId, user) => {
  const query = { workerId };
  if (user.role === 'worker') {
    query.$or = [{ userId: user._id }, ...(user.workerId ? [{ workerId: user.workerId }] : [])];
  }
  const worker = await Worker.findOne(query);

  if (!worker) {
    throw new Error('Worker not found');
  }

  await Worker.deleteOne({ _id: worker._id });

  const linkedUser = await User.findOne(worker.userId ? { _id: worker.userId } : { workerId });
  if (linkedUser) {
    linkedUser.workerId = null;
    await linkedUser.save();
  }

  return {
    success: true,
    message: 'Worker deleted successfully'
  };
};

export default {
  createWorker,
  getAllWorkers,
  exportWorkersToCSV,
  getWorkerById,
  updateWorker,
  deleteWorker
};
