import logger from '../lib/logger';
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import TripGroup from '../models/TripGroup';
import SavedTrip from '../models/SavedTrip';
import User from '../models/User';
import nodemailer from 'nodemailer';
import { isDbConnected } from '../lib/dbStatus';

// Reuse email config from emailService pattern
function isSmtpConfigured(): boolean {
    return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_PORT === '465',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
}

// POST /api/groups â€” create group from a saved trip
export const createGroup = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { tripId, name } = req.body;

        if (!tripId || !name) {
            res.status(400).json({ success: false, message: 'tripId and name are required' });
            return;
        }

        // Verify trip ownership
        const trip = await SavedTrip.findOne({ _id: tripId, userId: req.userId });
        if (!trip) {
            res.status(404).json({ success: false, message: 'Trip not found' });
            return;
        }

        // Check if group already exists for this trip
        const existing = await TripGroup.findOne({ tripId, ownerId: req.userId });
        if (existing) {
            res.status(400).json({ success: false, message: 'A group already exists for this trip' });
            return;
        }

        const user = await User.findById(req.userId);

        const group = await TripGroup.create({
            tripId,
            ownerId: req.userId,
            name,
            members: [{
                userId: user?._id as any,
                email: user?.email || '',
                name: user?.name || 'Owner',
                role: 'owner',
                status: 'accepted',
                invitedAt: new Date(),
                respondedAt: new Date(),
            }],
            chat: [],
            polls: [],
        });

        res.status(201).json({ success: true, group });
    } catch (error: any) {
        logger.error('Error creating group:', error);
        res.status(500).json({ success: false, message: 'Failed to create group' });
    }
};

// POST /api/groups/:id/invite â€” invite members by email
export const inviteMembers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { emails, role, message: personalMessage } = req.body;

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            res.status(400).json({ success: false, message: 'emails array is required' });
            return;
        }

        const group = await TripGroup.findOne({ _id: id, ownerId: req.userId });
        if (!group) {
            res.status(404).json({ success: false, message: 'Group not found or not authorized' });
            return;
        }

        if (group.members.length + emails.length > group.maxMembers) {
            res.status(400).json({ success: false, message: `Cannot exceed ${group.maxMembers} members` });
            return;
        }

        const inviteRole = role === 'editor' ? 'editor' : 'viewer';
        const added: string[] = [];

        for (const email of emails) {
            const trimmed = email.trim().toLowerCase();
            if (!trimmed) continue;

            // Skip if already a member
            if (group.members.some(m => m.email === trimmed)) continue;

            // Look up user by email
            const existingUser = await User.findOne({ email: trimmed });

            group.members.push({
                userId: existingUser?._id,
                email: trimmed,
                name: existingUser?.name || trimmed.split('@')[0],
                role: inviteRole,
                status: 'invited',
                invitedAt: new Date(),
            } as any);

            added.push(trimmed);
        }

        await group.save();

        // Send email invitations
        if (isSmtpConfigured() && added.length > 0) {
            const user = await User.findById(req.userId);
            const transporter = createTransporter();
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

            for (const email of added) {
                try {
                    await transporter.sendMail({
                        from: process.env.SMTP_FROM || process.env.SMTP_USER,
                        to: email,
                        subject: `ðŸ–ï¸ You're invited to join "${group.name}" trip!`,
                        html: `
                            <div style="font-family:'Segoe UI',sans-serif;max-width:500px;margin:0 auto;padding:20px;">
                                <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);border-radius:16px;padding:32px 24px;text-align:center;color:#fff;">
                                    <h1 style="margin:0;font-size:22px;">ðŸ—ºï¸ Trip Invitation</h1>
                                    <p style="margin:8px 0 0;opacity:0.85;">${user?.name || 'A friend'} invited you to join</p>
                                    <h2 style="margin:12px 0 0;font-size:18px;">"${group.name}"</h2>
                                </div>
                                ${personalMessage ? `<div style="margin-top:16px;padding:12px 16px;background:#f0f9ff;border-radius:8px;font-style:italic;color:#374151;">"${personalMessage}"</div>` : ''}
                                <div style="text-align:center;margin-top:20px;">
                                    <a href="${frontendUrl}/group/${group._id}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">View Trip & Respond</a>
                                </div>
                                <p style="margin-top:16px;font-size:12px;color:#9ca3af;text-align:center;">You've been invited as a ${inviteRole}</p>
                            </div>
                        `,
                    });
                } catch {
                    // Email send failure is non-blocking
                }
            }
        }

        res.json({ success: true, added, group });
    } catch (error: any) {
        logger.error('Error inviting members:', error);
        res.status(500).json({ success: false, message: 'Failed to invite' });
    }
};

