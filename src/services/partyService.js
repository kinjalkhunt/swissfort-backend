import Party from '../models/party.js';

const createParty = async (partyData) => {
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
    const party = await Party.findByIdAndDelete(id);
    if (!party) throw new Error('Party not found');
    return party;
};

const getPartiesByType = async (type) => {
    return Party.find({ type }).sort({ createdAt: -1 });
};

export {
    createParty,
    getAllParties,
    getPartyById,
    updateParty,
    deleteParty,
    getPartiesByType
};

export default {
    createParty,
    getAllParties,
    getPartyById,
    updateParty,
    deleteParty,
    getPartiesByType
};