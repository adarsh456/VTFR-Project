import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronRight,
  Sparkles, 
  RotateCw, 
  Check, 
  MoreHorizontal, 
  GraduationCap, 
  BookOpen, 
  Target, 
  FileText, 
  BarChart2, 
  HelpCircle, 
  ArrowLeftRight, 
  Play, 
  Image as ImageIcon, 
  Globe,
  Copy, 
  Plus, 
  Minus, 
  Link as LinkIcon, 
  ArrowRight, 
  CheckCircle2, 
  X,
  Eye,
  Video,
  ExternalLink,
  Download,
  AlertCircle,
  FolderOpen,
  CheckCheck,
  Calculator
} from 'lucide-react';
import { getSyllabus, generateQuestion, getSampleQuestions, getSampleQuestionByFilename } from '../../services/questionService';
import { 
  DEFAULT_GRADE_SYLLABUS, 
  getGrades, 
  getSubjectsForGrade, 
  getChaptersForSubject, 
  getTopicsForChapter 
} from '../../data/curriculumData';

// Helper to resolve generated concept card images into live backend HTTP URLs
export const resolveConceptCardImageUrl = (imageResource, activeQ, fallbackTopic = '') => {
  const rawUrl = imageResource?.url;
  const topicName = activeQ?.metadata?.topic || activeQ?.topic || fallbackTopic || '';

  if (rawUrl && typeof rawUrl === 'string') {
    // If it's already an http/https URL pointing to /concept_cards or remote
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      if (rawUrl.includes('/static/concept_cards/card.png')) {
        const cleanTopic = topicName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        return `http://127.0.0.1:8000/concept_cards/${cleanTopic}_concept_card.png`;
      }
      return rawUrl;
    }
    // If it's a local filesystem path like "D:/.../concept_cards/filename.png"
    if (rawUrl.includes('concept_cards')) {
      const filename = rawUrl.split(/concept_cards[\\/]/).pop();
      if (filename) {
        return `http://127.0.0.1:8000/concept_cards/${encodeURIComponent(filename)}`;
      }
    }
    // If it ends with .png
    if (rawUrl.endsWith('.png') || rawUrl.endsWith('.jpg') || rawUrl.endsWith('.webp')) {
      const filename = rawUrl.split(/[\\/]/).pop();
      return `http://127.0.0.1:8000/concept_cards/${encodeURIComponent(filename)}`;
    }
  }

  // Fallback to topic name convention: {topic_clean}_concept_card.png
  if (topicName) {
    const cleanTopic = topicName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return `http://127.0.0.1:8000/concept_cards/${cleanTopic}_concept_card.png`;
  }

  return 'http://127.0.0.1:8000/concept_cards/standard_form_and_roots_concept_card.png';
};

