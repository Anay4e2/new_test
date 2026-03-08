import { FC, useState, useEffect } from 'react';
import { getAllUsersAdminApi, deleteUserAdminApi, updateUserRoleApi } from '../../services/api';
import { Search, Trash2, Loader, Users, Download, Shield, ShieldOff, UserCircle, FileText } from 'lucide-react';
import { useDebounce } from '../../hooks';
import toast from 'react-hot-toast';
import ConfirmDialog from './ConfirmDialog';
import UserAuditReport from './UserAuditReport';
import type { AdminUser, Pagination } from './types';

type ActiveTab = 'users' | 'admins';

const UsersManager: FC = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('users');
    const [auditUserId, setAuditUserId] = useState<string | null>(null);

    // --- Users state ---
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [usersPagination, setUsersPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [usersSearch, setUsersSearch] = useState('');
    const debouncedUsersSearch = useDebounce(usersSearch, 300);

    // --- Admins state ---
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [adminsLoading, setAdminsLoading] = useState(true);
    const [adminsPagination, setAdminsPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [adminsSearch, setAdminsSearch] = useState('');
    const debouncedAdminsSearch = useDebounce(adminsSearch, 300);

    const [confirmState, setConfirmState] = useState<{
        open: boolean; title: string; message: string; confirmLabel: string;
        variant: 'danger' | 'warning'; onConfirm: () => void;
    }>({ open: false, title: '', message: '', confirmLabel: '', variant: 'danger', onConfirm: () => {} });

    // Fetch users (role=user)
    useEffect(() => {
        fetchUsers();
    }, [usersPagination.page, debouncedUsersSearch]);

    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            const res = await getAllUsersAdminApi({
                page: usersPagination.page,
                limit: usersPagination.limit,
                search: debouncedUsersSearch,
                role: 'user'
            });
            if (res.success) {
                setUsers(res.users);
                setUsersPagination(res.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch users', error);
            toast.error('Failed to load users');
        } finally {
            setUsersLoading(false);
        }
    };

    // Fetch admins (role=admin)
    useEffect(() => {
        fetchAdmins();
    }, [adminsPagination.page, debouncedAdminsSearch]);

    const fetchAdmins = async () => {
        setAdminsLoading(true);
        try {
            const res = await getAllUsersAdminApi({
                page: adminsPagination.page,
                limit: adminsPagination.limit,
                search: debouncedAdminsSearch,
                role: 'admin'
            });
            if (res.success) {
                setAdmins(res.users);
                setAdminsPagination(res.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch admins', error);
            toast.error('Failed to load admins');
        } finally {
            setAdminsLoading(false);
        }
    };

    const handleDelete = (user: AdminUser) => {
        setConfirmState({
            open: true,
            title: `Delete ${user.role === 'admin' ? 'Admin' : 'User'}`,
            message: `Permanently delete "${user.name}" (${user.email})? This cannot be undone.`,
            confirmLabel: 'Delete',
            variant: 'danger',
            onConfirm: async () => {
                setConfirmState(prev => ({ ...prev, open: false }));
                try {
                    await deleteUserAdminApi(user._id);
                    toast.success(`${user.role === 'admin' ? 'Admin' : 'User'} deleted`);
                    if (user.role === 'admin') fetchAdmins(); else fetchUsers();
                } catch (error: any) {
                    toast.error(error.response?.data?.message || 'Failed to delete');
                }
            },
        });
    };

    const handlePromoteToAdmin = (user: AdminUser) => {
        setConfirmState({
            open: true,
            title: 'Promote to Admin',
            message: `Make "${user.name}" (${user.email}) an admin? They will have full admin privileges.`,
            confirmLabel: 'Promote',
            variant: 'warning',
            onConfirm: async () => {
                setConfirmState(prev => ({ ...prev, open: false }));
                try {
                    await updateUserRoleApi(user._id, 'admin');
                    toast.success(`${user.name} promoted to admin`);
                    fetchUsers();
                    fetchAdmins();
                } catch (error: any) {
                    toast.error(error.response?.data?.message || 'Failed to update role');
                }
            },
        });
    };

    const handleDemoteToUser = (admin: AdminUser) => {
        setConfirmState({
            open: true,
            title: 'Demote to User',
            message: `Remove admin privileges from "${admin.name}" (${admin.email})?`,
            confirmLabel: 'Demote',
            variant: 'warning',
            onConfirm: async () => {
                setConfirmState(prev => ({ ...prev, open: false }));
                try {
                    await updateUserRoleApi(admin._id, 'user');
                    toast.success(`${admin.name} demoted to user`);
                    fetchUsers();
                    fetchAdmins();
                } catch (error: any) {
                    toast.error(error.response?.data?.message || 'Failed to update role');
                }
            },
        });
    };

    const exportCSV = (data: AdminUser[], filename: string) => {
        if (data.length === 0) return;
        const headers = ['Name', 'Email', 'Role', 'Provider', 'Joined'];
        const rows = data.map(u => [
            u.name, u.email, u.role, u.provider || 'local',
            new Date(u.createdAt).toLocaleDateString()
        ]);
        const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Exported to CSV');
    };

    return (
        <div className="space-y-6">
            {/* User Audit Report View */}
            {auditUserId ? (
                <UserAuditReport userId={auditUserId} onBack={() => setAuditUserId(null)} />
            ) : (
            <>
            {/* Tabs */}
            <div className="flex gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'users'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                >
                    <UserCircle size={16} />
                    Users
                    {!usersLoading && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}>
                            {usersPagination.total}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('admins')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'admins'
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                >
                    <Shield size={16} />
                    Admins
                    {!adminsLoading && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            activeTab === 'admins' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}>
                            {adminsPagination.total}
                        </span>
                    )}
                </button>
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex flex-wrap gap-4 items-center">
                        <div className="flex-1 relative min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search users by name or email..."
                                value={usersSearch}
                                onChange={(e) => { setUsersSearch(e.target.value); setUsersPagination(prev => ({ ...prev, page: 1 })); }}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            onClick={() => exportCSV(users, 'users_export.csv')}
                            disabled={users.length === 0}
                            className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <Download size={16} /> Export
                        </button>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4">Provider</th>
                                        <th className="px-6 py-4">Joined</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {usersLoading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center">
                                                <Loader className="animate-spin w-6 h-6 mx-auto text-blue-500" />
                                            </td>
                                        </tr>
                                    ) : users.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center">
                                                <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                                <p className="text-gray-500 font-medium">No users found</p>
                                                <p className="text-gray-400 text-sm mt-1">Try adjusting your search</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((u) => (
                                            <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                                                            {u.name?.[0]?.toUpperCase() || '?'}
                                                        </div>
                                                        <span className="font-medium text-slate-800 dark:text-white">{u.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-sm">{u.email}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 capitalize">{u.provider || 'local'}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {new Date(u.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => setAuditUserId(u._id)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                            title="View audit report"
                                                        >
                                                            <FileText size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handlePromoteToAdmin(u)}
                                                            className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                                            title="Promote to admin"
                                                        >
                                                            <Shield size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(u)}
                                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            title="Delete user"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {!usersLoading && users.length > 0 && (
                            <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
                                <button
                                    disabled={usersPagination.page === 1}
                                    onClick={() => setUsersPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                    className="px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-500">
                                    Page {usersPagination.page} of {usersPagination.totalPages} ({usersPagination.total} users)
                                </span>
                                <button
                                    disabled={usersPagination.page === usersPagination.totalPages}
                                    onClick={() => setUsersPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    className="px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Admins Tab */}
            {activeTab === 'admins' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex flex-wrap gap-4 items-center">
                        <div className="flex-1 relative min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search admins by name or email..."
                                value={adminsSearch}
                                onChange={(e) => { setAdminsSearch(e.target.value); setAdminsPagination(prev => ({ ...prev, page: 1 })); }}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <button
                            onClick={() => exportCSV(admins, 'admins_export.csv')}
                            disabled={admins.length === 0}
                            className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <Download size={16} /> Export
                        </button>
                    </div>

                    {/* Admins Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Admin</th>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4">Provider</th>
                                        <th className="px-6 py-4">Since</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {adminsLoading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center">
                                                <Loader className="animate-spin w-6 h-6 mx-auto text-purple-500" />
                                            </td>
                                        </tr>
                                    ) : admins.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center">
                                                <Shield className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                                <p className="text-gray-500 font-medium">No admins found</p>
                                                <p className="text-gray-400 text-sm mt-1">Try adjusting your search</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        admins.map((a) => (
                                            <tr key={a._id} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-sm font-bold">
                                                            {a.name?.[0]?.toUpperCase() || '?'}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-slate-800 dark:text-white">{a.name}</span>
                                                            <div className="flex items-center gap-1 mt-0.5">
                                                                <Shield size={10} className="text-purple-500" />
                                                                <span className="text-[10px] font-semibold text-purple-500">ADMIN</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-sm">{a.email}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 capitalize">{a.provider || 'local'}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {new Date(a.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => setAuditUserId(a._id)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                            title="View audit report"
                                                        >
                                                            <FileText size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDemoteToUser(a)}
                                                            className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                                                            title="Demote to user"
                                                        >
                                                            <ShieldOff size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(a)}
                                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            title="Delete admin"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {!adminsLoading && admins.length > 0 && (
                            <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
                                <button
                                    disabled={adminsPagination.page === 1}
                                    onClick={() => setAdminsPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                    className="px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-500">
                                    Page {adminsPagination.page} of {adminsPagination.totalPages} ({adminsPagination.total} admins)
                                </span>
                                <button
                                    disabled={adminsPagination.page === adminsPagination.totalPages}
                                    onClick={() => setAdminsPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    className="px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={confirmState.open}
                title={confirmState.title}
                message={confirmState.message}
                confirmLabel={confirmState.confirmLabel}
                variant={confirmState.variant}
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState(prev => ({ ...prev, open: false }))}
            />
            </>
            )}
        </div>
    );
};

export default UsersManager;
