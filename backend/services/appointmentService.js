// backend/services/appointmentService.js
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

class AppointmentService {
    /**
     * Smart therapist assignment algorithm
     */
    async findBestTherapist(serviceId, userId, date, time) {
        // 1. Get service info
        const service = await db.Service.findByPk(serviceId, {
            include: [{ model: db.ServiceCategory }]
        });

        if (!service) {
            console.warn(`Service not found for serviceId: ${serviceId}`);
            return null;
        }

        // 2. Get available staff for the time slot
        const availableStaffEntries = await db.StaffAvailability.findAll({
            where: {
                date: date,
                timeSlots: {
                    [Op.like]: `%"time":"${time}"%`
                }
            },
            include: [{
                model: db.User,
                where: { role: 'Staff', status: 'Active' }
            }]
        });

        // Build eligible technicians
        let eligibleTechnicians = [];
        for (const avail of availableStaffEntries) {
            try {
                const slots = Array.isArray(avail.timeSlots) ? avail.timeSlots : [];
                const matchingSlot = slots.find(s => s.time === time);
                if (!matchingSlot) continue;

                // Check if service is available in this slot
                if (matchingSlot.availableServiceIds && 
                    Array.isArray(matchingSlot.availableServiceIds) && 
                    matchingSlot.availableServiceIds.length > 0) {
                    if (!matchingSlot.availableServiceIds.includes(serviceId)) continue;
                }

                if (avail.User) eligibleTechnicians.push(avail.User);
            } catch (e) {
                continue;
            }
        }

        // 3. Filter out already booked therapists
        const bookedTherapistIds = (await db.Appointment.findAll({
            where: {
                date,
                time,
                status: { [Op.notIn]: ['cancelled', 'completed'] }
            },
            attributes: ['therapistId']
        })).map(app => app.therapistId);

        eligibleTechnicians = eligibleTechnicians.filter(tech => {
            return !bookedTherapistIds.includes(tech.id);
        });

        if (eligibleTechnicians.length === 0) {
            console.log(`No eligible technicians found for service at ${date} ${time}`);
            return null;
        }

        if (eligibleTechnicians.length === 1) {
            return eligibleTechnicians[0];
        }

        // 4. Score technicians
        const scoredTechnicians = [];
        for (const tech of eligibleTechnicians) {
            let score = 0;

            // Customer history (High weight)
            const pastAppointmentsCount = await db.Appointment.count({
                where: { userId: userId, therapistId: tech.id, status: 'completed' }
            });
            if (pastAppointmentsCount > 0) {
                score += 100 + (pastAppointmentsCount * 10);
            }

            // Workload balancing (Medium weight)
            const dailyWorkload = await db.Appointment.count({
                where: {
                    therapistId: tech.id,
                    date: date,
                    status: { [Op.not]: 'cancelled' }
                }
            });
            score += Math.max(0, 50 - (dailyWorkload * 10));

            scoredTechnicians.push({ tech, score });
        }

        // Sort by score descending
        scoredTechnicians.sort((a, b) => b.score - a.score);
        return scoredTechnicians[0].tech;
    }

    /**
     * Get all appointments
     */
    async getAllAppointments(filters = {}) {
        const where = {};
        
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.date) {
            where.date = filters.date;
        }
        if (filters.userId) {
            where.userId = filters.userId;
        }
        if (filters.therapistId) {
            where.therapistId = filters.therapistId;
        }

        const appointments = await db.Appointment.findAll({
            where,
            order: [['date', 'DESC'], ['time', 'DESC']],
            include: [
                {
                    model: db.User,
                    as: 'Client',
                    attributes: ['id', 'name', 'email', 'phone'],
                    required: false
                },
                {
                    model: db.User,
                    as: 'Therapist',
                    attributes: ['id', 'name', 'phone'],
                    required: false
                },
                {
                    model: db.Service,
                    attributes: ['id', 'name', 'price', 'duration'],
                    required: false
                }
            ]
        });

