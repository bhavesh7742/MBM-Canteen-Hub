/**
 * Generate a unique order pickup code
 * Format: MBM-XXXX (4-digit random number)
 * @returns {string} Order code
 */
const generateOrderCode = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `MBM-${num}`;
};
module.exports = generateOrderCode;