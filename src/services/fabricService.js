// /* eslint-disable no-unused-vars */
// import FabricEntry from '../models/fabricEntry.js';
// import Party from '../models/party.js';

// const calculateEntryAmounts = (entry) => {
//     const meter = Number(entry.meter) || 0;
//     const rate = Number(entry.rate) || 0;
//     const disPercent = Number(entry.disPercent) || 0;
//     const cgstPercent = Number(entry.cgstPercent) || 0;
//     const sgstPercent = Number(entry.sgstPercent) || 0;

//     const amount = meter * rate;
//     const disAmount = (amount * disPercent) / 100;
//     const afterDis = amount - disAmount;
//     const cgstAmount = (afterDis * cgstPercent) / 100;
//     const sgstAmount = (afterDis * sgstPercent) / 100;
//     const finalAmount = afterDis + cgstAmount + sgstAmount;

//     return {
//         ...entry,
//         meter,
//         rate,
//         amount,
//         disAmount,
//         disPercent: disPercent,
//         cgstPercent: cgstPercent,
//         sgstPercent: sgstPercent,
//         cgstAmount,
//         sgstAmount,
//         finalAmount
//     };
// };

// export const createDraft = async (entryData) => {
//     console.log('[FabricService] Attempting to create entry for party:', entryData.party);
//     const party = await Party.findById(entryData.party);
//     if (!party) {
//         console.error('[FabricService] Create Error: Party not found for ID:', entryData.party);
//         throw new Error('Party not found');
//     }

//     const entries = (entryData.entries || []).map(calculateEntryAmounts);
//     const totalAmount = entries.reduce((sum, entry) => sum + (entry.finalAmount || 0), 0);

//     const fabricDraft = new FabricEntry({
//         ...entryData,
//         status: 'draft',
//         entries,
//         totalAmount,
//         partyDetails: {
//             name: party.name,
//             code: party.code,
//             gstNo: party.gstNo,
//             address: party.address
//         },
//         year: entryData.year || new Date().getFullYear()
//     });

//     const savedEntry = await fabricDraft.save();
//     console.log('[FabricService] Success: Entry saved with ID:', savedEntry._id);

//     // Return the populated document
//     return await FabricEntry.findById(savedEntry._id)
//         .populate('party', 'name code mobileNo1')
//         .lean();
// };

// export const getAllEntries = async (filters = {}) => {
//     console.log('[FabricService] Fetching all entries with filters:', JSON.stringify(filters));
//     const query = {};
//     const page = parseInt(filters.page) || 1;
//     const limit = parseInt(filters.limit) || 10;
//     const skip = (page - 1) * limit;

//     if (filters.party) {
//         query.party = filters.party;
//     }
//     if (filters.year) {
//         query.year = filters.year;
//     }
//     if (filters.startDate && filters.endDate) {
//         query.trnDate = {
//             $gte: new Date(filters.startDate),
//             $lte: new Date(filters.endDate)
//         };
//     }
//     if (filters.search) {
//         query.$or = [
//             { trnNo: { $regex: filters.search, $options: 'i' } },
//             { invoiceNo: { $regex: filters.search, $options: 'i' } }
//         ];
//     }

//     const total = await FabricEntry.countDocuments(query);
//     const entries = await FabricEntry.find(query)
//         .populate('party', 'name code mobileNo1')
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit);

//     return {
//         entries,
//         pagination: {
//             total,
//             page,
//             limit,
//             pages: Math.ceil(total / limit)
//         }
//     };
// };

// export const getEntryById = async (id) => {
//     const entry = await FabricEntry.findById(id)
//         .populate('party', 'name code mobileNo1 gstNo');
//     if (!entry) {
//         throw new Error('Fabric entry not found');
//     }
//     return entry;
// };

