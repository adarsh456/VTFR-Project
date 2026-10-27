import React, { useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Award, 
  Target, 
  AlertTriangle, 
  RotateCcw, 
  GitBranch, 
  CheckCircle2, 
  XCircle, 
  Clock 
} from 'lucide-react';
import LatexRenderer from '../math/LatexRenderer';

export default function ScoreCard({
  question,
  questionTopic,
  selectedMainOption,
  stepSelections = {},
  timerSeconds = 0,
  onRestart,
  onReviewFlow
}) {
  // 1. Evaluate Main Question
  const mainOptions = question?.optionsList || [];
  const chosenMainOpt = mainOptions.find(
    (o) => o.optionSequenceNo === selectedMainOption
  );
  const correctMainOpt = mainOptions.find((o) => o.isCorrect);
  const isMainCorrect = Boolean(chosenMainOpt?.isCorrect);

  // 2. Evaluate Solution Steps
  const solutionSteps = question?.solutionSteps || [];
  const totalSteps = solutionSteps.length;

  const stepEvaluations = useMemo(() => {
    return solutionSteps.map((step, idx) => {
      const stepNum = step.stepSequenceNo || idx + 1;
      const chosenOptSeq = stepSelections[stepNum];
      const chosenOpt = (step.optionsList || []).find(
        (o) => o.optionSequenceNo === chosenOptSeq
      );
      const correctOpt = (step.optionsList || []).find((o) => o.isCorrect);
      const isCorrect = Boolean(chosenOpt?.isCorrect);

      return {
        stepNum,
        stepText: step.stepText,
        chosenOpt,
        chosenOptSeq,
        correctOpt,
        isCorrect
      };
    });
  }, [solutionSteps, stepSelections]);

  const correctStepsCount = stepEvaluations.filter((s) => s.isCorrect).length;

  // 3. Compute Total Score Percentage
  const totalItems = (mainOptions.length > 0 ? 1 : 0) + totalSteps;
  const correctItems = (isMainCorrect ? 1 : 0) + correctStepsCount;
  const scorePercent = totalItems > 0 ? Math.round((correctItems / totalItems) * 100) : 0;

  // 4. Determine Dynamic Performance Tier
  let tier = 'remedial';
  let tierBadge = 'Remedial Review Recommended';
  let tierTitle = 'Concept Misconceptions Detected';
  let tierSubtitle = `You scored ${scorePercent}% on this practice assessment for ${questionTopic}. Key misconceptions were detected. Review the diagnostics below to master this topic.`;
  let TierIcon = AlertTriangle;

  if (scorePercent === 100) {
    tier = 'mastery';
    tierBadge = 'Concept Mastery Achieved';
    tierTitle = 'Outstanding! Full Mastery Achieved';
    tierSubtitle = `You scored 100% on this assessment for ${questionTopic}. Every solution step and hypothesis was accurately derived!`;
    TierIcon = Trophy;
  } else if (scorePercent >= 70) {
    tier = 'proficient';
    tierBadge = 'Proficient Understanding';
    tierTitle = 'Great Effort! Near Mastery';
    tierSubtitle = `You scored ${scorePercent}% on ${questionTopic}. You demonstrated solid reasoning with minor misconceptions in some steps.`;
    TierIcon = Award;
  } else if (scorePercent >= 40) {
    tier = 'partial';
    tierBadge = 'Concept In Progress';
    tierTitle = 'Partial Mastery — Needs Practice';
    tierSubtitle = `You scored ${scorePercent}% on ${questionTopic}. You solved some steps correctly, but need review on key intermediate principles.`;
    TierIcon = Target;
  }

  // 5. Celebration Confetti for high achievement
  useEffect(() => {
    if (scorePercent === 100) {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 }
      });
    } else if (scorePercent >= 70) {
      confetti({
        particleCount: 40,
        spread: 55,
        origin: { y: 0.65 }
      });
    }
  }, [scorePercent]);

  // Format Timer
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="student-result-container">
      <div className="student-result-card">
        {/* Tier Icon Circle */}
        <div className={`student-result-icon-wrapper tier-${tier}`}>
          <TierIcon style={{ width: 34, height: 34 }} />
        </div>

        {/* Tier Status Badge */}
        <div>
          <span className={`student-result-tier-badge tier-${tier}`}>
            {tierBadge}
          </span>
        </div>

        {/* Main Title & Subtitle */}
        <h2 className="student-result-title">{tierTitle}</h2>
        <p className="student-result-subtitle">{tierSubtitle}</p>

        {/* 4-Item Metric Stats Grid */}
        <div className="student-result-metrics-grid">
          {/* Tile 1: Overall Mastery Score */}
          <div className="student-result-stat-tile">
            <div 
              className="stat-value" 
              style={{ 
                color: scorePercent >= 70 ? '#059669' : scorePercent >= 40 ? '#D97706' : '#DC2626' 
              }}
            >
              {scorePercent}%
            </div>
            <div className="stat-label">Mastery Score</div>
          </div>

          {/* Tile 2: Steps Mastered */}
          <div className="student-result-stat-tile">
            <div className="stat-value" style={{ color: '#0077B6' }}>
              {correctStepsCount} / {totalSteps}
            </div>
            <div className="stat-label">Steps Mastered</div>
          </div>

          {/* Tile 3: Initial Hypothesis */}
          <div className="student-result-stat-tile">
            <div 
              className="stat-value" 
              style={{ 
                fontSize: 18, 
                color: isMainCorrect ? '#059669' : '#D97706',
                paddingTop: 3
              }}
            >
              {isMainCorrect ? '✓ Correct' : '⚠ Misconception'}
            </div>
            <div className="stat-label">Main Hypothesis</div>
          </div>

          {/* Tile 4: Time Spent */}
          <div className="student-result-stat-tile">
            <div className="stat-value" style={{ color: '#6366F1' }}>
              {formatTimer(timerSeconds)}
            </div>
            <div className="stat-label">Time Taken</div>
          </div>
        </div>

        {/* Itemized Question & Step Breakdown */}
        <div className="student-result-breakdown-card">
          <div className="result-breakdown-header">
            <span>Detailed Assessment Breakdown</span>
            <span className="result-breakdown-count">
              {correctItems} of {totalItems} items correct
            </span>
          </div>

          <div className="result-breakdown-list">
            {/* Main Question Breakdown */}
            {question && (
              <div className={`result-breakdown-item ${isMainCorrect ? 'correct' : 'incorrect'}`}>
                <div className="result-breakdown-item-top">
                  <span className="result-breakdown-item-title">
                    Stage 1 • Main Question Hypothesis
                  </span>
                  <span className={`result-breakdown-status-pill ${isMainCorrect ? 'correct' : 'incorrect'}`}>
                    {isMainCorrect ? (
                      <>
                        <CheckCircle2 style={{ width: 12, height: 12 }} />
                        <span>Optimal Answer</span>
                      </>
                    ) : (
                      <>
                        <XCircle style={{ width: 12, height: 12 }} />
                        <span>Misconception</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="result-breakdown-prompt">
                  <LatexRenderer content={question.questionText} />
                </div>

                <div className="result-breakdown-choices-row">
                  <div className="result-user-choice">
                    <strong>Your Choice:</strong>&nbsp;
                    <span>Option {String.fromCharCode(64 + (selectedMainOption || 1))}:</span>&nbsp;
                    <LatexRenderer content={chosenMainOpt?.optionText || 'None selected'} />
                  </div>

                  {!isMainCorrect && correctMainOpt && (
                    <div className="result-correct-choice">
                      <strong>Correct Choice:</strong>&nbsp;
                      <span>Option {String.fromCharCode(64 + correctMainOpt.optionSequenceNo)}:</span>&nbsp;
                      <LatexRenderer content={correctMainOpt.optionText} />
                    </div>
                  )}
                </div>

                {!isMainCorrect && chosenMainOpt?.explanation && (
                  <div className="result-breakdown-explanation">
                    <strong>Diagnostic Feedback:</strong> {chosenMainOpt.explanation}
                  </div>
                )}
              </div>
            )}

            {/* Solution Steps Breakdown */}
            {stepEvaluations.map((step) => (
              <div 
                key={step.stepNum} 
                className={`result-breakdown-item ${step.isCorrect ? 'correct' : 'incorrect'}`}
              >
                <div className="result-breakdown-item-top">
                  <span className="result-breakdown-item-title">
                    Stage {step.stepNum + 1} • Solution Step {step.stepNum} Reasoning
                  </span>
                  <span className={`result-breakdown-status-pill ${step.isCorrect ? 'correct' : 'incorrect'}`}>
                    {step.isCorrect ? (
                      <>
                        <CheckCircle2 style={{ width: 12, height: 12 }} />
                        <span>Step Verified</span>
                      </>
                    ) : (
                      <>
                        <XCircle style={{ width: 12, height: 12 }} />
                        <span>Step Misconception</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="result-breakdown-prompt">
                  <LatexRenderer content={step.stepText} />
                </div>

                <div className="result-breakdown-choices-row">
                  <div className="result-user-choice">
                    <strong>Your Step Choice:</strong>&nbsp;
                    <span>Option {String.fromCharCode(64 + (step.chosenOptSeq || 1))}:</span>&nbsp;
                    <LatexRenderer content={step.chosenOpt?.optionText || 'None selected'} />
                  </div>

                  {!step.isCorrect && step.correctOpt && (
                    <div className="result-correct-choice">
                      <strong>Correct Step Solution:</strong>&nbsp;
                      <span>Option {String.fromCharCode(64 + step.correctOpt.optionSequenceNo)}:</span>&nbsp;
                      <LatexRenderer content={step.correctOpt.optionText} />
                    </div>
                  )}
                </div>

                {!step.isCorrect && step.chosenOpt?.explanation && (
                  <div className="result-breakdown-explanation">
                    <strong>Diagnostic Feedback:</strong> {step.chosenOpt.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="student-result-actions">
          <button
            type="button"
            onClick={onRestart}
            className="btn-result-primary"
          >
            <RotateCcw style={{ width: 16, height: 16 }} />
            <span>Solve Another Question</span>
          </button>

          {onReviewFlow && (
            <button
              type="button"
              onClick={onReviewFlow}
              className="btn-result-secondary"
            >
              <GitBranch style={{ width: 16, height: 16 }} />
              <span>Review Reasoning Flow</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
