import { Request, Response, NextFunction } from 'express';
import Analytics from '../models/Analytics';
import logger from '../lib/logger';

// Determine the type of analytics event based on endpoint
const getEventType = (endpoint: string, method: string): 'pageview' | 'search' | 'trip_generation' | 'api_call' => {
    if (endpoint.includes('/generate-trip')) return 'trip_generation';
    if (endpoint.includes('/search') || endpoint.includes('/trains')) return 'search';
    if (method === 'GET' && (endpoint === '/' || endpoint.includes('/config'))) return 'pageview';
    return 'api_call';
};

// Extract search query from request
const extractSearchQuery = (req: Request): string | undefined => {
    if (req.query.query) return req.query.query as string;
    if (req.params.fromCity && req.params.toCity) {
        return `${req.params.fromCity} to ${req.params.toCity}`;
    }
    if (req.body?.selectedCityIds) {
        return `Trip: ${req.body.selectedCityIds.join(', ')}`;
    }
    return undefined;
};

export const analyticsMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const startTime = Date.now();

    // Store original end function
    const originalEnd = res.end;

    // Override end to capture response
    res.end = function (this: Response, ...args: any[]): Response {
        const responseTime = Date.now() - startTime;

        // Log analytics asynchronously (don't block response)
        setImmediate(async () => {
            try {
                const eventType = getEventType(req.path, req.method);

                await Analytics.create({
                    type: eventType,
                    endpoint: req.path,
                    method: req.method,
                    searchQuery: extractSearchQuery(req),
                    userId: (req as any).userId || undefined,
                    ipAddress: req.ip || req.socket.remoteAddress,
                    userAgent: req.get('user-agent'),
                    responseTime,
                    statusCode: res.statusCode,
                    timestamp: new Date()
                });
            } catch (error) {
                logger.error('Analytics logging error:', error);
            }
        });

        return originalEnd.apply(this, args as Parameters<typeof originalEnd>);
    } as any;

    next();
};

export default analyticsMiddleware;