// export const updateEntry = async (id, updateData) => {
//     console.log('[FabricService] Updating entry:', id);
//     if (updateData.entries) {
//         const entries = updateData.entries.map(calculateEntryAmounts);
//         updateData.entries = entries;
//         updateData.totalAmount = entries.reduce((sum, entry) => sum + (entry.finalAmount || 0), 0);
//     }

//     const entry = await FabricEntry.findByIdAndUpdate(id, updateData, {
//         returnDocument: 'after',
//         runValidators: true
//     });

//     if (!entry) {
//         console.error('[FabricService] Update Error: Entry not found:', id);
//         throw new Error('Fabric entry not found');
//     }

//     return entry;
// };

// export const deleteEntry = async (id) => {
//     console.log('[FabricService] Deleting entry:', id);
//     const entry = await FabricEntry.findByIdAndDelete(id);
//     if (!entry) {
//         console.error('[FabricService] Delete Error: Entry not found:', id);
//         throw new Error('Fabric entry not found');
//     }
//     return entry;
// };

// export const deleteEntryFromFabric = async (fabricId, entryId) => {
//     console.log('[FabricService] Deleting entry:', entryId, 'from fabric:', fabricId);

//     const fabricEntry = await FabricEntry.findById(fabricId);
//     if (!fabricEntry) {
//         throw new Error('Fabric entry not found');
//     }

//     // Find and remove the specific entry
//     const entryIndex = fabricEntry.entries.findIndex(
//         entry => entry._id.toString() === entryId
//     );

//     if (entryIndex === -1) {
//         throw new Error('Entry not found in this fabric document');
//     }

//     // Remove the entry
//     fabricEntry.entries.splice(entryIndex, 1);

//     // Recalculate total amount
//     fabricEntry.totalAmount = fabricEntry.entries.reduce(
//         (sum, entry) => sum + (entry.finalAmount || 0), 0
//     );

//     await fabricEntry.save();

//     return fabricEntry;
// };

// export const addEntryToFabric = async (id, entryData) => {
//     const fabricEntry = await FabricEntry.findById(id);
//     if (!fabricEntry) {
//         throw new Error('Fabric entry not found');
//     }

//     const calculatedEntry = calculateEntryAmounts(entryData);
//     fabricEntry.entries.push(calculatedEntry);
//     fabricEntry.totalAmount = fabricEntry.entries.reduce((sum, entry) => sum + (entry.finalAmount || 0), 0);

//     await fabricEntry.save();
//     return fabricEntry;
// };

// export default {
//     createEntry,
//     getAllEntries,
//     getEntryById,
//     updateEntry,
//     deleteEntry,
//     addEntryToFabric,
//     deleteEntryFromFabric
// };  


import mongoose from 'mongoose';
import FabricEntry from '../models/fabricEntry.js';
import Party       from '../models/party.js';
import { calcEntry, calcTotal } from '../utils/calculateEntry.js';

// ─────────────────────────────────────────────
// Get next TRN NO without saving
// ─────────────────────────────────────────────
export const getNextTrnNoService = async () => {
    const prefix = 'SF';
    const last   = await FabricEntry
        .findOne({ trnNo: new RegExp(`^${prefix}`) })
        .sort({ trnNo: -1 })
        .select('trnNo');

    let nextNum = 1;
    if (last?.trnNo) {
        const num = parseInt(last.trnNo.replace(prefix, ''), 10);
        if (!isNaN(num)) nextNum = num + 1;
    }

    return {
        trnNo: `${prefix}${String(nextNum).padStart(5, '0')}`,
        year : new Date().getFullYear(),
    };
};


