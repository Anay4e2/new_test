import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
    addExpense,
    getExpensesByTrip,
    updateExpense,
    deleteExpense,
    getExpenseSummary,
} from '../controllers/expenseController';

const router = Router();

// All routes require auth
router.use(authMiddleware);

// POST /api/expenses — add expense
router.post('/', addExpense);

// GET /api/expenses/trip/:tripId — list expenses for a trip
router.get('/trip/:tripId', getExpensesByTrip);

// GET /api/expenses/trip/:tripId/summary — expense summary (estimated vs actual)
router.get('/trip/:tripId/summary', getExpenseSummary);

// PUT /api/expenses/:id — update
router.put('/:id', updateExpense);

// DELETE /api/expenses/:id — delete
router.delete('/:id', deleteExpense);

export default router;
