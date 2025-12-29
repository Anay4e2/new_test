'use client';

import { DayItinerary, TripResult } from '@/lib/planner';
import { Car, Hotel, Map, Moon, Sun, AlertTriangle, Download, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

interface ItineraryViewProps {
  result: TripResult;
  onReset: () => void;
}

export default function ItineraryView({ result, onReset }: ItineraryViewProps) {
  const { itinerary, summary } = result;

  const getFeasibilityColor = (f: string) => {
    switch (f) {
      case 'comfortable': return 'text-green-600 bg-green-50 border-green-200';
      case 'tight': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'not recommended': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600';
    }
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
           <button className="p-2 hover:bg-indigo-700 rounded text-white" title="Download">
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
               Stay: {Math.round((summary.costBreakup.stay / summary.totalCost) * 100)}%
            </div>
         </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {itinerary.map((day, idx) => (
          <div key={idx} className="relative pl-8 border-l-2 border-indigo-200 pb-6 last:border-0 last:pb-0">
            {/* Day Marker */}
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-2 border-white shadow" />

            <div className="mb-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Day {day.day}</span>
              <h3 className="text-lg font-bold text-gray-800">{day.city}</h3>
            </div>

            {/* Activities */}
            <div className="space-y-3">
               {day.activities.map((act: any, i: number) => (
                 <div key={i} className="flex gap-3 bg-white border rounded-lg p-3 shadow-sm">
                    <div className="w-12 h-12 rounded bg-gray-200 shrink-0 overflow-hidden">
                       {/* eslint-disable-next-line @next/next/no-img-element */}
                       <img src={act.imageUrl || `https://source.unsplash.com/random/100x100?${act.type}`} alt={act.name} className="w-full h-full object-cover" />
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
                    <div className="text-xs opacity-80">{Math.round(day.travel.distance)}km • approx {Math.round(day.travel.duration)}h</div>
                 </div>
              </div>
            )}

            {/* Night Stay */}
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
               <Moon size={16} />
               <span>Overnight stay in <strong>{day.nightStay}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
