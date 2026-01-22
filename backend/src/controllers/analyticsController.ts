import { Request, Response } from 'express';
import Analytics from '../models/Analytics';

// Helper to get date ranges
const getDateRange = (period: 'day' | 'week' | 'month'): Date => {
    const now = new Date();
    switch (period) {
        case 'day':
            return new Date(now.getTime() - 24 * 60 * 60 * 1000);
        case 'week':
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case 'month':
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        default:
            return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
};

// @desc    Get analytics summary (counts for day/week/month)
// @route   GET /api/admin/analytics/summary
// @access  Admin
export const getSummary = async (req: Request, res: Response): Promise<void> => {
    try {
        const dayStart = getDateRange('day');
        const weekStart = getDateRange('week');
        const monthStart = getDateRange('month');

        // Get counts for each period
        const [dayStats, weekStats, monthStats] = await Promise.all([
            Analytics.aggregate([
                { $match: { timestamp: { $gte: dayStart } } },
                { $group: { _id: '$type', count: { $sum: 1 } } }
            ]),
            Analytics.aggregate([
                { $match: { timestamp: { $gte: weekStart } } },
                { $group: { _id: '$type', count: { $sum: 1 } } }
            ]),
            Analytics.aggregate([
                { $match: { timestamp: { $gte: monthStart } } },
                { $group: { _id: '$type', count: { $sum: 1 } } }
            ])
        ]);

        const formatStats = (stats: any[]) => {
            const result: Record<string, number> = {
                pageview: 0,
                search: 0,
                trip_generation: 0,
                api_call: 0,
                total: 0
            };
            stats.forEach(s => {
                result[s._id] = s.count;
                result.total += s.count;
            });
            return result;
        };

        res.json({
            success: true,
            data: {
                day: formatStats(dayStats),
                week: formatStats(weekStats),
                month: formatStats(monthStats)
            }
        });
    } catch (error) {
        console.error('Analytics summary error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
    }
};

// @desc    Get traffic over time
// @route   GET /api/admin/analytics/traffic?period=day|week|month
// @access  Admin
export const getTraffic = async (req: Request, res: Response): Promise<void> => {
    try {
        const period = (req.query.period as 'day' | 'week' | 'month') || 'week';
        const startDate = getDateRange(period);

        // Determine grouping interval
        let dateFormat: string;
        if (period === 'day') {
            dateFormat = '%Y-%m-%d %H:00'; // Group by hour
        } else if (period === 'week') {
            dateFormat = '%Y-%m-%d'; // Group by day
        } else {
            dateFormat = '%Y-%m-%d'; // Group by day
        }

        const traffic = await Analytics.aggregate([
            { $match: { timestamp: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: dateFormat, date: '$timestamp' } },
                        type: '$type'
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.date': 1 } }
        ]);

        // Transform to chart-friendly format
        const chartData: Record<string, { date: string; pageview: number; search: number; trip_generation: number; api_call: number; total: number }> = {};

        traffic.forEach(item => {
            const date = item._id.date;
            if (!chartData[date]) {
                chartData[date] = { date, pageview: 0, search: 0, trip_generation: 0, api_call: 0, total: 0 };
            }
            const typeKey = item._id.type as 'pageview' | 'search' | 'trip_generation' | 'api_call';
            chartData[date][typeKey] = item.count;
            chartData[date].total += item.count;
        });

        res.json({
            success: true,
            period,
            data: Object.values(chartData)
        });
    } catch (error) {
        console.error('Analytics traffic error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch traffic data' });
    }
};

// @desc    Get top searches
// @route   GET /api/admin/analytics/searches?period=day|week|month
// @access  Admin
export const getSearches = async (req: Request, res: Response): Promise<void> => {
    try {
        const period = (req.query.period as 'day' | 'week' | 'month') || 'week';
        const startDate = getDateRange(period);

        const searches = await Analytics.aggregate([
            {
                $match: {
                    timestamp: { $gte: startDate },
                    searchQuery: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: '$searchQuery',
                    count: { $sum: 1 },
                    lastSearched: { $max: '$timestamp' }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 20 }
        ]);

        res.json({
            success: true,
            period,
            data: searches.map(s => ({
                query: s._id,
                count: s.count,
                lastSearched: s.lastSearched
            }))
        });
    } catch (error) {
        console.error('Analytics searches error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch search data' });
    }
};

// @desc    Get recent activity
// @route   GET /api/admin/analytics/recent?limit=50
// @access  Admin
export const getRecentActivity = async (req: Request, res: Response): Promise<void> => {
    try {
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

        const recent = await Analytics.find()
            .sort({ timestamp: -1 })
            .limit(limit)
            .select('type endpoint method statusCode responseTime timestamp searchQuery');

        res.json({
            success: true,
            data: recent
        });
    } catch (error) {
        console.error('Analytics recent error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch recent activity' });
    }
};
