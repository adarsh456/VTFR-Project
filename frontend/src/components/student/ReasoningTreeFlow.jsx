import React from 'react';
import { 
  GitBranch, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  Check, 
  HelpCircle,
  Award,
  ChevronDown
} from 'lucide-react';
import LatexRenderer from '../math/LatexRenderer';

export default function ReasoningTreeFlow({
  question,
  selectedMainOption,
  solutionSteps = [],
  stepSelections = {},
  onSubmitAll,
  isLastQuestion = true
}) {
  if (!question) return null;

  const mainOptions = question.optionsList || [];
  const chosenMainOpt = mainOptions.find(
    (o) => o.optionSequenceNo === selectedMainOption
  );
  const correctMainOpt = mainOptions.find((o) => o.isCorrect);
  const isMainCorrect = Boolean(chosenMainOpt?.isCorrect);

  const totalSteps = solutionSteps.length;
  const correctStepsCount = solutionSteps.filter((s, idx) => {
    const sNum = s.stepSequenceNo || idx + 1;
    const chosenSeq = stepSelections[sNum];
    const chosenOpt = (s.optionsList || []).find((o) => o.optionSequenceNo === chosenSeq);
    return Boolean(chosenOpt?.isCorrect);
  }).length;
  const allMastered = isMainCorrect && (totalSteps === 0 || correctStepsCount === totalSteps);

  return (
    <div className="flow-tree-container animate-fade-in-up">
      {/* Header Banner */}
      <div className="flow-tree-header">
        <div className="flow-tree-header-icon-box">
          <GitBranch className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="flow-tree-title">VTFR Reasoning & Decision Flow</h3>
          <p className="flow-tree-subtitle">
            Visualizing your cognitive problem-solving path from initial hypothesis through scaffolded solution steps.
          </p>
        </div>
      </div>

      {/* Interactive Tree Nodes */}
      <div className="flow-tree-track">
        {/* NODE 1: Main Question Selection */}
        <div className={`flow-node ${isMainCorrect ? 'node-correct' : 'node-warning'}`}>
          <div className="flow-node-badge">
            <span>Stage 1 • Initial Hypothesis</span>
            <span className={`flow-status-pill ${isMainCorrect ? 'green' : 'amber'}`}>
              {isMainCorrect ? (
                <>
                  <CheckCircle2 style={{ width: 12, height: 12 }} />
                  <span>Optimal Initial Choice</span>
                </>
              ) : (
                <>
                  <AlertTriangle style={{ width: 12, height: 12 }} />
                  <span>Misconception Detected</span>
                </>
              )}
            </span>
          </div>

          <div className="flow-node-content">
            <h4 className="flow-node-prompt">
              <LatexRenderer content={question.questionText} />
            </h4>

            <div className="flow-choice-box">
              <span className="flow-choice-label">Your Initial Selection:</span>
              <div className="flow-choice-val">
                <strong>Option {String.fromCharCode(64 + (selectedMainOption || 1))}:</strong>&nbsp;
                <LatexRenderer content={chosenMainOpt?.optionText || 'None'} />
              </div>
            </div>

            {!isMainCorrect && correctMainOpt && (
              <div className="flow-choice-box" style={{ marginTop: 6, borderColor: '#A7F3D0', backgroundColor: '#F0FDF4' }}>
                <span className="flow-choice-label" style={{ color: '#047857' }}>Correct Option:</span>
                <div className="flow-choice-val" style={{ color: '#065F46' }}>
                  <strong>Option {String.fromCharCode(64 + correctMainOpt.optionSequenceNo)}:</strong>&nbsp;
                  <LatexRenderer content={correctMainOpt.optionText} />
                </div>
              </div>
            )}

            {chosenMainOpt?.explanation && (
              <div className="flow-node-explanation">
                <strong>Diagnostic Note:</strong> {chosenMainOpt.explanation}
              </div>
            )}
          </div>
        </div>

        {/* Vertical Connector Line */}
        <div className="flow-connector">
          <div className="flow-connector-line" />
          <div className="flow-connector-arrow">
            <ChevronDown style={{ width: 16, height: 16 }} />
          </div>
        </div>

        {/* STEP NODES: Solution Step 1, 2, ... */}
        {solutionSteps.map((step, idx) => {
          const stepNum = step.stepSequenceNo || idx + 1;
          const chosenOptSeq = stepSelections[stepNum];
          const chosenStepOpt = (step.optionsList || []).find(
            (o) => o.optionSequenceNo === chosenOptSeq
          );
          const correctStepOpt = (step.optionsList || []).find((o) => o.isCorrect);
          const isStepCorrect = Boolean(chosenStepOpt?.isCorrect);

          return (
            <React.Fragment key={stepNum}>
              <div className={`flow-node ${isStepCorrect ? 'node-correct' : 'node-warning'}`}>
                <div className="flow-node-badge">
                  <span>Stage {idx + 2} • Solution Step {stepNum} Reasoning</span>
                  <span className={`flow-status-pill ${isStepCorrect ? 'green' : 'amber'}`}>
                    {isStepCorrect ? (
                      <>
                        <CheckCircle2 style={{ width: 12, height: 12 }} />
                        <span>Step Verified</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle style={{ width: 12, height: 12 }} />
                        <span>Misconception in Step</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="flow-node-content">
                  <h4 className="flow-node-prompt">
                    <LatexRenderer content={step.stepText} />
                  </h4>

                  <div className="flow-choice-box">
                    <span className="flow-choice-label">Your Step Selection:</span>
                    <div className="flow-choice-val">
                      <strong>Option {String.fromCharCode(64 + (chosenOptSeq || 1))}:</strong>&nbsp;
                      <LatexRenderer content={chosenStepOpt?.optionText || 'Selected'} />
                    </div>
                  </div>

                  {!isStepCorrect && correctStepOpt && (
                    <div className="flow-choice-box" style={{ marginTop: 6, borderColor: '#A7F3D0', backgroundColor: '#F0FDF4' }}>
                      <span className="flow-choice-label" style={{ color: '#047857' }}>Correct Step Option:</span>
                      <div className="flow-choice-val" style={{ color: '#065F46' }}>
                        <strong>Option {String.fromCharCode(64 + correctStepOpt.optionSequenceNo)}:</strong>&nbsp;
                        <LatexRenderer content={correctStepOpt.optionText} />
                      </div>
                    </div>
                  )}

                  {chosenStepOpt?.explanation && (
                    <div className="flow-node-explanation">
                      <strong>Diagnostic Note:</strong> {chosenStepOpt.explanation}
                    </div>
                  )}
                </div>
              </div>

              {/* Vertical Connector Line (between steps or to final node) */}
              <div className="flow-connector">
                <div className="flow-connector-line" />
                <div className="flow-connector-arrow">
                  <ChevronDown style={{ width: 16, height: 16 }} />
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* FINAL NODE: Synthesis & Derivation */}
        <div className={`flow-node ${allMastered ? 'node-mastery' : 'node-correct'}`}>
          <div className="flow-node-badge">
            <span style={{ color: allMastered ? '#047857' : '#2563EB' }}>
              Final Stage • Mathematical Synthesis & Solution
            </span>
            <span className={`flow-status-pill ${allMastered ? 'green' : 'blue'}`}>
              <Sparkles style={{ width: 12, height: 12 }} />
              <span>{allMastered ? 'Full Path Mastered' : 'Reasoning Flow Completed'}</span>
            </span>
          </div>

          <div className="flow-node-content">
            <div className="flex items-center gap-2 mb-2">
              <Award style={{ width: 18, height: 18, color: '#059669' }} />
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#065F46' }}>
                Mathematical Derivation & Verified Answer: {correctMainOpt?.optionText || 'Verified'}
              </h4>
            </div>

            {question.calculationDraft && (
              <p className="flow-derivation-text">
                {question.calculationDraft}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="flow-tree-footer">
        <div className="flow-tree-stats">
          <span>
            Scaffolded Steps: {correctStepsCount} of {totalSteps} Correct
          </span>
        </div>

        <button
          type="button"
          onClick={onSubmitAll}
          className="flow-submit-all-btn"
        >
          <span>{isLastQuestion ? 'View Assessment Results' : 'Proceed to Next Question'}</span>
          <ArrowRight style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  );
}
