import { Schema } from "mongoose";

const cuttingEntry = new Schema({
    trnNo: {
        type: String,
        required: true,
        unique: true
    },
    SKUNo: {
        type: String,
        ref: "FabricEntry",
        required: true
    },
    mtrStock: {
        type: String,
        ref: "FabricEntry",
        required: true
    },
    Product: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    type: {
        type: String,
        enum: ["top", "bottom"],
        required: true
    },
    size: {
        type: String,
        enum: ["S/36", "M/38", "L/40", "XL/42", "XXL/44", "3XL/46", "4XL/48", "5XL/50", "6XL/52", "7XL/54" ],
        required: true
    }
},
    {
        timestamps: true
    })