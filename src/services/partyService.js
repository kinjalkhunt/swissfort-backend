import Party from '../models/party.js';
import json2csv from 'json2csv';
const { Parser } = json2csv;


const createParty = async (partyData) => {
    console.log('[PartyService] Creating new party:', partyData.name);
    partyData.year = new Date().getFullYear();
    const party = new Party(partyData);
    return party.save();
};

const getAllParties = async (filters = {}) => {
    const query = {};
    if (filters.type) query.type = filters.type;
    if (filters.group) query.group = filters.group;
    if (filters.year) query.year = filters.year;
    if (filters.search) {
        query.$or = [
            { name: { $regex: filters.search, $options: 'i' } },
            { code: { $regex: filters.search, $options: 'i' } },
            { mobileNo1: { $regex: filters.search, $options: 'i' } }
        ];
    }
    return Party.find(query).sort({ createdAt: -1 });
};

const getPartyById = async (id) => {
    const party = await Party.findById(id);
    if (!party) throw new Error('Party not found');
    return party;
};

const updateParty = async (id, updateData) => {
    const party = await Party.findByIdAndUpdate(id, updateData, { returnDocument: 'after', runValidators: true });
    if (!party) throw new Error('Party not found');
    return party;
};

const deleteParty = async (id) => {
    console.log('[PartyService] Deleting party with ID:', id);
    const party = await Party.findByIdAndDelete(id);
    if (!party) throw new Error('Party not found');
    return party;
};

const getPartiesByType = async (type) => {
    return Party.find({ type }).sort({ createdAt: -1 });
};

const exportPartiesToCSV = async (filters = {}) => {
    console.log('[PartyService] Exporting parties to CSV with filters:', filters);
    const query = {};
    if (filters.type) query.type = filters.type;
    if (filters.group) query.group = filters.group;
    if (filters.year) query.year = filters.year;
    if (filters.search) {
        query.$or = [
            { name: { $regex: filters.search, $options: 'i' } },
            { code: { $regex: filters.search, $options: 'i' } },
            { mobileNo1: { $regex: filters.search, $options: 'i' } }
        ];
    }

    const parties = await Party.find(query).sort({ createdAt: -1 });

    // Define CSV fields
    const fields = [
        { label: 'Code', value: 'code' },
        { label: 'Name', value: 'name' },
        { label: 'Type', value: 'type' },
        { label: 'Address', value: 'address' },
        { label: 'Mobile 1', value: 'mobileNo1' },
        { label: 'Mobile 2', value: 'mobileNo2' },
        { label: 'GST No.', value: 'gstNo' },
        { label: 'State Code', value: 'stateCode' },
        { label: 'State Name', value: 'stateName' }
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(parties);

    return csv;
};

export {
    createParty,
    getAllParties,
    getPartyById,
    updateParty,
    deleteParty,
    getPartiesByType,
    exportPartiesToCSV

};

export default {
    createParty,
    getAllParties,
    getPartyById,
    updateParty,
    deleteParty,
    getPartiesByType,
    exportPartiesToCSV

};