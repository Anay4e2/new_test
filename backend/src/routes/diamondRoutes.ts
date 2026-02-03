import express from 'express';
import {
  getDiamonds,
  getDiamondById,
  createDiamond,
  updateDiamond,
  deleteDiamond,
} from '../controllers/DiamondController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
  .get(getDiamonds)
  .post(protect, adminOnly, createDiamond);

router.route('/:id')
  .get(getDiamondById)
  .put(protect, adminOnly, updateDiamond)
  .delete(protect, adminOnly, deleteDiamond);

export default router;
