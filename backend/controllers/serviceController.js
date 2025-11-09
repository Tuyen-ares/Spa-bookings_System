// backend/controllers/serviceController.js
const serviceService = require('../services/serviceService');

class ServiceController {
    async getAllServices(req, res) {
        try {
            const services = await serviceService.getAllServices();
            res.json(services);
        } catch (error) {
            console.error('Error fetching services:', error);
            res.status(500).json({ error: 'Failed to fetch services', message: error.message });
        }
    }

    async getServiceById(req, res) {
        try {
            const service = await serviceService.getServiceById(req.params.id);
            res.json(service);
        } catch (error) {
            if (error.message === 'Service not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Failed to fetch service', message: error.message });
            }
        }
    }

    async createService(req, res) {
        try {
            const service = await serviceService.createService(req.body);
            res.status(201).json(service);
        } catch (error) {
            res.status(400).json({ error: 'Failed to create service', message: error.message });
        }
    }

    async updateService(req, res) {
        try {
            const service = await serviceService.updateService(req.params.id, req.body);
            res.json(service);
        } catch (error) {
            if (error.message === 'Service not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(400).json({ error: 'Failed to update service', message: error.message });
            }
        }
    }

    async deleteService(req, res) {
        try {
            const result = await serviceService.deleteService(req.params.id);
            res.json(result);
        } catch (error) {
            if (error.message === 'Service not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Failed to delete service', message: error.message });
            }
        }
    }

    async getAllCategories(req, res) {
        try {
            const categories = await serviceService.getAllCategories();
            res.json(categories);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch categories', message: error.message });
        }
    }

    async createCategory(req, res) {
        try {
            const category = await serviceService.createCategory(req.body);
            res.status(201).json(category);
        } catch (error) {
            res.status(400).json({ error: 'Failed to create category', message: error.message });
        }
    }

    async updateCategory(req, res) {
        try {
            const category = await serviceService.updateCategory(req.params.id, req.body);
            res.json(category);
        } catch (error) {
            if (error.message === 'Category not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(400).json({ error: 'Failed to update category', message: error.message });
            }
        }
    }

    async deleteCategory(req, res) {
        try {
            const result = await serviceService.deleteCategory(req.params.id);
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: 'Failed to delete category', message: error.message });
        }
    }

    async getServicesByCategory(req, res) {
        try {
            const services = await serviceService.getServicesByCategory(req.params.categoryId);
            res.json(services);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch services', message: error.message });
        }
    }
}

module.exports = new ServiceController();
