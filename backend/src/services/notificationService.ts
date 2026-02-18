import Notification, { NotificationType, NotificationPriority } from '../models/Notification';
import SavedTrip from '../models/SavedTrip';

interface CreateNotificationData {
    type: NotificationType;
    title: string;
    message: string;
    actionUrl?: string;
    priority?: NotificationPriority;
    metadata?: Record<string, any>;
}

// Max 3 notifications per day per user
const DAILY_LIMIT = 3;

const canSendNotification = async (userId: string): Promise<boolean> => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const count = await Notification.countDocuments({
        userId,
        createdAt: { $gte: todayStart },
    });
    return count < DAILY_LIMIT;
};

// Create a notification (respects daily limit)
export const createNotification = async (
    userId: string,
    data: CreateNotificationData
): Promise<boolean> => {
    try {
        if (!(await canSendNotification(userId))) return false;

        // 30-day expiration
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await Notification.create({
            userId,
            ...data,
            priority: data.priority || 'medium',
            expiresAt,
        });

        return true;
    } catch {
        return false;
    }
};

// Generate trip reminders for all users with upcoming trips
export const generateTripReminders = async (): Promise<number> => {
    let created = 0;
    try {
        // Find saved trips that have date info
        const trips = await SavedTrip.find({}).populate('userId', 'name').lean();

        const now = new Date();

        for (const trip of trips) {
            const itinerary = (trip as any).tripResult?.itinerary || [];
            if (itinerary.length === 0) continue;

            // Try to find trip start date from itinerary
            const firstDay = itinerary[0];
            if (!firstDay?.date) continue;

            const startDate = new Date(firstDay.date);
            if (isNaN(startDate.getTime())) continue;

            const userId = (trip as any).userId?._id?.toString() || (trip as any).userId?.toString();
            if (!userId) continue;

            const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const cities = [...new Set(itinerary.map((d: any) => d.city))] as string[];
            const destination = cities[0] || 'your destination';

            // 7 days before
            if (daysUntil === 7) {
                const sent = await createNotification(userId, {
                    type: 'trip_reminder',
                    title: `🎒 Your trip to ${destination} starts in 7 days!`,
                    message: `Time to check your packing list and finalize your plans for ${cities.join(', ')}.`,
                    actionUrl: `/plan?tripId=${trip._id}`,
                    priority: 'medium',
                    metadata: { tripId: trip._id, daysUntil: 7 },
                });
                if (sent) created++;
            }

            // 1 day before
            if (daysUntil === 1) {
                const day1Activities = itinerary[0]?.activities?.slice(0, 3)?.map((a: any) => a.name).join(', ') || 'exciting activities';
                const sent = await createNotification(userId, {
                    type: 'trip_reminder',
                    title: `✈️ Tomorrow's the day!`,
                    message: `Day 1 in ${destination}: ${day1Activities}. Have a wonderful trip!`,
                    actionUrl: `/plan?tripId=${trip._id}`,
                    priority: 'high',
                    metadata: { tripId: trip._id, daysUntil: 1 },
                });
                if (sent) created++;
            }

            // Morning of each trip day (daysUntil <= 0 means trip is ongoing)
            if (daysUntil <= 0) {
                const tripDayIndex = Math.abs(daysUntil);
                const todayPlan = itinerary[tripDayIndex];
                if (todayPlan) {
                    const todayCity = todayPlan.city || destination;
                    const activities = todayPlan.activities?.slice(0, 2)?.map((a: any) => a.name).join(' & ') || 'exploring';
                    const sent = await createNotification(userId, {
                        type: 'trip_reminder',
                        title: `☀️ Good morning! Day ${tripDayIndex + 1} in ${todayCity}`,
                        message: `Today: ${activities}. Enjoy your day!`,
                        actionUrl: `/plan?tripId=${trip._id}`,
                        priority: 'medium',
                        metadata: { tripId: trip._id, dayIndex: tripDayIndex },
                    });
                    if (sent) created++;
                }
            }
        }
    } catch {
        // silently fail
    }
    return created;
};

// Generate weather alerts for a trip
export const generateWeatherAlerts = async (userId: string, tripId: string): Promise<boolean> => {
    try {
        const trip = await SavedTrip.findById(tripId).lean();
        if (!trip) return false;

        const itinerary = (trip as any).tripResult?.itinerary || [];
        if (itinerary.length === 0) return false;

        const cities = [...new Set(itinerary.map((d: any) => d.city))] as string[];

        // Check for extreme weather conditions based on seasonal data
        const month = new Date().getMonth() + 1;
        let alertNeeded = false;
        let alertCity = '';

        // Simple heuristic: alert for extreme heat or monsoon
        if (month >= 5 && month <= 6) {
            alertNeeded = true;
            alertCity = cities[0] || '';
            await createNotification(userId, {
                type: 'weather_alert',
                title: `🌡️ Heat advisory for ${alertCity}`,
                message: `Temperatures may exceed 40°C in ${alertCity}. Pack sun protection, stay hydrated, and plan indoor activities during peak hours.`,
                actionUrl: `/plan?tripId=${tripId}`,
                priority: 'high',
                metadata: { tripId, city: alertCity, condition: 'extreme_heat' },
            });
        } else if (month >= 7 && month <= 9) {
            alertNeeded = true;
            alertCity = cities[0] || '';
            await createNotification(userId, {
                type: 'weather_alert',
                title: `🌧️ Monsoon alert for ${alertCity}`,
                message: `Heavy rainfall expected in ${alertCity}. Carry rain gear and check for travel disruptions.`,
                actionUrl: `/plan?tripId=${tripId}`,
                priority: 'high',
                metadata: { tripId, city: alertCity, condition: 'monsoon' },
            });
        }

        return alertNeeded;
    } catch {
        return false;
    }
};

// Mark a single notification as read
export const markAsRead = async (notificationId: string): Promise<boolean> => {
    try {
        const result = await Notification.findByIdAndUpdate(notificationId, { isRead: true });
        return !!result;
    } catch {
        return false;
    }
};

// Mark all notifications as read for a user
export const markAllAsRead = async (userId: string): Promise<number> => {
    try {
        const result = await Notification.updateMany({ userId, isRead: false }, { isRead: true });
        return result.modifiedCount;
    } catch {
        return 0;
    }
};

// Get unread count for a user
export const getUnreadCount = async (userId: string): Promise<number> => {
    try {
        return await Notification.countDocuments({ userId, isRead: false });
    } catch {
        return 0;
    }
};
