import { FC, useState, useEffect } from 'react';
import { getAppSettingsApi, updateAppSettingsApi } from '../../services/api';
import { Save, Loader, ToggleLeft, ToggleRight } from 'lucide-react';
import type { AppSettings } from './types';

const defaultSettings: AppSettings = {
    siteName: 'TripPlanner',
    maintenanceMode: false,
    registrationEnabled: true,
    maxTripsPerUser: 50,
    featuredPackageIds: [],
    defaultCurrency: 'INR',
    contactEmail: '',
    socialLinks: { twitter: '', instagram: '', facebook: '' }
};

const SettingsPanel: FC = () => {
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await getAppSettingsApi();
            if (res.success && res.settings) setSettings(res.settings);
        } catch (error) { console.error('Failed to fetch settings', error); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await updateAppSettingsApi(settings);
            if (res.success) {
                setMessage({ type: 'success', text: 'Settings saved successfully!' });
                setDirty(false);
            }
        } catch {
            setMessage({ type: 'error', text: 'Failed to save settings.' });
        } finally { setSaving(false); }
    };

    const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setDirty(true);
    };

    const updateSocial = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, [key]: value } }));
        setDirty(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader className="animate-spin w-8 h-8 text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">App Settings</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure global application settings</p>
                </div>
                <button onClick={handleSave} disabled={!dirty || saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                    {saving ? <Loader className="animate-spin" size={16} /> : <Save size={16} />} Save Changes
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'}`}>
                    {message.text}
                </div>
            )}

            {/* General */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 space-y-5">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-3">General</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Site Name</label>
                    <input type="text" value={settings.siteName} onChange={e => update('siteName', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Email</label>
                    <input type="email" value={settings.contactEmail} onChange={e => update('contactEmail', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Currency</label>
                        <select value={settings.defaultCurrency} onChange={e => update('defaultCurrency', e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg">
                            <option value="INR">INR (₹)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Trips Per User</label>
                        <input type="number" min={1} value={settings.maxTripsPerUser} onChange={e => update('maxTripsPerUser', +e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg" />
                    </div>
                </div>
            </div>

            {/* Toggles */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 space-y-5">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-3">Feature Toggles</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-slate-800 dark:text-white">Maintenance Mode</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">When enabled, users will see a maintenance page</p>
                    </div>
                    <button onClick={() => update('maintenanceMode', !settings.maintenanceMode)} className="text-slate-600 dark:text-slate-300">
                        {settings.maintenanceMode ? <ToggleRight size={36} className="text-red-500" /> : <ToggleLeft size={36} className="text-gray-400" />}
                    </button>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-slate-800 dark:text-white">User Registration</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Allow new users to register</p>
                    </div>
                    <button onClick={() => update('registrationEnabled', !settings.registrationEnabled)} className="text-slate-600 dark:text-slate-300">
                        {settings.registrationEnabled ? <ToggleRight size={36} className="text-green-500" /> : <ToggleLeft size={36} className="text-gray-400" />}
                    </button>
                </div>
            </div>

            {/* Social Links */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 space-y-5">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-3">Social Links</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Twitter</label>
                    <input type="url" value={settings.socialLinks?.twitter || ''} onChange={e => updateSocial('twitter', e.target.value)}
                        placeholder="https://twitter.com/..." className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instagram</label>
                    <input type="url" value={settings.socialLinks?.instagram || ''} onChange={e => updateSocial('instagram', e.target.value)}
                        placeholder="https://instagram.com/..." className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Facebook</label>
                    <input type="url" value={settings.socialLinks?.facebook || ''} onChange={e => updateSocial('facebook', e.target.value)}
                        placeholder="https://facebook.com/..." className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg" />
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
