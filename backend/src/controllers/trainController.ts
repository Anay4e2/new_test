import { Request, Response } from 'express';
import trainService from '../services/trainService';

export const getTrainsBetweenStations = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fromCity, toCity } = req.params;
        const { date } = req.query;

        const result = await trainService.getTrainsBetweenStations(
            fromCity,
            toCity,
            date as string | undefined
        );

        res.json(result);
    } catch (error) {
        console.error('Error fetching trains:', error);
        res.status(500).json({ error: 'Failed to fetch train information' });
    }
};

export const getStationCodes = (req: Request, res: Response): void => {
    res.json(trainService.getStationCodes());
};

export const getLiveStation = async (req: Request, res: Response): Promise<void> => {
    try {
        const { stationCode } = req.params;
        const hours = parseInt(req.query.hours as string) || 2;

        const trains = await trainService.getLiveStation(stationCode, hours);
        res.json({ stationCode, trains, totalTrains: trains.length });
    } catch (error) {
        console.error('Error fetching live station:', error);
        res.status(500).json({ error: 'Failed to fetch live station data' });
    }
};

export const getTrainSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
        const { trainNumber } = req.params;
        const schedule = await trainService.getTrainSchedule(trainNumber);
        res.json({ trainNumber, schedule });
    } catch (error) {
        console.error('Error fetching train schedule:', error);
        res.status(500).json({ error: 'Failed to fetch train schedule' });
    }
};

export const getTrainStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { trainNumber } = req.params;
        const status = await trainService.getTrainLiveStatus(trainNumber);
        res.json({ trainNumber, status });
    } catch (error) {
        console.error('Error fetching train status:', error);
        res.status(500).json({ error: 'Failed to fetch train status' });
    }
};

export const checkPNRStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { pnrNumber } = req.params;
        const pnrStatus = await trainService.checkPNRStatus(pnrNumber);
        res.json({ pnrNumber, status: pnrStatus });
    } catch (error) {
        console.error('Error checking PNR status:', error);
        res.status(500).json({ error: 'Failed to check PNR status' });
    }
};

export const searchStation = async (req: Request, res: Response): Promise<void> => {
    try {
        const { query } = req.query;
        if (!query) {
            res.status(400).json({ error: 'Query parameter is required' });
            return;
        }
        const stations = await trainService.searchStation(query as string);
        res.json({ query, stations });
    } catch (error) {
        console.error('Error searching station:', error);
        res.status(500).json({ error: 'Failed to search station' });
    }
};

export const checkSeatAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
        const { trainNumber } = req.params;
        const { from, to, class: classType, date, quota } = req.query;

        if (!from || !to || !classType || !date) {
            res.status(400).json({ error: 'Required: from, to, class, date' });
            return;
        }

        const availability = await trainService.checkSeatAvailability(
            trainNumber,
            from as string,
            to as string,
            classType as string,
            date as string,
            (quota as string) || 'GN'
        );

        res.json({ trainNumber, from, to, classType, date, availability });
    } catch (error) {
        console.error('Error checking seat availability:', error);
        res.status(500).json({ error: 'Failed to check seat availability' });
    }
};

export const getFare = async (req: Request, res: Response): Promise<void> => {
    try {
        const { trainNumber } = req.params;
        const { from, to } = req.query;

        if (!from || !to) {
            res.status(400).json({ error: 'Required: from, to' });
            return;
        }

        const fare = await trainService.getFare(trainNumber, from as string, to as string);
        res.json({ trainNumber, from, to, fare });
    } catch (error) {
        console.error('Error fetching fare:', error);
        res.status(500).json({ error: 'Failed to fetch fare' });
    }
};
