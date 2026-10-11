import React, { useState, useEffect } from 'react';
import { getSyllabus, generateQuestion } from '../../services/questionService';
import { Sparkles, Loader2, RefreshCw, UploadCloud, CheckCircle2, ChevronDown } from 'lucide-react';
import axios from 'axios';

export default function QuestionGeneratorForm({ onQuestionGenerated }) {
  const [syllabusData, setSyllabusData] = useState(null);
  const [subjects, setSubjects] = useState(['Physics', 'Mathematics', 'Chemistry']);
  const [availableTopics, setAvailableTopics] = useState([
    'Binary Search Tree (BST) Insertion',
    'Limits and Derivatives',
    'Laws of Motion & Vectors',
    'Quadratic Equations & Roots',
    'Current Electricity & Circuits'
  ]);

  // Form State
  const [selectedSubject, setSelectedSubject] = useState('Physics');
  const [selectedTopic, setSelectedTopic] = useState('Binary Search Tree (BST) Insertion');
  const [selectedGrade, setSelectedGrade] = useState('10th Grade');
  const [difficultyValue, setDifficultyValue] = useState(65); // 0 to 100 slider
  const [questionType, setQuestionType] = useState('Application Based');
  const [bloomsLevel, setBloomsLevel] = useState('Applying');
  const [customPrompt, setCustomPrompt] = useState('');
  
  // Upload State
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfName, setPdfName] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    fetchSyllabus();
  }, []);

  const fetchSyllabus = async () => {
    try {
      const data = await getSyllabus();
      setSyllabusData(data.syllabus);
      if (data.subjects && data.subjects.length > 0) {
        setSubjects(data.subjects);
      }
    } catch (e) {
      console.log('Using default subjects list.');
    }
  };

  const handleSubjectChange = (newSubj) => {
    setSelectedSubject(newSubj);
    if (!syllabusData) return;

    const foundItem = Object.values(syllabusData).find((s) => s.subject === newSubj);
    if (foundItem && foundItem.chapters) {
      const allTopics = [];
      Object.values(foundItem.chapters).forEach((chap) => {
        if (chap.topics) allTopics.push(...chap.topics);
      });
      if (allTopics.length > 0) {
        setAvailableTopics(allTopics);
        setSelectedTopic(allTopics[0]);
      }
    }
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
        grade: selectedGrade.includes('Grade') ? selectedGrade : `Grade ${selectedGrade.replace(/\D/g, '')}`,
        subject: selectedSubject,
        chapter: 'Standard Curriculum',
        topic: selectedTopic
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
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
      <h2 className="text-lg font-bold text-[#0B1E36] mb-5">
        AI Question Generator
      </h2>

      <form onSubmit={handleGenerate} className="space-y-4">
        {/* Subject Select */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Subject
          </label>
          <div className="relative">
            <select
              value={selectedSubject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-[#0B1E36] font-medium appearance-none focus:outline-none focus:border-[#0096C7] focus:ring-1 focus:ring-[#0096C7]"
            >
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="Computer Science">Computer Science</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Topic Select */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Topic
          </label>
          <div className="relative">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-[#0B1E36] font-medium appearance-none focus:outline-none focus:border-[#0096C7] focus:ring-1 focus:ring-[#0096C7]"
            >
              {availableTopics.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Standard / Grade Select */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Standard/Grade
          </label>
          <div className="relative">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-[#0B1E36] font-medium appearance-none focus:outline-none focus:border-[#0096C7] focus:ring-1 focus:ring-[#0096C7]"
            >
              <option value="10th Grade">10th Grade</option>
              <option value="11th Grade">11th Grade</option>
              <option value="12th Grade">12th Grade</option>
              <option value="9th Grade">9th Grade</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
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
