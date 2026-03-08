import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { updateProfileApi, changePasswordApi, uploadFileApi } from '@/services/api';
import { ArrowLeft, User, Lock, Loader2, Check, Camera, Heart, Trash2, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

const TRAVEL_INTERESTS = [
    'Adventure', 'Culture', 'Food', 'Nature', 'History', 'Pilgrimage',
    'Beach', 'Mountains', 'Wildlife', 'Photography', 'Architecture', 'Shopping',
];

export const Profile: FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuthStore();

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [saving, setSaving] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    // Avatar
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // Travel interests (synced to backend)
    const [interests, setInterests] = useState<string[]>(user?.interests || []);
    const [savingInterests, setSavingInterests] = useState(false);

    // Delete account confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteText, setDeleteText] = useState('');

    useEffect(() => {
        if (!isAuthenticated()) navigate('/login');
    }, []);

    const toggleInterest = (interest: string) => {
        setInterests(prev => {
            const next = prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest];
            return next;
        });
    };

    const handleSaveInterests = async () => {
        setSavingInterests(true);
        try {
            const res = await updateProfileApi({ interests });
            if (res.success && res.user) {
                useAuthStore.setState({ user: res.user });
                toast.success('Interests saved');
            }
        } catch {
            toast.error('Failed to save interests');
        } finally {
            setSavingInterests(false);
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }
        setUploadingAvatar(true);
        try {
            const uploadRes = await uploadFileApi(file, 'avatars');
            if (uploadRes.success && uploadRes.url) {
                setAvatarPreview(uploadRes.url);
                const res = await updateProfileApi({ avatar: uploadRes.url });
                if (res.success && res.user) {
                    useAuthStore.setState({ user: res.user });
                    toast.success('Avatar updated');
                }
            }
        } catch {
            toast.error('Failed to upload avatar');
        } finally {
            setUploadingAvatar(false);
        }
    };

    useEffect(() => {
        if (user?.avatar) setAvatarPreview(user.avatar);
    }, [user?.avatar]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { toast.error('Name is required'); return; }
        setSaving(true);
        try {
            const res = await updateProfileApi({ name: name.trim(), email: email.trim() });
            if (res.success && res.user) {
                useAuthStore.setState({ user: res.user });
                toast.success('Profile updated');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
        if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
        setChangingPassword(true);
        try {
            const res = await changePasswordApi(currentPassword, newPassword);
            if (res.success) {
                toast.success('Password changed');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    const handleDeleteAccount = () => {
        localStorage.removeItem('auth-storage');
        logout();
        toast.success('Account data cleared');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <div className="max-w-xl mx-auto px-4 py-8">
                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6">
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>

                <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">My Profile</h1>

                {/* Avatar */}
                <div className="flex justify-center mb-6">
                    <div className="relative group">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold overflow-hidden">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                (user?.name?.[0] || 'U').toUpperCase()
                            )}
                        </div>
                        <label className={clsx("absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity", uploadingAvatar ? "opacity-100 cursor-wait" : "cursor-pointer")}>
                            {uploadingAvatar ? <Loader2 size={20} className="text-white animate-spin" /> : <Camera size={20} className="text-white" />}
                            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" aria-label="Upload avatar" disabled={uploadingAvatar} />
                        </label>
                    </div>
                </div>

                {/* Profile Info */}
                <form onSubmit={handleUpdateProfile} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <User size={18} className="text-blue-500" />
                        <h2 className="font-semibold text-slate-800 dark:text-white">Profile Information</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                            Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>

                {/* Travel Interests */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Heart size={18} className="text-pink-500" />
                        <h2 className="font-semibold text-slate-800 dark:text-white">Travel Interests</h2>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Select your interests to personalize recommendations</p>
                    <div className="flex flex-wrap gap-2">
                        {TRAVEL_INTERESTS.map(interest => (
                            <button
                                key={interest}
                                type="button"
                                onClick={() => toggleInterest(interest)}
                                className={clsx(
                                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                                    interests.includes(interest)
                                        ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border border-pink-300 dark:border-pink-700'
                                        : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 border border-transparent hover:border-gray-300 dark:hover:border-slate-500'
                                )}
                            >
                                {interest}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={handleSaveInterests}
                        disabled={savingInterests}
                        className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {savingInterests ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        {savingInterests ? 'Saving...' : 'Save Interests'}
                    </button>
                </div>

                {/* Change Password */}
                <form onSubmit={handleChangePassword} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Lock size={18} className="text-amber-500" />
                        <h2 className="font-semibold text-slate-800 dark:text-white">Change Password</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Current Password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                        className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {changingPassword ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                        {changingPassword ? 'Changing...' : 'Change Password'}
                    </button>
                </form>

                {/* Danger Zone */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-red-200 dark:border-red-900/40">
                    <div className="flex items-center gap-2 mb-4">
                        <Trash2 size={18} className="text-red-500" />
                        <h2 className="font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Once you delete your account, there is no going back. Please be certain.
                    </p>
                    {!showDeleteConfirm ? (
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            Delete Account
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900/30">
                                <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                                <p className="text-xs text-red-700 dark:text-red-400">
                                    Type <strong>DELETE</strong> below to confirm account deletion.
                                </p>
                            </div>
                            <input
                                type="text"
                                value={deleteText}
                                onChange={e => setDeleteText(e.target.value)}
                                placeholder="Type DELETE to confirm"
                                className="w-full px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 bg-gray-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                aria-label="Confirm deletion"
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleDeleteAccount}
                                    disabled={deleteText !== 'DELETE'}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Permanently Delete
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); }}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
