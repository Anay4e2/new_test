import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import GroupItineraryRequest from '../models/GroupItineraryRequest';
import TripGroup from '../models/TripGroup';
import User from '../models/User';
import { createNotification } from '../services/notificationService';
import logger from '../lib/logger';

// POST /api/groups/:id/requests — create an itinerary change request
export const createItineraryRequest = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id: groupId } = req.params;
        const { type, title, description, dayNumber, proposedChanges } = req.body;

        // Verify user is a member of this group
        const group = await TripGroup.findById(groupId);
        if (!group) {
            res.status(404).json({ success: false, message: 'Group not found' });
            return;
        }

        const member = group.members.find(
            m => m.userId?.toString() === req.userId && m.status === 'accepted'
        );
        if (!member) {
            res.status(403).json({ success: false, message: 'You are not an accepted member of this group' });
            return;
        }

        const user = await User.findById(req.userId);

        const request = await GroupItineraryRequest.create({
            groupId,
            requesterId: req.userId,
            requesterName: user?.name || 'Unknown',
            type,
            title,
            description,
            dayNumber,
            proposedChanges,
        });

        // Notify the group owner about the new request
        if (group.ownerId.toString() !== req.userId) {
            await createNotification(group.ownerId.toString(), {
                type: 'group_request',
                title: 'New Itinerary Request',
                message: `${user?.name || 'A member'} requested: "${title}" in ${group.name}`,
                actionUrl: `/group/${groupId}`,
                priority: 'medium',
                metadata: { groupId, requestId: request._id },
            });
        }

        res.status(201).json({ success: true, request });
    } catch (error: any) {
        logger.error('Error creating itinerary request:', error);
        res.status(500).json({ success: false, message: 'Failed to create request' });
    }
};

// GET /api/groups/:id/requests — get all requests for a group
export const getGroupRequests = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id: groupId } = req.params;
        const status = req.query.status as string | undefined;

        // Verify user is a member
        const group = await TripGroup.findById(groupId);
        if (!group) {
            res.status(404).json({ success: false, message: 'Group not found' });
            return;
        }

        const isMember = group.members.some(
            m => m.userId?.toString() === req.userId && m.status === 'accepted'
        );
        if (!isMember) {
            res.status(403).json({ success: false, message: 'You are not an accepted member of this group' });
            return;
        }

        const filter: Record<string, any> = { groupId };
        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            filter.status = status;
        }

        const requests = await GroupItineraryRequest.find(filter)
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        res.json({ success: true, requests });
    } catch (error: any) {
        logger.error('Error fetching itinerary requests:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch requests' });
    }
};

// POST /api/groups/:id/requests/:requestId/vote — vote on a request
export const voteOnRequest = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id: groupId, requestId } = req.params;
        const { vote } = req.body;

        if (!['approve', 'reject'].includes(vote)) {
            res.status(400).json({ success: false, message: 'Vote must be "approve" or "reject"' });
            return;
        }

        // Verify membership
        const group = await TripGroup.findById(groupId);
        if (!group) {
            res.status(404).json({ success: false, message: 'Group not found' });
            return;
        }

        const member = group.members.find(
            m => m.userId?.toString() === req.userId && m.status === 'accepted'
        );
        if (!member) {
            res.status(403).json({ success: false, message: 'Not an accepted member' });
            return;
        }

        const request = await GroupItineraryRequest.findOne({ _id: requestId, groupId });
        if (!request) {
            res.status(404).json({ success: false, message: 'Request not found' });
            return;
        }

        if (request.status !== 'pending') {
            res.status(400).json({ success: false, message: 'Request is already resolved' });
            return;
        }

        // Check if user already voted
        const existingVoteIdx = request.votes.findIndex(v => v.userId.toString() === req.userId);
        if (existingVoteIdx !== -1) {
            // Update existing vote
            request.votes[existingVoteIdx].vote = vote;
            request.votes[existingVoteIdx].votedAt = new Date();
        } else {
            request.votes.push({
                userId: req.userId as any,
                vote,
                votedAt: new Date(),
            });
        }

        await request.save();

        res.json({ success: true, request });
    } catch (error: any) {
        logger.error('Error voting on request:', error);
        res.status(500).json({ success: false, message: 'Failed to vote' });
    }
};

// POST /api/groups/:id/requests/:requestId/resolve — owner approves/rejects
export const resolveRequest = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id: groupId, requestId } = req.params;
        const { status, rejectionReason } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            res.status(400).json({ success: false, message: 'Status must be "approved" or "rejected"' });
            return;
        }

        // Verify ownership
        const group = await TripGroup.findOne({ _id: groupId, ownerId: req.userId });
        if (!group) {
            res.status(404).json({ success: false, message: 'Group not found or not authorized' });
            return;
        }

        const request = await GroupItineraryRequest.findOne({ _id: requestId, groupId });
        if (!request) {
            res.status(404).json({ success: false, message: 'Request not found' });
            return;
        }

        if (request.status !== 'pending') {
            res.status(400).json({ success: false, message: 'Request is already resolved' });
            return;
        }

        request.status = status;
        request.resolvedBy = req.userId as any;
        request.resolvedAt = new Date();
        if (status === 'rejected' && rejectionReason) {
            request.rejectionReason = rejectionReason;
        }
        await request.save();

        // Notify the requester
        if (request.requesterId.toString() !== req.userId) {
            const user = await User.findById(req.userId);
            await createNotification(request.requesterId.toString(), {
                type: 'group_request',
                title: `Request ${status === 'approved' ? 'Approved ✓' : 'Rejected ✗'}`,
                message: `Your request "${request.title}" in ${group.name} was ${status}${rejectionReason ? `: ${rejectionReason}` : ''}`,
                actionUrl: `/group/${groupId}`,
                priority: status === 'approved' ? 'medium' : 'low',
                metadata: { groupId, requestId },
            });
        }

        res.json({ success: true, request });
    } catch (error: any) {
        logger.error('Error resolving request:', error);
        res.status(500).json({ success: false, message: 'Failed to resolve request' });
    }
};
