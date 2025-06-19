import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, role: true }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load users' });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const validRoles = ['USER', 'ADMIN', 'MANAGER', 'CASHIER'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { role },
      select: { id: true, username: true, role: true }
    });
    res.json(updatedUser);
    return;
  } catch (err) {
    res.status(500).json({ message: 'Failed to update role' });
    return;
  }
};
