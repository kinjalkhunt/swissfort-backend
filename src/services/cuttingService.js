import CuttingEntry from "../models/cuttingEntry.js";
import FabricEntry from "../models/fabricEntry.js";
import Product from "../models/productEntry.js";
import { generateTrnNo } from "../utils/generateTransactionNo.js";

// ============================================
// HELPER: Format Meter
// ============================================
const roundMeter = (value) => Number(Number(value || 0).toFixed(2));
const formatMeter = (value) => Number(value || 0).toFixed(2);

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

const getFabricEntryForSku = async (skuNo) => {
    const fabricEntry = await FabricEntry.findOne({ 'entries.skuNo': skuNo })
        .sort({ createdAt: -1 });

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

const getCompletedStock = async (skuNo, excludedId = null) => {
    const { entry } = await getFabricEntryForSku(skuNo);
    const initialStock = Number(entry.meter || 0);
    const filter = { skuNo, status: 'completed' };
    if (excludedId) filter._id = { $ne: excludedId };

    const completedEntries = await CuttingEntry.find(filter).sort({ createdAt: 1, _id: 1 });
    let stock = initialStock;
    for (const cuttingEntry of completedEntries) {
        stock = roundMeter(stock - Number(cuttingEntry.totalMtr || 0));
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
const recalculateSkuStock = async (skuNo) => {
    const { fabricEntry, entry } = await getFabricEntryForSku(skuNo);
    const completedEntries = await CuttingEntry.find({ skuNo, status: 'completed' })
        .sort({ createdAt: 1, _id: 1 });
    let stock = Number(entry.meter || 0);

    for (const cuttingEntry of completedEntries) {
        const usedMtr = Number(cuttingEntry.totalMtr || 0);
        if (usedMtr > stock) {
            throw new Error(`Not enough stock for SKU ${skuNo}. Available: ${formatMeter(stock)}m, Needed: ${formatMeter(usedMtr)}m`);
        }
        cuttingEntry.mtrStock = Number(entry.meter || 0);
        cuttingEntry.stockBefore = roundMeter(stock);
        cuttingEntry.stockAfter = roundMeter(stock - usedMtr);
        cuttingEntry.diffMtr = cuttingEntry.stockAfter;
        await cuttingEntry.save({ validateBeforeSave: false });
        stock = cuttingEntry.stockAfter;
    }

    entry.currentStock = roundMeter(stock);
    await fabricEntry.save();
    return entry.currentStock;
};

// ============================================
// CREATE CUTTING ENTRY
// ============================================
export const createCuttingEntry = async (data) => {
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
    const skuDetails = await getSkuDetails(skuNo);

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
        throw new Error(
            `Not enough stock! Available: ${skuDetails.currentStock}m, Needed: ${totals.totalMtr}m`
        );
    }

    const remainingStock = status === 'completed'
        ? roundMeter(Math.max(0, skuDetails.currentStock - totals.totalMtr))
        : skuDetails.currentStock;

    const trnNo = requestedTrnNo || await getNextCuttingTrnNo();

    // ✅ Create Cutting Entry
    const cuttingEntry = await CuttingEntry.create({
        trnNo,
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
        productType: productType,
        entryType,
        date: date || new Date(),
        sizes,
        totalPcs: totals.totalPcs,
        totalMtr: totals.totalMtr,
        diffMtr: remainingStock,
        status,
        year: new Date().getFullYear(),
    });

    if (status === 'completed') {
        await recalculateSkuStock(skuNo);
    }

    return await CuttingEntry.findById(cuttingEntry._id)
        .populate('product', 'productCode productName productType')
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
        filter.skuNo = { $regex: skuNo, $options: 'i' };
    }
    if (product) filter.product = product;
    if (productType) filter.productType = productType;
    if (entryType) filter.entryType = entryType;
    if (year) filter.year = Number(year);
    if (trnNo) filter.trnNo = { $regex: trnNo, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);

    const [entries, total] = await Promise.all([
        CuttingEntry.find(filter)
            .populate('product', 'productCode productName productType')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        CuttingEntry.countDocuments(filter),
    ]);

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

    const existing = await CuttingEntry.findById(id);
    if (!existing) {
        throw new Error('Cutting entry not found');
    }

    const oldSkuNo = existing.skuNo;
    const skuNo = data.skuNo || existing.skuNo;
    const productId = data.product || existing.product;
    const productType = data.productType || existing.productType;
    const status = data.status || existing.status;

    if (!['draft', 'completed'].includes(status)) {
        throw new Error('Status must be either "draft" or "completed"');
    }

    const skuDetails = await getSkuDetails(skuNo);
    const productDetails = await Product.findById(productId)
        .select('productCode productName productType')
        .lean();

    if (!productDetails) {
        throw new Error('Product not found');
    }

    const sizes = data.sizes || existing.sizes;

    // Calculate totals with new productType if changed
    const stockDetails = await getCompletedStock(
        skuNo,
        status === 'completed' ? existing._id : null
    );
    const totals = calculateTotals(
        sizes,
        productType,
        stockDetails.currentStock
    );

    if (status === 'completed' && totals.totalMtr > stockDetails.currentStock) {
        throw new Error(`Not enough stock! Available: ${formatMeter(stockDetails.currentStock)}m, Needed: ${formatMeter(totals.totalMtr)}m`);
    }

    const remainingStock = status === 'completed'
        ? roundMeter(Math.max(0, stockDetails.currentStock - totals.totalMtr))
        : stockDetails.currentStock;

    // Update fields
    existing.skuNo = skuNo;
    existing.stockBefore = stockDetails.currentStock;
    existing.stockAfter = remainingStock;
    existing.usedMtr = totals.totalMtr;
    existing.product = productId;
    existing.productDetails = {
        productCode: productDetails.productCode,
        productName: productDetails.productName,
    };
    existing.productType = productType;
    if (data.entryType) existing.entryType = data.entryType;
    if (data.date) existing.date = data.date;
    existing.sizes = sizes;
    existing.totalPcs = totals.totalPcs;
    existing.totalMtr = totals.totalMtr;
    existing.diffMtr = remainingStock;
    existing.status = status;

    await existing.save();

    if (oldSkuNo !== skuNo) {
        await recalculateSkuStock(oldSkuNo);
    }
    await recalculateSkuStock(skuNo);

    return await CuttingEntry.findById(id)
        .populate('product', 'productCode productName productType')
        .lean();
};

// ============================================
// DELETE
// ============================================
export const deleteCuttingEntry = async (id) => {
    const entry = await CuttingEntry.findById(id);
    if (!entry) {
        throw new Error('Cutting entry not found');
    }
    await CuttingEntry.findByIdAndDelete(id);
    if (entry.status === 'completed') {
        await recalculateSkuStock(entry.skuNo);
    }
    return entry;
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

    const drafts = await CuttingEntry.find({ trnNo, status: 'draft' });
    if (!drafts.length) {
        throw new Error(`No draft entries found for TRN ${trnNo}`);
    }

    const skuNumbers = [...new Set(drafts.map((entry) => entry.skuNo))];
    for (const skuNo of skuNumbers) {
        const stock = await getCompletedStock(skuNo);
        const required = drafts
            .filter((entry) => entry.skuNo === skuNo)
            .reduce((total, entry) => total + Number(entry.totalMtr || 0), 0);
        if (required > stock.currentStock) {
            throw new Error(`Not enough stock for SKU ${skuNo}. Available: ${formatMeter(stock.currentStock)}m, Needed: ${formatMeter(required)}m`);
        }
    }

    await CuttingEntry.updateMany({ trnNo, status: 'draft' }, { $set: { status: 'completed' } });
    for (const skuNo of skuNumbers) {
        await recalculateSkuStock(skuNo);
    }

    return CuttingEntry.find({ trnNo })
        .populate('product', 'productCode productName productType')
        .sort({ createdAt: 1, _id: 1 })
        .lean();
};