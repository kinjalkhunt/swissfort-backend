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
        required: true,
        trim: true
    },
    party: {
        type: Schema.Types.ObjectId,
        ref: 'Party',
        required: true
    },
    partyDetails: {
        type: Object,
        default: {}
    },
    invoiceDate: {
        type: Date,
        required: true
    },
    trnDate: {
        type: Date,
        default: Date.now
    },
    entries: [{
        fabricFor: {
            type: String,
                enum: ['Bottom', 'Top', 'Cordset', 'Cord Set', 'Other'],
            required: true
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
        }
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

// Add logging before validation to catch Enum issues
// fabricEntrySchema.pre('validate', function(next) {
//     console.log(`[FabricModel] Validating Invoice: ${this.invoiceNo} for Party: ${this.party}`);
//     console.log('[FabricModel] Entries to validate:', JSON.stringify(this.entries, null, 2));
//     next();
// });

// attach TRN generation hook from utils
applyGenerateTransactionNo(fabricEntrySchema);

export default model('FabricEntry', fabricEntrySchema);