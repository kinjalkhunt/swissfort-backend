/* eslint-disable no-unused-vars */
import FabricEntry from '../models/fabricEntry.js';
import Party from '../models/party.js';

const calculateEntryAmounts = (entry) => {
    const meter = Number(entry.meter) || 0;
    const rate = Number(entry.rate) || 0;
    const disPercent = Number(entry.disPercent) || 0;
    const cgstPercent = Number(entry.cgstPercent) || 0;
    const sgstPercent = Number(entry.sgstPercent) || 0;

    const amount = meter * rate;
    const disAmount = (amount * disPercent) / 100;
    const afterDis = amount - disAmount;
    const cgstAmount = (afterDis * cgstPercent) / 100;
    const sgstAmount = (afterDis * sgstPercent) / 100;
    const finalAmount = afterDis + cgstAmount + sgstAmount;

    return {
        ...entry,
        meter,
        rate,
        amount,
        disAmount,
        disPercent: disPercent,
        cgstPercent: cgstPercent,
        sgstPercent: sgstPercent,
        cgstAmount,
        sgstAmount,
        finalAmount
    };
};

export const createEntry = async (entryData) => {
    console.log('[FabricService] Attempting to create entry for party:', entryData.party);
    const party = await Party.findById(entryData.party);
    if (!party) {
        console.error('[FabricService] Create Error: Party not found for ID:', entryData.party);
        throw new Error('Party not found');
    }

    const entries = (entryData.entries || []).map(calculateEntryAmounts);
    const totalAmount = entries.reduce((sum, entry) => sum + (entry.finalAmount || 0), 0);

    const fabricEntry = new FabricEntry({
        ...entryData,
        entries,
        totalAmount,
        partyDetails: {
            name: party.name,
            code: party.code,
            gstNo: party.gstNo,
            address: party.address
        },
        year: entryData.year || new Date().getFullYear()
    });

    const savedEntry = await fabricEntry.save();
    console.log('[FabricService] Success: Entry saved with ID:', savedEntry._id);
    
    // Return the populated document
    return await FabricEntry.findById(savedEntry._id)
        .populate('party', 'name code mobileNo1')
        .lean();
};

export const getAllEntries = async (filters = {}) => {
    console.log('[FabricService] Fetching all entries with filters:', JSON.stringify(filters));
    const query = {};
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const skip = (page - 1) * limit;

    if (filters.party) {
        query.party = filters.party;
    }
    if (filters.year) {
        query.year = filters.year;
    }
    if (filters.startDate && filters.endDate) {
        query.trnDate = {
            $gte: new Date(filters.startDate),
            $lte: new Date(filters.endDate)
        };
    }
    if (filters.search) {
        query.$or = [
            { trnNo: { $regex: filters.search, $options: 'i' } },
            { invoiceNo: { $regex: filters.search, $options: 'i' } }
        ];
    }

    const total = await FabricEntry.countDocuments(query);
    const entries = await FabricEntry.find(query)
        .populate('party', 'name code mobileNo1')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    return {
        entries,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        }
    };
};

export const getEntryById = async (id) => {
    const entry = await FabricEntry.findById(id)
        .populate('party', 'name code mobileNo1 gstNo');
    if (!entry) {
        throw new Error('Fabric entry not found');
    }
    return entry;
};

export const updateEntry = async (id, updateData) => {
    console.log('[FabricService] Updating entry:', id);
    if (updateData.entries) {
        const entries = updateData.entries.map(calculateEntryAmounts);
        updateData.entries = entries;
        updateData.totalAmount = entries.reduce((sum, entry) => sum + (entry.finalAmount || 0), 0);
    }

    const entry = await FabricEntry.findByIdAndUpdate(id, updateData, {
        returnDocument: 'after',
        runValidators: true
    });

    if (!entry) {
        console.error('[FabricService] Update Error: Entry not found:', id);
        throw new Error('Fabric entry not found');
    }

    return entry;
};

export const deleteEntry = async (id) => {
    console.log('[FabricService] Deleting entry:', id);
    const entry = await FabricEntry.findByIdAndDelete(id);
    if (!entry) {
        console.error('[FabricService] Delete Error: Entry not found:', id);
        throw new Error('Fabric entry not found');
    }
    return entry;
};

export const deleteEntryFromFabric = async (fabricId, entryId) => {
    console.log('[FabricService] Deleting entry:', entryId, 'from fabric:', fabricId);
    
    const fabricEntry = await FabricEntry.findById(fabricId);
    if (!fabricEntry) {
        throw new Error('Fabric entry not found');
    }
    
    // Find and remove the specific entry
    const entryIndex = fabricEntry.entries.findIndex(
        entry => entry._id.toString() === entryId
    );
    
    if (entryIndex === -1) {
        throw new Error('Entry not found in this fabric document');
    }
    
    // Remove the entry
    fabricEntry.entries.splice(entryIndex, 1);
    
    // Recalculate total amount
    fabricEntry.totalAmount = fabricEntry.entries.reduce(
        (sum, entry) => sum + (entry.finalAmount || 0), 0
    );
    
    await fabricEntry.save();
    
    return fabricEntry;
};

export const addEntryToFabric = async (id, entryData) => {
    const fabricEntry = await FabricEntry.findById(id);
    if (!fabricEntry) {
        throw new Error('Fabric entry not found');
    }

    const calculatedEntry = calculateEntryAmounts(entryData);
    fabricEntry.entries.push(calculatedEntry);
    fabricEntry.totalAmount = fabricEntry.entries.reduce((sum, entry) => sum + (entry.finalAmount || 0), 0);

    await fabricEntry.save();
    return fabricEntry;
};

export default {
    createEntry,
    getAllEntries,
    getEntryById,
    updateEntry,
    deleteEntry,
    addEntryToFabric,
    deleteEntryFromFabric
};  