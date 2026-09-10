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
    enum: ['admin', 'master', 'worker'],
    default: 'master'
  },

  workerId: {
    type: String,
    default: null
  },

  permissions: {
    type: permissionSchema,
    default: () => ({})
  },

  isActive: {
    type: Boolean,
    default: true
  },

  lastLogin: {
    type: Date,
    default: null
  },

  lastPasswordChange: {
    type: Date,
    default: null
  },

  passwordResetToken: {
    type: String,
    default: null
  },

  passwordResetTokenExpiry: {
    type: Date,
    default: null
  }

}, {
  timestamps: true
});


// HASH PASSWORD
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return 
    // next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  // next();
});


// MATCH PASSWORD
userSchema.methods.comparePassword = async function (password) {

  return await bcrypt.compare(password, this.password);
};

export default model('User', userSchema);