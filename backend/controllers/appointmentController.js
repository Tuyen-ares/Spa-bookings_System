// backend/controllers/appointmentController.js
const appointmentService = require('../services/appointmentService');

class AppointmentController {
    /**
     * GET /api/appointments - Get all appointments
     */
    async getAllAppointments(req, res) {
        try {
            const filters = {
                status: req.query.status,
                date: req.query.date,
                userId: req.query.userId,
                therapistId: req.query.therapistId
            };

            const appointments = await appointmentService.getAllAppointments(filters);
            res.json(appointments);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            res.status(500).json({
                error: 'Failed to fetch appointments',
                message: error.message
            });
        }
    }

    /**
     * GET /api/appointments/:id - Get appointment by ID
     */
    async getAppointmentById(req, res) {
        try {
            const { id } = req.params;
            const appointment = await appointmentService.getAppointmentById(id);
            res.json(appointment);
        } catch (error) {
            console.error('Error fetching appointment:', error);
            if (error.message === 'Appointment not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({
                    error: 'Failed to fetch appointment',
                    message: error.message
                });
            }
        }
    }

    /**
     * POST /api/appointments - Create new appointment
     */
    async createAppointment(req, res) {
        try {
            const appointment = await appointmentService.createAppointment(req.body);
            res.status(201).json(appointment);
        } catch (error) {
            console.error('Error creating appointment:', error);
            res.status(500).json({
                error: 'Failed to create appointment',
                message: error.message
            });
        }
    }

    /**
     * PUT /api/appointments/:id - Update appointment
     */
    async updateAppointment(req, res) {
        try {
            const { id } = req.params;
            const appointment = await appointmentService.updateAppointment(id, req.body);
            res.json(appointment);
        } catch (error) {
            console.error('Error updating appointment:', error);
            if (error.message === 'Appointment not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({
                    error: 'Failed to update appointment',
                    message: error.message
                });
            }
        }
    }

    /**
     * PUT /api/appointments/:id/cancel - Cancel appointment
     */
    async cancelAppointment(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const appointment = await appointmentService.cancelAppointment(id, reason);
            res.json(appointment);
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            if (error.message === 'Appointment not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({
                    error: 'Failed to cancel appointment',
                    message: error.message
                });
            }
        }
    }

    /**
     * PUT /api/appointments/:id/complete - Complete appointment
     */
    async completeAppointment(req, res) {
        try {
            const { id } = req.params;
            const { staffNotes } = req.body;
            const appointment = await appointmentService.completeAppointment(id, staffNotes);
            res.json(appointment);
        } catch (error) {
            console.error('Error completing appointment:', error);
            if (error.message === 'Appointment not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({
                    error: 'Failed to complete appointment',
                    message: error.message
                });
            }
        }
    }

    /**
     * DELETE /api/appointments/:id - Delete appointment
     */
    async deleteAppointment(req, res) {
        try {
            const { id } = req.params;
            const result = await appointmentService.deleteAppointment(id);
            res.json(result);
        } catch (error) {
            console.error('Error deleting appointment:', error);
            if (error.message === 'Appointment not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({
                    error: 'Failed to delete appointment',
                    message: error.message
                });
            }
        }
    }

    /**
     * GET /api/appointments/range/:startDate/:endDate - Get appointments by date range
     */
    async getAppointmentsByDateRange(req, res) {
        try {
            const { startDate, endDate } = req.params;
            const filters = {
                therapistId: req.query.therapistId,
                userId: req.query.userId,
                status: req.query.status
            };

            const appointments = await appointmentService.getAppointmentsByDateRange(
                startDate,
                endDate,
                filters
            );
            res.json(appointments);
        } catch (error) {
            console.error('Error fetching appointments by date range:', error);
            res.status(500).json({
                error: 'Failed to fetch appointments',
                message: error.message
            });
        }
    }
}

module.exports = new AppointmentController();
