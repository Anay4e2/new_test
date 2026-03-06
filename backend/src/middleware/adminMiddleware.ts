import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { JWT_SECRET } from '../config/auth';
import logger from '../lib/logger';

export interface AdminRequest extends Request {
    userId?: string;
    userRole?: string;
}

export const adminMiddleware = async (
    req: AdminRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ success: false, message: 'No token provided' });
            return;
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

        // Get user and check role
        const user = await User.findById(decoded.id);

        if (!user) {
            res.status(401).json({ success: false, message: 'User not found' });
            return;
        }

        if (user.role !== 'admin') {
            res.status(403).json({ success: false, message: 'Admin access required' });
            return;
        }

        req.userId = decoded.id;
        req.userRole = user.role;

        next();
    } catch (error) {
        logger.warn('Admin middleware: invalid token');
        res.status(401).json({ success: false, message: 'Token is not valid' });
    }
};
