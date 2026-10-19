import React, { useState, useEffect, useMemo } from 'react';
import { getSyllabus, generateQuestion } from '../../services/questionService';
import {
  DEFAULT_GRADE_SYLLABUS,
  getGrades,
  getSubjectsForGrade,
  getChaptersForSubject,
  getTopicsForChapter
} from '../../data/curriculumData';
import { Sparkles, Loader2, RefreshCw, UploadCloud, CheckCircle2, ChevronDown } from 'lucide-react';
import axios from 'axios';

export default function QuestionGeneratorForm({ onQuestionGenerated }) {
  const [gradeSyllabus, setGradeSyllabus] = useState(DEFAULT_GRADE_SYLLABUS);

  // Form State
  const [selectedGrade, setSelectedGrade] = useState('Grade 10');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [selectedChapter, setSelectedChapter] = useState('Probability & Statistics');
  const [selectedTopic, setSelectedTopic] = useState('Measures of Dispersion (Statistics)');
  const [difficultyValue, setDifficultyValue] = useState(65); // 0 to 100 slider
  const [questionType, setQuestionType] = useState('Application Based');
  const [bloomsLevel, setBloomsLevel] = useState('Applying');
  const [customPrompt, setCustomPrompt] = useState('');

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
  const effectiveGrade = isCustomGrade ? (customGrade.trim() || 'Grade 10') : selectedGrade;
  const effectiveSubject = isCustomSubject ? (customSubject.trim() || 'Mathematics') : selectedSubject;
  const effectiveChapter = isCustomChapter ? (customChapter.trim() || 'General Chapter') : selectedChapter;
  const effectiveTopic = isCustomTopic ? (customTopic.trim() || 'Core Concepts') : selectedTopic;

  // Cascading options
  const availableGrades = useMemo(() => {
    const list = getGrades(gradeSyllabus);
    if (selectedGrade && !list.includes(selectedGrade)) return [selectedGrade, ...list];
    return list;
  }, [gradeSyllabus, selectedGrade]);

  const availableSubjects = useMemo(() => {
    const list = getSubjectsForGrade(effectiveGrade, gradeSyllabus);
    if (selectedSubject && !list.includes(selectedSubject)) return [selectedSubject, ...list];
    return list;
  }, [gradeSyllabus, effectiveGrade, selectedSubject]);

  const availableChapters = useMemo(() => {
    const list = getChaptersForSubject(effectiveGrade, effectiveSubject, gradeSyllabus);
    if (selectedChapter && !list.includes(selectedChapter)) return [selectedChapter, ...list];
    return list;
  }, [gradeSyllabus, effectiveGrade, effectiveSubject, selectedChapter]);

  const availableTopics = useMemo(() => {
    const list = getTopicsForChapter(effectiveGrade, effectiveSubject, effectiveChapter, gradeSyllabus);
    if (selectedTopic && !list.includes(selectedTopic)) return [selectedTopic, ...list];
    return list;
  }, [gradeSyllabus, effectiveGrade, effectiveSubject, effectiveChapter, selectedTopic]);

  // Upload State
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfName, setPdfName] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [generationElapsed, setGenerationElapsed] = useState(0);

  useEffect(() => {
    let timer;
    if (isGenerating) {
      setGenerationElapsed(0);
      timer = setInterval(() => {
        setGenerationElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setGenerationElapsed(0);
    }
    return () => clearInterval(timer);
  }, [isGenerating]);

  const GENERATION_STAGES = [
    { title: "Analyzing Curriculum & Cognitive Model", subtitle: "Extracting pedagogical standards & core formulas..." },
    { title: "Synthesizing Core VTFR Question", subtitle: "Generating question text, 4 options & mathematical derivation..." },
    { title: "Constructing Adaptive Scaffolding", subtitle: "Decomposing guiding steps & alternate questions..." },
    { title: "Resolving Educational Learning Resources", subtitle: "Generating 5-panel concept card, video & revision notes..." },
    { title: "Validating Mathematical Rigor & Schemas", subtitle: "Verifying single-correct rule, unique distractors & JSON format..." }
  ];

  const generationStageIndex = useMemo(() => {
    if (generationElapsed < 3) return 0;
    if (generationElapsed < 7) return 1;
    if (generationElapsed < 13) return 2;
    if (generationElapsed < 19) return 3;
    return 4;
  }, [generationElapsed]);

  useEffect(() => {
    fetchSyllabus();
  }, []);

  const fetchSyllabus = async () => {
    try {
      const data = await getSyllabus();
      if (data?.grade_syllabus) {
        setGradeSyllabus((prev) => ({ ...prev, ...data.grade_syllabus }));
      }
    } catch (e) {
      console.log('Using default curriculum.');
    }
  };

  const handleGradeChange = (newGrade) => {
    setSelectedGrade(newGrade);
    setIsCustomGrade(false);
    setIsCustomSubject(false);
    setIsCustomChapter(false);
    setIsCustomTopic(false);
    const subjList = getSubjectsForGrade(newGrade, gradeSyllabus);
    const nextSubj = subjList.includes(selectedSubject) ? selectedSubject : (subjList[0] || 'Mathematics');
    setSelectedSubject(nextSubj);

    const chapList = getChaptersForSubject(newGrade, nextSubj, gradeSyllabus);
    const nextChap = chapList.includes(selectedChapter) ? selectedChapter : (chapList[0] || 'General Chapter');
    setSelectedChapter(nextChap);

    const topList = getTopicsForChapter(newGrade, nextSubj, nextChap, gradeSyllabus);
    const nextTop = topList.includes(selectedTopic) ? selectedTopic : (topList[0] || 'Core Concepts');
    setSelectedTopic(nextTop);
  };

  const handleSubjectChange = (newSubj) => {
    setSelectedSubject(newSubj);
    setIsCustomSubject(false);
    setIsCustomChapter(false);
    setIsCustomTopic(false);
    const chapList = getChaptersForSubject(effectiveGrade, newSubj, gradeSyllabus);
    const nextChap = chapList.includes(selectedChapter) ? selectedChapter : (chapList[0] || 'General Chapter');
    setSelectedChapter(nextChap);

    const topList = getTopicsForChapter(effectiveGrade, newSubj, nextChap, gradeSyllabus);
    const nextTop = topList.includes(selectedTopic) ? selectedTopic : (topList[0] || 'Core Concepts');
    setSelectedTopic(nextTop);
  };

  const handleChapterChange = (newChap) => {
    setSelectedChapter(newChap);
    setIsCustomChapter(false);
    setIsCustomTopic(false);
    const topList = getTopicsForChapter(effectiveGrade, effectiveSubject, newChap, gradeSyllabus);
    const nextTop = topList.includes(selectedTopic) ? selectedTopic : (topList[0] || 'Core Concepts');
    setSelectedTopic(nextTop);
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingPdf(true);
      setError(null);
      const res = await axios.post('http://127.0.0.1:8000/api/v1/rag/upload-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPdfName(file.name);
      setCustomPrompt(`Context extracted from ${file.name} (${res.data.totalChunks} chunks embedded)`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload PDF textbook.');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleClear = () => {
    setCustomPrompt('');
    setPdfName(null);
    setError(null);
    setSuccessMsg(null);
    setDifficultyValue(50);
    setIsCustomGrade(false);
    setCustomGrade('');
    setIsCustomSubject(false);
    setCustomSubject('');
    setIsCustomChapter(false);
    setCustomChapter('');
    setIsCustomTopic(false);
    setCustomTopic('');
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);
    setSuccessMsg(null);

    // Map slider to Easy / Medium / Hard
    const difficultyTag = difficultyValue < 35 ? 'Easy' : difficultyValue > 65 ? 'Hard' : 'Medium';

    try {
      const result = await generateQuestion({
        grade: effectiveGrade,
        subject: effectiveSubject,
        chapter: effectiveChapter,
        topic: effectiveTopic
      });

      setSuccessMsg('VTFR Question synthesized & decomposed successfully!');
      if (onQuestionGenerated) {
        onQuestionGenerated(result.question);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Question generation failed. Check API server connection.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative">
      {/* Full-Screen Buffering Overlay during Question Generation */}
      {isGenerating && (
        <div className="vtfr-generating-overlay" role="dialog" aria-modal="true" aria-label="Generating VTFR Question">
          <div className="vtfr-generating-card">
            {/* Central Dual-Ring Buffering Spinner */}
            <div className="vtfr-spinner-container">
              <div className="vtfr-outer-spinner-ring" />
              <div className="vtfr-inner-spinner-ring" />
              <div className="vtfr-spinner-core-icon">
                <Sparkles style={{ width: 17, height: 17 }} />
              </div>
            </div>

            <h3 className="vtfr-generating-title">
              {GENERATION_STAGES[generationStageIndex]?.title || "Generating VTFR Question..."}
            </h3>
            
            <p className="vtfr-generating-subtitle">
              <Loader2 className="animate-spin" style={{ width: 13, height: 13 }} />
              <span>{GENERATION_STAGES[generationStageIndex]?.subtitle}</span>
            </p>

            {/* Parameter Badges */}
            <div className="vtfr-generating-badge-row">
              <span className="vtfr-generating-badge badge-primary">
                {effectiveGrade}
              </span>
              <span className="vtfr-generating-badge">
                {effectiveSubject}
              </span>
              <span className="vtfr-generating-badge">
                {effectiveTopic}
              </span>
            </div>

            {/* Progress Shimmer Bar */}
            <div className="vtfr-generating-progress-bar-wrap">
              <div className="vtfr-generating-progress-shimmer" />
            </div>

            {/* Footer Info */}
            <div className="vtfr-generating-footer-note">
              <span>Deep multi-step reasoning & distractor derivation in progress</span>
              <span className="vtfr-generating-timer">
                ⏱ {Math.floor(generationElapsed / 60)}:{String(generationElapsed % 60).padStart(2, '0')}s
              </span>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-lg font-bold text-[#0B1E36] mb-5">
        AI Question Generator
      </h2>

      <form onSubmit={handleGenerate} className="space-y-4">
        {/* Standard / Grade Select */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Grade / Standard
          </label>
          <div className="relative">
            <select
              value={isCustomGrade ? '__custom__' : selectedGrade}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setIsCustomGrade(true);
                  setIsCustomSubject(true);
                  setIsCustomChapter(true);
                  setIsCustomTopic(true);
                } else {
                  setIsCustomGrade(false);
                  handleGradeChange(e.target.value);
                }
              }}
              className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm text-[#0B1E36] font-medium appearance-none focus:outline-none focus:border-[#0096C7] focus:ring-1 focus:ring-[#0096C7] ${
                isCustomGrade ? 'border-[#0096C7] bg-sky-50/40' : 'border-gray-300'
              }`}
            >
              {availableGrades.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
              <option value="__custom__">Custom Grade</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          {isCustomGrade && (
            <div className="mt-2 relative">
              <input
                type="text"
                value={customGrade}
                onChange={(e) => setCustomGrade(e.target.value)}
                placeholder="Enter custom grade (e.g., Grade 8, B.Sc 1st Year)..."
                className="w-full bg-white border-2 border-[#0096C7] rounded-xl px-3.5 py-2 pr-8 text-xs text-[#0B1E36] font-semibold focus:outline-none focus:ring-1 focus:ring-[#0096C7]"
                autoFocus
              />
              {customGrade && (
                <button
                  type="button"
                  onClick={() => setCustomGrade('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                  title="Clear"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {/* Subject Select */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Subject
          </label>
          <div className="relative">
            <select
              value={isCustomSubject ? '__custom__' : selectedSubject}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setIsCustomSubject(true);
                  setIsCustomChapter(true);
                  setIsCustomTopic(true);
                } else {
                  setIsCustomSubject(false);
                  handleSubjectChange(e.target.value);
                }
              }}
              className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm text-[#0B1E36] font-medium appearance-none focus:outline-none focus:border-[#0096C7] focus:ring-1 focus:ring-[#0096C7] ${
                isCustomSubject ? 'border-[#0096C7] bg-sky-50/40' : 'border-gray-300'
              }`}
            >
              {availableSubjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="__custom__">Custom Subject</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          {isCustomSubject && (
            <div className="mt-2 relative">
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Enter custom subject (e.g., Data Science, Robotics)..."
                className="w-full bg-white border-2 border-[#0096C7] rounded-xl px-3.5 py-2 pr-8 text-xs text-[#0B1E36] font-semibold focus:outline-none focus:ring-1 focus:ring-[#0096C7]"
                autoFocus
              />
              {customSubject && (
                <button
                  type="button"
                  onClick={() => setCustomSubject('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                  title="Clear"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {/* Chapter Select */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Chapter
          </label>
          <div className="relative">
            <select
              value={isCustomChapter ? '__custom__' : selectedChapter}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setIsCustomChapter(true);
                  setIsCustomTopic(true);
                } else {
                  setIsCustomChapter(false);
                  handleChapterChange(e.target.value);
                }
              }}
              className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm text-[#0B1E36] font-medium appearance-none focus:outline-none focus:border-[#0096C7] focus:ring-1 focus:ring-[#0096C7] ${
                isCustomChapter ? 'border-[#0096C7] bg-sky-50/40' : 'border-gray-300'
              }`}
            >
              {availableChapters.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="__custom__">Custom Chapter</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          {isCustomChapter && (
            <div className="mt-2 relative">
              <input
                type="text"
                value={customChapter}
                onChange={(e) => setCustomChapter(e.target.value)}
                placeholder="Enter custom chapter (e.g., Thermodynamics, Calculus)..."
                className="w-full bg-white border-2 border-[#0096C7] rounded-xl px-3.5 py-2 pr-8 text-xs text-[#0B1E36] font-semibold focus:outline-none focus:ring-1 focus:ring-[#0096C7]"
                autoFocus
              />
              {customChapter && (
                <button
                  type="button"
                  onClick={() => setCustomChapter('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                  title="Clear"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {/* Topic Select */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Topic
          </label>
          <div className="relative">
            <select
              value={isCustomTopic ? '__custom__' : selectedTopic}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setIsCustomTopic(true);
                  if (!customTopic) setCustomTopic('');
                } else {
                  setIsCustomTopic(false);
                  setSelectedTopic(e.target.value);
                }
              }}
              className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm text-[#0B1E36] font-medium appearance-none focus:outline-none focus:border-[#0096C7] focus:ring-1 focus:ring-[#0096C7] ${
                isCustomTopic ? 'border-[#0096C7] bg-sky-50/40' : 'border-gray-300'
              }`}
            >
              {availableTopics.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
              <option value="__custom__">Custom Topic</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          {isCustomTopic && (
            <div className="mt-2 relative">
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Enter custom topic (e.g., Integration by Parts)..."
                className="w-full bg-white border-2 border-[#0096C7] rounded-xl px-3.5 py-2 pr-8 text-xs text-[#0B1E36] font-semibold focus:outline-none focus:ring-1 focus:ring-[#0096C7]"
                autoFocus
              />
              {customTopic && (
                <button
                  type="button"
                  onClick={() => setCustomTopic('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                  title="Clear"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {/* Difficulty Level Slider */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-600">
              Difficulty Level
            </label>
            <span className="text-xs font-bold text-[#0077B6]">
              {difficultyValue < 35 ? 'Easy' : difficultyValue > 65 ? 'Hard' : 'Medium'} ({difficultyValue}%)
            </span>
          </div>
          <div className="relative flex items-center">
            <input
              type="range"
              min="0"
              max="100"
              value={difficultyValue}
              onChange={(e) => setDifficultyValue(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#00D2C8]"
            />
          </div>
          <div className="flex justify-between text-[10px] font-semibold text-gray-400 mt-1">
            <span>Easy</span>
            <span>Medium</span>
            <span>Hard</span>
          </div>
        </div>

        {/* Question Type & Bloom's Taxonomy Level */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Question Type
            </label>
            <div className="relative">
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-[#0B1E36] font-medium appearance-none focus:outline-none focus:border-[#0096C7]"
              >
                <option value="Application Based">Application Based</option>
                <option value="Conceptual Analysis">Conceptual Analysis</option>
                <option value="Multi-Step Derivation">Multi-Step Derivation</option>
                <option value="Procedural Problem">Procedural Problem</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Bloom's Taxonomy Level
            </label>
            <div className="relative">
              <select
                value={bloomsLevel}
                onChange={(e) => setBloomsLevel(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-[#0B1E36] font-medium appearance-none focus:outline-none focus:border-[#0096C7]"
              >
                <option value="Applying">Applying</option>
                <option value="Understanding">Understanding</option>
                <option value="Analyzing">Analyzing</option>
                <option value="Evaluating">Evaluating</option>
                <option value="Creating">Creating</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Input Textarea OR PDF Upload Dropzone */}
        <div className="pt-1">
          <div className="relative border border-gray-300 rounded-xl p-3 bg-gray-50 focus-within:border-[#0096C7] focus-within:bg-white transition-colors">
            <textarea
              rows={3}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Enter Question OR Upload PDF/Textbook..."
              className="w-full bg-transparent text-xs text-gray-800 placeholder-gray-400 focus:outline-none resize-none"
            />
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-2">
              <input
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                id="rag-quick-upload"
                className="hidden"
              />
              <label
                htmlFor="rag-quick-upload"
                className="cursor-pointer text-[11px] font-semibold text-[#0077B6] hover:text-[#0B1E36] flex items-center gap-1.5"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{uploadingPdf ? 'Embedding PDF...' : pdfName || 'Attach PDF Chapter'}</span>
              </label>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action Buttons: Clear + Generate VTFR */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 py-2.5 px-4 rounded-full border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100 transition-colors"
          >
            Clear
          </button>

          <button
            type="submit"
            disabled={isGenerating}
            className="flex-[2] py-2.5 px-6 rounded-full bg-[#00D2C8] hover:bg-[#00B4AC] text-[#0B1E36] font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating VTFR...</span>
              </>
            ) : (
              <>
                <span>Generate VTFR</span>
                <Sparkles className="w-3.5 h-3.5 text-[#0B1E36]" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
