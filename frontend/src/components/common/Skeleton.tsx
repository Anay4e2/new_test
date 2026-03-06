import { FC } from 'react';
import clsx from 'clsx';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: FC<SkeletonProps> = ({ className }) => (
    <div className={clsx('animate-pulse bg-gray-200 dark:bg-slate-700 rounded', className)} />
);

export const TripCardSkeleton: FC = () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        <Skeleton className="h-40 w-full rounded-none" />
        <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="flex justify-between pt-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
            </div>
        </div>
    </div>
);

export const DashboardTripSkeleton: FC = () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <div className="flex items-start justify-between mb-3">
            <Skeleton className="h-5 w-48" />
            <div className="flex gap-1">
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-7 w-7 rounded-full" />
            </div>
        </div>
        <Skeleton className="h-4 w-36 mb-3" />
        <div className="flex gap-2 mb-3">
            <Skeleton className="h-6 w-14 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
        </div>
        <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
        </div>
    </div>
);
