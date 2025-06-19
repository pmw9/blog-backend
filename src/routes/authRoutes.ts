import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { signup, login } from '../controllers/authController';
import prisma from '../utils/prisma';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

// GET /auth/me - return current user info if token is valid
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        dob: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user', error });
  }
});

export default router;
