import { Schema, model } from 'mongoose';
import { SIZE_TOP, SIZE_BOTTOM } from './cuttingEntry.js';

export const getSizesByProductType = (productType) => {
  if (productType === 'Top') {
    return SIZE_TOP.map((size) => ({ label: size, value: size }));
  }
  if (productType === 'Bottom') {
    return SIZE_BOTTOM.map((size) => ({ label: size, value: size }));
  }
  return [];
};

const workerIssueEntrySchema = new Schema(
  {
    trnNo: {
      type: String,
      required: true,
      unique: true,
    },
    worker: {
      type: Schema.Types.ObjectId,
      ref: 'Worker',
      required: true,
    },
    workerDetails: {
      type: Object, // Stores { name, workerId } for quick display
      default: {},
    },
    skuNo: {
      type: String,
      required: true,
      trim: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productDetails: {
      type: Object, // Stores { productName, productType }
      default: {},
    },
    // Stores the sizes and quantities added
    // Example: [{ size: 'S/36', pcs: 2, rate: 10, total: 20 }]
    entries: [
      {
        size: { type: String, required: true },
        pcs: { type: Number, required: true, min: 1, validate: Number.isInteger },
        rate: { type: Number, required: true, min: 0 },
        total: { type: Number, default: 0 },
      },
    ],
    totalPcs: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    trnDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Pre-save hook to calculate totals
workerIssueEntrySchema.pre('save', function () {
  let totalPcs = 0;
  let totalAmount = 0;

  this.entries.forEach((entry) => {
    entry.total = entry.pcs * entry.rate;
    totalPcs += entry.pcs;
    totalAmount += entry.total;
  });
  this.totalPcs = totalPcs;
  this.totalAmount = totalAmount;
});

export default model('WorkerIssueEntry', workerIssueEntrySchema);