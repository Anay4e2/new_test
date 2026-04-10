import { FC, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { TripResult, TripRequest, MealRecommendation, Restaurant } from '@/types';
import { ArrowLeft, Loader2, Save, Heart, AlertTriangle, Pencil, Check, Download, Plus, X, Undo2, Redo2, History, ChevronDown, ChevronUp, Copy, MapPin, Clock, MoreHorizontal, Calendar } from 'lucide-react';
import { ExportButtons } from './ExportButtons';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { getRestaurantsByCity, toggleFavoritePlace, getMyFavorites } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { ShareButton } from './ShareButton';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggableDayCard } from './DraggableDayCard';
import { DraggableActivity } from './DraggableActivity';
import { useItineraryEditStore } from '@/stores/itineraryEditStore';
import { PlaceDetailModal } from '../Map/PlaceDetailModal';
import { saveItineraryOffline } from '@/services/offlineService';
import { PackingList } from './PackingList';
import { SafetyInfo } from './SafetyInfo';
import { SOSButton } from '../../common/SOSButton';
import { BookingLinks } from '../Transport/BookingLinks';
import { RouteVariantSelector } from '../Transport/RouteVariantSelector';
import { AddActivityModal } from './AddActivityModal';
import { DayWeatherBanner } from './DayWeatherBanner';
import { FestivalBanner } from './FestivalBanner';
import { MealCard } from './MealCard';
import { NightStayCard } from './NightStayCard';
import { TravelCard } from './TravelCard';
import { SaveTripModal } from './SaveTripModal';

interface ItineraryViewProps {
  result: TripResult;
  request?: TripRequest;
  onReset: () => void;
  activeDay?: number | null;
  onDaySelect?: (day: number | null) => void;
  startDate?: string | null;
}

