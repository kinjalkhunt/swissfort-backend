import mongoose from 'mongoose';
import WorkerIssueEntry, { getSizesByProductType } from '../models/workIssue.js';
import Worker from '../models/worker.js';
import Product from '../models/productEntry.js';
import CuttingEntry from '../models/cuttingEntry.js';

const normalizeTrnNo = (trnNo) => {
  if (typeof trnNo !== 'string' || !/^WR\d{4,}$/i.test(trnNo.trim())) {
    const error = new Error('Transaction number must use the WR0001 format.');
    error.statusCode = 400;
    throw error;
  }
  return trnNo.trim().toUpperCase();
};

const getCompletedCuttingRows = async (skuNo, productId) => {
  const rowFilter = { status: 'completed' };
  if (skuNo) rowFilter.skuNo = skuNo;
  if (productId) rowFilter.product = productId;

  const cuttingEntries = await CuttingEntry.find({
    $or: [rowFilter, { productEntries: { $elemMatch: rowFilter } }],
  })
    .select('skuNo product sizes status productEntries')
    .lean();

  return cuttingEntries
    .flatMap((entry) => [
      ...(entry.status === 'completed' ? [entry] : []),
      ...(entry.productEntries || []).filter((p) => p.status === 'completed'),
    ])
    .filter(
      (entry) =>
        (!skuNo || entry.skuNo === skuNo) &&
        (!productId || String(entry.product) === String(productId))
    );
};

const sumSizesByKey = (entries, keyForEntry) => {
  const totals = new Map();
  for (const entry of entries) {
    const key = keyForEntry(entry);
    for (const sizeEntry of entry.entries || entry.sizes || []) {
      const size = sizeEntry.size;
      const pcs = Number(sizeEntry.pcs) || 0;
      if (size && pcs > 0) {
        const mapKey = `${key}:${size}`;
        totals.set(mapKey, (totals.get(mapKey) || 0) + pcs);
      }
    }
  }
  return totals;
};

const getSizeAvailability = async (skuNo, product, excludeEntryId = null) => {
  const cuttingRows = await getCompletedCuttingRows(skuNo, product._id);
  if (cuttingRows.length === 0) {
    const error = new Error(
      `No completed cutting quantities found for SKU "${skuNo}" and this product.`
    );
    error.statusCode = 404;
    throw error;
  }

  const issuedFilter = { skuNo, product: product._id };
  if (excludeEntryId) issuedFilter._id = { $ne: excludeEntryId };

  const issuedEntries = await WorkerIssueEntry.find(issuedFilter)
    .select('entries')
    .lean();

  const cutBySize = sumSizesByKey(cuttingRows, () => skuNo);
  const issuedBySize = sumSizesByKey(issuedEntries, () => skuNo);

  return getSizesByProductType(product.productType)
    .map(({ label, value }) => {
      const key = `${skuNo}:${value}`;
      const cutPcs = cutBySize.get(key) || 0;
      const issuedPcs = issuedBySize.get(key) || 0;
      return {
        size: value,
        cutPcs,
        issuedPcs,
        remainingPcs: Math.max(0, cutPcs - issuedPcs),
      };
    })
    .filter((size) => size.cutPcs > 0);
};

// Generate TRN number
export const generateTrnNo = async () => {
  const [lastEntry] = await WorkerIssueEntry.aggregate([
    { $match: { trnNo: /^WR\d+$/i } },
    {
      $project: {
        number: {
          $toInt: {
            $substrCP: ['$trnNo', 2, { $subtract: [{ $strLenCP: '$trnNo' }, 2] }],
          },
        },
      },
    },
    { $sort: { number: -1 } },
    { $limit: 1 },
  ]);

  return `WR${String((lastEntry?.number || 0) + 1).padStart(4, '0')}`;
};

