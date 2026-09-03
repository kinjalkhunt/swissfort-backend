import mongoose from "mongoose";
import CuttingEntry from "../models/cuttingEntry.js";
import FabricEntry from "../models/fabricEntry.js";
import Product from "../models/productEntry.js";
import { generateTrnNo } from "../utils/generateTransactionNo.js";

// ============================================
// HELPER: Format Meter
// ============================================
const roundMeter = (value) => Number(Number(value || 0).toFixed(2));
const formatMeter = (value) => Number(value || 0).toFixed(2);
const getCuttingRows = (document) => [
    document,
    ...(document.productEntries || []).map((entry) => ({
        ...entry.toObject?.() || entry,
        trnNo: document.trnNo,
        year: document.year,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
    })),
];
const insufficientStockError = (skuNo, available, needed) => {
    const error = new Error(
        `Insufficient stock! Available: ${formatMeter(available)}m, Needed: ${formatMeter(needed)}m`
    );
    error.statusCode = 400;
    error.skuNo = skuNo;
    return error;
};

// ============================================
// GET NEXT TRN NO
// ============================================
export const getNextCuttingTrnNo = async () => {
    return generateTrnNo({
        model: CuttingEntry,
        prefix: 'CT',
        padding: 5,
        field: 'trnNo',
        filter: { year: new Date().getFullYear() },
    });
};

const getFabricEntryForSku = async (skuNo, session = null) => {
    let query = FabricEntry.findOne({ 'entries.skuNo': skuNo }).sort({ createdAt: -1 });
    if (session) query = query.session(session);
    const fabricEntry = await query;

    if (!fabricEntry) {
        const error = new Error(`SKU No "${skuNo}" not found in Fabric Entry`);
        error.statusCode = 404;
        throw error;
    }

    const entry = fabricEntry.entries.find((item) => item.skuNo === skuNo);
    if (!entry) {
        const error = new Error(`SKU No "${skuNo}" not found in Fabric Entry`);
        error.statusCode = 404;
        throw error;
    }

    return { fabricEntry, entry };
};

const getCompletedStock = async (skuNo, excludedId = null, session = null) => {
    const { entry } = await getFabricEntryForSku(skuNo, session);
    const initialStock = Number(entry.meter || 0);
    const filter = {
        $and: [
            { $or: [{ status: 'completed' }, { 'productEntries.status': 'completed' }] },
            { $or: [{ skuNo }, { 'productEntries.skuNo': skuNo }] },
        ],
    };
    if (excludedId) {
        filter.$and = [{
            $or: [{ _id: { $ne: excludedId } }, { 'productEntries._id': { $ne: excludedId } }],
        }];
    }

    let query = CuttingEntry.find(filter).sort({ createdAt: 1, _id: 1 });
    if (session) query = query.session(session);
    const completedEntries = await query;
    let stock = initialStock;
    for (const document of completedEntries) {
        const rows = [document, ...(document.productEntries || [])];
        for (const cuttingEntry of rows.filter((row) => row.skuNo === skuNo && row.status === 'completed')) {
            if (!excludedId || String(cuttingEntry._id) !== String(excludedId)) {
                stock = roundMeter(stock - Number(cuttingEntry.totalMtr || 0));
            }
        }
    }

    return { initialStock, currentStock: roundMeter(Math.max(0, stock)) };
};

// ============================================
// GET SKU DETAILS (Get Current Stock)
// ============================================
export const getSkuDetails = async (skuNo) => {
    if (!skuNo) {
        throw new Error('SKU No is required');
    }

    const { entry } = await getFabricEntryForSku(skuNo);
    const { initialStock, currentStock } = await getCompletedStock(skuNo);

    console.log(`📦 SKU ${skuNo} - Current Stock: ${formatMeter(currentStock)}m`);

    return {
        skuNo,
        mtrStock: Number(initialStock.toFixed(2)),
        currentStock: Number(currentStock.toFixed(2)),
        designNo: entry.designNo || '',
        fabricFor: entry.fabricFor || '',
    };
};