export const ItineraryView: FC<ItineraryViewProps> = ({ result, request, onReset, activeDay, onDaySelect, startDate }) => {
  const { itinerary, warnings, summary } = result;
  const { isAuthenticated } = useAuthStore();
  const { t } = useTranslation();
  const editStore = useItineraryEditStore();
  const isEditMode = editStore.isEditMode;

  // Data source: editable copy when in edit mode, original otherwise
  const displayItinerary = isEditMode ? editStore.editableItinerary : itinerary;

  const toNumber = (value: unknown): number => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  const formatINR = (value: unknown): string => toNumber(value).toLocaleString('en-IN');
  const totalCost = toNumber(summary?.totalCost);
  const totalDistance = toNumber(summary?.totalDistance);
  const costBreakup = {
    stay: toNumber(summary?.costBreakup?.stay),
    transport: toNumber(summary?.costBreakup?.transport),
    activities: toNumber(summary?.costBreakup?.activities),
    food: toNumber(summary?.costBreakup?.food),
  };

  // Extract unique city names for safety info
  const tripCities = [...new Set(displayItinerary.map(d => d.city))];

  // Place detail modal state
  const [selectedPlace, setSelectedPlace] = useState<any>(null);

  // Add Activity Modal State
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [activeAddDay, setActiveAddDay] = useState<number | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // DnD sensors (pointer + touch for mobile)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  // Day-level drag end
  const handleDayDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = displayItinerary.findIndex((d: any) => `day-${d.day}` === active.id);
    const newIndex = displayItinerary.findIndex((d: any) => `day-${d.day}` === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      editStore.reorderDays(oldIndex, newIndex);
    }
  }, [displayItinerary, editStore]);

  // Activity-level drag end within a day
  const handleActivityDragEnd = useCallback((dayIdx: number) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const acts = displayItinerary[dayIdx]?.activities || [];
    const oldIndex = acts.findIndex((a: any) => `act-${dayIdx}-${a._id || a.name}` === active.id);
    const newIndex = acts.findIndex((a: any) => `act-${dayIdx}-${a._id || a.name}` === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      editStore.reorderActivities(dayIdx, oldIndex, newIndex);
    }
  }, [displayItinerary, editStore]);

  const [swappingMeal, setSwappingMeal] = useState<string | null>(null);
  const [swappedMeals, setSwappedMeals] = useState<Record<string, MealRecommendation>>({});
  const [cityRestaurantsCache, setCityRestaurantsCache] = useState<Record<string, Restaurant[]>>({});

  // Save Trip state
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Favorites state
  const [favoritePlaceIds, setFavoritePlaceIds] = useState<Set<string>>(new Set());

  // Collapsible days
  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set());
  const toggleDayCollapse = (dayNum: number) => {
    setCollapsedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayNum)) next.delete(dayNum);
      else next.add(dayNum);
      return next;
    });
  };
  const collapseAll = () => setCollapsedDays(new Set(displayItinerary.map(d => d.day)));
  const expandAll = () => setCollapsedDays(new Set());

  // Day refs for scroll-to navigation
  const dayRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const timelineRef = useRef<HTMLDivElement>(null);
  const dayNavRef = useRef<HTMLDivElement>(null);

  // Mobile action menu
  const [showActionMenu, setShowActionMenu] = useState(false);

  // Activity type filter
  const [activityTypeFilter, setActivityTypeFilter] = useState<string | null>(null);
  const allActivityTypes = useMemo(() => {
    const types = new Set<string>();
    displayItinerary.forEach(day => (day.activities || []).forEach((a: any) => { if (a.type) types.add(a.type); }));
    return Array.from(types).sort();
  }, [displayItinerary]);



  // Offline save state
  const [savedOffline, setSavedOffline] = useState(false);
  const [savingOffline, setSavingOffline] = useState(false);

  // Trip statistics
  const tripStats = useMemo(() => {
    const totalActivities = displayItinerary.reduce((sum, d) => sum + (d.activities?.length || 0), 0);
    const uniqueCities = [...new Set(displayItinerary.map(d => d.city))];
    return { totalActivities, uniqueCities, cityCount: uniqueCities.length };
  }, [displayItinerary]);

  // Date computation for each day
  const getDayDate = useCallback((dayNumber: number) => {
    if (!startDate) return null;
    const base = new Date(startDate);
    base.setDate(base.getDate() + dayNumber - 1);
    return base;
  }, [startDate]);

  // Format date helper
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  // Scroll to day
  const scrollToDay = useCallback((dayNumber: number) => {
    const el = dayRefs.current[dayNumber];
    if (el && timelineRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // Ensure it's not collapsed
    setCollapsedDays(prev => {
      const next = new Set(prev);
      next.delete(dayNumber);
      return next;
    });
    onDaySelect?.(dayNumber);
  }, [onDaySelect]);

  // Copy itinerary summary text
  const handleCopyItinerary = useCallback(() => {
    const lines: string[] = [];
    lines.push(`🗺️ Trip Itinerary — ${displayItinerary.length} Days`);
    lines.push(`💰 ₹${formatINR(totalCost)} • 📏 ${Math.round(totalDistance)}km`);
    lines.push(`🏙️ Cities: ${tripStats.uniqueCities.join(' → ')}`);
    lines.push('');
    displayItinerary.forEach(day => {
      const dayDate = getDayDate(day.day);
      lines.push(`📅 Day ${day.day}${dayDate ? ` (${formatDate(dayDate)})` : ''} — ${day.city}`);
      (day.activities || []).forEach((a: any) => {
        lines.push(`   • ${a.name} (${a.type}, ${a.timeRequired}h)`);
      });
      if (day.travel) {
        lines.push(`   🚗 Travel to ${day.travel.to} (${Math.round(day.travel.distance)}km, ~${Math.round(day.travel.duration)}h)`);
      }
      lines.push('');
    });
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      toast.success('Itinerary copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy');
    });
  }, [displayItinerary, totalCost, totalDistance, tripStats, getDayDate]);

  useEffect(() => {
    if (isAuthenticated()) {
      getMyFavorites().then(res => {
        if (res.success) {
          setFavoritePlaceIds(new Set(res.favorites.map(f => f.placeId)));
        }
      }).catch(() => { });
    }
  }, []);

  const handleToggleFavorite = async (placeId: string, placeName: string, cityName: string) => {
    if (!isAuthenticated()) {
      alert('Please log in to favorite places.');
      return;
    }
    try {
      const res = await toggleFavoritePlace(placeId, placeName, cityName);
      if (res.success) {
        setFavoritePlaceIds(prev => {
          const next = new Set(prev);
          if (res.favorited) next.add(placeId);
          else next.delete(placeId);
          return next;
        });
      }
    } catch { toast.error('Failed to update favorite.'); }
  };

  const handleSwapMeal = async (dayIdx: number, mealType: 'breakfast' | 'lunch' | 'dinner', cityName: string, currentName: string) => {
    const key = `${dayIdx}-${mealType}`;
    setSwappingMeal(key);
    try {
      let restaurants = cityRestaurantsCache[cityName];
      if (!restaurants) {
        restaurants = await getRestaurantsByCity(cityName);
        setCityRestaurantsCache(prev => ({ ...prev, [cityName]: restaurants }));
      }
      // Filter out current restaurant and swapped ones, pick next
      const usedNames = new Set([currentName]);
      const candidates = restaurants.filter(r => !usedNames.has(r.name));
      if (candidates.length > 0) {
        // Cycle through candidates
        const currentSwapped = swappedMeals[key];
        const currentIdx = currentSwapped
          ? candidates.findIndex(c => c.name === currentSwapped.restaurant)
          : -1;
        const nextIdx = (currentIdx + 1) % candidates.length;
        const pick = candidates[nextIdx];
        setSwappedMeals(prev => ({
          ...prev,
          [key]: {
            restaurant: pick.name,
            cuisine: pick.cuisine[0],
            cost: pick.averageCost,
            mustTry: pick.mustTry[0] || '',
            vegetarian: pick.vegetarian,
            type: pick.type,
          }
        }));
      }
    } catch {
      // Silently fail swap
    } finally {
      setSwappingMeal(null);
    }
  };

  const handleOpenAddActivity = (dayNumber: number) => {
    setActiveAddDay(dayNumber);
    setIsAddActivityModalOpen(true);
  };

  const handleAddActivity = (activity: any) => {
    if (activeAddDay === null) return;
    // Find index of day
    const dayIndex = displayItinerary.findIndex(d => d.day === activeAddDay);
    if (dayIndex !== -1) {
      editStore.addActivity(dayIndex, activity);
    }
  };

  const getDisplayMeal = (dayIdx: number, mealType: 'breakfast' | 'lunch' | 'dinner', meal: MealRecommendation) => {
    const key = `${dayIdx}-${mealType}`;
    return swappedMeals[key] || meal;
  };

  const getFeasibilityColor = (f: string) => {
    switch (f) {
      case 'comfortable': return 'text-green-600 bg-green-50 border-green-200';
      case 'tight': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'not recommended': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600';
    }
  };



  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-2xl rounded-2xl h-full overflow-hidden flex flex-col w-full max-w-2xl mx-auto md:mx-0 border border-white/50 dark:border-slate-700/50"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-700 bg-primary text-white shrink-0">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold font-serif truncate">{t('planner.yourJourney')}</h2>
              <div className="flex items-center gap-2 text-white/80 text-xs sm:text-sm mt-1 flex-wrap">
                <span className="flex items-center gap-1"><Calendar size={13} /> {displayItinerary.length} Days</span>
                <span>•</span>
                <span className="flex items-center gap-1"><MapPin size={13} /> {tripStats.cityCount} {tripStats.cityCount === 1 ? 'City' : 'Cities'}</span>
                <span>•</span>
                <span>₹{formatINR(totalCost)}</span>
              </div>
              {startDate && (
                <div className="text-white/60 text-xs mt-1">
                  {formatDate(new Date(startDate))} — {formatDate(getDayDate(displayItinerary.length)!)}
                </div>
              )}
            </div>
            {/* Primary actions always visible */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={onReset} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors" title={t('planner.back')}>
                <ArrowLeft size={20} />
              </button>
              <button
                onClick={() => {
                  if (isEditMode) editStore.runValidation();
                  else editStore.enterEditMode(itinerary);
                }}
                className={clsx(
                  'p-2 rounded-full transition-colors',
                  isEditMode ? 'bg-white/20 text-yellow-300 hover:bg-white/30' : 'hover:bg-white/10 text-white'
                )}
                title={isEditMode ? t('planner.validateChanges') : t('planner.editItinerary')}
              >
                {isEditMode ? <Check size={20} /> : <Pencil size={20} />}
              </button>
              {isEditMode && (
                <>
                  <button onClick={() => editStore.undo()} disabled={!editStore.canUndo}
                    className={clsx('p-2 rounded-full transition-colors', editStore.canUndo ? 'hover:bg-white/10 text-white' : 'text-white/30 cursor-not-allowed')}
                    title={t('planner.undo')}
                  ><Undo2 size={18} /></button>
                  <button onClick={() => editStore.redo()} disabled={!editStore.canRedo}
                    className={clsx('p-2 rounded-full transition-colors', editStore.canRedo ? 'hover:bg-white/10 text-white' : 'text-white/30 cursor-not-allowed')}
                    title={t('planner.redo')}
                  ><Redo2 size={18} /></button>
                  <button onClick={() => editStore.discardEdits()} className="p-2 hover:bg-white/10 rounded-full text-red-300 transition-colors" title={t('planner.discardEdits')}>
                    <X size={20} />
                  </button>
                  <button onClick={() => setShowVersionHistory(!showVersionHistory)}
                    className={clsx('p-2 rounded-full transition-colors', showVersionHistory ? 'bg-white/20 text-blue-300' : 'hover:bg-white/10 text-white')}
                    title={t('planner.versionHistory')}
                  ><History size={18} /></button>
                </>
              )}
              {/* More actions dropdown */}
              <div className="relative">
                <button onClick={() => setShowActionMenu(!showActionMenu)} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors" title="More actions">
                  <MoreHorizontal size={20} />
                </button>
                <AnimatePresence>
                  {showActionMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowActionMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-600 py-1.5 min-w-[180px]"
                      >
                        <button onClick={() => { handleCopyItinerary(); setShowActionMenu(false); }}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2.5 transition-colors">
                          <Copy size={16} /> Copy Itinerary
                        </button>
                        <button onClick={() => {
                          if (!isAuthenticated()) { toast.error('Please log in to save trips.'); return; }
                          setShowSaveModal(true); setShowActionMenu(false);
                        }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2.5 transition-colors">
                          <Save size={16} /> Save Trip
                        </button>
                        <div className="px-4 py-2.5 flex items-center gap-2.5">
                          <ExportButtons result={result} />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Export</span>
                        </div>
                        <div className="px-4 py-2.5 flex items-center gap-2.5">
                          <ShareButton tripRequest={request} tripResult={result} />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Share</span>
                        </div>
                        <button onClick={async () => {
                          setSavingOffline(true);
                          try { await saveItineraryOffline(result); setSavedOffline(true); setTimeout(() => setSavedOffline(false), 3000); }
                          catch { toast.error('Failed to save for offline.'); }
                          finally { setSavingOffline(false); setShowActionMenu(false); }
                        }} disabled={savingOffline}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2.5 transition-colors disabled:opacity-50">
                          {savingOffline ? <Loader2 size={16} className="animate-spin" /> : savedOffline ? <Check size={16} className="text-green-500" /> : <Download size={16} />}
                          {savedOffline ? 'Saved!' : 'Save Offline'}
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {warnings && warnings.length > 0 && (
          <div className="mx-4 mt-3 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg shrink-0">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-sm mb-1">
              <AlertTriangle size={16} />
              {t('planner.warnings')}
            </div>
            <ul className="list-disc list-inside text-amber-600 dark:text-amber-300 text-sm space-y-0.5">
              {warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}

        {/* Summary Stats - Enhanced */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-b from-secondary/10 to-transparent dark:from-slate-700/50 dark:to-transparent shrink-0 space-y-3.5">
          {/* Route Preview */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 overflow-x-auto no-scrollbar pb-1">
            <MapPin size={14} className="text-primary shrink-0" />
            {tripStats.uniqueCities.map((city, i) => (
              <span key={city} className="flex items-center gap-2 whitespace-nowrap">
                <span className="font-semibold text-gray-800 dark:text-gray-200">{city}</span>
                {i < tripStats.uniqueCities.length - 1 && <span className="text-primary/60">→</span>}
              </span>
            ))}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="text-center bg-white dark:bg-slate-800 rounded-xl p-2.5 sm:p-3 shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">{t('planner.estimatedCost')}</div>
              <div className="font-bold text-base text-primary">₹{formatINR(totalCost)}</div>
            </div>
            <div className="text-center bg-white dark:bg-slate-800 rounded-xl p-2.5 sm:p-3 shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">{t('planner.pace')}</div>
              <div className={clsx("text-xs font-bold px-2.5 py-1 rounded-full border inline-block uppercase", getFeasibilityColor(summary?.feasibility || 'unknown'))}>
                {summary?.feasibility || 'unknown'}
              </div>
            </div>
            <div className="text-center bg-white dark:bg-slate-800 rounded-xl p-2.5 sm:p-3 shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">Distance</div>
              <div className="font-bold text-base text-gray-700 dark:text-gray-300">{Math.round(totalDistance)} km</div>
            </div>
            <div className="text-center bg-white dark:bg-slate-800 rounded-xl p-2.5 sm:p-3 shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">Activities</div>
              <div className="font-bold text-base text-gray-700 dark:text-gray-300">{tripStats.totalActivities}</div>
            </div>
          </div>

          {/* Visual Cost Breakdown Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="h-3 rounded-full overflow-hidden flex bg-gray-100 dark:bg-slate-600">
              {totalCost > 0 && (
                <>
                  <div className="bg-indigo-500 transition-all" style={{ width: `${(costBreakup.stay / totalCost * 100)}%` }} title={`Stay: ₹${formatINR(costBreakup.stay)}`} />
                  <div className="bg-blue-400 transition-all" style={{ width: `${(costBreakup.transport / totalCost * 100)}%` }} title={`Transport: ₹${formatINR(costBreakup.transport)}`} />
                  <div className="bg-emerald-400 transition-all" style={{ width: `${(costBreakup.activities / totalCost * 100)}%` }} title={`Activities: ₹${formatINR(costBreakup.activities)}`} />
                  <div className="bg-orange-400 transition-all" style={{ width: `${(costBreakup.food / totalCost * 100)}%` }} title={`Food: ₹${formatINR(costBreakup.food)}`} />
                </>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-x-3 sm:gap-y-1.5 mt-2.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />Stay ₹{formatINR(costBreakup.stay)}</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />Transport ₹{formatINR(costBreakup.transport)}</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />Activities ₹{formatINR(costBreakup.activities)}</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />Food ₹{formatINR(costBreakup.food)}</span>
            </div>
          </div>
        </div>

        {/* Day Navigation Bar */}
        <div className="shrink-0 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-2 px-3 py-2">
            <div ref={dayNavRef} className="flex-1 flex gap-1.5 overflow-x-auto no-scrollbar">
              {displayItinerary.map(day => {
                const dayDate = getDayDate(day.day);
                return (
                  <button
                    key={day.day}
                    onClick={() => scrollToDay(day.day)}
                    className={clsx(
                      'flex flex-col items-center px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all border min-w-[56px]',
                      activeDay === day.day
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600'
                    )}
                  >
                    <span className="font-bold text-[11px]">D{day.day}</span>
                    <span className={clsx('text-[9px] truncate max-w-[48px]', activeDay === day.day ? 'text-white/80' : 'text-gray-400 dark:text-gray-500')}>{day.city}</span>
                    {dayDate && <span className={clsx('text-[8px]', activeDay === day.day ? 'text-white/60' : 'text-gray-400 dark:text-gray-500')}>{dayDate.getDate()}/{dayDate.getMonth() + 1}</span>}
                  </button>
                );
              })}
            </div>
            {/* Collapse/Expand All */}
            <div className="flex gap-1 shrink-0">
              <button
                onClick={collapsedDays.size === displayItinerary.length ? expandAll : collapseAll}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                title={collapsedDays.size === displayItinerary.length ? 'Expand all days' : 'Collapse all days'}
              >
                {collapsedDays.size === displayItinerary.length ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Version History Panel */}
        {isEditMode && showVersionHistory && (
          <div className="mx-4 mt-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                <History size={14} /> {t('planner.versionHistory')}
              </span>
              <button
                onClick={() => {
                  const label = `v${editStore.versions.length} — ${new Date().toLocaleTimeString()}`;
                  editStore.saveVersion(label);
                }}
                className="text-xs px-2.5 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save Snapshot
              </button>
            </div>
            {editStore.versions.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">No versions saved yet.</p>
            ) : (
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {editStore.versions.map((v, i) => (
                  <li key={v.timestamp} className="flex items-center justify-between text-xs bg-white dark:bg-slate-700/50 rounded px-2.5 py-1.5">
                    <span className="text-gray-700 dark:text-gray-300 truncate">{v.label}</span>
                    <div className="flex gap-1.5 shrink-0 ml-2">
                      <button
                        onClick={() => editStore.restoreVersion(i)}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        {t('planner.restore')}
                      </button>
                      {i > 0 && (
                        <button
                          onClick={() => editStore.deleteVersion(i)}
                          className="text-red-500 hover:underline"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Validation Banner */}
        {isEditMode && editStore.validationStatus !== 'idle' && (
          <div className={clsx(
            'px-4 py-2.5 text-sm font-medium flex items-center gap-2 shrink-0',
            editStore.validationStatus === 'validating' && 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
            editStore.validationStatus === 'valid' && 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
            editStore.validationStatus === 'warning' && 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
          )}>
            {editStore.validationStatus === 'validating' && <Loader2 size={14} className="animate-spin" />}
            {editStore.validationStatus === 'valid' && <Check size={14} />}
            {editStore.validationStatus === 'warning' && <AlertTriangle size={14} />}
            {editStore.validationMessage || 'Validating...'}
          </div>
        )}

        {/* Activity Type Filter */}
        {allActivityTypes.length > 1 && (
          <div className="px-4 py-2 flex gap-1.5 overflow-x-auto border-b border-gray-100 dark:border-slate-700 shrink-0 no-scrollbar">
            <button
              onClick={() => setActivityTypeFilter(null)}
              className={clsx('px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border',
                !activityTypeFilter ? 'bg-primary text-white border-primary' : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-600 hover:bg-gray-100'
              )}
            >{t('planner.allTypes')}</button>
            {allActivityTypes.map(type => (
              <button
                key={type}
                onClick={() => setActivityTypeFilter(activityTypeFilter === type ? null : type)}
                className={clsx('px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border',
                  activityTypeFilter === type ? 'bg-primary text-white border-primary' : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-600 hover:bg-gray-100'
                )}
              >{type}</button>
            ))}
          </div>
        )}

        {/* Timeline */}
        <div ref={timelineRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDayDragEnd}>
            <SortableContext items={displayItinerary.map((d: any) => `day-${d.day}`)} strategy={verticalListSortingStrategy}>
              {displayItinerary.map((day: any, idx: number) => {
                const dayDate = getDayDate(day.day);
                const isCollapsed = collapsedDays.has(day.day);
                return (
                <DraggableDayCard key={`day-${day.day}`} id={`day-${day.day}`} dayNumber={day.day} isEditMode={isEditMode}>
                  <div ref={el => { dayRefs.current[day.day] = el; }}>
                  {/* Day Header - clickable to collapse/expand */}
                  <div
                    className={`mb-5 cursor-pointer transition-all rounded-xl px-4 py-4 -mx-2 ${activeDay === day.day ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400/50' : 'hover:bg-gray-50 dark:hover:bg-slate-700/30'}`}
                    onClick={() => onDaySelect?.(activeDay === day.day ? null : day.day)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-primary uppercase tracking-wider bg-primary/10 px-3 py-1 rounded-lg">{t('planner.day')} {day.day}</span>
                        {dayDate && (
                          <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Calendar size={13} />
                            {formatDate(dayDate)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleDayCollapse(day.day); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                        title={isCollapsed ? 'Expand day' : 'Collapse day'}
                      >
                        {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                      </button>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-text dark:text-white mt-2 font-serif">{day.city}</h3>
                    {/* Day Cost Breakdown */}
                    <div className="flex items-center gap-3 sm:gap-4 mt-2.5 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                      <span className="font-semibold text-primary">₹{formatINR(day?.stats?.totalCost)}</span>
                      <span className="flex items-center gap-1">🏨 ₹{formatINR(typeof day.nightStay === 'object' && day.nightStay?.hotel ? day.nightStay.hotel.pricePerNight : 0)}</span>
                      {day.meals && <span className="flex items-center gap-1">🍽️ ₹{formatINR((day.meals.breakfast?.cost || 0) + (day.meals.lunch?.cost || 0) + (day.meals.dinner?.cost || 0))}</span>}
                      {day.travel && <span className="flex items-center gap-1">🚗 {Math.round(day.travel.distance)}km</span>}
                      <span className="flex items-center gap-1.5"><Clock size={13} /> {(day.activities || []).reduce((s: number, a: any) => s + (a.timeRequired || 0), 0)}h planned</span>
                    </div>
                  </div>

                  {/* Collapsible Content */}
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >

                  {/* Weather Info */}
                  {day.weather && <DayWeatherBanner weather={day.weather} />}

                  {/* Festival Banner */}
                  {day.festival && <FestivalBanner festival={day.festival} />}


                  {/* Booking Links for travel days */}
                  {day.travel && (
                    <BookingLinks
                      from={day.travel.from}
                      to={day.travel.to}
                      dayNumber={day.day}
                      mode={day.travel.mode}
                      distance={day.travel.distance}
                      startDate={startDate}
                    />
                  )}

                  {/* Transport variant selector */}
                  {day.travel && (
                    <div className="mt-3">
                      <RouteVariantSelector
                        from={day.travel.from}
                        to={day.travel.to}
                        selectedMode={day.travel.mode?.toLowerCase()}
                        onSelect={() => {}}
                      />
                    </div>
                  )}

                  {/* Activities */}
                  <div className="space-y-5">
                    {isEditMode ? (
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleActivityDragEnd(idx)}>
                        <SortableContext items={(day.activities || []).map((a: any) => `act-${idx}-${a._id || a.name}`)} strategy={verticalListSortingStrategy}>
                          {(day.activities || []).map((act: any, i: number) => (
                            <DraggableActivity
                              key={`act-${idx}-${act._id || act.name}`}
                              id={`act-${idx}-${act._id || act.name}`}
                              activity={act}
                              isEditMode={true}
                              isFavorite={favoritePlaceIds.has(act._id || act.name)}
                              alternatives={[]}
                              onRemove={() => editStore.removeActivity(idx, i)}
                              onReplace={(newPlace) => editStore.replaceActivity(idx, i, newPlace)}
                              onToggleFavorite={() => handleToggleFavorite(act._id || act.name, act.name, day.city)}
                              onNotesChange={(notes) => editStore.updateActivityNotes(idx, i, notes)}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    ) : (
                      (day.activities || []).filter((act: any) => !activityTypeFilter || act.type === activityTypeFilter).map((act: any, i: number) => (
                        <div key={i} className="flex gap-4 sm:gap-5 bg-white dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5 duration-200">
                          <div
                            className="w-20 h-20 rounded-xl bg-gray-200 shrink-0 overflow-hidden shadow-md cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                            onClick={() => setSelectedPlace(act)}
                          >
                            <img src={act.thumbnailUrl || act.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(act.name)}/100/100`} alt={act.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className="font-bold text-text dark:text-white text-lg cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              onClick={() => setSelectedPlace(act)}
                            >
                              {act.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1.5 uppercase tracking-wide font-medium">
                              <span className="text-accent bg-accent/10 px-2 py-0.5 rounded-md">{act.type}</span>
                              <span className="flex items-center gap-1"><Clock size={11} />{act.timeRequired}h</span>
                              <span>{act.bestTimeOfDay}</span>
                              {act.priceTier && <span className="normal-case">{act.priceTier === 'free' ? '🆓 Free' : act.priceTier === 'low' ? '💰 Low' : act.priceTier === 'medium' ? '💰💰 Med' : '💰💰💰 High'}</span>}
                            </div>
                            {act.notes && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic line-clamp-2">{act.notes}</p>}
                          </div>
                          <button
                            onClick={() => handleToggleFavorite(act._id || act.name, act.name, day.city)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-full transition-colors shrink-0 self-start"
                            title={favoritePlaceIds.has(act._id || act.name) ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Heart size={18} className={clsx(
                              favoritePlaceIds.has(act._id || act.name) ? 'fill-red-500 text-red-500' : 'text-gray-300 dark:text-gray-500'
                            )} />
                          </button>
                        </div>
                      ))
                    )}
                    {(day.activities || []).length === 0 && (
                      <div className="text-sm text-gray-400 dark:text-gray-500 italic p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl text-center">{t('planner.freeDay')}</div>
                    )}

                    {isEditMode && (
                      <button
                        onClick={() => handleOpenAddActivity(day.day)}
                        className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-xl flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all font-medium"
                      >
                        <Plus size={18} />
                        {t('planner.addActivity')}
                      </button>
                    )}
                  </div>

                  {/* Meal Recommendations */}
                  {day.meals && (
                    <div className="mt-6 space-y-3">
                      {day.meals.breakfast && (
                        <MealCard
                          meal={getDisplayMeal(idx, 'breakfast', day.meals.breakfast)}
                          mealType="breakfast"
                          isSwapping={swappingMeal === `${idx}-breakfast`}
                          onSwap={() => handleSwapMeal(idx, 'breakfast', day.city, getDisplayMeal(idx, 'breakfast', day.meals.breakfast).restaurant)}
                        />
                      )}
                      {day.meals.lunch && (
                        <MealCard
                          meal={getDisplayMeal(idx, 'lunch', day.meals.lunch)}
                          mealType="lunch"
                          isSwapping={swappingMeal === `${idx}-lunch`}
                          onSwap={() => handleSwapMeal(idx, 'lunch', day.city, getDisplayMeal(idx, 'lunch', day.meals.lunch).restaurant)}
                        />
                      )}
                      {day.meals.dinner && (
                        <MealCard
                          meal={getDisplayMeal(idx, 'dinner', day.meals.dinner)}
                          mealType="dinner"
                          isSwapping={swappingMeal === `${idx}-dinner`}
                          onSwap={() => handleSwapMeal(idx, 'dinner', day.city, getDisplayMeal(idx, 'dinner', day.meals.dinner).restaurant)}
                        />
                      )}
                    </div>
                  )}

                  {/* Travel to Next City */}
                  {day.travel && <TravelCard travel={day.travel} dayNumber={day.day} date={day.date} maxTravelHours={request?.constraints?.maxTravelHoursPerDay} />}

                  {/* Night Stay */}
                  <NightStayCard nightStay={day.nightStay} dayCity={day.city} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  </div>
                </DraggableDayCard>
                );
              })}
            </SortableContext>
          </DndContext>

          {/* Packing List */}
          <PackingList result={result} request={request} />

          {/* Safety & Emergency Info */}
          <SafetyInfo cities={tripCities} />
        </div>
      </motion.div>

      {/* Add Activity Modal */}
      <AddActivityModal
        isOpen={isAddActivityModalOpen}
        onClose={() => setIsAddActivityModalOpen(false)}
        onAdd={handleAddActivity}
        dayNumber={activeAddDay || undefined}
        cityCoordinates={activeAddDay ? (() => {
          const day = displayItinerary.find(d => d.day === activeAddDay);
          if (day?.activities?.length) {
            const act = day.activities.find((a: any) => a.coordinates?.lat && a.coordinates?.lng);
            if (act) return act.coordinates;
          }
          return undefined;
        })() : undefined}
      />

      {/* Save Trip Modal */}
      <SaveTripModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        request={request}
        result={result}
      />

      {/* Place Detail Modal */}
      <PlaceDetailModal
        place={selectedPlace}
        isOpen={!!selectedPlace}
        onClose={() => setSelectedPlace(null)}
      />

      {/* Floating SOS Button */}
      <SOSButton visible={true} />
    </>
  );
}
