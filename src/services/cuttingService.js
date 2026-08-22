// // import CuttingEntry from '../models/cuttingEntryModel.js';
// // import FabricEntry from '../models/fabricEntryModel.js';
// // import Product from '../models/productModel.js';

import CuttingEntry from "../models/cuttingEntry.js";
import FabricEntry from "../models/fabricEntry.js";
import Product from "../models/productEntry.js";
import { generateTrnNo } from "../utils/generateTransactionNo.js";

// Keep persisted meter calculations free from JavaScript floating-point artifacts.
// const roundMeter = (value) => Number(Number(value || 0).toFixed(2));
// const formatMeter = (value) => roundMeter(value).toFixed(2);

// // import generateCuttingTrnNo from '../utils/generateCuttingTrnNo.js';


// // ============================================
// // GET NEXT TRN NO
// // ============================================

// export const getNextCuttingTrnNo = async () => {
//     return generateTrnNo({
//         model: CuttingEntry,
//         prefix: 'CT',
//         padding: 5,
//         field: 'trnNo',
//         filter: { year: new Date().getFullYear() },
//     });
// };


// // ============================================
// // GET SKU DETAILS
// // ============================================

// export const getSkuDetails = async (skuNo) => {
//     if (!skuNo) {
//         throw new Error('SKU No is required');
//     }

//     const fabricEntries = await FabricEntry.find({
//         'entries.skuNo': skuNo,
//     })
//         .select('trnNo invoiceNo status entries')
//         .lean();

//     if (!fabricEntries.length) {
//         throw new Error(
//             `SKU No "${skuNo}" not found in Fabric Entry`
//         );
//     }

//     let totalMeter = 0;
//     let designNo = '';
//     let fabricFor = '';
//     let currentStock = 0;


//     for (const fabricEntry of fabricEntries) {
//         for (const entry of fabricEntry.entries || []) {
//             if (entry.skuNo === skuNo) {
//                 totalMeter += Number(entry.meter || 0);

//                 const stock = Number(entry.currentStock || entry.meter || 0);
//                 if (stock > currentStock) {
//                     currentStock = stock;
//                 }
//                 if (!designNo) {
//                     designNo = entry.designNo || '';
//                 }

//                 if (!fabricFor) {
//                     fabricFor = entry.fabricFor || '';
//                 }
//             }
//         }
//     }
//     // ✅ IMPORTANT: Get latest stock from cutting entries too
//     const latestCutting = await CuttingEntry.findOne({ skuNo })
//         .sort({ createdAt: -1 })
//         .select('stockAfter')
//         .lean();

//     // If there's a cutting entry, use its stockAfter as current stock
//     if (latestCutting && latestCutting.stockAfter !== undefined) {
//         currentStock = latestCutting.stockAfter;
//     }

//     console.log(`📦 SKU ${skuNo} - Current Stock: ${currentStock}m`);
//     return {
//         skuNo,
//         mtrStock: Number(totalMeter.toFixed(2)),
//         currentStock: Number(currentStock.toFixed(2)), // ✅ This is the key
//         designNo,
//         fabricFor,
//     };
// };


// // ============================================
// // GET ALL PRODUCTS
// // ============================================

// export const getProducts = async () => {
//     return await Product.find({})
//         .select('productCode productName productType')
//         .sort({ productName: 1 })
//         .lean();
// };


// // ============================================
// // GET PRODUCT BY ID
// // ============================================

// export const getProductById = async (productId) => {
//     const product = await Product.findById(productId)
//         .select('productCode productName productType')
//         .lean();

//     if (!product) {
//         throw new Error('Product not found');
//     }

//     return product;
// };


// // ============================================
// // CALCULATE TOTALS
// // ============================================

// const calculateTotals = (sizes, productType, mtrStock) => {
//     // Calculate total pieces
//     const totalPcs = sizes.reduce(
//         (total, item) => total + Number(item.pcs || 0),
//         0
//     );

//     // MTR per piece: Top = 1.5, Bottom = 1.2
//     const meterPerPiece = productType === 'Top' ? 1.5 : 1.2;

//     // Total MTR needed
//     const totalMtr = totalPcs * meterPerPiece;

//     // Used MTR (same as totalMtr for this cutting entry)
//     const usedMtr = totalMtr;

