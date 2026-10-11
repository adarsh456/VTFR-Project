import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';

export default function ScoreCard({ questionTopic, totalSteps, onRestart }) {
  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  return (
    <div className="mkcl-card p-8 md:p-10 text-center max-w-xl mx-auto border-emerald-200 shadow-xl animate-fade-in-up">
      <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-6 border border-emerald-200 shadow-sm">
        <Trophy className="w-8 h-8" />
      </div>

      <h2 className="text-3xl font-extrabold text-[#0B2545] mb-2">
        Concept Mastery Achieved!
      </h2>
      <p className="text-gray-600 text-sm mb-6 font-medium">
        You successfully completed all <span className="text-emerald-700 font-bold">{totalSteps} solution steps</span> for{' '}
        <span className="text-[#0077B6] font-bold">{questionTopic}</span>.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="text-2xl font-extrabold text-emerald-700">100%</div>
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mt-1">Mastery Score</div>
        </div>
        <div className="p-4 rounded-xl bg-sky-50 border border-sky-200">
          <div className="text-2xl font-extrabold text-[#0077B6]">{totalSteps} / {totalSteps}</div>
          <div className="text-xs font-bold text-sky-800 uppercase tracking-wider mt-1">Steps Mastered</div>
        </div>
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="btn-mkcl-primary mx-auto"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Solve Another Question</span>
      </button>
    </div>
  );
}
