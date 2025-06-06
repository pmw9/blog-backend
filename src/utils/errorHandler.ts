import { Response } from 'express';

export const handleError = (error: any, res: Response) => {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
};
