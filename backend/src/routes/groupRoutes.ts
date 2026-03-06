import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
    createGroup,
    inviteMembers,
    respondToInvite,
    getMyGroups,
    getGroup,
    addChatMessage,
    getChatHistory,
    createPoll,
    votePoll,
    removeMember,
    closePoll,
} from '../controllers/groupController';
import { validate, validateParams } from '../middleware/validate';
import { createGroupSchema, inviteMembersSchema, respondInviteSchema, createPollSchema, votePollSchema, objectIdParam } from '../lib/validationSchemas';

const router = Router();

// All routes require auth
router.use(authMiddleware);

// Group CRUD
router.post('/', validate(createGroupSchema), createGroup);
router.get('/', getMyGroups);
router.get('/:id', validateParams(objectIdParam), getGroup);

// Members
router.post('/:id/invite', validateParams(objectIdParam), validate(inviteMembersSchema), inviteMembers);
router.post('/:id/respond', validateParams(objectIdParam), validate(respondInviteSchema), respondToInvite);
router.delete('/:id/members/:memberId', removeMember);

// Chat
router.post('/:id/chat', addChatMessage);
router.get('/:id/chat', getChatHistory);

// Polls
router.post('/:id/polls', validate(createPollSchema), createPoll);
router.post('/:id/polls/:pollId/vote', validate(votePollSchema), votePoll);
router.post('/:id/polls/:pollId/close', closePoll);

export default router;
