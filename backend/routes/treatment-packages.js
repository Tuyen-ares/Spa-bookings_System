// backend/routes/treatment-packages.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

// GET /api/treatment-packages - Get all packages (public + admin)
router.get('/', async (req, res) => {
    try {
        const { activeOnly, featured } = req.query;
        
        const where = {};
        if (activeOnly === 'true') {
            where.isActive = true;
        }
        if (featured === 'true') {
            where.isFeatured = true;
        }

        const packages = await db.TreatmentPackage.findAll({
            where,
            include: [{
                model: db.Service,
                as: 'PackageServices',
                through: {
                    attributes: ['serviceName', 'order', 'sessionsPerService']
                },
                attributes: ['id', 'name', 'price', 'duration', 'description']
            }],
            order: [
                ['displayOrder', 'ASC'],
                ['isFeatured', 'DESC'],
                ['createdAt', 'DESC']
            ]
        });

        // Format response
        const formattedPackages = packages.map(pkg => {
            const pkgData = pkg.toJSON();
            if (pkgData.PackageServices && pkgData.PackageServices.length > 0) {
                pkgData.services = pkgData.PackageServices.map(service => ({
                    serviceId: service.id,
                    serviceName: service.TreatmentPackageService?.serviceName || service.name,
                    order: service.TreatmentPackageService?.order || 0,
                    sessionsPerService: service.TreatmentPackageService?.sessionsPerService || 1,
                    duration: service.duration,
                    description: service.description
                })).sort((a, b) => a.order - b.order);
            }
            // Parse benefits if JSON string
            if (pkgData.benefits && typeof pkgData.benefits === 'string') {
                try {
                    pkgData.benefits = JSON.parse(pkgData.benefits);
                } catch (e) {
                    pkgData.benefits = [];
                }
            }
            return pkgData;
        });

        res.json(formattedPackages);
    } catch (error) {
        console.error('Error fetching treatment packages:', error);
        res.status(500).json({ message: 'Error fetching treatment packages', error: error.message });
    }
});

// GET /api/treatment-packages/:id - Get package details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const package = await db.TreatmentPackage.findByPk(id, {
            include: [{
                model: db.Service,
                as: 'PackageServices',
                through: {
                    attributes: ['serviceName', 'order', 'sessionsPerService']
                },
                attributes: ['id', 'name', 'price', 'duration', 'description', 'imageUrl']
            }]
        });

        if (!package) {
            return res.status(404).json({ message: 'Treatment package not found' });
        }

        const pkgData = package.toJSON();
        if (pkgData.PackageServices && pkgData.PackageServices.length > 0) {
            pkgData.services = pkgData.PackageServices.map(service => ({
                serviceId: service.id,
                serviceName: service.TreatmentPackageService?.serviceName || service.name,
                order: service.TreatmentPackageService?.order || 0,
                sessionsPerService: service.TreatmentPackageService?.sessionsPerService || 1,
                duration: service.duration,
                description: service.description,
                imageUrl: service.imageUrl
            })).sort((a, b) => a.order - b.order);
        }
        
        // Parse benefits
        if (pkgData.benefits && typeof pkgData.benefits === 'string') {
            try {
                pkgData.benefits = JSON.parse(pkgData.benefits);
            } catch (e) {
                pkgData.benefits = [];
            }
        }

        res.json(pkgData);
    } catch (error) {
        console.error('Error fetching package details:', error);
        res.status(500).json({ message: 'Error fetching package details', error: error.message });
    }
});

