import express from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/authorize';

const router = express.Router();

// ADMIN: Get all pending reviews
router.get('/pending', authenticateToken, authorizeRoles('ADMIN'), async (_req, res) => {
  const reviews = await prisma.comment.findMany({ where: { approved: false } });
  res.json(reviews);
});

// ADMIN: Approve a review
router.patch('/:id/approve', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  await prisma.comment.update({
    where: { id: parseInt(req.params.id) },
    data: { approved: true },
  });
  res.json({ message: 'Review approved' });
});

// ADMIN: Delete a review
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  await prisma.comment.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ message: 'Review deleted' });
});

// PUBLIC: Get all approved reviews with stars and comments (for Reviews tab)
router.get('/', async (_req, res) => {
  try {
    const reviews = await prisma.comment.findMany({
      where: { approved: true },
      select: {
        id: true,
        content: true,
        createdAt: true,
        userName: true,
        stars: true, // Remove or adjust if your model uses a different field name
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reviews);
  } catch {
    res.status(500).json({ message: 'Could not fetch reviews' });
  }
});

export default router;