// ============================================
// GET ALL PRODUCTS
// ============================================
export const getProducts = async () => {
    return await Product.find({})
        .select('productCode productName productType')
        .sort({ productName: 1 })
        .lean();
};

// ============================================
// GET PRODUCT BY ID
// ============================================
export const getProductById = async (productId) => {
    const product = await Product.findById(productId)
        .select('productCode productName productType')
        .lean();

    if (!product) {
        throw new Error('Product not found');
    }

    return product;
};

// ============================================
// CALCULATE TOTALS
// ============================================
const calculateTotals = (sizes, productType, mtrStock) => {
    const totalPcs = sizes.reduce(
        (total, item) => total + Number(item.pcs || 0),
        0
    );

    const meterPerPiece = productType === 'Top' ? 1.5 : 1.2;
    const totalMtr = roundMeter(totalPcs * meterPerPiece);
    const remainingMtr = roundMeter(Math.max(0, Number(mtrStock || 0) - totalMtr));

    console.log('📊 Calculation Details:');
    console.log(`   Total Pcs: ${totalPcs}`);
    console.log(`   Meter/Piece: ${formatMeter(meterPerPiece)}`);
    console.log(`   Total MTR Used: ${formatMeter(totalMtr)}`);
    console.log(`   MTR Stock: ${formatMeter(mtrStock)}`);
    console.log(`   Remaining MTR: ${formatMeter(remainingMtr)}`);

    return {
        totalPcs,
        totalMtr,
        usedMtr: totalMtr,
        diffMtr: remainingMtr,
        remainingMtr,
    };
};

// Rebuild every completed row so edits and deletes cannot leave stale stock.
const recalculateSkuStock = async (skuNo, session = null) => {
    const { fabricEntry, entry } = await getFabricEntryForSku(skuNo, session);
    let query = CuttingEntry.find({
        $and: [
            { $or: [{ status: 'completed' }, { 'productEntries.status': 'completed' }] },
            { $or: [{ skuNo }, { 'productEntries.skuNo': skuNo }] },
        ],
    }).sort({ createdAt: 1, _id: 1 });
    if (session) query = query.session(session);
    const completedEntries = await query;
    let stock = Number(entry.meter || 0);

    for (const document of completedEntries) {
        let changed = false;
        const rows = [document, ...(document.productEntries || [])];
        for (const cuttingEntry of rows.filter((row) => row.skuNo === skuNo && row.status === 'completed')) {
            const usedMtr = Number(cuttingEntry.totalMtr || 0);
            if (usedMtr > stock) {
                throw insufficientStockError(skuNo, stock, usedMtr);
            }
            cuttingEntry.mtrStock = Number(entry.meter || 0);
            cuttingEntry.stockBefore = roundMeter(stock);
            cuttingEntry.stockAfter = roundMeter(stock - usedMtr);
            cuttingEntry.diffMtr = cuttingEntry.stockAfter;
            stock = cuttingEntry.stockAfter;
            changed = true;
        }
        if (changed) await document.save({ validateBeforeSave: false, session });
    }

    entry.currentStock = roundMeter(stock);
    await fabricEntry.save({ session });
    return entry.currentStock;
};

// ============================================
// CREATE CUTTING ENTRY
// ============================================
export const createCuttingEntry = async (data) => {
    const session = await mongoose.startSession();
    let result;
    try {
        await session.withTransaction(async () => {
            result = await createCuttingEntryInTransaction(data, session);
        });
    } finally {
        await session.endSession();
    }
    return result;
};

