'use client';

import { useState } from 'react';
import { TripRequest } from '@/lib/planner';
import { Calendar, CheckCircle, Clock, DollarSign, MapPin, Moon, Sun, Users } from 'lucide-react';
import clsx from 'clsx';

interface TripWizardProps {
  cities: any[];
  onGenerate: (data: TripRequest) => void;
  selectedCityIds: string[];
  onCityToggle: (id: string) => void;
  isLoading: boolean;
}

export default function TripWizard({ cities, onGenerate, selectedCityIds, onCityToggle, isLoading }: TripWizardProps) {
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
    <div className="bg-white p-6 shadow-lg rounded-lg max-w-md w-full h-full overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Plan Your Trip</h2>
        <div className="flex space-x-2 mt-2">
          {[1, 2, 3].map(i => (
            <div key={i} className={clsx("h-1 flex-1 rounded", i <= step ? "bg-blue-600" : "bg-gray-200")} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MapPin size={20} /> Select Destinations
          </h3>
          <p className="text-sm text-gray-500">Choose the cities you want to visit in Rajasthan.</p>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {cities.map(city => (
              <div
                key={city._id}
                className={clsx(
                  "p-3 border rounded cursor-pointer flex justify-between items-center transition-colors",
                  selectedCityIds.includes(city._id) ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                )}
                onClick={() => onCityToggle(city._id)}
              >
                <div>
                  <div className="font-medium">{city.name}</div>
                  <div className="text-xs text-gray-500">{city.description.substring(0, 40)}...</div>
                </div>
                {selectedCityIds.includes(city._id) && <CheckCircle size={16} className="text-blue-500" />}
              </div>
            ))}
          </div>

          <button
            disabled={selectedCityIds.length === 0}
            onClick={handleNext}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Next: Preferences
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <DollarSign size={20} /> Preferences
          </h3>

          <div>
            <label className="block text-sm font-medium mb-1">Duration (Days)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={formData.duration}
              onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Budget</label>
            <div className="grid grid-cols-3 gap-2">
              {['budget', 'standard', 'premium'].map(b => (
                <button
                  key={b}
                  onClick={() => setFormData({...formData, budget: b as any})}
                  className={clsx(
                    "p-2 border rounded capitalize text-sm",
                    formData.budget === b ? "bg-blue-600 text-white border-blue-600" : "hover:bg-gray-50"
                  )}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Travel Style</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFormData({...formData, travelStyle: 'relaxed'})}
                className={clsx("p-2 border rounded flex items-center justify-center gap-2", formData.travelStyle === 'relaxed' ? "bg-green-600 text-white" : "")}
              >
                <Sun size={16} /> Relaxed
              </button>
              <button
                onClick={() => setFormData({...formData, travelStyle: 'fast'})}
                className={clsx("p-2 border rounded flex items-center justify-center gap-2", formData.travelStyle === 'fast' ? "bg-orange-600 text-white" : "")}
              >
                <Clock size={16} /> Fast Paced
              </button>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={handleBack} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Back</button>
            <button onClick={handleNext} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Next: Constraints</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users size={20} /> Constraints
          </h3>

          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.constraints?.seniorFriendly}
                onChange={e => setFormData({
                  ...formData,
                  constraints: { ...formData.constraints!, seniorFriendly: e.target.checked }
                })}
                className="h-4 w-4 text-blue-600"
              />
              <span>Senior Friendly (Accessible places)</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.constraints?.morningReligious}
                onChange={e => setFormData({
                  ...formData,
                  constraints: { ...formData.constraints!, morningReligious: e.target.checked }
                })}
                className="h-4 w-4 text-blue-600"
              />
              <span>Visit Temples in Morning</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.constraints?.noNightTravel}
                onChange={e => setFormData({
                  ...formData,
                  constraints: { ...formData.constraints!, noNightTravel: e.target.checked }
                })}
                className="h-4 w-4 text-blue-600"
              />
              <span>No Night Travel (Plan stops before 8PM)</span>
            </label>

             <div>
              <label className="block text-sm font-medium mb-1">Max Travel Hours / Day</label>
              <input
                type="range"
                min={2}
                max={12}
                value={formData.constraints?.maxTravelHoursPerDay}
                onChange={e => setFormData({
                  ...formData,
                  constraints: { ...formData.constraints!, maxTravelHoursPerDay: parseInt(e.target.value) }
                })}
                className="w-full"
              />
              <div className="text-right text-sm text-gray-500">{formData.constraints?.maxTravelHoursPerDay} hours</div>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button onClick={handleBack} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Back</button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? 'Generating...' : 'Build My Package'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
