import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

const permissionSchema = new Schema({
  fabricEntry: {
    type: Boolean,
    default: false
  },

  cuttingEntry: {
    type: Boolean,
    default: false
  },

  workerEntry: {
    type: Boolean,
    default: false
  },
  stock: {
    type: Boolean,
    default: false
  },
  partyMaster: {
    type: Boolean,
    default: false
  },
  productMaster: {
    type: Boolean,
    default: false
  },
  workerMaster: {
    type: Boolean,
    default: false
  },
  dashboard: {
    type: Boolean,
    default: false
  }

}, { _id: false });

const userSchema = new Schema({

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ['admin', 'master'],
    default: 'master'
  },

  permissions: {
    type: permissionSchema,
    default: () => ({})
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});


// HASH PASSWORD
userSchema.pre('save', async function () {

  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);

  this.password = await bcrypt.hash(this.password, salt);
});


// MATCH PASSWORD
userSchema.methods.comparePassword = async function (password) {

  return await bcrypt.compare(password, this.password);
};

export default model('User', userSchema);