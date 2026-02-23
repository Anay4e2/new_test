import { Request, Response } from 'express';
import TravelChecklist from '../models/TravelChecklist';

const DEFAULT_ITEMS = [
  { label: 'Passport', checked: false, category: 'documents' as const },
  { label: 'ID Proof (Aadhaar/PAN)', checked: false, category: 'documents' as const },
  { label: 'Travel Tickets', checked: false, category: 'documents' as const },
  { label: 'Hotel Booking Confirmation', checked: false, category: 'documents' as const },
  { label: 'Travel Insurance', checked: false, category: 'documents' as const },
  { label: 'Vaccination Certificate', checked: false, category: 'documents' as const },
  { label: 'Printed Itinerary', checked: false, category: 'documents' as const },
  { label: 'Cash & Cards', checked: false, category: 'essentials' as const },
  { label: 'Phone Charger', checked: false, category: 'electronics' as const },
  { label: 'Power Bank', checked: false, category: 'electronics' as const },
  { label: 'Medications', checked: false, category: 'essentials' as const },
  { label: 'Sunscreen', checked: false, category: 'toiletries' as const },
];

// Get all checklists for current user
export const getChecklists = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { tripId } = req.query;

    const filter: any = { userId };
    if (tripId) filter.tripId = tripId;

    const checklists = await TravelChecklist.find(filter).sort({ updatedAt: -1 }).lean();
    res.json({ success: true, checklists });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch checklists' });
  }
};

// Create a new checklist (with default items)
export const createChecklist = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { title, tripId } = req.body;

    const checklist = await TravelChecklist.create({
      userId,
      tripId: tripId || undefined,
      title: title || 'Travel Checklist',
      items: DEFAULT_ITEMS,
    });

    res.status(201).json({ success: true, checklist });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create checklist' });
  }
};

// Update checklist (toggle item, add item, rename)
export const updateChecklist = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { title, items } = req.body;

    const checklist = await TravelChecklist.findOne({ _id: id, userId });
    if (!checklist) {
      res.status(404).json({ success: false, message: 'Checklist not found' });
      return;
    }

    if (title) checklist.title = title;
    if (items) checklist.items = items;
    await checklist.save();

    res.json({ success: true, checklist });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update checklist' });
  }
};

// Add item to checklist
export const addItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { label, category } = req.body;

    if (!label) {
      res.status(400).json({ success: false, message: 'Label is required' });
      return;
    }

    const checklist = await TravelChecklist.findOne({ _id: id, userId });
    if (!checklist) {
      res.status(404).json({ success: false, message: 'Checklist not found' });
      return;
    }

    checklist.items.push({ label, checked: false, category: category || 'other' });
    await checklist.save();

    res.json({ success: true, checklist });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add item' });
  }
};

// Delete checklist
export const deleteChecklist = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const result = await TravelChecklist.findOneAndDelete({ _id: id, userId });
    if (!result) {
      res.status(404).json({ success: false, message: 'Checklist not found' });
      return;
    }

    res.json({ success: true, message: 'Checklist deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete checklist' });
  }
};
