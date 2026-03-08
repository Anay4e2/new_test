import { FC } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import clsx from 'clsx';

interface DraggableDayCardProps {
    id: string;
    dayNumber: number;
    isEditMode: boolean;
    children: React.ReactNode;
}

export const DraggableDayCard: FC<DraggableDayCardProps> = ({ id, dayNumber, isEditMode, children }) => {
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
            data-print-day={dayNumber}
            className={clsx(
                'relative pl-8 border-l-2 border-primary/30 pb-8 last:border-0 last:pb-0',
                isDragging && 'opacity-50 z-50 scale-[1.02]',
                isEditMode && 'group/day'
            )}
        >
            {/* Day Marker */}
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-2 border-white shadow-md" />

            {/* Drag Handle - always visible on mobile for discoverability */}
            {isEditMode && (
                <button
                    {...attributes}
                    {...listeners}
                    className="absolute -left-10 top-0 p-1.5 md:p-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary cursor-grab active:cursor-grabbing transition-colors md:opacity-0 md:group-hover/day:opacity-100 touch-none"
                    title={`Drag to reorder Day ${dayNumber}`}
                >
                    <GripVertical size={22} className="md:hidden" />
                    <GripVertical size={18} className="hidden md:block" />
                </button>
            )}

            {children}
        </div>
    );
};
