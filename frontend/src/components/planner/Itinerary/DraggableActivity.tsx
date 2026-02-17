import { FC, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, RefreshCw } from 'lucide-react';
import { Heart } from 'lucide-react';
import clsx from 'clsx';

interface DraggableActivityProps {
    id: string;
    activity: any;
    isEditMode: boolean;
    isFavorite: boolean;
    alternatives: any[];
    onRemove: () => void;
    onReplace: (newPlace: any) => void;
    onToggleFavorite: () => void;
}

export const DraggableActivity: FC<DraggableActivityProps> = ({
    id,
    activity,
    isEditMode,
    isFavorite,
    alternatives,
    onRemove,
    onReplace,
    onToggleFavorite,
}) => {
    const [showReplace, setShowReplace] = useState(false);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled: !isEditMode });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={clsx(
                'flex gap-4 bg-white dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-all relative group/act',
                isDragging && 'opacity-50 z-50 shadow-lg scale-[1.02]'
            )}
        >
            {/* Drag Handle */}
            {isEditMode && (
                <button
                    {...attributes}
                    {...listeners}
                    className="absolute -left-3 top-1/2 -translate-y-1/2 p-0.5 rounded bg-gray-100 dark:bg-slate-600 text-gray-400 hover:text-primary cursor-grab active:cursor-grabbing transition-colors opacity-0 group-hover/act:opacity-100 z-10"
                    title="Drag to reorder"
                >
                    <GripVertical size={14} />
                </button>
            )}

            {/* Image */}
            <div className="w-16 h-16 rounded-lg bg-gray-200 shrink-0 overflow-hidden shadow-sm">
                <img
                    src={activity.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(activity.name)}/100/100`}
                    alt={activity.name}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="font-bold text-text dark:text-white text-lg">{activity.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1 uppercase tracking-wide font-medium">
                    <span className="text-accent">{activity.type}</span> • <span>{activity.timeRequired}h</span> • <span>{activity.bestTimeOfDay}</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-start gap-1 shrink-0">
                {isEditMode && (
                    <>
                        {/* Replace Button */}
                        <div className="relative">
                            <button
                                onClick={() => setShowReplace(!showReplace)}
                                className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors text-blue-500"
                                title="Replace activity"
                            >
                                <RefreshCw size={14} />
                            </button>

                            {/* Replace Dropdown */}
                            {showReplace && alternatives.length > 0 && (
                                <div className="absolute right-0 top-8 z-50 w-56 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-xl p-2 space-y-1">
                                    <div className="text-xs font-bold text-gray-500 dark:text-gray-400 px-2 py-1 uppercase tracking-wider">Replace with</div>
                                    {alternatives.map((alt: any, i: number) => (
                                        <button
                                            key={alt._id || i}
                                            onClick={() => { onReplace(alt); setShowReplace(false); }}
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-sm transition-colors"
                                        >
                                            <div className="font-medium text-gray-800 dark:text-gray-200 truncate">{alt.name}</div>
                                            <div className="text-xs text-gray-400">{alt.type} • {alt.timeRequired}h</div>
                                        </button>
                                    ))}
                                    {alternatives.length === 0 && (
                                        <div className="text-xs text-gray-400 px-2 py-2">No alternatives available</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Remove Button */}
                        <button
                            onClick={onRemove}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors text-red-400 hover:text-red-600"
                            title="Remove activity"
                        >
                            <X size={14} />
                        </button>
                    </>
                )}

                {/* Favorite Button */}
                <button
                    onClick={onToggleFavorite}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-full transition-colors shrink-0"
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                    <Heart size={16} className={clsx(
                        isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-300 dark:text-gray-500'
                    )} />
                </button>
            </div>

            {/* Close replace dropdown when clicking outside */}
            {showReplace && (
                <div className="fixed inset-0 z-40" onClick={() => setShowReplace(false)} />
            )}
        </div>
    );
};
