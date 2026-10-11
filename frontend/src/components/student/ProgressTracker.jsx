import React from 'react';
import { Check } from 'lucide-react';

export default function ProgressTracker({ currentStep, totalSteps = 1, isAlternate = false }) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);
  const progressPercent = Math.min(100, Math.round(((currentStep - 1) / totalSteps) * 100));

  return (
    <div className="mkcl-card p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0B2545]">
            {isAlternate ? 'Remedial Scaffolded Question' : 'Solution Steps Progress'}
          </span>
          {isAlternate && (
            <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 rounded-full">
              Alternate Question Mode
            </span>
          )}
        </div>
        <span className="text-xs font-semibold text-gray-500">
          Step {Math.min(currentStep, totalSteps)} of {totalSteps} ({progressPercent}% Completed)
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#0B2545] to-[#0077B6] transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step Nodes */}
      <div className="flex items-center justify-between relative px-2">
        {steps.map((stepNo) => {
          const isCompleted = stepNo < currentStep;
          const isActive = stepNo === currentStep;

          return (
            <div key={stepNo} className="flex flex-col items-center gap-1.5 relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isActive
                    ? 'bg-[#0077B6] text-white ring-4 ring-sky-100 shadow-sm'
                    : 'bg-gray-100 text-gray-400 border border-gray-300'
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : stepNo}
              </div>
              <span className={`text-[11px] font-medium ${isActive ? 'text-[#0B2545] font-bold' : 'text-gray-500'}`}>
                Step {stepNo}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
