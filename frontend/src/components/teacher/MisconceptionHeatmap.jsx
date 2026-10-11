import React from 'react';
import { AlertCircle, BarChart3, TrendingUp } from 'lucide-react';

export default function MisconceptionHeatmap() {
  const data = [
    { category: 'Algebraic Sign Error (+/- Inversion)', count: 14, percentage: 35, color: 'bg-rose-500' },
    { category: 'Factoring Identity Confusion', count: 10, percentage: 25, color: 'bg-amber-500' },
    { category: 'Indeterminate Form 0/0 Misapplication', count: 9, percentage: 22.5, color: 'bg-purple-500' },
    { category: 'Formula Variable Substitution Error', count: 7, percentage: 17.5, color: 'bg-blue-500' }
  ];

  return (
    <div className="glass-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Class Misconception Heatmap</h3>
            <p className="text-xs text-gray-400">Real-Time Distractor Taxonomy Analytics</p>
          </div>
        </div>

        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>40 Attempted Steps Logged</span>
        </span>
      </div>

      <div className="space-y-4">
        {data.map((item, idx) => (
          <div key={idx} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-gray-200">{item.category}</span>
              <span className="text-gray-400 font-semibold">{item.count} occurrences ({item.percentage}%)</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full ${item.color} transition-all duration-500`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
