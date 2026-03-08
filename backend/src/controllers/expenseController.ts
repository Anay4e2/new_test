import logger from '../lib/logger';
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Expense from '../models/Expense';
import SavedTrip from '../models/SavedTrip';
import { isDbConnected } from '../lib/dbStatus';
import PDFDocument from 'pdfkit';

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
        logger.error('Error adding expense:', error);
        res.status(500).json({ success: false, message: 'Failed to add expense' });
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
        logger.error('Error fetching expenses:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
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
        logger.error('Error updating expense:', error);
        res.status(500).json({ success: false, message: 'Failed to update expense' });
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
        logger.error('Error deleting expense:', error);
        res.status(500).json({ success: false, message: 'Failed to delete expense' });
    }
};

// Get expense summary: estimated vs actual
export const getExpenseSummary = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!isDbConnected()) {
            res.json({ success: true, estimated: {}, actual: {}, totalEstimated: 0, totalActual: 0, difference: {}, currency: 'INR' });
            return;
        }

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
        logger.error('Error getting expense summary:', error);
        res.status(500).json({ success: false, message: 'Failed to get summary' });
    }
};

// GET /api/expenses/trip/:tripId/export-pdf — download expense report as PDF
export const exportExpensesPdf = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { tripId } = req.params;

        const trip = await SavedTrip.findOne({ _id: tripId, userId: req.userId });
        if (!trip) {
            res.status(404).json({ success: false, message: 'Trip not found' });
            return;
        }

        const expenses = await Expense.find({ tripId, userId: req.userId }).sort({ day: 1, createdAt: -1 });

        const categoryTotals: Record<string, number> = {};
        expenses.forEach(exp => {
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
        });
        const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

        const costBreakup = trip.tripResult?.summary?.costBreakup || { stay: 0, transport: 0, activities: 0, food: 0 };
        const totalEstimated = (costBreakup.stay || 0) + (costBreakup.transport || 0) + (costBreakup.activities || 0) + (costBreakup.food || 0);

        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=expense-report-${tripId}.pdf`);
        doc.pipe(res);

        // Header
        doc.rect(0, 0, doc.page.width, 70).fill('#2c3e50');
        doc.fontSize(24).fillColor('#ffffff').text('Expense Report', 50, 20, { align: 'center' });
        doc.fontSize(11).fillColor('#ecf0f1').text(trip.title || 'My Trip', 50, 48, { align: 'center' });
        doc.moveDown(3);
        doc.fillColor('#000000');

        // Summary
        doc.fontSize(14).fillColor('#2980b9').text('SUMMARY', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#333333');
        doc.text(`Total Estimated Budget: Rs.${totalEstimated.toLocaleString()}`);
        doc.text(`Total Spent: Rs.${totalSpent.toLocaleString()}`);
        const diff = totalSpent - totalEstimated;
        doc.text(`Difference: Rs.${Math.abs(diff).toLocaleString()} ${diff > 0 ? 'over budget' : diff < 0 ? 'under budget' : 'on budget'}`);
        doc.text(`Total Expenses: ${expenses.length}`);
        doc.moveDown(1);

        // Category breakdown
        doc.fontSize(14).fillColor('#2980b9').text('BY CATEGORY', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#333333');
        for (const [cat, amount] of Object.entries(categoryTotals)) {
            doc.text(`  ${cat.charAt(0).toUpperCase() + cat.slice(1)}: Rs.${amount.toLocaleString()}`);
        }
        doc.moveDown(1);

        // Expense list
        if (expenses.length > 0) {
            doc.fontSize(14).fillColor('#2980b9').text('ALL EXPENSES', { underline: true });
            doc.moveDown(0.5);
            for (const exp of expenses) {
                if (doc.y > doc.page.height - 80) doc.addPage();
                doc.fontSize(10).fillColor('#333333');
                doc.text(`Day ${exp.day}${exp.city ? ` - ${exp.city}` : ''}: ${exp.category} — Rs.${exp.amount.toLocaleString()}${exp.description ? ` (${exp.description})` : ''} [${exp.paymentMethod}]`);
            }
        }

        // Footer
        doc.moveDown(2);
        doc.fontSize(9).fillColor('#95a5a6').text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });

        doc.end();
    } catch (error: any) {
        logger.error('Error exporting expenses PDF:', error);
        res.status(500).json({ success: false, message: 'Failed to export expenses' });
    }
};
