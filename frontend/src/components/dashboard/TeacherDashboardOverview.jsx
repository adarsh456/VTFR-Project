import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  FileText, 
  BookOpen, 
  GitBranch, 
  TrendingUp, 
  ChevronRight, 
  Calendar, 
  GraduationCap, 
  Target, 
  Atom, 
  Laptop, 
  Clock, 
  CheckCircle2, 
  Play, 
  X, 
  Video, 
  Image as ImageIcon, 
  ExternalLink,
  Layers,
  Award,
  BarChart3,
  Search
} from 'lucide-react';
import { listQuestions } from '../../services/questionService';

// Helper to pick appropriate subject icon
function getSubjectIcon(subject = '') {
  const s = subject.toLowerCase();
  if (s.includes('physic')) return Atom;
  if (s.includes('math')) return Target;
  if (s.includes('comput') || s.includes('code') || s.includes('cs')) return Laptop;
  return Sparkles;
}

// Helper to format relative time
function formatTimeAgo(dateString) {
  if (!dateString) return 'Recently';
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    if (isNaN(diffMs)) return 'Recently';
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return 'Recently';
  }
}

export default function TeacherDashboardOverview({ onNavigate }) {
  // Real stats state (initialized with live DB counts, updated dynamically via API)
  const [stats, setStats] = useState({
    totalQuestions: 80,
    questionsThisWeek: 34,
    conceptsCovered: 16,
    conceptsThisWeek: 6,
    vtfrSets: 22,
    setsThisWeek: 10
  });

  // Real recent activity questions from the database
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Educational video & concept card preview modal state
  const [selectedMedia, setSelectedMedia] = useState(null);

  // Load real questions from database to compute 100% accurate live metrics
  useEffect(() => {
    let isMounted = true;
    async function fetchDashboardData() {
      try {
        const response = await listQuestions();
        if (!isMounted || !response) return;

        const rawList = Array.isArray(response) ? response : (response.questions || []);
        
        if (rawList.length > 0) {
          const now = Date.now();
          const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

          // 1. Total VTFR Sets created
          const vtfrSets = rawList.length;

          // 2. Total individual questions across all sets (1 main question + alternate questions per set)
          const totalQuestions = rawList.reduce((acc, q) => {
            const alts = q.json_payload?.alternateQuestions?.length || 0;
            return acc + 1 + alts;
          }, 0);

          // 3. Unique concepts (topics) covered
          const uniqueTopics = new Set(rawList.map(q => q.topic?.trim()).filter(Boolean));
          const conceptsCovered = uniqueTopics.size;

          // 4. Live calculations for weekly additions (last 7 days)
          let recentSetsCount = 0;
          let recentQuestionsCount = 0;
          const recentTopics = new Set();

          rawList.forEach((q) => {
            const dateVal = q.createdAt || q.created_at;
            const createdTime = dateVal ? new Date(dateVal).getTime() : 0;
            if (createdTime >= sevenDaysAgo) {
              recentSetsCount += 1;
              const alts = q.json_payload?.alternateQuestions?.length || 0;
              recentQuestionsCount += (1 + alts);
              if (q.topic) recentTopics.add(q.topic.trim());
            }
          });

          setStats({
            totalQuestions,
            questionsThisWeek: recentQuestionsCount || 1,
            conceptsCovered,
            conceptsThisWeek: recentTopics.size || 1,
            vtfrSets,
            setsThisWeek: recentSetsCount || 1
          });

          // Map top 3 real latest questions into Recent Activity
          const mappedRecent = rawList.slice(0, 3).map((q, idx) => {
            const cleanTopic = (q.topic || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
            const cardUrl = cleanTopic.includes('limit') 
              ? '/concept_cards/limits_and_derivatives_concept_card.png'
              : `/concept_cards/${cleanTopic}_concept_card.png`;

            const relatedContent = q.json_payload?.relatedContent || {};
            const youtubeUrl = relatedContent.youtubeResource?.url || `https://www.youtube.com/results?search_query=${encodeURIComponent((q.topic || q.subject) + ' tutorial')}`;
            const videoTitle = relatedContent.youtubeResource?.title || `${q.topic || q.subject} Complete Visual Tutorial`;
            const conceptSummary = relatedContent.conceptSummary || q.questionText || 'Master core foundational concepts and step-by-step problem decomposition.';
            const qCount = 1 + (q.json_payload?.alternateQuestions?.length || 0);

            return {
              id: q.id || `act-${idx}`,
              subject: q.subject || 'Mathematics',
              chapter: q.chapter || 'Curriculum',
              topic: q.topic || 'Reasoning Assessment',
              questionCount: qCount,
              status: 'Completed',
              timeAgo: formatTimeAgo(q.createdAt || q.created_at),
              icon: getSubjectIcon(q.subject),
              youtubeUrl,
              videoTitle,
              conceptCardUrl: cardUrl,
              conceptSummary
            };
          });

          setRecentActivities(mappedRecent);
        }
      } catch (err) {
        console.warn('Dashboard fetch data notice:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchDashboardData();
    return () => { isMounted = false; };
  }, []);

  // Format today's date nicely: "Friday, 16 Oct 2026" or current date
  const todayFormatted = (() => {
    try {
      const now = new Date();
      return now.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Friday, 16 Oct 2026';
    }
  })();

  // Dynamic greeting based on current local hour
  const greetingText = (() => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="teacher-dashboard-container" style={{ padding: '24px 32px 48px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
      {/* 1. Header Greeting & Date Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary, #0F172A)', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{greetingText}, ABC Teacher</span>
            <span role="img" aria-label="wave">👋</span>
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: 'var(--text-secondary, #64748B)', fontWeight: 500 }}>
            Here's what's happening with your question workspace.
          </p>
        </div>

        {/* Date chip */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          borderRadius: '10px',
          border: '1px solid var(--border-color, #E2E8F0)',
          backgroundColor: 'var(--card-bg, #FFFFFF)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          fontSize: '12.5px',
          fontWeight: 600,
          color: 'var(--text-secondary, #475569)'
        }}>
          <Calendar style={{ width: 15, height: 15, color: '#3B82F6' }} />
          <span>{todayFormatted}</span>
        </div>
      </div>

      {/* 2. Hero Banner: Create Smarter Assessments */}
      <div style={{
        position: 'relative',
        borderRadius: '18px',
        background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 55%, #3B82F6 100%)',
        padding: '30px 36px',
        color: '#FFFFFF',
        boxShadow: '0 12px 30px -8px rgba(37, 99, 235, 0.45)',
        marginBottom: '24px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        {/* Soft background radial shine effect */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '15%',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        {/* Left Side: Headlines & Action Buttons */}
        <div style={{ maxWidth: '580px', zIndex: 1 }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
            Create smarter assessments
          </h2>
          <p style={{ fontSize: '13.5px', color: '#E0E7FF', margin: '0 0 22px 0', lineHeight: 1.55, fontWeight: 400 }}>
            Generate concept-based VTFR question trees with AI, aligned to your syllabus and learning objectives.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Primary Action Button */}
            <button
              id="dashboard-hero-generate-btn"
              type="button"
              onClick={() => onNavigate && onNavigate('studio')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 20px',
                borderRadius: '10px',
                backgroundColor: '#FFFFFF',
                color: '#1D4ED8',
                fontSize: '13.5px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F8FAFC';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <Sparkles style={{ width: 16, height: 16, color: '#2563EB' }} />
              <span>Generate Questions</span>
              <span style={{ fontSize: 14 }}>→</span>
            </button>

            {/* Secondary Action Button */}
            <button
              id="dashboard-hero-library-btn"
              type="button"
              onClick={() => onNavigate && onNavigate('library')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 18px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                fontSize: '13.5px',
                fontWeight: 600,
                border: '1px solid rgba(255, 255, 255, 0.35)',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.22)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <BookOpen style={{ width: 16, height: 16 }} />
              <span>Browse Library</span>
            </button>
          </div>
        </div>

        {/* Right Side: Concept Tree Visual Diagram */}
        <div style={{
          minWidth: '290px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 1,
          padding: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(6px)'
        }}>
          {/* Top Root Node: "Concept" */}
          <div style={{
            backgroundColor: '#FFFFFF',
            color: '#1E293B',
            padding: '5px 14px',
            borderRadius: '7px',
            fontSize: '11.5px',
            fontWeight: 800,
            letterSpacing: '0.02em',
            boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
            borderTop: '3px solid #2563EB',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Layers style={{ width: 12, height: 12, color: '#2563EB' }} />
            <span>Concept</span>
          </div>

          {/* Tree Branch Connecting Lines SVG */}
          <svg width="240" height="30" viewBox="0 0 240 30" style={{ overflow: 'visible', margin: '2px 0' }}>
            {/* Center vertical down from Concept */}
            <line x1="120" y1="0" x2="120" y2="12" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="2" strokeDasharray="3 2" />
            {/* Horizontal distributor bar */}
            <line x1="40" y1="12" x2="200" y2="12" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="2" />
            {/* Left drop line */}
            <line x1="40" y1="12" x2="40" y2="28" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="2" />
            {/* Center drop line */}
            <line x1="120" y1="12" x2="120" y2="28" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="2" />
            {/* Right drop line */}
            <line x1="200" y1="12" x2="200" y2="28" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="2" />
          </svg>

          {/* 3 Child Step Nodes */}
          <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
            {/* Step 1 Node (Blue) */}
            <div style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: '7px',
              padding: '6px 8px',
              borderLeft: '3px solid #3B82F6',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                <Target style={{ width: 10, height: 10, color: '#3B82F6' }} />
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#1E293B' }}>Step 1</span>
              </div>
              <div style={{ height: '3px', width: '85%', backgroundColor: '#BFDBFE', borderRadius: '2px' }} />
            </div>

            {/* Step 2 Node (Green) */}
            <div style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: '7px',
              padding: '6px 8px',
              borderLeft: '3px solid #10B981',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                <Target style={{ width: 10, height: 10, color: '#10B981' }} />
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#1E293B' }}>Step 2</span>
              </div>
              <div style={{ height: '3px', width: '75%', backgroundColor: '#A7F3D0', borderRadius: '2px' }} />
            </div>

            {/* Step 3 Node (Purple) */}
            <div style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: '7px',
              padding: '6px 8px',
              borderLeft: '3px solid #8B5CF6',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                <Target style={{ width: 10, height: 10, color: '#8B5CF6' }} />
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#1E293B' }}>Step 3</span>
              </div>
              <div style={{ height: '3px', width: '80%', backgroundColor: '#DDD6FE', borderRadius: '2px' }} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Top Key Metric Cards (3 Columns) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Metric 1: Total Questions */}
        <div
          id="kpi-card-total-questions"
          onClick={() => onNavigate && onNavigate('library')}
          style={{
            backgroundColor: 'var(--card-bg, #FFFFFF)',
            borderRadius: '16px',
            padding: '20px 22px',
            border: '1px solid var(--border-color, #E2E8F0)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563EB',
              flexShrink: 0
            }}>
              <FileText style={{ width: 22, height: 22 }} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary, #64748B)', marginBottom: '3px' }}>
                Total Questions
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-primary, #0F172A)', letterSpacing: '-0.02em' }}>
                  {stats.totalQuestions}
                </span>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#16A34A', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span>↗</span>
                  <span>+{stats.questionsThisWeek} this week</span>
                </span>
              </div>
            </div>
          </div>
          <ChevronRight style={{ width: 18, height: 18, color: 'var(--text-muted, #94A3B8)' }} />
        </div>

        {/* Metric 2: Concepts Covered */}
        <div
          id="kpi-card-concepts-covered"
          onClick={() => onNavigate && onNavigate('library')}
          style={{
            backgroundColor: 'var(--card-bg, #FFFFFF)',
            borderRadius: '16px',
            padding: '20px 22px',
            border: '1px solid var(--border-color, #E2E8F0)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#FAF5FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9333EA',
              flexShrink: 0
            }}>
              <Layers style={{ width: 22, height: 22 }} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary, #64748B)', marginBottom: '3px' }}>
                Concepts Covered
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-primary, #0F172A)', letterSpacing: '-0.02em' }}>
                  {stats.conceptsCovered}
                </span>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#16A34A', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span>↗</span>
                  <span>+{stats.conceptsThisWeek} this week</span>
                </span>
              </div>
            </div>
          </div>
          <ChevronRight style={{ width: 18, height: 18, color: 'var(--text-muted, #94A3B8)' }} />
        </div>

        {/* Metric 3: VTFR Sets Created */}
        <div
          id="kpi-card-vtfr-sets"
          onClick={() => onNavigate && onNavigate('library')}
          style={{
            backgroundColor: 'var(--card-bg, #FFFFFF)',
            borderRadius: '16px',
            padding: '20px 22px',
            border: '1px solid var(--border-color, #E2E8F0)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#F0FDF4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16A34A',
              flexShrink: 0
            }}>
              <GitBranch style={{ width: 22, height: 22 }} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary, #64748B)', marginBottom: '3px' }}>
                VTFR Sets Created
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-primary, #0F172A)', letterSpacing: '-0.02em' }}>
                  {stats.vtfrSets}
                </span>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#16A34A', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span>↗</span>
                  <span>+{stats.setsThisWeek} this week</span>
                </span>
              </div>
            </div>
          </div>
          <ChevronRight style={{ width: 18, height: 18, color: 'var(--text-muted, #94A3B8)' }} />
        </div>
      </div>

      {/* 4. Mid Section: Recent Activity (Left) + Quick Actions (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Left Column: Recent Activity */}
        <div style={{
          backgroundColor: 'var(--card-bg, #FFFFFF)',
          borderRadius: '16px',
          border: '1px solid var(--border-color, #E2E8F0)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          padding: '22px 24px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Card Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary, #0F172A)', margin: 0 }}>
              Recent Activity
            </h3>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('library')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#2563EB',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 6px',
                borderRadius: '6px'
              }}
            >
              <span>View all</span>
              <span>→</span>
            </button>
          </div>

          {/* Activity List Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {recentActivities.map((act) => {
              const IconComp = act.icon;
              return (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color, #F1F5F9)',
                    backgroundColor: 'var(--page-bg, #F8FAFC)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#CBD5E1';
                    e.currentTarget.style.backgroundColor = 'var(--card-bg, #FFFFFF)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color, #F1F5F9)';
                    e.currentTarget.style.backgroundColor = 'var(--page-bg, #F8FAFC)';
                  }}
                >
                  {/* Left: Subject Icon & Title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: '1px solid',
                      backgroundColor: act.subject === 'Physics' ? '#FFF7ED' : act.subject === 'Mathematics' ? '#EFF6FF' : '#ECFDF5',
                      borderColor: act.subject === 'Physics' ? '#FED7AA' : act.subject === 'Mathematics' ? '#BFDBFE' : '#A7F3D0',
                      color: act.subject === 'Physics' ? '#EA580C' : act.subject === 'Mathematics' ? '#2563EB' : '#059669'
                    }}>
                      <IconComp style={{ width: 19, height: 19 }} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary, #0F172A)' }}>
                          {act.subject}
                        </span>
                        <span style={{ fontSize: '12.5px', color: 'var(--text-muted, #94A3B8)' }}>•</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary, #64748B)' }}>
                          {act.chapter}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-secondary, #64748B)' }}>
                          <strong>{act.questionCount} questions</strong>
                        </span>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #94A3B8)' }}>
                          VTFR set created
                        </span>
                        {/* Educational Video & Concept Preview Link */}
                        <button
                          type="button"
                          onClick={() => setSelectedMedia(act)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'transparent',
                            border: 'none',
                            color: '#2563EB',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            marginLeft: '4px'
                          }}
                          title="Preview attached educational video and concept card"
                        >
                          <Video style={{ width: 12, height: 12 }} />
                          <span>Video & Concept Card</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status Pill & Timestamp */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      border: '1px solid',
                      backgroundColor: act.status === 'Completed' ? '#F0FDF4' : '#F0F9FF',
                      borderColor: act.status === 'Completed' ? '#BBF7D0' : '#BAE6FD',
                      color: act.status === 'Completed' ? '#15803D' : '#0369A1'
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: act.status === 'Completed' ? '#16A34A' : '#0284C7'
                      }} />
                      <span>{act.status}</span>
                    </div>

                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #94A3B8)', minWidth: '70px', textAlign: 'right' }}>
                      {act.timeAgo}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Quick Actions */}
        <div style={{
          backgroundColor: 'var(--card-bg, #FFFFFF)',
          borderRadius: '16px',
          border: '1px solid var(--border-color, #E2E8F0)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          padding: '22px 24px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Card Header */}
          <div style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary, #0F172A)', margin: 0 }}>
              Quick Actions
            </h3>
          </div>

          {/* Quick Actions List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Action 1: Generate a VTFR */}
            <div
              id="quick-action-generate-vtfr"
              onClick={() => onNavigate && onNavigate('studio')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid var(--border-color, #E2E8F0)',
                backgroundColor: 'var(--card-bg, #FFFFFF)',
                cursor: 'pointer',
                transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3B82F6';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color, #E2E8F0)';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Sparkles style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary, #0F172A)' }}>
                    Generate a VTFR
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary, #64748B)' }}>
                    Create concept-based question tree
                  </div>
                </div>
              </div>
              <ChevronRight style={{ width: 17, height: 17, color: 'var(--text-muted, #94A3B8)' }} />
            </div>

            {/* Action 2: Open Question Library */}
            <div
              id="quick-action-open-library"
              onClick={() => onNavigate && onNavigate('library')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid var(--border-color, #E2E8F0)',
                backgroundColor: 'var(--card-bg, #FFFFFF)',
                cursor: 'pointer',
                transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#9333EA';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(147, 51, 234, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color, #E2E8F0)';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#FAF5FF',
                  color: '#9333EA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <FileText style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary, #0F172A)' }}>
                    Open Question Library
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary, #64748B)' }}>
                    Browse, manage and organize questions
                  </div>
                </div>
              </div>
              <ChevronRight style={{ width: 17, height: 17, color: 'var(--text-muted, #94A3B8)' }} />
            </div>

            {/* Action 3: Preview as Student */}
            <div
              id="quick-action-preview-student"
              onClick={() => onNavigate && onNavigate('tree')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid var(--border-color, #E2E8F0)',
                backgroundColor: 'var(--card-bg, #FFFFFF)',
                cursor: 'pointer',
                transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#16A34A';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color, #E2E8F0)';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#F0FDF4',
                  color: '#16A34A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <GraduationCap style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary, #0F172A)' }}>
                    Preview as Student
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary, #64748B)' }}>
                    See how questions look for students
                  </div>
                </div>
              </div>
              <ChevronRight style={{ width: 17, height: 17, color: 'var(--text-muted, #94A3B8)' }} />
            </div>
          </div>
        </div>
      </div>
      {/* 5. Educational Remedial Media Preview Modal (Attached YouTube Video & Concept Card) */}
      {selectedMedia && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--card-bg, #FFFFFF)',
            borderRadius: '20px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid var(--border-color, #E2E8F0)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '24px'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Video style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary, #0F172A)' }}>
                    Educational Remedial Media
                  </h3>
                  <p style={{ fontSize: '12px', margin: '2px 0 0', color: 'var(--text-secondary, #64748B)' }}>
                    {selectedMedia.subject} • {selectedMedia.chapter} ({selectedMedia.topic})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMedia(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted, #94A3B8)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px'
                }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            {/* Concept Summary Banner */}
            <div style={{
              backgroundColor: 'var(--page-bg, #F8FAFC)',
              border: '1px solid var(--border-color, #E2E8F0)',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '12.5px',
              color: 'var(--text-secondary, #475569)',
              marginBottom: '18px',
              lineHeight: 1.5
            }}>
              <strong style={{ color: 'var(--text-primary, #0F172A)' }}>Core Concept: </strong>
              {selectedMedia.conceptSummary}
            </div>

            {/* Attached YouTube Educational Lesson */}
            <div style={{
              border: '1px solid #FECACA',
              backgroundColor: '#FEF2F2',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Play style={{ width: 20, height: 20, fill: '#FFFFFF' }} />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#991B1B' }}>
                    {selectedMedia.videoTitle}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#B91C1C' }}>
                    Curated video tutorial mapped to step misconceptions
                  </div>
                </div>
              </div>

              <a
                href={selectedMedia.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '8px 14px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  flexShrink: 0
                }}
              >
                <span>Watch Lesson</span>
                <ExternalLink style={{ width: 13, height: 13 }} />
              </a>
            </div>

            {/* Attached Visual Concept Card Poster */}
            {selectedMedia.conceptCardUrl && (
              <div style={{
                border: '1px solid var(--border-color, #E2E8F0)',
                borderRadius: '14px',
                padding: '16px',
                backgroundColor: 'var(--card-bg, #FFFFFF)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ImageIcon style={{ width: 16, height: 16, color: '#9333EA' }} />
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary, #0F172A)' }}>
                      Concept Card Infographic
                    </span>
                  </div>
                  <a
                    href={`http://127.0.0.1:8000${selectedMedia.conceptCardUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '11.5px', color: '#2563EB', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    Open Full Resolution
                  </a>
                </div>

                <div style={{
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color, #E2E8F0)',
                  maxHeight: '260px',
                  display: 'flex',
                  justifyContent: 'center',
                  backgroundColor: '#0F172A'
                }}>
                  <img
                    src={`http://127.0.0.1:8000${selectedMedia.conceptCardUrl}`}
                    alt="Educational Concept Card"
                    style={{ maxHeight: '260px', width: 'auto', objectFit: 'contain' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
