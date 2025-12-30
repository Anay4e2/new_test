import { FC, useState } from 'react';
import { TripRequest } from '@/lib/types';
import { CheckCircle, Clock, DollarSign, MapPin, Sun, Users } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface TripWizardProps {
  cities: any[];
  onGenerate: (data: TripRequest) => void;
  selectedCityIds: string[];
  onCityToggle: (id: string) => void;
  isLoading: boolean;
}

export const TripWizard: FC<TripWizardProps> = ({ cities, onGenerate, selectedCityIds, onCityToggle, isLoading }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<TripRequest>>({
    duration: 5,
    budget: 'standard',
    travelStyle: 'relaxed',
    constraints: {
      maxTravelHoursPerDay: 6,
      seniorFriendly: false,
      morningReligious: false,
      noNightTravel: true
    }
  });

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = () => {
    if (formData.duration && formData.budget && formData.travelStyle && formData.constraints) {
      onGenerate({
        stateCode: 'RJ',
        selectedCityIds,
        duration: formData.duration,
        budget: formData.budget as any,
        travelStyle: formData.travelStyle as any,
        constraints: formData.constraints
      });
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-md p-8 shadow-2xl rounded-2xl max-w-md w-full h-auto overflow-y-auto border border-white/50">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-text font-serif">Plan Your Journey</h2>
        <div className="flex space-x-2 mt-4">
          {[1, 2, 3].map(i => (
            <div key={i} className={clsx("h-1.5 flex-1 rounded-full transition-all duration-300", i <= step ? "bg-accent" : "bg-gray-200")} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <h3 className="text-xl font-semibold flex items-center gap-2 text-primary">
            <MapPin size={24} /> Select Destinations
          </h3>
          <p className="text-sm text-gray-500">Choose the cities you want to visit in Rajasthan.</p>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
            {cities.map(city => (
              <div
                key={city._id}
                className={clsx(
                  "p-4 border rounded-xl cursor-pointer flex justify-between items-center transition-all duration-200 group",
                  selectedCityIds.includes(city._id) ? "border-primary bg-primary/5 shadow-md" : "border-gray-100 hover:bg-gray-50 hover:border-gray-200"
                )}
                onClick={() => onCityToggle(city._id)}
              >
                <div>
                  <div className={clsx("font-bold text-lg", selectedCityIds.includes(city._id) ? "text-primary" : "text-gray-700")}>{city.name}</div>
                  <div className="text-xs text-gray-500">{city.description.substring(0, 40)}...</div>
                </div>
                {selectedCityIds.includes(city._id) && <CheckCircle size={20} className="text-accent" />}
              </div>
            ))}
          </div>

          <button
            disabled={selectedCityIds.length === 0}
            onClick={handleNext}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
          >
            Next: Preferences
          </button>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
          <h3 className="text-xl font-semibold flex items-center gap-2 text-primary">
            <DollarSign size={24} /> Preferences
          </h3>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Duration (Days)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={formData.duration}
              onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Budget Tier</label>
            <div className="grid grid-cols-3 gap-3">
              {['budget', 'standard', 'premium'].map(b => (
                <button
                  key={b}
                  onClick={() => setFormData({...formData, budget: b as any})}
                  className={clsx(
                    "p-3 border rounded-xl capitalize text-sm font-medium transition-all",
                    formData.budget === b ? "bg-primary text-white border-primary shadow-md" : "hover:bg-gray-50 border-gray-200 text-gray-600"
                  )}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Travel Pace</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormData({...formData, travelStyle: 'relaxed'})}
                className={clsx("p-3 border rounded-xl flex items-center justify-center gap-2 transition-all", formData.travelStyle === 'relaxed' ? "bg-secondary text-text border-secondary shadow-md" : "hover:bg-gray-50 border-gray-200")}
              >
                <Sun size={18} /> Relaxed
              </button>
              <button
                onClick={() => setFormData({...formData, travelStyle: 'fast'})}
                className={clsx("p-3 border rounded-xl flex items-center justify-center gap-2 transition-all", formData.travelStyle === 'fast' ? "bg-accent text-white border-accent shadow-md" : "hover:bg-gray-50 border-gray-200")}
              >
                <Clock size={18} /> Fast Paced
              </button>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={handleBack} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">Back</button>
            <button onClick={handleNext} className="px-8 py-2 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-primary/90 transition-all transform hover:-translate-y-0.5">Next</button>
          </div>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
          <h3 className="text-xl font-semibold flex items-center gap-2 text-primary">
            <Users size={24} /> Fine Tune
          </h3>

          <div className="space-y-4">
            <label className="flex items-center space-x-4 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={formData.constraints?.seniorFriendly}
                onChange={e => setFormData({
                  ...formData,
                  constraints: { ...formData.constraints!, seniorFriendly: e.target.checked }
                })}
                className="h-5 w-5 text-primary rounded focus:ring-primary"
              />
              <span className="text-gray-700 font-medium">Senior Friendly (Accessible)</span>
            </label>

            <label className="flex items-center space-x-4 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={formData.constraints?.morningReligious}
                onChange={e => setFormData({
                  ...formData,
                  constraints: { ...formData.constraints!, morningReligious: e.target.checked }
                })}
                className="h-5 w-5 text-primary rounded focus:ring-primary"
              />
              <span className="text-gray-700 font-medium">Morning Temple Visits</span>
            </label>

            <label className="flex items-center space-x-4 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={formData.constraints?.noNightTravel}
                onChange={e => setFormData({
                  ...formData,
                  constraints: { ...formData.constraints!, noNightTravel: e.target.checked }
                })}
                className="h-5 w-5 text-primary rounded focus:ring-primary"
              />
              <span className="text-gray-700 font-medium">No Night Travel (End by 8PM)</span>
            </label>

             <div className="pt-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">Max Travel Hours / Day</label>
              <input
                type="range"
                min={2}
                max={12}
                value={formData.constraints?.maxTravelHoursPerDay}
                onChange={e => setFormData({
                  ...formData,
                  constraints: { ...formData.constraints!, maxTravelHoursPerDay: parseInt(e.target.value) }
                })}
                className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-right text-sm font-bold text-primary mt-1">{formData.constraints?.maxTravelHoursPerDay} hours</div>
            </div>
          </div>

          <div className="flex justify-between pt-6">
            <button onClick={handleBack} className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">Back</button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-8 py-3 bg-accent text-white rounded-xl font-bold shadow-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              {isLoading ? (
                  <>
                    <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                    Generating...
                  </>
              ) : 'Build My Itinerary'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
