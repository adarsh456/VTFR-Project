import React, { useEffect, useMemo, useState } from 'react';
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
  Clock,
  FileText,
  Globe,
  Image as ImageIcon,
  Play,
  Video,
  ExternalLink,
  Download,
  X,
  Sparkles,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import LatexRenderer from '../math/LatexRenderer';

// Helper to resolve generated concept card images into live backend HTTP URLs
const resolveConceptCardImageUrl = (imageResource, questionObj, fallbackTopic = '') => {
  const rawUrl = imageResource?.url;
  const topicName = questionObj?.topic || questionObj?.metadata?.topic || fallbackTopic || '';

  if (rawUrl && typeof rawUrl === 'string') {
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      if (rawUrl.includes('/static/concept_cards/card.png')) {
        const cleanTopic = topicName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        return `http://127.0.0.1:8000/concept_cards/${cleanTopic}_concept_card.png`;
      }
      return rawUrl;
    }
    if (rawUrl.includes('concept_cards')) {
      const filename = rawUrl.split(/concept_cards[\\/]/).pop();
      if (filename) {
        return `http://127.0.0.1:8000/concept_cards/${encodeURIComponent(filename)}`;
      }
    }
    if (rawUrl.endsWith('.png') || rawUrl.endsWith('.jpg') || rawUrl.endsWith('.webp')) {
      const filename = rawUrl.split(/[\\/]/).pop();
      return `http://127.0.0.1:8000/concept_cards/${encodeURIComponent(filename)}`;
    }
  }

  if (topicName) {
    const cleanTopic = topicName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return `http://127.0.0.1:8000/concept_cards/${cleanTopic}_concept_card.png`;
  }

  return 'http://127.0.0.1:8000/concept_cards/standard_form_and_roots_concept_card.png';
};

