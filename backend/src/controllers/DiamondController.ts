import { Request, Response } from 'express';
import Diamond from '../models/Diamond';

// In-memory store for fallback
let mockDiamonds: any[] = [
    {
        _id: '1',
        sku: 'DIA-001',
        shape: 'Round',
        carat: 1.0,
        color: 'D',
        clarity: 'VS1',
        cost_price: 5000,
        margin_percentage: 10,
        listing_price: 5500,
        is_sold_out: false
    }
];

// @desc    Get all diamonds
// @route   GET /api/diamonds
// @access  Public (or Private)
export const getDiamonds = async (req: Request, res: Response) => {
  try {
    const diamonds = await Diamond.find({});
    res.json(diamonds);
  } catch (error: any) {
    // res.status(500).json({ message: error.message });
    console.log('DB failed, returning mock diamonds');
    res.json(mockDiamonds);
  }
};

// @desc    Get single diamond
// @route   GET /api/diamonds/:id
// @access  Public
export const getDiamondById = async (req: Request, res: Response) => {
  try {
    const diamond = await Diamond.findById(req.params.id);
    if (diamond) {
      res.json(diamond);
    } else {
      res.status(404).json({ message: 'Diamond not found' });
    }
  } catch (error: any) {
    const d = mockDiamonds.find(d => d._id === req.params.id);
    if (d) res.json(d);
    else res.status(404).json({ message: 'Diamond not found (mock)' });
  }
};

// @desc    Create a diamond
// @route   POST /api/diamonds
// @access  Private/Admin
export const createDiamond = async (req: Request, res: Response) => {
  try {
    const diamond = new Diamond(req.body);
    const createdDiamond = await diamond.save();
    res.status(201).json(createdDiamond);
  } catch (error: any) {
    console.log('DB failed, adding to mock diamonds');
    const newD = { ...req.body, _id: Date.now().toString(), listing_price: req.body.cost_price * (1 + req.body.margin_percentage/100) };
    mockDiamonds.push(newD);
    res.status(201).json(newD);
  }
};

// @desc    Update a diamond
// @route   PUT /api/diamonds/:id
// @access  Private/Admin
export const updateDiamond = async (req: Request, res: Response) => {
  try {
    const diamond = await Diamond.findById(req.params.id);

    if (diamond) {
      Object.assign(diamond, req.body);
      const updatedDiamond = await diamond.save();
      res.json(updatedDiamond);
    } else {
      res.status(404).json({ message: 'Diamond not found' });
    }
  } catch (error: any) {
      const idx = mockDiamonds.findIndex(d => d._id === req.params.id);
      if (idx !== -1) {
          mockDiamonds[idx] = { ...mockDiamonds[idx], ...req.body };
          res.json(mockDiamonds[idx]);
      } else {
          res.status(404).json({ message: 'Diamond not found' });
      }
  }
};

// @desc    Delete a diamond
// @route   DELETE /api/diamonds/:id
// @access  Private/Admin
export const deleteDiamond = async (req: Request, res: Response) => {
  try {
    const diamond = await Diamond.findById(req.params.id);

    if (diamond) {
      await diamond.deleteOne();
      res.json({ message: 'Diamond removed' });
    } else {
      res.status(404).json({ message: 'Diamond not found' });
    }
  } catch (error: any) {
      const idx = mockDiamonds.findIndex(d => d._id === req.params.id);
      if (idx !== -1) {
          mockDiamonds.splice(idx, 1);
          res.json({ message: 'Diamond removed' });
      } else {
          res.status(500).json({ message: error.message });
      }
  }
};
