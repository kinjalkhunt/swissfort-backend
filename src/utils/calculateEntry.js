/**
 * calcEntry
 * Recalculates amount, disAmount, cgstAmount, sgstAmount, finalAmount
 * for a single line entry based on meter, rate and percentages.
 */
export const calcEntry = (entry) => {
    const meter       = Number(entry.meter)       || 0;
    const rate        = Number(entry.rate)        || 0;
    const disPercent  = Number(entry.disPercent)  || 0;
    const cgstPercent = Number(entry.cgstPercent) || 0;
    const sgstPercent = Number(entry.sgstPercent) || 0;

    const amount      = parseFloat((meter * rate).toFixed(2));
    const disAmount   = parseFloat(((amount * disPercent)  / 100).toFixed(2));
    const taxable     = parseFloat((amount - disAmount).toFixed(2));
    const cgstAmount  = parseFloat(((taxable * cgstPercent) / 100).toFixed(2));
    const sgstAmount  = parseFloat(((taxable * sgstPercent) / 100).toFixed(2));
    const finalAmount = parseFloat((taxable + cgstAmount + sgstAmount).toFixed(2));

    return {
        ...entry,
        amount,
        disAmount,
        cgstAmount,
        sgstAmount,
        finalAmount,
    };
};

/**
 * calcTotal
 * Sums finalAmount across all entries → totalAmount for the fabric document.
 */
export const calcTotal = (entries = []) =>
    parseFloat(
        entries.reduce((sum, e) => sum + (Number(e.finalAmount) || 0), 0).toFixed(2)
    );