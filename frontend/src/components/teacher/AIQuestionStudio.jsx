import React, { useState, useEffect } from 'react';
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
  CheckCheck
} from 'lucide-react';
import { getSyllabus, generateQuestion, getSampleQuestions, getSampleQuestionByFilename } from '../../services/questionService';

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
      "url": "http://127.0.0.1:8000/static/concept_cards/measures_of_dispersion_statistics_concept_card.png"
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

  // Form State
  const [grade, setGrade] = useState('Grade 10');
  const [subject, setSubject] = useState('Mathematics');
  const [chapter, setChapter] = useState('Probability & Statistics');
  const [topic, setTopic] = useState('Measures of Dispersion (Statistics)');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionType, setQuestionType] = useState('vtfr_adaptive');
  const [numQuestions, setNumQuestions] = useState(1);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [pipelineStep, setPipelineStep] = useState(1);

  // Preview Card State
  const [selectedOption, setSelectedOption] = useState('A');
  const [isSolutionOpen, setIsSolutionOpen] = useState(true);
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
    if (q.grade) setGrade(q.grade);
    if (q.subject) setSubject(q.subject);
    if (q.chapter) setChapter(q.chapter);
    if (q.topic) setTopic(q.topic);
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
        grade: q.grade || grade,
        subject: q.subject || subject,
        chapter: q.chapter || chapter,
        topic: q.topic || topic,
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
        imageResource: q.relatedContent.imageResource || {
          title: `${q.topic || topic} Concept Card`,
          url: 'http://127.0.0.1:8000/static/concept_cards/card.png'
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

  // Load sample list on mount
  useEffect(() => {
    async function initSamples() {
      try {
        const res = await getSampleQuestions();
        if (res && res.samples && res.samples.length > 0) {
          setSampleList(res.samples);
        }
      } catch (err) {
        console.warn('Could not load samples list:', err);
      }
    }
    initSamples();
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
        grade,
        subject,
        chapter,
        topic,
        num_alternate_questions: 3
      });

      setPipelineStep(3); // Validation

      if (res && res.question) {
        loadVTFRJsonIntoState(res.question);
        setPipelineStep(4); // Database
      }
    } catch (e) {
      console.error('VTFR Generation Error:', e);
      setGenerationError(e.response?.data?.detail || e.message || 'Generation failed. Please retry.');
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
                  value={grade} 
                  onChange={(e) => setGrade(e.target.value)} 
                  className="select-input"
                >
                  <option value="Grade 6">Grade 6</option>
                  <option value="Grade 7">Grade 7</option>
                  <option value="Grade 8">Grade 8</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
                <ChevronDown className="select-chevron" />
              </div>
            </div>

            {/* Subject Select */}
            <div className="form-group">
              <label className="qg-field-label">
                <BookOpen /> Subject
              </label>
              <div className="select-wrapper">
                <select 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                  className="select-input"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                </select>
                <ChevronDown className="select-chevron" />
              </div>
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
                  value={chapter} 
                  onChange={(e) => setChapter(e.target.value)} 
                  className="select-input"
                >
                  <option value="Probability & Statistics">Probability & Statistics</option>
                  <option value="Algebra">Algebra</option>
                  <option value="Calculus">Calculus</option>
                  <option value="Coordinate Geometry & Vectors">Coordinate Geometry</option>
                  <option value="Mechanics">Mechanics</option>
                  <option value="Thermodynamics & Kinetic Theory">Thermodynamics</option>
                  <option value="Electromagnetism">Electromagnetism</option>
                  <option value="Physical Chemistry">Physical Chemistry</option>
                </select>
                <ChevronDown className="select-chevron" />
              </div>
            </div>

            {/* Topic Select */}
            <div className="form-group">
              <label className="qg-field-label">
                <Target /> Topic
              </label>
              <div className="select-wrapper">
                <select 
                  value={topic} 
                  onChange={(e) => setTopic(e.target.value)} 
                  className="select-input"
                >
                  <option value="Measures of Dispersion (Statistics)">Measures of Dispersion</option>
                  <option value="Probability">Probability</option>
                  <option value="Complex Numbers and Quadratic Equations">Complex Numbers & Quadratics</option>
                  <option value="Limits and Derivatives">Limits & Derivatives</option>
                  <option value="Laws of Motion">Laws of Motion</option>
                  <option value="Electric Charges and Fields">Electric Charges & Fields</option>
                  <option value="Chemical Kinetics">Chemical Kinetics</option>
                </select>
                <ChevronDown className="select-chevron" />
              </div>
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
                    <p style={{ fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                      Mathematical Derivation & Distractor Analysis (calculationDraft):
                    </p>
                    
                    {/* Calculation Draft Text */}
                    {activeQuestion.calculationDraft ? (
                      <div style={{ whiteSpace: 'pre-line', backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 8, fontSize: 12.5 }}>
                        {activeQuestion.calculationDraft}
                      </div>
                    ) : null}

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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                    <div style={{ backgroundColor: '#FFFFFF', padding: 8, borderRadius: 6, textAlign: 'center', border: '1px solid #CBD5E1' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#2563EB' }}>1. Identify</div>
                      <div style={{ fontSize: 16, margin: '8px 0' }}>📊</div>
                      <div style={{ fontSize: 10, color: '#64748B' }}>Data Points</div>
                    </div>
                    <div style={{ backgroundColor: '#FFFFFF', padding: 8, borderRadius: 6, textAlign: 'center', border: '1px solid #CBD5E1' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#2563EB' }}>2. Mean</div>
                      <div style={{ fontSize: 16, margin: '8px 0' }}>📐</div>
                      <div style={{ fontSize: 10, color: '#64748B' }}>Find x̄</div>
                    </div>
                    <div style={{ backgroundColor: '#FFFFFF', padding: 8, borderRadius: 6, textAlign: 'center', border: '1px solid #CBD5E1' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#2563EB' }}>3. Deviations</div>
                      <div style={{ fontSize: 16, margin: '8px 0' }}>📏</div>
                      <div style={{ fontSize: 10, color: '#64748B' }}>(x - x̄)</div>
                    </div>
                    <div style={{ backgroundColor: '#FFFFFF', padding: 8, borderRadius: 6, textAlign: 'center', border: '1px solid #CBD5E1' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#2563EB' }}>4. Squared</div>
                      <div style={{ fontSize: 16, margin: '8px 0' }}>🧮</div>
                      <div style={{ fontSize: 10, color: '#64748B' }}>(x - x̄)²</div>
                    </div>
                    <div style={{ backgroundColor: '#FFFFFF', padding: 8, borderRadius: 6, textAlign: 'center', border: '1px solid #CBD5E1' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#2563EB' }}>5. Average</div>
                      <div style={{ fontSize: 16, margin: '8px 0' }}>✅</div>
                      <div style={{ fontSize: 10, color: '#64748B' }}>Variance σ²</div>
                    </div>
                  </div>
                  <p style={{ fontSize: 12.5, color: '#475569' }}>
                    VTFR 5-Panel Educational Concept Card visual breakdown for: <strong>{activeQuestion.metadata.topic}</strong> ({activeQuestion.metadata.subject}).
                  </p>
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
