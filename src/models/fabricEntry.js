import { Schema, model } from 'mongoose';
import applyGenerateTransactionNo from '../utils/generateTransactionNo.js';

const fabricEntrySchema = new Schema({
    trnNo: {
        type: String,
        required: true,
        unique: true
    },
    invoiceNo: {
        type: String,
        required: function () { return this.status === 'completed'; },
        trim: true,
        default: 'DRAFT'
    },
    status: {
        type: String,
        enum: ['draft', 'completed'],
        default: 'draft'
    },

    party: {
        type: Schema.Types.ObjectId,
        ref: 'Party',
        required: function () { return this.status === 'completed'; },
    },
    partyDetails: {
        type: Object,
        default: {}
    },
    invoiceDate: {
        type: Date,
        required: function () { return this.status === 'completed'; },
        default: Date.now
    },
    trnDate: {
        type: Date,
        default: Date.now
    },
    entries: [{
        fabricFor: {
            type: String,
            enum: ['Bottom', 'Top', 'Cordset', 'Cord Set', 'Other'],
            required: true,
            unique: true
        },
        skuNo: {
            type: String,
            required: true,
            trim: true
        },
        designNo: {
            type: String,
            required: true,
            trim: true
        },
        meter: {
            type: Number,
            required: true,
            min: 0
        },
        currentStock: {
            type: Number,
            default: function () { return this.meter; },
            min: 0
        },
        rate: {
            type: Number,
            required: true,
            min: 0
        },
        amount: {
            type: Number,
            default: 0
        },
        disPercent: {
            type: Number,
            default: 0
        },
        disAmount: {
            type: Number,
            default: 0
        },
        cgstPercent: {
            type: Number,
            default: 0
        },
        cgstAmount: {
            type: Number,
            default: 0
        },
        sgstPercent: {
            type: Number,
            default: 0
        },
        sgstAmount: {
            type: Number,
            default: 0
        },
        finalAmount: {
            type: Number,
            default: 0
        },
        // remainingMtr: {
        //     type: Number,
        //     default: 0
        // },
    }],
    totalAmount: {
        type: Number,
        default: 0
    },
    year: {
        type: Number,
        default: new Date().getFullYear()
    }
}, {
    timestamps: true
});

fabricEntrySchema.pre('save', async function() {
    for (const entry of this.entries) {
        if (entry.currentStock === undefined || entry.currentStock === null) {
            entry.currentStock = entry.meter;
        }
    }
});

fabricEntrySchema.pre('validate', function () {
    const skuNumbers = this.entries.map((entry) => entry.skuNo).filter(Boolean);
    if (new Set(skuNumbers).size !== skuNumbers.length) {
        throw new Error('Duplicate SKU numbers are not allowed in a fabric entry');
    }
});

applyGenerateTransactionNo(fabricEntrySchema, {
    prefix: 'SF',
    padding: 5,
    field: 'trnNo',
    // Optional: filter by year to reset per year
    getFilter: (doc) => ({ year: doc.year || new Date().getFullYear() })
});
export default model('FabricEntry', fabricEntrySchema);
