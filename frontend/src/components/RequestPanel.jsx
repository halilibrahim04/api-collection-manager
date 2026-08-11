import { useState, useEffect } from 'react'
import { FiSend, FiSave } from 'react-icons/fi'
import KeyValueEditor from './KeyValueEditor'
import './RequestPanel.css'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

export default function RequestPanel({ endpoint, onSend, onSave, sending, saving }) {
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('')
  const [activeTab, setActiveTab] = useState('params')
  const [params, setParams] = useState([])
  const [headers, setHeaders] = useState([])
  const [bodyConfig, setBodyConfig] = useState({
    mode: 'none',
    raw: '',
    rawType: 'json',
    formdata: [{ key: '', value: '', enabled: true }],
    urlencoded: [{ key: '', value: '', enabled: true }]
  })
  const [authConfig, setAuthConfig] = useState({ mode: 'none' })
  const [scripts, setScripts] = useState({ prerequest: '', tests: '' })

  useEffect(() => {
    if (endpoint) {
      setMethod(endpoint.method || 'GET')
      const fullUrl = (endpoint.base_url || '') + (endpoint.path || '')
      setUrl(fullUrl)

      // Query params
      if (endpoint.query_params && typeof endpoint.query_params === 'object') {
        const qp = Object.entries(endpoint.query_params).map(([key, value]) => ({
          key, value: String(value), enabled: true
        }))
        setParams(qp.length ? qp : [{ key: '', value: '', enabled: true }])
      } else {
        setParams([{ key: '', value: '', enabled: true }])
      }

      // Headers
      if (endpoint.headers && typeof endpoint.headers === 'object') {
        const h = Object.entries(endpoint.headers).map(([key, value]) => ({
          key, value: String(value), enabled: true
        }))
        setHeaders(h.length ? h : [{ key: '', value: '', enabled: true }])
      } else {
        setHeaders([{ key: '', value: '', enabled: true }])
      }

      // Body
      if (endpoint.body && typeof endpoint.body === 'object' && endpoint.body.mode) {
        setBodyConfig({
          mode: endpoint.body.mode || 'none',
          raw: endpoint.body.raw || '',
          rawType: endpoint.body.options?.raw?.language || 'json',
          formdata: (endpoint.body.formdata || []).length ? endpoint.body.formdata : [{ key: '', value: '', enabled: true }],
          urlencoded: (endpoint.body.urlencoded || []).length ? endpoint.body.urlencoded : [{ key: '', value: '', enabled: true }]
        })
      } else if (endpoint.body && Object.keys(endpoint.body).length > 0) {
        setBodyConfig({
          mode: 'raw',
          raw: typeof endpoint.body === 'string' ? endpoint.body : JSON.stringify(endpoint.body, null, 2),
          rawType: 'json',
          formdata: [{ key: '', value: '', enabled: true }],
          urlencoded: [{ key: '', value: '', enabled: true }]
        })
      } else {
        setBodyConfig({ mode: 'none', raw: '', rawType: 'json', formdata: [{ key: '', value: '', enabled: true }], urlencoded: [{ key: '', value: '', enabled: true }] })
      }

      // Auth
      if (endpoint.auth && Object.keys(endpoint.auth).length > 0) {
        if (endpoint.auth.token && !endpoint.auth.mode) {
          setAuthConfig({ mode: 'bearer', token: endpoint.auth.token })
        } else {
          setAuthConfig({ mode: 'none', ...endpoint.auth })
        }
      } else {
        setAuthConfig({ mode: 'none' })
      }

      // Scripts
      if (endpoint.scripts) {
        setScripts(endpoint.scripts)
      } else {
        setScripts({ prerequest: '', tests: '' })
      }
    }
  }, [endpoint])

  const handleSend = () => {
    if (onSend) {
      onSend({ method, url, params, headers, body, authToken })
    }
  }

  const handleSave = () => {
    if (onSave) {
      onSave({ method, url, params, headers, body, authToken })
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSend()
    }
  }

  const tabs = [
    { id: 'params', label: 'Params', count: params.filter(p => p.key && p.enabled).length },
    { id: 'headers', label: 'Headers', count: headers.filter(h => h.key && h.enabled).length },
    { id: 'body', label: 'Body' },
    { id: 'auth', label: 'Auth' },
    { id: 'scripts', label: 'Scripts', count: (scripts.prerequest || scripts.tests) ? 1 : 0 },
  ]

  return (
    <div className="request-panel" onKeyDown={handleKeyDown}>
      {/* ── URL Bar ── */}
      <div className="url-bar">
        <select
          className={`method-select method-${method.toLowerCase()}`}
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          {METHODS.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          className="url-input"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter request URL..."
        />
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={saving || !endpoint}
          title="Değişiklikleri kaydet"
        >
          <FiSave size={14} />
          <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
        </button>
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={sending || !url}
        >
          {sending ? (
            <span className="send-spinner"></span>
          ) : (
            <FiSend size={14} />
          )}
          <span>{sending ? 'Sending...' : 'Send'}</span>
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="request-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`request-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.count > 0 && <span className="tab-count">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="request-tab-content">
        {activeTab === 'params' && (
          <KeyValueEditor
            pairs={params}
            onChange={setParams}
            keyPlaceholder="Parameter"
            valuePlaceholder="Value"
          />
        )}

        {activeTab === 'headers' && (
          <KeyValueEditor
            pairs={headers}
            onChange={setHeaders}
            keyPlaceholder="Header"
            valuePlaceholder="Value"
          />
        )}

        {activeTab === 'body' && (
          <div className="body-editor">
            <div className="auth-type" style={{ marginBottom: '12px' }}>
              <label style={{ marginRight: '8px' }}>Type</label>
              <select 
                value={bodyConfig.mode}
                onChange={(e) => setBodyConfig({ ...bodyConfig, mode: e.target.value })}
                style={{ appearance: 'auto', WebkitAppearance: 'auto' }}
              >
                <option value="none">none</option>
                <option value="formdata">form-data</option>
                <option value="urlencoded">x-www-form-urlencoded</option>
                <option value="raw">raw</option>
              </select>

              {bodyConfig.mode === 'raw' && (
                <select 
                  value={bodyConfig.rawType}
                  onChange={(e) => setBodyConfig({ ...bodyConfig, rawType: e.target.value })}
                  style={{ appearance: 'auto', WebkitAppearance: 'auto', marginLeft: '8px', color: 'var(--primary)' }}
                >
                  <option value="text">Text</option>
                  <option value="json">JSON</option>
                  <option value="html">HTML</option>
                  <option value="xml">XML</option>
                </select>
              )}
            </div>

            {bodyConfig.mode === 'none' && (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                This request does not have a body
              </div>
            )}

            {bodyConfig.mode === 'raw' && (
              <textarea
                className="body-textarea"
                value={bodyConfig.raw}
                onChange={(e) => setBodyConfig({ ...bodyConfig, raw: e.target.value })}
                placeholder={bodyConfig.rawType === 'json' ? '{ "key": "value" }' : 'Enter data...'}
                spellCheck={false}
              />
            )}

            {bodyConfig.mode === 'formdata' && (
              <KeyValueEditor
                pairs={bodyConfig.formdata}
                onChange={(newPairs) => setBodyConfig({ ...bodyConfig, formdata: newPairs })}
                keyPlaceholder="Key"
                valuePlaceholder="Value"
                allowFile={true}
              />
            )}

            {bodyConfig.mode === 'urlencoded' && (
              <KeyValueEditor
                pairs={bodyConfig.urlencoded}
                onChange={(newPairs) => setBodyConfig({ ...bodyConfig, urlencoded: newPairs })}
                keyPlaceholder="Key"
                valuePlaceholder="Value"
              />
            )}
          </div>
        )}

        {activeTab === 'auth' && (
          <div className="auth-editor">
            <div className="auth-type">
              <label>Type</label>
              <select 
                value={authConfig.mode || 'none'}
                onChange={(e) => setAuthConfig({ mode: e.target.value })}
              >
                <option value="none">No Auth</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="apikey">API Key</option>
              </select>
            </div>
            
            {authConfig.mode === 'bearer' && (
              <div className="auth-token">
                <label>Token</label>
                <input
                  type="text"
                  value={authConfig.token || ''}
                  onChange={(e) => setAuthConfig({ ...authConfig, token: e.target.value })}
                  placeholder="Enter token..."
                />
              </div>
            )}
            
            {authConfig.mode === 'basic' && (
              <div className="auth-token basic-auth">
                <label>Username</label>
                <input
                  type="text"
                  value={authConfig.username || ''}
                  onChange={(e) => setAuthConfig({ ...authConfig, username: e.target.value })}
                  placeholder="Username"
                />
                <label>Password</label>
                <input
                  type="password"
                  value={authConfig.password || ''}
                  onChange={(e) => setAuthConfig({ ...authConfig, password: e.target.value })}
                  placeholder="Password"
                />
              </div>
            )}
            
            {authConfig.mode === 'apikey' && (
              <div className="auth-token apikey-auth">
                <label>Key</label>
                <input
                  type="text"
                  value={authConfig.key || ''}
                  onChange={(e) => setAuthConfig({ ...authConfig, key: e.target.value })}
                  placeholder="API Key Name"
                />
                <label>Value</label>
                <input
                  type="text"
                  value={authConfig.value || ''}
                  onChange={(e) => setAuthConfig({ ...authConfig, value: e.target.value })}
                  placeholder="API Key Value"
                />
                <label>Add To</label>
                <select 
                  value={authConfig.in || 'header'}
                  onChange={(e) => setAuthConfig({ ...authConfig, in: e.target.value })}
                >
                  <option value="header">Header</option>
                  <option value="query">Query Params</option>
                </select>
              </div>
            )}
          </div>
        )}

        {activeTab === 'scripts' && (
          <div className="scripts-editor" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
            <div className="script-section">
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Pre-request Script
              </label>
              <textarea
                style={{ width: '100%', height: '120px', fontFamily: 'monospace', padding: '12px', fontSize: '13px', background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-sm)', resize: 'vertical' }}
                value={scripts.prerequest || ''}
                onChange={(e) => setScripts({ ...scripts, prerequest: e.target.value })}
                placeholder="// Execute JavaScript before a request runs&#10;pm.environment.set('variable_key', 'variable_value');"
                spellCheck={false}
              />
            </div>
            
            <div className="script-section">
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Tests
              </label>
              <textarea
                style={{ width: '100%', height: '120px', fontFamily: 'monospace', padding: '12px', fontSize: '13px', background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-sm)', resize: 'vertical' }}
                value={scripts.tests || ''}
                onChange={(e) => setScripts({ ...scripts, tests: e.target.value })}
                placeholder="// Execute JavaScript after a response is received&#10;pm.test('Status code is 200', function () { &#10;    pm.expect(response.code).to.equal(200);&#10;});"
                spellCheck={false}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
