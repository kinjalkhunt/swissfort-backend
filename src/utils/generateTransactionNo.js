export default function applyGenerateTransactionNo(schema) {
    // Auto-generate TRN number before validation so required checks pass
    schema.pre('validate', async function() {
        if (!this.trnNo) {
            const lastEntry = await this.constructor.findOne({}, {}, { sort: { 'createdAt': -1 } });
            let lastNumber = 0;
            if (lastEntry && lastEntry.trnNo) {
                const match = lastEntry.trnNo.match(/SF(\d+)/);
                if (match) {
                    lastNumber = parseInt(match[1], 10);
                }
            }
            this.trnNo = 'SF' + String(lastNumber + 1).padStart(5, '0');
        }
    });
}