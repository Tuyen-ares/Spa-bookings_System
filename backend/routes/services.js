// backend/routes/services.js
const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

// GET /api/services/categories - Get all categories (must be before /:id route)
router.get('/categories', serviceController.getAllCategories);

// POST /api/services/categories - Create new category
router.post('/categories', serviceController.createCategory);

// PUT /api/services/categories/:id - Update category
router.put('/categories/:id', serviceController.updateCategory);

// DELETE /api/services/categories/:id - Delete category
router.delete('/categories/:id', serviceController.deleteCategory);

// GET /api/services - Get all services
router.get('/', serviceController.getAllServices);

// GET /api/services/category/:categoryId - Get services by category
router.get('/category/:categoryId', serviceController.getServicesByCategory);

// GET /api/services/:id - Get service by ID
router.get('/:id', serviceController.getServiceById);

// POST /api/services - Create new service
router.post('/', serviceController.createService);

// PUT /api/services/:id - Update service
router.put('/:id', serviceController.updateService);

// DELETE /api/services/:id - Delete service
router.delete('/:id', serviceController.deleteService);

module.exports = router;