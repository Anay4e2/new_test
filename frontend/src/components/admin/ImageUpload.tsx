import { FC, useRef, useState } from 'react';
import { Upload, X, Link as LinkIcon } from 'lucide-react';
import { uploadImageApi } from '../../services/api';
import toast from 'react-hot-toast';

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
}

const ImageUpload: FC<ImageUploadProps> = ({ value, onChange, label = 'Image' }) => {
    const [mode, setMode] = useState<'url' | 'upload'>('url');
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }
        if (file.size > 7 * 1024 * 1024) {
            toast.error('Image must be under 7MB');
            return;
        }

        setUploading(true);
        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = reader.result as string;
            try {
                const res = await uploadImageApi(base64);
                if (res.success) {
                    onChange(res.imageUrl);
                } else {
                    onChange(base64);
                }
            } catch {
                // Fallback: use base64 directly for MVP
                onChange(base64);
            } finally {
                setUploading(false);
            }
        };
        reader.onerror = () => {
            setUploading(false);
            toast.error('Failed to read image file');
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
                <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-0.5">
                    <button
                        type="button"
                        onClick={() => setMode('url')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${mode === 'url' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-gray-500'}`}
                    >
                        <LinkIcon size={12} className="inline mr-1" />URL
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('upload')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${mode === 'upload' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-gray-500'}`}
                    >
                        <Upload size={12} className="inline mr-1" />Upload
                    </button>
                </div>
            </div>

            <div className="flex gap-3 items-start">
                {/* Preview */}
                <div className="w-24 h-20 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 dark:border-slate-600">
                    {value ? (
                        <img src={value} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Upload size={20} />
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    {mode === 'url' ? (
                        <input
                            type="text"
                            value={value.startsWith('data:') ? '' : value}
                            onChange={e => onChange(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    ) : (
                        <div>
                            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                disabled={uploading}
                                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50"
                            >
                                {uploading ? 'Uploading...' : 'Click to select image (max 5MB)'}
                            </button>
                        </div>
                    )}

                    {value && (
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="mt-1 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                            <X size={12} /> Remove image
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageUpload;
