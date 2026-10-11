import React, { useState } from 'react';
import { Search, Bell, GraduationCap, ChevronDown, Sun, Moon, User } from 'lucide-react';

export default function TopHeader() {
  const [isDarkMode, setIsDarkMode] = useState(true);

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

      {/* Global Search Bar */}
      <div className="header-search">
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search topics, questions, or keywords..."
            defaultValue=""
            className="search-input"
          />
        </div>
      </div>

      {/* Right Controls: Notification Bell, Divider, Theme Toggle Pill, User Profile */}
      <div className="header-right">
        {/* Notification Bell */}
        <button
          type="button"
          className="header-icon-btn"
          title="Notifications"
        >
          <Bell style={{ width: 19, height: 19, color: '#FFFFFF' }} />
        </button>

        {/* Divider Pipe */}
        <div className="header-right-divider">|</div>

        {/* Sun / Moon Theme Toggle Capsule */}
        <div 
          className="theme-toggle-pill"
          onClick={() => setIsDarkMode(!isDarkMode)}
          title="Toggle Light / Dark Mode"
        >
          <div className={`theme-toggle-icon ${!isDarkMode ? 'active-sun' : 'inactive'}`}>
            <Sun style={{ width: 14, height: 14 }} />
          </div>
          <div className={`theme-toggle-icon ${isDarkMode ? 'active-moon' : 'inactive'}`}>
            <Moon style={{ width: 13, height: 13, fill: '#FFFFFF' }} />
          </div>
        </div>

        {/* User Profile: ABC Teacher */}
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
