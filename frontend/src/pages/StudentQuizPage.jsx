import React, { useState, useEffect, useMemo } from 'react';
import { listQuestions, getSampleQuestions, getSampleQuestionByFilename } from '../services/questionService';
import { startSession, submitStepChoice, switchAlternateQuestion } from '../services/sessionService';
import LatexRenderer from '../components/math/LatexRenderer';
import RemedialModal from '../components/student/RemedialModal';
import ScoreCard from '../components/student/ScoreCard';
import ReasoningTreeFlow from '../components/student/ReasoningTreeFlow';
import { 
  BookOpen, 
  Sparkles, 
  AlertCircle, 
  RefreshCw, 
  Layers, 
  GraduationCap, 
  Target, 
  ChevronDown, 
  ArrowLeft, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  Play, 
  Check, 
  HelpCircle,
  Award,
  GitBranch
} from 'lucide-react';

const FALLBACK_STORED_QUESTIONS = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    questionText: 'What is the variance of the dataset {2, 4, 6, 8, 10}?',
    grade: 'Grade 10',
    subject: 'Mathematics',
    chapter: 'Probability & Statistics',
    topic: 'Measures of Dispersion (Statistics)',
    difficulty: 'Medium',
    bloomsLevel: 'Apply',
    calculationDraft: 'Mean = (2+4+6+8+10)/5 = 6. Deviations: -4, -2, 0, 2, 4. Squared deviations: 16, 4, 0, 4, 16. Sum = 40. Variance = 40/5 = 8.',
    optionsList: [
      { optionSequenceNo: 1, optionText: '8', isCorrect: true, explanation: 'Variance is the average of squared deviations from mean 6: (16 + 4 + 0 + 4 + 16)/5 = 8.' },
      { optionSequenceNo: 2, optionText: '4', isCorrect: false, explanation: 'Misconception: Took average deviations without squaring.' },
      { optionSequenceNo: 3, optionText: '10', isCorrect: false, explanation: 'Computational error in calculating mean.' },
      { optionSequenceNo: 4, optionText: '12', isCorrect: false, explanation: 'Incorrectly added range to mean.' }
    ],
    solutionSteps: [
      {
        stepSequenceNo: 1,
        stepText: 'What is the mean of the dataset {2, 4, 6, 8, 10}?',
        optionsList: [
          { optionSequenceNo: 1, optionText: '5', isCorrect: false },
          { optionSequenceNo: 2, optionText: '6', isCorrect: true },
          { optionSequenceNo: 3, optionText: '8', isCorrect: false },
          { optionSequenceNo: 4, optionText: '7', isCorrect: false }
        ]
      },
      {
        stepSequenceNo: 2,
        stepText: 'Given the mean is 6, what are the squared deviations from the mean for each data point?',
        optionsList: [
          { optionSequenceNo: 1, optionText: '1, 4, 9, 16, 25', isCorrect: false },
          { optionSequenceNo: 2, optionText: '4, 1, 0, 1, 4', isCorrect: false },
          { optionSequenceNo: 3, optionText: '16, 4, 0, 4, 16', isCorrect: true },
          { optionSequenceNo: 4, optionText: '25, 16, 9, 4, 1', isCorrect: false }
        ]
      }
    ]
  }
];

