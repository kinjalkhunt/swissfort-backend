import asyncHandler from '../utils/asyncHandler.js';
import {
    getNextTrnNoService,
    createFabricEntryService,
    getAllFabricEntriesService,
    getFabricEntryByIdService,
    getFabricEntryByTrnNoService,
    updateFabricEntryService,
    deleteFabricEntryService,
    addLineEntryService,
    updateLineEntryService,
    deleteLineEntryService,
    getFabricSummaryService,
} from '../services/fabricService.js';

// GET /api/fabric-entry/next-trn
export const getNextTrnNo = asyncHandler(async (req, res) => {
    const data = await getNextTrnNoService();
    res.status(200).json({ success: true, ...data });
});

// POST /api/fabric-entry
export const createFabricEntry = asyncHandler(async (req, res) => {
    const fabric = await createFabricEntryService(req.body);
    res.status(201).json({ success: true, message: 'Fabric entry created.', data: fabric });
});

export const getDraftEntry = asyncHandler(async (req, res) => {
  const result = await getAllFabricEntriesService({
    status: 'draft',
    limit : 1,
    page  : 1,
  });
  res.status(200).json({
    success: true,
    data   : result.data[0] || null,
  });
});

// GET /api/fabric-entry
export const getAllFabricEntries = asyncHandler(async (req, res) => {
    const result = await getAllFabricEntriesService(req.query);
    res.status(200).json({ success: true, ...result });
});

// GET /api/fabric-entry/:id
export const getFabricEntryById = asyncHandler(async (req, res) => {
    const fabric = await getFabricEntryByIdService(req.params.id);
    res.status(200).json({ success: true, data: fabric });
});

// GET /api/fabric-entry/trn/:trnNo
export const getFabricEntryByTrnNo = asyncHandler(async (req, res) => {
    const fabric = await getFabricEntryByTrnNoService(req.params.trnNo);
    res.status(200).json({ success: true, data: fabric });
});

// PUT /api/fabric-entry/:id
export const updateFabricEntry = asyncHandler(async (req, res) => {
    const fabric = await updateFabricEntryService(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Fabric entry updated.', data: fabric });
});

// DELETE /api/fabric-entry/:id
export const deleteFabricEntry = asyncHandler(async (req, res) => {
    await deleteFabricEntryService(req.params.id);
    res.status(200).json({ success: true, message: 'Fabric entry deleted.' });
});

// POST /api/fabric-entry/:id/entry
export const addLineEntry = asyncHandler(async (req, res) => {
    const { entryId, fabric } = await addLineEntryService(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Line entry added.', entryId, data: fabric });
});

// PUT /api/fabric-entry/:id/entry/:entryId
export const updateLineEntry = asyncHandler(async (req, res) => {
    const fabric = await updateLineEntryService(req.params.id, req.params.entryId, req.body);
    res.status(200).json({ success: true, message: 'Line entry updated.', data: fabric });
});

// DELETE /api/fabric-entry/:id/entry/:entryId
export const deleteLineEntry = asyncHandler(async (req, res) => {
    const fabric = await deleteLineEntryService(req.params.id, req.params.entryId);
    res.status(200).json({ success: true, message: 'Line entry deleted.', data: fabric });
});

// GET /api/fabric-entry/:id/summary
export const getFabricSummary = asyncHandler(async (req, res) => {
    const summary = await getFabricSummaryService(req.params.id);
    res.status(200).json({ success: true, data: summary });
});