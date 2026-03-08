import type { Hotel, Restaurant, Festival } from '../../types';

export interface AdminUser {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    provider?: string;
    createdAt: string;
}

export interface DashboardStats {
    pageview: number;
    search: number;
    trip_generation: number;
    api_call: number;
    total: number;
}

export interface AuditLogEntry {
    _id: string;
    adminId: { _id: string; name: string; email: string } | string;
    action: string;
    entity: string;
    entityId: string;
    details?: Record<string, any>;
    timestamp: string;
}

export interface ActiveSession {
    userId: string;
    user: { _id: string; name: string; email: string; role: string } | null;
    lastActivity: string;
    requestCount: number;
    lastEndpoint: string;
    lastIp: string;
    lastUserAgent: string;
}

export interface AppSettings {
    _id?: string;
    siteName: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    maxTripsPerUser: number;
    featuredPackageIds: string[];
    defaultCurrency: string;
    contactEmail: string;
    socialLinks: {
        twitter?: string;
        instagram?: string;
        facebook?: string;
    };
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export type { Hotel, Restaurant, Festival };
