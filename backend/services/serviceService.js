// backend/services/serviceService.js
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class ServiceService {
    /**
     * Get all services
     */
    async getAllServices() {
        const services = await db.Service.findAll({
            include: [{
                model: db.ServiceCategory,
                attributes: ['id', 'name', 'description']
            }],
            attributes: {
                include: ['imageUrl'] // Explicitly include imageUrl
            },
            order: [['rating', 'DESC']]
        });

        return services;
    }

    /**
     * Get service by ID
     */
    async getServiceById(id) {
        const service = await db.Service.findByPk(id, {
            include: [{
                model: db.ServiceCategory,
                attributes: ['id', 'name', 'description']
            }]
        });

        if (!service) {
            throw new Error('Service not found');
        }

        return service;
    }

    /**
     * Create new service
     */
    async createService(serviceData) {
        // Validate category if provided
        if (serviceData.categoryId) {
            const category = await db.ServiceCategory.findByPk(serviceData.categoryId);
            if (!category) {
                throw new Error('Category not found');
            }
        }

        // Validate service ID if provided
        if (serviceData.id) {
            // Check if ID already exists
            const existingService = await db.Service.findByPk(serviceData.id);
            if (existingService) {
                throw new Error('Mã dịch vụ đã tồn tại. Vui lòng chọn mã khác.');
            }
        } else {
            // If no ID provided, generate UUID
            serviceData.id = uuidv4();
        }

        const service = await db.Service.create({
            rating: 0,
            reviewCount: 0,
            isActive: true,
            ...serviceData
        });

        return service;
    }

    /**
     * Update service
     */
    async updateService(id, serviceData) {
        const service = await db.Service.findByPk(id);
        if (!service) {
            throw new Error('Service not found');
        }

        // Validate category if updating
        if (serviceData.categoryId) {
            const category = await db.ServiceCategory.findByPk(serviceData.categoryId);
            if (!category) {
                throw new Error('Category not found');
            }
        }

        // Remove ID from update data (ID cannot be changed)
        const { id: _, ...updateData } = serviceData;

        await service.update(updateData);
        return service;
    }

    /**
     * Delete service
     */
    async deleteService(id) {
        const service = await db.Service.findByPk(id);
        if (!service) {
            throw new Error('Service not found');
        }

        await service.destroy();
        return { message: 'Service deleted successfully' };
    }

    /**
     * Get all categories
     */
    async getAllCategories() {
        const categories = await db.ServiceCategory.findAll({
            order: [['displayOrder', 'ASC'], ['name', 'ASC']]
        });

        return categories;
    }

    /**
     * Create new category
     */
    async createCategory(categoryData) {
        const category = await db.ServiceCategory.create(categoryData);
        return category;
    }

    /**
     * Update category
     */
    async updateCategory(id, categoryData) {
        const category = await db.ServiceCategory.findByPk(id);
        if (!category) {
            throw new Error('Category not found');
        }

        await category.update(categoryData);
        return category;
    }

    /**
     * Delete category
     */
    async deleteCategory(id) {
        const category = await db.ServiceCategory.findByPk(id);
        if (!category) {
            throw new Error('Category not found');
        }

        // Check if category has services
        const servicesCount = await db.Service.count({
            where: { categoryId: id }
        });

        if (servicesCount > 0) {
            throw new Error('Cannot delete category with existing services');
        }

        await category.destroy();
        return { message: 'Category deleted successfully' };
    }

    /**
     * Get services by category
     */
    async getServicesByCategory(categoryId) {
        const services = await db.Service.findAll({
            where: { categoryId, isActive: true },
            order: [['rating', 'DESC']]
        });

        return services;
    }

    /**
     * Update service rating
     */
    async updateServiceRating(serviceId) {
        const reviews = await db.Review.findAll({
            where: { serviceId },
            attributes: ['rating']
        });

        if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            const avgRating = (totalRating / reviews.length).toFixed(2);

            await db.Service.update(
                {
                    rating: avgRating,
                    reviewCount: reviews.length
                },
                {
                    where: { id: serviceId }
                }
            );
        }
    }
}

module.exports = new ServiceService();
