import { FC, useRef, useState } from 'react';
import { Upload, X, Link as LinkIcon, FileText, Film, Image as ImageIcon } from 'lucide-react';
import { uploadFileApi, uploadFileAdminApi } from '../../services/api';
import toast from 'react-hot-toast';

type AcceptType = 'image' | 'video' | 'pdf' | 'all';

const ACCEPT_MAP: Record<AcceptType, string> = {
    image: 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml',
    video: 'video/mp4,video/webm,video/quicktime',
    pdf: 'application/pdf',
    all: 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml,video/mp4,video/webm,video/quicktime,application/pdf',
};

const SIZE_LIMITS: Record<AcceptType, number> = {
    image: 10 * 1024 * 1024,   // 10MB
    video: 50 * 1024 * 1024,   // 50MB
    pdf: 20 * 1024 * 1024,     // 20MB
    all: 50 * 1024 * 1024,     // 50MB
};

const SIZE_LABELS: Record<AcceptType, string> = {
    image: '10MB',
    video: '50MB',
    pdf: '20MB',
    all: '50MB',
};

interface FileUploadProps {
    /** Current file URL */
    value: string;
    /** Called with the uploaded file URL */
    onChange: (url: string) => void;
    label?: string;
    /** Which file types to accept */
    accept?: AcceptType;
    /** Optional folder for cloud storage */
    folder?: string;
    /** Use admin upload endpoint */
    admin?: boolean;
    /** Show URL input toggle */
    showUrlInput?: boolean;
}

function getPreviewType(url: string, mimeHint?: string): 'image' | 'video' | 'pdf' | 'unknown' {
    if (!url) return 'unknown';
    const lower = url.toLowerCase();
    if (mimeHint?.startsWith('video/') || lower.match(/\.(mp4|webm|mov)(\?|$)/)) return 'video';
    if (mimeHint === 'application/pdf' || lower.match(/\.pdf(\?|$)/)) return 'pdf';
    if (mimeHint?.startsWith('image/') || lower.startsWith('data:image/') || lower.match(/\.(png|jpe?g|gif|webp|svg)(\?|$)/)) return 'image';
    return 'unknown';
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

const FileUpload: FC<FileUploadProps> = ({
    value,
    onChange,
    label = 'File',
    accept = 'all',
    folder,
    admin = false,
    showUrlInput = true,
}) => {
    const [mode, setMode] = useState<'url' | 'upload'>(showUrlInput ? 'url' : 'upload');
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const limit = SIZE_LIMITS[accept];
        if (file.size > limit) {
            toast.error(`File must be under ${SIZE_LABELS[accept]}`);
            return;
        }

        setUploading(true);
        setProgress(`Uploading ${formatSize(file.size)}...`);

        try {
            const uploadFn = admin ? uploadFileAdminApi : uploadFileApi;
            const res = await uploadFn(file, folder);
            if (res.success) {
                onChange(res.url);
                toast.success('File uploaded!');
            } else {
                toast.error('Upload failed');
            }
        } catch {
            toast.error('Upload failed. Please try again.');
        } finally {
            setUploading(false);
            setProgress('');
            // Reset input so same file can be re-selected
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const previewType = getPreviewType(value);

    const typeLabel = accept === 'all'
        ? 'image, video, or PDF'
        : accept === 'image' ? 'image' : accept === 'video' ? 'video' : 'PDF';

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
                {showUrlInput && (
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
                )}
            </div>

            <div className="flex gap-3 items-start">
                {/* Preview */}
                <div className="w-24 h-20 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 dark:border-slate-600 flex items-center justify-center">
                    {value && previewType === 'image' ? (
                        <img src={value} alt="Preview" className="w-full h-full object-cover" />
                    ) : value && previewType === 'video' ? (
                        <Film size={28} className="text-purple-400" />
                    ) : value && previewType === 'pdf' ? (
                        <FileText size={28} className="text-red-400" />
                    ) : value ? (
                        <ImageIcon size={28} className="text-blue-400" />
                    ) : (
                        <Upload size={20} className="text-gray-400" />
                    )}
                </div>

                <div className="flex-1">
                    {mode === 'url' ? (
                        <input
                            type="text"
                            value={value.startsWith('data:') ? '' : value}
                            onChange={e => onChange(e.target.value)}
                            placeholder="https://example.com/file.jpg"
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    ) : (
                        <div>
                            <input
                                ref={fileRef}
                                type="file"
                                accept={ACCEPT_MAP[accept]}
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                disabled={uploading}
                                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50"
                            >
                                {uploading ? progress || 'Uploading...' : `Click to select ${typeLabel} (max ${SIZE_LABELS[accept]})`}
                            </button>
                        </div>
                    )}

                    {value && (
                        <div className="mt-1 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => onChange('')}
                                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                            >
                                <X size={12} /> Remove
                            </button>
                            {value && !value.startsWith('data:') && (
                                <a
                                    href={value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-500 hover:text-blue-700"
                                >
                                    View file ↗
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FileUpload;
