import React, { useState } from 'react';
import LatexRenderer from '../math/LatexRenderer';
import { Sparkles, Check, CheckCircle2, AlertCircle, HelpCircle, Code, Eye, FileJson, Copy } from 'lucide-react';

export default function QuestionStudioPreview({ question }) {
  const [activeStepTab, setActiveStepTab] = useState(3);
  const [copied, setCopied] = useState(false);
  const [viewJson, setViewJson] = useState(false);

  // Default fallback question matching screenshot when no dynamic question is generated yet
  const displayQ = question || {
    questionId: '101',
    subject: 'Mathematics',
    grade: '10th Grade',
    topic: 'Binary Search Tree (BST) Insertion',
    questionText: 'Given the initial BST, show the state after inserting 15. Choose the correct movement for Step 3.',
    solutionSteps: [
      {
        stepSequenceNo: 1,
        stepText: 'Identify Given Values',
        optionsList: [
          { optionSequenceNo: 1, optionText: 'Target insert value = 15', isCorrect: true, explanation: 'Root is 10' }
        ]
      },
      {
        stepSequenceNo: 2,
        stepText: 'Start from Root Node',
        optionsList: [
          { optionSequenceNo: 1, optionText: 'Compare 15 with Root (10)', isCorrect: true, explanation: '15 > 10, navigate right' }
        ]
      },
      {
        stepSequenceNo: 3,
        stepText: 'Navigate tree',
        optionsList: [
          { 
            optionSequenceNo: 1, 
            optionText: 'Move to node 20', 
            isCorrect: false, 
            misconception: 'Left Misconception',
            explanation: 'Node 20 is the right child where comparison occurs next.'
          },
          { 
            optionSequenceNo: 2, 
            optionText: 'Move to node 5', 
            isCorrect: true, 
            misconception: 'Correct answer',
            explanation: '15 is greater than 10 but less than 20.'
          },
          { 
            optionSequenceNo: 3, 
            optionText: 'Insert at root', 
            isCorrect: false, 
            misconception: 'Unsorted Misconception',
            explanation: 'Root cannot be overwritten directly in a standard BST.'
          },
          { 
            optionSequenceNo: 4, 
            optionText: 'Compare 15 to root node', 
            isCorrect: false, 
            explanation: 'Root comparison already completed in Step 2.'
          }
        ]
      },
      {
        stepSequenceNo: 4,
        stepText: 'Insert and update references',
        optionsList: [
          { optionSequenceNo: 1, optionText: 'Attach 15 as left child of 20', isCorrect: true }
        ]
      }
    ]
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(displayQ, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-bold text-[#0B1E36]">
            Generated VTFR Question
          </h2>
          <p className="text-xs text-gray-500 font-medium">Cognitive Decomposition & Distractor Taxonomy</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewJson(!viewJson)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              viewJson ? 'bg-[#0B1E36] text-white border-[#0B1E36]' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {viewJson ? <Eye className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5" />}
            <span>{viewJson ? 'Studio View' : 'Raw JSON'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 transition-colors"
            title="Copy JSON Payload"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {viewJson ? (
        <pre className="p-4 rounded-xl bg-gray-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[600px]">
          {JSON.stringify(displayQ, null, 2)}
        </pre>
      ) : (
        <>
          {/* Question Summary & Diagram Box */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 p-5 rounded-xl bg-gray-50/70 border border-gray-200">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0077B6] mb-1.5">
                <span>Question {displayQ.questionId || '101'}</span>
                <span>•</span>
                <span className="text-gray-500">{displayQ.subject || 'Mathematics'} • {displayQ.grade || '10th Grade'}</span>
              </div>
              <h3 className="text-base font-bold text-[#0B1E36] leading-snug">
                <LatexRenderer content={displayQ.questionText} />
              </h3>
            </div>

            {/* SVG Tree / Diagram Placeholder matching screenshot */}
            <div className="w-32 h-24 bg-white rounded-xl border border-gray-200 p-2 shrink-0 flex items-center justify-center relative shadow-sm">
              <svg viewBox="0 0 100 70" className="w-full h-full">
                {/* Lines */}
                <line x1="50" y1="15" x2="30" y2="40" stroke="#CBD5E1" strokeWidth="3" />
                <line x1="50" y1="15" x2="70" y2="40" stroke="#CBD5E1" strokeWidth="3" />
                <line x1="70" y1="40" x2="85" y2="60" stroke="#CBD5E1" strokeWidth="3" />
                
                {/* Nodes */}
                <circle cx="50" cy="15" r="10" fill="#00D2C8" />
                <text x="50" y="18" textAnchor="middle" fontSize="8" fill="#0B1E36" fontWeight="bold">10</text>

                <circle cx="30" cy="40" r="9" fill="#E2E8F0" />
                <text x="30" y="43" textAnchor="middle" fontSize="7" fill="#475569" fontWeight="bold">5</text>

                <circle cx="70" cy="40" r="9" fill="#0077B6" />
                <text x="70" y="43" textAnchor="middle" fontSize="7" fill="#FFFFFF" fontWeight="bold">20</text>

                <circle cx="85" cy="60" r="8" fill="#E2E8F0" />
                <text x="85" y="63" textAnchor="middle" fontSize="6" fill="#475569" fontWeight="bold">25</text>
              </svg>
            </div>
          </div>

          {/* Decomposed Solution Steps (Virtual Time Fixed Response) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
              Decomposed Solution Steps (Virtual Time Fixed Response)
            </h4>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Vertical Step Sequence */}
              <div className="lg:col-span-7 space-y-4">
                {(displayQ.solutionSteps || []).map((step, idx) => {
                  const stepNo = step.stepSequenceNo || idx + 1;
                  const isDetailed = stepNo === 3 || idx === 2;

                  return (
                    <div key={stepNo} className="space-y-3">
                      {/* Step Header Title */}
                      <div className="flex items-center gap-2 font-bold text-sm text-[#0B1E36]">
                        <span className="text-[#0077B6]">Step {stepNo}:</span>
                        <span><LatexRenderer content={step.stepText} /></span>
                      </div>

                      {/* If Step 3: Show branching misconception options */}
                      {isDetailed && (
                        <div className="pl-4 space-y-2 border-l-2 border-[#00D2C8] my-2">
                          {(step.optionsList || []).map((opt, optIdx) => {
                            const isCorrect = opt.isCorrect;
                            const misconceptionLabel = opt.misconception || (isCorrect ? 'Correct answer' : optIdx === 0 ? 'Left Misconception' : optIdx === 2 ? 'Unsorted Misconception' : null);

                            return (
                              <div
                                key={opt.optionSequenceNo || optIdx}
                                className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                                  isCorrect
                                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium'
                                    : 'bg-white border-gray-200 text-gray-800'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                    isCorrect ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span className="font-semibold">
                                    <LatexRenderer content={opt.optionText} />
                                  </span>
                                </div>

                                {/* Misconception Badges */}
                                {misconceptionLabel && (
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white'
                                      : misconceptionLabel.includes('Left')
                                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                                  }`}>
                                    {misconceptionLabel}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Visual Diagram Option Cards */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                {[
                  { id: 'A', label: 'Option A State', active: false },
                  { id: 'B', label: 'Option B State (Correct)', active: true },
                  { id: 'C', label: 'Option C State', active: false },
                  { id: 'D', label: 'Option D State', active: false }
                ].map((card) => (
                  <div
                    key={card.id}
                    className={`p-3 rounded-xl border text-center flex flex-col items-center justify-between transition-all ${
                      card.active
                        ? 'bg-sky-50/70 border-[#00D2C8] ring-2 ring-[#00D2C8]/30 shadow-sm'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-gray-600 mb-2">{card.label}</span>
                    <svg viewBox="0 0 80 60" className="w-full h-14">
                      <line x1="40" y1="12" x2="25" y2="35" stroke="#CBD5E1" strokeWidth="2.5" />
                      <line x1="40" y1="12" x2="55" y2="35" stroke="#CBD5E1" strokeWidth="2.5" />
                      <circle cx="40" cy="12" r="8" fill="#00D2C8" />
                      <text x="40" y="15" textAnchor="middle" fontSize="7" fill="#0B1E36" fontWeight="bold">10</text>
                      <circle cx="25" cy="35" r="7" fill="#0077B6" />
                      <text x="25" y="38" textAnchor="middle" fontSize="6" fill="#fff" fontWeight="bold">5</text>
                      <circle cx="55" cy="35" r="7" fill="#E2E8F0" />
                      <text x="55" y="38" textAnchor="middle" fontSize="6" fill="#475569" fontWeight="bold">20</text>
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
