import express from 'express';
import { sendContactMessage } from '../controllers/contactController';

const router = express.Router();

// POST /api/contact
router.post('/api/contact', sendContactMessage);

export default router;
