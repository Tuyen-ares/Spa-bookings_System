// backend/utils/tierUtils.js
const tiers = [
    { level: 1, name: 'Đồng', moneyRequired: 10000000, discountPercent: 5, color: '#CD7F32', textColor: '#FFFFFF' }, // Bronze - 10 triệu
    { level: 2, name: 'Bạc', moneyRequired: 30000000, discountPercent: 10, color: '#C0C0C0', textColor: '#000000' }, // Silver - 30 triệu
    { level: 3, name: 'Kim cương', moneyRequired: 50000000, discountPercent: 15, color: '#B9F2FF', textColor: '#000000' }, // Diamond - 50 triệu
    // Default tier for users below Bronze
    { level: 0, name: 'Thành viên', moneyRequired: 0, discountPercent: 0, color: '#A8A29E', textColor: '#FFFFFF' } // Default Member
];

/**
 * Calculate tier information based on totalSpent (in VND)
 * @param {number} totalSpent - Total amount spent in VND
 * @returns {Object} Tier information with currentTier, nextTier, and allTiers
 */
const calculateTierInfo = (totalSpent) => {
    // Convert to number if it's a string or decimal
    const spent = parseFloat(totalSpent) || 0;
    
    // Sort tiers by moneyRequired descending to find the highest tier the user qualifies for
    const sortedTiers = [...tiers].sort((a, b) => b.moneyRequired - a.moneyRequired);
    
    // Find the highest tier the user qualifies for
    let currentTier = tiers[3]; // Default to 'Thành viên' (level 0)
    
    for (const tier of sortedTiers) {
        if (spent >= tier.moneyRequired) {
            currentTier = tier;
            break;
        }
    }

    // Find the next tier
    const nextTier = tiers.find(t => t.level === currentTier.level + 1);

    return {
        currentTier,
        nextTier: nextTier || null,
        allTiers: tiers.sort((a, b) => a.moneyRequired - b.moneyRequired) // Return sorted ascending for frontend display
    };
};

module.exports = { calculateTierInfo, tiers };

