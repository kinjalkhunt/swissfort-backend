import { Schema, model } from 'mongoose';

const partySchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['Purchase', 'Sales', 'Supplier'],
        required: true
    },
    address: {
        type: String,
        default: ''
    },
    mobileNo1: {
        type: String,
        default: ''
    },
    mobileNo2: {
        type: String,
        default: ''
    },
    gstNo: {
        type: String,
        default: ''
    },
    stateCode: {
        type: String,
        default: ''
    },
    stateName: {
        type: String,
        default: ''
    },
    year: {
        type: Number,
        default: new Date().getFullYear()
    },
    group: {
        type: String,
        enum: ['Supplier', 'Sales', 'Purchase'],
        default: 'Supplier'
    }
}, {
    timestamps: true
});

// Auto-generate code before validation so `required` passes
partySchema.pre('validate', async function() {
    if (!this.code) {
        const lastParty = await this.constructor.findOne({}, {}, { sort: { createdAt: -1 } });
        let lastCode = lastParty && lastParty.code ? lastParty.code : 'P0000';
        const lastNumber = parseInt(lastCode.substring(1), 10) || 0;
        const newNumber = lastNumber + 1;
        this.code = 'P' + newNumber.toString().padStart(4, '0');
    }
});

export default model('Party', partySchema);