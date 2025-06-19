import express from 'express';
import { authorizeRoles } from '../middleware/authorize';
import { authenticateToken } from '../middleware/authMiddleware';
import { getUsers, updateUserRole } from '../controllers/adminController';

const router = express.Router();

// Admin-only route
router.get('/admin-panel', authorizeRoles('ADMIN'), (_req, res) => {
  res.send('Admin content');
});

// Manager and Cashier route
router.get('/sales', authorizeRoles('MANAGER', 'CASHIER'), (_req, res) => {
  res.send('Sales dashboard');
});

// Only CASHIER or ADMIN can mark paid
router.post('/mark-paid', authorizeRoles('CASHIER', 'ADMIN'), (_req, res) => {
  res.send('Marked as paid');
});

// GET /api/admin/users - List all users (id, username, role)
router.get('/users', authenticateToken, (req, res, next) => {
  getUsers(req, res).catch(next);
});

// PUT /api/admin/users/:id/role - Update a user's role (admin only)
router.put('/users/:id/role', authenticateToken, (req, res, next) => {
  updateUserRole(req, res).catch(next);
});

export default router;
