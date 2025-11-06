
// backend/routes/appointments.js
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Sequelize models
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

// --- Helper Functions ---
const updateUserAndWalletAfterAppointment = async (userId, appointment) => { /* ... (same as before) ... */ };

const findBestTherapist = async (serviceId, userId, date, time) => {
    // 1. Get service and its category name (use association ServiceCategory)
    const service = await db.Service.findByPk(serviceId, { include: [{ model: db.ServiceCategory }] });
    const serviceCategory = service && service.ServiceCategory ? service.ServiceCategory.name : null;
    if (!service || !serviceCategory) {
        console.warn(`Smart assignment: Service or service category not found for serviceId: ${serviceId}`);
        return null;
    }

    // 2. Get all technicians available for that time slot based on their registered availability
    // 2. Get all staff availability for that date/time and include the related User + Staff profile
    const availableStaffEntries = await db.StaffAvailability.findAll({
        where: {
            date: date,
            timeSlots: {
                [Op.like]: `%"time":"${time}"%`
            }
        },
        include: [{ 
            model: db.User, 
            where: { role: 'Staff', status: 'Active' },
            include: [{ model: db.Staff, as: 'staffProfile' }]
        }]
    });

    // Build eligible technicians from availability entries: ensure the matching time slot explicitly allows this serviceId
    let eligibleTechnicians = [];
    for (const avail of availableStaffEntries) {
        try {
            const slots = Array.isArray(avail.timeSlots) ? avail.timeSlots : [];
            const matchingSlot = slots.find(s => s.time === time);
            if (!matchingSlot) continue;
            // If availableServiceIds exists, ensure this serviceId is included (or allow all if missing)
            if (matchingSlot.availableServiceIds && Array.isArray(matchingSlot.availableServiceIds) && matchingSlot.availableServiceIds.length > 0) {
                if (!matchingSlot.availableServiceIds.includes(serviceId)) continue;
            }
            if (avail.User) eligibleTechnicians.push(avail.User);
        } catch (e) {
            // skip malformed availability entry
            continue;
        }
    }

    // 3. Filter by specialty and ensure they are not already booked at that time
    const bookedTherapistIds = (await db.Appointment.findAll({
        where: { date, time, status: { [Op.notIn]: ['cancelled', 'completed'] } },
        attributes: ['therapistId']
    })).map(app => app.therapistId);
    
    eligibleTechnicians = eligibleTechnicians.filter(tech => {
        // staffProfile holds specialty (array) and staffRole
        const staffProfile = tech.staffProfile || {};
        const specialties = Array.isArray(staffProfile.specialty) ? staffProfile.specialty : [];
        const hasSpecialty = specialties.length > 0 && serviceCategory && specialties.some(s => String(s).toLowerCase().includes(String(serviceCategory).toLowerCase()));
        const isTechnician = staffProfile.staffRole === 'Technician';
        const isAlreadyBooked = bookedTherapistIds.includes(tech.id);
        return isTechnician && hasSpecialty && !isAlreadyBooked;
    });

    if (eligibleTechnicians.length === 0) {
        console.log(`Smart assignment: No eligible technicians found for service '${service.name}' at ${date} ${time}.`);
        return null;
    }

    if (eligibleTechnicians.length === 1) {
        return eligibleTechnicians[0]; // Only one choice
    }

    // 4. Score the remaining technicians
    const scoredTechnicians = [];
    for (const tech of eligibleTechnicians) {
        let score = 0;

        // Score 1: Customer History (High weight)
        const pastAppointmentsCount = await db.Appointment.count({
            where: { userId: userId, therapistId: tech.id, status: 'completed' }
        });
        if (pastAppointmentsCount > 0) {
            score += 100 + (pastAppointmentsCount * 10); // Bonus for repeat visits
        }

        // Score 2: Workload Balancing (Medium weight, inverse)
        const dailyWorkload = await db.Appointment.count({
            where: { therapistId: tech.id, date: date, status: { [Op.not]: 'cancelled' } }
        });
        score += Math.max(0, 50 - (dailyWorkload * 10)); // Higher score for less work

    // Score 3: Staff Tier (Low weight) - read from staffProfile.staffTierId
    const staffTier = tech.staffProfile && tech.staffProfile.staffTierId ? tech.staffProfile.staffTierId : null;
    if (staffTier === 'Chuyên gia') score += 20;
    else if (staffTier === 'Thành thạo') score += 10;
        
        scoredTechnicians.push({ tech, score });
    }

    // 5. Find the best one
    if (scoredTechnicians.length === 0) return null;

    scoredTechnicians.sort((a, b) => b.score - a.score);

    console.log("Smart Assignment Scoring:", scoredTechnicians.map(s => ({name: s.tech.name, score: s.score})));

    return scoredTechnicians[0].tech;
};


// --- API Endpoints ---

// GET /api/appointments
router.get('/', async (req, res) => {
    try {
        const appointments = await db.Appointment.findAll({ include: ['Client', 'Therapist', 'Service'] });
        res.json(appointments);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/appointments/user/:userId
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const userAppointments = await db.Appointment.findAll({ where: { userId }, include: ['Service', 'Therapist'] });
        res.json(userAppointments);
    } catch (error) {
        console.error('Error fetching user appointments:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/appointments
router.post('/', async (req, res) => {
    const newAppointmentData = req.body;
    if (!newAppointmentData.serviceId || !newAppointmentData.userId || !newAppointmentData.date || !newAppointmentData.time) {
        return res.status(400).json({ message: 'Missing required appointment data' });
    }

    try {
        let finalTherapistId = newAppointmentData.therapistId;
        let finalTherapistName = newAppointmentData.therapist;

        // Smart assignment logic
        if (!newAppointmentData.therapistId || newAppointmentData.therapistId === 'any') {
            console.log("Attempting smart assignment...");
            const bestTherapist = await findBestTherapist(
                newAppointmentData.serviceId,
                newAppointmentData.userId,
                newAppointmentData.date,
                newAppointmentData.time
            );

            if (bestTherapist) {
                console.log(`Smart assignment selected: ${bestTherapist.name}`);
                finalTherapistId = bestTherapist.id;
                finalTherapistName = bestTherapist.name;
            } else {
                console.log('Smart assignment could not find an ideal therapist. Leaving unassigned.');
                finalTherapistId = null; 
                finalTherapistName = 'Sẽ được phân công';
            }
        }
        
        const service = await db.Service.findByPk(newAppointmentData.serviceId);
        if (!service) return res.status(404).json({ message: 'Service not found' });

        const createdAppointment = await db.Appointment.create({
            id: `apt-${uuidv4()}`,
            serviceName: service.name,
            status: 'pending',
            ...newAppointmentData,
            therapistId: finalTherapistId,
            therapist: finalTherapistName,
        });

        res.status(201).json(createdAppointment);
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/appointments/:id
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;

    try {
        const appointment = await db.Appointment.findByPk(id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        await appointment.update(updatedData);
        res.json(appointment);
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


module.exports = router;
