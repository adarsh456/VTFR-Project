import React, { useState } from 'react';
import LatexRenderer from '../math/LatexRenderer';
import { Code, Eye, Copy, Check, FileJson } from 'lucide-react';

export default function QuestionEditor({ question }) {
  const [activeTab, setActiveTab] = useState('preview');
  const [copied, setCopied] = useState(false);

  if (!question) {
    return (
      <div className="glass-card p-8 text-center text-gray-400">
        <FileJson className="w-12 h-12 text-gray-500 mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium">Generate a question above to review its full JSON structure & solution steps.</p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(question, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card p-6 md:p-8">
      {/* Editor Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <FileJson className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Question Preview & JSON Inspector</h3>
            <p className="text-xs text-gray-400">ID: {question.questionId || 'N/A'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-white/5 p-1 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'json' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Raw JSON</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-colors"
            title="Copy JSON Payload"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* View Content */}
      {activeTab === 'preview' ? (
        <div className="space-y-6">
          {/* Main Question Card */}
          <div className="p-5 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Main Question</div>
            <div className="text-lg font-semibold text-white mb-4">
              <LatexRenderer content={question.questionText} />
            </div>

            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Main Options</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(question.optionsList || []).map((opt) => (
                <div
                  key={opt.optionSequenceNo}
                  className={`p-3 rounded-lg border text-sm flex items-start gap-2 ${
                    opt.isCorrect
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                      : 'bg-white/5 border-white/10 text-gray-300'
                  }`}
                >
                  <span className="font-bold text-xs uppercase shrink-0">{String.fromCharCode(64 + opt.optionSequenceNo)}.</span>
                  <div className="flex-1">
                    <LatexRenderer content={opt.optionText} />
                    {opt.isCorrect && opt.explanation && (
                      <div className="text-[11px] text-emerald-300 mt-1 font-normal italic">
                        Why Correct: {opt.explanation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Solution Steps */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-3">
              Solution Steps ({(question.solutionSteps || []).length})
            </div>
            <div className="space-y-3">
              {(question.solutionSteps || []).map((step) => (
                <div key={step.stepSequenceNo} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="font-semibold text-sm text-white mb-2">
                    Step {step.stepSequenceNo}: <LatexRenderer content={step.stepText} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(step.optionsList || []).map((opt) => (
                      <div
                        key={opt.optionSequenceNo}
                        className={`p-2.5 rounded-lg border text-xs ${
                          opt.isCorrect
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200 font-medium'
                            : 'bg-white/5 border-white/10 text-gray-400'
                        }`}
                      >
                        <LatexRenderer content={opt.optionText} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <pre className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-emerald-400 overflow-x-auto max-h-[500px]">
          {JSON.stringify(question, null, 2)}
        </pre>
      )}
    </div>
  );
}
