import fs from 'fs/promises';
import Worker, { MOBILE_REGEX } from '../models/worker.js';
import User from '../models/User.js';
import { generateWorkerId, peekNextWorkerId } from '../utils/generateWorkerId.js';

const EDITABLE_FIELDS = ['name', 'mobile1', 'mobile2', 'address', 'workerDetails', 'proofImage'];

const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const removeFile = async (filePath) => {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch {
    // file already removed or never existed
  }
};

// Admin sees every worker, a worker sees only their own profile,
// any other role sees only the workers they created.
const scopeFor = (user) => {
  if (user.role === 'admin') return {};

  if (user.role === 'worker') {
    const own = [{ createdBy: user._id }];
    if (user.workerId) own.push({ workerId: user.workerId });
    return { $or: own };
  }

  return { createdBy: user._id };
};

const pickEditable = (data) =>
  EDITABLE_FIELDS.reduce((acc, field) => {
    if (data[field] !== undefined) {
      acc[field] = typeof data[field] === 'string' ? data[field].trim() : data[field];
    }
    return acc;
  }, {});

const validateMobiles = async ({ mobile1, mobile2 }, excludeId = null) => {
  if (mobile1 !== undefined) {
    if (!MOBILE_REGEX.test(mobile1)) {
      throw httpError(400, 'Mobile 1 must be a valid 10 digit mobile number');
    }

    const duplicate = await Worker.findOne({
      mobile1,
      ...(excludeId && { _id: { $ne: excludeId } })
    }).lean();

    if (duplicate) {
      throw httpError(409, 'Worker with this mobile number already exists');
    }
  }

  if (mobile2) {
    if (!MOBILE_REGEX.test(mobile2)) {
      throw httpError(400, 'Mobile 2 must be a valid 10 digit mobile number');
    }
    if (mobile1 && mobile1 === mobile2) {
      throw httpError(400, 'Mobile 1 and Mobile 2 cannot be the same');
    }
  }
};

const findOwnProfile = (user) => Worker.findOne(scopeFor(user));

// NEXT WORKER ID (pre-filled on the Worker Master form)
const getNextWorkerId = async (user) => {
  if (user.role === 'worker') {
    const worker = await findOwnProfile(user);
    if (worker) {
      return {
        success: true,
        workerId: worker.workerId,
        hasProfile: true,
        worker
      };
    }
  }

  return {
    success: true,
    workerId: await peekNextWorkerId(),
    hasProfile: false
  };
};

// CREATE WORKER
const createWorker = async (data, user) => {
  const isSelf = user.role === 'worker';
  const fields = pickEditable(data);

  if (isSelf && (await findOwnProfile(user))) {
    throw httpError(409, 'Your worker profile already exists. Please edit it instead.');
  }

  if (!fields.mobile1) {
    throw httpError(400, 'Mobile 1 required');
  }

  await validateMobiles(fields);

  const accountEmail = `${fields.mobile1}@swissfort.local`;
  if (!isSelf && (await User.findOne({ email: accountEmail }).lean())) {
    throw httpError(409, 'A user account for this mobile number already exists');
  }

  const workerId = await generateWorkerId();

  const worker = await Worker.create({
    ...fields,
    mobile2: fields.mobile2 || '',
    workerId,
    createdBy: user._id
  });

  // Worker filled their own identity: link it to their login
  if (isSelf) {
    await User.updateOne({ _id: user._id }, { $set: { workerId } });

    return {
      success: true,
      message: 'Worker profile created successfully',
      worker
    };
  }

  // Admin/master created a worker: create a login account for them
  const defaultPassword = data.password || fields.mobile1;

  let account;
  try {
    account = await User.create({
      name: fields.name,
      email: accountEmail,
      password: defaultPassword,
      role: 'worker',
      workerId
    });
  } catch (error) {
    await Worker.deleteOne({ _id: worker._id });
    throw error;
  }

  return {
    success: true,
    message: 'Worker created successfully with user account',
    worker,
    user: {
      _id: account._id,
      name: account.name,
      email: account.email,
      role: account.role,
      workerId: account.workerId,
      defaultPassword
    }
  };
};

// GET ALL WORKERS
const getAllWorkers = async (filters, user) => {
  const page = Math.max(parseInt(filters.page, 10) || 1, 1);
  const limit = Math.max(parseInt(filters.limit, 10) || 10, 1);
  const { workerDetails, search } = filters;

  const conditions = [scopeFor(user)];

  if (workerDetails) {
    conditions.push({ workerDetails: String(workerDetails).toLowerCase() });
  }

  if (search) {
    const regex = { $regex: escapeRegex(String(search)), $options: 'i' };
    conditions.push({
      $or: [{ name: regex }, { workerId: regex }, { mobile1: regex }, { mobile2: regex }]
    });
  }

  const query = { $and: conditions };

  const [workers, total] = await Promise.all([
    Worker.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Worker.countDocuments(query)
  ]);

  return {
    success: true,
    workers,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// GET WORKER BY ID
const getWorkerById = async (workerId, user) => {
  const worker = await Worker.findOne({ $and: [{ workerId }, scopeFor(user)] });

  if (!worker) {
    throw httpError(404, 'Worker not found');
  }

  return {
    success: true,
    worker
  };
};

// UPDATE WORKER
const updateWorker = async (workerId, data, user) => {
  const worker = await Worker.findOne({ $and: [{ workerId }, scopeFor(user)] });

  if (!worker) {
    throw httpError(404, 'Worker not found');
  }

  const fields = pickEditable(data);

  await validateMobiles(
    {
      mobile1: fields.mobile1 !== undefined && fields.mobile1 !== worker.mobile1 ? fields.mobile1 : undefined,
      mobile2: fields.mobile2
    },
    worker._id
  );

  const finalMobile2 = fields.mobile2 !== undefined ? fields.mobile2 : worker.mobile2;
  const finalMobile1 = fields.mobile1 !== undefined ? fields.mobile1 : worker.mobile1;
  if (finalMobile2 && finalMobile1 === finalMobile2) {
    throw httpError(400, 'Mobile 1 and Mobile 2 cannot be the same');
  }

  const oldProof = worker.proofImage;

  Object.assign(worker, fields);
  await worker.save();

  if (fields.proofImage && fields.proofImage !== oldProof) {
    await removeFile(oldProof);
  }

  return {
    success: true,
    message: 'Worker updated successfully',
    worker
  };
};

// DELETE WORKER
const deleteWorker = async (workerId, user) => {
  const worker = await Worker.findOne({ $and: [{ workerId }, scopeFor(user)] });

  if (!worker) {
    throw httpError(404, 'Worker not found');
  }

  await Worker.deleteOne({ _id: worker._id });
  await User.updateMany({ workerId }, { $set: { workerId: null } });
  await removeFile(worker.proofImage);

  return {
    success: true,
    message: 'Worker deleted successfully'
  };
};

export default {
  getNextWorkerId,
  createWorker,
  getAllWorkers,
  getWorkerById,
  updateWorker,
  deleteWorker
};
