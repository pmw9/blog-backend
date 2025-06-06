import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

dotenv.config();

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.sendStatus(401);
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
    if (err) {
      res.sendStatus(403);
      return;
    }

    if (!decoded) {
      res.sendStatus(401);
      return;
    }

    // Set user info including role from the JWT token
    req.user = {
      id: decoded.userId,
      role: decoded.role
    };
    next();
  });
};

export const authorizeRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = (req.user as any).role;
    if (!roles.includes(userRole)) {
      res.status(403).json({ 
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
      return;
    }
    next();
  };
};
