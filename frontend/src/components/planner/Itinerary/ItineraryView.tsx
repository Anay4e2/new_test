import { FC, useState, useEffect, useCallback } from 'react';
import { TripResult, TripRequest, NightStayInfo, Hotel, MealRecommendation, Restaurant } from '@/types';
import { Car, Moon, Download, ArrowLeft, Loader2, Star, Building2, ChevronDown, X, Coffee, UtensilsCrossed, RefreshCw, Save, Heart, Thermometer, CloudRain, Sun, AlertTriangle, Train, Plane, Pencil, Check } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { getHotelsByCity, getRestaurantsByCity, saveTrip, toggleFavoritePlace, getMyFavorites } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { ShareButton } from './ShareButton';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggableDayCard } from './DraggableDayCard';
import { DraggableActivity } from './DraggableActivity';
import { useItineraryEditStore } from '@/stores/itineraryEditStore';
import { PlaceDetailModal } from '../Map/PlaceDetailModal';

interface ItineraryViewProps {
  result: TripResult;
  request?: TripRequest;
  onReset: () => void;
}

export const ItineraryView: FC<ItineraryViewProps> = ({ result, request, onReset }) => {
  const { itinerary, summary } = result;
  const { isAuthenticated } = useAuthStore();
  const editStore = useItineraryEditStore();
  const isEditMode = editStore.isEditMode;

  // Data source: editable copy when in edit mode, original otherwise
  const displayItinerary = isEditMode ? editStore.editableItinerary : itinerary;

  // Place detail modal state
  const [selectedPlace, setSelectedPlace] = useState<any>(null);

  // DnD sensors (pointer + touch for mobile)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [alternativesFor, setAlternativesFor] = useState<string | null>(null);
  const [alternativeHotels, setAlternativeHotels] = useState<Hotel[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [swappingMeal, setSwappingMeal] = useState<string | null>(null);
  const [swappedMeals, setSwappedMeals] = useState<Record<string, MealRecommendation>>({});
  const [cityRestaurantsCache, setCityRestaurantsCache] = useState<Record<string, Restaurant[]>>({});

  // Save Trip state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savingTrip, setSavingTrip] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Favorites state
  const [favoritePlaceIds, setFavoritePlaceIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isAuthenticated()) {
      getMyFavorites().then(res => {
        if (res.success) {
          setFavoritePlaceIds(new Set(res.favorites.map(f => f.placeId)));
        }
      }).catch(() => { });
    }
  }, []);

  const handleSaveTrip = async () => {
    if (!saveTitle.trim()) return;
    setSavingTrip(true);
    try {
      const res = await saveTrip(saveTitle.trim(), request || {}, result);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => {
          setShowSaveModal(false);
          setSaveSuccess(false);
          setSaveTitle('');
        }, 1500);
      }
    } catch {
      alert('Failed to save trip. Please try again.');
    } finally {
      setSavingTrip(false);
    }
  };

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
    } catch { /* silently fail */ }
  };

  const isHotelInfo = (ns: string | NightStayInfo): ns is NightStayInfo => {
    return typeof ns === 'object' && ns !== null && 'hotel' in ns;
  };

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const hasHalf = rating - full >= 0.5;
    return (
      <span className="inline-flex items-center gap-0.5">
        {Array.from({ length: full }, (_, i) => (
          <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
        ))}
        {hasHalf && <Star size={12} className="fill-amber-400/50 text-amber-400" />}
        <span className="text-xs ml-1 text-gray-500 dark:text-gray-400">{rating}</span>
      </span>
    );
  };

  const handleViewAlternatives = async (cityName: string) => {
    if (alternativesFor === cityName) {
      setAlternativesFor(null);
      return;
    }
    setAlternativesFor(cityName);
    setLoadingAlternatives(true);
    try {
      const hotels = await getHotelsByCity(cityName);
      setAlternativeHotels(hotels);
    } catch {
      setAlternativeHotels([]);
    } finally {
      setLoadingAlternatives(false);
    }
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

  const renderMealCard = (meal: MealRecommendation, mealType: 'breakfast' | 'lunch' | 'dinner', dayIdx: number, cityName: string) => {
    const key = `${dayIdx}-${mealType}`;
    const displayMeal = swappedMeals[key] || meal;
    const icon = mealType === 'breakfast'
      ? <Coffee size={14} className="text-amber-600" />
      : <UtensilsCrossed size={14} className="text-orange-600" />;
    const label = mealType.charAt(0).toUpperCase() + mealType.slice(1);

    return (
      <div key={mealType} className="flex items-center gap-3 bg-orange-50/80 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 rounded-lg p-3">
        <div className="bg-white dark:bg-slate-600 p-1.5 rounded-full shadow-sm shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">{label}</span>
            {displayMeal.vegetarian && <span className="text-xs" title="Vegetarian">🟢</span>}
          </div>
          <div className="text-sm font-semibold text-text dark:text-white truncate">{displayMeal.restaurant}</div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-gray-500 dark:text-gray-400">{displayMeal.cuisine}</span>
            {displayMeal.mustTry && <span className="text-xs text-orange-600 dark:text-orange-400">Try: {displayMeal.mustTry}</span>}
            <span className="text-xs font-medium text-primary">₹{displayMeal.cost}</span>
          </div>
        </div>
        <button
          onClick={() => handleSwapMeal(dayIdx, mealType, cityName, displayMeal.restaurant)}
          disabled={swappingMeal === key}
          className="p-1.5 hover:bg-orange-100 dark:hover:bg-orange-800/30 rounded-full transition-colors shrink-0 text-gray-400 hover:text-orange-600"
          title="Swap restaurant"
        >
          <RefreshCw size={14} className={clsx(swappingMeal === key && 'animate-spin')} />
        </button>
      </div>
    );
  };

  const getFeasibilityColor = (f: string) => {
    switch (f) {
      case 'comfortable': return 'text-green-600 bg-green-50 border-green-200';
      case 'tight': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'not recommended': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600';
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Call backend API to generate PDF
      const response = await fetch('http://localhost:3001/api/itinerary/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get PDF blob and trigger download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trip-itinerary-${itinerary.length}days.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
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
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-primary text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold font-serif">Your Journey</h2>
            <p className="text-white/80 text-sm mt-1">{itinerary.length} Days • {Math.round(summary.totalDistance)} km • ₹{summary.totalCost.toLocaleString()}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onReset} className="p-2.5 hover:bg-white/10 rounded-full text-white transition-colors" title="Back">
              <ArrowLeft size={22} />
            </button>
            {/* Edit Mode Toggle */}
            <button
              onClick={() => {
                if (isEditMode) {
                  editStore.runValidation();
                } else {
                  editStore.enterEditMode(itinerary);
                }
              }}
              className={clsx(
                'p-2.5 rounded-full transition-colors',
                isEditMode ? 'bg-white/20 text-yellow-300 hover:bg-white/30' : 'hover:bg-white/10 text-white'
              )}
              title={isEditMode ? 'Validate Changes' : 'Edit Itinerary'}
            >
              {isEditMode ? <Check size={22} /> : <Pencil size={22} />}
            </button>
            {isEditMode && (
              <button
                onClick={() => editStore.discardEdits()}
                className="p-2.5 hover:bg-white/10 rounded-full text-red-300 transition-colors"
                title="Discard Edits"
              >
                <X size={22} />
              </button>
            )}
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="p-2.5 hover:bg-white/10 rounded-full text-white transition-colors disabled:opacity-50"
              title="Download PDF"
            >
              {isGeneratingPDF ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <Download size={22} />
              )}
            </button>
            <button
              onClick={() => {
                if (!isAuthenticated()) {
                  alert('Please log in to save trips.');
                  return;
                }
                setShowSaveModal(true);
              }}
              className="p-2.5 hover:bg-white/10 rounded-full text-white transition-colors"
              title="Save Trip"
            >
              <Save size={22} />
            </button>
            <ShareButton tripRequest={request} tripResult={result} />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="p-4 grid grid-cols-3 gap-4 border-b border-gray-100 dark:border-slate-700 bg-secondary/10 dark:bg-slate-700/50 shrink-0">
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Estimated Cost</div>
            <div className="font-bold text-lg text-primary">₹{summary.totalCost.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Pace</div>
            <div className={clsx("text-sm font-bold px-3 py-1 rounded-full border inline-block mt-1 uppercase text-xs", getFeasibilityColor(summary.feasibility))}>
              {summary.feasibility}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Stay Split</div>
            <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mt-1">
              {Math.round((summary.costBreakup.stay / summary.totalCost) * 100)}%
            </div>
          </div>
        </div>

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

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDayDragEnd}>
            <SortableContext items={displayItinerary.map((d: any) => `day-${d.day}`)} strategy={verticalListSortingStrategy}>
              {displayItinerary.map((day: any, idx: number) => (
                <DraggableDayCard key={`day-${day.day}`} id={`day-${day.day}`} dayNumber={day.day} isEditMode={isEditMode}>
                  <div className="mb-4">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded">Day {day.day}</span>
                    <h3 className="text-xl font-bold text-text dark:text-white mt-1 font-serif">{day.city}</h3>
                  </div>

                  {/* Weather Info */}
                  {day.weather && (
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center gap-3 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-slate-700/70 dark:to-slate-700/50 border border-sky-100 dark:border-slate-600 rounded-xl px-4 py-3">
                        <div className="bg-white dark:bg-slate-600 p-2 rounded-full shadow-sm">
                          {day.weather.condition.toLowerCase().includes('rain')
                            ? <CloudRain size={18} className="text-blue-500" />
                            : day.weather.temp >= 38
                              ? <Thermometer size={18} className="text-red-500" />
                              : <Sun size={18} className="text-amber-500" />
                          }
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-slate-800 dark:text-white">{day.weather.temp}°C</span>
                            <span className="text-sm text-gray-600 dark:text-gray-300">{day.weather.condition}</span>
                          </div>
                        </div>
                        <img
                          src={`https://openweathermap.org/img/wn/${day.weather.icon}@2x.png`}
                          alt={day.weather.condition}
                          className="w-10 h-10 opacity-80"
                        />
                      </div>
                      {day.weather.advisory && (
                        <div className={clsx(
                          'flex items-start gap-2 rounded-lg px-4 py-2.5 text-sm',
                          day.weather.temp >= 42
                            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400'
                            : day.weather.condition.toLowerCase().includes('heavy rain')
                              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400'
                              : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400'
                        )}>
                          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                          <span>{day.weather.advisory}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Activities */}
                  <div className="space-y-4">
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
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    ) : (
                      (day.activities || []).map((act: any, i: number) => (
                        <div key={i} className="flex gap-4 bg-white dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                          <div
                            className="w-16 h-16 rounded-lg bg-gray-200 shrink-0 overflow-hidden shadow-sm cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
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
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1 uppercase tracking-wide font-medium">
                              <span className="text-accent">{act.type}</span> • <span>{act.timeRequired}h</span> • <span>{act.bestTimeOfDay}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleFavorite(act._id || act.name, act.name, day.city)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-full transition-colors shrink-0 self-start"
                            title={favoritePlaceIds.has(act._id || act.name) ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Heart size={16} className={clsx(
                              favoritePlaceIds.has(act._id || act.name) ? 'fill-red-500 text-red-500' : 'text-gray-300 dark:text-gray-500'
                            )} />
                          </button>
                        </div>
                      ))
                    )}
                    {(day.activities || []).length === 0 && (
                      <div className="text-sm text-gray-400 dark:text-gray-500 italic p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl text-center">Free day for leisure or local exploration.</div>
                    )}
                  </div>

                  {/* Meal Recommendations */}
                  {day.meals && (
                    <div className="mt-4 space-y-2">
                      {day.meals.breakfast && renderMealCard(day.meals.breakfast, 'breakfast', idx, day.city)}
                      {day.meals.lunch && renderMealCard(day.meals.lunch, 'lunch', idx, day.city)}
                      {day.meals.dinner && renderMealCard(day.meals.dinner, 'dinner', idx, day.city)}
                    </div>
                  )}

                  {/* Travel to Next City */}
                  {day.travel && (
                    <div className={clsx(
                      'mt-6 flex items-center gap-4 p-4 rounded-xl border',
                      day.travel.isInterState
                        ? 'bg-gradient-to-r from-amber-50 to-purple-50 dark:from-amber-900/30 dark:to-purple-900/30 border-amber-200 dark:border-amber-700'
                        : 'bg-secondary/20 dark:bg-slate-700/50 border-secondary/30 dark:border-slate-600'
                    )}>
                      <div className={clsx(
                        'p-2 rounded-full shadow-sm',
                        day.travel.isInterState
                          ? 'bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300'
                          : 'bg-white dark:bg-slate-600 text-primary'
                      )}>
                        {day.travel.mode === 'Flight' ? <Plane size={20} /> : day.travel.mode === 'Train' ? <Train size={20} /> : <Car size={20} />}
                      </div>
                      <div className="text-sm flex-1">
                        <div className="font-bold text-text dark:text-white">
                          {day.travel.isInterState ? '🌐 Inter-State: ' : ''}Travel to {day.travel.to}
                        </div>
                        <div className="text-xs opacity-80">
                          {Math.round(day.travel.distance)}km • approx {Math.round(day.travel.duration)}h • {day.travel.mode}
                        </div>
                        {day.travel.isInterState && day.travel.fromState && day.travel.toState && (
                          <div className="text-xs mt-1 font-medium text-amber-700 dark:text-amber-400">
                            {day.travel.fromState.replace('_', ' ')} → {day.travel.toState.replace('_', ' ')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Night Stay */}
                  {isHotelInfo(day.nightStay) ? (
                    <div className="mt-4">
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-700/70 dark:to-slate-700/50 border border-indigo-100 dark:border-slate-600 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-white dark:bg-slate-600 p-2 rounded-lg shadow-sm text-primary shrink-0">
                            <Building2 size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Moon size={12} className="text-primary shrink-0" />
                              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Overnight</span>
                            </div>
                            <div className="font-bold text-text dark:text-white mt-1">{day.nightStay.hotel.name}</div>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              {renderStars(day.nightStay.hotel.rating)}
                              <span className="text-sm font-semibold text-primary">₹{day.nightStay.hotel.pricePerNight.toLocaleString()}<span className="text-xs font-normal text-gray-500 dark:text-gray-400">/night</span></span>
                              <span className={clsx(
                                'text-xs px-2 py-0.5 rounded-full font-medium capitalize',
                                day.nightStay.hotel.tier === 'budget' && 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
                                day.nightStay.hotel.tier === 'standard' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
                                day.nightStay.hotel.tier === 'premium' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400'
                              )}>{day.nightStay.hotel.tier}</span>
                            </div>
                            {/* Amenity tags */}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {day.nightStay.hotel.amenities.slice(0, 4).map((a: string, i: number) => (
                                <span key={i} className="text-xs bg-white dark:bg-slate-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full border border-gray-200 dark:border-slate-500">{a}</span>
                              ))}
                              {day.nightStay.hotel.amenities.length > 4 && (
                                <span className="text-xs text-gray-400 dark:text-gray-500 px-1">+{day.nightStay.hotel.amenities.length - 4} more</span>
                              )}
                            </div>
                            {/* View alternatives */}
                            <button
                              onClick={() => handleViewAlternatives(day.nightStay && isHotelInfo(day.nightStay) ? day.nightStay.city : day.city)}
                              className="mt-2 text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
                            >
                              View alternatives
                              <ChevronDown size={12} className={clsx('transition-transform', alternativesFor === (isHotelInfo(day.nightStay) ? day.nightStay.city : day.city) && 'rotate-180')} />
                            </button>

                            {/* Alternatives dropdown */}
                            <AnimatePresence>
                              {alternativesFor === (isHotelInfo(day.nightStay) ? day.nightStay.city : day.city) && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-3 space-y-2 border-t border-gray-200 dark:border-slate-600 pt-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Other Hotels in {isHotelInfo(day.nightStay) ? day.nightStay.city : day.city}</span>
                                      <button onClick={() => setAlternativesFor(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                        <X size={14} />
                                      </button>
                                    </div>
                                    {loadingAlternatives ? (
                                      <div className="flex items-center gap-2 text-xs text-gray-400"><Loader2 size={12} className="animate-spin" /> Loading...</div>
                                    ) : alternativeHotels.length === 0 ? (
                                      <div className="text-xs text-gray-400 italic">No alternatives found.</div>
                                    ) : (
                                      alternativeHotels
                                        .filter(h => h.name !== (isHotelInfo(day.nightStay) ? day.nightStay.hotel.name : ''))
                                        .map((hotel, hi) => (
                                          <div key={hi} className="flex items-center justify-between bg-white dark:bg-slate-600/50 rounded-lg p-2.5 border border-gray-100 dark:border-slate-500">
                                            <div>
                                              <div className="text-sm font-medium text-text dark:text-white">{hotel.name}</div>
                                              <div className="flex items-center gap-2 mt-0.5">
                                                {renderStars(hotel.rating)}
                                                <span className={clsx(
                                                  'text-xs px-1.5 py-0.5 rounded-full capitalize',
                                                  hotel.tier === 'budget' && 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
                                                  hotel.tier === 'standard' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
                                                  hotel.tier === 'premium' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400'
                                                )}>{hotel.tier}</span>
                                              </div>
                                            </div>
                                            <div className="text-sm font-semibold text-primary">₹{hotel.pricePerNight.toLocaleString()}<span className="text-xs font-normal text-gray-500 dark:text-gray-400">/n</span></div>
                                          </div>
                                        ))
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/50 p-2 rounded-lg inline-block">
                      <Moon size={14} className="inline text-primary" />
                      <span>Overnight in <strong>{day.nightStay}</strong></span>
                    </div>
                  )}
                </DraggableDayCard>
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </motion.div>

      {/* Save Trip Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => !savingTrip && setShowSaveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6"
            >
              {saveSuccess ? (
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
                    value={saveTitle}
                    onChange={e => setSaveTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveTrip()}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    autoFocus
                  />
                  <div className="flex gap-3 mt-5 justify-end">
                    <button
                      onClick={() => setShowSaveModal(false)}
                      disabled={savingTrip}
                      className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveTrip}
                      disabled={savingTrip || !saveTitle.trim()}
                      className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {savingTrip && <Loader2 size={14} className="animate-spin" />}
                      Save Trip
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Place Detail Modal */}
      <PlaceDetailModal
        place={selectedPlace}
        isOpen={!!selectedPlace}
        onClose={() => setSelectedPlace(null)}
      />
    </>
  );
}
