/**
 * Calculates exact shares for a given amount and number of participants,
 * ensuring the sum of shares perfectly equals the total amount.
 * 
 * @param {number} totalAmount - The total expense amount
 * @param {number} participantCount - Number of people sharing
 * @returns {number[]} Array of share amounts
 */
const calculateShares = (totalAmount, participantCount) => {
    if (participantCount <= 0) return [];
    
    // Use cents/paise for calculation to avoid floating point issues
    const totalCents = Math.round(totalAmount * 100);
    const baseShareCents = Math.floor(totalCents / participantCount);
    const remainderCents = totalCents - (baseShareCents * participantCount);

    const shares = [];
    for (let i = 0; i < participantCount; i++) {
        // Distribute remainder 1 cent at a time to the first 'remainderCents' participants
        let share = baseShareCents;
        if (i < remainderCents) {
            share += 1;
        }
        shares.push(share / 100);
    }
    
    return shares;
};

module.exports = { calculateShares };
