import logger from '../lib/logger';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { JWT_SECRET, JWT_EXPIRE } from '../config/auth';

const generateToken = (userId: string): string => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

// POST /api/auth/google — authenticate with Google ID token
// Frontend sends the ID token from Google Sign-In; backend verifies and creates/logs-in user
export const googleAuth = async (req: Request, res: Response): Promise<void> => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            res.status(400).json({ success: false, message: 'Google ID token is required' });
            return;
        }

        const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
        if (!GOOGLE_CLIENT_ID) {
            res.status(503).json({ success: false, message: 'Google OAuth is not configured' });
            return;
        }

        // Verify the Google ID token using Google's tokeninfo endpoint
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
        if (!response.ok) {
            res.status(401).json({ success: false, message: 'Invalid Google token' });
            return;
        }

        const payload = await response.json() as { aud: string; email: string; email_verified: string; name: string; sub: string };

        // Verify audience matches our client ID
        if (payload.aud !== GOOGLE_CLIENT_ID) {
            res.status(401).json({ success: false, message: 'Token was not issued for this application' });
            return;
        }

        if (payload.email_verified !== 'true') {
            res.status(401).json({ success: false, message: 'Google email not verified' });
            return;
        }

        // Find or create user
        let user = await User.findOne({ email: payload.email });

        if (user) {
            // Existing user — link Google provider if not already
            if (!user.provider || user.provider === 'local') {
                user.provider = 'google';
                user.providerId = payload.sub;
                await user.save();
            }
        } else {
            // Create new user with Google provider (no password needed)
            user = await User.create({
                name: payload.name || payload.email.split('@')[0],
                email: payload.email,
                provider: 'google',
                providerId: payload.sub,
            });
        }

        const token = generateToken(user._id.toString());

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        logger.error('Google auth error:', error);
        res.status(500).json({ success: false, message: 'Server error during Google authentication' });
    }
};