// Validate entries payload (shared between create & update)
const normalizeAndValidateEntries = (entries, product, remainingBySize, skuNo) => {
  if (!Array.isArray(entries) || entries.length === 0) {
    const error = new Error('At least one size entry is required.');
    error.statusCode = 400;
    throw error;
  }

  const allowedSizes = new Set(
    getSizesByProductType(product.productType).map(({ value }) => value)
  );
  const seenSizes = new Set();

  return entries.map((entry) => {
    const size = typeof entry?.size === 'string' ? entry.size.trim() : '';
    const pcs = Number(entry?.pcs);
    const rate = Number(entry?.rate);

    if (!allowedSizes.has(size)) {
      const error = new Error(
        `Size "${size}" is not valid for ${product.productType} products.`
      );
      error.statusCode = 400;
      throw error;
    }
    if (seenSizes.has(size)) {
      const error = new Error(`Duplicate size "${size}" is not allowed.`);
      error.statusCode = 400;
      throw error;
    }
    const remainingPcs = remainingBySize.get(size) || 0;
    if (pcs > remainingPcs) {
      const error = new Error(
        `Only ${remainingPcs} pcs remain for size "${size}" of SKU "${skuNo}".`
      );
      error.statusCode = 400;
      throw error;
    }
    if (!Number.isInteger(pcs) || pcs < 1) {
      const error = new Error(
        `Pcs for size "${size}" must be a positive whole number.`
      );
      error.statusCode = 400;
      throw error;
    }
    if (
      entry?.rate === undefined ||
      entry.rate === null ||
      entry.rate === '' ||
      !Number.isFinite(rate) ||
      rate < 0
    ) {
      const error = new Error(
        `Rate for size "${size}" must be a non-negative number.`
      );
      error.statusCode = 400;
      throw error;
    }

    seenSizes.add(size);
    return { size, pcs, rate, total: pcs * rate };
  });
};

const parseTrnDate = (value) => {
  if (value === undefined) return new Date();
  if (value === null || value === '') {
    const error = new Error('Transaction date and time must be valid.');
    error.statusCode = 400;
    throw error;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error('Transaction date and time must be valid.');
    error.statusCode = 400;
    throw error;
  }
  return date;
};

// Get initial data
export const getInitialData = async () => {
  const trnDate = new Date();
  const [trnNo, workers, products] = await Promise.all([
    generateTrnNo(),
    Worker.find().select('name workerId').sort({ name: 1 }).lean(),
    Product.find()
      .select('productCode productName productType')
      .sort({ productName: 1 })
      .lean(),
  ]);

  return { trnNo, trnDate, workers, products };
};

// Get available sizes
export const getAvailableSizes = async (skuNo, productId, entryId = null) => {
  if (typeof skuNo !== 'string' || !skuNo.trim()) {
    const error = new Error('SKU number is required.');
    error.statusCode = 400;
    throw error;
  }
  if (!mongoose.isValidObjectId(productId)) {
    const error = new Error('A valid product is required.');
    error.statusCode = 400;
    throw error;
  }

  const product = await Product.findById(productId)
    .select('productName productType')
    .lean();
  if (!product) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }

  const sizes = await getSizeAvailability(
    skuNo.trim(),
    product,
    entryId
  );
  return { skuNo: skuNo.trim(), product, sizes };
};

// Create entry
export const createEntry = async (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    const error = new Error('Request body must be a JSON object.');
    error.statusCode = 400;
    throw error;
  }

  const { worker: workerId, skuNo, product: productId, entries } = data;

  if (!mongoose.isValidObjectId(workerId)) {
    const error = new Error('A valid worker is required.');
    error.statusCode = 400;
    throw error;
  }
  if (!mongoose.isValidObjectId(productId)) {
    const error = new Error('A valid product is required.');
    error.statusCode = 400;
    throw error;
  }
  if (typeof skuNo !== 'string' || !skuNo.trim()) {
    const error = new Error('SKU number is required.');
    error.statusCode = 400;
    throw error;
  }

  const normalizedSkuNo = skuNo.trim();
  const [worker, product] = await Promise.all([
    Worker.findById(workerId).select('name workerId').lean(),
    Product.findById(productId).select('productName productType').lean(),
  ]);

  if (!worker) {
    const error = new Error('Worker not found.');
    error.statusCode = 404;
    throw error;
  }
  if (!product) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }

  const availableSizes = await getSizeAvailability(normalizedSkuNo, product);
  const remainingBySize = new Map(
    availableSizes.map(({ size, remainingPcs }) => [size, remainingPcs])
  );

  const normalizedEntries = normalizeAndValidateEntries(
    entries,
    product,
    remainingBySize,
    normalizedSkuNo
  );

  const trnDate = parseTrnDate(data.trnDate);
  const trnNo = data.trnNo ? normalizeTrnNo(data.trnNo) : await generateTrnNo();

  try {
    const newEntry = new WorkerIssueEntry({
      trnNo,
      worker: worker._id,
      workerDetails: { name: worker.name, workerId: worker.workerId },
      skuNo: normalizedSkuNo,
      product: product._id,
      productDetails: {
        productName: product.productName,
        productType: product.productType,
      },
      entries: normalizedEntries,
      trnDate,
    });

    return await newEntry.save();
  } catch (error) {
    if (error.code === 11000) {
      const conflict = new Error(
        `Transaction number "${trnNo}" already exists. Reload the form to get a new number.`
      );
      conflict.statusCode = 409;
      throw conflict;
    }
    throw error;
  }
};