// ─────────────────────────────────────────────
// Create new fabric entry
// ─────────────────────────────────────────────
export const createFabricEntryService = async (body) => {
    const { invoiceNo, party, invoiceDate, entries = [] } = body;

    if (!invoiceNo || !party || !invoiceDate) {
        const err = new Error('invoiceNo, party and invoiceDate are required.');
        err.statusCode = 400;
        throw err;
    }

    if (!entries.length) {
        const err = new Error('At least one entry is required.');
        err.statusCode = 400;
        throw err;
    }

    const partyDoc = await Party.findById(party);
    if (!partyDoc) {
        const err = new Error('Party not found.');
        err.statusCode = 404;
        throw err;
    }

    const calculatedEntries = entries.map(calcEntry);
    const totalAmount       = calcTotal(calculatedEntries);

    const fabric = new FabricEntry({
        invoiceNo,
        party,
        partyDetails: partyDoc.toObject(),
        invoiceDate : new Date(invoiceDate),
        trnDate     : new Date(),
        entries     : calculatedEntries,
        totalAmount,
        status      : 'completed',
        year        : new Date().getFullYear(),
    });

    await fabric.save();
    return fabric;
};


// ─────────────────────────────────────────────
// Get all fabric entries (paginated + filtered)
// ─────────────────────────────────────────────
export const getAllFabricEntriesService = async (query) => {
  const { page = 1, limit = 10, status, party, year, search } = query;
  const filter = {};

  if (status) filter.status = status;
  if (party)  filter.party  = party;
  if (year)   filter.year   = Number(year);

  // ── Search by trnNo (partial, case-insensitive)
  if (search) {
    // Check if it looks like a trnNo (starts with SF)
    const isTrn = /^sf/i.test(search.trim());

    if (isTrn) {
      filter.trnNo = { $regex: search.trim(), $options: 'i' };
    } else {
      // Party name search — pehla matching parties dhundho
      const matchingParties = await Party.find({
        name: { $regex: search.trim(), $options: 'i' }
      }).select('_id');

      const partyIds = matchingParties.map((p) => p._id);
      filter.party = { $in: partyIds };
    }
  }

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await FabricEntry.countDocuments(filter);
  const data  = await FabricEntry
    .find(filter)
    .populate('party', 'name phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return {
    total,
    page : Number(page),
    pages: Math.ceil(total / Number(limit)),
    data,
  };
};


// ─────────────────────────────────────────────
// Get one fabric entry by MongoDB _id
// ─────────────────────────────────────────────
export const getFabricEntryByIdService = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        const err = new Error('Invalid ID.');
        err.statusCode = 400;
        throw err;
    }

    const fabric = await FabricEntry.findById(id).populate('party', 'name phone');
    if (!fabric) {
        const err = new Error('Fabric entry not found.');
        err.statusCode = 404;
        throw err;
    }

    return fabric;
};


// ─────────────────────────────────────────────
// Get one fabric entry by TRN NO
// ─────────────────────────────────────────────
export const getFabricEntryByTrnNoService = async (trnNo) => {
    const fabric = await FabricEntry
        .findOne({ trnNo: trnNo.toUpperCase() })
        .populate('party', 'name phone');

    if (!fabric) {
        const err = new Error('Fabric entry not found.');
        err.statusCode = 404;
        throw err;
    }

    return fabric;
};


// ─────────────────────────────────────────────
// Update entire fabric entry
// ─────────────────────────────────────────────
export const updateFabricEntryService = async (id, body) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        const err = new Error('Invalid ID.');
        err.statusCode = 400;
        throw err;
    }

    const fabric = await FabricEntry.findById(id);
    if (!fabric) {
        const err = new Error('Fabric entry not found.');
        err.statusCode = 404;
        throw err;
    }

    const { invoiceNo, party, invoiceDate, entries, status } = body;

    if (invoiceNo)   fabric.invoiceNo   = invoiceNo;
    if (status)      fabric.status      = status;
    if (invoiceDate) fabric.invoiceDate = new Date(invoiceDate);

    if (party && String(party) !== String(fabric.party)) {
        const partyDoc = await Party.findById(party);
        if (!partyDoc) {
            const err = new Error('Party not found.');
            err.statusCode = 404;
            throw err;
        }
        fabric.party        = party;
        fabric.partyDetails = partyDoc.toObject();
    }

    if (entries?.length) {
        fabric.entries     = entries.map(calcEntry);
        fabric.totalAmount = calcTotal(fabric.entries);
    }

    await fabric.save();
    return fabric;
};