export default function StudentQuizPage({ initialQuestionId = null }) {
  // Stored questions pool
  const [storedQuestions, setStoredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View Mode: 'setup' (Stage 1) | 'exam' (Stage 2)
  const [viewMode, setViewMode] = useState('setup');

  // Cascading Selection derived strictly from stored questions
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);

  // Active Exam Session state
  const [session, setSession] = useState(null);
  const [questionPayload, setQuestionPayload] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Progressive Question Flow States:
  // 'main' -> 'step_1' -> 'step_2' ... -> 'flow_tree'
  const [activeStage, setActiveStage] = useState('main');
  const [selectedMainOption, setSelectedMainOption] = useState(null);
  const [stepSelections, setStepSelections] = useState({}); // { 1: optionSeqNo, 2: optionSeqNo }

  // Remedial Modal State
  const [isRemedialOpen, setIsRemedialOpen] = useState(false);
  const [remedialData, setRemedialData] = useState(null);

  // Initial Data Fetch
  useEffect(() => {
    loadStoredQuestions();
  }, []);

  const loadStoredQuestions = async () => {
    setLoading(true);
    let allItems = [];

    // 1. Fetch from Backend Database
    try {
      const dbRes = await listQuestions();
      if (dbRes?.questions && Array.isArray(dbRes.questions)) {
        const dbItems = dbRes.questions.map((q) => {
          const payload = q.json_payload || {};
          return {
            id: q.id || payload.questionId,
            questionText: q.question_text || q.questionText || payload.questionText || 'Question prompt text',
            grade: q.grade || payload.grade || 'Grade 10',
            subject: q.subject || payload.subject || 'Mathematics',
            chapter: q.chapter || payload.chapter || 'Core Curriculum',
            topic: q.topic || payload.topic || 'General Topic',
            difficulty: q.difficulty || payload.difficultyTag || 'Medium',
            bloomsLevel: q.blooms_level || q.bloomsLevel || payload.bloomsLevel || 'Apply',
            optionsList: payload.optionsList || [],
            solutionSteps: payload.solutionSteps || [],
            calculationDraft: payload.calculationDraft || '',
            rawPayload: payload
          };
        });
        allItems = [...dbItems];
      }
    } catch (e) {
      console.warn('DB questions fetch error:', e);
    }

    // 2. Fetch Sample Files
    try {
      const sampleRes = await getSampleQuestions();
      if (sampleRes?.samples && Array.isArray(sampleRes.samples)) {
        const samplePromises = sampleRes.samples.map(async (s) => {
          try {
            let p = s.payload;
            if (!p) {
              const detail = await getSampleQuestionByFilename(s.filename);
              p = detail?.question || detail?.data || {};
            }
            return {
              id: s.filename ? `sample-${s.filename}` : (p.questionId || `sample-${Math.random().toString(36).substr(2, 9)}`),
              filename: s.filename,
              questionText: p.questionText || s.questionText || s.topic,
              grade: p.grade || s.grade || 'Grade 10',
              subject: p.subject || s.subject || 'Mathematics',
              chapter: p.chapter || s.chapter || 'Core Curriculum',
              topic: p.topic || s.topic || 'General Topic',
              difficulty: p.difficultyTag || s.difficulty || 'Medium',
              bloomsLevel: p.bloomsLevel || s.bloomsLevel || 'Apply',
              optionsList: p.optionsList || [],
              solutionSteps: p.solutionSteps || [],
              calculationDraft: p.calculationDraft || '',
              rawPayload: p
            };
          } catch {
            return null;
          }
        });
        const resolved = (await Promise.all(samplePromises)).filter(Boolean);
        allItems = [...allItems, ...resolved];
      }
    } catch (e) {
      console.warn('Sample questions fetch error:', e);
    }

    // 3. Fallback if empty
    if (allItems.length === 0) {
      allItems = FALLBACK_STORED_QUESTIONS;
    }

    setStoredQuestions(allItems);

    // Initialize cascading selection from stored questions
    const grades = [...new Set(allItems.map((q) => q.grade).filter(Boolean))].sort();
    if (grades.length > 0) {
      const firstGrade = grades[0];
      setSelectedGrade(firstGrade);

      const subjects = [...new Set(allItems.filter((q) => q.grade === firstGrade).map((q) => q.subject).filter(Boolean))].sort();
      const firstSubject = subjects[0] || '';
      setSelectedSubject(firstSubject);

      const chapters = [...new Set(allItems.filter((q) => q.grade === firstGrade && q.subject === firstSubject).map((q) => q.chapter).filter(Boolean))].sort();
      const firstChapter = chapters[0] || '';
      setSelectedChapter(firstChapter);

      const topics = [...new Set(allItems.filter((q) => q.grade === firstGrade && q.subject === firstSubject && q.chapter === firstChapter).map((q) => q.topic).filter(Boolean))].sort();
      const firstTopic = topics[0] || '';
      setSelectedTopic(firstTopic);
    }

    setLoading(false);
  };

  // 1. Available Grades derived strictly from stored questions
  const availableGrades = useMemo(() => {
    return [...new Set(storedQuestions.map((q) => q.grade).filter(Boolean))].sort();
  }, [storedQuestions]);

  // 2. Available Subjects for selected Grade
  const availableSubjects = useMemo(() => {
    if (!selectedGrade) return [];
    return [...new Set(
      storedQuestions
        .filter((q) => q.grade === selectedGrade)
        .map((q) => q.subject)
        .filter(Boolean)
    )].sort();
  }, [storedQuestions, selectedGrade]);

  // 3. Available Chapters for selected Grade + Subject
  const availableChapters = useMemo(() => {
    if (!selectedGrade || !selectedSubject) return [];
    return [...new Set(
      storedQuestions
        .filter((q) => q.grade === selectedGrade && q.subject === selectedSubject)
        .map((q) => q.chapter)
        .filter(Boolean)
    )].sort();
  }, [storedQuestions, selectedGrade, selectedSubject]);

  // 4. Available Topics for selected Grade + Subject + Chapter
  const availableTopics = useMemo(() => {
    if (!selectedGrade || !selectedSubject || !selectedChapter) return [];
    return [...new Set(
      storedQuestions
        .filter((q) => q.grade === selectedGrade && q.subject === selectedSubject && q.chapter === selectedChapter)
        .map((q) => q.topic)
        .filter(Boolean)
    )].sort();
  }, [storedQuestions, selectedGrade, selectedSubject, selectedChapter]);

  // 5. Matched Questions
  const matchedQuestions = useMemo(() => {
    if (!selectedGrade || !selectedSubject || !selectedChapter || !selectedTopic) return [];
    return storedQuestions.filter(
      (q) =>
        q.grade === selectedGrade &&
        q.subject === selectedSubject &&
        q.chapter === selectedChapter &&
        q.topic === selectedTopic
    );
  }, [storedQuestions, selectedGrade, selectedSubject, selectedChapter, selectedTopic]);

  const activePreviewQuestion = matchedQuestions[selectedQuestionIndex] || matchedQuestions[0] || null;

  // Cascading Selection Handlers
  const handleGradeChange = (newGrade) => {
    setSelectedGrade(newGrade);
    const subjs = [...new Set(storedQuestions.filter((q) => q.grade === newGrade).map((q) => q.subject).filter(Boolean))].sort();
    const nextSubj = subjs[0] || '';
    setSelectedSubject(nextSubj);

    const chaps = [...new Set(storedQuestions.filter((q) => q.grade === newGrade && q.subject === nextSubj).map((q) => q.chapter).filter(Boolean))].sort();
    const nextChap = chaps[0] || '';
    setSelectedChapter(nextChap);

    const tops = [...new Set(storedQuestions.filter((q) => q.grade === newGrade && q.subject === nextSubj && q.chapter === nextChap).map((q) => q.topic).filter(Boolean))].sort();
    const nextTop = tops[0] || '';
    setSelectedTopic(nextTop);

    setSelectedQuestionIndex(0);
  };

  const handleSubjectChange = (newSubj) => {
    setSelectedSubject(newSubj);
    const chaps = [...new Set(storedQuestions.filter((q) => q.grade === selectedGrade && q.subject === newSubj).map((q) => q.chapter).filter(Boolean))].sort();
    const nextChap = chaps[0] || '';
    setSelectedChapter(nextChap);

    const tops = [...new Set(storedQuestions.filter((q) => q.grade === selectedGrade && q.subject === newSubj && q.chapter === nextChap).map((q) => q.topic).filter(Boolean))].sort();
    const nextTop = tops[0] || '';
    setSelectedTopic(nextTop);

    setSelectedQuestionIndex(0);
  };

  const handleChapterChange = (newChap) => {
    setSelectedChapter(newChap);
    const tops = [...new Set(storedQuestions.filter((q) => q.grade === selectedGrade && q.subject === selectedSubject && q.chapter === newChap).map((q) => q.topic).filter(Boolean))].sort();
    const nextTop = tops[0] || '';
    setSelectedTopic(nextTop);

    setSelectedQuestionIndex(0);
  };

  const handleTopicChange = (newTop) => {
    setSelectedTopic(newTop);
    setSelectedQuestionIndex(0);
  };

  // Live Timer Effect for Exam Mode
  useEffect(() => {
    let interval = null;
    if (viewMode === 'exam' && session?.status !== 'completed') {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [viewMode, session?.status]);

  const formatTimer = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Start Exam Session
  const handleStartExam = async () => {
    if (!activePreviewQuestion) return;
    try {
      setLoading(true);
      setError(null);
      await initQuizSession(activePreviewQuestion.id);
      setViewMode('exam');
      setActiveStage('main');
      setSelectedMainOption(null);
      setStepSelections({});
      setTimerSeconds(0);
    } catch (err) {
      setError('Failed to start exam session.');
    } finally {
      setLoading(false);
    }
  };

  const initQuizSession = async (qId) => {
    try {
      setLoading(true);
      setError(null);
      const sessionRes = await startSession({
        questionId: qId,
        studentName: 'Interactive Student',
        studentGrade: selectedGrade
      });
      setSession(sessionRes);
      setQuestionPayload(sessionRes.question);
      setIsRemedialOpen(false);
    } catch (err) {
      // Robust Fallback: load question directly from stored questions
      const found = storedQuestions.find((q) => q.id === qId);
      if (found) {
        setSession({
          sessionId: `local-${Math.random().toString(36).substr(2, 9)}`,
          status: 'in_progress',
          currentStep: 1,
          question: found.rawPayload || found
        });
        setQuestionPayload(found.rawPayload || found);
      } else {
        setError(err.response?.data?.detail || 'Failed to start quiz session.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Switch to Alternate Question upon misconception
  const handleLaunchAlternateQuestion = async () => {
    if (!session || !session.sessionId) return;
    try {
      setLoading(true);
      setIsRemedialOpen(false);
      const altRes = await switchAlternateQuestion({
        sessionId: session.sessionId,
        altQuestionIndex: 0
      });
      setQuestionPayload(altRes.questionPayload);
      setActiveStage('main');
      setSelectedMainOption(null);
      setStepSelections({});
      setSession((prev) => ({ ...prev, isAlternate: true, status: 'in_progress' }));
    } catch (err) {
      setError('Failed to switch to alternate question.');
    } finally {
      setLoading(false);
    }
  };

  // Loading indicator for initial data
  if (loading && storedQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-9 h-9 text-[#2563EB] animate-spin" />
        <p className="text-gray-600 font-semibold text-sm">Loading Stored Questions Bank...</p>
      </div>
    );
  }

  // Completed Session Screen
  if (session?.status === 'completed') {
    return (
      <ScoreCard
        question={questionPayload}
        questionTopic={questionPayload?.topic || selectedTopic || 'VTFR Assessment'}
        selectedMainOption={selectedMainOption}
        stepSelections={stepSelections}
        timerSeconds={timerSeconds}
        onRestart={() => {
          setSession(null);
          setViewMode('setup');
          setSelectedMainOption(null);
          setStepSelections({});
        }}
        onReviewFlow={() => {
          setSession((prev) => ({ ...prev, status: 'in_progress' }));
          setActiveStage('flow_tree');
        }}
      />
    );
  }

  // =========================================================================
  // STAGE 1: SETUP PANEL (Student Practice Zone)
  // =========================================================================
  if (viewMode === 'setup') {
    return (
      <div className="student-practice-zone-wrapper">
        {/* Top Outer Banner */}
        <div className="student-outer-banner">
          <div className="student-outer-banner-content">
            <GraduationCap className="w-5 h-5 text-blue-500 shrink-0" />
            <span className="student-outer-banner-title">STUDENT PRACTICE ZONE</span>
            <span className="student-outer-banner-badge">VTFR Adaptive Learning</span>
          </div>
        </div>

        {/* Inner Main Card */}
        <div className="student-main-setup-card">
          {/* Card Header */}
          <div className="student-card-header">
            <div className="student-zone-pill">
              <span className="student-zone-pill-emoji">🎓</span>
              <span className="student-zone-pill-text">STUDENT ZONE</span>
            </div>
            <p className="student-zone-subtitle">
              Select from your saved questions bank to start an interactive assessment
            </p>
          </div>

          {error && (
            <div className="student-error-box">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: 3 Columns for Grade, Subject, Chapter */}
          <div className="student-selectors-3col">
            {/* 1. Class / Grade */}
            <div className="student-field-box">
              <label className="student-box-label">
                <span className="student-label-index">1.</span>
                <span>Class / Grade</span>
              </label>
              <div className="student-select-field">
                <select
                  value={selectedGrade}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  className="student-native-select"
                >
                  {availableGrades.map((g) => {
                    const count = storedQuestions.filter((q) => q.grade === g).length;
                    return (
                      <option key={g} value={g}>
                        {g} ({count} {count === 1 ? 'Q' : 'Qs'})
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="student-select-arrow" />
              </div>
            </div>

            {/* 2. Subject */}
            <div className="student-field-box">
              <label className="student-box-label">
                <span className="student-label-index">2.</span>
                <span>Subject</span>
              </label>
              <div className="student-select-field">
                <select
                  value={selectedSubject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="student-native-select"
                  disabled={availableSubjects.length === 0}
                >
                  {availableSubjects.map((s) => {
                    const count = storedQuestions.filter(
                      (q) => q.grade === selectedGrade && q.subject === s
                    ).length;
                    return (
                      <option key={s} value={s}>
                        {s} ({count} {count === 1 ? 'Q' : 'Qs'})
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="student-select-arrow" />
              </div>
            </div>

            {/* 3. Chapter */}
            <div className="student-field-box">
              <label className="student-box-label">
                <span className="student-label-index">3.</span>
                <span>Chapter</span>
              </label>
              <div className="student-select-field">
                <select
                  value={selectedChapter}
                  onChange={(e) => handleChapterChange(e.target.value)}
                  className="student-native-select"
                  disabled={availableChapters.length === 0}
                >
                  {availableChapters.map((c) => {
                    const count = storedQuestions.filter(
                      (q) =>
                        q.grade === selectedGrade &&
                        q.subject === selectedSubject &&
                        q.chapter === c
                    ).length;
                    return (
                      <option key={c} value={c}>
                        {c} ({count} {count === 1 ? 'Q' : 'Qs'})
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="student-select-arrow" />
              </div>
            </div>
          </div>

          {/* Row 2: Full-Width Topic (Scrollable) */}
          <div className="student-selectors-full">
            <div className="student-field-box">
              <label className="student-box-label">
                <span className="student-label-index">4.</span>
                <span>Topic (Scrollable)</span>
              </label>
              <div className="student-select-field">
                <select
                  value={selectedTopic}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  className="student-native-select student-topic-select"
                  disabled={availableTopics.length === 0}
                >
                  {availableTopics.map((t) => {
                    const count = storedQuestions.filter(
                      (q) =>
                        q.grade === selectedGrade &&
                        q.subject === selectedSubject &&
                        q.chapter === selectedChapter &&
                        q.topic === t
                    ).length;
                    return (
                      <option key={t} value={t}>
                        {t} — [{count} {count === 1 ? 'Question Available' : 'Questions Available'}]
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="student-select-arrow" />
              </div>
            </div>
          </div>

          {/* Selected Question Preview */}
          <div className="student-preview-container">
            <div className="student-preview-title-row">
              <span className="student-preview-label-text">Selected Question Preview:</span>
              {matchedQuestions.length > 1 && (
                <div className="student-variant-pill-box">
                  <span className="student-variant-label">Variant {selectedQuestionIndex + 1} of {matchedQuestions.length}:</span>
                  <select
                    value={selectedQuestionIndex}
                    onChange={(e) => setSelectedQuestionIndex(Number(e.target.value))}
                    className="student-variant-select"
                  >
                    {matchedQuestions.map((_, i) => (
                      <option key={i} value={i}>
                        Question {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {activePreviewQuestion ? (
              <div className="student-preview-card">
                <div className="student-preview-prompt-wrap">
                  <span className="student-prompt-emoji">📝</span>
                  <div className="student-prompt-body">
                    <LatexRenderer content={activePreviewQuestion.questionText} />
                  </div>
                </div>

                <div className="student-preview-meta-line">
                  <span className="student-meta-emoji">🏷️</span>
                  <span className="student-meta-segment">{activePreviewQuestion.grade}</span>
                  <span className="student-meta-sep">•</span>
                  <span className="student-meta-segment">{activePreviewQuestion.subject}</span>
                  <span className="student-meta-sep">•</span>
                  <span className="student-meta-segment badge-diff">{activePreviewQuestion.difficulty || 'Medium'} Difficulty</span>
                  <span className="student-meta-sep">•</span>
                  <span className="student-meta-segment badge-vtfr">VTFR Adaptive</span>
                  <span className="student-meta-sep">•</span>
                  <span className="student-meta-segment badge-steps">{(activePreviewQuestion.solutionSteps || []).length} Solution Steps</span>
                </div>
              </div>
            ) : (
              <div className="student-preview-empty">
                No question available for this selection. Please pick another topic.
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="student-footer-action-row">
            <div className="student-available-info">
              <span className="student-pulse-dot"></span>
              <span className="student-available-text">
                <strong>{matchedQuestions.length}</strong> {matchedQuestions.length === 1 ? 'Question' : 'Questions'} Ready in Selection Bank
              </span>
            </div>

            <button
              type="button"
              disabled={!activePreviewQuestion || loading}
              onClick={handleStartExam}
              className="student-start-exam-button"
            >
              <span>🚀 Start Practice Exam</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STAGE 2: PROGRESSIVE EXAM WORKSPACE
  // =========================================================================
  const solutionSteps = questionPayload?.solutionSteps || [];
  const currentStepNum = activeStage.startsWith('step_')
    ? parseInt(activeStage.replace('step_', ''), 10)
    : 0;
  const currentStepData = solutionSteps[currentStepNum - 1] || null;

  // Handlers for Progressive Navigation
  const handleGoToFirstStep = () => {
    if (solutionSteps.length > 0) {
      setActiveStage('step_1');
    } else {
      setActiveStage('flow_tree');
    }
  };

  const handleNextSolutionStep = () => {
    if (currentStepNum < solutionSteps.length) {
      setActiveStage(`step_${currentStepNum + 1}`);
    } else {
      setActiveStage('flow_tree');
    }
  };

  const handleSubmitAllAnswers = () => {
    // If multiple questions in topic, advance to next question
    if (selectedQuestionIndex + 1 < matchedQuestions.length) {
      const nextIdx = selectedQuestionIndex + 1;
      setSelectedQuestionIndex(nextIdx);
      const nextQ = matchedQuestions[nextIdx];
      initQuizSession(nextQ.id);
      setActiveStage('main');
      setSelectedMainOption(null);
      setStepSelections({});
    } else {
      // Completed all questions in topic
      setSession((prev) => ({ ...prev, status: 'completed' }));
    }
  };

  return (
    <div className="student-exam-wrapper">
      {/* Top Bar with Return button, Breadcrumb & Compact Top-Right Widget */}
      <div className="student-exam-topbar">
        <div className="student-exam-topbar-left">
          <button
            type="button"
            onClick={() => setViewMode('setup')}
            className="student-back-btn"
            title="Return to topic selection"
          >
            <ArrowLeft style={{ width: 14, height: 14 }} />
            <span>Change Topic</span>
          </button>

          <div className="student-breadcrumb">
            <span>{questionPayload?.grade || selectedGrade}</span>
            <span style={{ color: '#94A3B8' }}>•</span>
            <span>{questionPayload?.subject || selectedSubject}</span>
            <span style={{ color: '#94A3B8' }}>•</span>
            <span style={{ color: '#2563EB' }}>{questionPayload?.topic || selectedTopic}</span>
          </div>
        </div>

        {/* COMPACT TOP-RIGHT RECTANGULAR STATUS WIDGET */}
        <div className="compact-top-status-widget">
          <div className="compact-widget-row">
            <div className="compact-timer-box">
              <Clock style={{ width: 14, height: 14, color: '#D97706' }} />
              <span className="compact-timer-text">{formatTimer(timerSeconds)}</span>
            </div>
            <div className="compact-divider" />
            <div className="compact-step-tag">
              {activeStage === 'main'
                ? 'Main Question'
                : activeStage === 'flow_tree'
                ? 'Reasoning Flow'
                : `Step ${currentStepNum} of ${solutionSteps.length}`}
            </div>
          </div>

          {/* Mini Progress Track */}
          <div className="compact-step-track">
            <div
              className={`compact-dot ${
                activeStage === 'main' ? 'active' : selectedMainOption ? 'done' : ''
              }`}
              title="Main Question"
            >
              Q
            </div>

            {solutionSteps.map((s, idx) => {
              const stepN = s.stepSequenceNo || idx + 1;
              const isCur = activeStage === `step_${stepN}`;
              const isDone = !!stepSelections[stepN];
              return (
                <React.Fragment key={stepN}>
                  <div className="compact-track-line" />
                  <div
                    className={`compact-dot ${isCur ? 'active' : isDone ? 'done' : ''}`}
                    title={`Step ${stepN}`}
                  >
                    S{stepN}
                  </div>
                </React.Fragment>
              );
            })}

            <div className="compact-track-line" />
            <div
              className={`compact-dot ${
                activeStage === 'flow_tree' ? 'active done' : ''
              }`}
              title="Reasoning Flow"
            >
              <GitBranch style={{ width: 11, height: 11 }} />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* MIDDLE PROGRESSIVE QUESTION SOLVING AREA */}
      {questionPayload && (
        <div className="progressive-workspace">
          {/* ============================================================== */}
          {/* PART 1: MAIN QUESTION STATEMENT & ITS 4 OPTIONS                */}
          {/* ============================================================== */}
          {activeStage === 'main' && (
            <div className="progressive-card animate-fade-in-up">
              <div className="progressive-card-header">
                <span className="progressive-badge">
                  Question Statement • Adaptive VTFR
                </span>
                <span className="student-pill blue">
                  {questionPayload.difficultyTag || 'Medium'} Difficulty
                </span>
              </div>

              {/* Main Question Text */}
              <h2 className="progressive-prompt">
                <LatexRenderer content={questionPayload.questionText} />
              </h2>

              <p className="progressive-instruction">
                Please select your initial answer from the 4 options below:
              </p>

              {/* 4 Main Options Grid */}
              <div className="progressive-options-grid">
                {(questionPayload.optionsList || []).map((opt) => {
                  const isSelected = selectedMainOption === opt.optionSequenceNo;
                  const letter = String.fromCharCode(64 + opt.optionSequenceNo);

                  return (
                    <button
                      key={opt.optionSequenceNo}
                      type="button"
                      onClick={() => setSelectedMainOption(opt.optionSequenceNo)}
                      className={`progressive-option-item ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="progressive-option-letter">{letter}</div>
                      <div className="progressive-option-text">
                        <LatexRenderer content={opt.optionText} />
                      </div>
                      <div className="progressive-radio-ring">
                        {isSelected && <div className="progressive-radio-dot" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Right Solution Step Action Button */}
              <div className="progressive-actions-footer">
                <div className="progressive-hint">
                  {selectedMainOption === null ? (
                    <span>Select an option to proceed to the solution steps.</span>
                  ) : (
                    <span style={{ color: '#059669', fontWeight: 600 }}>
                      ✓ Option selected. Click next to begin step-by-step reasoning.
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={selectedMainOption === null}
                  onClick={handleGoToFirstStep}
                  className="progressive-next-btn"
                >
                  <span>
                    {solutionSteps.length > 0 ? 'Solution Step 1' : 'Submit Solution Steps'}
                  </span>
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* PART 2: SOLUTION STEPS (Step 1, Step 2, ...)                   */}
          {/* ============================================================== */}
          {activeStage.startsWith('step_') && currentStepData && (
            <div className="progressive-card animate-fade-in-up">
              {/* Previous Selection Context Pill */}
              <div className="progressive-context-banner">
                <span className="text-xs font-semibold text-gray-500">Main Question Choice:</span>
                <span className="font-bold text-gray-800 text-xs">
                  Option {String.fromCharCode(64 + (selectedMainOption || 1))}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-xs text-blue-600 font-semibold">
                  Scaffolded Step {currentStepNum} of {solutionSteps.length}
                </span>
              </div>

              <div className="progressive-card-header">
                <span className="progressive-badge purple">
                  Solution Step {currentStepNum} Reasoning
                </span>
                <span className="student-pill green">
                  Step {currentStepNum} of {solutionSteps.length}
                </span>
              </div>

              {/* Step Prompt Text */}
              <h3 className="progressive-prompt step">
                <LatexRenderer content={currentStepData.stepText} />
              </h3>

              <p className="progressive-instruction">
                Select your solution for Step {currentStepNum}:
              </p>

              {/* Step's 4 Options Grid */}
              <div className="progressive-options-grid">
                {(currentStepData.optionsList || []).map((opt) => {
                  const isSelected = stepSelections[currentStepNum] === opt.optionSequenceNo;
                  const letter = String.fromCharCode(64 + opt.optionSequenceNo);

                  return (
                    <button
                      key={opt.optionSequenceNo}
                      type="button"
                      onClick={() =>
                        setStepSelections((prev) => ({
                          ...prev,
                          [currentStepNum]: opt.optionSequenceNo
                        }))
                      }
                      className={`progressive-option-item ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="progressive-option-letter">{letter}</div>
                      <div className="progressive-option-text">
                        <LatexRenderer content={opt.optionText} />
                      </div>
                      <div className="progressive-radio-ring">
                        {isSelected && <div className="progressive-radio-dot" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Right Next Step / Submit Solution Steps Button */}
              <div className="progressive-actions-footer">
                <div className="progressive-hint">
                  {stepSelections[currentStepNum] === undefined ? (
                    <span>Select an option for Step {currentStepNum} to continue.</span>
                  ) : (
                    <span style={{ color: '#059669', fontWeight: 600 }}>
                      ✓ Step {currentStepNum} option selected.
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={stepSelections[currentStepNum] === undefined}
                  onClick={handleNextSolutionStep}
                  className="progressive-next-btn"
                >
                  {currentStepNum < solutionSteps.length ? (
                    <>
                      <span>Solution Step {currentStepNum + 1}</span>
                      <ArrowRight style={{ width: 16, height: 16 }} />
                    </>
                  ) : (
                    <>
                      <Sparkles style={{ width: 16, height: 16 }} />
                      <span>Submit Solution Steps</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* PART 3: COGNITIVE REASONING TREE / FLOW DIAGRAM                */}
          {/* ============================================================== */}
          {activeStage === 'flow_tree' && (
            <ReasoningTreeFlow
              question={questionPayload}
              selectedMainOption={selectedMainOption}
              solutionSteps={solutionSteps}
              stepSelections={stepSelections}
              onSubmitAll={handleSubmitAllAnswers}
              isLastQuestion={selectedQuestionIndex + 1 >= matchedQuestions.length}
            />
          )}

          {/* Remedial Modal for automatic scaffolded diagnostics */}
          <RemedialModal
            isOpen={isRemedialOpen}
            onClose={() => setIsRemedialOpen(false)}
            explanation={remedialData?.explanation}
            relatedContent={remedialData?.relatedContent}
            hasAlternate={!!remedialData?.alternateQuestion}
            onLaunchAlternate={handleLaunchAlternateQuestion}
          />
        </div>
      )}
    </div>
  );
}