const createCuttingEntryInTransaction = async (data, session) => {
    const {
        trnNo: requestedTrnNo,
        skuNo,
        product,
        productType,
        entryType,
        date,
        sizes,
        status = 'draft',
    } = data;

    // ✅ Validate productType is provided
    if (!productType) {
        throw new Error('Product Type (Top/Bottom) is required');
    }

    if (!['Top', 'Bottom'].includes(productType)) {
        throw new Error('Product Type must be either "Top" or "Bottom"');
    }

    // ✅ Validate SKU
    const { entry: fabricSku } = await getFabricEntryForSku(skuNo, session);
    const { currentStock } = await getCompletedStock(skuNo, null, session);
    const skuDetails = { ...fabricSku.toObject(), currentStock };

    if (!['draft', 'completed'].includes(status)) {
        throw new Error('Status must be either "draft" or "completed"');
    }

    if (status === 'completed' && skuDetails.currentStock <= 0) {
        throw new Error(`No stock available for SKU: ${skuNo}`);
    }

    // ✅ Validate Product
    const productDetails = await Product.findById(product)
        .select('productCode productName productType')
        .lean();

    if (!productDetails) {
        throw new Error('Product not found');
    }

    // ✅ Validate sizes
    if (!Array.isArray(sizes) || !sizes.length) {
        throw new Error('At least one size is required');
    }

    // ✅ Calculate totals
    const totals = calculateTotals(
        sizes,
        productType,
        status === 'completed' ? skuDetails.currentStock : 0
    );

    if (status === 'completed' && totals.totalMtr > skuDetails.currentStock) {
        throw insufficientStockError(skuNo, skuDetails.currentStock, totals.totalMtr);
    }

    const remainingStock = status === 'completed'
        ? roundMeter(Math.max(0, skuDetails.currentStock - totals.totalMtr))
        : skuDetails.currentStock;

    const trnNo = requestedTrnNo || await getNextCuttingTrnNo();

    const entryData = {
        skuNo,
        mtrStock: skuDetails.currentStock,
        stockBefore: skuDetails.currentStock,
        stockAfter: remainingStock,
        usedMtr: totals.totalMtr,
        product,
        productDetails: {
            productCode: productDetails.productCode,
            productName: productDetails.productName,
        },
        productType,
        entryType,
        date: date || new Date(),
        sizes,
        totalPcs: totals.totalPcs,
        totalMtr: totals.totalMtr,
        diffMtr: remainingStock,
        status,
    };

    const existingTransaction = requestedTrnNo
        ? await CuttingEntry.findOne({ trnNo: requestedTrnNo }).session(session)
        : null;

    if (existingTransaction) {
        existingTransaction.productEntries.push(entryData);
        await existingTransaction.save({ session });

        if (status === 'completed') {
            await recalculateSkuStock(skuNo, session);
        }

        return {
            ...entryData,
            _id: existingTransaction.productEntries.at(-1)._id,
            trnNo: existingTransaction.trnNo,
            year: existingTransaction.year,
        };
    }

    // The first product remains in the document root for backward compatibility.
    const [cuttingEntry] = await CuttingEntry.create([{
        trnNo,
        ...entryData,
        year: new Date().getFullYear(),
    }], { session });

    if (status === 'completed') {
        await recalculateSkuStock(skuNo, session);
    }

    return await CuttingEntry.findById(cuttingEntry._id)
        .populate('product', 'productCode productName productType')
        .session(session)
        .lean();
};

// ============================================
// GET ALL CUTTING ENTRIES
// ============================================
export const getAllCuttingEntries = async (query = {}) => {
    const {
        page = 1,
        limit = 20,
        skuNo,
        product,
        productType,
        entryType,
        year,
        trnNo,
    } = query;

    const filter = {};

    if (skuNo) {
        filter.$or = [
            { skuNo: { $regex: skuNo, $options: 'i' } },
            { 'productEntries.skuNo': { $regex: skuNo, $options: 'i' } },
        ];
    }
    if (product) {
        filter.$and = [{
            $or: [{ product }, { 'productEntries.product': product }],
        }];
    }
    if (productType) {
        filter.$and = [...(filter.$and || []), {
            $or: [{ productType }, { 'productEntries.productType': productType }],
        }];
    }
    if (entryType) {
        filter.$and = [...(filter.$and || []), {
            $or: [{ entryType }, { 'productEntries.entryType': entryType }],
        }];
    }
    if (year) filter.year = Number(year);
    if (trnNo) filter.trnNo = { $regex: trnNo, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);

    const [documents] = await Promise.all([
        CuttingEntry.find(filter)
            .populate('product', 'productCode productName productType')
            .populate('productEntries.product', 'productCode productName productType')
            .sort({ createdAt: -1 })
            .lean(),
    ]);

    const allEntries = documents.flatMap(getCuttingRows);
    const entries = allEntries.slice(skip, skip + Number(limit));
    const total = allEntries.length;

    return {
        entries,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
        },
    };
};

