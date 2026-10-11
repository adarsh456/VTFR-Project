import React from 'react';
import { GraduationCap, LayoutDashboard, Sparkles, BookOpen, ExternalLink } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <header className="sticky top-0 z-50 shadow-sm border-b border-gray-200">
      {/* Top Institutional Metadata Bar */}
      <div className="bg-[#0B2545] text-white text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="font-bold tracking-wide text-sky-300">MKCL VTFR Intelligent Assessment Platform</span>
            <span className="hidden md:inline text-gray-400">|</span>
            <span className="hidden md:inline text-gray-300">Virtual Time Fixed Response Learning Engine</span>
          </div>
          <div className="flex items-center gap-4 text-gray-300 text-[11px]">
            <a
              href="https://learnlive.mkcl.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>LearnLive Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="bg-white px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('student')}>
            <div className="w-10 h-10 rounded-lg bg-[#0B2545] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <Sparkles className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="font-extrabold text-xl text-[#0B2545] tracking-tight flex items-center gap-2">
                <span>MKCL</span>
                <span className="text-[#0077B6] font-semibold text-lg">VTFR System</span>
              </div>
              <div className="text-[11px] text-gray-500 font-medium">Adaptive Learning & Diagnostic Assessment</div>
            </div>
          </div>

          {/* Tab Navigation Cluster */}
          <nav className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab('student')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'student'
                  ? 'bg-[#0077B6] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Portal</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('teacher')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'teacher'
                  ? 'bg-[#0B2545] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Teacher Workspace</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
