import { FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, MapPin } from 'lucide-react';
import { StandaloneSearchBox, useJsApiLoader } from '@react-google-maps/api';
import clsx from 'clsx';

interface AddActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (activity: any) => void;
    dayNumber?: number;
    cityCoordinates?: { lat: number; lng: number };
}

export const AddActivityModal: FC<AddActivityModalProps> = ({ isOpen, onClose, onAdd, dayNumber, cityCoordinates }) => {
    const [activeTab, setActiveTab] = useState<'search' | 'custom'>('search');

    // --- Google Maps Loader ---
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries: ['places']
    });

    const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // Custom Activity Form State
    const [customActivity, setCustomActivity] = useState({
        name: '',
        type: 'Sightseeing',
        timeRequired: 2,
        cost: 0,
        description: '',
        visitDuration: '2 hours',
        bestTimeOfDay: 'Anytime'
    });

    const onLoad = (ref: google.maps.places.SearchBox) => setSearchBox(ref);

    const onPlacesChanged = () => {
        if (searchBox) {
            const places = searchBox.getPlaces();
            if (places) {
                const formattedPlaces = places.map(place => ({
                    _id: place.place_id,
                    name: place.name,
                    cityName: '', // Inferred contextually if needed
                    type: place.types?.[0] || 'Point of Interest',
                    coordinates: {
                        lat: place.geometry?.location?.lat(),
                        lng: place.geometry?.location?.lng()
                    },
                    description: place.formatted_address,
                    rating: place.rating,
                    thumbnailUrl: place.photos?.[0]?.getUrl(),
                    timeRequired: 2, // Default
                    visitDuration: '2 hours',
                    bestTimeOfDay: 'Day'
                }));
                setSearchResults(formattedPlaces);
            }
        }
    };

    const handleAddSearchResult = (place: any) => {
        onAdd(place);
        onClose();
    };

    const handleAddCustom = () => {
        if (!customActivity.name) return;
        onAdd({
            ...customActivity,
            _id: `custom-${Date.now()}`,
            cityName: 'Custom Location',
            coordinates: cityCoordinates || { lat: 0, lng: 0 }
        });
        onClose();
        // Reset form
        setCustomActivity({
            name: '',
            type: 'Sightseeing',
            timeRequired: 2,
            cost: 0,
            description: '',
            visitDuration: '2 hours',
            bestTimeOfDay: 'Anytime'
        });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[5000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[80vh]"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Add Activity</h2>
                            {dayNumber && <p className="text-sm text-gray-500 dark:text-gray-400">to Day {dayNumber}</p>}
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-100 dark:border-slate-700">
                        <button
                            onClick={() => setActiveTab('search')}
                            className={clsx(
                                'flex-1 py-3 text-sm font-medium transition-colors relative',
                                activeTab === 'search' ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-slate-700'
                            )}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Search size={16} />
                                <span>Search Places</span>
                            </div>
                            {activeTab === 'search' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('custom')}
                            className={clsx(
                                'flex-1 py-3 text-sm font-medium transition-colors relative',
                                activeTab === 'custom' ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-slate-700'
                            )}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Plus size={16} />
                                <span>Custom Activity</span>
                            </div>
                            {activeTab === 'custom' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {activeTab === 'search' ? (
                            <div className="space-y-4">
                                {isLoaded ? (
                                    <StandaloneSearchBox onLoad={onLoad} onPlacesChanged={onPlacesChanged}>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Search for places (e.g. Red Fort, Cafe...)"
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white"
                                            />
                                        </div>
                                    </StandaloneSearchBox>
                                ) : (
                                    <div className="text-center py-4 text-gray-500">Loading Maps...</div>
                                )}

                                <div className="space-y-2">
                                    {searchResults.map((place) => (
                                        <button
                                            key={place._id}
                                            onClick={() => handleAddSearchResult(place)}
                                            className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-slate-600 transition-all group"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-slate-600 shrink-0 overflow-hidden">
                                                    {place.thumbnailUrl ? (
                                                        <img src={place.thumbnailUrl} alt={place.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <MapPin size={18} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">
                                                        {place.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {place.description}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                                                        <span>{place.type}</span>
                                                        {place.rating && <span>• ⭐ {place.rating}</span>}
                                                    </div>
                                                </div>
                                                <div className="self-center">
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Plus size={18} />
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                    {searchResults.length === 0 && searchBox && (
                                        <div className="text-center py-8 text-gray-400">
                                            <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                                            <p>Search for a place to add it to your itinerary</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Activity Name</label>
                                    <input
                                        type="text"
                                        value={customActivity.name}
                                        onChange={e => setCustomActivity({ ...customActivity, name: e.target.value })}
                                        placeholder="e.g. Visit Local Market"
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:border-blue-500 transition-colors"
                                        autoFocus
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Type</label>
                                        <select
                                            value={customActivity.type}
                                            onChange={e => setCustomActivity({ ...customActivity, type: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:border-blue-500 transition-colors"
                                        >
                                            <option>Sightseeing</option>
                                            <option>Food</option>
                                            <option>Shopping</option>
                                            <option>Relaxation</option>
                                            <option>Adventure</option>
                                            <option>Travel</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Cost (₹)</label>
                                        <input
                                            type="number"
                                            value={customActivity.cost}
                                            onChange={e => setCustomActivity({ ...customActivity, cost: Number(e.target.value) })}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Duration (hrs)</label>
                                        <input
                                            type="number"
                                            value={customActivity.timeRequired}
                                            onChange={e => setCustomActivity({ ...customActivity, timeRequired: Number(e.target.value), visitDuration: `${e.target.value} hours` })}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Best Time</label>
                                        <select
                                            value={customActivity.bestTimeOfDay}
                                            onChange={e => setCustomActivity({ ...customActivity, bestTimeOfDay: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:border-blue-500 transition-colors"
                                        >
                                            <option>Morning</option>
                                            <option>Afternoon</option>
                                            <option>Evening</option>
                                            <option>Night</option>
                                            <option>Anytime</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Description (Optional)</label>
                                    <textarea
                                        value={customActivity.description}
                                        onChange={e => setCustomActivity({ ...customActivity, description: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:border-blue-500 transition-colors min-h-[80px]"
                                        placeholder="Add notes..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        {activeTab === 'custom' && (
                            <button
                                onClick={handleAddCustom}
                                disabled={!customActivity.name}
                                className="px-6 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add Activity
                            </button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
