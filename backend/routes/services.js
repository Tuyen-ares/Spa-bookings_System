// backend/routes/services.js
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Sequelize models
const { v4: uuidv4 } = require('uuid');

// Helper to format service output
const formatServiceOutput = (service) => {
    const serviceJson = service.toJSON();
    // Flatten the category name into the main object
    if (serviceJson.ServiceCategory) {
        serviceJson.category = serviceJson.ServiceCategory.name;
    }
    delete serviceJson.ServiceCategory;
    return serviceJson;
};

// GET /api/services - Get all services with category names
router.get('/', async (req, res) => {
    try {
        const services = await db.Service.findAll({
            include: [{ model: db.ServiceCategory, attributes: ['name'] }]
        });
        res.json(services.map(formatServiceOutput));
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/services/categories - Get all unique service category names
router.get('/categories', async (req, res) => {
    try {
        const categories = await db.ServiceCategory.findAll({
            order: [['name', 'ASC']],
        });
        res.json(categories.map(c => c.name));
    } catch (error) {
        console.error('Error fetching service categories:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/services/categories - Create a new service category
router.post('/categories', async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Category name is required' });
    }
    try {
        const [category, created] = await db.ServiceCategory.findOrCreate({
            where: { name: name.trim() }
        });
        if (!created) {
            return res.status(409).json({ message: 'Category already exists' });
        }
        res.status(201).json(category);
    } catch (error) {
        console.error('Error creating service category:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// GET /api/services/:id - Get service by ID with category name
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const service = await db.Service.findByPk(id, {
             include: [{ model: db.ServiceCategory, attributes: ['name'] }]
        });
        if (service) {
            res.json(formatServiceOutput(service));
        } else {
            res.status(404).json({ message: 'Service not found' });
        }
    } catch (error) {
        console.error('Error fetching service by ID:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/services - Add a new service (Admin only)
router.post('/', async (req, res) => {
    const { category, ...newServiceData } = req.body;
    if (!newServiceData.name || !newServiceData.price || !newServiceData.duration || !category) {
        return res.status(400).json({ message: 'Missing required service data' });
    }
    try {
        // Find or create the category to get its ID
        const [categoryInstance] = await db.ServiceCategory.findOrCreate({
            where: { name: category }
        });

        const createdService = await db.Service.create({
            id: `svc-${uuidv4()}`,
            rating: 0,
            reviewCount: 0,
            isHot: false,
            isNew: true,
            imageUrl: newServiceData.imageUrl || `https://picsum.photos/seed/${uuidv4()}/400/300`,
            ...newServiceData,
            categoryId: categoryInstance.id, // Use the found/created category ID
        });

        // Refetch to include category name for response consistency
        const result = await db.Service.findByPk(createdService.id, {
            include: [{ model: db.ServiceCategory, attributes: ['name'] }]
        });
        
        res.status(201).json(formatServiceOutput(result));

    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/services/:id - Update a service (Admin only)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { category, ...updatedServiceData } = req.body;
    try {
        const service = await db.Service.findByPk(id);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        
        if (category) {
            const [categoryInstance] = await db.ServiceCategory.findOrCreate({
                where: { name: category }
            });
            updatedServiceData.categoryId = categoryInstance.id;
        }

        await service.update(updatedServiceData);

        // Refetch to include category name for response consistency
        const result = await db.Service.findByPk(id, {
            include: [{ model: db.ServiceCategory, attributes: ['name'] }]
        });

        res.json(formatServiceOutput(result));
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /api/services/:id - Delete a service (Admin only)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const service = await db.Service.findByPk(id);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        await service.destroy();
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



module.exports = router;