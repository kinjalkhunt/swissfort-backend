import mongoose from 'mongoose';
import FabricEntry from '../models/fabricEntry.js';
import Party from '../models/party.js';
import { calcEntry, calcTotal } from '../utils/calculateEntry.js';

// ─────────────────────────────────────────────
// Get next TRN NO without saving
// ─────────────────────────────────────────────
export const getNextTrnNoService = async () => {
    const prefix = 'SF';
    const last = await FabricEntry
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
        year: new Date().getFullYear(),
    };
};

const validateUniqueSkus = async (entries, excludedId = null) => {
    const skuNumbers = entries.map((entry) => entry.skuNo).filter(Boolean);
    if (new Set(skuNumbers).size !== skuNumbers.length) {
        const err = new Error('Duplicate SKU numbers are not allowed in a fabric entry.');
        err.statusCode = 400;
        throw err;
    }

    for (const skuNo of skuNumbers) {
        const query = { 'entries.skuNo': skuNo };
        if (excludedId) query._id = { $ne: excludedId };
        if (await FabricEntry.exists(query)) {
            const err = new Error(`SKU No "${skuNo}" already exists in Fabric Entry.`);
            err.statusCode = 400;
            throw err;
        }
    }
};


// ─────────────────────────────────────────────
// Create new fabric entry
// ─────────────────────────────────────────────
export const createFabricEntryService = async (body) => {
    const { invoiceNo, party, invoiceDate, entries = [], status = 'completed' } = body;

    if (status === 'completed') {
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
    }

    // const partyDoc = await Party.findById(party);
    const partyDoc = party ? await Party.findById(party) : null;

    if (!partyDoc) {
        const err = new Error('Party not found.');
        err.statusCode = 404;
        throw err;
    }

    await validateUniqueSkus(entries);

    const calculatedEntries = entries.map(calcEntry);
    const totalAmount = calcTotal(calculatedEntries);

    const fabric = new FabricEntry({
        // invoiceNo,
        // party,
        // partyDetails: partyDoc.toObject(),
        // invoiceDate : new Date(invoiceDate),
        // trnDate     : new Date(),
        // entries     : calculatedEntries,
        // totalAmount,
        // status      : status || 'completed',
        // year        : new Date().getFullYear(),
        invoiceNo: invoiceNo || 'DRAFT',
        party: party || undefined,
        partyDetails: partyDoc ? partyDoc.toObject() : {},
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        entries: calculatedEntries,
        totalAmount,
        status,        // ← 'draft' or 'completed'
        year: new Date().getFullYear(),
    });

    await fabric.save();
    return fabric;
};


// ─────────────────────────────────────────────
// Get all fabric entries (paginated + filtered)
// ─────────────────────────────────────────────
export const getAllFabricEntriesService = async (query) => {
    const { page = 1, limit = 10, status, party, year, search, trnNo } = query;
    const filter = {};

    if (status) filter.status = status;
    if (party) filter.party = party;
    if (year) filter.year = Number(year);
    if (trnNo) filter.trnNo = trnNo.toUpperCase();

    // ── Search by trnNo (partial, case-insensitive)
    if (search) {
        // Check if it looks like a trnNo (starts with SF)
        const isTrn = /^sf/i.test(search.trim());

        if (isTrn) {
            filter.$or = [
                { trnNo: { $regex: search.trim(), $options: 'i' } },
                { invoiceNo: { $regex: search.trim(), $options: 'i' } }
            ];
        } else {
            const matchingParties = await Party.find({
                name: { $regex: search.trim(), $options: 'i' }
            }).select('_id');

            const partyIds = matchingParties.map((p) => p._id);
            filter.party = { $in: partyIds };
        }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await FabricEntry.countDocuments(filter);
    const data = await FabricEntry
        .find(filter)
        .populate('party', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    return {
        total,
        page: Number(page),
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

    if (invoiceNo) fabric.invoiceNo = invoiceNo;
    if (status) fabric.status = status;
    if (invoiceDate) fabric.invoiceDate = new Date(invoiceDate);

    if (party && String(party) !== String(fabric.party)) {
        const partyDoc = await Party.findById(party);
        if (!partyDoc) {
            const err = new Error('Party not found.');
            err.statusCode = 404;
            throw err;
        }
        fabric.party = party;
        fabric.partyDetails = partyDoc.toObject();
    }

    if (entries?.length) {
        await validateUniqueSkus(entries, fabric._id);
        fabric.entries = entries.map(calcEntry);
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

    const merged = { ...fabric.entries[idx].toObject(), ...body };
    fabric.entries[idx] = calcEntry(merged);
    fabric.totalAmount = calcTotal(fabric.entries);

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

    const before = fabric.entries.length;
    fabric.entries = fabric.entries.filter((e) => String(e._id) !== entryId);
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
        trnNo: fabric.trnNo,
        invoiceNo: fabric.invoiceNo,
        status: fabric.status,
        totalMeter: fabric.entries.reduce((s, e) => s + e.meter, 0),
        totalAmount: fabric.entries.reduce((s, e) => s + e.amount, 0),
        totalDisAmt: fabric.entries.reduce((s, e) => s + e.disAmount, 0),
        totalCgst: fabric.entries.reduce((s, e) => s + e.cgstAmount, 0),
        totalSgst: fabric.entries.reduce((s, e) => s + e.sgstAmount, 0),
        totalFinal: fabric.totalAmount,
        entryCount: fabric.entries.length,
    };
};