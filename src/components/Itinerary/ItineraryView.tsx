'use client';

import { DayItinerary, TripResult, PlaceData } from '@/lib/planner';
import { Car, Moon, AlertTriangle, Download, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

interface ItineraryViewProps {
  result: TripResult;
  onReset: () => void;
}

export default function ItineraryView({ result, onReset }: ItineraryViewProps) {
  const { itinerary, summary } = result;

  const pct = (value: number) => summary.totalCost > 0 ? Math.round((value / summary.totalCost) * 100) : 0;

  const getFeasibilityColor = (f: string) => {
    switch (f) {
      case 'comfortable': return 'text-green-600 bg-green-50 border-green-200';
      case 'tight': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'not recommended': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600';
    }
  };

  const getPlaceImage = (place: PlaceData): string => {
    const typeImages: Record<string, string> = {
      'Fort': 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400&h=200&fit=crop',
      'Palace': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=200&fit=crop',
      'Temple': 'https://images.unsplash.com/photo-1564804955876-7fc925ed5060?w=400&h=200&fit=crop',
      'Lake': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop',
      'Garden': 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=200&fit=crop',
      'Desert': 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&h=200&fit=crop',
      'Monument': 'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&h=200&fit=crop',
      'Observatory': 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&h=200&fit=crop',
      'Haveli': 'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&h=200&fit=crop',
    };
    return typeImages[place.type] || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=200&fit=crop';
  };

  const handleDownload = () => {
    let text = `YOUR TRAVEL ITINERARY\n`;
    text += `${'='.repeat(50)}\n`;
    text += `Total Days: ${itinerary.length} | Cost: ₹${summary.totalCost.toLocaleString()} | Distance: ${Math.round(summary.totalDistance)} km\n`;
    text += `Feasibility: ${summary.feasibility}\n\n`;

    itinerary.forEach(day => {
      text += `--- Day ${day.day}${day.date ? ` (${day.date})` : ''}: ${day.city} ---\n`;
      day.activities.forEach((act: PlaceData, i: number) => {
        text += `  ${i + 1}. ${act.name} (${act.type}) — ${act.timeRequired}h\n`;
      });
      if (day.travel) {
        text += `  Travel: ${day.travel.from} → ${day.travel.to} (${Math.round(day.travel.distance)}km, ~${day.travel.duration.toFixed(1)}h)\n`;
      }
      text += `  Night Stay: ${day.nightStay}\n\n`;
    });

    text += `COST BREAKUP\n`;
    text += `  Stay: ₹${Math.round(summary.costBreakup.stay).toLocaleString()}\n`;
    text += `  Transport: ₹${Math.round(summary.costBreakup.transport).toLocaleString()}\n`;
    text += `  Activities: ₹${Math.round(summary.costBreakup.activities).toLocaleString()}\n`;
    if (summary.costBreakup.food) {
      text += `  Food: ₹${Math.round(summary.costBreakup.food).toLocaleString()}\n`;
    }

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'travel-itinerary.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg h-full overflow-hidden flex flex-col w-full max-w-2xl mx-auto md:mx-0">
      {/* Header */}
      <div className="p-4 border-b bg-indigo-600 text-white flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-xl font-bold">Your Travel Package</h2>
          <p className="text-indigo-100 text-sm">{itinerary.length} Days • {Math.round(summary.totalDistance)} km • ₹{summary.totalCost.toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
           <button onClick={onReset} className="p-2 hover:bg-indigo-700 rounded text-white" title="Edit">
             <ArrowLeft size={20} />
           </button>
           <button onClick={handleDownload} className="p-2 hover:bg-indigo-700 rounded text-white" title="Download">
             <Download size={20} />
           </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="p-4 grid grid-cols-3 gap-4 border-b bg-gray-50 shrink-0">
         <div className="text-center">
            <div className="text-xs text-gray-500 uppercase">Cost</div>
            <div className="font-bold">₹{summary.totalCost.toLocaleString()}</div>
         </div>
         <div className="text-center">
            <div className="text-xs text-gray-500 uppercase">Feasibility</div>
            <div className={clsx("text-sm font-medium px-2 py-0.5 rounded border inline-block", getFeasibilityColor(summary.feasibility))}>
              {summary.feasibility}
            </div>
         </div>
         <div className="text-center">
            <div className="text-xs text-gray-500 uppercase">Breakup</div>
            <div className="text-xs text-gray-600">
               Stay: {pct(summary.costBreakup.stay)}% |
               Food: {pct(summary.costBreakup.food)}% |
               Transport: {pct(summary.costBreakup.transport)}% |
               Activities: {pct(summary.costBreakup.activities)}%
            </div>
         </div>
      </div>

      {/* Warnings */}
      {result.warnings && result.warnings.length > 0 && (
        <div className="px-4 pt-3 pb-1 space-y-2 shrink-0">
          {result.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {itinerary.map((day, idx) => (
          <div key={idx} className="relative pl-8 border-l-2 border-indigo-200 pb-6 last:border-0 last:pb-0">
            {/* Day Marker */}
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-2 border-white shadow" />

            <div className="mb-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
                Day {day.day}
                {day.date && (
                  <span className="text-gray-400 font-normal ml-2">
                    {new Date(day.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </span>
              <h3 className="text-lg font-bold text-gray-800">{day.city}</h3>
            </div>

            {/* Activities */}
            <div className="space-y-3">
               {day.activities.map((act: PlaceData, i: number) => (
                 <div key={i} className="flex gap-3 bg-white border rounded-lg p-3 shadow-sm">
                    <div className="w-12 h-12 rounded bg-gray-200 shrink-0 overflow-hidden">
                       {/* eslint-disable-next-line @next/next/no-img-element */}
                       <img
                         src={act.imageUrl || getPlaceImage(act)}
                         alt={act.name}
                         className="w-full h-full object-cover"
                         onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=200&fit=crop'; }}
                       />
                    </div>
                    <div>
                       <div className="font-semibold text-gray-800">{act.name}</div>
                       <div className="text-xs text-gray-500 flex items-center gap-2">
                         <span>{act.type}</span> • <span>{act.timeRequired}h</span> • <span>{act.bestTimeOfDay}</span>
                       </div>
                    </div>
                 </div>
               ))}
               {day.activities.length === 0 && (
                 <div className="text-sm text-gray-400 italic">Free day for leisure or local exploration.</div>
               )}
            </div>

            {/* Travel to Next City */}
            {day.travel && (
              <div className="mt-4 flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-800">
                 <Car size={20} />
                 <div className="text-sm">
                    <span className="font-bold">Travel to {day.travel.to}</span>
                    <div className="text-xs opacity-80">{Math.round(day.travel.distance)}km • approx {day.travel.duration.toFixed(1)}h</div>
                 </div>
              </div>
            )}

            {/* Night Stay */}
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
               <Moon size={16} />
               <span>Overnight stay in <strong>{typeof day.nightStay === 'string' ? day.nightStay : `${day.nightStay.hotel.name} — ${day.nightStay.city}`}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
