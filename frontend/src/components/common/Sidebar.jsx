import React, { useState } from 'react';
import { 
  Home, 
  FileEdit, 
  FileText, 
  KeyRound, 
  GitBranch, 
  Settings,
  Lightbulb,
  X,
  Check,
  Key
} from 'lucide-react';

import ApiKeyModal from './ApiKeyModal';

export default function Sidebar({ activeNav = 'studio', onNavChange }) {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  const mainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'studio', label: 'Generate VTFR', icon: FileEdit },
    { id: 'library', label: 'Question Library', icon: FileText },
    { id: 'api_key', label: 'Update API Key', icon: KeyRound },
    { id: 'tree', label: 'Student Preview', icon: GitBranch },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id) => {
    if (id === 'api_key') {
      setShowApiKeyModal(true);
      return;
    }
    if (onNavChange) {
      onNavChange(id);
    }
  };

  return (
    <>
      <aside className="sidebar">
        {/* Navigation Links List */}
        <div className="sidebar-nav-list">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = (activeNav === 'studio' && item.id === 'studio') || (activeNav === item.id && item.id !== 'api_key');

            return (
              <button
                id={`sidebar-nav-${item.id}`}
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`sidebar-btn ${isActive ? 'active' : ''}`}
              >
                <Icon className="sidebar-icon" />
                <span className="sidebar-label">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom Branding (Lightbulb: Better Questions. Brighter Learning.) */}
        <div className="sidebar-bottom-branding">
          <div className="branding-icon-wrap">
            <Lightbulb style={{ width: 18, height: 18 }} />
          </div>
          <div className="branding-text-block">
            <span className="branding-text-main">Better Questions.</span>
            <span className="branding-text-sub">Brighter Learning.</span>
          </div>
        </div>
      </aside>

      {/* Connected Update API Key Modal (Groq & Hugging Face) */}
      <ApiKeyModal 
        isOpen={showApiKeyModal} 
        onClose={() => setShowApiKeyModal(false)} 
      />
    </>
  );
}

