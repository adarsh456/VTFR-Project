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
  const isMainCorrect = chosenMainOpt?.isCorrect;

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
          const isStepCorrect = chosenStepOpt ? chosenStepOpt.isCorrect : true;

          return (
            <React.Fragment key={stepNum}>
              <div className={`flow-node ${isStepCorrect ? 'node-correct' : 'node-neutral'}`}>
                <div className="flow-node-badge">
                  <span>Stage {idx + 2} • Solution Step {stepNum} Reasoning</span>
                  <span className={`flow-status-pill ${isStepCorrect ? 'green' : 'blue'}`}>
                    <Check style={{ width: 12, height: 12 }} />
                    <span>Step Verified</span>
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

        {/* FINAL NODE: Synthesis & Mastery */}
        <div className="flow-node node-mastery">
          <div className="flow-node-badge">
            <span style={{ color: '#047857' }}>Final Stage • Concept Mastery & Synthesis</span>
            <span className="flow-status-pill green">
              <Sparkles style={{ width: 12, height: 12 }} />
              <span>Full Path Completed</span>
            </span>
          </div>

          <div className="flow-node-content">
            <div className="flex items-center gap-2 mb-2">
              <Award style={{ width: 18, height: 18, color: '#059669' }} />
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#065F46' }}>
                Mathematical Derivation & Correct Answer: {correctMainOpt?.optionText || 'Verified'}
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
          <span>Question Progress: Completed 100%</span>
        </div>

        <button
          type="button"
          onClick={onSubmitAll}
          className="flow-submit-all-btn"
        >
          <span>{isLastQuestion ? 'Submit All Answers' : 'Proceed to Next Question'}</span>
          <ArrowRight style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  );
}
