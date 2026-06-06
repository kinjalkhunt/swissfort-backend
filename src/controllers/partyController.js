import { createParty as _createParty, getAllParties as _getAllParties, getPartyById as _getPartyById, updateParty as _updateParty, deleteParty as _deleteParty, getPartiesByType as _getPartiesByType } from '../services/partyService.js';

 const createParty = async (req, res) => {
        try {
            const party = await _createParty(req.body);
            res.status(201).json({
                success: true,
                message: 'Party created successfully',
                data: party
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    const getAllParties = async (req, res) => {
        try {
            const { type, group, year, search } = req.query;
            const parties = await _getAllParties({ type, group, year, search });
            res.status(200).json({
                success: true,
                count: parties.length,
                data: parties
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    const getPartyById = async (req, res) => {
        try {
            const party = await _getPartyById(req.params.id);
            res.status(200).json({
                success: true,
                data: party
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    const updateParty = async (req, res) => {
        try {
            const party = await _updateParty(req.params.id, req.body);
            res.status(200).json({
                success: true,
                message: 'Party updated successfully',
                data: party
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    const deleteParty = async (req, res) => {
        try {
            await _deleteParty(req.params.id);
            res.status(200).json({
                success: true,
                message: 'Party deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    const getPartiesByType = async (req, res) => {
        try {
            const parties = await _getPartiesByType(req.params.type);
            res.status(200).json({
                success: true,
                data: parties
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }


export default {
    createParty,
    getAllParties,
    getPartyById,
    updateParty,
    deleteParty,
    getPartiesByType
};