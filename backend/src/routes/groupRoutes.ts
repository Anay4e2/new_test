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

const router = Router();

// All routes require auth
router.use(authMiddleware);

// Group CRUD
router.post('/', createGroup);
router.get('/', getMyGroups);
router.get('/:id', getGroup);

// Members
router.post('/:id/invite', inviteMembers);
router.post('/:id/respond', respondToInvite);
router.delete('/:id/members/:memberId', removeMember);

// Chat
router.post('/:id/chat', addChatMessage);
router.get('/:id/chat', getChatHistory);

// Polls
router.post('/:id/polls', createPoll);
router.post('/:id/polls/:pollId/vote', votePoll);
router.post('/:id/polls/:pollId/close', closePoll);

export default router;
