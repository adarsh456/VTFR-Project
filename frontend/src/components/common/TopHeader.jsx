import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Bell, GraduationCap, ChevronDown, Sun, Moon, User, X, BookOpen, Tag } from 'lucide-react';
import { DEFAULT_GRADE_SYLLABUS } from '../../data/curriculumData';

export default function TopHeader() {
  // Initialize theme from localStorage; default to light if not explicitly set to 'dark'
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem('theme') === 'dark';
    } catch {
      return false;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef(null);

  // Apply theme class to root element and persist preference
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Close search popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search across curriculum syllabus topics, chapters, and subjects
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const matches = [];
    try {
      Object.entries(DEFAULT_GRADE_SYLLABUS || {}).forEach(([grd, subjects]) => {
        Object.entries(subjects || {}).forEach(([subj, chapters]) => {
          Object.entries(chapters || {}).forEach(([chap, topics]) => {
            (topics || []).forEach((top) => {
              if (
                top.toLowerCase().includes(q) ||
                chap.toLowerCase().includes(q) ||
                subj.toLowerCase().includes(q)
              ) {
                matches.push({ grade: grd, subject: subj, chapter: chap, topic: top });
              }
            });
          });
        });
      });
    } catch {
      // fallback
    }
    return matches.slice(0, 6);
  }, [searchQuery]);

  const handleSelectResult = (item) => {
    setSearchQuery(item.topic);
    setShowResults(false);
    // Dispatch an event so AIQuestionStudio can auto-load this grade/subject/chapter/topic
    window.dispatchEvent(new CustomEvent('selectCurriculumTopic', { detail: item }));
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      handleSelectResult(searchResults[0]);
    } else if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  return (
    <header className="top-header">
      {/* Brand Logo & Divider */}
      <div className="header-left">
        <a href="#studio" className="header-brand">
          <div className="brand-cap-3d-box">
            <GraduationCap className="brand-cap-icon-3d" />
          </div>
          <span className="brand-text-logo">
            LearnLive <strong className="brand-bold">VTFR</strong>
          </span>
        </a>
        <div className="header-divider-pipe">|</div>
      </div>

      {/* Global Search Bar with Live Autocomplete */}
      <div className="header-search" ref={searchContainerRef} style={{ position: 'relative' }}>
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search topics, chapters, subjects..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            onKeyDown={handleSearchKeyDown}
            className="search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setShowResults(false);
              }}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 2
              }}
              title="Clear search"
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>

        {/* Floating Search Autocomplete Dropdown */}
        {showResults && searchQuery.trim().length >= 2 && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
              borderRadius: 8,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
              border: isDarkMode ? '1px solid #334155' : '1px solid #E2E8F0',
              overflow: 'hidden',
              zIndex: 999
            }}
          >
            {searchResults.length > 0 ? (
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                <div
                  style={{
                    padding: '8px 12px 4px',
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: isDarkMode ? '#94A3B8' : '#64748B'
                  }}
                >
                  Matching Curriculum Topics ({searchResults.length})
                </div>
                {searchResults.map((item, index) => (
                  <div
                    key={`${item.grade}-${item.subject}-${item.topic}-${index}`}
                    onClick={() => handleSelectResult(item)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: isDarkMode ? '1px solid #334155' : '1px solid #F1F5F9',
                      transition: 'background-color 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isDarkMode ? '#334155' : '#F0F9FF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: isDarkMode ? '#F8FAFC' : '#0F172A',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Tag style={{ width: 12, height: 12, color: '#00D2C8', flexShrink: 0 }} />
                      <span>{item.topic}</span>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: isDarkMode ? '#94A3B8' : '#64748B',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        paddingLeft: 18
                      }}
                    >
                      <span>{item.grade}</span>
                      <span>•</span>
                      <span>{item.subject}</span>
                      <span>•</span>
                      <span>{item.chapter}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: '16px 12px',
                  textAlign: 'center',
                  fontSize: 12,
                  color: isDarkMode ? '#94A3B8' : '#64748B'
                }}
              >
                No topics found matching "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls: Notification Bell, Divider, Theme Toggle Pill, User Profile */}
      <div className="header-right">
        {/* Notification Bell */}
        <button type="button" className="header-icon-btn" title="Notifications">
          <Bell style={{ width: 19, height: 19, color: '#FFFFFF' }} />
        </button>

        {/* Divider */}
        <div className="header-right-divider">|</div>

        {/* Theme Toggle Pill */}
        <div
          className="theme-toggle-pill"
          onClick={() => setIsDarkMode(!isDarkMode)}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{ cursor: 'pointer' }}
        >
          <div className={`theme-toggle-icon ${!isDarkMode ? 'active-sun' : 'inactive'}`}>
            <Sun style={{ width: 14, height: 14 }} />
          </div>
          <div className={`theme-toggle-icon ${isDarkMode ? 'active-moon' : 'inactive'}`}>
            <Moon style={{ width: 13, height: 13, fill: '#FFFFFF' }} />
          </div>
        </div>

        {/* User Profile */}
        <div className="user-profile">
          <div className="user-avatar-silhouette">
            <User style={{ width: 18, height: 18, color: '#0F172A', fill: '#0F172A' }} />
          </div>
          <div className="user-info-text">
            <span className="user-name">ABC Teacher</span>
            <span className="user-role-label">Teacher</span>
          </div>
          <ChevronDown className="user-chevron" style={{ width: 15, height: 15, color: '#94A3B8' }} />
        </div>
      </div>
    </header>
  );
}
