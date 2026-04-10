import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/auth';
import logger from '../lib/logger';

export interface AuthRequest extends Request {
    userId?: string;
}

export const authMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ success: false, message: 'No token provided, authorization denied' });
            return;
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

        // Attach user id to request
        req.userId = decoded.id;

        next();
    } catch (error) {
        logger.warn('Auth middleware: invalid token');
        res.status(401).json({ success: false, message: 'Token is not valid' });
    }
};

export const optionalAuthMiddleware = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            next();
            return;
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        req.userId = decoded.id;
    } catch {
        // Ignore invalid tokens for optional auth routes.
    }
    next();
};