//     // Diff MTR = Stock - Used (how much remains)
//     const diffMtr = Math.max(0, Number(mtrStock || 0) - totalMtr);

//     // Remaining MTR after cutting
//     const remainingMtr = Math.max(0, Number(mtrStock || 0) - totalMtr);

//     console.log('📊 Calculation Details:');
//     console.log(`   Total Pcs: ${totalPcs}`);
//     console.log(`   Meter/Piece: ${meterPerPiece}`);
//     console.log(`   Total MTR Used: ${totalMtr}`);
//     console.log(`   MTR Stock: ${mtrStock}`);
//     console.log(`   Remaining MTR: ${remainingMtr}`);

//     return {
//         totalPcs,
//         totalMtr,
//         usedMtr,
//         diffMtr,
//         remainingMtr,
//     };
// };

// // ============================================
// // UPDATE FABRIC ENTRY STOCK
// // ============================================

// const updateFabricEntryStock = async (skuNo, usedMtr) => {
//     // Find the latest fabric entry with this SKU
//     const fabricEntry = await FabricEntry.findOne({
//         'entries.skuNo': skuNo
//     })
//         .sort({ createdAt: -1 })
//         .select('entries');

//     if (!fabricEntry) {
//         throw new Error(`Fabric entry not found for SKU: ${skuNo}`);
//     }

//     let updated = false;

//     // Update the entry with matching SKU
//     for (const entry of fabricEntry.entries) {
//         if (entry.skuNo === skuNo) {
//             // Calculate remaining stock
//             const currentStock = Number(entry.currentStock || entry.meter || 0);
//             const remaining = Math.max(0, currentStock - usedMtr);

//             // Update remaining MTR
//             entry.currentStock = remaining;
//             updated = true;
//             console.log(`📦 SKU ${skuNo}: Stock ${currentStock} - Used ${usedMtr} = Remaining ${remaining}`);
//             break;
//         }
//     }

//     if (!updated) {
//         throw new Error(`SKU ${skuNo} not found in fabric entry`);
//     }

//     await fabricEntry.save();
//     return fabricEntry;
// };

// // ============================================
// // CREATE CUTTING ENTRY
// // ============================================

// export const createCuttingEntry = async (data) => {
//     const {
//         skuNo,
//         product,
//         entryType,
//         date,
//         sizes,
//     } = data;

//     // Validate SKU
//     const skuDetails = await getSkuDetails(skuNo);

//     // Check if enough stock is available
//     if (skuDetails.currentStock <= 0) {
//         throw new Error(`No stock available for SKU: ${skuNo}`);
//     }

//     // Validate Product
//     const productDetails = await Product.findById(product)
//         .select('productCode productName productType')
//         .lean();

//     if (!productDetails) {
//         throw new Error('Product not found');
//     }

//     const productType = productDetails.productType;

//     // Validate sizes
//     if (!Array.isArray(sizes) || !sizes.length) {
//         throw new Error('At least one size is required');
//     }

//     // Calculate totals
//     const totals = calculateTotals(
//         sizes,
//         productType,
//         skuDetails.currentStock
//     );

//     // Check if we have enough stock
//     if (totals.totalMtr > skuDetails.currentStock) {
//         throw new Error(
//             `Not enough stock! Available: ${skuDetails.currentStock}m, Needed: ${totals.totalMtr}m`
//         );
//     }
//     const remainingStock = Math.max(0, skuDetails.currentStock - totals.totalMtr);

//     // Generate TRN
//     const trnNo = await getNextCuttingTrnNo();

//     // Create Cutting Entry
//     const cuttingEntry = await CuttingEntry.create({
//         trnNo,
//         skuNo,
//         mtrStock: skuDetails.currentStock,
//         stockBefore: skuDetails.currentStock, // Stock BEFORE cutting
//         stockAfter: remainingStock,           // Stock AFTER cutting
//         usedMtr: totals.totalMtr,
//         product,
//         productDetails: {
//             productCode: productDetails.productCode,
//             productName: productDetails.productName,
//             productType: productDetails.productType,
//         },
//         entryType,
//         date: date || new Date(),
//         productType,
//         sizes,
//         totalPcs: totals.totalPcs,
//         totalMtr: totals.totalMtr,
//         diffMtr: remainingStock,
//         status: 'completed',
//         year: new Date().getFullYear(),
//     });

