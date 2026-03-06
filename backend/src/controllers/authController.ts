import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User, { UserDocument } from '../models/User';
import { JWT_SECRET, JWT_EXPIRE } from '../config/auth';
import { sendResetPasswordEmail } from '../services/emailService';
import { isDbConnected } from '../lib/dbStatus';
import logger from '../lib/logger';

const DEMO_USER_ID = '000000000000000000000001';
const DEMO_USER = {
    id: DEMO_USER_ID,
    name: 'Demo User',
    email: 'demo@tripplanner.com',
    role: 'user' as const,
    createdAt: new Date().toISOString(),
};

// Generate JWT token
const generateToken = (userId: string): string => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password } = req.body;

        // When MongoDB is down, allow demo-mode registration
        if (!isDbConnected()) {
            logger.info('MongoDB not connected – issuing demo token for register');
            const token = generateToken(DEMO_USER_ID);
            res.status(201).json({ success: true, token, user: { ...DEMO_USER, name: name || DEMO_USER.name, email: email || DEMO_USER.email } });
            return;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ success: false, message: 'User already exists with this email' });
            return;
        }

        // Create user
        const user = await User.create({ name, email, password });

        // Generate token
        const token = generateToken(user._id.toString());

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            }
        });
    } catch (error: any) {
        logger.error('Register error:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err: any) => err.message);
            res.status(400).json({ success: false, message: messages.join(', ') });
            return;
        }

        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Please provide email and password' });
            return;
        }

        // When MongoDB is down, allow demo-mode login
        if (!isDbConnected()) {
            logger.info('MongoDB not connected – issuing demo token');
            const token = generateToken(DEMO_USER_ID);
            res.status(200).json({ success: true, token, user: DEMO_USER });
            return;
        }

        // Find user and include password field
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
            return;
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
            return;
        }

        // Generate token
        const token = generateToken(user._id.toString());

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: Request, res: Response): Promise<void> => {
    try {
        // User is attached to request by auth middleware
        const userId = (req as any).userId;

        if (!isDbConnected()) {
            res.status(200).json({ success: true, user: { ...DEMO_USER, id: userId } });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        logger.error('GetMe error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Admin login - only allows users with admin role
// @route   POST /api/auth/admin-login
// @access  Public
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Please provide email and password' });
            return;
        }

        // Find user and include password field
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
            return;
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
            return;
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
            return;
        }

        // Generate token
        const token = generateToken(user._id.toString());

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        logger.error('Admin login error:', error);
        res.status(500).json({ success: false, message: 'Server error during admin login' });
    }
};

// @desc    Forgot password — send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ success: false, message: 'Please provide an email address' });
            return;
        }

        const user = await User.findOne({ email }).select('+resetPasswordToken +resetPasswordExpire');
        if (!user) {
            // Return success even if user doesn't exist to prevent email enumeration
            res.status(200).json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
            return;
        }

        // Generate reset token
        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });

        // Send email
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

        try {
            await sendResetPasswordEmail(user.email, user.name, resetUrl);
        } catch (emailError) {
            // Clear token if email fails
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            logger.error('Reset email send error:', emailError);
            res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again later.' });
            return;
        }

        res.status(200).json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
    } catch (error) {
        logger.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { password } = req.body;
        if (!password) {
            res.status(400).json({ success: false, message: 'Please provide a new password' });
            return;
        }

        // Hash the URL token and find matching user
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: new Date() }
        }).select('+resetPasswordToken +resetPasswordExpire');

        if (!user) {
            res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
            return;
        }

        // Set new password and clear reset fields
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        // Auto-login after reset
        const token = generateToken(user._id.toString());

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            },
            message: 'Password reset successful'
        });
    } catch (error: any) {
        logger.error('Reset password error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err: any) => err.message);
            res.status(400).json({ success: false, message: messages.join(', ') });
            return;
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update profile (name, email)
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).userId;
        const { name, email } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        if (name !== undefined) user.name = name.trim();
        if (email !== undefined) {
            const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
            if (existing) {
                res.status(400).json({ success: false, message: 'Email is already in use' });
                return;
            }
            user.email = email;
        }

        await user.save();

        res.json({
            success: true,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
        });
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err: any) => err.message);
            res.status(400).json({ success: false, message: messages.join(', ') });
            return;
        }
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
export const changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).userId;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            res.status(400).json({ success: false, message: 'Current and new passwords are required' });
            return;
        }

        const user = await User.findById(userId).select('+password');
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            res.status(401).json({ success: false, message: 'Current password is incorrect' });
            return;
        }

        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err: any) => err.message);
            res.status(400).json({ success: false, message: messages.join(', ') });
            return;
        }
        res.status(500).json({ success: false, message: 'Failed to change password' });
    }
};
