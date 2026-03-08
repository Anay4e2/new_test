import { FC, useState } from 'react';
import { Save, Loader2, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveTrip, publishTripApi } from '@/services/api';
import { TripRequest, TripResult } from '@/types';
import toast from 'react-hot-toast';

interface SaveTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  request?: TripRequest;
  result: TripResult;
}

const TAG_OPTIONS = ['Solo', 'Family', 'Adventure', 'Culture', 'Food Lover', 'Budget', 'Luxury', 'Weekend', 'Pilgrimage'];

export const SaveTripModal: FC<SaveTripModalProps> = ({ isOpen, onClose, request, result }) => {
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [publishToFeed, setPublishToFeed] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await saveTrip(title.trim(), request || {}, result);
      if (res.success) {
        if (publishToFeed && res.trip?._id) {
          try {
            await publishTripApi(res.trip._id, { isPublic: true, tags: selectedTags });
            toast.success('Trip saved & published to community!');
          } catch {
            toast.success('Trip saved! (Publishing failed – you can publish from Dashboard.)');
          }
        } else {
          toast.success('Trip saved!');
        }
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setTitle('');
          setPublishToFeed(false);
          setSelectedTags([]);
        }, 1500);
      }
    } catch {
      toast.error('Failed to save trip. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => !saving && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6"
          >
            {success ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Save size={24} className="text-green-600" />
                </div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Trip Saved!</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View it in your Dashboard.</p>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Save This Trip</h3>
                <input
                  type="text"
                  placeholder="e.g. Rajasthan Family Trip 2026"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  autoFocus
                />

                {/* Publish to Community toggle */}
                <button
                  type="button"
                  onClick={() => setPublishToFeed(!publishToFeed)}
                  className={`mt-3 w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm transition-all ${
                    publishToFeed
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <Globe size={16} />
                  <span className="flex-1 text-left">Publish to Community</span>
                  <div className={`w-9 h-5 rounded-full transition-colors ${publishToFeed ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mt-0.5 ${publishToFeed ? 'translate-x-4.5 ml-[18px]' : 'ml-0.5'}`} />
                  </div>
                </button>

                {publishToFeed && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {TAG_OPTIONS.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                          selectedTags.includes(tag)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-700 text-gray-500 border-gray-200 dark:border-slate-600'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 mt-5 justify-end">
                  <button
                    onClick={onClose}
                    disabled={saving}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !title.trim()}
                    className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    Save Trip
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
