import { FC, useState } from 'react';
import { Star } from 'lucide-react';
import clsx from 'clsx';

interface StarRatingProps {
    rating: number;
    maxStars?: number;
    size?: number;
    showValue?: boolean;
    reviewCount?: number;
    interactive?: boolean;
    onChange?: (rating: number) => void;
    className?: string;
}

export const StarRating: FC<StarRatingProps> = ({
    rating,
    maxStars = 5,
    size = 18,
    showValue = false,
    reviewCount,
    interactive = false,
    onChange,
    className = '',
}) => {
    const [hoverRating, setHoverRating] = useState(0);

    const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

    const renderStar = (index: number) => {
        const starNumber = index + 1;
        const fillPercentage = Math.min(1, Math.max(0, displayRating - index));
        const isFull = fillPercentage >= 0.75;
        const isEmpty = fillPercentage < 0.25;

        return (
            <span
                key={index}
                className={clsx(
                    'relative inline-block',
                    interactive && 'cursor-pointer transition-transform hover:scale-110'
                )}
                style={{ width: size, height: size }}
                onClick={() => interactive && onChange?.(starNumber)}
                onMouseEnter={() => interactive && setHoverRating(starNumber)}
                onMouseLeave={() => interactive && setHoverRating(0)}
            >
                {/* Background (empty) star */}
                <Star
                    size={size}
                    className="text-gray-300 dark:text-gray-600"
                    strokeWidth={1.5}
                />

                {/* Filled overlay */}
                {!isEmpty && (
                    <span
                        className="absolute top-0 left-0 overflow-hidden"
                        style={{ width: isFull ? '100%' : '50%' }}
                    >
                        <Star
                            size={size}
                            className="text-amber-400 fill-amber-400"
                            strokeWidth={1.5}
                        />
                    </span>
                )}
            </span>
        );
    };

    return (
        <div className={clsx('flex items-center gap-1', className)}>
            <div className="flex items-center gap-0.5">
                {Array.from({ length: maxStars }, (_, i) => renderStar(i))}
            </div>
            {showValue && (
                <span className="ml-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {rating.toFixed(1)}
                </span>
            )}
            {reviewCount !== undefined && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                </span>
            )}
        </div>
    );
};
