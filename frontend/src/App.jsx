import React, { useState } from 'react';
import TopHeader from './components/common/TopHeader';
import Sidebar from './components/common/Sidebar';
import AIQuestionStudio from './components/teacher/AIQuestionStudio';
import StudentQuizPage from './pages/StudentQuizPage';
import QuestionLibrary from './components/library/QuestionLibrary';

export default function App() {
  const [activeNav, setActiveNav] = useState('studio');

  return (
    <div className="app-container">
      {/* Top Global Header */}
      <TopHeader />

      {/* Main Layout: Sidebar + Workspace */}
      <div className="main-layout">
        <Sidebar activeNav={activeNav} onNavChange={(id) => setActiveNav(id)} />

        <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {activeNav === 'studio' ? (
            <AIQuestionStudio />
          ) : activeNav === 'library' ? (
            <QuestionLibrary onNavigateToStudio={() => setActiveNav('studio')} />
          ) : activeNav === 'tree' ? (
            <StudentQuizPage />
          ) : (
            <div style={{ padding: 32, maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
              <div className="studio-card">
                <h2 className="card-heading" style={{ textTransform: 'capitalize' }}>
                  {activeNav.replace('_', ' ')}
                </h2>
                <p style={{ fontSize: 13, color: '#64748B' }}>
                  Section active. Click "Question Studio" in the sidebar to return to the AI Question Studio.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
