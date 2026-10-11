import React, { useState } from 'react';
import LatexRenderer from '../math/LatexRenderer';
import { CheckCircle2, HelpCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function StepCard({ step, currentStepNo, totalSteps, onSubmitOption, isSubmitting }) {
  const [selectedOptionNo, setSelectedOptionNo] = useState(null);

  if (!step) {
    return (
      <div className="mkcl-card p-6 text-center text-gray-500">
        No step content available.
      </div>
    );
  }

  const handleOptionSelect = (optionNo) => {
    setSelectedOptionNo(optionNo);
  };

  const handleSubmit = () => {
    if (selectedOptionNo !== null) {
      onSubmitOption(selectedOptionNo);
    }
  };

  return (
    <div className="mkcl-card p-6 md:p-8 animate-fade-in-up">
      {/* Header Badge */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#0B2545] text-white font-bold text-sm">
            {step.stepSequenceNo || currentStepNo}
          </span>
          <span className="text-xs uppercase tracking-wider font-bold text-[#0B2545]">
            Solution Step {currentStepNo} of {totalSteps}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
          <HelpCircle className="w-4 h-4 text-[#0077B6]" />
          <span className="font-semibold">Interactive Problem Solving</span>
        </div>
      </div>

      {/* Step Prompt / Guiding Question Text */}
      <div className="mb-8">
        <h3 className="text-xl md:text-2xl font-bold text-[#1E293B] leading-relaxed">
          <LatexRenderer content={step.stepText} />
        </h3>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {(step.optionsList || []).map((option) => {
          const isSelected = selectedOptionNo === option.optionSequenceNo;
          return (
            <button
              key={option.optionSequenceNo}
              type="button"
              onClick={() => handleOptionSelect(option.optionSequenceNo)}
              className={`text-left p-5 rounded-xl border transition-all duration-200 relative group flex items-start gap-4 ${
                isSelected
                  ? 'bg-sky-50 border-[#0077B6] shadow-sm text-[#0B2545] ring-2 ring-[#0077B6]/30'
                  : 'bg-white border-gray-200 text-[#334155] hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {/* Choice Letter Badge (A, B, C, D) */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-[#0077B6] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200 group-hover:text-gray-900'
                }`}
              >
                {String.fromCharCode(64 + option.optionSequenceNo)}
              </div>

              {/* Option Text */}
              <div className="flex-1 pt-1 text-base leading-relaxed font-medium">
                <LatexRenderer content={option.optionText} />
              </div>

              {isSelected && (
                <CheckCircle2 className="w-5 h-5 text-[#0077B6] shrink-0 mt-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          type="button"
          disabled={selectedOptionNo === null || isSubmitting}
          onClick={handleSubmit}
          className="btn-mkcl-primary"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Evaluating Step...</span>
            </>
          ) : (
            <>
              <span>Submit Step Answer</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
