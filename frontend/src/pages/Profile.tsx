import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { updateProfileApi, changePasswordApi } from '@/services/api';
import { ArrowLeft, User, Lock, Loader2, Check } from 'lucide-react';

export const Profile: FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [saving, setSaving] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) navigate('/login');
    }, []);

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <div className="max-w-xl mx-auto px-4 py-8">
                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6">
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>

                <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">My Profile</h1>

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

                {/* Change Password */}
                <form onSubmit={handleChangePassword} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
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
            </div>
        </div>
    );
};