        return appointments;
    }

    /**
     * Get appointment by ID
     */
    async getAppointmentById(id) {
        const appointment = await db.Appointment.findByPk(id, {
            include: [
                {
                    model: db.User,
                    as: 'Client',
                    attributes: ['id', 'name', 'email', 'phone']
                },
                {
                    model: db.User,
                    as: 'Therapist',
                    attributes: ['id', 'name', 'phone']
                },
                {
                    model: db.Service,
                    attributes: ['id', 'name', 'price', 'duration', 'description']
                }
            ]
        });

        if (!appointment) {
            throw new Error('Appointment not found');
        }

        return appointment;
    }

    /**
     * Create new appointment
     */
    async createAppointment(data) {
        const { serviceId, userId, date, time, autoAssign = true } = data;

        // Validate service
        const service = await db.Service.findByPk(serviceId);
        if (!service) {
            throw new Error('Service not found');
        }

        // Validate user
        const user = await db.User.findByPk(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Auto-assign therapist if requested
        let therapistId = data.therapistId;
        let therapistName = data.therapist;

        if (autoAssign && !therapistId) {
            const bestTherapist = await this.findBestTherapist(serviceId, userId, date, time);
            if (bestTherapist) {
                therapistId = bestTherapist.id;
                therapistName = bestTherapist.name;
            }
        }

        // Create appointment
        const appointment = await db.Appointment.create({
            id: uuidv4(),
            serviceId,
            serviceName: service.name,
            userId,
            userName: user.name,
            date,
            time,
            therapistId,
            therapist: therapistName,
            status: data.status || 'pending',
            paymentStatus: data.paymentStatus || 'Unpaid',
            notesForTherapist: data.notesForTherapist || '',
            bookingGroupId: data.bookingGroupId || uuidv4()
        });

        return appointment;
    }

    /**
     * Update appointment
     */
    async updateAppointment(id, data) {
        const appointment = await db.Appointment.findByPk(id);
        if (!appointment) {
            throw new Error('Appointment not found');
        }

        await appointment.update(data);
        return appointment;
    }

    /**
     * Cancel appointment
     */
    async cancelAppointment(id, reason) {
        const appointment = await db.Appointment.findByPk(id);
        if (!appointment) {
            throw new Error('Appointment not found');
        }

        await appointment.update({
            status: 'cancelled',
            rejectionReason: reason
        });

        return appointment;
    }

    /**
     * Complete appointment
     */
    async completeAppointment(id, staffNotes) {
        const appointment = await db.Appointment.findByPk(id);
        if (!appointment) {
            throw new Error('Appointment not found');
        }

        await appointment.update({
            status: 'completed',
            isCompleted: true,
            staffNotesAfterSession: staffNotes
        });

        // Award points to customer
        if (appointment.userId) {
            await this.awardPointsToCustomer(appointment.userId, appointment);
        }

        return appointment;
    }

    /**
     * Award points to customer after completing appointment
     */
    async awardPointsToCustomer(userId, appointment) {
        try {
            // Get service to calculate points
            const service = await db.Service.findByPk(appointment.serviceId);
            if (!service) return;

            // Calculate points (1 point per 10,000 VND)
            const pointsEarned = Math.floor(service.price / 10000);

            // Update wallet
            const wallet = await db.Wallet.findOne({ where: { userId } });
            if (wallet) {
                const currentPoints = wallet.points || 0;
                const currentHistory = wallet.pointsHistory || [];

                currentHistory.push({
                    date: new Date().toISOString(),
                    pointsChange: pointsEarned,
                    type: 'earn',
                    source: 'appointment_completion',
                    description: `Hoàn thành dịch vụ: ${appointment.serviceName}`
                });

                await wallet.update({
                    points: currentPoints + pointsEarned,
                    totalEarned: (wallet.totalEarned || 0) + pointsEarned,
                    pointsHistory: currentHistory
                });
            }
        } catch (error) {
            console.error('Error awarding points:', error);
        }
    }

    /**
     * Delete appointment
     */
    async deleteAppointment(id) {
        const appointment = await db.Appointment.findByPk(id);
        if (!appointment) {
            throw new Error('Appointment not found');
        }

        await appointment.destroy();
        return { message: 'Appointment deleted successfully' };
    }

    /**
     * Get appointments by date range
     */
    async getAppointmentsByDateRange(startDate, endDate, filters = {}) {
        const where = {
            date: {
                [Op.between]: [startDate, endDate]
            }
        };

        if (filters.therapistId) {
            where.therapistId = filters.therapistId;
        }
        if (filters.userId) {
            where.userId = filters.userId;
        }
        if (filters.status) {
            where.status = filters.status;
        }

        const appointments = await db.Appointment.findAll({
            where,
            order: [['date', 'ASC'], ['time', 'ASC']],
            include: [
                {
                    model: db.User,
                    as: 'Client',
                    attributes: ['id', 'name', 'phone']
                },
                {
                    model: db.User,
                    as: 'Therapist',
                    attributes: ['id', 'name']
                }
            ]
        });

        return appointments;
    }
}

module.exports = new AppointmentService();
