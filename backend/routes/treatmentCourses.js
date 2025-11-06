// backend/routes/treatmentCourses.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// GET /api/treatment-courses - list all treatment courses
router.get('/', async (req, res) => {
  try {
    const courses = await db.TreatmentCourse.findAll();
    res.json(courses);
  } catch (error) {
    console.error('Error fetching treatment courses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/treatment-courses/:id - get single course
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const course = await db.TreatmentCourse.findByPk(id);
    if (!course) return res.status(404).json({ message: 'Treatment course not found' });
    res.json(course);
  } catch (error) {
    console.error('Error fetching treatment course:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/treatment-courses - create
router.post('/', async (req, res) => {
  const data = req.body;
  try {
    const created = await db.TreatmentCourse.create({ id: `tc-${uuidv4()}`, ...data });
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating treatment course:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/treatment-courses/:id - update
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const course = await db.TreatmentCourse.findByPk(id);
    if (!course) return res.status(404).json({ message: 'Treatment course not found' });
    await course.update(req.body);
    res.json(course);
  } catch (error) {
    console.error('Error updating treatment course:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/treatment-courses/:id - delete
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.TreatmentCourse.destroy({ where: { id } });
    if (result > 0) return res.status(204).send();
    res.status(404).json({ message: 'Treatment course not found' });
  } catch (error) {
    console.error('Error deleting treatment course:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
