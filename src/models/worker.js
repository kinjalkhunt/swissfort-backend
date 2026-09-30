import { Schema, model } from 'mongoose';

export const MOBILE_REGEX = /^[6-9][0-9]{9}$/;

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
      unique: true,
      trim: true,
      match: [MOBILE_REGEX, 'Mobile 1 must be a valid 10 digit mobile number'],
    },
    mobile2: {
      type: String,
      default: '',
      trim: true,
      validate: {
        validator: function (v) {
          return !v || MOBILE_REGEX.test(v);
        },
        message: 'Mobile 2 must be a valid 10 digit mobile number',
      },
    },
    address: {
      type: String,
      required: [true, 'Address required'],
      trim: true,
    },
    workerDetails: {
      type: String,
      enum: {
        values: ['cutting', 'stitching'],
        message: 'Work details must be cutting or stitching',
      },
      lowercase: true,
      trim: true,
      required: [true, 'Work details required'],
    },
    proofImage: {
      type: String,
      required: [true, 'Proof image required'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export default model('Worker', workerSchema);