// POST /api/treatment-packages - Create new package (admin only)
router.post('/', async (req, res) => {
    const transaction = await db.sequelize.transaction();
    
    try {
        const {
            name,
            description,
            price,
            originalPrice,
            totalSessions,
            duration,
            benefits,
            imageUrl,
            isActive,
            isFeatured,
            displayOrder,
            minSessionsPerWeek,
            maxSessionsPerWeek,
            services
        } = req.body;

        // Validate
        if (!name || !price || !totalSessions) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Missing required fields: name, price, totalSessions'
            });
        }

        if (!services || services.length === 0) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'At least one service must be specified'
            });
        }

        // Create package
        const package = await db.TreatmentPackage.create({
            id: `pkg-${uuidv4()}`,
            name,
            description,
            price,
            originalPrice,
            totalSessions,
            duration,
            benefits: typeof benefits === 'object' ? JSON.stringify(benefits) : benefits,
            imageUrl,
            isActive: isActive !== undefined ? isActive : true,
            isFeatured: isFeatured || false,
            displayOrder: displayOrder || 0,
            minSessionsPerWeek: minSessionsPerWeek || 2,
            maxSessionsPerWeek: maxSessionsPerWeek || 3
        }, { transaction });

        // Create service associations
        const serviceAssociations = [];
        for (let i = 0; i < services.length; i++) {
            const { serviceId, serviceName, order, sessionsPerService } = services[i];
            const service = await db.Service.findByPk(serviceId);
            
            if (service) {
                serviceAssociations.push({
                    treatmentPackageId: package.id,
                    serviceId,
                    serviceName: serviceName || service.name,
                    order: order !== undefined ? order : i + 1,
                    sessionsPerService: sessionsPerService || 1
                });
            }
        }

        await db.TreatmentPackageService.bulkCreate(serviceAssociations, { transaction });

        await transaction.commit();

        console.log(`✅ Created treatment package ${package.id} with ${serviceAssociations.length} services`);

        res.status(201).json({
            package,
            services: serviceAssociations,
            message: `Treatment package created with ${serviceAssociations.length} services`
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error creating treatment package:', error);
        res.status(500).json({ message: 'Error creating treatment package', error: error.message });
    }
});

// PUT /api/treatment-packages/:id - Update package
router.put('/:id', async (req, res) => {
    const transaction = await db.sequelize.transaction();
    
    try {
        const { id } = req.params;
        const { services, benefits, ...updates } = req.body;

        const package = await db.TreatmentPackage.findByPk(id);
        if (!package) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Treatment package not found' });
        }

        // Update package info
        if (benefits !== undefined) {
            updates.benefits = typeof benefits === 'object' ? JSON.stringify(benefits) : benefits;
        }
        await package.update(updates, { transaction });

        // Update services if provided
        if (services && Array.isArray(services)) {
            await db.TreatmentPackageService.destroy({
                where: { treatmentPackageId: id },
                transaction
            });

            const serviceAssociations = [];
            for (let i = 0; i < services.length; i++) {
                const { serviceId, serviceName, order, sessionsPerService } = services[i];
                const service = await db.Service.findByPk(serviceId);
                
                if (service) {
                    serviceAssociations.push({
                        treatmentPackageId: id,
                        serviceId,
                        serviceName: serviceName || service.name,
                        order: order !== undefined ? order : i + 1,
                        sessionsPerService: sessionsPerService || 1
                    });
                }
            }

            if (serviceAssociations.length > 0) {
                await db.TreatmentPackageService.bulkCreate(serviceAssociations, { transaction });
            }
        }

        await transaction.commit();

        const updatedPackage = await db.TreatmentPackage.findByPk(id, {
            include: [{
                model: db.Service,
                as: 'PackageServices',
                through: { attributes: ['serviceName', 'order', 'sessionsPerService'] }
            }]
        });

        res.json({
            package: updatedPackage,
            message: 'Treatment package updated successfully'
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating treatment package:', error);
        res.status(500).json({ message: 'Error updating treatment package', error: error.message });
    }
});

// DELETE /api/treatment-packages/:id - Delete package
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const package = await db.TreatmentPackage.findByPk(id);
        if (!package) {
            return res.status(404).json({ message: 'Treatment package not found' });
        }

        // Check if any courses are using this package
        const coursesCount = await db.TreatmentCourse.count({
            where: { packageId: id }
        });

        if (coursesCount > 0) {
            return res.status(400).json({
                message: `Cannot delete package. ${coursesCount} treatment course(s) are using this package.`,
                coursesCount
            });
        }

        await package.destroy();

        res.json({
            message: 'Treatment package deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting treatment package:', error);
        res.status(500).json({ message: 'Error deleting treatment package', error: error.message });
    }
});

