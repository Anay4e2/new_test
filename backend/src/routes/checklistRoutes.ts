import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  getChecklists,
  createChecklist,
  updateChecklist,
  addItem,
  deleteChecklist,
} from '../controllers/checklistController';

const router = Router();

router.get('/', authMiddleware, getChecklists);
router.post('/', authMiddleware, createChecklist);
router.put('/:id', authMiddleware, updateChecklist);
router.post('/:id/items', authMiddleware, addItem);
router.delete('/:id', authMiddleware, deleteChecklist);

export default router;