// Fallback initial question loaded directly from generated_question/grade_10_mathematics_measures_of_dispersion_(statistics)_2.json
const INITIAL_VTFR_QUESTION = {
  "questionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "questionType": "vtfr_adaptive",
  "bloomsLevel": "Apply",
  "difficultyTag": "Medium",
  "grade": "Grade 10",
  "subject": "Mathematics",
  "chapter": "Probability & Statistics",
  "topic": "Measures of Dispersion (Statistics)",
  "questionText": "What is the variance of the dataset {2, 4, 6, 8, 10}?",
  "calculationDraft": "To find the variance of the dataset, we first need to find the mean. The mean is calculated as (2 + 4 + 6 + 8 + 10) / 5 = 30 / 5 = 6. Then, we calculate the deviations from the mean: (2-6), (4-6), (6-6), (8-6), (10-6) which are -4, -2, 0, 2, 4. The squared deviations are 16, 4, 0, 4, 16. The average of these squared deviations is (16 + 4 + 0 + 4 + 16) / 5 = 40 / 5 = 8. Thus, the variance is 8.\n\n• Distractor A (Computational Error): Incorrectly calculates the mean as 5, leading to incorrect deviations and a variance of 10.\n• Distractor B (Conceptual Misconception): Thinks variance is the average of the deviations, not the squared deviations, resulting in a variance of 0.\n• Distractor C (Partially Correct/Trap): Correctly calculates the mean but forgets to square the deviations, resulting in a variance of 4.",
  "optionsList": [
    { "optionSequenceNo": 1, "optionText": "8", "isCorrect": true, "explanation": "Variance is the average of squared deviations from mean 6: (16 + 4 + 0 + 4 + 16)/5 = 8." },
    { "optionSequenceNo": 2, "optionText": "4", "isCorrect": false, "explanation": "" },
    { "optionSequenceNo": 3, "optionText": "10", "isCorrect": false, "explanation": "" },
    { "optionSequenceNo": 4, "optionText": "12", "isCorrect": false, "explanation": "" }
  ],
  "solutionSteps": [
    {
      "stepSequenceNo": 1,
      "stepText": "What is the mean of the dataset {2, 4, 6, 8, 10}?",
      "optionsList": [
        { "optionSequenceNo": 1, "optionText": "5", "isCorrect": false },
        { "optionSequenceNo": 2, "optionText": "6", "isCorrect": true },
        { "optionSequenceNo": 3, "optionText": "8", "isCorrect": false },
        { "optionSequenceNo": 4, "optionText": "7", "isCorrect": false }
      ]
    },
    {
      "stepSequenceNo": 2,
      "stepText": "Given the mean is 6, what are the squared deviations from the mean for each data point?",
      "optionsList": [
        { "optionSequenceNo": 1, "optionText": "1, 4, 9, 16, 25", "isCorrect": false },
        { "optionSequenceNo": 2, "optionText": "4, 1, 0, 1, 4", "isCorrect": false },
        { "optionSequenceNo": 3, "optionText": "16, 4, 0, 4, 16", "isCorrect": true },
        { "optionSequenceNo": 4, "optionText": "25, 16, 9, 4, 1", "isCorrect": false }
      ]
    }
  ],
  "alternateQuestions": [
    {
      "questionId": "9b3e3c7d-4a4f-43e9-9d4a-1e02b2c3d480",
      "questionType": "vtfr_adaptive_alternate",
      "questionText": "What is the variance of the dataset {1, 3, 5}?",
      "calculationDraft": "For dataset {1, 3, 5}, mean = (1+3+5)/3 = 3. Deviations: -2, 0, 2. Squared deviations: 4, 0, 4. Variance = (4+0+4)/3 = 8/3.",
      "optionsList": [
        { "optionSequenceNo": 1, "optionText": "2", "isCorrect": false, "explanation": "" },
        { "optionSequenceNo": 2, "optionText": "4", "isCorrect": false, "explanation": "" },
        { "optionSequenceNo": 3, "optionText": "8/3", "isCorrect": true, "explanation": "Mean is 3; squared deviations are 4, 0, 4. Average = 8/3." },
        { "optionSequenceNo": 4, "optionText": "3", "isCorrect": false, "explanation": "" }
      ],
      "solutionSteps": [
        {
          "stepSequenceNo": 1,
          "stepText": "What is the mean of the dataset {1, 3, 5}?",
          "optionsList": [
            { "optionSequenceNo": 1, "optionText": "5", "isCorrect": false },
            { "optionSequenceNo": 2, "optionText": "4", "isCorrect": false },
            { "optionSequenceNo": 3, "optionText": "2", "isCorrect": false },
            { "optionSequenceNo": 4, "optionText": "3", "isCorrect": true }
          ]
        },
        {
          "stepSequenceNo": 2,
          "stepText": "Given the mean is 3, what are the squared deviations for each data point?",
          "optionsList": [
            { "optionSequenceNo": 1, "optionText": "9, 0, 1", "isCorrect": false },
            { "optionSequenceNo": 2, "optionText": "1, 4, 9", "isCorrect": false },
            { "optionSequenceNo": 3, "optionText": "4, 0, 4", "isCorrect": true },
            { "optionSequenceNo": 4, "optionText": "1, 0, 1", "isCorrect": false }
          ]
        }
      ]
    },
    {
      "questionId": "c48f2a1e-8b1c-42b7-8d9e-3f04c3d5e591",
      "questionType": "vtfr_adaptive_alternate",
      "questionText": "If the variance of a dataset is 16, what is its standard deviation?",
      "calculationDraft": "Standard deviation is the positive square root of variance: sqrt(16) = 4.",
      "optionsList": [
        { "optionSequenceNo": 1, "optionText": "4", "isCorrect": true, "explanation": "Standard deviation = sqrt(variance) = sqrt(16) = 4." },
        { "optionSequenceNo": 2, "optionText": "8", "isCorrect": false, "explanation": "" },
        { "optionSequenceNo": 3, "optionText": "256", "isCorrect": false, "explanation": "" },
        { "optionSequenceNo": 4, "optionText": "2", "isCorrect": false, "explanation": "" }
      ],
      "solutionSteps": [
        {
          "stepSequenceNo": 1,
          "stepText": "What is the mathematical relationship between standard deviation (σ) and variance (σ²)?",
          "optionsList": [
            { "optionSequenceNo": 1, "optionText": "σ = σ² / 2", "isCorrect": false },
            { "optionSequenceNo": 2, "optionText": "σ = √(Variance)", "isCorrect": true },
            { "optionSequenceNo": 3, "optionText": "σ = Variance²", "isCorrect": false },
            { "optionSequenceNo": 4, "optionText": "σ = 2 × Variance", "isCorrect": false }
          ]
        }
      ]
    },
    {
      "questionId": "e59a3b2f-9c2d-43c8-9e0f-4a05d4e6f602",
      "questionType": "vtfr_adaptive_alternate",
      "questionText": "Find the variance of the numbers {5, 5, 5, 5, 5}.",
      "calculationDraft": "Since all values in the dataset are identical, the mean is 5. Each deviation is 5 - 5 = 0, so the squared deviations are all 0. The variance is therefore 0.",
      "optionsList": [
        { "optionSequenceNo": 1, "optionText": "5", "isCorrect": false, "explanation": "" },
        { "optionSequenceNo": 2, "optionText": "1", "isCorrect": false, "explanation": "" },
        { "optionSequenceNo": 3, "optionText": "0", "isCorrect": true, "explanation": "Zero dispersion when all values are equal." },
        { "optionSequenceNo": 4, "optionText": "25", "isCorrect": false, "explanation": "" }
      ],
      "solutionSteps": [
        {
          "stepSequenceNo": 1,
          "stepText": "What are the deviations from the mean for a dataset with identical values?",
          "optionsList": [
            { "optionSequenceNo": 1, "optionText": "1", "isCorrect": false },
            { "optionSequenceNo": 2, "optionText": "0", "isCorrect": true },
            { "optionSequenceNo": 3, "optionText": "5", "isCorrect": false },
            { "optionSequenceNo": 4, "optionText": "-1", "isCorrect": false }
          ]
        }
      ]
    }
  ],
  "relatedContent": {
    "conceptSummary": "Measures of dispersion describe the spread of data points within a dataset. The variance is calculated as the average of the squared deviations from the arithmetic mean.",
    "youtubeResource": {
      "title": "Measures of Dispersion - Variance and Standard Deviation",
      "searchQuery": "Grade 10 Mathematics Measures of Dispersion Variance Standard Deviation tutorial",
      "url": "https://www.youtube.com/watch?v=a-5S15o_N7U"
    },
    "imageResource": {
      "title": "Variance Formula & 5-Panel Concept Card",
      "searchQuery": "Measures of Dispersion Variance formula chart diagram",
      "url": "http://127.0.0.1:8000/concept_cards/measures_of_dispersion_statistics_concept_card.png"
    },
    "pdfResource": {
      "title": "Measures of Dispersion Lecture Notes.pdf",
      "searchQuery": "Grade 10 Mathematics Measures of Dispersion revision notes pdf",
      "url": "https://lecture-notes.tiu.edu.iq/wp-content/uploads/2024/11/Lec-4-Measures-of-Dispersion-2024-25.pdf"
    },
    "webResource": {
      "title": "Understanding Variance in Statistics & Solved Examples",
      "searchQuery": "Measures of Dispersion Variance concept guide",
      "url": "https://learnlive.org/resources/measures-of-dispersion"
    }
  }
};