// POST /api/groups/:id/respond â€” accept or decline invite
export const respondToInvite = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { response: inviteResponse } = req.body; // 'accepted' | 'declined'

        if (!inviteResponse || !['accepted', 'declined'].includes(inviteResponse)) {
            res.status(400).json({ success: false, message: 'response must be accepted or declined' });
            return;
        }

        const user = await User.findById(req.userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const group = await TripGroup.findById(id);
        if (!group) {
            res.status(404).json({ success: false, message: 'Group not found' });
            return;
        }

        // Find member by userId or email
        const member = group.members.find(
            m => (m.userId && m.userId.toString() === req.userId) || m.email === user.email
        );

        if (!member) {
            res.status(404).json({ success: false, message: 'You are not invited to this group' });
            return;
        }

        member.status = inviteResponse;
        member.respondedAt = new Date();
        if (!member.userId) {
            member.userId = user._id as any;
            member.name = user.name;
        }

        await group.save();
        res.json({ success: true, group });
    } catch (error: any) {
        logger.error('Error responding to invite:', error);
        res.status(500).json({ success: false, message: 'Failed to respond' });
    }
};

// GET /api/groups â€” groups the user belongs to
export const getMyGroups = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!isDbConnected()) {
            res.json({ success: true, groups: [] });
            return;
        }

        const user = await User.findById(req.userId);
        const groups = await TripGroup.find({
            $or: [
                { ownerId: req.userId },
                { 'members.userId': req.userId },
                ...(user?.email ? [{ 'members.email': user.email }] : []),
            ],
        })
            .populate('tripId', 'title tripResult.itinerary tripResult.summary')
            .sort({ createdAt: -1 });

        res.json({ success: true, groups });
    } catch (error: any) {
        logger.error('Error getting groups:', error);
        res.status(500).json({ success: false, message: 'Failed to get groups' });
    }
};

// GET /api/groups/:id â€” group details
export const getGroup = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const user = await User.findById(req.userId);

        const group = await TripGroup.findById(id)
            .populate('tripId');

        if (!group) {
            res.status(404).json({ success: false, message: 'Group not found' });
            return;
        }

        // Check access: owner, member by userId, or member by email
        const isMember = group.ownerId.toString() === req.userId ||
            group.members.some(m =>
                (m.userId && m.userId.toString() === req.userId) ||
                (user?.email && m.email === user.email)
            );

        // Strip inviteCode for non-members
        const groupObj = group.toObject();
        if (!isMember) {
            delete (groupObj as any).inviteCode;
            // Strip chat/polls for non-members
            groupObj.chat = [];
            groupObj.polls = [];
        }

        res.json({ success: true, group: groupObj, isMember });
    } catch (error: any) {
        logger.error('Error getting group:', error);
        res.status(500).json({ success: false, message: 'Failed to get group' });
    }
};

// POST /api/groups/:id/join — join group via invite link
export const joinGroup = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { inviteCode } = req.body;

        const user = await User.findById(req.userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const group = await TripGroup.findById(id);
        if (!group) {
            res.status(404).json({ success: false, message: 'Group not found' });
            return;
        }

        if (group.inviteCode !== inviteCode) {
            res.status(403).json({ success: false, message: 'Invalid invite code' });
            return;
        }

        // Check if already a member
        const existing = group.members.find(
            m => (m.userId && m.userId.toString() === req.userId) || m.email === user.email
        );
        if (existing) {
            if (existing.status === 'declined') {
                existing.status = 'accepted';
                existing.respondedAt = new Date();
                if (!existing.userId) {
                    existing.userId = user._id as any;
                    existing.name = user.name;
                }
                await group.save();
                res.json({ success: true, group });
                return;
            }
            res.json({ success: true, group, message: 'Already a member' });
            return;
        }

        if (group.members.length >= group.maxMembers) {
            res.status(400).json({ success: false, message: `Group is full (max ${group.maxMembers} members)` });
            return;
        }

        group.members.push({
            userId: user._id as any,
            email: user.email,
            name: user.name,
            role: 'viewer',
            status: 'accepted',
            invitedAt: new Date(),
            respondedAt: new Date(),
        } as any);

        await group.save();
        res.json({ success: true, group });
    } catch (error: any) {
        logger.error('Error joining group:', error);
        res.status(500).json({ success: false, message: 'Failed to join group' });
    }
};

// POST /api/groups/:id/chat â€” add chat message
export const addChatMessage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        if (!message || !message.trim()) {
            res.status(400).json({ success: false, message: 'Message is required' });
            return;
        }

        const user = await User.findById(req.userId);
        const group = await TripGroup.findById(id);
        if (!group) {
            res.status(404).json({ success: false, message: 'Group not found' });
            return;
        }

        // Must be accepted member
        const member = group.members.find(
            m => (m.userId && m.userId.toString() === req.userId) && m.status === 'accepted'
        );
        if (!member) {
            res.status(403).json({ success: false, message: 'Must be an accepted member to chat' });
            return;
        }

        group.chat.push({
            userId: req.userId as any,
            userName: user?.name || 'Unknown',
            message: message.trim(),
            timestamp: new Date(),
        } as any);

        // Keep last 500 messages
        if (group.chat.length > 500) {
            group.chat = group.chat.slice(-500) as any;
        }

        await group.save();
        res.json({ success: true, message: group.chat[group.chat.length - 1] });
    } catch (error: any) {
        logger.error('Error adding chat message:', error);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
};

