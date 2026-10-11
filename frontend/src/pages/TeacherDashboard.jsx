import React, { useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import QuestionGeneratorForm from '../components/teacher/QuestionGeneratorForm';
import QuestionStudioPreview from '../components/teacher/QuestionStudioPreview';

export default function TeacherDashboard() {
  const [activeNav, setActiveNav] = useState('studio');
  const [generatedQuestion, setGeneratedQuestion] = useState(null);

  return (
    <div className="flex bg-[#F1F5F9] min-h-[calc(100vh-4rem)]">
      {/* Left Sidebar */}
      <Sidebar activeNav={activeNav} onNavChange={(id) => setActiveNav(id)} />

      {/* Main Studio Workspace */}
      <main className="flex-1 p-6 lg:p-8 max-w-[1500px]">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-[#0B1E36] tracking-tight">
            AI Question Studio
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Design, decompose, and validate Virtual Time Fixed Response assessments with AI distractor taxonomies.
          </p>
        </div>

        {/* Two-Column Studio Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Generator Controls */}
          <div className="lg:col-span-5">
            <QuestionGeneratorForm onQuestionGenerated={(q) => setGeneratedQuestion(q)} />
          </div>

          {/* Right Column: VTFR Decomposed Question Studio */}
          <div className="lg:col-span-7">
            <QuestionStudioPreview question={generatedQuestion} />
          </div>
        </div>
      </main>
    </div>
  );
}
