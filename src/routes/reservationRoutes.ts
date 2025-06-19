import express from 'express';
import { getAvailableTimes, bookReservation, getAllReservations, getUserReservations, getTodaysReservations, markReservationPaid, generateReport, getTodaysOrders, markAsServed } from '../controllers/reservationController';
import { authorizeRoles } from '../middleware/authorize';
import prisma from '../utils/prisma';

const router = express.Router();

// Only MANAGER or ADMIN can view all reservations
router.get('/', authorizeRoles('ADMIN', 'MANAGER'), getAllReservations);

// Only MANAGER or ADMIN can book reservations
router.post('/', authorizeRoles('ADMIN', 'MANAGER'), bookReservation);

// Only MANAGER or ADMIN can get available times
router.get('/slots', authorizeRoles('ADMIN', 'MANAGER'), getAvailableTimes);

// Only MANAGER or ADMIN can get user reservations
router.get('/user', authorizeRoles('ADMIN', 'MANAGER'), getUserReservations);

// ADMIN, MANAGER, CASHIER can view today's reservations/orders
router.get('/today', authorizeRoles('ADMIN', 'MANAGER', 'CASHIER'), getTodaysReservations);

// CASHIER, ADMIN can mark reservation as paid
router.patch('/:id/mark-paid', authorizeRoles('CASHIER', 'ADMIN'), markReservationPaid);

// ADMIN, MANAGER can get reports
router.get('/reports', authorizeRoles('ADMIN', 'MANAGER'), generateReport);

// Book reservation with order details
router.post('/create', authorizeRoles('ADMIN', 'MANAGER', 'USER'), bookReservation);

// Get today's orders (Admin, Manager, Cashier)
router.get('/today', authorizeRoles('ADMIN', 'MANAGER', 'CASHIER'), getTodaysOrders);

// Mark reservation as paid (Admin, Cashier)
router.post('/mark-paid/:id', authorizeRoles('ADMIN', 'CASHIER'), markReservationPaid);

// Generate report (Admin only)
router.get('/report', authorizeRoles('ADMIN'), generateReport);

// Fetch unpaid reservations for Mark Paid page
router.get('/unpaid', async (_req, res) => {
  try {
    const reservations = await prisma.reservation.findMany({
      where: { isPaid: false },
      include: { user: { select: { username: true } } }
    });
    res.json(reservations);
  } catch {
    res.status(500).json({ message: "Could not fetch unpaid reservations" });
  }
});

// Get all reservations (Manager only)
router.get('/', async (_req, res) => {
  try {
    const reservations = await prisma.reservation.findMany({
      include: { user: { select: { username: true } } }
    });
    res.json(reservations);
  } catch {
    res.status(500).json({ message: "Could not load reservations" });
  }
});

// MANAGER & ADMIN: Get all reservations
router.get('/all', authorizeRoles('MANAGER', 'ADMIN'), async (_req, res) => {
  try {
    const reservations = await prisma.reservation.findMany({
      include: { user: { select: { username: true } } },
    });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

// CASHIER & ADMIN: Mark reservation as paid
router.patch('/:id/pay', authorizeRoles('CASHIER', 'ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.reservation.update({
      where: { id: parseInt(id) },
      data: { status: 'paid', isPaid: true },
    });
    res.json({ message: 'Marked as paid' });
  } catch (err) {
    res.status(500).json({ error: 'Error updating reservation' });
  }
});

// PATCH /api/reservations/:id/serve - Mark reservation as served (Cashier, Admin)
router.patch('/:id/serve', authorizeRoles('CASHIER', 'ADMIN'), markAsServed);

export default router;
