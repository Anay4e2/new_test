import { Request, Response } from 'express';
import ContactQuery from '../models/ContactQuery';

// POST /api/contact — submit a contact query (public)
export const submitContactQuery = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            res.status(400).json({ success: false, message: 'All fields are required' });
            return;
        }

        const query = await ContactQuery.create({ name, email, subject, message });

        res.status(201).json({
            success: true,
            message: 'Your message has been submitted. We will get back to you soon!',
            queryId: query._id,
        });
    } catch (error) {
        console.error('Contact submit error:', error);
        res.status(500).json({ success: false, message: 'Failed to submit your message' });
    }
};

// GET /api/admin/contact-queries — list all queries (admin)
export const getContactQueries = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, page = '1', limit = '20' } = req.query;

        const filter: Record<string, any> = {};
        if (status && status !== 'all') filter.status = status;

        const pageNum = Math.max(1, parseInt(page as string));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
        const skip = (pageNum - 1) * limitNum;

        const [queries, total] = await Promise.all([
            ContactQuery.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
            ContactQuery.countDocuments(filter),
        ]);

        res.json({
            success: true,
            queries,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Get contact queries error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch queries' });
    }
};

// PUT /api/admin/contact-queries/:id — update status/note (admin)
export const updateContactQuery = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status, adminNote } = req.body;

        const query = await ContactQuery.findByIdAndUpdate(
            id,
            { ...(status && { status }), ...(adminNote !== undefined && { adminNote }) },
            { new: true }
        );

        if (!query) {
            res.status(404).json({ success: false, message: 'Query not found' });
            return;
        }

        res.json({ success: true, query });
    } catch (error) {
        console.error('Update contact query error:', error);
        res.status(500).json({ success: false, message: 'Failed to update query' });
    }
};

// DELETE /api/admin/contact-queries/:id (admin)
export const deleteContactQuery = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const query = await ContactQuery.findByIdAndDelete(id);

        if (!query) {
            res.status(404).json({ success: false, message: 'Query not found' });
            return;
        }

        res.json({ success: true, message: 'Query deleted' });
    } catch (error) {
        console.error('Delete contact query error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete query' });
    }
};
