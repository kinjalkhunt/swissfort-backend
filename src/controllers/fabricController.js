import { createEntry as _createEntry, getAllEntries as _getAllEntries, getEntryById as _getEntryById, updateEntry as _updateEntry, deleteEntry as _deleteEntry, addEntryToFabric as _addEntryToFabric } from '../services/fabricService.js';

const createEntry = async (req, res) => {
    try {
        const entry = await _createEntry(req.body);
        res.status(201).json({
            success: true,
            message: 'Fabric entry created successfully',
                data: entry
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    const getAllEntries = async (req, res) => {
        try {
            const { party, year, startDate, endDate, search } = req.query;
            const entries = await _getAllEntries({ party, year, startDate, endDate, search });
            res.status(200).json({
                success: true,
                count: entries.length,
                data: entries
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    const getEntryById = async (req, res) => {
        try {
            const entry = await _getEntryById(req.params.id);
            res.status(200).json({
                success: true,
                data: entry
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    const updateEntry = async (req, res) => {
        try {
            const entry = await _updateEntry(req.params.id, req.body);
            res.status(200).json({
                success: true,
                message: 'Fabric entry updated successfully',
                data: entry
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    const deleteEntry = async (req, res) => {
        try {
            await _deleteEntry(req.params.id);
            res.status(200).json({
                success: true,
                message: 'Fabric entry deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    const addEntryToFabric = async (req, res) => {
        try {
            const entry = await _addEntryToFabric(req.params.id, req.body);
            res.status(200).json({
                success: true,
                message: 'Entry added successfully',
                data: entry
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

export default {
    createEntry,
    getAllEntries,
    getEntryById,
    updateEntry,
    deleteEntry,
    addEntryToFabric
};