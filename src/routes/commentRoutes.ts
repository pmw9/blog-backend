import express from 'express';
import { createComment, getAllComments, deleteComment } from '../controllers/commentController';
import { authenticateToken } from '../middleware/authMiddleware';
const router = express.Router();

// Public routes
router.get('/', getAllComments);
router.post('/', (req, _res, next) => {
    // Add empty user object for unauthenticated requests
    if (!req.headers.authorization) {
        req.user = undefined;
    }
    next();
}, createComment);

// Protected routes
router.delete('/:id', authenticateToken, deleteComment);

export default router;
