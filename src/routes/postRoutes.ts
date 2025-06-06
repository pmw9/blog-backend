import express from 'express';
import {
  getPosts,
  createPost,
  updatePost,
  deletePost,
} from '../controllers/postController';
import { authenticateToken } from '../middleware/authMiddleware';
const router = express.Router();

// Public routes
router.get('/', getPosts);

// Protected routes - require authentication
router.post('/', authenticateToken, createPost);
router.put('/:id', authenticateToken, updatePost);
router.delete('/:id', authenticateToken, deletePost);

export default router;
