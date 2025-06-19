import { Request, Response, NextFunction } from 'express';

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role;
    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    next();
  };
};
