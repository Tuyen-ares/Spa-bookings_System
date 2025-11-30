/**
 * Script to clean up duplicate or invalid PromotionUsage records
 * 
 * This script will:
 * 1. Find duplicate PromotionUsage records (same userId, promotionId, appointmentId = NULL)
 * 2. Find invalid PromotionUsage records (public vouchers with appointmentId = NULL)
 * 3. Remove duplicates, keeping only one record per combination
 * 4. Remove invalid records (public vouchers should not have appointmentId = NULL)
 */

const db = require('../config/database');
const { Op } = require('sequelize');

async function cleanupDuplicatePromotionUsage() {
    try {
        console.log('\n🔍 [CLEANUP] Starting cleanup of duplicate/invalid PromotionUsage records...\n');

        // 1. Find all PromotionUsage records with appointmentId = NULL
        const unusedUsages = await db.PromotionUsage.findAll({
            where: {
                appointmentId: { [Op.is]: null }
            },
            include: [{
                model: db.Promotion,
                required: true
            }]
        });

        console.log(`📊 Found ${unusedUsages.length} PromotionUsage records with appointmentId = NULL\n`);

        // 2. Group by userId + promotionId to find duplicates
        const usageGroups = {};
        unusedUsages.forEach(usage => {
            const key = `${usage.userId}_${usage.promotionId}`;
            if (!usageGroups[key]) {
                usageGroups[key] = [];
            }
            usageGroups[key].push(usage);
        });

        // 3. Find duplicates and invalid records
        const duplicatesToRemove = [];
        const invalidToRemove = [];

        for (const [key, usages] of Object.entries(usageGroups)) {
            const [userId, promotionId] = key.split('_');
            const promotion = usages[0].Promotion;
            const promoData = promotion.toJSON ? promotion.toJSON() : promotion;
            const isPublic = promoData.isPublic === true || promoData.isPublic === 1 || promoData.isPublic === '1';

            // Check if this is a public voucher (should not have appointmentId = NULL)
            if (isPublic) {
                console.log(`⚠️ [INVALID] Found public voucher with appointmentId = NULL:`);
                console.log(`   - User ID: ${userId}`);
                console.log(`   - Promotion ID: ${promotionId}`);
                console.log(`   - Promotion Code: ${promoData.code || promoData.id}`);
                console.log(`   - Count: ${usages.length}`);
                console.log(`   - These records should be removed (public vouchers should not appear in "Voucher của tôi")\n`);
                invalidToRemove.push(...usages);
            } else {
                // This is a redeemed voucher (isPublic = false)
                // If there are multiple records, keep only one (the oldest one)
                if (usages.length > 1) {
                    console.log(`⚠️ [DUPLICATE] Found ${usages.length} duplicate PromotionUsage records:`);
                    console.log(`   - User ID: ${userId}`);
                    console.log(`   - Promotion ID: ${promotionId}`);
                    console.log(`   - Promotion Code: ${promoData.code || promoData.id}`);
                    console.log(`   - Keeping the oldest record, removing ${usages.length - 1} duplicate(s)\n`);

                    // Sort by createdAt (oldest first)
                    usages.sort((a, b) => {
                        const aDate = a.createdAt || a.usedAt || new Date(0);
                        const bDate = b.createdAt || b.usedAt || new Date(0);
                        return aDate - bDate;
                    });

                    // Keep the first one, mark others for removal
                    duplicatesToRemove.push(...usages.slice(1));
                }
            }
        }

        // 4. Remove duplicates and invalid records
        let removedCount = 0;

        if (duplicatesToRemove.length > 0) {
            console.log(`\n🗑️ [REMOVING] Removing ${duplicatesToRemove.length} duplicate PromotionUsage records...\n`);
            for (const usage of duplicatesToRemove) {
                await usage.destroy();
                removedCount++;
                console.log(`   ✅ Removed duplicate: ${usage.id}`);
            }
        }

        if (invalidToRemove.length > 0) {
            console.log(`\n🗑️ [REMOVING] Removing ${invalidToRemove.length} invalid PromotionUsage records (public vouchers)...\n`);
            for (const usage of invalidToRemove) {
                await usage.destroy();
                removedCount++;
                const promo = usage.Promotion;
                const promoData = promo.toJSON ? promo.toJSON() : promo;
                console.log(`   ✅ Removed invalid: ${usage.id} (Public voucher: ${promoData.code || promoData.id})`);
            }
        }

        if (removedCount === 0) {
            console.log(`\n✅ [SUCCESS] No duplicate or invalid records found. Database is clean!\n`);
        } else {
            console.log(`\n✅ [SUCCESS] Cleanup completed! Removed ${removedCount} records.\n`);
        }

        // 5. Verify cleanup
        const remainingUnusedUsages = await db.PromotionUsage.findAll({
            where: {
                appointmentId: { [Op.is]: null }
            },
            include: [{
                model: db.Promotion,
                required: true
            }]
        });

        console.log(`📊 [VERIFICATION] Remaining unused PromotionUsage records: ${remainingUnusedUsages.length}\n`);

        // Group and count by promotion
        const remainingGroups = {};
        remainingUnusedUsages.forEach(usage => {
            const promo = usage.Promotion;
            const promoData = promo.toJSON ? promo.toJSON() : promo;
            const isPublic = promoData.isPublic === true || promoData.isPublic === 1 || promoData.isPublic === '1';
            
            if (!isPublic) {
                const key = `${usage.userId}_${promoData.code || promoData.id}`;
                if (!remainingGroups[key]) {
                    remainingGroups[key] = {
                        userId: usage.userId,
                        promotionCode: promoData.code || promoData.id,
                        count: 0
                    };
                }
                remainingGroups[key].count++;
            }
        });

        console.log(`📋 [SUMMARY] Remaining redeemed vouchers (isPublic = false):`);
        for (const [key, info] of Object.entries(remainingGroups)) {
            console.log(`   - ${info.promotionCode} (User: ${info.userId}): ${info.count} voucher(s)`);
        }
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('❌ [ERROR] Cleanup failed:', error);
        console.error('   Error stack:', error.stack);
        process.exit(1);
    }
}

// Run the cleanup
cleanupDuplicatePromotionUsage();

