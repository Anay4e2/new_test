import { create } from 'zustand';
import { DayItinerary } from '@/types';
import { validateItinerary } from '@/services/api';

const MAX_HISTORY = 30;
const MAX_VERSIONS = 20;

interface ItineraryVersion {
    timestamp: number;
    label: string;
    itinerary: DayItinerary[];
}

interface ItineraryEditStore {
    editableItinerary: DayItinerary[];
    originalItinerary: DayItinerary[];
    isEditMode: boolean;
    validationStatus: 'idle' | 'validating' | 'valid' | 'warning';
    validationMessage: string;

    // Undo/Redo
    undoStack: DayItinerary[][];
    redoStack: DayItinerary[][];
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;

    // Version history
    versions: ItineraryVersion[];
    saveVersion: (label: string) => void;
    restoreVersion: (index: number) => void;
    deleteVersion: (index: number) => void;

    enterEditMode: (itinerary: DayItinerary[]) => void;
    exitEditMode: () => DayItinerary[];
    discardEdits: () => void;

    reorderDays: (fromIndex: number, toIndex: number) => void;
    reorderActivities: (dayIndex: number, fromIndex: number, toIndex: number) => void;
    moveActivity: (fromDayIndex: number, toDayIndex: number, activityIndex: number) => void;
    removeActivity: (dayIndex: number, activityIndex: number) => void;
    replaceActivity: (dayIndex: number, activityIndex: number, newPlace: any) => void;
    addActivity: (dayIndex: number, activity: any) => void;
    updateActivityNotes: (dayIndex: number, activityIndex: number, notes: string) => void;

    runValidation: () => Promise<void>;
}

// Helper: push current state to undo stack before mutation
function pushUndo(get: () => ItineraryEditStore): { undoStack: DayItinerary[][]; redoStack: DayItinerary[][]; canUndo: boolean; canRedo: boolean } {
    const current = get().editableItinerary;
    const stack = [...get().undoStack, JSON.parse(JSON.stringify(current))];
    if (stack.length > MAX_HISTORY) stack.shift();
    return { undoStack: stack, redoStack: [], canUndo: true, canRedo: false };
}

