import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
    addExpense,
    getExpensesByTrip,
    updateExpense,
    deleteExpense,
    getExpenseSummary,
    exportExpensesPdf,
} from '../controllers/expenseController';
import { validate, validateParams } from '../middleware/validate';
import { addExpenseSchema, updateExpenseSchema, objectIdParam } from '../lib/validationSchemas';

const router = Router();

// All routes require auth
router.use(authMiddleware);

// POST /api/expenses — add expense
router.post('/', validate(addExpenseSchema), addExpense);

// GET /api/expenses/trip/:tripId — list expenses for a trip
router.get('/trip/:tripId', getExpensesByTrip);

// GET /api/expenses/trip/:tripId/summary — expense summary (estimated vs actual)
router.get('/trip/:tripId/summary', getExpenseSummary);

// GET /api/expenses/trip/:tripId/export-pdf — download expense report as PDF
router.get('/trip/:tripId/export-pdf', exportExpensesPdf);

// PUT /api/expenses/:id — update
router.put('/:id', validateParams(objectIdParam), validate(updateExpenseSchema), updateExpense);

// DELETE /api/expenses/:id — delete
router.delete('/:id', validateParams(objectIdParam), deleteExpense);

export default router;