//     // ✅ UPDATE Fabric Entry Stock
//     await updateFabricEntryStock(skuNo, totals.totalMtr);

//     return await CuttingEntry.findById(cuttingEntry._id)
//         .populate('product', 'productCode productName productType')
//         .lean();
// };



// // ============================================
// // GET ALL CUTTING ENTRIES
// // ============================================

// export const getAllCuttingEntries = async (query = {}) => {

//     const {
//         page = 1,
//         limit = 20,
//         skuNo,
//         product,
//         productType,
//         entryType,
//         year,
//     } = query;

//     const filter = {};

//     if (skuNo) {
//         filter.skuNo = {
//             $regex: skuNo,
//             $options: 'i',
//         };
//     }

//     if (product) {
//         filter.product = product;
//     }

//     if (productType) {
//         filter.productType = productType;
//     }

//     if (entryType) {
//         filter.entryType = entryType;
//     }

//     if (year) {
//         filter.year = Number(year);
//     }

//     const skip = (Number(page) - 1) * Number(limit);

//     const [entries, total] = await Promise.all([
//         CuttingEntry.find(filter)
//             .populate(
//                 'product',
//                 'productCode productName productType'
//             )
//             .sort({ createdAt: -1 })
//             .skip(skip)
//             .limit(Number(limit))
//             .lean(),

//         CuttingEntry.countDocuments(filter),
//     ]);

//     return {
//         entries,
//         pagination: {
//             page: Number(page),
//             limit: Number(limit),
//             total,
//             totalPages: Math.ceil(
//                 total / Number(limit)
//             ),
//         },
//     };
// };


// // ============================================
// // GET BY ID
// // ============================================

// export const getCuttingEntryById = async (id) => {

//     const entry = await CuttingEntry.findById(id)
//         .populate(
//             'product',
//             'productCode productName productType'
//         )
//         .lean();

//     if (!entry) {
//         throw new Error('Cutting entry not found');
//     }

//     return entry;
// };


// // ============================================
// // UPDATE
// // ============================================

// export const updateCuttingEntry = async (id, data) => {
//     const existing = await CuttingEntry.findById(id);
//     if (!existing) {
//         throw new Error('Cutting entry not found');
//     }

//     const skuNo = data.skuNo || existing.skuNo;
//     const productId = data.product || existing.product;

//     const skuDetails = await getSkuDetails(skuNo);
//     const productDetails = await Product.findById(productId)
//         .select('productCode productName productType')
//         .lean();

//     if (!productDetails) {
//         throw new Error('Product not found');
//     }

//     const productType = productDetails.productType;
//     const sizes = data.sizes || existing.sizes;

//     // const totals = calculateTotals(
//     //     sizes,
//     //     productType,
//     //     skuDetails.remainingMtr
//     // );
//     // Calculate totals
//     const totalPcs = sizes.reduce((sum, item) => sum + (item.pcs || 0), 0);
//     const meterPerPiece = productType === 'Top' ? 1.5 : 1.2;
//     const totalMtr = totalPcs * meterPerPiece;
//     const remainingStock = Math.max(0, skuDetails.currentStock - totalMtr);

//     // Update fields
//     existing.skuNo = skuNo;
//     existing.stockBefore = skuDetails.currentStock;
//     existing.stockAfter = remainingStock;
//     existing.usedMtr = totalMtr;
//     existing.product = productId;
//     existing.productDetails = {
//         productCode: productDetails.productCode,
//         productName: productDetails.productName,
//         productType: productDetails.productType,
//     };
//     if (data.entryType) existing.entryType = data.entryType;
//     if (data.date) existing.date = data.date;
//     existing.productType = productType;
//     existing.sizes = sizes;
//     existing.totalPcs = totalPcs;
//     existing.totalMtr = totalMtr;
//     existing.diffMtr = remainingStock;

//     await existing.save();

//     // Update fabric stock
//     await updateFabricEntryStock(skuNo, totalMtr);

//     return await CuttingEntry.findById(id)
//         .populate('product', 'productCode productName productType')
//         .lean();
// };


// // ============================================
// // DELETE
// // ============================================

// export const deleteCuttingEntry = async (id) => {

//     const entry =
//         await CuttingEntry.findByIdAndDelete(id);

//     if (!entry) {
//         throw new Error('Cutting entry not found');
//     }

//     return entry;
// };