// Helper to extract YouTube embed link
const getYouTubeEmbedUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0` : null;
};

export default function ScoreCard({
  question,
  questionTopic,
  selectedMainOption,
  stepSelections = {},
  timerSeconds = 0,
  onRestart,
  onReviewFlow
}) {
  const [activeResourceModal, setActiveResourceModal] = useState(null);

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

  // Remedial Resources from Question Payload
  const relatedContent = question?.relatedContent || question?.rawPayload?.relatedContent || null;
  const hasRemedialResources = Boolean(
    relatedContent && (
      relatedContent.pdfResource ||
      relatedContent.webResource ||
      relatedContent.imageResource ||
      relatedContent.youtubeResource ||
      relatedContent.conceptSummary
    )
  );

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

        {/* ========================================================================= */}
        {/* REMEDIAL LEARNING HUB (Shown when Remedial Review is Recommended)          */}
        {/* ========================================================================= */}
        {tier === 'remedial' && hasRemedialResources && (
          <div className="student-remedial-hub-card animate-fade-in-up">
            <div className="remedial-hub-header">
              <div className="remedial-hub-header-left">
                <div className="remedial-hub-icon-box">
                  <BookOpen className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="remedial-hub-title">Remedial Learning Resources</h3>
                  <p className="remedial-hub-subtitle">
                    Targeted materials to address detected misconceptions and master <strong>{questionTopic}</strong>.
                  </p>
                </div>
              </div>
              <span className="remedial-hub-badge">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Curated Learning Pack</span>
              </span>
            </div>

            {/* Foundational Concept Refresher Statement */}
            {relatedContent.conceptSummary && (
              <div className="remedial-concept-refresher">
                <div className="remedial-concept-label">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Foundational Concept Refresher</span>
                </div>
                <p className="remedial-concept-text">
                  <LatexRenderer content={relatedContent.conceptSummary} />
                </p>
              </div>
            )}

            {/* 4-Card Multi-Modal Resources Grid */}
            <div className="resources-4grid">
              {/* 1. PDF Study Notes */}
              {relatedContent.pdfResource && (
                <div 
                  className="res-card-item"
                  onClick={() => setActiveResourceModal('pdf')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="res-card-left">
                    <div className="res-icon-box red">
                      <FileText style={{ width: 18, height: 18 }} />
                    </div>
                    <div className="res-text-block">
                      <span className="res-card-title">PDF Notes</span>
                      <span className="res-card-subtitle" title={relatedContent.pdfResource.title || 'Study Notes & Worksheet'}>
                        {relatedContent.pdfResource.title || 'Study Notes & Worksheet'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="res-chevron-right" />
                </div>
              )}

              {/* 2. Educational Website */}
              {relatedContent.webResource && (
                <div 
                  className="res-card-item"
                  onClick={() => setActiveResourceModal('web')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="res-card-left">
                    <div className="res-icon-box blue">
                      <Globe style={{ width: 18, height: 18 }} />
                    </div>
                    <div className="res-text-block">
                      <span className="res-card-title">Reference Website</span>
                      <span className="res-card-subtitle" title={relatedContent.webResource.title || 'Online Article'}>
                        {relatedContent.webResource.title || 'Online Article'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="res-chevron-right" />
                </div>
              )}

              {/* 3. Concept Card Infographic */}
              {relatedContent.imageResource && (
                <div 
                  className="res-card-item"
                  onClick={() => setActiveResourceModal('diagram')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="res-card-left">
                    <div className="res-icon-box green">
                      <ImageIcon style={{ width: 18, height: 18 }} />
                    </div>
                    <div className="res-text-block">
                      <span className="res-card-title">Concept Card (Image)</span>
                      <span className="res-card-subtitle" title={relatedContent.imageResource.title || '5-Panel Visualizer'}>
                        {relatedContent.imageResource.title || '5-Panel Visualizer'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="res-chevron-right" />
                </div>
              )}

              {/* 4. YouTube Video Lesson */}
              {relatedContent.youtubeResource && (
                <div 
                  className="res-card-item"
                  onClick={() => setActiveResourceModal('video')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="res-card-left">
                    <div className="res-icon-box blue" style={{ backgroundColor: '#EF4444' }}>
                      <Play style={{ width: 16, height: 16, fill: '#FFFFFF' }} />
                    </div>
                    <div className="res-text-block">
                      <span className="res-card-title" style={{ color: '#DC2626' }}>Video Lesson</span>
                      <span className="res-card-subtitle" title={relatedContent.youtubeResource.title || 'Curated Tutorial'}>
                        {relatedContent.youtubeResource.title || 'Curated Tutorial'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="res-chevron-right" />
                </div>
              )}
            </div>
          </div>
        )}

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

      {/* ========================================================================= */}
      {/* 4. INTERACTIVE RESOURCE PREVIEW MODAL                                     */}
      {/* ========================================================================= */}
      {activeResourceModal && (
        <div className="resource-modal-overlay" onClick={() => setActiveResourceModal(null)}>
          <div className="resource-modal-card animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="resource-modal-header">
              <div className="resource-modal-title">
                {activeResourceModal === 'pdf' && (
                  <>
                    <FileText style={{ width: 18, height: 18, color: '#DC2626' }} />
                    <span>PDF Study Notes: {relatedContent?.pdfResource?.title || 'Resource Document'}</span>
                  </>
                )}
                {activeResourceModal === 'web' && (
                  <>
                    <Globe style={{ width: 18, height: 18, color: '#2563EB' }} />
                    <span>Website Resource: {relatedContent?.webResource?.title || 'Educational Reference'}</span>
                  </>
                )}
                {activeResourceModal === 'diagram' && (
                  <>
                    <ImageIcon style={{ width: 18, height: 18, color: '#059669' }} />
                    <span>Concept Card: {relatedContent?.imageResource?.title || 'Visual Guide'}</span>
                  </>
                )}
                {activeResourceModal === 'video' && (
                  <>
                    <Video style={{ width: 18, height: 18, color: '#DC2626' }} />
                    <span>Video Lesson: {relatedContent?.youtubeResource?.title || 'Curated Tutorial'}</span>
                  </>
                )}
              </div>
              <button 
                type="button" 
                onClick={() => setActiveResourceModal(null)} 
                className="resource-modal-close-btn"
                title="Close preview"
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="resource-modal-body">
              {/* PDF Preview */}
              {activeResourceModal === 'pdf' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 16, backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ backgroundColor: '#FEE2E2', padding: 12, borderRadius: 10, color: '#DC2626' }}>
                      <FileText style={{ width: 30, height: 30 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                        {relatedContent?.pdfResource?.title || 'Curated Study Notes.pdf'}
                      </h4>
                      <p style={{ fontSize: 12, color: '#64748B', margin: '3px 0 0 0' }}>
                        {relatedContent?.pdfResource?.searchQuery || 'High-yield reference formula sheet & practice notes'}
                      </p>
                    </div>
                    {relatedContent?.pdfResource?.url && (
                      <a 
                        href={relatedContent.pdfResource.url} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, backgroundColor: '#DC2626', color: '#FFFFFF', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}
                      >
                        <Download style={{ width: 15, height: 15 }} /> Open PDF
                      </a>
                    )}
                  </div>
                  {relatedContent?.conceptSummary && (
                    <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.6, backgroundColor: '#FFFFFF', padding: 14, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                      <strong style={{ color: '#0F172A' }}>Conceptual Focus:</strong> {relatedContent.conceptSummary}
                    </div>
                  )}
                </div>
              )}

              {/* Web Resource Preview */}
              {activeResourceModal === 'web' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 16, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ backgroundColor: '#DBEAFE', padding: 12, borderRadius: 10, color: '#2563EB' }}>
                      <Globe style={{ width: 30, height: 30 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1E3A8A', margin: 0 }}>
                        {relatedContent?.webResource?.title || 'Curated Web Resource'}
                      </h4>
                      <p style={{ fontSize: 12, color: '#3B82F6', margin: '3px 0 0 0', wordBreak: 'break-all' }}>
                        {relatedContent?.webResource?.url || 'https://learnlive.org'}
                      </p>
                    </div>
                    {relatedContent?.webResource?.url && (
                      <a 
                        href={relatedContent.webResource.url} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, backgroundColor: '#2563EB', color: '#FFFFFF', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}
                      >
                        <ExternalLink style={{ width: 15, height: 15 }} /> Open Article
                      </a>
                    )}
                  </div>
                  {relatedContent?.conceptSummary && (
                    <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                      {relatedContent.conceptSummary}
                    </p>
                  )}
                </div>
              )}

              {/* Diagram / Concept Card Preview */}
              {activeResourceModal === 'diagram' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: 10
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: '#DCFCE7',
                        color: '#16A34A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <ImageIcon style={{ width: 18, height: 18 }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#14532D' }}>
                          5-Panel Educational Concept Card
                        </div>
                        <div style={{ fontSize: 11, color: '#15803D' }}>
                          Topic: <strong>{questionTopic}</strong>
                        </div>
                      </div>
                    </div>

                    <a 
                      href={resolveConceptCardImageUrl(relatedContent?.imageResource, question, questionTopic)}
                      target="_blank" 
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '6px 14px',
                        borderRadius: 8,
                        backgroundColor: '#16A34A',
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      <ExternalLink style={{ width: 13, height: 13 }} />
                      <span>View Full Size</span>
                    </a>
                  </div>

                  <div style={{
                    backgroundColor: '#0F172A',
                    borderRadius: 12,
                    padding: 8,
                    overflow: 'hidden',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 260
                  }}>
                    <img 
                      src={resolveConceptCardImageUrl(relatedContent?.imageResource, question, questionTopic)}
                      alt={`${questionTopic} Concept Card`}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '440px',
                        borderRadius: 8,
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'http://127.0.0.1:8000/concept_cards/standard_form_and_roots_concept_card.png';
                      }}
                    />
                  </div>

                  {relatedContent?.conceptSummary && (
                    <div style={{
                      fontSize: 12.5,
                      color: '#334155',
                      backgroundColor: '#F8FAFC',
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: '1px solid #E2E8F0',
                      lineHeight: 1.6
                    }}>
                      <strong style={{ color: '#0F172A' }}>Summary:</strong> {relatedContent.conceptSummary}
                    </div>
                  )}
                </div>
              )}

              {/* YouTube Video Lesson Preview */}
              {activeResourceModal === 'video' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {getYouTubeEmbedUrl(relatedContent?.youtubeResource?.url) ? (
                    <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000000' }}>
                      <iframe
                        src={getYouTubeEmbedUrl(relatedContent?.youtubeResource?.url)}
                        title={relatedContent?.youtubeResource?.title || 'YouTube Video'}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div style={{ backgroundColor: '#0F172A', borderRadius: 12, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', flexDirection: 'column', gap: 10, padding: 16 }}>
                      <Play style={{ width: 44, height: 44, color: '#38BDF8' }} />
                      <span style={{ fontSize: 14, fontWeight: 600, textAlign: 'center' }}>
                        {relatedContent?.youtubeResource?.title || 'Video Lesson'}
                      </span>
                      {relatedContent?.youtubeResource?.url && (
                        <a 
                          href={relatedContent.youtubeResource.url} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, backgroundColor: '#EF4444', color: '#FFFFFF', textDecoration: 'none', fontSize: 12.5, fontWeight: 700 }}
                        >
                          <Play style={{ width: 13, height: 13, fill: '#FFFFFF' }} /> Watch on YouTube
                        </a>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                      {relatedContent?.youtubeResource?.title}
                    </div>
                    {relatedContent?.youtubeResource?.url && (
                      <a 
                        href={relatedContent.youtubeResource.url} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, backgroundColor: '#EF4444', color: '#FFFFFF', textDecoration: 'none', fontSize: 12, fontWeight: 700, flexShrink: 0 }}
                      >
                        <ExternalLink style={{ width: 13, height: 13 }} />
                        <span>Open on YouTube</span>
                      </a>
                    )}
                  </div>

                  {relatedContent?.conceptSummary && (
                    <p style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                      {relatedContent.conceptSummary}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
