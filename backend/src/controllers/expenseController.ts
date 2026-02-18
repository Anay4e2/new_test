import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Expense from '../models/Expense';
import SavedTrip from '../models/SavedTrip';

// Add a new expense
export const addExpense = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { tripId, category, amount, description, day, city, paymentMethod, receipt } = req.body;

        if (!tripId || !category || amount === undefined || !day) {
            res.status(400).json({ success: false, message: 'Required: tripId, category, amount, day' });
            return;
        }

        // Verify trip belongs to user
        const trip = await SavedTrip.findOne({ _id: tripId, userId: req.userId });
        if (!trip) {
            res.status(404).json({ success: false, message: 'Trip not found' });
            return;
        }

        const expense = await Expense.create({
            userId: req.userId,
            tripId,
            category,
            amount,
            description: description || '',
            day,
            city,
            paymentMethod: paymentMethod || 'cash',
            receipt,
        });

        res.status(201).json({ success: true, expense });
    } catch (error: any) {
        console.error('Error adding expense:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to add expense' });
    }
};

// Get all expenses for a trip
export const getExpensesByTrip = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { tripId } = req.params;

        const expenses = await Expense.find({ tripId, userId: req.userId }).sort({ day: 1, createdAt: -1 });

        // Compute category totals
        const categoryTotals: Record<string, number> = {};
        expenses.forEach(exp => {
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
        });

        const total = expenses.reduce((sum, e) => sum + e.amount, 0);

        res.json({
            success: true,
            expenses,
            categoryTotals,
            total,
            count: expenses.length,
        });
    } catch (error: any) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch expenses' });
    }
};

// Update an expense
export const updateExpense = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const expense = await Expense.findOneAndUpdate(
            { _id: id, userId: req.userId },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!expense) {
            res.status(404).json({ success: false, message: 'Expense not found' });
            return;
        }

        res.json({ success: true, expense });
    } catch (error: any) {
        console.error('Error updating expense:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to update expense' });
    }
};

// Delete an expense
export const deleteExpense = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const expense = await Expense.findOneAndDelete({ _id: id, userId: req.userId });
        if (!expense) {
            res.status(404).json({ success: false, message: 'Expense not found' });
            return;
        }

        res.json({ success: true, message: 'Expense deleted' });
    } catch (error: any) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to delete expense' });
    }
};

// Get expense summary: estimated vs actual
export const getExpenseSummary = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { tripId } = req.params;

        // Fetch trip for estimated costs
        const trip = await SavedTrip.findOne({ _id: tripId, userId: req.userId });
        if (!trip) {
            res.status(404).json({ success: false, message: 'Trip not found' });
            return;
        }

        const costBreakup = trip.tripResult?.summary?.costBreakup || { stay: 0, transport: 0, activities: 0, food: 0 };
        const totalEstimated = (costBreakup.stay || 0) + (costBreakup.transport || 0) + (costBreakup.activities || 0) + (costBreakup.food || 0);

        // Fetch actual expenses
        const expenses = await Expense.find({ tripId, userId: req.userId });

        const actual: Record<string, number> = {
            stay: 0,
            transport: 0,
            food: 0,
            activities: 0,
            shopping: 0,
            tips: 0,
            other: 0,
        };

        expenses.forEach(exp => {
            actual[exp.category] = (actual[exp.category] || 0) + exp.amount;
        });

        const totalActual = Object.values(actual).reduce((sum, v) => sum + v, 0);

        // Compute differences (negative = under budget)
        const difference: Record<string, number> = {
            stay: actual.stay - (costBreakup.stay || 0),
            transport: actual.transport - (costBreakup.transport || 0),
            food: actual.food - (costBreakup.food || 0),
            activities: actual.activities - (costBreakup.activities || 0),
            shopping: actual.shopping,
            tips: actual.tips,
            other: actual.other,
        };

        const percentUsed = totalEstimated > 0 ? Math.round((totalActual / totalEstimated) * 100) : 0;

        // Per-day breakdown
        const dailySpending: Record<number, number> = {};
        expenses.forEach(exp => {
            dailySpending[exp.day] = (dailySpending[exp.day] || 0) + exp.amount;
        });

        res.json({
            success: true,
            estimated: costBreakup,
            actual,
            difference,
            totalEstimated,
            totalActual,
            percentUsed,
            dailySpending,
            expenseCount: expenses.length,
        });
    } catch (error: any) {
        console.error('Error getting expense summary:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to get summary' });
    }
};
