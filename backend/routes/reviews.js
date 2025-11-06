// backend/routes/reviews.js
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Sequelize models
const { v4: uuidv4 } = require('uuid');

// GET /api/reviews - Get all reviews, with optional filtering
router.get('/', async (req, res) => {
    const { serviceId, userId } = req.query;
    const whereClause = {};
    if (serviceId) {
        whereClause.serviceId = serviceId;
    }
    if (userId) {
        whereClause.userId = userId;
    }

    try {
        const reviews = await db.Review.findAll({ where: whereClause });
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/reviews/:id - Get review by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const review = await db.Review.findByPk(id);
        if (review) {
            res.json(review);
        } else {
            res.status(404).json({ message: 'Review not found' });
        }
    } catch (error) {
        console.error('Error fetching review by ID:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/reviews - Add a new review
router.post('/', async (req, res) => {
    const newReviewData = req.body;
    if (!newReviewData.userId || !newReviewData.serviceId || !newReviewData.rating) {
        return res.status(400).json({ message: 'Missing required review data' });
    }

    try {
        // Update service's average rating and review count
        const service = await db.Service.findByPk(newReviewData.serviceId);
        if (service) {
            const currentTotalRating = service.rating * service.reviewCount;
            const newReviewCount = service.reviewCount + 1;
            const newAverageRating = (currentTotalRating + newReviewData.rating) / newReviewCount;
            await service.update({
                rating: newAverageRating,
                reviewCount: newReviewCount,
            });
        }

        const createdReview = await db.Review.create({
            id: `rev-${uuidv4()}`,
            date: new Date().toISOString(),
            ...newReviewData,
        });
        res.status(201).json(createdReview);
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/reviews/:id - Update a review (e.g., add manager reply, toggle visibility)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { managerReply, isHidden } = req.body;
    
    try {
        const review = await db.Review.findByPk(id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        const updateData = {};
        if (managerReply !== undefined) {
            updateData.managerReply = managerReply;
        }
        if (isHidden !== undefined) {
            updateData.isHidden = isHidden;
        }

        await review.update(updateData);
        res.json(review);
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


module.exports = router;