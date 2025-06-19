import { Request, Response } from 'express';

export const sendContactMessage = async (req: Request, res: Response): Promise<void> => {
  const { name, email, message } = req.body;
  console.log('Contact form submitted:', name, email, message);
  res.status(200).json({ message: 'Message received!' });
};