// GET /api/groups/:id/chat â€” get chat history
export const getChatHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const group = await TripGroup.findById(id).select('chat');

        if (!group) {
            res.status(404).json({ success: false, message: 'Group not found' });
            return;
        }

        // Return last 100 messages
        const messages = group.chat.slice(-100);
        res.json({ success: true, messages });
    } catch (error: any) {
        logger.error('Error getting chat:', error);
        res.status(500).json({ success: false, message: 'Failed to get chat' });
    }
};

// POST /api/groups/:id/polls â€” create poll
export const createPoll = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { question, options } = req.body;

        if (!question || !options || !Array.isArray(options) || options.length < 2) {
            res.status(400).json({ success: false, message: 'question and at least 2 options required' });
            return;
        }

        const group = await TripGroup.findById(id);
        if (!group) {
            res.status(404).json({ success: false, message: 'Group not found' });
            return;
        }

        group.polls.push({
            question,
            options: options.map((text: string) => ({ text, votes: [] })),
            createdBy: req.userId as any,
            isActive: true,
            createdAt: new Date(),
        } as any);

        await group.save();
        res.status(201).json({ success: true, poll: group.polls[group.polls.length - 1] });
    } catch (error: any) {
        logger.error('Error creating poll:', error);
        res.status(500).json({ success: false, message: 'Failed to create poll' });
    }
};

// POST /api/groups/:id/polls/:pollId/vote â€” vote on a poll
export const votePoll = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id, pollId } = req.params;
        const { optionIndex } = req.body;

        if (optionIndex === undefined || typeof optionIndex !== 'number') {
            res.status(400).json({ success: false, message: 'optionIndex is required' });
            return;
        }

        const group = await TripGroup.findById(id);
        if (!group) {
            res.status(404).json({ success: false, message: 'Group not found' });
            return;
        }

        const poll = group.polls.find((p: any) => p._id.toString() === pollId);
        if (!poll) {
            res.status(404).json({ success: false, message: 'Poll not found' });
            return;
        }

        if (!poll.isActive) {
            res.status(400).json({ success: false, message: 'Poll is closed' });
            return;
        }

        if (optionIndex < 0 || optionIndex >= poll.options.length) {
            res.status(400).json({ success: false, message: 'Invalid option index' });
            return;
        }

        // Remove previous vote from all options
        const userObjId = req.userId!;
        poll.options.forEach(opt => {
            opt.votes = opt.votes.filter(v => v.toString() !== userObjId) as any;
        });

        // Add vote to selected option
        poll.options[optionIndex].votes.push(userObjId as any);

        await group.save();
        res.json({ success: true, poll });
    } catch (error: any) {
        logger.error('Error voting on poll:', error);
        res.status(500).json({ success: false, message: 'Failed to vote' });
    }
};

// DELETE /api/groups/:id/members/:memberId â€” remove member (owner only)
export const removeMember = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id, memberId } = req.params;

        const group = await TripGroup.findOne({ _id: id, ownerId: req.userId });
        if (!group) {
            res.status(404).json({ success: false, message: 'Group not found or not authorized' });
            return;
        }

        const memberIndex = group.members.findIndex((m: any) => m._id.toString() === memberId);
        if (memberIndex === -1) {
            res.status(404).json({ success: false, message: 'Member not found' });
            return;
        }

        // Can't remove owner
        if (group.members[memberIndex].role === 'owner') {
            res.status(400).json({ success: false, message: 'Cannot remove the owner' });
            return;
        }

        group.members.splice(memberIndex, 1);
        await group.save();
        res.json({ success: true, group });
    } catch (error: any) {
        logger.error('Error removing member:', error);
        res.status(500).json({ success: false, message: 'Failed to remove member' });
    }
};

// POST /api/groups/:id/polls/:pollId/close â€” close poll (creator or owner)
export const closePoll = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id, pollId } = req.params;

        const group = await TripGroup.findById(id);
        if (!group) {
            res.status(404).json({ success: false, message: 'Group not found' });
            return;
        }

        const poll = group.polls.find((p: any) => p._id.toString() === pollId);
        if (!poll) {
            res.status(404).json({ success: false, message: 'Poll not found' });
            return;
        }

        // Only creator or owner can close
        const isOwner = group.ownerId.toString() === req.userId;
        const isCreator = poll.createdBy.toString() === req.userId;
        if (!isOwner && !isCreator) {
            res.status(403).json({ success: false, message: 'Only poll creator or group owner can close' });
            return;
        }

        poll.isActive = false;
        await group.save();
        res.json({ success: true, poll });
    } catch (error: any) {
        logger.error('Error closing poll:', error);
        res.status(500).json({ success: false, message: 'Failed to close poll' });
    }
};