// // ============================================
// // GET NEXT TRN NO
// // ============================================

// export const getNextCuttingTrnNo = async () => {
//     return generateTrnNo({
//         model: CuttingEntry,
//         prefix: 'CT',
//         padding: 5,
//         field: 'trnNo',
//         filter: { year: new Date().getFullYear() },
//     });
// };

// // ============================================
// // GET SKU DETAILS (Get Current Stock)
// // ============================================

// export const getSkuDetails = async (skuNo) => {
//     if (!skuNo) {
//         throw new Error('SKU No is required');
//     }

//     const fabricEntries = await FabricEntry.find({
//         'entries.skuNo': skuNo,
//     })
//         .select('trnNo invoiceNo status entries')
//         .lean();

//     if (!fabricEntries.length) {
//         throw new Error(
//             `SKU No "${skuNo}" not found in Fabric Entry`
//         );
//     }

//     let totalMeter = 0;
//     let designNo = '';
//     let fabricFor = '';
//     let currentStock = 0;

//     for (const fabricEntry of fabricEntries) {
//         for (const entry of fabricEntry.entries || []) {
//             if (entry.skuNo === skuNo) {
//                 totalMeter += Number(entry.meter || 0);
//                 const stock = Number(entry.currentStock || entry.meter || 0);
//                 if (stock > currentStock) {
//                     currentStock = stock;
//                 }
//                 if (!designNo) {
//                     designNo = entry.designNo || '';
//                 }
//                 if (!fabricFor) {
//                     fabricFor = entry.fabricFor || '';
//                 }
//             }
//         }
//     }

//     // Get latest stock from cutting entries
//     const latestCutting = await CuttingEntry.findOne({ skuNo })
//         .sort({ createdAt: -1 })
//         .select('stockAfter')
//         .lean();

//     if (latestCutting && latestCutting.stockAfter !== undefined) {
//         currentStock = latestCutting.stockAfter;
//     }

//     console.log(`📦 SKU ${skuNo} - Current Stock: ${formatMeter(currentStock)}m`);

//     return {
//         skuNo,
//         mtrStock: Number(totalMeter.toFixed(2)),
//         currentStock: Number(currentStock.toFixed(2)),
//         designNo,
//         fabricFor,
//     };
// };

// // ============================================
// // GET ALL PRODUCTS
// // ============================================

// export const getProducts = async () => {
//     return await Product.find({})
//         .select('productCode productName productType')
//         .sort({ productName: 1 })
//         .lean();
// };

// // ============================================
// // GET PRODUCT BY ID
// // ============================================

// export const getProductById = async (productId) => {
//     const product = await Product.findById(productId)
//         .select('productCode productName productType')
//         .lean();

//     if (!product) {
//         throw new Error('Product not found');
//     }

//     return product;
// };

// // ============================================
// // CALCULATE TOTALS
// // ============================================

// const calculateTotals = (sizes, productType, mtrStock) => {
//     const totalPcs = sizes.reduce(
//         (total, item) => total + Number(item.pcs || 0),
//         0
//     );

//     const meterPerPiece = productType === 'Top' ? 1.5 : 1.2;
//     const totalMtr = roundMeter(totalPcs * meterPerPiece);
//     const remainingMtr = roundMeter(Math.max(0, Number(mtrStock || 0) - totalMtr));

//     console.log('📊 Calculation Details:');
//     console.log(`   Total Pcs: ${totalPcs}`);
//     console.log(`   Meter/Piece: ${formatMeter(meterPerPiece)}`);
//     console.log(`   Total MTR Used: ${formatMeter(totalMtr)}`);
//     console.log(`   MTR Stock: ${formatMeter(mtrStock)}`);
//     console.log(`   Remaining MTR: ${formatMeter(remainingMtr)}`);

//     return {
//         totalPcs,
//         totalMtr,
//         usedMtr: totalMtr,
//         diffMtr: remainingMtr,
//         remainingMtr,
//     };
// };

// // ============================================
// // UPDATE FABRIC ENTRY STOCK
// // ============================================

// const updateFabricEntryStock = async (skuNo, usedMtr) => {
//     const fabricEntry = await FabricEntry.findOne({
//         'entries.skuNo': skuNo
//     })
//         .sort({ createdAt: -1 })
//         .select('entries');

