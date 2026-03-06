import { FC, useState } from 'react';
import toast from 'react-hot-toast';
import type { GroupPoll } from '@/types';
import { votePoll as votePollApi, closePoll as closePollApi } from '@/services/api';
import { Lock, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

interface PollCardProps {
    groupId: string;
    poll: GroupPoll;
    currentUserId: string;
    isOwner: boolean;
    onUpdated: () => void;
}

export const PollCard: FC<PollCardProps> = ({ groupId, poll, currentUserId, isOwner, onUpdated }) => {
    const [voting, setVoting] = useState(false);
    const [closing, setClosing] = useState(false);

    const totalVotes = poll.options.reduce((sum, o) => sum + o.votes.length, 0);
    const userVotedIndex = poll.options.findIndex(o => o.votes.includes(currentUserId));
    const hasVoted = userVotedIndex !== -1;
    const isCreator = poll.createdBy === currentUserId;
    const showResults = hasVoted || !poll.isActive;

    const handleVote = async (index: number) => {
        if (!poll.isActive || voting) return;
        setVoting(true);
        try {
            await votePollApi(groupId, poll._id, index);
            onUpdated();
        } catch { toast.error('Failed to submit vote.'); }
        finally { setVoting(false); }
    };

    const handleClose = async () => {
        if (closing) return;
        setClosing(true);
        try {
            await closePollApi(groupId, poll._id);
            onUpdated();
        } catch { toast.error('Failed to close poll.'); }
        finally { setClosing(false); }
    };

    return (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-sm text-slate-800 dark:text-white truncate">{poll.question}</h5>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                        {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                        {!poll.isActive && <span className="ml-1.5 text-red-400">• Closed</span>}
                    </p>
                </div>
                {poll.isActive && (isCreator || isOwner) && (
                    <button
                        onClick={handleClose}
                        disabled={closing}
                        className="ml-2 text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
                    >
                        <Lock size={12} />
                        Close
                    </button>
                )}
            </div>

            <div className="p-4 space-y-2">
                {poll.options.map((option, index) => {
                    const pct = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;
                    const isUserVote = index === userVotedIndex;
                    const isWinning = poll.options.every(o => o.votes.length <= option.votes.length);

                    return (
                        <button
                            key={option._id}
                            onClick={() => handleVote(index)}
                            disabled={!poll.isActive || voting}
                            className={clsx(
                                'w-full relative rounded-lg border px-3 py-2.5 text-left transition-all overflow-hidden',
                                isUserVote
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600',
                                !poll.isActive && 'cursor-default'
                            )}
                        >
                            {/* Background bar */}
                            {showResults && (
                                <div
                                    className={clsx(
                                        'absolute inset-y-0 left-0 transition-all duration-500',
                                        isUserVote ? 'bg-blue-100 dark:bg-blue-900/30' :
                                            isWinning && !poll.isActive ? 'bg-green-100 dark:bg-green-900/20' :
                                                'bg-gray-100 dark:bg-slate-700/50'
                                    )}
                                    style={{ width: `${pct}%` }}
                                />
                            )}

                            <div className="relative flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-800 dark:text-white flex items-center gap-1.5">
                                    {isUserVote && <CheckCircle2 size={14} className="text-blue-500" />}
                                    {option.text}
                                </span>
                                {showResults && (
                                    <span className={clsx(
                                        'text-xs font-bold',
                                        isUserVote ? 'text-blue-600' : 'text-gray-400'
                                    )}>
                                        {pct}%
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
