import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// Get all reservations
export const getAllReservations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const reservations = await prisma.reservation.findMany({
      include: { user: { select: { id: true, username: true } } }
    });
    res.json(reservations);
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reservations' });
    return;
  }
};

// Get available times for a date
export const getAvailableTimes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.query;
    if (!date) {
      res.status(400).json({ message: "Date required" });
      return;
    }
    const allTimes = ['13:00', '19:00'];
    const reservations = await prisma.reservation.findMany({
      where: { date: new Date(date as string) },
      select: { time: true }
    });
    const booked = reservations.map((r: { time: string }) => r.time);
    const available = allTimes.filter(t => !booked.includes(t));
    res.json(available);
    return;
  } catch {
    res.status(500).json({ message: "Error checking availability" });
    return;
  }
};

// Book a reservation
export const bookReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("📩 Incoming request body:", req.body);
    const { userId, name, date, time, orders } = req.body;

    if (!userId || !date || !time || !name) {
      res.status(400).json({ message: 'Missing reservation details' });
      return;
    }

    // Ensure date is a Date object
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Example: Only allow MANAGER or ADMIN to book reservations
    if (!['MANAGER', 'ADMIN'].includes(req.user?.role)) {
      res.status(403).json({ message: 'Forbidden: Only managers or admins can book reservations.' });
      return;
    }

    // ✅ Save reservation in DB
    const reservation = await prisma.reservation.create({
      data: {
        userId,
        name,
        date: dateObj,
        time,
        orders: {
          create: orders.map((order: { item: string; price: number }) => ({
            menuItem: order.item,
            price: order.price
          }))
        }
      },
      include: { orders: true }
    });

    res.status(201).json(reservation);
    return;
  } catch (error) {
    console.error("Error creating reservation:", error);
    res.status(500).json({ message: 'Failed to create reservation' });
    return;
  }
};

// Get reservations for the logged-in user
export const getUserReservations = async (req: Request, res: Response): Promise<void> => {
  try {
    // Prefer authenticated user from req.user, fallback to userId in body (for flexibility)
    const userId = req.user?.id || req.body.userId;
    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }
    const reservations = await prisma.reservation.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });
    res.json(reservations);
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user reservations' });
    return;
  }
};

// Get today's reservations/orders
export const getTodaysReservations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const reservations = await prisma.reservation.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        }
      },
      include: { orders: true, user: { select: { username: true } } }
    });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch today\'s orders', error });
  }
};

// Mark a reservation as paid
export const markReservationPaid = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const reservation = await prisma.reservation.update({
      where: { id: Number(id) },
      data: { isPaid: true, status: 'paid' }
    });
    res.json({ message: 'Reservation marked as paid', reservation });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark as paid', error });
  }
};

// Get reservation reports
export const generateReport = async (_req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const reservations = await prisma.reservation.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        }
      },
      include: { orders: true }
    });
    const totalOrders = reservations.length;
    const totalRevenue = reservations
      .filter((r: { isPaid: boolean; orders: { price: number }[] }) => r.isPaid)
      .reduce((sum: number, r: { orders: { price: number }[] }) => sum + r.orders.reduce((s: number, o: { price: number }) => s + o.price, 0), 0);
    const dishCount: Record<string, number> = {};
    reservations.forEach((r: { orders: { menuItem: string }[] }) => {
      r.orders.forEach((o: { menuItem: string }) => {
        dishCount[o.menuItem] = (dishCount[o.menuItem] || 0) + 1;
      });
    });
    const mostOrderedDishes = Object.entries(dishCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([dish, count]) => ({ dish, count }));
    res.json({ totalOrders, totalRevenue, mostOrderedDishes });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate report', error });
  }
};

// Get today's orders
export const getTodaysOrders = async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const reservations = await prisma.reservation.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        }
      },
      include: { orders: true, user: { select: { username: true } } }
    });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch today\'s orders', error });
  }
};

// PATCH /api/reservations/:id/serve - Mark reservation as served
export const markAsServed = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await prisma.reservation.update({
      where: { id: Number(id) },
      data: { served: true },
    });
    res.status(200).json({ message: "Reservation marked as served.", updated });
  } catch (error) {
    res.status(500).json({ message: "Failed to update reservation.", error });
  }
};