//     if (!fabricEntry) {
//         throw new Error(`Fabric entry not found for SKU: ${skuNo}`);
//     }

//     let updated = false;

//     for (const entry of fabricEntry.entries) {
//         if (entry.skuNo === skuNo) {
//             const currentStock = Number(entry.currentStock || entry.meter || 0);
//             const remaining = roundMeter(Math.max(0, currentStock - usedMtr));
//             entry.currentStock = remaining;
//             updated = true;
//             console.log(`📦 SKU ${skuNo}: Stock ${formatMeter(currentStock)} - Used ${formatMeter(usedMtr)} = Remaining ${formatMeter(remaining)}`);
//             break;
//         }
//     }

//     if (!updated) {
//         throw new Error(`SKU ${skuNo} not found in fabric entry`);
//     }

//     await fabricEntry.save();
//     return fabricEntry;
// };

// // ============================================
// // CREATE CUTTING ENTRY
// // ============================================

// export const createCuttingEntry = async (data) => {
//     const {
//         skuNo,
//         product,
//         productType,  // ✅ User selects this
//         entryType,
//         date,
//         sizes,
//     } = data;

//     // ✅ Validate productType is provided
//     if (!productType) {
//         throw new Error('Product Type (Top/Bottom) is required');
//     }

//     // ✅ Validate productType is valid
//     if (!['Top', 'Bottom'].includes(productType)) {
//         throw new Error('Product Type must be either "Top" or "Bottom"');
//     }

//     // Validate SKU
//     const skuDetails = await getSkuDetails(skuNo);

//     if (skuDetails.currentStock <= 0) {
//         throw new Error(`No stock available for SKU: ${skuNo}`);
//     }

//     // ✅ Validate Product - just for product details, not for type
//     const productDetails = await Product.findById(product)
//         .select('productCode productName productType')
//         .lean();

//     if (!productDetails) {
//         throw new Error('Product not found');
//     }

//     // Validate sizes
//     if (!Array.isArray(sizes) || !sizes.length) {
//         throw new Error('At least one size is required');
//     }

//     // ✅ Calculate totals using user-selected productType
//     const totals = calculateTotals(
//         sizes,
//         productType,  // ✅ Use user-selected type
//         skuDetails.currentStock
//     );

//     if (totals.totalMtr > skuDetails.currentStock) {
//         throw new Error(
//             `Not enough stock! Available: ${skuDetails.currentStock}m, Needed: ${totals.totalMtr}m`
//         );
//     }

//     const remainingStock = roundMeter(Math.max(0, skuDetails.currentStock - totals.totalMtr));

//     // Generate TRN
//     const trnNo = await getNextCuttingTrnNo();

//     // ✅ Create Cutting Entry with user-selected productType
//     const cuttingEntry = await CuttingEntry.create({
//         trnNo,
//         skuNo,
//         mtrStock: skuDetails.currentStock,
//         stockBefore: skuDetails.currentStock,
//         stockAfter: remainingStock,
//         usedMtr: totals.totalMtr,
//         product,
//         productDetails: {
//             productCode: productDetails.productCode,
//             productName: productDetails.productName,
//             // ✅ No productType in productDetails
//         },
//         productType: productType, // ✅ User-selected type
//         entryType,
//         date: date || new Date(),
//         sizes,
//         totalPcs: totals.totalPcs,
//         totalMtr: totals.totalMtr,
//         diffMtr: remainingStock,
//         status: 'completed',
//         year: new Date().getFullYear(),
//     });

//     // Update Fabric Entry Stock
//     await updateFabricEntryStock(skuNo, totals.totalMtr);

//     return await CuttingEntry.findById(cuttingEntry._id)
//         .populate('product', 'productCode productName productType')
//         .lean();
// };

// // ============================================
// // GET ALL CUTTING ENTRIES
// // ============================================

// export const getAllCuttingEntries = async (query = {}) => {
//     const {
//         page = 1,
//         limit = 20,
//         skuNo,
//         product,
//         productType,
//         entryType,
//         year,
//     } = query;

//     const filter = {};

//     if (skuNo) {
//         filter.skuNo = { $regex: skuNo, $options: 'i' };
//     }
//     if (product) filter.product = product;
//     if (productType) filter.productType = productType;
//     if (entryType) filter.entryType = entryType;
//     if (year) filter.year = Number(year);

