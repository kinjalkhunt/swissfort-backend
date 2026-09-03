import mongoose from 'mongoose';
import connectDB from '../src/config/database.js';
import CuttingEntry from '../src/models/cuttingEntry.js';

await connectDB();

const documents = await CuttingEntry.find({}).sort({ trnNo: 1, createdAt: 1, _id: 1 });
const grouped = new Map();

for (const document of documents) {
    if (!grouped.has(document.trnNo)) grouped.set(document.trnNo, []);
    grouped.get(document.trnNo).push(document);
}

let mergedTransactions = 0;
let removedDocuments = 0;

for (const [trnNo, transactionDocuments] of grouped) {
    if (transactionDocuments.length < 2) continue;

    const [primary, ...duplicates] = transactionDocuments;
    for (const duplicate of duplicates) {
        const duplicateData = duplicate.toObject();
        const {
            _id,
            trnNo: ignoredTrnNo,
            year: ignoredYear,
            createdAt: ignoredCreatedAt,
            updatedAt: ignoredUpdatedAt,
            productEntries: duplicateEntries = [],
            ...productEntry
        } = duplicateData;

        primary.productEntries.push(productEntry);
        for (const embeddedEntry of duplicateEntries) {
            primary.productEntries.push(embeddedEntry);
        }

        await CuttingEntry.deleteOne({ _id: duplicate._id });
        removedDocuments += 1;
    }

    await primary.save({ validateBeforeSave: false });
    mergedTransactions += 1;
    console.log(`Merged ${transactionDocuments.length} documents for TRN ${trnNo}`);
}

console.log(`Merged transactions: ${mergedTransactions}`);
console.log(`Removed duplicate documents: ${removedDocuments}`);
await mongoose.connection.close();
