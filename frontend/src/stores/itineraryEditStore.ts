import { create } from 'zustand';
import { DayItinerary } from '@/types';
import { validateItinerary } from '@/services/api';

interface ItineraryEditStore {
    editableItinerary: DayItinerary[];
    originalItinerary: DayItinerary[];
    isEditMode: boolean;
    validationStatus: 'idle' | 'validating' | 'valid' | 'warning';
    validationMessage: string;

    enterEditMode: (itinerary: DayItinerary[]) => void;
    exitEditMode: () => DayItinerary[];
    discardEdits: () => void;

    reorderDays: (fromIndex: number, toIndex: number) => void;
    reorderActivities: (dayIndex: number, fromIndex: number, toIndex: number) => void;
    moveActivity: (fromDayIndex: number, toDayIndex: number, activityIndex: number) => void;
    removeActivity: (dayIndex: number, activityIndex: number) => void;
    replaceActivity: (dayIndex: number, activityIndex: number, newPlace: any) => void;

    runValidation: () => Promise<void>;
}

export const useItineraryEditStore = create<ItineraryEditStore>((set, get) => ({
    editableItinerary: [],
    originalItinerary: [],
    isEditMode: false,
    validationStatus: 'idle',
    validationMessage: '',

    enterEditMode: (itinerary) => {
        set({
            editableItinerary: JSON.parse(JSON.stringify(itinerary)), // deep clone
            originalItinerary: itinerary,
            isEditMode: true,
            validationStatus: 'idle',
            validationMessage: '',
        });
    },

    exitEditMode: () => {
        const result = get().editableItinerary;
        set({ isEditMode: false, validationStatus: 'idle', validationMessage: '' });
        return result;
    },

    discardEdits: () => {
        set({
            editableItinerary: [],
            originalItinerary: [],
            isEditMode: false,
            validationStatus: 'idle',
            validationMessage: '',
        });
    },

    reorderDays: (fromIndex, toIndex) => {
        const days = [...get().editableItinerary];
        const [moved] = days.splice(fromIndex, 1);
        days.splice(toIndex, 0, moved);
        // Re-number days
        const renumbered = days.map((d, i) => ({ ...d, day: i + 1 }));
        set({ editableItinerary: renumbered, validationStatus: 'idle' });
    },

    reorderActivities: (dayIndex, fromIndex, toIndex) => {
        const days = [...get().editableItinerary];
        const day = { ...days[dayIndex] };
        const activities = [...day.activities];
        const [moved] = activities.splice(fromIndex, 1);
        activities.splice(toIndex, 0, moved);
        day.activities = activities;
        days[dayIndex] = day;
        set({ editableItinerary: days, validationStatus: 'idle' });
    },

    moveActivity: (fromDayIndex, toDayIndex, activityIndex) => {
        const days = [...get().editableItinerary];
        const fromDay = { ...days[fromDayIndex], activities: [...days[fromDayIndex].activities] };
        const toDay = { ...days[toDayIndex], activities: [...days[toDayIndex].activities] };
        const [activity] = fromDay.activities.splice(activityIndex, 1);
        toDay.activities.push(activity);
        days[fromDayIndex] = fromDay;
        days[toDayIndex] = toDay;
        set({ editableItinerary: days, validationStatus: 'idle' });
    },

    removeActivity: (dayIndex, activityIndex) => {
        const days = [...get().editableItinerary];
        const day = { ...days[dayIndex], activities: [...days[dayIndex].activities] };
        day.activities.splice(activityIndex, 1);
        days[dayIndex] = day;
        set({ editableItinerary: days, validationStatus: 'idle' });
    },

    replaceActivity: (dayIndex, activityIndex, newPlace) => {
        const days = [...get().editableItinerary];
        const day = { ...days[dayIndex], activities: [...days[dayIndex].activities] };
        day.activities[activityIndex] = newPlace;
        days[dayIndex] = day;
        set({ editableItinerary: days, validationStatus: 'idle' });
    },

    runValidation: async () => {
        set({ validationStatus: 'validating' });
        try {
            const result = await validateItinerary(get().editableItinerary);
            const feasibility = result.summary?.feasibility || 'comfortable';
            set({
                editableItinerary: result.itinerary,
                validationStatus: feasibility === 'comfortable' ? 'valid' : 'warning',
                validationMessage: feasibility === 'comfortable'
                    ? 'Itinerary looks good!'
                    : feasibility === 'tight'
                        ? 'Schedule is tight — consider removing activities or adding days.'
                        : 'Not recommended — too many activities or long travel times.',
            });
        } catch {
            set({ validationStatus: 'warning', validationMessage: 'Validation failed. Changes may affect feasibility.' });
        }
    },
}));