export const useItineraryEditStore = create<ItineraryEditStore>((set, get) => ({
    editableItinerary: [],
    originalItinerary: [],
    isEditMode: false,
    validationStatus: 'idle',
    validationMessage: '',
    undoStack: [],
    redoStack: [],
    canUndo: false,
    canRedo: false,
    versions: [],

    saveVersion: (label) => {
        const versions = [...get().versions, {
            timestamp: Date.now(),
            label,
            itinerary: JSON.parse(JSON.stringify(get().editableItinerary)),
        }];
        if (versions.length > MAX_VERSIONS) versions.shift();
        set({ versions });
    },

    restoreVersion: (index) => {
        const version = get().versions[index];
        if (!version) return;
        const history = pushUndo(get);
        set({
            editableItinerary: JSON.parse(JSON.stringify(version.itinerary)),
            validationStatus: 'idle',
            ...history,
        });
    },

    deleteVersion: (index) => {
        const versions = [...get().versions];
        versions.splice(index, 1);
        set({ versions });
    },

    undo: () => {
        const { undoStack, editableItinerary } = get();
        if (undoStack.length === 0) return;
        const prev = undoStack[undoStack.length - 1];
        const newUndoStack = undoStack.slice(0, -1);
        set({
            editableItinerary: prev,
            undoStack: newUndoStack,
            redoStack: [...get().redoStack, JSON.parse(JSON.stringify(editableItinerary))],
            canUndo: newUndoStack.length > 0,
            canRedo: true,
            validationStatus: 'idle',
        });
    },

    redo: () => {
        const { redoStack, editableItinerary } = get();
        if (redoStack.length === 0) return;
        const next = redoStack[redoStack.length - 1];
        const newRedoStack = redoStack.slice(0, -1);
        set({
            editableItinerary: next,
            undoStack: [...get().undoStack, JSON.parse(JSON.stringify(editableItinerary))],
            redoStack: newRedoStack,
            canUndo: true,
            canRedo: newRedoStack.length > 0,
            validationStatus: 'idle',
        });
    },

    enterEditMode: (itinerary) => {
        set({
            editableItinerary: JSON.parse(JSON.stringify(itinerary)),
            originalItinerary: itinerary,
            isEditMode: true,
            validationStatus: 'idle',
            validationMessage: '',
            undoStack: [],
            redoStack: [],
            canUndo: false,
            canRedo: false,
            versions: [{
                timestamp: Date.now(),
                label: 'Original',
                itinerary: JSON.parse(JSON.stringify(itinerary)),
            }],
        });
    },

    exitEditMode: () => {
        const result = get().editableItinerary;
        set({ isEditMode: false, validationStatus: 'idle', validationMessage: '', undoStack: [], redoStack: [], canUndo: false, canRedo: false });
        return result;
    },

    discardEdits: () => {
        set({
            editableItinerary: [],
            originalItinerary: [],
            isEditMode: false,
            validationStatus: 'idle',
            validationMessage: '',
            undoStack: [],
            redoStack: [],
            canUndo: false,
            canRedo: false,
        });
    },

    reorderDays: (fromIndex, toIndex) => {
        const history = pushUndo(get);
        const days = [...get().editableItinerary];
        const [moved] = days.splice(fromIndex, 1);
        days.splice(toIndex, 0, moved);
        const renumbered = days.map((d, i) => ({ ...d, day: i + 1 }));
        set({ editableItinerary: renumbered, validationStatus: 'idle', ...history });
    },

    reorderActivities: (dayIndex, fromIndex, toIndex) => {
        const history = pushUndo(get);
        const days = [...get().editableItinerary];
        const day = { ...days[dayIndex] };
        const activities = [...day.activities];
        const [moved] = activities.splice(fromIndex, 1);
        activities.splice(toIndex, 0, moved);
        day.activities = activities;
        days[dayIndex] = day;
        set({ editableItinerary: days, validationStatus: 'idle', ...history });
    },

    moveActivity: (fromDayIndex, toDayIndex, activityIndex) => {
        const history = pushUndo(get);
        const days = [...get().editableItinerary];
        const fromDay = { ...days[fromDayIndex], activities: [...days[fromDayIndex].activities] };
        const toDay = { ...days[toDayIndex], activities: [...days[toDayIndex].activities] };
        const [activity] = fromDay.activities.splice(activityIndex, 1);
        toDay.activities.push(activity);
        days[fromDayIndex] = fromDay;
        days[toDayIndex] = toDay;
        set({ editableItinerary: days, validationStatus: 'idle', ...history });
    },

    removeActivity: (dayIndex, activityIndex) => {
        const history = pushUndo(get);
        const days = [...get().editableItinerary];
        const day = { ...days[dayIndex], activities: [...days[dayIndex].activities] };
        day.activities.splice(activityIndex, 1);
        days[dayIndex] = day;
        set({ editableItinerary: days, validationStatus: 'idle', ...history });
    },

    replaceActivity: (dayIndex, activityIndex, newPlace) => {
        const history = pushUndo(get);
        const days = [...get().editableItinerary];
        const day = { ...days[dayIndex], activities: [...days[dayIndex].activities] };
        day.activities[activityIndex] = newPlace;
        days[dayIndex] = day;
        set({ editableItinerary: days, validationStatus: 'idle', ...history });
    },

    addActivity: (dayIndex, activity) => {
        const history = pushUndo(get);
        const days = [...get().editableItinerary];
        if (!days[dayIndex]) return;

        const day = { ...days[dayIndex], activities: [...(days[dayIndex].activities || [])] };

        const newActivity = {
            ...activity,
            _id: activity._id || `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };

        day.activities.push(newActivity);
        days[dayIndex] = day;
        set({ editableItinerary: days, validationStatus: 'idle', ...history });
    },

    updateActivityNotes: (dayIndex, activityIndex, notes) => {
        const history = pushUndo(get);
        const days = [...get().editableItinerary];
        const day = { ...days[dayIndex], activities: [...days[dayIndex].activities] };
        day.activities[activityIndex] = { ...day.activities[activityIndex], notes };
        days[dayIndex] = day;
        set({ editableItinerary: days, ...history });
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
