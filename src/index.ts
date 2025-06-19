import dotenv from 'dotenv';
dotenv.config(); // Load environment variables as early as possible

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
import postRoutes from './routes/postRoutes';
import commentRoutes from './routes/commentRoutes';
import authRoutes from './routes/authRoutes';
import contactRoutes from './routes/contactRoutes';
import reservationRoutes from './routes/reservationRoutes';
import adminRoutes from './routes/adminRoutes';
import reportRoutes from './routes/reportRoutes';
import reviewRoutes from './routes/reviewRoutes';
import { seedAdminUser } from './utils/seedAdmin';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Homepage route
app.get('/', (_req: Request, res: Response) => {
    res.send('Welcome to the homepage!');
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/reviews', reviewRoutes);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
app.listen(port, async () => {
    try {
        await seedAdminUser();
        console.log(`Server is running on http://localhost:${port}`);
    } catch (err) {
        console.error('Failed to seed admin user:', err);
        process.exit(1);
    }
});