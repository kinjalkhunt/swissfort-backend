import mongoose, { Schema } from 'mongoose';
import applyGenerateTransactionNo from '../utils/generateTransactionNo.js';

const roundMeter = (value) => Number(Number(value || 0).toFixed(2));

const SIZE_TOP = [
    'S/36', 'M/38', 'L/40', 'XL/42', 'XXL/44',
    '3XL/46', '4XL/48', '5XL/50', '6XL/52', '7XL/54'
];

 const SIZE_BOTTOM = [
    '28', '30', '32','34','36','38','40', '42', '44', '46', '48', '50'
];

const productEntrySchema = new Schema({
    skuNo: { type: String, required: true, trim: true },
    mtrStock: { type: Number, required: true, min: 0, default: 0 },
    usedMtr: { type: Number, required: true, min: 0, default: 0 },
    stockBefore: { type: Number, required: true, min: 0, default: 0 },
    stockAfter: { type: Number, required: true, min: 0, default: 0 },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productDetails: {
        productCode: String,
        productName: String,
    },
    entryType: { type: String, enum: ['Sample', 'Stock', 'Order'], required: true },
    date: { type: Date, required: true, default: Date.now },
    productType: { type: String, enum: ['Top', 'Bottom'], required: true },
    sizes: [{ size: { type: String, required: true }, pcs: { type: Number, required: true, min: 0, default: 0 } }],
    totalPcs: { type: Number, default: 0, min: 0 },
    totalMtr: { type: Number, default: 0, min: 0 },
    diffMtr: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'completed'], default: 'completed' },
}, { _id: true });

const cuttingEntrySchema = new Schema(
    {
        trnNo: {
            type: String,
            required: true,
            trim: true,
        },

        skuNo: {
            type: String,
            required: true,
            trim: true,
        },

        mtrStock: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        usedMtr: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        stockBefore: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        stockAfter: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },

        productDetails: {
            productCode: {
                type: String,
            },
            productName: {
                type: String,
            },
        },

        entryType: {
            type: String,
            enum: ['Sample', 'Stock', 'Order'],
            required: true,
        },

        date: {
            type: Date,
            required: true,
            default: Date.now,
        },

        // ✅ This is the MAIN productType that user selects
        productType: {
            type: String,
            enum: ['Top', 'Bottom'],
            required: true,
        },

        sizes: [
            {
                size: {
                    type: String,
                    required: true,
                },
                pcs: {
                    type: Number,
                    required: true,
                    min: 0,
                    default: 0,
                },
            },
        ],

        totalPcs: {
            type: Number,
            default: 0,
            min: 0,
        },

        totalMtr: {
            type: Number,
            default: 0,
            min: 0,
        },

        diffMtr: {
            type: Number,
            default: 0,
        },

        status: {
            type: String,
            enum: ['draft', 'completed'],
            default: 'completed',
        },

        year: {
            type: Number,
            default: () => new Date().getFullYear(),
        },

        // Additional products for the same transaction are stored here.
        productEntries: {
            type: [productEntrySchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// Pre-save hook to calculate totals
cuttingEntrySchema.pre('save', function () {
    // Calculate total pieces
    this.totalPcs = this.sizes.reduce((sum, item) => sum + (item.pcs || 0), 0);

    // Calculate MTR per piece based on productType (user selected)
    const meterPerPiece = this.productType === 'Top' ? 1.5 : 1.2;

    // Total MTR needed
    this.totalMtr = roundMeter(this.totalPcs * meterPerPiece);

    // Used MTR (same as totalMtr)
    this.usedMtr = this.totalMtr;

    // Stock after cutting
    this.stockAfter = roundMeter(Math.max(0, this.stockBefore - this.totalMtr));

    // Diff MTR
    this.diffMtr = roundMeter(Math.max(0, this.stockBefore - this.totalMtr));

});

// Indexes
cuttingEntrySchema.index({ skuNo: 1 });
cuttingEntrySchema.index({ product: 1 });
cuttingEntrySchema.index({ productType: 1 });
cuttingEntrySchema.index({ entryType: 1 });
cuttingEntrySchema.index({ date: 1 });

// Validation for sizes - uses productType (user selected)
cuttingEntrySchema.pre('validate', function () {
    const allowedSizes = this.productType === 'Top' ? SIZE_TOP : SIZE_BOTTOM;

    for (const item of this.sizes) {
        if (!allowedSizes.includes(item.size)) {
            throw new Error(
                `Invalid size "${item.size}" for ${this.productType}`
            );
        }
    }
});

// Apply TRN generator
applyGenerateTransactionNo(cuttingEntrySchema, {
    prefix: 'CT',
    padding: 5,
    field: 'trnNo',
    getFilter: (doc) => ({ year: doc.year || new Date().getFullYear() })
});

const CuttingEntry = mongoose.model('CuttingEntry', cuttingEntrySchema);

export default CuttingEntry;
export { SIZE_TOP, SIZE_BOTTOM };
