import mongoose, { Schema } from 'mongoose';

const productSchema = new Schema(
    {
        productCode: {
            type: String,
            unique: true,
            trim: true,
        },

        productName: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
            maxlength: [100, 'Product name cannot exceed 100 characters'],
        },

        productType: {
            type: String,
            required: [true, 'Product type is required'],
            enum: {
                values: ['Top', 'Bottom'],
                message: 'Product type must be either Top or Bottom',
            },
        },
    },
    {
        timestamps: true,
    }
);

// ============================================
// Auto-generate Product Code
// PR0001, PR0002, PR0003...
// ============================================
productSchema.pre('save', async function (next) {
    if (this.isNew && !this.productCode) {
        try {
            // Find latest product
            const lastProduct = await this.constructor
                .findOne()
                .sort({ productCode: -1 })
                .select('productCode');

            let nextNumber = 1;

            if (lastProduct?.productCode) {
                const lastNumber = parseInt(
                    lastProduct.productCode.replace('PR', ''),
                    10
                );

                if (!isNaN(lastNumber)) {
                    nextNumber = lastNumber + 1;
                }
            }

            // Generate PR0001, PR0002, PR0003...
            this.productCode = `PR${String(nextNumber).padStart(4, '0')}`;

        } catch (error) {
            return next(error);
        }
    }

});

// ============================================
// Indexes
// ============================================
productSchema.index({ productCode: 1 });
productSchema.index({ productType: 1 });

// ============================================
// Model
// ============================================
const Product = mongoose.model('Product', productSchema);

export default Product;