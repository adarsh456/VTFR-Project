import React from 'react';
import { 
  GitBranch, 
  ArrowRight, 
  Sparkles, 
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

  const totalSteps = solutionSteps.length;

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
        <div className="flow-node node-neutral">
          <div className="flow-node-badge">
            <span>Stage 1 • Initial Hypothesis</span>
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

          return (
            <React.Fragment key={stepNum}>
              <div className="flow-node node-neutral">
                <div className="flow-node-badge">
                  <span>Stage {idx + 2} • Solution Step {stepNum} Reasoning</span>
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

        {/* FINAL NODE: Synthesis */}
        <div className="flow-node node-neutral">
          <div className="flow-node-badge">
            <span style={{ color: '#2563EB' }}>
              Final Stage • Cognitive Path Synthesis
            </span>
            <span className="flow-status-pill blue">
              <Sparkles style={{ width: 12, height: 12 }} />
              <span>Decision Flow Recorded</span>
            </span>
          </div>

          <div className="flow-node-content">
            <div className="flex items-center gap-2">
              <Award style={{ width: 18, height: 18, color: '#2563EB' }} />
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1E293B' }}>
                All reasoning stages recorded. Submit below to evaluate your complete decision flow.
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="flow-tree-footer">
        <div className="flow-tree-stats">
          <span>
            Decision Flow: {totalSteps} Scaffolded {totalSteps === 1 ? 'Step' : 'Steps'} Recorded
          </span>
        </div>

        <button
          type="button"
          onClick={onSubmitAll}
          className="flow-submit-all-btn"
        >
          <span>Submit Decision Flow</span>
          <ArrowRight style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  );
}
