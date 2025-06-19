import express from 'express';
import { getUserProfile, updateUserProfile, updateUserRole } from '../controllers/userController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/authorize';
import prisma from '../utils/prisma';

const router = express.Router();

// Only ADMIN can access all users
router.get('/users/:id/profile', authorizeRoles('ADMIN'), function(req, res, next) { getUserProfile(req, res).catch(next); });
// Only ADMIN can update any user profile
router.put('/users/:id/profile', authorizeRoles('ADMIN'), function(req, res, next) { updateUserProfile(req, res).catch(next); });
// ADMIN: Get all users
router.get('/', authenticateToken, authorizeRoles('ADMIN'), async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, role: true }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load users' });
  }
});
// ADMIN: Update user role
router.patch('/:id/role', authenticateToken, authorizeRoles('ADMIN'), (req, res, next) => {
  updateUserRole(req, res).catch(next);
});

export default router;
