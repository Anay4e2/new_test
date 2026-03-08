import { FC, useState } from 'react';
import toast from 'react-hot-toast';
import type { GroupItineraryRequest, ItineraryRequestType } from '@/types';
import { voteOnRequest as voteApi, resolveRequest as resolveApi } from '@/services/api';
import { ThumbsUp, ThumbsDown, CheckCircle2, XCircle, Clock, Tag, Calendar, MessageSquare } from 'lucide-react';
import clsx from 'clsx';

const typeLabels: Record<ItineraryRequestType, string> = {
    add_activity: 'Add Activity',
    remove_activity: 'Remove Activity',
    change_hotel: 'Change Hotel',
    change_date: 'Change Date',
    modify_route: 'Modify Route',
    custom: 'Custom',
};

const typeColors: Record<ItineraryRequestType, string> = {
    add_activity: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    remove_activity: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    change_hotel: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    change_date: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    modify_route: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    custom: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

interface RequestCardProps {
    groupId: string;
    request: GroupItineraryRequest;
    currentUserId: string;
    isOwner: boolean;
    onUpdated: () => void;
}

export const RequestCard: FC<RequestCardProps> = ({ groupId, request, currentUserId, isOwner, onUpdated }) => {
    const [voting, setVoting] = useState(false);
    const [resolving, setResolving] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);

    const isPending = request.status === 'pending';
    const approveVotes = request.votes.filter(v => v.vote === 'approve').length;
    const rejectVotes = request.votes.filter(v => v.vote === 'reject').length;
    const userVote = request.votes.find(v => v.userId === currentUserId);
    const isRequester = request.requesterId === currentUserId;

    const handleVote = async (vote: 'approve' | 'reject') => {
        if (voting) return;
        setVoting(true);
        try {
            await voteApi(groupId, request._id, vote);
            onUpdated();
        } catch {
            toast.error('Failed to submit vote.');
        } finally {
            setVoting(false);
        }
    };

    const handleResolve = async (status: 'approved' | 'rejected') => {
        if (resolving) return;
        if (status === 'rejected' && !showRejectInput) {
            setShowRejectInput(true);
            return;
        }
        setResolving(true);
        try {
            await resolveApi(groupId, request._id, { status, rejectionReason: status === 'rejected' ? rejectionReason : undefined });
            toast.success(status === 'approved' ? 'Request approved!' : 'Request rejected.');
            onUpdated();
        } catch {
            toast.error('Failed to resolve request.');
        } finally {
            setResolving(false);
            setShowRejectInput(false);
        }
    };

    const statusBadge = {
        pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };

    return (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-sm text-slate-800 dark:text-white truncate">
                            {request.title}
                        </h5>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                            by {request.requesterName} • {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap', statusBadge[request.status])}>
                        {request.status === 'pending' && <Clock size={10} className="inline mr-0.5 -mt-0.5" />}
                        {request.status === 'approved' && <CheckCircle2 size={10} className="inline mr-0.5 -mt-0.5" />}
                        {request.status === 'rejected' && <XCircle size={10} className="inline mr-0.5 -mt-0.5" />}
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                    <span className={clsx('text-[10px] font-medium px-2 py-0.5 rounded-full', typeColors[request.type])}>
                        <Tag size={10} className="inline mr-0.5 -mt-0.5" />
                        {typeLabels[request.type]}
                    </span>
                    {request.dayNumber && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                            <Calendar size={10} className="inline mr-0.5 -mt-0.5" />
                            Day {request.dayNumber}
                        </span>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="px-4 py-3">
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    <MessageSquare size={12} className="inline mr-1 -mt-0.5 text-gray-400" />
                    {request.description}
                </p>

                {request.rejectionReason && (
                    <p className="text-xs text-red-500 mt-2 italic">
                        Rejection reason: {request.rejectionReason}
                    </p>
                )}
            </div>

            {/* Votes & Actions */}
            <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <ThumbsUp size={12} className={clsx(userVote?.vote === 'approve' && 'text-green-500')} />
                            {approveVotes}
                        </span>
                        <span className="flex items-center gap-1">
                            <ThumbsDown size={12} className={clsx(userVote?.vote === 'reject' && 'text-red-500')} />
                            {rejectVotes}
                        </span>
                    </div>

                    {isPending && !isRequester && (
                        <div className="flex items-center gap-2">
                            {!isOwner && (
                                <>
                                    <button
                                        onClick={() => handleVote('approve')}
                                        disabled={voting}
                                        className={clsx(
                                            'text-xs px-2.5 py-1 rounded-lg transition-colors',
                                            userVote?.vote === 'approve'
                                                ? 'bg-green-500 text-white'
                                                : 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400'
                                        )}
                                    >
                                        <ThumbsUp size={12} className="inline mr-1 -mt-0.5" />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleVote('reject')}
                                        disabled={voting}
                                        className={clsx(
                                            'text-xs px-2.5 py-1 rounded-lg transition-colors',
                                            userVote?.vote === 'reject'
                                                ? 'bg-red-500 text-white'
                                                : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'
                                        )}
                                    >
                                        <ThumbsDown size={12} className="inline mr-1 -mt-0.5" />
                                        Reject
                                    </button>
                                </>
                            )}
                            {isOwner && (
                                <>
                                    <button
                                        onClick={() => handleResolve('approved')}
                                        disabled={resolving}
                                        className="text-xs px-2.5 py-1 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                                    >
                                        <CheckCircle2 size={12} className="inline mr-1 -mt-0.5" />
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => handleResolve('rejected')}
                                        disabled={resolving}
                                        className="text-xs px-2.5 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                                    >
                                        <XCircle size={12} className="inline mr-1 -mt-0.5" />
                                        Reject
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Reject reason input */}
                {showRejectInput && (
                    <div className="mt-2 flex items-center gap-2">
                        <input
                            type="text"
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            placeholder="Reason for rejection (optional)"
                            className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-400"
                        />
                        <button
                            onClick={() => handleResolve('rejected')}
                            disabled={resolving}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                        >
                            Confirm
                        </button>
                        <button
                            onClick={() => setShowRejectInput(false)}
                            className="text-xs px-2.5 py-1.5 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
