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
    const party = await Party.findById(entryData.party);
    if (!party) {
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
        year: new Date().getFullYear()
    });

    return fabricEntry.save();

    // Populate party details before returning
    return await FabricEntry.findById(savedEntry._id).populate('party', 'name code mobileNo1');

};

export const getAllEntries = async (filters = {}) => {
    const query = {};

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

    return FabricEntry.find(query)
        .populate('party', 'name code mobileNo1')
        .sort({ createdAt: -1 });
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
        throw new Error('Fabric entry not found');
    }

    return entry;
};

export const deleteEntry = async (id) => {
    const entry = await FabricEntry.findByIdAndDelete(id);
    if (!entry) {
        throw new Error('Fabric entry not found');
    }
    return entry;
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
    addEntryToFabric
};  