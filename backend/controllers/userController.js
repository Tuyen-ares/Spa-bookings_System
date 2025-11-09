// backend/controllers/userController.js
const userService = require('../services/userService');

class UserController {
    /**
     * GET /api/users - Get all users
     */
    async getAllUsers(req, res) {
        try {
            const filters = {
                role: req.query.role,
                status: req.query.status
            };

            const users = await userService.getAllUsers(filters);
            res.json(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({
                error: 'Failed to fetch users',
                message: error.message
            });
        }
    }

    /**
     * GET /api/users/:id - Get user by ID
     */
    async getUserById(req, res) {
        try {
            const { id } = req.params;
            const user = await userService.getUserById(id);
            res.json(user);
        } catch (error) {
            console.error('Error fetching user:', error);
            if (error.message === 'User not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({
                    error: 'Failed to fetch user',
                    message: error.message
                });
            }
        }
    }

    /**
     * POST /api/users - Create new user
     */
    async createUser(req, res) {
        try {
            const user = await userService.createUser(req.body);
            res.status(201).json(user);
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(400).json({
                error: 'Failed to create user',
                message: error.message
            });
        }
    }

    /**
     * PUT /api/users/:id - Update user
     */
    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const user = await userService.updateUser(id, req.body);
            res.json(user);
        } catch (error) {
            console.error('Error updating user:', error);
            if (error.message === 'User not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(400).json({
                    error: 'Failed to update user',
                    message: error.message
                });
            }
        }
    }

    /**
     * DELETE /api/users/:id - Delete user
     */
    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const result = await userService.deleteUser(id);
            res.json(result);
        } catch (error) {
            console.error('Error deleting user:', error);
            if (error.message === 'User not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({
                    error: 'Failed to delete user',
                    message: error.message
                });
            }
        }
    }

    /**
     * GET /api/users/:id/profile - Get user profile
     */
    async getUserProfile(req, res) {
        try {
            const { id } = req.params;
            const profile = await userService.getUserProfile(id);
            res.json(profile);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            if (error.message === 'User not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({
                    error: 'Failed to fetch user profile',
                    message: error.message
                });
            }
        }
    }

    /**
     * PATCH /api/users/:id/status - Update user status
     */
    async updateUserStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const user = await userService.updateUserStatus(id, status);
            res.json(user);
        } catch (error) {
            console.error('Error updating user status:', error);
            if (error.message === 'User not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(400).json({
                    error: 'Failed to update user status',
                    message: error.message
                });
            }
        }
    }
}

module.exports = new UserController();