//     const skip = (Number(page) - 1) * Number(limit);

//     const [entries, total] = await Promise.all([
//         CuttingEntry.find(filter)
//             .populate('product', 'productCode productName productType')
//             .sort({ createdAt: -1 })
//             .skip(skip)
//             .limit(Number(limit))
//             .lean(),
//         CuttingEntry.countDocuments(filter),
//     ]);

//     return {
//         entries,
//         pagination: {
//             page: Number(page),
//             limit: Number(limit),
//             total,
//             totalPages: Math.ceil(total / Number(limit)),
//         },
//     };
// };

// // ============================================
// // GET BY ID
// // ============================================

// export const getCuttingEntryById = async (id) => {
//     const entry = await CuttingEntry.findById(id)
//         .populate('product', 'productCode productName productType')
//         .lean();

//     if (!entry) {
//         throw new Error('Cutting entry not found');
//     }

//     return entry;
// };

// // ============================================
// // UPDATE
// // ============================================

// export const updateCuttingEntry = async (id, data) => {
//     if (!data || typeof data !== 'object' || Array.isArray(data)) {
//         throw new Error('Update data must be a JSON object');
//     }

//     const existing = await CuttingEntry.findById(id);
//     if (!existing) {
//         throw new Error('Cutting entry not found');
//     }

//     const skuNo = data.skuNo || existing.skuNo;
//     const productId = data.product || existing.product;
//     const productType = data.productType || existing.productType; // ✅ Allow updating type

//     const skuDetails = await getSkuDetails(skuNo);
//     const productDetails = await Product.findById(productId)
//         .select('productCode productName productType')
//         .lean();

//     if (!productDetails) {
//         throw new Error('Product not found');
//     }

//     const sizes = data.sizes || existing.sizes;

//     // Calculate totals with new productType if changed
//     const totals = calculateTotals(
//         sizes,
//         productType,
//         skuDetails.currentStock
//     );

//     const remainingStock = roundMeter(Math.max(0, skuDetails.currentStock - totals.totalMtr));

//     // Update fields
//     existing.skuNo = skuNo;
//     existing.stockBefore = skuDetails.currentStock;
//     existing.stockAfter = remainingStock;
//     existing.usedMtr = totals.totalMtr;
//     existing.product = productId;
//     existing.productDetails = {
//         productCode: productDetails.productCode,
//         productName: productDetails.productName,
//     };
//     existing.productType = productType; // ✅ Update with new type
//     if (data.entryType) existing.entryType = data.entryType;
//     if (data.date) existing.date = data.date;
//     existing.sizes = sizes;
//     existing.totalPcs = totals.totalPcs;
//     existing.totalMtr = totals.totalMtr;
//     existing.diffMtr = remainingStock;

//     await existing.save();

//     // Update fabric stock
//     await updateFabricEntryStock(skuNo, totals.totalMtr);

//     return await CuttingEntry.findById(id)
//         .populate('product', 'productCode productName productType')
//         .lean();
// };

// // ============================================
// // DELETE
// // ============================================

// export const deleteCuttingEntry = async (id) => {
//     const entry = await CuttingEntry.findByIdAndDelete(id);
//     if (!entry) {
//         throw new Error('Cutting entry not found');
//     }
//     return entry;
// };


// import CuttingEntry from '../models/CuttingEntry.js';
// import FabricEntry from '../models/FabricEntry.js';
// import Product from '../models/Product.js';
// import { generateTrnNo } from '../utils/generateTransactionNo.js';

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