export default function AIQuestionStudio() {
  // Available Sample JSON files from generated_question folder
  const [sampleList, setSampleList] = useState([]);
  const [selectedSampleFile, setSelectedSampleFile] = useState('grade_10_mathematics_measures_of_dispersion_(statistics)_2.json');

  // Form State & Hierarchical Curriculum
  const [gradeSyllabus, setGradeSyllabus] = useState(DEFAULT_GRADE_SYLLABUS);
  const [grade, setGrade] = useState('Grade 10');
  const [subject, setSubject] = useState('Mathematics');
  const [chapter, setChapter] = useState('Probability & Statistics');
  const [topic, setTopic] = useState('Measures of Dispersion (Statistics)');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionType, setQuestionType] = useState('vtfr_adaptive');

  // Custom Curriculum Fields
  const [isCustomGrade, setIsCustomGrade] = useState(false);
  const [customGrade, setCustomGrade] = useState('');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [customSubject, setCustomSubject] = useState('');
  const [isCustomChapter, setIsCustomChapter] = useState(false);
  const [customChapter, setCustomChapter] = useState('');
  const [isCustomTopic, setIsCustomTopic] = useState(false);
  const [customTopic, setCustomTopic] = useState('');

  // Effective values used for synthesis and preview
  const effectiveGrade = isCustomGrade ? (customGrade.trim() || 'Custom Grade') : grade;
  const effectiveSubject = isCustomSubject ? (customSubject.trim() || 'Custom Subject') : subject;
  const effectiveChapter = isCustomChapter ? (customChapter.trim() || 'Custom Chapter') : chapter;
  const effectiveTopic = isCustomTopic ? (customTopic.trim() || 'Custom Topic') : topic;

  // Dynamic cascading option lists based on selected Grade -> Subject -> Chapter -> Topic
  const availableGrades = useMemo(() => {
    const list = getGrades(gradeSyllabus);
    if (grade && !list.includes(grade)) return [grade, ...list];
    return list;
  }, [gradeSyllabus, grade]);

  const availableSubjects = useMemo(() => {
    const list = getSubjectsForGrade(effectiveGrade, gradeSyllabus);
    if (subject && !list.includes(subject)) return [subject, ...list];
    return list;
  }, [gradeSyllabus, effectiveGrade, subject]);

  const availableChapters = useMemo(() => {
    const list = getChaptersForSubject(effectiveGrade, effectiveSubject, gradeSyllabus);
    if (chapter && !list.includes(chapter)) return [chapter, ...list];
    return list;
  }, [gradeSyllabus, effectiveGrade, effectiveSubject, chapter]);

  const availableTopics = useMemo(() => {
    const list = getTopicsForChapter(effectiveGrade, effectiveSubject, effectiveChapter, gradeSyllabus);
    if (topic && !list.includes(topic)) return [topic, ...list];
    return list;
  }, [gradeSyllabus, effectiveGrade, effectiveSubject, effectiveChapter, topic]);

  // Cascading change handlers
  const handleGradeChange = (newGrade) => {
    setGrade(newGrade);
    const subjList = getSubjectsForGrade(newGrade, gradeSyllabus);
    const nextSubj = subjList.includes(subject) ? subject : (subjList[0] || 'Mathematics');
    setSubject(nextSubj);

    const chapList = getChaptersForSubject(newGrade, nextSubj, gradeSyllabus);
    const nextChap = chapList.includes(chapter) ? chapter : (chapList[0] || 'General Chapter');
    setChapter(nextChap);

    const topList = getTopicsForChapter(newGrade, nextSubj, nextChap, gradeSyllabus);
    const nextTop = topList.includes(topic) ? topic : (topList[0] || 'Core Concepts');
    setTopic(nextTop);
  };

  const handleSubjectChange = (newSubj) => {
    setSubject(newSubj);
    const chapList = getChaptersForSubject(effectiveGrade, newSubj, gradeSyllabus);
    const nextChap = chapList.includes(chapter) ? chapter : (chapList[0] || 'General Chapter');
    setChapter(nextChap);

    const topList = getTopicsForChapter(effectiveGrade, newSubj, nextChap, gradeSyllabus);
    const nextTop = topList.includes(topic) ? topic : (topList[0] || 'Core Concepts');
    setTopic(nextTop);
  };

  const handleChapterChange = (newChap) => {
    setChapter(newChap);
    const topList = getTopicsForChapter(effectiveGrade, effectiveSubject, newChap, gradeSyllabus);
    const nextTop = topList.includes(topic) ? topic : (topList[0] || 'Core Concepts');
    setTopic(nextTop);
  };
  const [numQuestions, setNumQuestions] = useState(1);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [pipelineStep, setPipelineStep] = useState(1);

  // Preview Card State
  const [selectedOption, setSelectedOption] = useState('A');
  const [isSolutionOpen, setIsSolutionOpen] = useState(true);
  const [isCalculationDraftOpen, setIsCalculationDraftOpen] = useState(false);
  const [isAlternativesOpen, setIsAlternativesOpen] = useState(true);
  const [savedNotification, setSavedNotification] = useState(false);

  // Active Main Question State
  const [activeQuestion, setActiveQuestion] = useState(() => {
    const q = INITIAL_VTFR_QUESTION;
    return {
      id: q.questionId,
      text: q.questionText,
      calculationDraft: q.calculationDraft,
      solutionSteps: q.solutionSteps || [],
      options: (q.optionsList || []).map((opt, i) => ({
        id: String.fromCharCode(65 + i),
        sequenceNo: opt.optionSequenceNo || (i + 1),
        text: opt.optionText,
        isCorrect: opt.isCorrect,
        explanation: opt.explanation || ''
      })),
      metadata: {
        grade: q.grade,
        subject: q.subject,
        chapter: q.chapter,
        topic: q.topic,
        difficulty: q.difficultyTag,
        type: q.bloomsLevel || 'Apply'
      }
    };
  });

  // 3 Alternative Questions State
  const [alternativeQuestions, setAlternativeQuestions] = useState(() => {
    return (INITIAL_VTFR_QUESTION.alternateQuestions || []).map((alt, idx) => ({
      id: alt.questionId,
      badgeNum: `Q${idx + 1}`,
      title: `Alternative Question ${idx + 1}`,
      difficulty: alt.difficultyTag || 'Medium',
      topicTag: INITIAL_VTFR_QUESTION.topic,
      text: alt.questionText,
      calculationDraft: alt.calculationDraft || '',
      solutionSteps: alt.solutionSteps || [],
      options: (alt.optionsList || []).map((opt, i) => ({
        id: String.fromCharCode(65 + i),
        sequenceNo: opt.optionSequenceNo || (i + 1),
        text: opt.optionText,
        isCorrect: opt.isCorrect,
        explanation: opt.explanation || ''
      }))
    }));
  });

  // Related Remedial Content State
  const [relatedContent, setRelatedContent] = useState(INITIAL_VTFR_QUESTION.relatedContent);

  // Resource Modal State
  const [activeResourceModal, setActiveResourceModal] = useState(null);

  // Helper to load any raw JSON structure into UI state
  const loadVTFRJsonIntoState = (q) => {
    if (!q) return;

    // Update left panel controls if metadata is present
    if (q.grade) {
      setGrade(q.grade);
      setIsCustomGrade(false);
      setCustomGrade('');
    }
    if (q.subject) {
      setSubject(q.subject);
      setIsCustomSubject(false);
      setCustomSubject('');
    }
    if (q.chapter) {
      setChapter(q.chapter);
      setIsCustomChapter(false);
      setCustomChapter('');
    }
    if (q.topic) {
      setTopic(q.topic);
      setIsCustomTopic(false);
      setCustomTopic('');
    }
    if (q.difficultyTag) setDifficulty(q.difficultyTag);

    // Map Main Question
    const mappedOptions = (q.optionsList || []).map((opt, i) => ({
      id: String.fromCharCode(65 + i),
      sequenceNo: opt.optionSequenceNo || (i + 1),
      text: opt.optionText,
      isCorrect: opt.isCorrect,
      explanation: opt.explanation || ''
    }));

    setActiveQuestion({
      id: q.questionId || 'Q-' + Date.now(),
      text: q.questionText || '',
      calculationDraft: q.calculationDraft || '',
      solutionSteps: q.solutionSteps || [],
      options: mappedOptions,
      metadata: {
        grade: q.grade || effectiveGrade,
        subject: q.subject || effectiveSubject,
        chapter: q.chapter || effectiveChapter,
        topic: q.topic || effectiveTopic,
        difficulty: q.difficultyTag || difficulty,
        type: q.bloomsLevel || 'Apply'
      }
    });

    // Map Alternative Questions
    if (q.alternateQuestions && q.alternateQuestions.length > 0) {
      const mappedAlternatives = q.alternateQuestions.map((alt, idx) => ({
        id: alt.questionId || `Q${idx + 1}-${Date.now()}`,
        badgeNum: `Q${idx + 1}`,
        title: `Alternative Question ${idx + 1}`,
        difficulty: alt.difficultyTag || q.difficultyTag || 'Medium',
        topicTag: q.topic || topic,
        text: alt.questionText,
        calculationDraft: alt.calculationDraft || '',
        solutionSteps: alt.solutionSteps || [],
        options: (alt.optionsList || []).map((opt, i) => ({
          id: String.fromCharCode(65 + i),
          sequenceNo: opt.optionSequenceNo || (i + 1),
          text: opt.optionText,
          isCorrect: opt.isCorrect,
          explanation: opt.explanation || ''
        }))
      }));
      setAlternativeQuestions(mappedAlternatives);
    }

    // Map Related Remedial Content
    if (q.relatedContent) {
      const imgRes = q.relatedContent.imageResource || {};
      const resolvedImgUrl = resolveConceptCardImageUrl(imgRes, q, q.topic || topic);
      setRelatedContent({
        conceptSummary: q.relatedContent.conceptSummary || `Key concepts for ${q.topic || topic}.`,
        pdfResource: q.relatedContent.pdfResource || {
          title: `${q.topic || topic} Notes.pdf`,
          url: 'https://learnlive.org/resources/pdf/notes.pdf'
        },
        webResource: q.relatedContent.webResource || {
          title: `${q.topic || topic} Solved Reference`,
          url: 'https://learnlive.org/resources/article/guide'
        },
        imageResource: {
          title: imgRes.title || `${q.topic || topic} 5-Panel Concept Card`,
          url: resolvedImgUrl,
          searchQuery: imgRes.searchQuery || ''
        },
        youtubeResource: q.relatedContent.youtubeResource || {
          title: `${q.topic || topic} Video Tutorial`,
          url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q.topic || topic)
        }
      });
    }

    // Default select correct option or 'A'
    const correctOpt = mappedOptions.find(o => o.isCorrect);
    setSelectedOption(correctOpt ? correctOpt.id : 'A');
  };

  // Load sample list & backend curriculum on mount
  useEffect(() => {
    async function initStudioData() {
      try {
        const [sampleRes, syllabusRes] = await Promise.allSettled([
          getSampleQuestions(),
          getSyllabus()
        ]);
        if (sampleRes.status === 'fulfilled' && sampleRes.value?.samples?.length > 0) {
          setSampleList(sampleRes.value.samples);
        }
        if (syllabusRes.status === 'fulfilled' && syllabusRes.value?.grade_syllabus) {
          setGradeSyllabus((prev) => ({ ...prev, ...syllabusRes.value.grade_syllabus }));
        }
      } catch (err) {
        console.warn('Could not load studio initial data:', err);
      }
    }
    initStudioData();
  }, []);

  // Handle selecting a pre-generated sample question file
  const handleSelectSampleFile = async (filename) => {
    setSelectedSampleFile(filename);
    try {
      const res = await getSampleQuestionByFilename(filename);
      if (res && res.question) {
        loadVTFRJsonIntoState(res.question);
      }
    } catch (err) {
      console.error('Failed to load sample question JSON:', err);
    }
  };

  // Handle Promoting Alternative Question to Main Question
  const handleUseAlternative = (alt) => {
    const prevMain = { ...activeQuestion };
    
    // Set selected alternative question as main
    setActiveQuestion({
      id: alt.id,
      text: alt.text,
      calculationDraft: alt.calculationDraft || '',
      solutionSteps: alt.solutionSteps || [],
      options: alt.options,
      metadata: {
        ...activeQuestion.metadata,
        difficulty: alt.difficulty,
        topic: alt.topicTag
      }
    });

    // Replace promoted alternative with previous main
    setAlternativeQuestions((prev) => 
      prev.map((item) => {
        if (item.id === alt.id) {
          return {
            ...item,
            id: prevMain.id,
            text: prevMain.text,
            calculationDraft: prevMain.calculationDraft,
            solutionSteps: prevMain.solutionSteps,
            options: prevMain.options
          };
        }
        return item;
      })
    );

    const correctOpt = (alt.options || []).find(o => o.isCorrect);
    setSelectedOption(correctOpt ? correctOpt.id : 'A');
  };

  // Handle Live Generation
  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setPipelineStep(2); // Generation
    
    try {
      const res = await generateQuestion({
        grade: effectiveGrade,
        subject: effectiveSubject,
        chapter: effectiveChapter,
        topic: effectiveTopic,
        num_alternate_questions: 3
      });

      setPipelineStep(3); // Validation

      if (res && res.question) {
        loadVTFRJsonIntoState(res.question);
        setPipelineStep(4); // Database
      }
    } catch (e) {
      console.error('VTFR Generation Error:', e);
      let errMsg = e.response?.data?.detail || e.message || 'Generation failed. Please retry.';
      if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
        errMsg = 'The generation process exceeded the time limit (>3 mins). Complex multi-step reasoning may take longer; please try again.';
      } else if (e.message?.includes('Network Error') || !e.response) {
        errMsg = 'Could not connect to FastAPI backend on http://127.0.0.1:8000. Please start the backend server: python -m uvicorn backend.app.main:app --port 8000';
      }
      setGenerationError(errMsg);
      setPipelineStep(1);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToDatabase = () => {
    setSavedNotification(true);
    setPipelineStep(5); // Delivery
    setTimeout(() => setSavedNotification(false), 3000);
  };

  return (
    <div className="workspace-canvas">
      {/* Two-Column Studio Layout */}
      <div className="studio-grid">
        
        {/* ========================================================================= */}
        {/* 2. LEFT COLUMN: Question Generation Form & Reference Loader */}
        {/* ========================================================================= */}
        <div className="qg-card">
          <div className="qg-header">
            <div className="qg-number-circle">1</div>
            <div>
              <h2 className="qg-title">Question Generation</h2>
              <p className="qg-subtitle">Set curriculum parameters or load pre-generated items</p>
            </div>
          </div>

          {/* Quick Pre-Generated JSON Reference Selector */}
          {sampleList.length > 0 && (
            <div style={{ padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', display: 'flex', alignItems: 'center', gap: 5 }}>
                <FolderOpen style={{ width: 13, height: 13 }} /> Load Reference VTFR JSON File:
              </label>
              <div className="select-wrapper">
                <select 
                  value={selectedSampleFile} 
                  onChange={(e) => handleSelectSampleFile(e.target.value)}
                  className="select-input"
                  style={{ fontSize: 11, padding: '5px 20px 5px 8px', height: 'auto' }}
                >
                  {sampleList.map((s) => (
                    <option key={s.filename} value={s.filename}>
                      {s.subject} ({s.grade}): {s.topic}
                    </option>
                  ))}
                </select>
                <ChevronDown className="select-chevron" style={{ width: 12, height: 12 }} />
              </div>
            </div>
          )}

          {/* Error Banner if any */}
          {generationError && (
            <div style={{ padding: '8px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span>{generationError}</span>
            </div>
          )}

          {/* Row 1: Grade & Subject */}
          <div className="two-col-row">
            {/* Grade Select */}
            <div className="form-group">
              <label className="qg-field-label">
                <GraduationCap /> Grade
              </label>
              <div className="select-wrapper">
                <select 
                  value={isCustomGrade ? '__custom__' : grade} 
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomGrade(true);
                      if (!customGrade) setCustomGrade('');
                    } else {
                      setIsCustomGrade(false);
                      handleGradeChange(e.target.value);
                    }
                  }} 
                  className="select-input"
                  style={isCustomGrade ? { borderColor: '#2563EB', backgroundColor: '#F0F9FF' } : {}}
                >
                  {availableGrades.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                  <option value="__custom__">Custom Grade</option>
                </select>
                <ChevronDown className="select-chevron" />
              </div>
              {isCustomGrade && (
                <div style={{ marginTop: 5, position: 'relative' }}>
                  <input
                    type="text"
                    value={customGrade}
                    onChange={(e) => setCustomGrade(e.target.value)}
                    placeholder="Enter custom grade (e.g., Grade 8, B.Sc 1st Year)..."
                    style={{
                      width: '100%',
                      backgroundColor: '#FFFFFF',
                      border: '1.5px solid #2563EB',
                      borderRadius: 6,
                      padding: '5px 22px 5px 8px',
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: '#0F172A',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                    autoFocus
                  />
                  {customGrade && (
                    <button
                      type="button"
                      onClick={() => setCustomGrade('')}
                      style={{
                        position: 'absolute',
                        right: 6,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        fontSize: 11,
                        lineHeight: 1
                      }}
                      title="Clear"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Subject Select */}
            <div className="form-group">
              <label className="qg-field-label">
                <BookOpen /> Subject
              </label>
              <div className="select-wrapper">
                <select 
                  value={isCustomSubject ? '__custom__' : subject} 
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomSubject(true);
                      if (!customSubject) setCustomSubject('');
                    } else {
                      setIsCustomSubject(false);
                      handleSubjectChange(e.target.value);
                    }
                  }} 
                  className="select-input"
                  style={isCustomSubject ? { borderColor: '#2563EB', backgroundColor: '#F0F9FF' } : {}}
                >
                  {availableSubjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="__custom__">Custom Subject</option>
                </select>
                <ChevronDown className="select-chevron" />
              </div>
              {isCustomSubject && (
                <div style={{ marginTop: 5, position: 'relative' }}>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Enter custom subject (e.g., Data Science, Robotics)..."
                    style={{
                      width: '100%',
                      backgroundColor: '#FFFFFF',
                      border: '1.5px solid #2563EB',
                      borderRadius: 6,
                      padding: '5px 22px 5px 8px',
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: '#0F172A',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                    autoFocus
                  />
                  {customSubject && (
                    <button
                      type="button"
                      onClick={() => setCustomSubject('')}
                      style={{
                        position: 'absolute',
                        right: 6,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        fontSize: 11,
                        lineHeight: 1
                      }}
                      title="Clear"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Chapter & Topic */}
          <div className="two-col-row">
            {/* Chapter Select */}
            <div className="form-group">
              <label className="qg-field-label">
                <FileText /> Chapter
              </label>
              <div className="select-wrapper">
                <select 
                  value={isCustomChapter ? '__custom__' : chapter} 
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomChapter(true);
                      if (!customChapter) setCustomChapter('');
                    } else {
                      setIsCustomChapter(false);
                      handleChapterChange(e.target.value);
                    }
                  }} 
                  className="select-input"
                  style={isCustomChapter ? { borderColor: '#2563EB', backgroundColor: '#F0F9FF' } : {}}
                >
                  {availableChapters.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="__custom__">Custom Chapter</option>
                </select>
                <ChevronDown className="select-chevron" />
              </div>
              {isCustomChapter && (
                <div style={{ marginTop: 5, position: 'relative' }}>
                  <input
                    type="text"
                    value={customChapter}
                    onChange={(e) => setCustomChapter(e.target.value)}
                    placeholder="Enter custom chapter (e.g., Thermodynamics, Calculus)..."
                    style={{
                      width: '100%',
                      backgroundColor: '#FFFFFF',
                      border: '1.5px solid #2563EB',
                      borderRadius: 6,
                      padding: '5px 22px 5px 8px',
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: '#0F172A',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                    autoFocus
                  />
                  {customChapter && (
                    <button
                      type="button"
                      onClick={() => setCustomChapter('')}
                      style={{
                        position: 'absolute',
                        right: 6,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        fontSize: 11,
                        lineHeight: 1
                      }}
                      title="Clear"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Topic Select */}
            <div className="form-group">
              <label className="qg-field-label">
                <Target /> Topic
              </label>
              <div className="select-wrapper">
                <select 
                  value={isCustomTopic ? '__custom__' : topic} 
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomTopic(true);
                      if (!customTopic) setCustomTopic('');
                    } else {
                      setIsCustomTopic(false);
                      setTopic(e.target.value);
                    }
                  }} 
                  className="select-input"
                  style={isCustomTopic ? { borderColor: '#2563EB', backgroundColor: '#F0F9FF' } : {}}
                >
                  {availableTopics.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="__custom__">Custom Topic</option>
                </select>
                <ChevronDown className="select-chevron" />
              </div>
              {isCustomTopic && (
                <div style={{ marginTop: 5, position: 'relative' }}>
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Enter custom topic (e.g., Integration by Parts)..."
                    style={{
                      width: '100%',
                      backgroundColor: '#FFFFFF',
                      border: '1.5px solid #2563EB',
                      borderRadius: 6,
                      padding: '5px 22px 5px 8px',
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: '#0F172A',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                    autoFocus
                  />
                  {customTopic && (
                    <button
                      type="button"
                      onClick={() => setCustomTopic('')}
                      style={{
                        position: 'absolute',
                        right: 6,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        fontSize: 11,
                        lineHeight: 1
                      }}
                      title="Clear"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Difficulty & Question Type */}
          <div className="two-col-row">
            {/* Difficulty Level */}
            <div className="form-group">
              <label className="qg-field-label">
                <BarChart2 /> Difficulty
              </label>
              <div className="select-wrapper">
                <select 
                  value={difficulty} 
                  onChange={(e) => setDifficulty(e.target.value)} 
                  className="select-input"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
                <ChevronDown className="select-chevron" />
              </div>
            </div>

            {/* Question Type */}
            <div className="form-group">
              <label className="qg-field-label">
                <HelpCircle /> Type
              </label>
              <div className="select-wrapper">
                <select 
                  value={questionType} 
                  onChange={(e) => setQuestionType(e.target.value)} 
                  className="select-input"
                >
                  <option value="vtfr_adaptive">Adaptive VTFR</option>
                  <option value="Application Based">Application Based</option>
                  <option value="Conceptual">Conceptual</option>
                  <option value="Procedural">Procedural</option>
                </select>
                <ChevronDown className="select-chevron" />
              </div>
            </div>
          </div>

          {/* Row 4: Number of Questions */}
          <div className="form-group" style={{ marginTop: 2 }}>
            <label className="qg-field-label">
              <FileText /> Number of Questions
            </label>
            <div className="qg-counter-wrapper">
              <button 
                type="button" 
                onClick={() => setNumQuestions(Math.max(1, numQuestions - 1))}
                className="qg-counter-btn"
                disabled={numQuestions <= 1}
              >
                −
              </button>
              <span className="qg-counter-val">{numQuestions}</span>
              <button 
                type="button" 
                onClick={() => setNumQuestions(Math.min(5, numQuestions + 1))}
                className="qg-counter-btn"
                disabled={numQuestions >= 5}
              >
                +
              </button>
            </div>
          </div>

          {/* Row 5: Optional (Advanced) Prompt Accordion */}
          <div className="qg-advanced-box">
            <div 
              className="qg-advanced-header"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            >
              <span>Optional (Advanced Constraints)</span>
              {isAdvancedOpen ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
            </div>

            {isAdvancedOpen && (
              <div className="qg-advanced-body">
                <textarea 
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value.slice(0, 500))}
                  placeholder="Additional focus formulas, numerical range constraints, or real-life scenario requirements..."
                  className="qg-advanced-textarea"
                />
                <span className="qg-char-counter">{promptText.length}/500</span>
              </div>
            )}
          </div>

          {/* Row 6: Main Generate Button */}
          <button 
            type="button" 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn-generate-main"
          >
            {isGenerating ? (
              <>
                <RotateCw className="animate-spin" style={{ width: 16, height: 16 }} />
                <span>Generating VTFR Question...</span>
              </>
            ) : (
              <>
                <Sparkles style={{ width: 16, height: 16 }} />
                <span>Generate Question</span>
                <ArrowRight style={{ width: 16, height: 16 }} />
              </>
            )}
          </button>
        </div>


        {/* ========================================================================= */}
        {/* 3. RIGHT COLUMN: PIPELINE STEPPER & STRUCTURED VTFR QUESTION PREVIEW */}
        {/* ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, width: '100%' }}>
          
          {/* Top Pipeline Stepper (Input -> Generation -> Validation -> Database -> Delivery) */}
          <div className="pipeline-stepper-container">
            <div className="pipeline-step-item">
              <div className={`pipeline-step-circle ${pipelineStep >= 1 ? 'active' : 'idle'}`}>1</div>
              <div className="pipeline-step-labels">
                <span className="pipeline-step-title">Input</span>
                <span className="pipeline-step-subtitle">Curriculum details</span>
              </div>
            </div>

            <span className="pipeline-step-arrow">→</span>

            <div className="pipeline-step-item">
              <div className={`pipeline-step-circle ${isGenerating || pipelineStep >= 2 ? 'active' : 'idle'}`}>2</div>
              <div className="pipeline-step-labels">
                <span className="pipeline-step-title">Generation</span>
                <span className="pipeline-step-subtitle">LangChain & LLM</span>
              </div>
            </div>

            <span className="pipeline-step-arrow">→</span>

            <div className="pipeline-step-item">
              <div className={`pipeline-step-circle ${pipelineStep >= 3 ? 'active' : 'idle'}`}>3</div>
              <div className="pipeline-step-labels">
                <span className="pipeline-step-title">Validation</span>
                <span className="pipeline-step-subtitle">Pydantic Schemas</span>
              </div>
            </div>

            <span className="pipeline-step-arrow">→</span>

            <div className="pipeline-step-item">
              <div className={`pipeline-step-circle ${pipelineStep >= 4 ? 'active' : 'idle'}`}>4</div>
              <div className="pipeline-step-labels">
                <span className="pipeline-step-title">Database</span>
                <span className="pipeline-step-subtitle">Saved by UUID</span>
              </div>
            </div>

            <span className="pipeline-step-arrow">→</span>

            <div className="pipeline-step-item">
              <div className={`pipeline-step-circle ${pipelineStep >= 5 ? 'active' : 'idle'}`}>5</div>
              <div className="pipeline-step-labels">
                <span className="pipeline-step-title">Delivery</span>
                <span className="pipeline-step-subtitle">Student Portal</span>
              </div>
            </div>
          </div>


          {/* ===================================================================== */}
          {/* Generated Question Preview Card (Fully Structured by Category & ID) */}
          {/* ===================================================================== */}
          <div className="preview-container-card">
            
            {/* Top Bar with Ready to Save, Regenerate, More */}
            <div className="preview-top-bar">
              <h2 className="preview-title-main">Generated Question Preview</h2>
              
              <div className="preview-actions-group">
                <button 
                  type="button" 
                  onClick={handleSaveToDatabase}
                  className="pill-ready-save"
                >
                  <Check style={{ width: 14, height: 14 }} />
                  <span>{savedNotification ? 'Saved to DB!' : 'Ready to Save'}</span>
                </button>

                <button 
                  type="button" 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="btn-regenerate-action"
                >
                  <RotateCw className={isGenerating ? 'animate-spin' : ''} style={{ width: 13, height: 13 }} />
                  <span>Regenerate</span>
                </button>

                <button 
                  type="button" 
                  className="btn-more-options"
                  title="Copy Question ID"
                  onClick={() => {
                    navigator.clipboard?.writeText(activeQuestion.id);
                    alert(`Copied Question UUID: ${activeQuestion.id}`);
                  }}
                >
                  <MoreHorizontal style={{ width: 16, height: 16 }} />
                </button>
              </div>
            </div>

            {/* Metadata Badges Row */}
            <div className="meta-badges-row">
              <div className="meta-badge-chip">
                <GraduationCap /> {activeQuestion.metadata.grade}
              </div>
              <div className="meta-badge-chip">
                <BookOpen /> {activeQuestion.metadata.subject}
              </div>
              <div className="meta-badge-chip">
                <Target /> {activeQuestion.metadata.topic}
              </div>
              <div className="meta-badge-chip">
                <BarChart2 /> {activeQuestion.metadata.difficulty}
              </div>
              <div className="meta-badge-chip">
                <HelpCircle /> {activeQuestion.metadata.type}
              </div>
            </div>

            {/* Question Card Box */}
            <div className="inner-question-card">
              <div className="iq-title-row">
                <FileText />
                <span>Question</span>
                <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 'auto', fontFamily: 'monospace' }}>
                  UUID: {activeQuestion.id.slice(0, 8)}...
                </span>
              </div>

              <p className="iq-prompt-text">
                {activeQuestion.text}
              </p>

              {/* Multiple Choice Options List */}
              <div className="iq-options-list">
                {activeQuestion.options.map((opt) => {
                  const isSelected = selectedOption === opt.id;
                  return (
                    <div 
                      key={opt.id}
                      onClick={() => setSelectedOption(opt.id)}
                      className={`iq-option-item ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="iq-radio-ring">
                        {isSelected && <div className="iq-radio-dot" />}
                      </div>
                      <span className="iq-option-label">
                        <strong>{opt.id}.</strong> &nbsp; {opt.text}
                      </span>
                      {opt.isCorrect && (
                        <span style={{ marginLeft: 'auto', fontSize: 10.5, fontWeight: 700, color: '#059669', backgroundColor: '#ECFDF5', padding: '2px 7px', borderRadius: 4, border: '1px solid #A7F3D0' }}>
                          Correct Answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Solution & Derivation (Hidden from students) Accordion */}
            <div className="solution-collapsible-card">
              <div 
                className="solution-header"
                onClick={() => setIsSolutionOpen(!isSolutionOpen)}
              >
                <div className="solution-title-wrap">
                  <FileText />
                  <span>Solution & Derivation</span>
                  <span className="solution-hidden-tag">(Hidden from students)</span>
                </div>
                <button type="button" className="btn-view-solution-toggle">
                  <span>{isSolutionOpen ? 'Hide Solution' : 'View Solution'}</span>
                  {isSolutionOpen ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
                </button>
              </div>

              {isSolutionOpen && (
                <div className="solution-body-content">
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: '#334155' }}>
                    {/* Interactive Calculation Draft Accordion Header */}
                    <div 
                      className="calc-draft-interactive-header"
                      onClick={() => setIsCalculationDraftOpen(!isCalculationDraftOpen)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        backgroundColor: isCalculationDraftOpen ? '#EFF6FF' : '#F8FAFC',
                        border: '1px solid ' + (isCalculationDraftOpen ? '#93C5FD' : '#E2E8F0'),
                        borderRadius: 8,
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'all 0.2s ease',
                        marginBottom: isCalculationDraftOpen ? 10 : 12
                      }}
                      title="Click to open/close Mathematical Derivation & Distractor Analysis draft"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Calculator style={{ width: 16, height: 16, color: '#2563EB' }} />
                        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>
                          Mathematical Derivation & Distractor Analysis (calculationDraft):
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#2563EB', fontWeight: 600 }}>
                        <span>{isCalculationDraftOpen ? 'Hide Draft' : 'Open Draft'}</span>
                        {isCalculationDraftOpen ? (
                          <ChevronUp style={{ width: 15, height: 15 }} />
                        ) : (
                          <ChevronDown style={{ width: 15, height: 15 }} />
                        )}
                      </div>
                    </div>
                    
                    {/* Calculation Draft Text (Opens when clicked) */}
                    {isCalculationDraftOpen && activeQuestion.calculationDraft && (
                      <div style={{ 
                        whiteSpace: 'pre-line', 
                        backgroundColor: '#F8FAFC', 
                        padding: '12px 14px', 
                        borderRadius: 8, 
                        border: '1px solid #E2E8F0', 
                        borderLeft: '4px solid #3B82F6',
                        marginBottom: 12, 
                        fontSize: 12.5,
                        lineHeight: 1.6,
                        color: '#334155'
                      }}>
                        {activeQuestion.calculationDraft}
                      </div>
                    )}

                    {/* Scaffolded Student Steps (solutionSteps) */}
                    {activeQuestion.solutionSteps && activeQuestion.solutionSteps.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                        <strong style={{ fontSize: 12, color: '#1E293B' }}>Scaffolded Solution Steps (solutionSteps):</strong>
                        {activeQuestion.solutionSteps.map((step, sIdx) => {
                          const correctStepOpt = (step.optionsList || []).find(o => o.isCorrect);
                          return (
                            <div key={sIdx} style={{ fontSize: 12, color: '#475569', padding: '6px 10px', backgroundColor: '#EFF6FF', borderRadius: 6, border: '1px solid #DBEAFE', display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div>
                                <strong style={{ color: '#1D4ED8' }}>Step {step.stepSequenceNo || (sIdx + 1)}:</strong> {step.stepText}
                              </div>
                              {correctStepOpt && (
                                <div style={{ fontSize: 11, color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <CheckCheck style={{ width: 13, height: 13 }} /> Step Answer: <strong>{correctStepOpt.optionText}</strong>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Educational Rationale for Correct Option */}
                    {(() => {
                      const correctOpt = activeQuestion.options.find(o => o.isCorrect);
                      if (correctOpt && correctOpt.explanation) {
                        return (
                          <div style={{ marginTop: 8, padding: '6px 10px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 6, fontSize: 12, color: '#065F46' }}>
                            <strong>💡 Educational Rationale:</strong> {correctOpt.explanation}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Alternative Questions (3 Alternatives) Accordion */}
            <div className="alternatives-container-card">
              <div 
                className="alternatives-header"
                onClick={() => setIsAlternativesOpen(!isAlternativesOpen)}
              >
                <div className="alt-header-left">
                  <ArrowLeftRight />
                  <span>Alternative Questions</span>
                  <span className="alt-count-pill">{alternativeQuestions.length} Alternatives</span>
                </div>
                {isAlternativesOpen ? <ChevronUp style={{ width: 16, height: 16, color: '#64748B' }} /> : <ChevronDown style={{ width: 16, height: 16, color: '#64748B' }} />}
              </div>

              {isAlternativesOpen && (
                <div className="alt-cards-stack">
                  {alternativeQuestions.map((alt) => (
                    <div key={alt.id} className="alt-item-card">
                      <div className="alt-item-top">
                        <div className="alt-item-top-left">
                          <div className="alt-item-circle-badge">{alt.badgeNum}</div>
                          <span className="alt-item-name">{alt.title}</span>
                          <span className="alt-item-tag">{alt.difficulty}</span>
                          <span className="alt-item-tag quad">{alt.topicTag}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleUseAlternative(alt)}
                          className="btn-use-alt-question"
                          title="Promote this alternative question to the main preview"
                        >
                          <FileText style={{ width: 13, height: 13 }} />
                          <span>Use This Question</span>
                        </button>
                      </div>
                      <p className="alt-item-text">{alt.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>


            {/* Additional Remedial Resources Section (4-Card Horizontal Layout) */}
            <div className="resources-accordion-card">
              <div className="resources-title-row">
                <div className="res-header-plus-badge">
                  <Plus style={{ width: 13, height: 13 }} />
                </div>
                <span className="resources-title-text">Additional Remedial Resources</span>
              </div>

              <div className="resources-4grid">
                {/* 1. PDF Resource */}
                <div 
                  className="res-card-item"
                  onClick={() => setActiveResourceModal('pdf')}
                >
                  <div className="res-card-left">
                    <div className="res-icon-box red">
                      <FileText style={{ width: 18, height: 18 }} />
                    </div>
                    <div className="res-text-block">
                      <span className="res-card-title">PDF Resource</span>
                      <span className="res-card-subtitle">{relatedContent?.pdfResource?.title || 'Notes & Worksheet'}</span>
                    </div>
                  </div>
                  <ChevronRight className="res-chevron-right" />
                </div>

                {/* 2. Website Resource */}
                <div 
                  className="res-card-item"
                  onClick={() => setActiveResourceModal('web')}
                >
                  <div className="res-card-left">
                    <div className="res-icon-box blue">
                      <Globe style={{ width: 18, height: 18 }} />
                    </div>
                    <div className="res-text-block">
                      <span className="res-card-title">Website Resource</span>
                      <span className="res-card-subtitle">{relatedContent?.webResource?.title || 'Reference Link'}</span>
                    </div>
                  </div>
                  <ChevronRight className="res-chevron-right" />
                </div>

                {/* 3. Image Resource */}
                <div 
                  className="res-card-item"
                  onClick={() => setActiveResourceModal('diagram')}
                >
                  <div className="res-card-left">
                    <div className="res-icon-box green">
                      <ImageIcon style={{ width: 18, height: 18 }} />
                    </div>
                    <div className="res-text-block">
                      <span className="res-card-title">Image Resource</span>
                      <span className="res-card-subtitle">{relatedContent?.imageResource?.title || 'Concept Visualizer'}</span>
                    </div>
                  </div>
                  <ChevronRight className="res-chevron-right" />
                </div>

                {/* 4. Related Video */}
                <div 
                  className="res-card-item"
                  onClick={() => setActiveResourceModal('video')}
                >
                  <div className="res-card-left">
                    <div className="res-icon-box blue">
                      <Play style={{ width: 18, height: 18, fill: '#FFFFFF' }} />
                    </div>
                    <div className="res-text-block">
                      <span className="res-card-title">Related Video</span>
                      <span className="res-card-subtitle">{relatedContent?.youtubeResource?.title || 'Video Lesson'}</span>
                    </div>
                  </div>
                  <ChevronRight className="res-chevron-right" />
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. RESOURCE PREVIEW MODAL */}
      {/* ========================================================================= */}
      {activeResourceModal && (
        <div className="resource-modal-overlay" onClick={() => setActiveResourceModal(null)}>
          <div className="resource-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="resource-modal-header">
              <div className="resource-modal-title">
                {activeResourceModal === 'pdf' && <><FileText style={{ width: 16, height: 16, color: '#DC2626' }} /> PDF Resource: {relatedContent?.pdfResource?.title || 'Study Notes'}</>}
                {activeResourceModal === 'web' && <><Globe style={{ width: 16, height: 16, color: '#2563EB' }} /> Website Resource: {relatedContent?.webResource?.title || 'Reference Article'}</>}
                {activeResourceModal === 'diagram' && <><ImageIcon style={{ width: 16, height: 16, color: '#059669' }} /> Image Resource: {relatedContent?.imageResource?.title || '5-Panel Visualizer'}</>}
                {activeResourceModal === 'video' && <><Video style={{ width: 16, height: 16, color: '#2563EB' }} /> Related Video: {relatedContent?.youtubeResource?.title || 'Video Lesson'}</>}
              </div>
              <button 
                type="button" 
                onClick={() => setActiveResourceModal(null)} 
                className="resource-modal-close-btn"
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="resource-modal-body">
              {activeResourceModal === 'pdf' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ backgroundColor: '#FEE2E2', padding: 12, borderRadius: 8, color: '#DC2626' }}>
                      <FileText style={{ width: 28, height: 28 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {relatedContent?.pdfResource?.title || 'Lecture Notes & Practice.pdf'}
                      </h4>
                      <p style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Curated MKCL Educational Repository Document</p>
                    </div>
                    {relatedContent?.pdfResource?.url && (
                      <a 
                        href={relatedContent.pdfResource.url} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, backgroundColor: '#DC2626', color: '#FFFFFF', textDecoration: 'none', fontSize: 12.5, fontWeight: 700 }}
                      >
                        <Download style={{ width: 14, height: 14 }} /> Open PDF
                      </a>
                    )}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.6, backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <strong>Concept Summary:</strong> {relatedContent?.conceptSummary}
                  </div>
                </div>
              )}

              {activeResourceModal === 'web' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ backgroundColor: '#DBEAFE', padding: 12, borderRadius: 8, color: '#2563EB' }}>
                      <Globe style={{ width: 28, height: 28 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1E3A8A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {relatedContent?.webResource?.title || 'Concept Guide & Solved Examples'}
                      </h4>
                      <p style={{ fontSize: 12, color: '#3B82F6', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {relatedContent?.webResource?.url || 'https://learnlive.org/resources'}
                      </p>
                    </div>
                    {relatedContent?.webResource?.url && (
                      <a 
                        href={relatedContent.webResource.url} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, backgroundColor: '#2563EB', color: '#FFFFFF', textDecoration: 'none', fontSize: 12.5, fontWeight: 700 }}
                      >
                        <ExternalLink style={{ width: 14, height: 14 }} /> Open Link
                      </a>
                    )}
                  </div>
                  <p style={{ fontSize: 12.5, color: '#475569' }}>
                    {relatedContent?.conceptSummary}
                  </p>
                </div>
              )}

              {activeResourceModal === 'diagram' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Top info and action bar */}
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
                          Topic: <strong>{activeQuestion.metadata.topic || topic}</strong> ({activeQuestion.metadata.grade || grade})
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <a 
                        href={resolveConceptCardImageUrl(relatedContent?.imageResource, activeQuestion, topic)}
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '6px 12px',
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
                  </div>

                  {/* Render the actual generated concept card infographic */}
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
                    minHeight: 280
                  }}>
                    <img 
                      src={resolveConceptCardImageUrl(relatedContent?.imageResource, activeQuestion, topic)}
                      alt={`${activeQuestion.metadata.topic || topic} Educational Concept Card`}
                      style={{
                        width: '100%',
                        maxHeight: 520,
                        objectFit: 'contain',
                        borderRadius: 8,
                        display: 'block',
                        backgroundColor: '#FFFFFF'
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `http://127.0.0.1:8000/api/v1/questions/concept-card-image?topic=${encodeURIComponent(activeQuestion.metadata.topic || topic)}`;
                      }}
                    />
                  </div>

                  {/* Concept Summary & Educational Note */}
                  <div style={{
                    fontSize: 12.5,
                    color: '#334155',
                    backgroundColor: '#F8FAFC',
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    lineHeight: 1.6
                  }}>
                    <strong style={{ color: '#0F172A' }}>Infographic Summary:</strong> {relatedContent?.conceptSummary || `5-Panel visual summary with Definition, Key Formulas, Types, Pros & Cons, and Real-World Applications for ${activeQuestion.metadata.topic || topic}. Stored in concept_cards repository.`}
                  </div>
                </div>
              )}

              {activeResourceModal === 'video' && (
                <div>
                  <div style={{ backgroundColor: '#0F172A', borderRadius: 10, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', flexDirection: 'column', gap: 10, padding: 16 }}>
                    <Play style={{ width: 48, height: 48, color: '#38BDF8' }} />
                    <span style={{ fontSize: 14, fontWeight: 600, textAlign: 'center' }}>
                      {relatedContent?.youtubeResource?.title || 'Video Lesson'}
                    </span>
                    {relatedContent?.youtubeResource?.url && (
                      <a 
                        href={relatedContent.youtubeResource.url} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, backgroundColor: '#EF4444', color: '#FFFFFF', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}
                      >
                        <Play style={{ width: 12, height: 12, fill: '#FFFFFF' }} /> Watch on YouTube
                      </a>
                    )}
                  </div>
                  <p style={{ fontSize: 12.5, color: '#475569', marginTop: 12 }}>
                    {relatedContent?.conceptSummary}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