// ============================================
// GET BY ID
// ============================================
export const getCuttingEntryById = async (id) => {
    const entry = await CuttingEntry.findById(id)
        .populate('product', 'productCode productName productType')
        .lean();

    if (!entry) {
        throw new Error('Cutting entry not found');
    }

    return entry;
};

// ============================================
// UPDATE
// ============================================
export const updateCuttingEntry = async (id, data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Update data must be a JSON object');
    }

    const session = await mongoose.startSession();
    let result;
    try {
        await session.withTransaction(async () => {
    const existing = mongoose.Types.ObjectId.isValid(id)
        ? await CuttingEntry.findOne({
            $or: [{ _id: id }, { 'productEntries._id': id }],
        }).session(session)
        : await CuttingEntry.findOne({ trnNo: id }).session(session);
    if (!existing) throw new Error('Cutting entry not found');
    const target = String(existing._id) === String(id)
        ? existing
        : existing.productEntries.id(id);
    if (!target) throw new Error('Cutting entry not found');

    const oldSkuNo = target.skuNo;
    const skuNo = data.skuNo || target.skuNo;
    const productId = data.product || target.product;
    const productType = data.productType || target.productType;
    const status = data.status || target.status;

    if (!['draft', 'completed'].includes(status)) {
        throw new Error('Status must be either "draft" or "completed"');
    }

    const productDetails = await Product.findById(productId)
        .select('productCode productName productType')
        .session(session)
        .lean();

    if (!productDetails) {
        throw new Error('Product not found');
    }

    const sizes = data.sizes || target.sizes;
    if (!Array.isArray(sizes) || !sizes.length) {
        throw new Error('At least one size is required');
    }

    // Calculate totals with new productType if changed
    const excludedId = target.status === 'completed' && skuNo === oldSkuNo
        ? target._id
        : null;
    const stockDetails = await getCompletedStock(skuNo, excludedId, session);
    const totals = calculateTotals(
        sizes,
        productType,
        stockDetails.currentStock
    );

    const oldMtr = Number(target.totalMtr || 0);
    const newMtr = totals.totalMtr;
    const difference = newMtr - oldMtr;
    console.log(`✏️ Cutting update ${existing.trnNo}: oldMtr=${formatMeter(oldMtr)}m, newMtr=${formatMeter(newMtr)}m, difference=${formatMeter(difference)}m`);

    if (status === 'completed' && newMtr > stockDetails.currentStock) {
        throw insufficientStockError(skuNo, stockDetails.currentStock, newMtr);
    }

    const remainingStock = status === 'completed'
        ? roundMeter(Math.max(0, stockDetails.currentStock - newMtr))
        : stockDetails.currentStock;

    // Update fields
    target.skuNo = skuNo;
    target.stockBefore = stockDetails.currentStock;
    target.stockAfter = remainingStock;
    target.usedMtr = newMtr;
    target.product = productId;
    target.productDetails = {
        productCode: productDetails.productCode,
        productName: productDetails.productName,
    };
    target.productType = productType;
    if (data.entryType) target.entryType = data.entryType;
    if (data.date) target.date = data.date;
    target.sizes = sizes;
    target.totalPcs = totals.totalPcs;
    target.totalMtr = newMtr;
    target.diffMtr = remainingStock;
    target.status = status;

    await existing.save({ session });

    if (oldSkuNo !== skuNo) {
        await recalculateSkuStock(oldSkuNo, session);
    }
    await recalculateSkuStock(skuNo, session);

    result = await CuttingEntry.findById(existing._id)
        .populate('product', 'productCode productName productType')
        .session(session)
        .lean();
        });
    } finally {
        await session.endSession();
    }
    return result;
};

