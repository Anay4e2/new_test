import { FC, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import {
    getGroup,
    respondToInvite,
    getChatHistory,
    createPoll as createPollApi,
    removeMember as removeMemberApi,
} from '@/services/api';
import { useGroupSocket } from '@/hooks/useGroupSocket';
import type { TripGroup, GroupChat, SavedTrip } from '@/types';
import {
    ArrowLeft, Loader2, Users, MessageCircle, BarChart3,
    Send, Plus, UserMinus, CheckCircle, XCircle, Clock, Crown,
    Edit3, Eye,
} from 'lucide-react';
import clsx from 'clsx';
import { InviteModal } from '@/components/common/InviteModal';
import { PollCard } from '@/components/common/PollCard';

type Tab = 'members' | 'chat' | 'polls';

const ROLE_BADGE: Record<string, { icon: FC<any>; label: string; color: string }> = {
    owner: { icon: Crown, label: 'Owner', color: 'text-amber-500' },
    editor: { icon: Edit3, label: 'Editor', color: 'text-blue-500' },
    viewer: { icon: Eye, label: 'Viewer', color: 'text-gray-400' },
};

const STATUS_BADGE: Record<string, { icon: FC<any>; label: string; color: string; bgColor: string }> = {
    accepted: { icon: CheckCircle, label: 'Joined', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20' },
    invited: { icon: Clock, label: 'Pending', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
    declined: { icon: XCircle, label: 'Declined', color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20' },
};

export const GroupTrip: FC = () => {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, user, token } = useAuthStore();
    const chatEndRef = useRef<HTMLDivElement>(null);

    const [group, setGroup] = useState<TripGroup | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('members');
    const [showInvite, setShowInvite] = useState(false);

    // Socket-based chat
    const { messages, connected, typingUsers, sendMessage, sendTyping, stopTyping, setInitialMessages } = useGroupSocket(groupId, token);
    const [chatInput, setChatInput] = useState('');
    const [sendingChat, setSendingChat] = useState(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

    // Poll creation state
    const [showPollForm, setShowPollForm] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);

    const fetchGroup = async () => {
        if (!groupId) return;
        try {
            const res = await getGroup(groupId);
            if (res.success) setGroup(res.group);
        } catch {
            toast.error('Failed to load group.');
        } finally {
            setLoading(false);
        }
    };

    const fetchChat = async () => {
        if (!groupId) return;
        try {
            const res = await getChatHistory(groupId);
            if (res.success) setInitialMessages(res.messages);
        } catch {
            toast.error('Failed to load chat.');
        }
    };

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }
        fetchGroup();
    }, [groupId]);

    // Load chat history when switching to chat tab
    useEffect(() => {
        if (activeTab === 'chat') {
            fetchChat();
        }
    }, [activeTab, groupId]);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendChat = async () => {
        if (!chatInput.trim() || sendingChat || !groupId) return;
        setSendingChat(true);
        try {
            sendMessage(chatInput.trim());
            setChatInput('');
            stopTyping();
        } catch {
            toast.error('Failed to send message.');
        } finally { setSendingChat(false); }
    };

    const handleChatInputChange = (value: string) => {
        setChatInput(value);
        if (value.trim() && user?.name) {
            sendTyping(user.name);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => stopTyping(), 2000);
        } else {
            stopTyping();
        }
    };

    const handleCreatePoll = async () => {
        if (!pollQuestion.trim() || !groupId) return;
        const validOptions = pollOptions.filter(o => o.trim());
        if (validOptions.length < 2) return;
        try {
            await createPollApi(groupId, { question: pollQuestion.trim(), options: validOptions });
            setPollQuestion('');
            setPollOptions(['', '']);
            setShowPollForm(false);
            fetchGroup();
        } catch {
            toast.error('Failed to create poll.');
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!groupId) return;
        try {
            await removeMemberApi(groupId, memberId);
            fetchGroup();
        } catch {
            toast.error('Failed to remove member.');
        }
    };

    const handleRespond = async (response: 'accepted' | 'declined') => {
        if (!groupId) return;
        try {
            await respondToInvite(groupId, response);
            fetchGroup();
        } catch {
            toast.error('Failed to respond to invite.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral dark:bg-slate-900 flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-blue-500" />
            </div>
        );
    }

    if (!group) {
        return (
            <div className="min-h-screen bg-neutral dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Group not found or you don't have access.</p>
                    <button onClick={() => navigate('/dashboard')} className="text-blue-500 hover:underline text-sm">Back to Dashboard</button>
                </div>
            </div>
        );
    }

    const trip = typeof group.tripId === 'object' ? group.tripId as SavedTrip : null;
    const isOwner = group.ownerId === (user as any)?._id;
    const currentUserId = (user as any)?._id || '';

    // Check if user needs to respond to invite
    const myMember = group.members.find(
        m => m.userId === currentUserId || m.email === user?.email
    );
    const needsResponse = myMember && myMember.status === 'invited';

    const acceptedCount = group.members.filter(m => m.status === 'accepted').length;
    const pendingCount = group.members.filter(m => m.status === 'invited').length;

    const cities = trip?.tripResult?.itinerary?.map((d: any) => d.city) || [];
    const uniqueCities = [...new Set(cities)];

    return (
        <div className="min-h-screen bg-neutral dark:bg-slate-900">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                <div className="max-w-6xl mx-auto px-6 py-5">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl font-bold text-slate-800 dark:text-white truncate">{group.name}</h1>
                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <span className="flex items-center gap-1">
                                    <Users size={12} />
                                    {acceptedCount} member{acceptedCount !== 1 ? 's' : ''}
                                    {pendingCount > 0 && <span className="text-amber-500">({pendingCount} pending)</span>}
                                </span>
                                {uniqueCities.length > 0 && (
                                    <span>{uniqueCities.slice(0, 3).join(' → ')}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invite Response Banner */}
            {needsResponse && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                    <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
                        <p className="text-sm text-blue-700 dark:text-blue-400">You've been invited to this group trip!</p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleRespond('accepted')}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                            >
                                Accept
                            </button>
                            <button
                                onClick={() => handleRespond('declined')}
                                className="bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto px-6 py-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left: Trip Info */}
                    <div className="flex-1 min-w-0">
                        {trip ? (
                            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                                <div className="p-5">
                                    <h2 className="font-bold text-lg text-slate-800 dark:text-white mb-2">{trip.title || 'Trip Itinerary'}</h2>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">{uniqueCities.join(' → ')}</div>

                                    {trip.tripResult?.summary && (
                                        <div className="grid grid-cols-3 gap-3 mb-4">
                                            <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg py-2.5">
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Cost</div>
                                                <div className="font-bold text-blue-600 dark:text-blue-400">₹{Math.round(trip.tripResult.summary.totalCost).toLocaleString()}</div>
                                            </div>
                                            <div className="text-center bg-purple-50 dark:bg-purple-900/20 rounded-lg py-2.5">
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Distance</div>
                                                <div className="font-bold text-purple-600 dark:text-purple-400">{Math.round(trip.tripResult.summary.totalDistance)}km</div>
                                            </div>
                                            <div className="text-center bg-green-50 dark:bg-green-900/20 rounded-lg py-2.5">
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Duration</div>
                                                <div className="font-bold text-green-600 dark:text-green-400">{trip.tripResult.itinerary?.length || 0} days</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Day List */}
                                    {trip.tripResult?.itinerary?.map((day: any) => (
                                        <div key={day.day} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-slate-700 last:border-0">
                                            <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 w-7 h-7 rounded-full flex items-center justify-center shrink-0">
                                                {day.day}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-slate-800 dark:text-white">{day.city}</div>
                                                <div className="text-[10px] text-gray-400 truncate">
                                                    {(day.activities || []).map((a: any) => a.name).join(' • ') || 'Free day'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        onClick={() => navigate(`/plan?tripId=${trip._id}`)}
                                        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        View Full Itinerary
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 text-center text-gray-400">
                                Trip details unavailable
                            </div>
                        )}
                    </div>

                    {/* Right: Group Panel */}
                    <div className="w-full lg:w-96">
                        {/* Tabs */}
                        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-t-xl flex">
                            {([
                                { key: 'members', icon: Users, label: 'Members', badge: pendingCount > 0 ? pendingCount : undefined },
                                { key: 'chat', icon: MessageCircle, label: 'Chat' },
                                { key: 'polls', icon: BarChart3, label: 'Polls' },
                            ] as { key: Tab; icon: FC<any>; label: string; badge?: number }[]).map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={clsx(
                                        'flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium border-b-2 transition-colors relative',
                                        activeTab === tab.key
                                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                    )}
                                >
                                    <tab.icon size={14} />
                                    {tab.label}
                                    {tab.badge && (
                                        <span className="bg-amber-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                            {tab.badge}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 border-t-0 rounded-b-xl overflow-hidden" style={{ minHeight: '400px' }}>
                            {/* Members Tab */}
                            {activeTab === 'members' && (
                                <div className="p-4">
                                    {isOwner && (
                                        <button
                                            onClick={() => setShowInvite(true)}
                                            className="w-full mb-3 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <Plus size={14} />
                                            Invite Members
                                        </button>
                                    )}
                                    <div className="space-y-2">
                                        {group.members.map(member => {
                                            const roleCfg = ROLE_BADGE[member.role];
                                            const statusCfg = STATUS_BADGE[member.status];
                                            const RoleIcon = roleCfg.icon;
                                            const StatusIcon = statusCfg.icon;

                                            return (
                                                <div key={member._id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                        {member.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-slate-800 dark:text-white truncate flex items-center gap-1.5">
                                                            {member.name}
                                                            <RoleIcon size={12} className={roleCfg.color} />
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[10px]">
                                                            <StatusIcon size={10} className={statusCfg.color} />
                                                            <span className={statusCfg.color}>{statusCfg.label}</span>
                                                        </div>
                                                    </div>
                                                    {isOwner && member.role !== 'owner' && (
                                                        <button
                                                            onClick={() => handleRemoveMember(member._id)}
                                                            className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                                                            title="Remove member"
                                                        >
                                                            <UserMinus size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Chat Tab */}
                            {activeTab === 'chat' && (
                                <div className="flex flex-col" style={{ height: '400px' }}>
                                    {/* Connection status */}
                                    <div className={clsx(
                                        'px-3 py-1 text-xs text-center transition-all',
                                        connected ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                    )}>
                                        {connected ? '● Live' : '○ Reconnecting...'}
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {messages.length === 0 ? (
                                            <div className="text-center text-gray-400 text-sm py-12">
                                                <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                                                No messages yet. Start the conversation!
                                            </div>
                                        ) : (
                                            messages.map((msg) => {
                                                const isMe = msg.userId === currentUserId;
                                                return (
                                                    <div
                                                        key={msg._id}
                                                        className={clsx('flex', isMe ? 'justify-end' : 'justify-start')}
                                                    >
                                                        <div className={clsx(
                                                            'max-w-[80%] px-3 py-2 rounded-xl',
                                                            isMe
                                                                ? 'bg-blue-600 text-white rounded-br-sm'
                                                                : 'bg-gray-100 dark:bg-slate-700 text-slate-800 dark:text-white rounded-bl-sm'
                                                        )}>
                                                            {!isMe && (
                                                                <div className="text-[10px] font-semibold text-blue-500 dark:text-blue-400 mb-0.5">{msg.userName}</div>
                                                            )}
                                                            <p className="text-sm">{msg.message}</p>
                                                            <div className={clsx('text-[9px] mt-0.5', isMe ? 'text-blue-200' : 'text-gray-400')}>
                                                                {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>
                                    {/* Typing indicator */}
                                    {typingUsers.size > 0 && (
                                        <div className="px-4 py-1 text-xs text-gray-400 italic">
                                            {[...typingUsers.values()].join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                                        </div>
                                    )}
                                    {/* Chat Input */}
                                    <div className="border-t border-gray-200 dark:border-slate-700 p-3 flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={chatInput}
                                            onChange={(e) => handleChatInputChange(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                                            placeholder="Type a message..."
                                            className="flex-1 border border-gray-200 dark:border-slate-600 rounded-full px-4 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                        <button
                                            onClick={handleSendChat}
                                            disabled={sendingChat || !chatInput.trim()}
                                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors disabled:opacity-50"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Polls Tab */}
                            {activeTab === 'polls' && (
                                <div className="p-4 space-y-3">
                                    <button
                                        onClick={() => setShowPollForm(!showPollForm)}
                                        className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <Plus size={14} />
                                        Create Poll
                                    </button>

                                    {showPollForm && (
                                        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-3">
                                            <input
                                                type="text"
                                                value={pollQuestion}
                                                onChange={(e) => setPollQuestion(e.target.value)}
                                                placeholder="Ask a question..."
                                                className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            {pollOptions.map((opt, i) => (
                                                <input
                                                    key={i}
                                                    type="text"
                                                    value={opt}
                                                    onChange={(e) => {
                                                        const updated = [...pollOptions];
                                                        updated[i] = e.target.value;
                                                        setPollOptions(updated);
                                                    }}
                                                    placeholder={`Option ${i + 1}`}
                                                    className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none"
                                                />
                                            ))}
                                            <div className="flex items-center gap-2">
                                                {pollOptions.length < 5 && (
                                                    <button
                                                        onClick={() => setPollOptions([...pollOptions, ''])}
                                                        className="text-xs text-blue-500 hover:underline"
                                                    >
                                                        + Add option
                                                    </button>
                                                )}
                                                <div className="flex-1" />
                                                <button
                                                    onClick={handleCreatePoll}
                                                    disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                                                >
                                                    Post Poll
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {group.polls.length === 0 && !showPollForm ? (
                                        <div className="text-center text-gray-400 text-sm py-8">
                                            <BarChart3 size={32} className="mx-auto mb-2 opacity-50" />
                                            No polls yet. Create one to vote on preferences!
                                        </div>
                                    ) : (
                                        [...group.polls].reverse().map(poll => (
                                            <PollCard
                                                key={poll._id}
                                                groupId={group._id}
                                                poll={poll}
                                                currentUserId={currentUserId}
                                                isOwner={isOwner}
                                                onUpdated={fetchGroup}
                                            />
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Invite Modal */}
            {showInvite && (
                <InviteModal
                    groupId={group._id}
                    onClose={() => setShowInvite(false)}
                    onInvited={() => { setShowInvite(false); fetchGroup(); }}
                />
            )}
        </div>
    );
};
