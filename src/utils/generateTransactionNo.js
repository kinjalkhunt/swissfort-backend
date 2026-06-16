// backend/utils/generateTransactionNo.js
// export default function applyGenerateTransactionNo(schema) {
//     schema.pre('validate', async function() {
//         if (!this.trnNo) {
//             try {
//                 const lastEntry = await this.constructor.findOne({}, {}, { sort: { createdAt: -1 } });
//                 let lastNumber = 0;
//                 if (lastEntry && lastEntry.trnNo) {
//                     const match = lastEntry.trnNo.match(/SF(\d+)/);
//                     if (match) lastNumber = parseInt(match[1], 10);
//                 }
//                 this.trnNo = 'SF' + String(lastNumber + 1).padStart(5, '0');
//             } catch (error) {
//                 this.trnNo = 'SF' + Date.now().toString().slice(-5);
//             }
//         }
//     });
// }


/**
 * applyGenerateTransactionNo
 * Mongoose pre-save hook — auto-generates trnNo like SF00001, SF00002 ...
 * Usage: applyGenerateTransactionNo(schema)
 */
const applyGenerateTransactionNo = (schema) => {
    schema.pre('validate', async function () {  // ✅ changed here
        if (!this.isNew) return  // only on create

        try {
            const Model  = this.constructor;
            const prefix = 'SF';

            const last = await Model
                .findOne({ trnNo: new RegExp(`^${prefix}`) })
                .sort({ trnNo: -1 })
                .select('trnNo');

            let nextNum = 1;
            if (last?.trnNo) {
                const num = parseInt(last.trnNo.replace(prefix, ''), 10);
                if (!isNaN(num)) nextNum = num + 1;
            }

            this.trnNo = `${prefix}${String(nextNum).padStart(5, '0')}`;
        } catch (err) {
            next(err);
        }
    });
};

export default applyGenerateTransactionNo;