// ============================================
// DELETE
// ============================================
export const deleteCuttingEntry = async (id) => {
    const session = await mongoose.startSession();
    let result;
    try {
        await session.withTransaction(async () => {
            const entry = mongoose.Types.ObjectId.isValid(id)
                ? await CuttingEntry.findOne({
                    $or: [{ _id: id }, { 'productEntries._id': id }],
                }).session(session)
                : null;
            if (!entry) throw new Error('Cutting entry not found');
            const embeddedEntry = entry.productEntries.id(id);
            const deletedEntry = embeddedEntry || entry;
            if (embeddedEntry) {
                entry.productEntries.pull(id);
                await entry.save({ session });
            } else {
                await CuttingEntry.deleteOne({ _id: id }, { session });
            }
            if (deletedEntry.status === 'completed') {
                await recalculateSkuStock(deletedEntry.skuNo, session);
            }
            result = deletedEntry;
        });
    } finally {
        await session.endSession();
    }
    return result;
};

// ============================================
// GET SKU STOCK HISTORY
// ============================================
export const getSkuStockHistory = async (skuNo) => {
    if (!skuNo) {
        throw new Error('SKU No is required');
    }

    const fabricEntry = await FabricEntry.findOne({
        'entries.skuNo': skuNo,
    })
    .sort({ createdAt: -1 })
    .select('entries')
    .lean();

    if (!fabricEntry) {
        const error = new Error(`SKU No "${skuNo}" not found in Fabric Entry`);
        error.statusCode = 404;
        throw error;
    }

    let entry = null;
    for (const e of fabricEntry.entries || []) {
        if (e.skuNo === skuNo) {
            entry = e;
            break;
        }
    }

    if (!entry) {
        const error = new Error(`SKU No "${skuNo}" not found in Fabric Entry`);
        error.statusCode = 404;
        throw error;
    }

    // Get all cutting entries for this SKU
    const cuttingEntries = await CuttingEntry.find({ skuNo })
        .sort({ createdAt: -1 })
        .select('trnNo totalMtr stockBefore stockAfter createdAt')
        .lean();

    const { currentStock } = await getCompletedStock(skuNo);

    return {
        skuNo,
        initialStock: entry.meter,
        currentStock,
        designNo: entry.designNo,
        fabricFor: entry.fabricFor,
        history: cuttingEntries,
    };
};

export const completeCuttingTrn = async (trnNo) => {
    if (!trnNo) {
        throw new Error('TRN No is required');
    }

    const session = await mongoose.startSession();
    let result;
    try {
        await session.withTransaction(async () => {
    const documents = await CuttingEntry.find({
        trnNo,
        $or: [{ status: 'draft' }, { 'productEntries.status': 'draft' }],
    }).session(session);
    const drafts = documents.flatMap((document) => [
        ...(document.status === 'draft' ? [document] : []),
        ...(document.productEntries || []).filter((entry) => entry.status === 'draft'),
    ]);
    if (!drafts.length) throw new Error(`No draft entries found for TRN ${trnNo}`);

    const skuNumbers = [...new Set(drafts.map((entry) => entry.skuNo))];
    for (const skuNo of skuNumbers) {
        const stock = await getCompletedStock(skuNo, null, session);
        const required = drafts
            .filter((entry) => entry.skuNo === skuNo)
            .reduce((total, entry) => total + Number(entry.totalMtr || 0), 0);
        if (required > stock.currentStock) {
            throw insufficientStockError(skuNo, stock.currentStock, required);
        }
    }

    for (const document of documents) {
        if (document.status === 'draft') document.status = 'completed';
        for (const entry of document.productEntries || []) {
            if (entry.status === 'draft') entry.status = 'completed';
        }
        await document.save({ session });
    }
    for (const skuNo of skuNumbers) {
        await recalculateSkuStock(skuNo, session);
    }

    result = documents.flatMap(getCuttingRows);
        });
    } finally {
        await session.endSession();
    }
    return result;
};