// ============================================
// GET SKU DETAILS (Get Current Stock)
// ============================================
export const getSkuDetails = async (skuNo) => {
    if (!skuNo) {
        throw new Error('SKU No is required');
    }

    // ✅ Find fabric entry with this SKU
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

    let totalMeter = 0;
    let designNo = '';
    let fabricFor = '';
    let currentStock = 0;

    // Find the entry with this SKU
    for (const entry of fabricEntry.entries || []) {
        if (entry.skuNo === skuNo) {
            totalMeter += Number(entry.meter || 0);
            currentStock = Number(entry.currentStock || entry.meter || 0);
            designNo = entry.designNo || '';
            fabricFor = entry.fabricFor || '';
            break;
        }
    }

    // ✅ Get latest stock from cutting entries
    const latestCutting = await CuttingEntry.findOne({ skuNo })
        .sort({ createdAt: -1 })
        .select('stockAfter')
        .lean();

    if (latestCutting && latestCutting.stockAfter !== undefined) {
        currentStock = latestCutting.stockAfter;
    }

    console.log(`📦 SKU ${skuNo} - Current Stock: ${formatMeter(currentStock)}m`);

    return {
        skuNo,
        mtrStock: Number(totalMeter.toFixed(2)),
        currentStock: Number(currentStock.toFixed(2)),
        designNo,
        fabricFor,
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

// ============================================
// UPDATE FABRIC ENTRY STOCK
// ============================================
const updateFabricEntryStock = async (skuNo, usedMtr) => {
    // ✅ Find the fabric entry with this SKU
    const fabricEntry = await FabricEntry.findOne({
        'entries.skuNo': skuNo
    });

    if (!fabricEntry) {
        throw new Error(`Fabric entry not found for SKU: ${skuNo}`);
    }

    let updated = false;

    for (const entry of fabricEntry.entries) {
        if (entry.skuNo === skuNo) {
            const currentStock = Number(entry.currentStock || entry.meter || 0);
            const remaining = roundMeter(Math.max(0, currentStock - usedMtr));
            entry.currentStock = remaining;
            updated = true;
            console.log(`📦 SKU ${skuNo}: Stock ${formatMeter(currentStock)} - Used ${formatMeter(usedMtr)} = Remaining ${formatMeter(remaining)}`);
            break;
        }
    }

    if (!updated) {
        throw new Error(`SKU ${skuNo} not found in fabric entry`);
    }

    await fabricEntry.save();
    return fabricEntry;
};

// ============================================
// CREATE CUTTING ENTRY
// ============================================
export const createCuttingEntry = async (data) => {
    const {
        skuNo,
        product,
        productType,
        entryType,
        date,
        sizes,
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

    if (skuDetails.currentStock <= 0) {
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
        skuDetails.currentStock
    );

    if (totals.totalMtr > skuDetails.currentStock) {
        throw new Error(
            `Not enough stock! Available: ${skuDetails.currentStock}m, Needed: ${totals.totalMtr}m`
        );
    }

    const remainingStock = roundMeter(Math.max(0, skuDetails.currentStock - totals.totalMtr));

    // ✅ Generate TRN
    const trnNo = await getNextCuttingTrnNo();

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
        status: 'completed',
        year: new Date().getFullYear(),
    });

    // ✅ Update Fabric Entry Stock
    await updateFabricEntryStock(skuNo, totals.totalMtr);

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
    } = query;

    const filter = {};

    if (skuNo) {
        filter.skuNo = { $regex: skuNo, $options: 'i' };
    }
    if (product) filter.product = product;
    if (productType) filter.productType = productType;
    if (entryType) filter.entryType = entryType;
    if (year) filter.year = Number(year);

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

    const skuNo = data.skuNo || existing.skuNo;
    const productId = data.product || existing.product;
    const productType = data.productType || existing.productType;

    const skuDetails = await getSkuDetails(skuNo);
    const productDetails = await Product.findById(productId)
        .select('productCode productName productType')
        .lean();

    if (!productDetails) {
        throw new Error('Product not found');
    }

    const sizes = data.sizes || existing.sizes;

    // Calculate totals with new productType if changed
    const totals = calculateTotals(
        sizes,
        productType,
        skuDetails.currentStock
    );

    const remainingStock = roundMeter(Math.max(0, skuDetails.currentStock - totals.totalMtr));

    // Update fields
    existing.skuNo = skuNo;
    existing.stockBefore = skuDetails.currentStock;
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

    await existing.save();

    // Update fabric stock
    await updateFabricEntryStock(skuNo, totals.totalMtr);

    return await CuttingEntry.findById(id)
        .populate('product', 'productCode productName productType')
        .lean();
};

// ============================================
// DELETE
// ============================================
export const deleteCuttingEntry = async (id) => {
    const entry = await CuttingEntry.findByIdAndDelete(id);
    if (!entry) {
        throw new Error('Cutting entry not found');
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

    return {
        skuNo,
        initialStock: entry.meter,
        currentStock: entry.currentStock || entry.meter,
        designNo: entry.designNo,
        fabricFor: entry.fabricFor,
        history: cuttingEntries,
    };
};