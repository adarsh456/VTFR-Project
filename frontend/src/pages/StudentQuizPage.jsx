import React, { useState, useEffect } from 'react';
import { listQuestions } from '../services/questionService';
import { startSession, submitStepChoice, switchAlternateQuestion } from '../services/sessionService';
import LatexRenderer from '../components/math/LatexRenderer';
import StepCard from '../components/student/StepCard';
import ProgressTracker from '../components/student/ProgressTracker';
import RemedialModal from '../components/student/RemedialModal';
import ScoreCard from '../components/student/ScoreCard';
import { BookOpen, Sparkles, AlertCircle, RefreshCw, Layers } from 'lucide-react';

export default function StudentQuizPage({ initialQuestionId = null }) {
  const [questionsList, setQuestionsList] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState(initialQuestionId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Active session state
  const [session, setSession] = useState(null);
  const [questionPayload, setQuestionPayload] = useState(null);
  const [currentStepNo, setCurrentStepNo] = useState(1);
  const [isSubmittingStep, setIsSubmittingStep] = useState(false);

  // Remedial modal state
  const [isRemedialOpen, setIsRemedialOpen] = useState(false);
  const [remedialData, setRemedialData] = useState(null);

  useEffect(() => {
    fetchAvailableQuestions();
  }, []);

  const fetchAvailableQuestions = async () => {
    try {
      setLoading(true);
      const res = await listQuestions({ limit: 10 });
      setQuestionsList(res.questions || []);
      if (res.questions && res.questions.length > 0 && !selectedQuestionId) {
        initQuizSession(res.questions[0].id);
      }
    } catch (err) {
      setError('Failed to load questions list from backend.');
    } finally {
      setLoading(false);
    }
  };

  const initQuizSession = async (qId) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedQuestionId(qId);

      const sessionRes = await startSession({ questionId: qId, studentName: 'Interactive Student' });
      setSession(sessionRes);
      setQuestionPayload(sessionRes.question);
      setCurrentStepNo(1);
      setIsRemedialOpen(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start quiz session.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitStepAnswer = async (selectedOptionNo) => {
    if (!session || !session.sessionId) return;
    try {
      setIsSubmittingStep(true);
      const feedback = await submitStepChoice({
        sessionId: session.sessionId,
        stepSequenceNo: currentStepNo,
        selectedOptionIndex: selectedOptionNo
      });

      if (feedback.isCorrect) {
        if (feedback.sessionStatus === 'completed') {
          setSession((prev) => ({ ...prev, status: 'completed' }));
        } else {
          setCurrentStepNo(feedback.currentStep);
        }
      } else {
        setRemedialData({
          explanation: feedback.explanation,
          relatedContent: feedback.relatedContent,
          alternateQuestion: feedback.alternateQuestion
        });
        setIsRemedialOpen(true);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to evaluate step choice.');
    } finally {
      setIsSubmittingStep(false);
    }
  };

  const handleLaunchAlternateQuestion = async () => {
    if (!session || !session.sessionId) return;
    try {
      setLoading(true);
      setIsRemedialOpen(false);
      const altRes = await switchAlternateQuestion({ sessionId: session.sessionId, altQuestionIndex: 0 });
      setQuestionPayload(altRes.questionPayload);
      setCurrentStepNo(1);
      setSession((prev) => ({ ...prev, isAlternate: true, status: 'in_progress' }));
    } catch (err) {
      setError('Failed to switch to alternate question.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !questionPayload) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-9 h-9 text-[#0077B6] animate-spin" />
        <p className="text-gray-600 font-semibold text-sm">Loading VTFR Problem Solver...</p>
      </div>
    );
  }

  if (session?.status === 'completed') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <ScoreCard
          questionTopic={questionPayload?.topic || 'VTFR Assessment'}
          totalSteps={(questionPayload?.solutionSteps || []).length}
          onRestart={() => fetchAvailableQuestions()}
        />
      </div>
    );
  }

  const solutionSteps = questionPayload?.solutionSteps || [];
  const activeStep = solutionSteps.find((s) => s.stepSequenceNo === currentStepNo) || solutionSteps[currentStepNo - 1];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
      {/* Question Selector Header Bar */}
      {questionsList.length > 1 && (
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0B2545] uppercase tracking-wider">
            <Layers className="w-4 h-4 text-[#0077B6]" />
            <span>Select Practice Question:</span>
          </div>
          <select
            value={selectedQuestionId || ''}
            onChange={(e) => initQuizSession(e.target.value)}
            className="w-full sm:w-auto bg-gray-50 border border-gray-300 text-gray-800 text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none focus:border-[#0077B6]"
          >
            {questionsList.map((q) => (
              <option key={q.id} value={q.id}>
                {q.grade} • {q.subject} - {q.topic} ({q.difficulty})
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {questionPayload && (
        <>
          {/* Main Question Card */}
          <div className="mkcl-card p-6 md:p-8 mb-6 border-l-4 border-l-[#0077B6]">
            {/* Category Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-50 text-[#0B2545] border border-blue-200">
                {questionPayload.grade}
              </span>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-sky-50 text-[#0077B6] border border-sky-200">
                {questionPayload.subject}
              </span>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                {questionPayload.chapter}
              </span>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 ml-auto">
                {questionPayload.difficultyTag || 'Medium'} Difficulty
              </span>
            </div>

            {/* Main Question Text */}
            <h1 className="text-xl md:text-2xl font-bold text-[#0B2545] leading-relaxed mb-3">
              <LatexRenderer content={questionPayload.questionText} />
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Topic: <span className="text-[#0077B6] font-semibold">{questionPayload.topic}</span> • Bloom's Level: <span className="text-purple-700 font-semibold">{questionPayload.bloomsLevel || 'Apply'}</span>
            </p>
          </div>

          {/* Progress Bar Tracker */}
          <ProgressTracker
            currentStep={currentStepNo}
            totalSteps={solutionSteps.length}
            isAlternate={session?.isAlternate}
          />

          {/* Active Step Solution Card */}
          {activeStep && (
            <StepCard
              step={activeStep}
              currentStepNo={currentStepNo}
              totalSteps={solutionSteps.length}
              onSubmitOption={handleSubmitStepAnswer}
              isSubmitting={isSubmittingStep}
            />
          )}

          {/* Remedial Support Overlay Modal */}
          <RemedialModal
            isOpen={isRemedialOpen}
            onClose={() => setIsRemedialOpen(false)}
            explanation={remedialData?.explanation}
            relatedContent={remedialData?.relatedContent}
            hasAlternate={!!remedialData?.alternateQuestion}
            onLaunchAlternate={handleLaunchAlternateQuestion}
          />
        </>
      )}
    </div>
  );
}
