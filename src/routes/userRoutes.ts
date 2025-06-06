import { Router } from 'express';
import {
    getAllUsers,
    getUserById,
    adminCreateUser,
    adminUpdateUser,
    adminChangeRole,
    adminDeleteUser
} from '../controllers/userController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Base routes - require authentication
router.get('/', authenticateToken, getAllUsers);                // List users based on role
router.get('/:id', authenticateToken, getUserById);            // View user details and posts

// Admin routes - require authentication and admin role
// Using properly chained middleware functions
router.use('/admin', authenticateToken, authorizeRole(['ADMIN']));  // Protect all admin routes

// Group all admin routes
router.post('/', adminCreateUser);         // Create new user
router.put('/:id', adminUpdateUser);       // Update user details
router.patch('/:id/role', adminChangeRole); // Change user role
router.delete('/:id', adminDeleteUser);     // Delete user

export default router;
