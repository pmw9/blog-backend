import express from 'express';
import prisma from '../utils/prisma';

const router = express.Router();

// Report summary endpoint for admin
router.get('/summary', async (_req, res) => {
  try {
    const count = await prisma.reservation.count();
    // If you have an 'amount' field, use it. Otherwise, sum order prices for paid reservations.
    const paidReservations = await prisma.reservation.findMany({
      where: { isPaid: true },
      include: { orders: true }
    });
    const totalRevenue = paidReservations.reduce((sum: number, r: { orders: { price: number }[] }) => sum + r.orders.reduce((s: number, o: { price: number }) => s + o.price, 0), 0);
    res.json({
      totalReservations: count,
      revenue: totalRevenue
    });
  } catch {
    res.status(500).json({ message: "Could not generate report" });
  }
});

export default router;
