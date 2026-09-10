import { Schema, model } from 'mongoose';

const workerSchema = new Schema(
  {
    workerId: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Worker name required'],
      trim: true,
    },
    mobile1: {
      type: String,
      required: [true, 'Mobile 1 required'],
      match: [/^[0-9]{10}$/, 'Mobile 1 must be 10 digits'],
    },
    mobile2: {
      type: String,
      default: '',
      validate: {
        validator: function (v) {
          return !v || /^[0-9]{10}$/.test(v);
        },
        message: 'Mobile 2 must be 10 digits',
      },
    },
    address: {
      type: String,
      required: [true, 'Address required'],
    },
    workerDetails: {
      type: String,
      enum: ['cutting', 'stitching'],
      required: true,
    },
    proofImage: {
      type: String, // file path
      required: [true, 'Proof image required'],
    },
  },
  { timestamps: true }
);

workerSchema.statics.generateWorkerId = async function () {
  const lastWorker = await this.findOne().sort({ createdAt: -1 });
  if (!lastWorker) return 'W001';

  const lastNum = parseInt(lastWorker.workerId.replace('W', ''), 10);
  const nextNum = lastNum + 1;
  return 'W' + String(nextNum).padStart(3, '0');
};

export default model('Worker', workerSchema);