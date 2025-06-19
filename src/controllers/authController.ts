import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import dotenv from 'dotenv';

import { comparePassword, hashPassword } from '../utils/hash';

dotenv.config();

export const signup = async (req: Request, res: Response): Promise<any> => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Validate role if provided
    const allowedRoles = ['USER', 'ADMIN', 'MANAGER', 'CASHIER'] as const;
    type AllowedRole = typeof allowedRoles[number];
    let assignedRole: AllowedRole = 'USER';
    if (role) {
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      assignedRole = role;
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: assignedRole,
      },
      select: {
        id: true,
        username: true,
        role: true
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.status(201).json({ user, token });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Signup failed', error: error.message || error });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        password: true,
        role: true
      }
    });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Compare password
    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Remove password from user object before sending
    const { password: _, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword, token });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message || error });
  }
};