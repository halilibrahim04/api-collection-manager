import { useState, useEffect } from 'react'
import { FiDownload } from 'react-icons/fi'
import './ResponsePanel.css'
import JsonViewer from './JsonViewer'

export default function ResponsePanel({ response, loading, requestMethod }) {
  const [activeTab, setActiveTab] = useState('body')

  let parsedJsonData = null
  if (response && response.body) {
    if (typeof response.body === 'string') {
      try { parsedJsonData = JSON.parse(response.body) } catch {}
    } else {
      parsedJsonData = response.body
    }
  }

  // Tablo verisi her render'da (üstte) hesaplanıyor
  let tableData = null
  if (response && requestMethod === 'GET') {
    if (Array.isArray(response.body)) {
      tableData = { rows: response.body }
    } else if (response.body && typeof response.body === 'object') {
      tableData = { rows: [response.body] }
    } else if (typeof response.body === 'string') {
      try {
        const parsed = JSON.parse(response.body)
        if (Array.isArray(parsed)) {
          tableData = { rows: parsed }
        } else if (parsed && typeof parsed === 'object') {
          tableData = { rows: [parsed] }
        }
      } catch {
        // Not a JSON string
      }
    }

    if (tableData && tableData.rows.length > 0) {
      const columns = new Set()
      tableData.rows.forEach(item => {
        if (item && typeof item === 'object') {
          Object.keys(item).forEach(key => columns.add(key))
        }
      })
      if (columns.size > 0) {
        tableData.columns = Array.from(columns)
      } else {
        tableData = null
      }
    } else {
      tableData = null
    }
  }

  const showTableTab = tableData !== null

  // Hooks her zaman en tepede çalışmalı
  useEffect(() => {
    if (showTableTab) {
      setActiveTab('table')
    } else {
      setActiveTab('body')
    }
  }, [response, showTableTab])

  if (loading) {
    return (
      <div className="response-panel">
        <div className="response-loading">
          <div className="loading-spinner"></div>
          <p>İstek gönderiliyor...</p>
        </div>
      </div>
    )
  }

  if (!response) {
    return (
      <div className="response-panel">
        <div className="response-empty">
          <div className="empty-illustration">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="36" stroke="#E5E7EB" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M30 35L40 25L50 35" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
              <path d="M40 25V55" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <p className="empty-title">Yanıt bekleniyor</p>
          <p className="empty-hint">Bir endpoint seçin ve Send'e tıklayın</p>
          <p className="empty-shortcut"><kbd>Ctrl</kbd> + <kbd>Enter</kbd></p>
        </div>
      </div>
    )
  }

  const getStatusClass = (status) => {
    if (status >= 200 && status < 300) return 'status-success'
    if (status >= 300 && status < 400) return 'status-redirect'
    if (status >= 400 && status < 500) return 'status-client-error'
    return 'status-server-error'
  }

  const getStatusText = (status) => {
    const texts = {
      200: 'OK', 201: 'Created', 204: 'No Content',
      301: 'Moved', 302: 'Found', 304: 'Not Modified',
      400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found',
      500: 'Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable',
    }
    return texts[status] || ''
  }

  const formatBody = () => {
    if (!response.body) return ''
    if (typeof response.body === 'string') {
      try {
        return JSON.stringify(JSON.parse(response.body), null, 2)
      } catch {
        return response.body
      }
    }
    return JSON.stringify(response.body, null, 2)
  }

  const formatSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  const responseHeaders = response.headers || {}
  const bodyStr = formatBody()
  const bodySize = new Blob([bodyStr]).size

  const downloadResponse = () => {
    if (!response || !response.body) return;
    try {
      let content = typeof response.body === 'string' ? response.body : JSON.stringify(response.body, null, 2);
      let ext = 'txt';
      let mimeType = 'text/plain';
      
      const ctHeader = Object.keys(responseHeaders).find(k => k.toLowerCase() === 'content-type');
      if (ctHeader && responseHeaders[ctHeader]) {
         const ct = responseHeaders[ctHeader].toLowerCase();
         if (ct.includes('json')) { ext = 'json'; mimeType = 'application/json'; }
         else if (ct.includes('html')) { ext = 'html'; mimeType = 'text/html'; }
         else if (ct.includes('xml')) { ext = 'xml'; mimeType = 'application/xml'; }
      } else if (parsedJsonData !== null) {
         ext = 'json'; mimeType = 'application/json';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `response_${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed', e);
    }
  }

  return (
    <div className="response-panel">
      {/* ── Status Bar ── */}
      <div className="response-status-bar">
        <div className="status-info">
          <span className={`status-code ${getStatusClass(response.status_code)}`}>
            {response.status_code} {getStatusText(response.status_code)}
          </span>
          {response.elapsed_time && (
            <span className="status-time">{Math.round(response.elapsed_time * 1000)} ms</span>
          )}
          {bodySize > 0 && (
            <span className="status-size">{formatSize(bodySize)}</span>
          )}
        </div>
        <div className="response-tabs">
          <button
            className={`response-tab ${activeTab === 'body' ? 'active' : ''}`}
            onClick={() => setActiveTab('body')}
          >
            Body (JSON)
          </button>
          {showTableTab && (
            <button
              className={`response-tab ${activeTab === 'table' ? 'active' : ''}`}
              onClick={() => setActiveTab('table')}
            >
              Table View
            </button>
          )}
          <button
            className={`response-tab ${activeTab === 'headers' ? 'active' : ''}`}
            onClick={() => setActiveTab('headers')}
          >
            Headers {Object.keys(responseHeaders).length > 0 && (
              <span className="tab-count">{Object.keys(responseHeaders).length}</span>
            )}
          </button>
          
          <button 
            className="response-tab"
            style={{ marginLeft: 'auto', borderLeft: '1px solid var(--border-color)', color: 'var(--primary)', display: 'flex', alignItems: 'center' }}
            onClick={downloadResponse}
            title="Download Response Body"
          >
            <FiDownload size={14} style={{ marginRight: '6px' }} />
            Save Response
          </button>
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="response-content">
        {activeTab === 'body' && (
          <div className="response-body" style={{ padding: '16px', overflow: 'auto', backgroundColor: '#fff' }}>
            {parsedJsonData !== null ? (
              <JsonViewer data={parsedJsonData} />
            ) : (
              <pre className="body-pre">
                <code>{bodyStr || 'No response body'}</code>
              </pre>
            )}
          </div>
        )}

        {activeTab === 'table' && tableData && (
          <div className="response-table-container">
            <table className="response-table">
              <thead>
                <tr>
                  <th>#</th>
                  {tableData.columns.map(col => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, index) => (
                  <tr key={index}>
                    <td className="row-index">{index + 1}</td>
                    {tableData.columns.map(col => {
                      let val = row[col]
                      if (typeof val === 'object' && val !== null) {
                        val = JSON.stringify(val, null, 2)
                      } else if (val === null) {
                        val = 'null'
                      } else if (val === undefined) {
                        val = 'undefined'
                      }
                      
                      return (
                        <td key={col}>
                          <div className="td-content" title={typeof val === 'string' && val.length < 100 ? val : undefined}>
                            {String(val)}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="response-headers">
            {Object.entries(responseHeaders).map(([key, value]) => (
              <div key={key} className="header-row">
                <span className="header-key">{key}</span>
                <span className="header-value">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
