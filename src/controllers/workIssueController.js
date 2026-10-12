import WorkerIssueService from '../services/workIssueService.js';

const handleError = (error, res, next) => {
  if (
    Number.isInteger(error.statusCode) &&
    error.statusCode >= 400 &&
    error.statusCode < 500
  ) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }
  return next(error);
};

export const getInitData = async (req, res, next) => {
  try {
    const data = await WorkerIssueService.getInitialData();
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAvailableSizes = async (req, res, next) => {
  try {
    const data = await WorkerIssueService.getAvailableSizes(
      req.query.skuNo,
      req.query.productId,
      req.query.entryId || null // optional — used for edit mode
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createEntry = async (req, res, next) => {
  try {
    const result = await WorkerIssueService.createEntry(req.body);
    res.status(201).json({
      success: true,
      message: 'Worker issue entry created successfully.',
      data: result,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

// 🔥 NEW: Update entry
export const updateEntry = async (req, res, next) => {
  try {
    const result = await WorkerIssueService.updateEntry(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Worker issue entry updated successfully.',
      data: result,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllEntries = async (req, res, next) => {
  try {
    const result = await WorkerIssueService.getAllEntries();
    res.status(200).json({ success: true, count: result.length, data: result });
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getEntryById = async (req, res, next) => {
  try {
    const result = await WorkerIssueService.getEntryById(req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteEntry = async (req, res, next) => {
  try {
    await WorkerIssueService.deleteEntry(req.params.id);
    res.status(200).json({ success: true, message: 'Entry deleted.' });
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteMultipleEntries = async (req, res, next) => {
  try {
    const result = await WorkerIssueService.deleteMultipleEntries(req.body?.ids);
    res.status(200).json({
      success: true,
      message: 'Entries deleted.',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};