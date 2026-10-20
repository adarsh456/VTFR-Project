import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  FileText, 
  Lightbulb, 
  CheckCircle2, 
  Search, 
  ChevronDown, 
  RotateCcw, 
  GraduationCap, 
  Target, 
  BarChart2, 
  HelpCircle, 
  MoreVertical, 
  X, 
  Edit3, 
  Copy, 
  Download, 
  Upload, 
  Plus, 
  Check, 
  Layers, 
  Clock, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { listQuestions, getSampleQuestions, getSampleQuestionByFilename, getQuestionById, deleteQuestion } from '../../services/questionService';

import { 
  DEFAULT_GRADE_SYLLABUS, 
  getGrades, 
  getSubjectsForGrade, 
  getChaptersForSubject, 
  getTopicsForChapter,
  getAllUniqueSubjects 
} from '../../data/curriculumData';

export default function QuestionLibrary({ onNavigateToStudio }) {
  // Questions list state
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [previewTab, setPreviewTab] = useState('question'); // 'question' | 'details' | 'history'
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [activeListTab, setActiveListTab] = useState('all'); // 'all' | 'approved' | 'review'

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'difficulty' | 'grade' | 'topic'
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterChapter, setFilterChapter] = useState('all');
  const [filterTopic, setFilterTopic] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Active Row Action Menu ID
  const [openMenuId, setOpenMenuId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Delete Action & Confirmation State
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Close row actions dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.ql-row-menu-btn') && !e.target.closest('.ql-dropdown-menu')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Available Filter Options derived from syllabus
  const availableGrades = useMemo(() => getGrades(DEFAULT_GRADE_SYLLABUS), []);
  const availableSubjects = useMemo(() => {
    if (filterGrade && filterGrade !== 'all') {
      return getSubjectsForGrade(filterGrade, DEFAULT_GRADE_SYLLABUS);
    }
    return getAllUniqueSubjects(DEFAULT_GRADE_SYLLABUS);
  }, [filterGrade]);

  const availableChapters = useMemo(() => {
    if (filterGrade !== 'all' && filterSubject !== 'all') {
      return getChaptersForSubject(filterGrade, filterSubject, DEFAULT_GRADE_SYLLABUS);
    }
    return [];
  }, [filterGrade, filterSubject]);

  const availableTopics = useMemo(() => {
    if (filterGrade !== 'all' && filterSubject !== 'all' && filterChapter !== 'all') {
      return getTopicsForChapter(filterGrade, filterSubject, filterChapter, DEFAULT_GRADE_SYLLABUS);
    }
    return [];
  }, [filterGrade, filterSubject, filterChapter]);

  // Load questions from backend DB and fallback sample JSONs
  useEffect(() => {
    loadLibraryData();
  }, []);

  const loadLibraryData = async () => {
    setLoading(true);
    let allItems = [];

    // 1. Try fetching from Backend Database
    try {
      const dbRes = await listQuestions();
      if (dbRes?.questions && Array.isArray(dbRes.questions)) {
        const dbItems = dbRes.questions.map((q) => {
          const payload = q.json_payload || {};
          return {
            id: q.id || payload.questionId || `q-${Math.random().toString(36).substr(2, 9)}`,
            questionText: q.question_text || q.questionText || payload.questionText || 'Question prompt text',
            grade: q.grade || payload.grade || 'Grade 10',
            subject: q.subject || payload.subject || 'Mathematics',
            chapter: q.chapter || payload.chapter || 'Core Curriculum',
            topic: q.topic || payload.topic || 'General Topic',
            difficulty: q.difficulty || payload.difficultyTag || 'Medium',
            type: (q.blooms_level || q.bloomsLevel) ? 'Adaptive VTFR' : 'MCQ',
            status: 'Approved',
            updatedAt: (q.created_at || q.createdAt) ? new Date(q.created_at || q.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Oct 17, 2026',
            options: (payload.optionsList || []).map((opt, i) => ({
              id: String.fromCharCode(65 + i),
              text: opt.optionText,
              isCorrect: opt.isCorrect,
              explanation: opt.explanation || ''
            })),
            calculationDraft: payload.calculationDraft || '',
            solutionSteps: payload.solutionSteps || [],
            rawPayload: payload
          };
        });
        allItems = [...dbItems];
      }
    } catch (e) {
      console.log('No backend DB questions yet, loading sample items.');
    }

    // 2. Fetch Sample Files and enrich library
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
              topic: p.topic || s.topic,
              difficulty: p.difficultyTag || s.difficulty || 'Medium',
              type: 'Adaptive VTFR',
              status: 'Approved',
              updatedAt: 'Oct 17, 2026',
              options: (p.optionsList || []).map((opt, i) => ({
                id: String.fromCharCode(65 + i),
                text: opt.optionText,
                isCorrect: opt.isCorrect,
                explanation: opt.explanation || ''
              })),
              calculationDraft: p.calculationDraft || '',
              solutionSteps: p.solutionSteps || [],
              rawPayload: p
            };
          } catch {
            return null;
          }
        });

        const resolvedSamples = (await Promise.all(samplePromises)).filter(Boolean);
        allItems = [...allItems, ...resolvedSamples];
      }
    } catch (e) {
      console.log('Could not load sample question files:', e);
    }

    // 3. Built-in Fallback Items if DB and samples are empty
    if (allItems.length === 0) {
      allItems = [
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          questionText: 'What is the variance of the dataset {2, 4, 6, 8, 10}?',
          grade: 'Grade 10',
          subject: 'Mathematics',
          chapter: 'Probability & Statistics',
          topic: 'Measures of Dispersion',
          difficulty: 'Medium',
          type: 'Adaptive VTFR',
          status: 'Approved',
          updatedAt: 'Oct 17, 2026',
          options: [
            { id: 'A', text: '8', isCorrect: true, explanation: 'Deviations are -4,-2,0,2,4. Squared deviations: 16,4,0,4,16. Average is 40/5 = 8.' },
            { id: 'B', text: '4', isCorrect: false, explanation: '' },
            { id: 'C', text: '10', isCorrect: false, explanation: '' },
            { id: 'D', text: '12', isCorrect: false, explanation: '' }
          ],
          calculationDraft: 'Mean = (2+4+6+8+10)/5 = 6. Squared differences = 16,4,0,4,16. Sum = 40. Variance = 40/5 = 8.',
          solutionSteps: [
            { stepSequenceNo: 1, stepText: 'What is the mean of the dataset {2, 4, 6, 8, 10}?' },
            { stepSequenceNo: 2, stepText: 'What is the sum of the squared deviations from the mean?' }
          ]
        },
        {
          id: 'a89c201b-91cc-4372-b123-1f02b2c3d881',
          questionText: 'Which measure of dispersion is least affected by extreme outlier values?',
          grade: 'Grade 10',
          subject: 'Mathematics',
          chapter: 'Probability & Statistics',
          topic: 'Measures of Central Tendency',
          difficulty: 'Easy',
          type: 'MCQ',
          status: 'Approved',
          updatedAt: 'Oct 16, 2026',
          options: [
            { id: 'A', text: 'Median (and Interquartile Range)', isCorrect: true, explanation: 'Median is a robust statistic insensitive to outliers.' },
            { id: 'B', text: 'Arithmetic Mean', isCorrect: false, explanation: '' },
            { id: 'C', text: 'Standard Deviation', isCorrect: false, explanation: '' },
            { id: 'D', text: 'Total Range', isCorrect: false, explanation: '' }
          ],
          calculationDraft: 'Extreme values disproportionately stretch the range and arithmetic mean, while rank-based measures remain invariant.',
          solutionSteps: []
        },
        {
          id: 'b12c409a-11aa-4372-c456-2e02b2c3d992',
          questionText: 'Find the probability of rolling an even prime number on a fair standard six-sided die.',
          grade: 'Grade 10',
          subject: 'Mathematics',
          chapter: 'Probability & Statistics',
          topic: 'Probability',
          difficulty: 'Easy',
          type: 'Adaptive VTFR',
          status: 'Approved',
          updatedAt: 'Oct 15, 2026',
          options: [
            { id: 'A', text: '1/6', isCorrect: true, explanation: '2 is the only even prime number in {1,2,3,4,5,6}, so P = 1/6.' },
            { id: 'B', text: '1/2', isCorrect: false, explanation: '' },
            { id: 'C', text: '1/3', isCorrect: false, explanation: '' },
            { id: 'D', text: '0', isCorrect: false, explanation: '' }
          ],
          calculationDraft: 'Sample space S = {1, 2, 3, 4, 5, 6}. Even prime numbers = {2}. Desired count = 1. Probability = 1/6.',
          solutionSteps: []
        },
        {
          id: 'c34d512e-22bb-4372-d789-3f02b2c3d114',
          questionText: 'Calculate the standard deviation for the given discrete dataset: {5, 5, 5, 5, 5}.',
          grade: 'Grade 10',
          subject: 'Mathematics',
          chapter: 'Probability & Statistics',
          topic: 'Statistics',
          difficulty: 'Hard',
          type: 'MCQ',
          status: 'Approved',
          updatedAt: 'Oct 14, 2026',
          options: [
            { id: 'A', text: '0', isCorrect: true, explanation: 'Since all observations are identical to the mean 5, there is zero dispersion.' },
            { id: 'B', text: '5', isCorrect: false, explanation: '' },
            { id: 'C', text: '1', isCorrect: false, explanation: '' },
            { id: 'D', text: '25', isCorrect: false, explanation: '' }
          ],
          calculationDraft: 'Deviations from mean: (5-5) = 0 for all items. Standard deviation = sqrt(0) = 0.',
          solutionSteps: []
        },
        {
          id: 'd56e623f-33cc-4372-e012-4a02b2c3d225',
          questionText: 'Which of the following random variables represents a continuous probability distribution?',
          grade: 'Grade 10',
          subject: 'Mathematics',
          chapter: 'Probability & Statistics',
          topic: 'Probability Distributions',
          difficulty: 'Medium',
          type: 'MCQ',
          status: 'Approved',
          updatedAt: 'Oct 14, 2026',
          options: [
            { id: 'A', text: 'Time taken by students to complete an exam', isCorrect: true, explanation: 'Time can take any real value on a continuous interval.' },
            { id: 'B', text: 'Number of heads in 10 coin flips', isCorrect: false, explanation: '' },
            { id: 'C', text: 'Count of defective lightbulbs in a batch', isCorrect: false, explanation: '' },
            { id: 'D', text: 'Roll of a pair of dice', isCorrect: false, explanation: '' }
          ],
          calculationDraft: 'Continuous random variables are measured over continuous scale intervals rather than counted in discrete integer steps.',
          solutionSteps: []
        }
      ];
    }

    setQuestions(allItems);
    if (allItems.length > 0) {
      setSelectedQuestion(allItems[0]);
    }
    setLoading(false);
  };

  // Metric Computations
  const totalQuestionsCount = questions.length;
  const totalConceptsCount = useMemo(() => {
    const topics = new Set(questions.map((q) => q.topic).filter(Boolean));
    return topics.size || 156;
  }, [questions]);

  const approvedCount = useMemo(() => {
    return questions.filter((q) => q.status === 'Approved').length || totalQuestionsCount;
  }, [questions, totalQuestionsCount]);

  // Filtering and Search Logic
  const filteredQuestions = useMemo(() => {
    return questions.filter((item) => {
      // Tab Filter
      if (activeListTab === 'approved' && item.status !== 'Approved') return false;
      if (activeListTab === 'review' && item.status === 'Approved') return false;

      // Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesText = item.questionText?.toLowerCase().includes(q);
        const matchesTopic = item.topic?.toLowerCase().includes(q);
        const matchesChapter = item.chapter?.toLowerCase().includes(q);
        const matchesSubject = item.subject?.toLowerCase().includes(q);
        const matchesId = item.id?.toLowerCase().includes(q);
        if (!matchesText && !matchesTopic && !matchesChapter && !matchesSubject && !matchesId) {
          return false;
        }
      }

      // Hierarchy Filters
      if (filterGrade !== 'all' && item.grade !== filterGrade) return false;
      if (filterSubject !== 'all' && item.subject !== filterSubject) return false;
      if (filterChapter !== 'all' && item.chapter !== filterChapter) return false;
      if (filterTopic !== 'all' && item.topic !== filterTopic) return false;

      // Attribute Filters
      if (filterDifficulty !== 'all' && item.difficulty?.toLowerCase() !== filterDifficulty.toLowerCase()) return false;
      if (filterType !== 'all') {
        if (filterType === 'Adaptive VTFR' && !item.type?.includes('VTFR')) return false;
        if (filterType === 'MCQ' && item.type !== 'MCQ') return false;
      }
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'recent') return (b.id || '').localeCompare(a.id || '');
      if (sortBy === 'difficulty') {
        const order = { Easy: 1, Medium: 2, Hard: 3 };
        return (order[b.difficulty] || 2) - (order[a.difficulty] || 2);
      }
      if (sortBy === 'grade') return (a.grade || '').localeCompare(b.grade || '');
      if (sortBy === 'topic') return (a.topic || '').localeCompare(b.topic || '');
      return 0;
    });
  }, [
    questions, 
    activeListTab, 
    searchQuery, 
    filterGrade, 
    filterSubject, 
    filterChapter, 
    filterTopic, 
    filterDifficulty, 
    filterType, 
    filterStatus, 
    sortBy
  ]);

  // Paginated Slices
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / pageSize));
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  // Handle Checkbox Selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedQuestions.map((q) => q.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelectRow = (id, e) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterGrade('all');
    setFilterSubject('all');
    setFilterChapter('all');
    setFilterTopic('all');
    setFilterDifficulty('all');
    setFilterType('all');
    setFilterStatus('all');
    setSortBy('recent');
    setCurrentPage(1);
  };

  const handleCopyUUID = (uuid, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard?.writeText(uuid);
    setCopiedId(uuid);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJSON = async (question, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!question) return;

    try {
      let payload = question.rawPayload;

      // If rawPayload is missing or incomplete, attempt to fetch from backend
      if (!payload || !payload.questionText || !payload.optionsList || payload.optionsList.length === 0) {
        if (question.id && !String(question.id).startsWith('sample-')) {
          try {
            const res = await getQuestionById(question.id);
            if (res?.payload) payload = res.payload;
          } catch (err) {
            console.warn('Could not fetch question payload by ID:', err);
          }
        } else if (question.filename) {
          try {
            const detail = await getSampleQuestionByFilename(question.filename);
            payload = detail?.question || detail?.data;
          } catch (err) {
            console.warn('Could not fetch sample question payload:', err);
          }
        }
      }

      // If still not available, construct standard valid VTFR JSON structure from current question record
      if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
        payload = {
          questionId: question.id,
          questionType: 'vtfr_adaptive',
          bloomsLevel: question.type === 'Adaptive VTFR' ? 'Apply' : 'Remember',
          difficultyTag: question.difficulty || 'Medium',
          grade: question.grade || 'Grade 10',
          subject: question.subject || 'Mathematics',
          chapter: question.chapter || 'Core Curriculum',
          topic: question.topic || 'General Topic',
          questionText: question.questionText || '',
          calculationDraft: question.calculationDraft || '',
          optionsList: (question.options || []).map((opt, idx) => ({
            optionSequenceNo: idx + 1,
            optionText: opt.text || '',
            isCorrect: Boolean(opt.isCorrect),
            explanation: opt.explanation || ''
          })),
          solutionSteps: question.solutionSteps || [],
          alternateQuestions: [],
          relatedContent: null
        };
      }

      // Build safe filename: e.g. grade_10_mathematics_measures_of_dispersion_vtfr.json
      const parts = [
        question.grade,
        question.subject,
        question.topic || 'question'
      ]
        .filter(Boolean)
        .map((p) => String(p).toLowerCase().replace(/[^a-z0-9_-]/gi, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, ''));

      const filename = `${parts.join('_')}_vtfr.json`;

      // Download smoothly via Blob + createObjectURL
      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);

      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = blobUrl;
      downloadAnchor.download = filename;
      downloadAnchor.style.display = 'none';
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();

      setTimeout(() => {
        if (downloadAnchor.parentNode) {
          downloadAnchor.parentNode.removeChild(downloadAnchor);
        }
        URL.revokeObjectURL(blobUrl);
      }, 150);

      // Toast feedback
      setToastMessage(`Exported JSON for "${question.topic || question.questionText?.slice(0, 30) || 'Question'}"`);
      setTimeout(() => {
        setToastMessage((prev) => (prev ? null : prev));
      }, 3000);
    } catch (err) {
      console.error('Failed to export question JSON:', err);
      setToastMessage('Failed to export question JSON.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleConfirmDelete = async () => {
    if (!questionToDelete) return;
    setIsDeleting(true);
    const idToDelete = questionToDelete.id;

    try {
      await deleteQuestion(idToDelete);
    } catch (err) {
      console.warn('Backend delete notification/fallback:', err);
    }

    setQuestions((prevQuestions) => {
      const updated = prevQuestions.filter((q) => q.id !== idToDelete);
      if (selectedQuestion?.id === idToDelete) {
        setSelectedQuestion(updated.length > 0 ? updated[0] : null);
      }
      return updated;
    });

    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(idToDelete);
      return next;
    });

    setIsDeleting(false);
    setQuestionToDelete(null);

    setToastMessage('Question deleted successfully');
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };


  return (
    <div className="ql-container">
      {/* 1. Header Bar: Title, Subtitle, Import, + Add Question */}
      <div className="ql-header-row">
        <div className="ql-header-left">
          <div className="ql-header-icon-box">
            <FileText className="ql-header-icon" />
          </div>
          <div>
            <h1 className="ql-title">Question Library</h1>
            <p className="ql-subtitle">Organize, review, and reuse your generated questions and concepts.</p>
          </div>
        </div>

        <div className="ql-header-actions">
          <button 
            type="button" 
            className="ql-btn-secondary" 
            onClick={() => alert('Import Feature: Upload external VTFR JSON or CSV files into the library.')}
          >
            <Upload style={{ width: 15, height: 15 }} />
            <span>Import Questions</span>
          </button>

          <button 
            type="button" 
            className="ql-btn-primary"
            onClick={() => onNavigateToStudio && onNavigateToStudio()}
          >
            <Plus style={{ width: 16, height: 16 }} />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards: Total Questions, Total Concepts, Approved */}
      <div className="ql-metrics-grid">
        <div className="ql-metric-card">
          <div className="ql-metric-icon-box blue">
            <FileText style={{ width: 20, height: 20 }} />
          </div>
          <div className="ql-metric-text">
            <span className="ql-metric-label">Total Questions</span>
            <span className="ql-metric-value">{totalQuestionsCount.toLocaleString()}</span>
          </div>
        </div>

        <div className="ql-metric-card">
          <div className="ql-metric-icon-box purple">
            <Lightbulb style={{ width: 20, height: 20 }} />
          </div>
          <div className="ql-metric-text">
            <span className="ql-metric-label">Total Concepts</span>
            <span className="ql-metric-value">{totalConceptsCount.toLocaleString()}</span>
          </div>
        </div>

        <div className="ql-metric-card">
          <div className="ql-metric-icon-box green">
            <CheckCircle2 style={{ width: 20, height: 20 }} />
          </div>
          <div className="ql-metric-text">
            <span className="ql-metric-label">Approved</span>
            <span className="ql-metric-value">{approvedCount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 3. Search & Multi-Tier Filter Toolbar */}
      <div className="ql-filter-container">
        {/* Search Bar & Sort Dropdown Row */}
        <div className="ql-search-sort-row">
          <div className="ql-search-box">
            <Search className="ql-search-icon" />
            <input 
              type="text"
              placeholder="Search question, concept, topic, UUID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="ql-search-input"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="ql-clear-search-btn"
              >
                ✕
              </button>
            )}
          </div>

          <div className="ql-sort-box">
            <span className="ql-sort-label">Sort by</span>
            <div className="ql-select-wrapper sort">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="ql-select-input"
              >
                <option value="recent">Recently updated</option>
                <option value="difficulty">Difficulty Level</option>
                <option value="grade">Grade Level</option>
                <option value="topic">Topic Name</option>
              </select>
              <ChevronDown className="ql-select-chevron" />
            </div>
          </div>
        </div>

        {/* Row 1 Filters: Grade, Subject, Chapter, Topic */}
        <div className="ql-filters-grid-4">
          <div className="ql-filter-group">
            <label className="ql-filter-label">
              <GraduationCap /> Grade
            </label>
            <div className="ql-select-wrapper">
              <select 
                value={filterGrade} 
                onChange={(e) => {
                  setFilterGrade(e.target.value);
                  setFilterChapter('all');
                  setFilterTopic('all');
                  setCurrentPage(1);
                }}
                className="ql-select-input"
              >
                <option value="all">All Grades</option>
                {availableGrades.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <ChevronDown className="ql-select-chevron" />
            </div>
          </div>

          <div className="ql-filter-group">
            <label className="ql-filter-label">
              <BookOpen /> Subject
            </label>
            <div className="ql-select-wrapper">
              <select 
                value={filterSubject} 
                onChange={(e) => {
                  setFilterSubject(e.target.value);
                  setFilterChapter('all');
                  setFilterTopic('all');
                  setCurrentPage(1);
                }}
                className="ql-select-input"
              >
                <option value="all">All Subjects</option>
                {availableSubjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="ql-select-chevron" />
            </div>
          </div>

          <div className="ql-filter-group">
            <label className="ql-filter-label">
              <Layers /> Chapter
            </label>
            <div className="ql-select-wrapper">
              <select 
                value={filterChapter} 
                onChange={(e) => {
                  setFilterChapter(e.target.value);
                  setFilterTopic('all');
                  setCurrentPage(1);
                }}
                className="ql-select-input"
                disabled={availableChapters.length === 0}
              >
                <option value="all">All Chapters</option>
                {availableChapters.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="ql-select-chevron" />
            </div>
          </div>

          <div className="ql-filter-group">
            <label className="ql-filter-label">
              <Target /> Topic
            </label>
            <div className="ql-select-wrapper">
              <select 
                value={filterTopic} 
                onChange={(e) => {
                  setFilterTopic(e.target.value);
                  setCurrentPage(1);
                }}
                className="ql-select-input"
                disabled={availableTopics.length === 0}
              >
                <option value="all">All Topics</option>
                {availableTopics.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown className="ql-select-chevron" />
            </div>
          </div>
        </div>

        {/* Row 2 Filters: Difficulty, Type, Status, Clear Filters */}
        <div className="ql-filters-grid-4 row-secondary">
          <div className="ql-filter-group">
            <label className="ql-filter-label">
              <BarChart2 /> Difficulty
            </label>
            <div className="ql-select-wrapper">
              <select 
                value={filterDifficulty} 
                onChange={(e) => {
                  setFilterDifficulty(e.target.value);
                  setCurrentPage(1);
                }}
                className="ql-select-input"
              >
                <option value="all">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              <ChevronDown className="ql-select-chevron" />
            </div>
          </div>

          <div className="ql-filter-group">
            <label className="ql-filter-label">
              <HelpCircle /> Question Type
            </label>
            <div className="ql-select-wrapper">
              <select 
                value={filterType} 
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                className="ql-select-input"
              >
                <option value="all">All Types</option>
                <option value="Adaptive VTFR">Adaptive VTFR</option>
                <option value="MCQ">Standard MCQ</option>
              </select>
              <ChevronDown className="ql-select-chevron" />
            </div>
          </div>

          <div className="ql-filter-group">
            <label className="ql-filter-label">
              <CheckCircle2 /> Status
            </label>
            <div className="ql-select-wrapper">
              <select 
                value={filterStatus} 
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="ql-select-input"
              >
                <option value="all">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Review">In Review</option>
              </select>
              <ChevronDown className="ql-select-chevron" />
            </div>
          </div>

          <div className="ql-filter-group ql-clear-group">
            <button 
              type="button" 
              onClick={handleClearFilters}
              className="ql-clear-filters-btn"
            >
              <RotateCcw style={{ width: 14, height: 14 }} />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Sub-Navigation Tabs: All Questions, Approved */}
      <div className="ql-tabs-row">
        <div className="ql-tabs-left">
          <button 
            type="button" 
            className={`ql-tab-btn ${activeListTab === 'all' ? 'active' : ''}`}
            onClick={() => {
              setActiveListTab('all');
              setCurrentPage(1);
            }}
          >
            <span>All Questions</span>
            <span className="ql-tab-badge">{totalQuestionsCount}</span>
          </button>

          <button 
            type="button" 
            className={`ql-tab-btn ${activeListTab === 'approved' ? 'active' : ''}`}
            onClick={() => {
              setActiveListTab('approved');
              setCurrentPage(1);
            }}
          >
            <span>Approved</span>
            <span className="ql-tab-badge green">{approvedCount}</span>
          </button>
        </div>

        {!isDrawerOpen && selectedQuestion && (
          <button 
            type="button" 
            className="ql-btn-reopen-drawer"
            onClick={() => setIsDrawerOpen(true)}
          >
            <FileText style={{ width: 14, height: 14 }} />
            <span>Open Question Preview</span>
          </button>
        )}
      </div>

      {/* 5. Master-Detail Split Layout: Table (Left) + Inspector Drawer (Right) */}
      <div className="ql-split-layout">
        {/* Left Column: Data Table */}
        <div className={`ql-table-card ${!isDrawerOpen ? 'full-width' : ''}`}>
          <div className="ql-table-responsive">
            <table className="ql-table">
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={paginatedQuestions.length > 0 && paginatedQuestions.every(q => selectedIds.has(q.id))}
                      className="ql-checkbox"
                    />
                  </th>
                  <th style={{ minWidth: 260 }}>Question</th>
                  <th style={{ minWidth: 140 }}>Grade / Subject</th>
                  <th style={{ minWidth: 160 }}>Topic</th>
                  <th style={{ minWidth: 90 }}>Difficulty</th>
                  <th style={{ minWidth: 100 }}>Type</th>
                  <th style={{ minWidth: 100 }}>Status</th>
                  <th style={{ minWidth: 110 }}>Updated</th>
                  <th style={{ width: 50, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <Sparkles className="animate-spin" style={{ width: 18, height: 18, color: '#2563EB' }} />
                        <span>Loading Question Library...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedQuestions.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                      <p style={{ fontWeight: 600, fontSize: 14, color: '#334155' }}>No questions match your current filters.</p>
                      <button 
                        type="button" 
                        onClick={handleClearFilters}
                        style={{ marginTop: 8, padding: '6px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                      >
                        Reset All Filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  paginatedQuestions.map((q) => {
                    const isSelected = selectedQuestion?.id === q.id;
                    const isChecked = selectedIds.has(q.id);

                    return (
                      <tr 
                        key={q.id}
                        className={`ql-table-row ${isSelected ? 'active-row' : ''}`}
                        onClick={() => {
                          setSelectedQuestion(q);
                          setIsDrawerOpen(true);
                        }}
                      >
                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleToggleSelectRow(q.id, e)}
                            className="ql-checkbox"
                          />
                        </td>

                        {/* Question Text */}
                        <td>
                          <div className="ql-question-cell" title={q.questionText}>
                            <span className="ql-question-prompt">{q.questionText}</span>
                          </div>
                        </td>

                        {/* Grade / Subject */}
                        <td>
                          <div className="ql-grade-subject-cell">
                            <span className="ql-grade-tag">{q.grade}</span>
                            <span className="ql-dot-divider">•</span>
                            <span className="ql-subject-tag">{q.subject}</span>
                          </div>
                        </td>

                        {/* Topic */}
                        <td>
                          <span className="ql-topic-cell">{q.topic}</span>
                        </td>

                        {/* Difficulty Badge */}
                        <td>
                          <span className={`ql-badge-difficulty ${q.difficulty?.toLowerCase() || 'medium'}`}>
                            {q.difficulty}
                          </span>
                        </td>

                        {/* Type Badge */}
                        <td>
                          <span className="ql-badge-type">
                            {q.type}
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          <span className="ql-badge-status approved">
                            <span className="status-dot green" />
                            Approved
                          </span>
                        </td>

                        {/* Updated */}
                        <td>
                          <span className="ql-date-cell">{q.updatedAt}</span>
                        </td>

                        {/* Actions Menu */}
                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ position: 'relative' }}>
                            <button 
                              type="button" 
                              className="ql-row-menu-btn"
                              onClick={() => setOpenMenuId(openMenuId === q.id ? null : q.id)}
                            >
                              <MoreVertical style={{ width: 15, height: 15 }} />
                            </button>

                            {openMenuId === q.id && (
                              <div className="ql-dropdown-menu">
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    setSelectedQuestion(q);
                                    setIsDrawerOpen(true);
                                    setOpenMenuId(null);
                                  }}
                                  className="ql-dropdown-item"
                                >
                                  <FileText style={{ width: 13, height: 13 }} />
                                  <span>View Details</span>
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    handleCopyUUID(q.id);
                                    setOpenMenuId(null);
                                  }}
                                  className="ql-dropdown-item"
                                >
                                  <Copy style={{ width: 13, height: 13 }} />
                                  <span>Copy UUID</span>
                                </button>
                                <button 
                                  type="button" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExportJSON(q, e);
                                    setOpenMenuId(null);
                                  }}
                                  className="ql-dropdown-item"
                                >
                                  <Download style={{ width: 13, height: 13 }} />
                                  <span>Export JSON</span>
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    if (onNavigateToStudio) onNavigateToStudio(q);
                                    setOpenMenuId(null);
                                  }}
                                  className="ql-dropdown-item primary"
                                >
                                  <Edit3 style={{ width: 13, height: 13 }} />
                                  <span>Edit in Studio</span>
                                </button>
                                <div className="ql-dropdown-divider" />
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setQuestionToDelete(q);
                                  }}
                                  className="ql-dropdown-item danger"
                                >
                                  <Trash2 style={{ width: 13, height: 13 }} />
                                  <span>Delete Question</span>
                                </button>
                              </div>
                            )}
                          </div>

                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Bottom Pagination Bar */}
          <div className="ql-pagination-bar">
            <div className="ql-pagination-info">
              Showing {filteredQuestions.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} – {Math.min(currentPage * pageSize, filteredQuestions.length)} of {filteredQuestions.length.toLocaleString()}
            </div>

            <div className="ql-pagination-controls">
              <button 
                type="button" 
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="ql-page-arrow-btn"
              >
                <ChevronLeft style={{ width: 14, height: 14 }} />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button 
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`ql-page-num-btn ${currentPage === pageNum ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {totalPages > 5 && (
                <>
                  <span className="ql-page-ellipsis">...</span>
                  <button 
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    className={`ql-page-num-btn ${currentPage === totalPages ? 'active' : ''}`}
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button 
                type="button" 
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="ql-page-arrow-btn"
              >
                <ChevronRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Question Preview Drawer (~35% width) */}
        {isDrawerOpen && selectedQuestion && (
          <aside className="ql-preview-drawer">
            {/* Drawer Header */}
            <div className="ql-drawer-header">
              <div className="ql-drawer-header-left">
                <FileText className="ql-drawer-header-icon" />
                <h3 className="ql-drawer-title">Question Preview</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsDrawerOpen(false)}
                className="ql-drawer-close-btn"
                title="Close Drawer"
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {/* Sub-Tabs: Question, Details, History */}
            <div className="ql-drawer-tabs">
              <button 
                type="button" 
                className={`ql-drawer-tab ${previewTab === 'question' ? 'active' : ''}`}
                onClick={() => setPreviewTab('question')}
              >
                Question
              </button>
              <button 
                type="button" 
                className={`ql-drawer-tab ${previewTab === 'details' ? 'active' : ''}`}
                onClick={() => setPreviewTab('details')}
              >
                Details
              </button>
              <button 
                type="button" 
                className={`ql-drawer-tab ${previewTab === 'history' ? 'active' : ''}`}
                onClick={() => setPreviewTab('history')}
              >
                History
              </button>
            </div>

            {/* Drawer Body Scroll Area */}
            <div className="ql-drawer-body">
              {/* TAB 1: QUESTION */}
              {previewTab === 'question' && (
                <div className="ql-tab-content">
                  <div className="ql-drawer-question-box">
                    <p className="ql-drawer-prompt">{selectedQuestion.questionText}</p>

                    {/* Options List */}
                    <div className="ql-drawer-options-list">
                      {selectedQuestion.options.map((opt) => (
                        <div 
                          key={opt.id}
                          className={`ql-drawer-opt-item ${opt.isCorrect ? 'correct' : ''}`}
                        >
                          <div className={`ql-drawer-radio-ring ${opt.isCorrect ? 'active' : ''}`}>
                            {opt.isCorrect && <div className="ql-drawer-radio-dot" />}
                          </div>
                          <span className="ql-drawer-opt-label">
                            <strong>{opt.id}.</strong> &nbsp; {opt.text}
                          </span>
                          {opt.isCorrect && (
                            <span className="ql-correct-answer-pill">
                              <Check style={{ width: 11, height: 11 }} />
                              Correct Answer
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Metadata Chips Group */}
                  <div className="ql-drawer-meta-list">
                    <div className="ql-drawer-meta-row">
                      <span className="ql-drawer-meta-key">
                        <GraduationCap /> Grade
                      </span>
                      <span className="ql-drawer-meta-val">{selectedQuestion.grade}</span>
                    </div>

                    <div className="ql-drawer-meta-row">
                      <span className="ql-drawer-meta-key">
                        <BookOpen /> Subject
                      </span>
                      <span className="ql-drawer-meta-val">{selectedQuestion.subject}</span>
                    </div>

                    <div className="ql-drawer-meta-row">
                      <span className="ql-drawer-meta-key">
                        <Target /> Topic
                      </span>
                      <span className="ql-drawer-meta-val font-semibold">{selectedQuestion.topic}</span>
                    </div>

                    <div className="ql-drawer-meta-row">
                      <span className="ql-drawer-meta-key">
                        <BarChart2 /> Difficulty
                      </span>
                      <span className={`ql-badge-difficulty ${selectedQuestion.difficulty?.toLowerCase()}`}>
                        {selectedQuestion.difficulty}
                      </span>
                    </div>

                    <div className="ql-drawer-meta-row">
                      <span className="ql-drawer-meta-key">
                        <HelpCircle /> Type
                      </span>
                      <span className="ql-badge-type">{selectedQuestion.type}</span>
                    </div>

                    <div className="ql-drawer-meta-row">
                      <span className="ql-drawer-meta-key">
                        <CheckCircle2 /> Status
                      </span>
                      <span className="ql-badge-status approved">
                        <span className="status-dot green" />
                        Approved
                      </span>
                    </div>

                    <div className="ql-drawer-meta-row">
                      <span className="ql-drawer-meta-key">
                        <Clock /> UUID
                      </span>
                      <div className="ql-uuid-copy-box">
                        <span className="ql-uuid-text">{selectedQuestion.id.slice(0, 12)}...</span>
                        <button 
                          type="button" 
                          onClick={(e) => handleCopyUUID(selectedQuestion.id, e)}
                          className="ql-copy-btn"
                          title="Copy Full UUID"
                        >
                          {copiedId === selectedQuestion.id ? (
                            <Check style={{ width: 13, height: 13, color: '#10B981' }} />
                          ) : (
                            <Copy style={{ width: 13, height: 13 }} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="ql-drawer-meta-row">
                      <span className="ql-drawer-meta-key">
                        <Clock /> Updated
                      </span>
                      <span className="ql-drawer-meta-val">{selectedQuestion.updatedAt}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DETAILS */}
              {previewTab === 'details' && (
                <div className="ql-tab-content">
                  {selectedQuestion.calculationDraft ? (
                    <div className="ql-details-section">
                      <h4 className="ql-details-heading">Mathematical Derivation & Distractor Analysis</h4>
                      <div className="ql-details-box">
                        {selectedQuestion.calculationDraft}
                      </div>
                    </div>
                  ) : (
                    <div className="ql-details-section">
                      <p style={{ fontSize: 12, color: '#94A3B8' }}>No derivation draft recorded for this question.</p>
                    </div>
                  )}

                  {selectedQuestion.solutionSteps && selectedQuestion.solutionSteps.length > 0 && (
                    <div className="ql-details-section">
                      <h4 className="ql-details-heading">Scaffolded Solution Steps ({selectedQuestion.solutionSteps.length})</h4>
                      <div className="ql-steps-stack">
                        {selectedQuestion.solutionSteps.map((s, idx) => (
                          <div key={idx} className="ql-step-item">
                            <span className="ql-step-num">Step {s.stepSequenceNo || idx + 1}:</span>
                            <span className="ql-step-text">{s.stepText}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: HISTORY */}
              {previewTab === 'history' && (
                <div className="ql-tab-content">
                  <div className="ql-history-timeline">
                    <div className="ql-history-item">
                      <div className="ql-history-dot green" />
                      <div className="ql-history-info">
                        <span className="ql-history-title">Approved & Published</span>
                        <span className="ql-history-date">{selectedQuestion.updatedAt} by Teacher</span>
                      </div>
                    </div>
                    <div className="ql-history-item">
                      <div className="ql-history-dot blue" />
                      <div className="ql-history-info">
                        <span className="ql-history-title">Generated via VTFR Engine</span>
                        <span className="ql-history-date">{selectedQuestion.updatedAt} via AI Studio</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Bottom Action Buttons: Edit, Duplicate, Archive */}
            <div className="ql-drawer-footer">
              <button 
                type="button" 
                className="ql-footer-btn-edit"
                onClick={() => onNavigateToStudio && onNavigateToStudio(selectedQuestion)}
              >
                <Edit3 style={{ width: 14, height: 14 }} />
                <span>Edit</span>
              </button>

              <button 
                type="button" 
                className="ql-footer-btn-duplicate"
                onClick={() => {
                  const duplicated = {
                    ...selectedQuestion,
                    id: `copy-${Math.random().toString(36).substr(2, 9)}`,
                    questionText: `Copy of ${selectedQuestion.questionText}`,
                    updatedAt: 'Just now'
                  };
                  setQuestions([duplicated, ...questions]);
                  setSelectedQuestion(duplicated);
                  alert('Question duplicated successfully!');
                }}
              >
                <Copy style={{ width: 14, height: 14 }} />
                <span>Duplicate</span>
              </button>

              <button 
                type="button" 
                className="ql-footer-btn-export"
                onClick={(e) => handleExportJSON(selectedQuestion, e)}
                title="Download JSON Payload"
              >
                <Download style={{ width: 14, height: 14 }} />
              </button>

              <button 
                type="button" 
                className="ql-footer-btn-delete"
                onClick={() => setQuestionToDelete(selectedQuestion)}
                title="Delete Question"
              >
                <Trash2 style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {questionToDelete && (
        <div 
          className="ql-delete-modal-overlay" 
          onClick={() => !isDeleting && setQuestionToDelete(null)}
        >
          <div 
            className="ql-delete-modal-card" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ql-delete-modal-icon-header">
              <div className="ql-delete-icon-wrapper">
                <Trash2 className="ql-delete-modal-icon" />
              </div>
              <button 
                type="button" 
                className="ql-delete-modal-close" 
                onClick={() => !isDeleting && setQuestionToDelete(null)}
                disabled={isDeleting}
                title="Close dialog"
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <div className="ql-delete-modal-content">
              <h3 className="ql-delete-modal-title">Delete Question?</h3>
              <p className="ql-delete-modal-desc">
                Are you sure you want to permanently delete this question from your library? This action cannot be undone.
              </p>

              <div className="ql-delete-question-preview">
                <div className="ql-delete-preview-badge">
                  <span>{questionToDelete.grade}</span>
                  <span>•</span>
                  <span>{questionToDelete.subject}</span>
                  <span>•</span>
                  <span>{questionToDelete.topic}</span>
                </div>
                <p className="ql-delete-preview-text">
                  {questionToDelete.questionText}
                </p>
              </div>
            </div>

            <div className="ql-delete-modal-actions">
              <button 
                type="button" 
                className="ql-delete-cancel-btn"
                onClick={() => setQuestionToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="ql-delete-confirm-btn"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Sparkles className="animate-spin" style={{ width: 14, height: 14 }} />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 style={{ width: 14, height: 14 }} />
                    <span>Delete Question</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="ql-toast-notification">
          <CheckCircle2 style={{ width: 16, height: 16, color: '#10B981' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

