import { FC, useState } from 'react';
import { TripResult } from '@/types';
import { Car, Moon, Download, ArrowLeft, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface ItineraryViewProps {
  result: TripResult;
  onReset: () => void;
}

export const ItineraryView: FC<ItineraryViewProps> = ({ result, onReset }) => {
  const { itinerary, summary } = result;
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl h-full overflow-hidden flex flex-col w-full max-w-2xl mx-auto md:mx-0 border border-white/50"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-primary text-white flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-2xl font-bold font-serif">Your Journey</h2>
          <p className="text-white/80 text-sm mt-1">{itinerary.length} Days • {Math.round(summary.totalDistance)} km • ₹{summary.totalCost.toLocaleString()}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onReset} className="p-2.5 hover:bg-white/10 rounded-full text-white transition-colors" title="Edit">
            <ArrowLeft size={22} />
          </button>
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
        </div>
      </div>

      {/* Summary Stats */}
      <div className="p-4 grid grid-cols-3 gap-4 border-b border-gray-100 bg-secondary/10 shrink-0">
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Estimated Cost</div>
          <div className="font-bold text-lg text-primary">₹{summary.totalCost.toLocaleString()}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Pace</div>
          <div className={clsx("text-sm font-bold px-3 py-1 rounded-full border inline-block mt-1 uppercase text-xs", getFeasibilityColor(summary.feasibility))}>
            {summary.feasibility}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Stay Split</div>
          <div className="text-sm font-bold text-gray-700 mt-1">
            {Math.round((summary.costBreakup.stay / summary.totalCost) * 100)}%
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {itinerary.map((day, idx) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={idx}
            className="relative pl-8 border-l-2 border-primary/30 pb-8 last:border-0 last:pb-0"
          >
            {/* Day Marker */}
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-2 border-white shadow-md" />

            <div className="mb-4">
              <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded">Day {day.day}</span>
              <h3 className="text-xl font-bold text-text mt-1 font-serif">{day.city}</h3>
            </div>

            {/* Activities */}
            <div className="space-y-4">
              {day.activities.map((act: any, i: number) => (
                <div key={i} className="flex gap-4 bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 rounded-lg bg-gray-200 shrink-0 overflow-hidden shadow-sm">
                    <img src={act.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(act.name)}/100/100`} alt={act.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-bold text-text text-lg">{act.name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-1 uppercase tracking-wide font-medium">
                      <span className="text-accent">{act.type}</span> • <span>{act.timeRequired}h</span> • <span>{act.bestTimeOfDay}</span>
                    </div>
                  </div>
                </div>
              ))}
              {day.activities.length === 0 && (
                <div className="text-sm text-gray-400 italic p-4 bg-gray-50 rounded-xl text-center">Free day for leisure or local exploration.</div>
              )}
            </div>

            {/* Travel to Next City */}
            {day.travel && (
              <div className="mt-6 flex items-center gap-4 p-4 bg-secondary/20 border border-secondary/30 rounded-xl text-text">
                <div className="bg-white p-2 rounded-full shadow-sm text-primary"><Car size={20} /></div>
                <div className="text-sm">
                  <div className="font-bold">Travel to {day.travel.to}</div>
                  <div className="text-xs opacity-80">{Math.round(day.travel.distance)}km • approx {Math.round(day.travel.duration)}h</div>
                </div>
              </div>
            )}

            {/* Night Stay */}
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg inline-block">
              <Moon size={14} className="inline text-primary" />
              <span>Overnight in <strong>{day.nightStay}</strong></span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
