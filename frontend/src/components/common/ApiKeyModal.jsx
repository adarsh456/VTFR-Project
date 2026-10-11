import React, { useState, useEffect } from 'react';
import { KeyRound, X, Check, Eye, EyeOff, Sparkles, ExternalLink, ShieldCheck, RefreshCw, Server, Cpu } from 'lucide-react';
import { getApiKeysStatus, updateApiKeys } from '../../services/configService';

export default function ApiKeyModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('groq'); // 'groq' | 'huggingface'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusData, setStatusData] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Key inputs
  const [groqInput, setGroqInput] = useState('');
  const [hfInput, setHfInput] = useState('');
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showHfKey, setShowHfKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchKeyStatus();
      setError(null);
      setSuccessMsg(null);
      setGroqInput('');
      setHfInput('');
    }
  }, [isOpen]);

  const fetchKeyStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getApiKeysStatus();
      setStatusData(data);
    } catch (err) {
      setError('Failed to fetch current API key status from backend.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleUpdateKey = async (providerToUpdate) => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const payload = { provider: providerToUpdate };
      if (providerToUpdate === 'groq') {
        if (!groqInput.trim()) {
          setError('Please enter a valid Groq API key.');
          setSaving(false);
          return;
        }
        payload.groqApiKey = groqInput.trim();
      } else if (providerToUpdate === 'huggingface') {
        if (!hfInput.trim()) {
          setError('Please enter a valid Hugging Face API token.');
          setSaving(false);
          return;
        }
        payload.huggingfaceApiKey = hfInput.trim();
      }

      const res = await updateApiKeys(payload);
      setSuccessMsg(
        providerToUpdate === 'groq'
          ? 'Groq API Key successfully updated in .env files & runtime!'
          : 'Hugging Face API Key successfully updated in .env files & runtime!'
      );
      if (res.currentStatus) {
        setStatusData(res.currentStatus);
      } else {
        await fetchKeyStatus();
      }

      if (providerToUpdate === 'groq') setGroqInput('');
      if (providerToUpdate === 'huggingface') setHfInput('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save API key.');
    } finally {
      setSaving(false);
    }
  };

  const groqStatus = statusData?.providers?.groq;
  const hfStatus = statusData?.providers?.huggingface;

  return (
    <div className="resource-modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="resource-modal-card" 
        style={{ maxWidth: 540, width: '92%', borderRadius: 16, overflow: 'hidden' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="resource-modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <div className="resource-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <KeyRound style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Update AI Provider API Keys</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Connected to root and backend .env files</div>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="resource-modal-close-btn"
            style={{ borderRadius: 8, padding: 4 }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="resource-modal-body" style={{ padding: '20px' }}>
          {/* Tabs */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 8, 
            background: '#f1f5f9', 
            padding: 4, 
            borderRadius: 10,
            marginBottom: 18
          }}>
            <button
              type="button"
              onClick={() => { setActiveTab('groq'); setError(null); setSuccessMsg(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: activeTab === 'groq' ? '#ffffff' : 'transparent',
                color: activeTab === 'groq' ? '#1e293b' : '#64748b',
                boxShadow: activeTab === 'groq' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              <Cpu style={{ width: 16, height: 16, color: '#f97316' }} />
              <span>Update Groq API</span>
              {groqStatus?.isConfigured && (
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  display: 'inline-block'
                }} />
              )}
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('huggingface'); setError(null); setSuccessMsg(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: activeTab === 'huggingface' ? '#ffffff' : 'transparent',
                color: activeTab === 'huggingface' ? '#1e293b' : '#64748b',
                boxShadow: activeTab === 'huggingface' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              <Sparkles style={{ width: 16, height: 16, color: '#eab308' }} />
              <span>Update Hugging Face API</span>
              {hfStatus?.isConfigured && (
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  display: 'inline-block'
                }} />
              )}
            </button>
          </div>

          {/* Feedback messages */}
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: 12,
              padding: '10px 12px',
              borderRadius: 8,
              marginBottom: 16
            }}>
              {error}
            </div>
          )}

          {successMsg && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#15803d',
              fontSize: 12,
              padding: '10px 12px',
              borderRadius: 8,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <Check style={{ width: 15, height: 15 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Tab 1: Groq API Key */}
          {activeTab === 'groq' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 13
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>Groq Cloud Provider</span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 12,
                      backgroundColor: groqStatus?.isConfigured ? '#dcfce7' : '#fee2e2',
                      color: groqStatus?.isConfigured ? '#15803d' : '#b91c1c'
                    }}>
                      {groqStatus?.isConfigured ? 'Connected' : 'Not Set'}
                    </span>
                  </div>
                  <a 
                    href="https://console.groq.com/keys" 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ fontSize: 11, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}
                  >
                    <span>Get Free Key</span>
                    <ExternalLink style={{ width: 11, height: 11 }} />
                  </a>
                </div>
                <div style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>
                  Powers ultra-fast inference with <strong>Llama-3.3-70b-versatile</strong> and <strong>Llama-3.1-8b-instant</strong>.
                </div>
                {groqStatus?.maskedKey && (
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>
                    Current Key: <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>{groqStatus.maskedKey}</code>
                  </div>
                )}
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
                  New Groq API Key <span style={{ color: '#94a3b8', fontWeight: 400 }}>(GROQ_API_KEY)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showGroqKey ? 'text' : 'password'}
                    value={groqInput}
                    onChange={(e) => setGroqInput(e.target.value)}
                    placeholder="gsk_..."
                    className="select-input"
                    style={{ padding: '10px 40px 10px 12px', fontSize: 13, width: '100%', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowGroqKey(!showGroqKey)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      padding: 4
                    }}
                  >
                    {showGroqKey ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleUpdateKey('groq')}
                disabled={saving || !groqInput.trim()}
                className="btn-generate-action"
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 4,
                  opacity: (!groqInput.trim() || saving) ? 0.7 : 1,
                  cursor: (!groqInput.trim() || saving) ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? (
                  <>
                    <RefreshCw className="animate-spin" style={{ width: 14, height: 14 }} />
                    <span>Updating Groq Key...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck style={{ width: 16, height: 16 }} />
                    <span>Save Groq API Key</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Tab 2: Hugging Face API Key */}
          {activeTab === 'huggingface' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 13
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>Hugging Face Provider</span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 12,
                      backgroundColor: hfStatus?.isConfigured ? '#dcfce7' : '#fee2e2',
                      color: hfStatus?.isConfigured ? '#15803d' : '#b91c1c'
                    }}>
                      {hfStatus?.isConfigured ? 'Connected' : 'Not Set'}
                    </span>
                  </div>
                  <a 
                    href="https://huggingface.co/settings/tokens" 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ fontSize: 11, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}
                  >
                    <span>Get User Token</span>
                    <ExternalLink style={{ width: 11, height: 11 }} />
                  </a>
                </div>
                <div style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>
                  Powers fallback generation with <strong>Llama-3.3-70B-Instruct</strong> and <strong>Qwen2.5-72B-Instruct</strong>.
                </div>
                {hfStatus?.maskedKey && (
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>
                    Current Key: <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>{hfStatus.maskedKey}</code>
                  </div>
                )}
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
                  New Hugging Face Token <span style={{ color: '#94a3b8', fontWeight: 400 }}>(HUGGINGFACEHUB_API_TOKEN)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showHfKey ? 'text' : 'password'}
                    value={hfInput}
                    onChange={(e) => setHfInput(e.target.value)}
                    placeholder="hf_..."
                    className="select-input"
                    style={{ padding: '10px 40px 10px 12px', fontSize: 13, width: '100%', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowHfKey(!showHfKey)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      padding: 4
                    }}
                  >
                    {showHfKey ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleUpdateKey('huggingface')}
                disabled={saving || !hfInput.trim()}
                className="btn-generate-action"
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 4,
                  opacity: (!hfInput.trim() || saving) ? 0.7 : 1,
                  cursor: (!hfInput.trim() || saving) ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? (
                  <>
                    <RefreshCw className="animate-spin" style={{ width: 14, height: 14 }} />
                    <span>Updating Hugging Face Token...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck style={{ width: 16, height: 16 }} />
                    <span>Save Hugging Face Token</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Sync status info banner */}
          <div style={{
            marginTop: 18,
            padding: '10px 12px',
            borderRadius: 8,
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            fontSize: 11,
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Server style={{ width: 14, height: 14, flexShrink: 0, color: '#3b82f6' }} />
            <div>
              Auto-syncs across <strong>root .env</strong> and <strong>backend .env</strong>. Changes take effect immediately in the runtime engine.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