// ─────────────────────────────────────────────
// Delete entire fabric entry
// ─────────────────────────────────────────────
export const deleteFabricEntryService = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        const err = new Error('Invalid ID.');
        err.statusCode = 400;
        throw err;
    }

    const fabric = await FabricEntry.findByIdAndDelete(id);
    if (!fabric) {
        const err = new Error('Fabric entry not found.');
        err.statusCode = 404;
        throw err;
    }

    return fabric;
};


// ─────────────────────────────────────────────
// Add a single line entry
// ─────────────────────────────────────────────
export const addLineEntryService = async (id, entryBody) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        const err = new Error('Invalid ID.');
        err.statusCode = 400;
        throw err;
    }

    const fabric = await FabricEntry.findById(id);
    if (!fabric) {
        const err = new Error('Fabric entry not found.');
        err.statusCode = 404;
        throw err;
    }

    fabric.entries.push(calcEntry(entryBody));
    fabric.totalAmount = calcTotal(fabric.entries);

    await fabric.save();
    return {
        entryId: fabric.entries[fabric.entries.length - 1]._id,
        fabric,
    };
};


// ─────────────────────────────────────────────
// Update specific line entry
// ─────────────────────────────────────────────
export const updateLineEntryService = async (id, entryId, body) => {
    const fabric = await FabricEntry.findById(id);
    if (!fabric) {
        const err = new Error('Fabric entry not found.');
        err.statusCode = 404;
        throw err;
    }

    const idx = fabric.entries.findIndex((e) => String(e._id) === entryId);
    if (idx === -1) {
        const err = new Error('Line entry not found.');
        err.statusCode = 404;
        throw err;
    }

    const merged           = { ...fabric.entries[idx].toObject(), ...body };
    fabric.entries[idx]    = calcEntry(merged);
    fabric.totalAmount     = calcTotal(fabric.entries);

    await fabric.save();
    return fabric;
};


// ─────────────────────────────────────────────
// Delete specific line entry
// ─────────────────────────────────────────────
export const deleteLineEntryService = async (id, entryId) => {
    const fabric = await FabricEntry.findById(id);
    if (!fabric) {
        const err = new Error('Fabric entry not found.');
        err.statusCode = 404;
        throw err;
    }

    const before       = fabric.entries.length;
    fabric.entries     = fabric.entries.filter((e) => String(e._id) !== entryId);
    fabric.totalAmount = calcTotal(fabric.entries);

    if (fabric.entries.length === before) {
        const err = new Error('Line entry not found.');
        err.statusCode = 404;
        throw err;
    }

    await fabric.save();
    return fabric;
};


// ─────────────────────────────────────────────
// Get summary / totals for one fabric entry
// ─────────────────────────────────────────────
export const getFabricSummaryService = async (id) => {
    const fabric = await FabricEntry.findById(id);
    if (!fabric) {
        const err = new Error('Fabric entry not found.');
        err.statusCode = 404;
        throw err;
    }

    return {
        trnNo      : fabric.trnNo,
        invoiceNo  : fabric.invoiceNo,
        status     : fabric.status,
        totalMeter : fabric.entries.reduce((s, e) => s + e.meter, 0),
        totalAmount: fabric.entries.reduce((s, e) => s + e.amount, 0),
        totalDisAmt: fabric.entries.reduce((s, e) => s + e.disAmount, 0),
        totalCgst  : fabric.entries.reduce((s, e) => s + e.cgstAmount, 0),
        totalSgst  : fabric.entries.reduce((s, e) => s + e.sgstAmount, 0),
        totalFinal : fabric.totalAmount,
        entryCount : fabric.entries.length,
    };
};