// 🔥 NEW: Update / Edit entry
export const updateEntry = async (id, data) => {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error('Invalid entry ID.');
    error.statusCode = 400;
    throw error;
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    const error = new Error('Request body must be a JSON object.');
    error.statusCode = 400;
    throw error;
  }

  const existing = await WorkerIssueEntry.findById(id);
  if (!existing) {
    const error = new Error('Entry not found.');
    error.statusCode = 404;
    throw error;
  }

  const {
    worker: workerId,
    skuNo,
    product: productId,
    entries,
  } = data;

  if (!mongoose.isValidObjectId(workerId)) {
    const error = new Error('A valid worker is required.');
    error.statusCode = 400;
    throw error;
  }
  if (!mongoose.isValidObjectId(productId)) {
    const error = new Error('A valid product is required.');
    error.statusCode = 400;
    throw error;
  }
  if (typeof skuNo !== 'string' || !skuNo.trim()) {
    const error = new Error('SKU number is required.');
    error.statusCode = 400;
    throw error;
  }

  const normalizedSkuNo = skuNo.trim();
  const [worker, product] = await Promise.all([
    Worker.findById(workerId).select('name workerId').lean(),
    Product.findById(productId).select('productName productType').lean(),
  ]);

  if (!worker) {
    const error = new Error('Worker not found.');
    error.statusCode = 404;
    throw error;
  }
  if (!product) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }

  // Exclude current entry when computing availability
  const availableSizes = await getSizeAvailability(
    normalizedSkuNo,
    product,
    existing._id
  );
  const remainingBySize = new Map(
    availableSizes.map(({ size, remainingPcs }) => [size, remainingPcs])
  );

  const normalizedEntries = normalizeAndValidateEntries(
    entries,
    product,
    remainingBySize,
    normalizedSkuNo
  );

  const trnDate = parseTrnDate(data.trnDate);

  let trnNo = existing.trnNo;
  if (data.trnNo !== undefined) {
    trnNo = normalizeTrnNo(data.trnNo);
  }

  try {
    existing.trnNo = trnNo;
    existing.worker = worker._id;
    existing.workerDetails = { name: worker.name, workerId: worker.workerId };
    existing.skuNo = normalizedSkuNo;
    existing.product = product._id;
    existing.productDetails = {
      productName: product.productName,
      productType: product.productType,
    };
    existing.entries = normalizedEntries;
    existing.trnDate = trnDate;

    return await existing.save();
  } catch (error) {
    if (error.code === 11000) {
      const conflict = new Error(
        `Transaction number "${trnNo}" already exists.`
      );
      conflict.statusCode = 409;
      throw conflict;
    }
    throw error;
  }
};

export const getAllEntries = async () => {
  return WorkerIssueEntry.find()
    .populate('worker', 'name workerId')
    .populate('product', 'productCode productName productType')
    .sort({ trnDate: -1, createdAt: -1 });
};

export const getEntryById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error('Invalid entry ID.');
    error.statusCode = 400;
    throw error;
  }
  const entry = await WorkerIssueEntry.findById(id)
    .populate('worker', 'name workerId')
    .populate('product', 'productCode productName productType');
  if (!entry) {
    const error = new Error('Entry not found.');
    error.statusCode = 404;
    throw error;
  }
  return entry;
};

export const deleteEntry = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error('Invalid entry ID.');
    error.statusCode = 400;
    throw error;
  }
  const entry = await WorkerIssueEntry.findByIdAndDelete(id);
  if (!entry) {
    const error = new Error('Entry not found.');
    error.statusCode = 404;
    throw error;
  }
  return entry;
};

export const deleteMultipleEntries = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0 || !ids.every(mongoose.isValidObjectId)) {
    const error = new Error('A non-empty array of valid entry IDs is required.');
    error.statusCode = 400;
    throw error;
  }
  return WorkerIssueEntry.deleteMany({ _id: { $in: ids } });
};

export default {
  generateTrnNo,
  getInitialData,
  getAvailableSizes,
  createEntry,
  updateEntry,
  getAllEntries,
  getEntryById,
  deleteEntry,
  deleteMultipleEntries,
};