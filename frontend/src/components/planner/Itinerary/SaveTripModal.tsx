import { FC, useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveTrip } from '@/services/api';
import { TripRequest, TripResult } from '@/types';

interface SaveTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  request?: TripRequest;
  result: TripResult;
}

export const SaveTripModal: FC<SaveTripModalProps> = ({ isOpen, onClose, request, result }) => {
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await saveTrip(title.trim(), request || {}, result);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setTitle('');
        }, 1500);
      }
    } catch {
      alert('Failed to save trip. Please try again.');
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
