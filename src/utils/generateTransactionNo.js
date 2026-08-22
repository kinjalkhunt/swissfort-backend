/**
 * Generic Transaction Number Generator
 * @param {Object} options
 * @param {mongoose.Model} options.model - Mongoose model to query
 * @param {string} options.prefix - Prefix for TRN (e.g., 'SF', 'CT', 'PO')
 * @param {number} options.padding - Number of digits (default: 5)
 * @param {string} options.field - Field name to check (default: 'trnNo')
 * @param {Object} options.filter - Additional filter for query (e.g., { year: 2026 })
 * @returns {Promise<string>} - Generated TRN
 */
export const generateTrnNo = async ({
    model,
    prefix = 'SF',
    padding = 5,
    field = 'trnNo',
    filter = {}
}) => {
    const query = {
        [field]: new RegExp(`^${prefix}`),
        ...filter
    };

    const lastEntry = await model
        .findOne(query)
        .sort({ [field]: -1 })
        .select(field)
        .lean();

    let nextNumber = 1;

    if (lastEntry?.[field]) {
        const numericPart = lastEntry[field].replace(prefix, '');
        const lastNumber = parseInt(numericPart, 10);
        
        if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
        }
    }

    return `${prefix}${String(nextNumber).padStart(padding, '0')}`;
};

/**
 * Mongoose Pre-save Hook for Auto-Generation
 * @param {mongoose.Schema} schema - The schema to attach the hook to
 * @param {Object} options
 * @param {string} options.prefix - Prefix for TRN (e.g., 'SF', 'CT')
 * @param {number} options.padding - Number of digits (default: 5)
 * @param {string} options.field - Field name (default: 'trnNo')
 * @param {Function} options.getFilter - Optional function to get additional filter
 */
export const applyGenerateTransactionNo = (schema, options = {}) => {
    const {
        prefix = 'SF',
        padding = 5,
        field = 'trnNo',
        getFilter = null
    } = options;

    schema.pre('validate', async function () {
        // Skip if document is not new OR field already has a value
        if (!this.isNew || this[field]) {
            return;
        }

        const Model = this.constructor;
        const filter = getFilter ? getFilter(this) : {};

        this[field] = await generateTrnNo({
            model: Model,
            prefix,
            padding,
            field,
            filter
        });
    });
};

// Default export for backward compatibility
export default applyGenerateTransactionNo;