// POST /api/treatment-packages/:id/enroll - Customer enrolls in package
router.post('/:id/enroll', async (req, res) => {
    const transaction = await db.sequelize.transaction();
    
    try {
        const { id: packageId } = req.params;
        const { clientId, consultantName, treatmentGoals, initialSkinCondition } = req.body;

        if (!clientId) {
            await transaction.rollback();
            return res.status(400).json({ message: 'clientId is required' });
        }

        // Get package details
        const package = await db.TreatmentPackage.findByPk(packageId, {
            include: [{
                model: db.Service,
                as: 'PackageServices',
                through: { attributes: ['serviceName', 'order', 'sessionsPerService'] }
            }]
        });

        if (!package) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Treatment package not found' });
        }

        if (!package.isActive) {
            await transaction.rollback();
            return res.status(400).json({ message: 'This package is not available' });
        }

        // Calculate expiry date
        const startDate = new Date();
        const expiryDate = new Date(startDate);
        if (package.duration) {
            expiryDate.setDate(expiryDate.getDate() + package.duration);
        } else {
            // Default: calculate based on sessions
            const weeksNeeded = package.totalSessions / (package.minSessionsPerWeek || 2);
            expiryDate.setDate(expiryDate.getDate() + Math.ceil(weeksNeeded * 7) + 14); // +14 days buffer
        }

        // Create treatment course
        const course = await db.TreatmentCourse.create({
            id: `tc-${uuidv4()}`,
            packageId,
            name: package.name,
            price: package.price,
            clientId,
            totalSessions: package.totalSessions,
            sessionsPerWeek: package.minSessionsPerWeek || 2,
            sessionDuration: 60, // default
            treatmentGoals,
            initialSkinCondition,
            consultantName,
            startDate: startDate.toISOString().split('T')[0],
            expiryDate: expiryDate.toISOString().split('T')[0],
            status: 'active',
            progressPercentage: 0,
            completedSessions: 0,
            isPaused: false
        }, { transaction });

        // Copy services from package to course
        if (package.PackageServices && package.PackageServices.length > 0) {
            const serviceAssociations = package.PackageServices.map(service => ({
                treatmentCourseId: course.id,
                serviceId: service.id,
                serviceName: service.TreatmentPackageService?.serviceName || service.name,
                order: service.TreatmentPackageService?.order || 0
            }));

            await db.TreatmentCourseService.bulkCreate(serviceAssociations, { transaction });
        }

        // Auto-generate sessions
        const sessions = [];
        const startDateObj = new Date(startDate);
        const daysBetweenSessions = Math.floor(7 / (package.minSessionsPerWeek || 2));

        for (let i = 1; i <= package.totalSessions; i++) {
            const sessionDate = new Date(startDateObj);
            sessionDate.setDate(sessionDate.getDate() + ((i - 1) * daysBetweenSessions));

            sessions.push({
                id: `ts-${uuidv4()}`,
                treatmentCourseId: course.id,
                sessionNumber: i,
                scheduledDate: sessionDate.toISOString().split('T')[0],
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        await db.TreatmentSession.bulkCreate(sessions, { transaction });

        await transaction.commit();

        console.log(`✅ Customer ${clientId} enrolled in package ${packageId}, created course ${course.id}`);

        res.status(201).json({
            course,
            package: {
                id: package.id,
                name: package.name
            },
            sessions: sessions.length,
            message: 'Successfully enrolled in treatment package'
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error enrolling in package:', error);
        res.status(500).json({ message: 'Error enrolling in package', error: error.message });
    }
});

module.exports = router;
