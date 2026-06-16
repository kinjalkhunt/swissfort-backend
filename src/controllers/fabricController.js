// import { createEntry as _createEntry, getAllEntries as _getAllEntries, getEntryById as _getEntryById, updateEntry as _updateEntry, deleteEntry as _deleteEntry, addEntryToFabric as _addEntryToFabric, deleteEntryFromFabric as _deleteEntryFromFabric } from '../services/fabricService.js';

// const createEntry = async (req, res) => {
//     try {
//         const entry = await _createEntry(req.body);
//         res.status(201).json({
//             success: true,
//             message: 'Fabric entry created successfully',
//             data: entry
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// }

// const getAllEntries = async (req, res) => {
//     try {
//         const { party, year, startDate, endDate, search, page, limit } = req.query;
//         const result = await _getAllEntries({ party, year, startDate, endDate, search, page, limit });
//         res.status(200).json({
//             success: true,
//             data: result.entries,
//             pagination: result.pagination
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// }

// const getEntryById = async (req, res) => {
//     try {
//         const entry = await _getEntryById(req.params.id);
//         res.status(200).json({
//             success: true,
//             data: entry
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// }

// const updateEntry = async (req, res) => {
//     try {
//         const entry = await _updateEntry(req.params.id, req.body);
//         res.status(200).json({
//             success: true,
//             message: 'Fabric entry updated successfully',
//             data: entry
//         });
//     } catch (error) {
//         const statusCode = error.name === 'ValidationError' ? 400 : 500;
//         res.status(statusCode).json({
//             success: false,
//             message: error.message
//         });
//     }
// }

// const deleteEntry = async (req, res) => {
//     try {
//         await _deleteEntry(req.params.id);
//         res.status(200).json({
//             success: true,
//             message: 'Fabric entry deleted successfully'
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// }

// const deleteEntryFromFabric = async (req, res) => {
//     try {
//         const { fabricId, entryId } = req.params;
//         const result = await _deleteEntryFromFabric(fabricId, entryId);
//         res.status(200).json({
//             success: true,
//             message: 'Entry deleted successfully',
//             data: result
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// }


// const addEntryToFabric = async (req, res) => {
//     try {
//         const entry = await _addEntryToFabric(req.params.id, req.body);
//         res.status(200).json({
//             success: true,
//             message: 'Entry added successfully',
//             data: entry
//         });
//     } catch (error) {
//         const statusCode = error.name === 'ValidationError' ? 400 : 500;
//         res.status(statusCode).json({
//             success: false,
//             message: error.message
//         });
//     }
// }

// export default {
//     createEntry,
//     getAllEntries,
//     getEntryById,
//     updateEntry,
//     deleteEntry,
//     addEntryToFabric,
//     deleteEntryFromFabric

// };


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