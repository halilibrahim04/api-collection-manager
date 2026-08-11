import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { collectionsAPI } from '../services/api'
import toast from 'react-hot-toast'
import {
  FiFolder, FiChevronRight, FiChevronDown, FiPlus, FiTrash2,
  FiUpload, FiLogOut, FiSend, FiSearch, FiDownload
} from 'react-icons/fi'
import ImportModal from './ImportModal'
import './Sidebar.css'

export default function Sidebar({ onSelectEndpoint, selectedEndpointId }) {
  const { user, logout } = useAuth()
  const [collections, setCollections] = useState([])
  const [expandedIds, setExpandedIds] = useState(new Set())
  const [endpointsMap, setEndpointsMap] = useState({})
  const [showImport, setShowImport] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadCollections()
  }, [])

  const loadCollections = async () => {
    try {
      const res = await collectionsAPI.list()
      setCollections(res.data)
    } catch (err) {
      toast.error('Koleksiyonlar yüklenemedi.')
    }
  }

  const toggleCollection = async (id) => {
    const newSet = new Set(expandedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
      // Endpoint'leri yükle
      if (!endpointsMap[id]) {
        try {
          const res = await collectionsAPI.getEndpoints(id)
          setEndpointsMap(prev => ({ ...prev, [id]: res.data }))
        } catch (err) {
          toast.error('Endpoint\'ler yüklenemedi.')
        }
      }
    }
    setExpandedIds(newSet)
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Bu koleksiyonu silmek istediğinize emin misiniz?')) return
    try {
      await collectionsAPI.delete(id)
      setCollections(prev => prev.filter(c => c.id !== id))
      toast.success('Koleksiyon silindi.')
    } catch (err) {
      toast.error('Silme işlemi başarısız.')
    }
  }

  const handleExport = async (e, col) => {
    e.stopPropagation()
    let eps = endpointsMap[col.id]
    
    // Fetch endpoints if not already expanded/loaded
    if (!eps) {
      try {
        const res = await collectionsAPI.getEndpoints(col.id)
        eps = res.data
        setEndpointsMap(prev => ({ ...prev, [col.id]: eps }))
      } catch (err) {
        toast.error('Koleksiyon detayları alınamadı.')
        return
      }
    }

    const postmanCollection = {
      info: {
        name: col.name,
        description: "Exported from API Collection Manager",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      item: eps.map(ep => {
        const header = []
        if (ep.headers) {
          Object.keys(ep.headers).forEach(k => {
            header.push({ key: k, value: String(ep.headers[k]), type: "text" })
          })
        }
        
        const query = []
        if (ep.query_params) {
          Object.keys(ep.query_params).forEach(k => {
            query.push({ key: k, value: String(ep.query_params[k]) })
          })
        }

        let auth = null
        if (ep.auth && ep.auth.mode && ep.auth.mode !== 'none') {
          if (ep.auth.mode === 'bearer') {
            auth = { type: 'bearer', bearer: [{ key: 'token', value: ep.auth.token, type: 'string' }] }
          } else if (ep.auth.mode === 'basic') {
            auth = { type: 'basic', basic: [{ key: 'username', value: ep.auth.username, type: 'string'}, {key: 'password', value: ep.auth.password, type: 'string'}] }
          } else if (ep.auth.mode === 'apikey') {
            auth = { type: 'apikey', apikey: [{ key: 'key', value: ep.auth.key, type: 'string'}, {key: 'value', value: ep.auth.value, type: 'string'}, {key: 'in', value: ep.auth.in, type: 'string'}] }
          }
        }

        const events = []
        if (ep.scripts) {
          if (ep.scripts.prerequest) {
            events.push({
              listen: "prerequest",
              script: { type: "text/javascript", exec: ep.scripts.prerequest.split('\n') }
            })
          }
          if (ep.scripts.tests) {
            events.push({
              listen: "test",
              script: { type: "text/javascript", exec: ep.scripts.tests.split('\n') }
            })
          }
        }

        return {
          name: ep.name,
          ...(events.length > 0 ? { event: events } : {}),
          request: {
            method: ep.method,
            header: header,
            url: {
              raw: (ep.base_url || '') + (ep.path || ''),
              host: [(ep.base_url || '')],
              path: [(ep.path || '').replace(/^\//, '')],
              query: query
            },
            body: ep.body || null,
            ...(auth ? { auth } : {})
          }
        }
      })
    }

    const blob = new Blob([JSON.stringify(postmanCollection, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = col.name + ".json"
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success('Koleksiyon dışa aktarıldı!')
  }

  const handleImportSuccess = () => {
    setShowImport(false)
    loadCollections()
  }

  const getMethodClass = (method) => method?.toLowerCase() || 'get'

  // Filtreleme
  const filteredCollections = collections.filter(c => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    if (c.name.toLowerCase().includes(term)) return true
    const eps = endpointsMap[c.id] || []
    return eps.some(ep => ep.name.toLowerCase().includes(term) || ep.path.toLowerCase().includes(term))
  })

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">
              <FiSend size={16} />
            </div>
            <span className="brand-text">Collections</span>
          </div>
          <button className="sidebar-btn import-btn" onClick={() => setShowImport(true)} title="Import Collection">
            <FiPlus size={16} />
          </button>
        </div>

        <div className="sidebar-search">
          <FiSearch size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="sidebar-list">
          {filteredCollections.length === 0 && (
            <div className="sidebar-empty">
              <FiFolder size={32} />
              <p>Henüz koleksiyon yok</p>
              <button className="empty-import-btn" onClick={() => setShowImport(true)}>
                <FiUpload size={14} />
                Import Collection
              </button>
            </div>
          )}

          {filteredCollections.map(col => (
            <div key={col.id} className="collection-item">
              <div
                className="collection-header"
                onClick={() => toggleCollection(col.id)}
              >
                <span className="collection-chevron">
                  {expandedIds.has(col.id) ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                </span>
                <FiFolder size={14} className="collection-icon" />
                <span className="collection-name" title={col.name}>{col.name}</span>
                <span className="collection-count">
                  {endpointsMap[col.id]?.length || ''}
                </span>
                <button
                  className="collection-export"
                  onClick={(e) => handleExport(e, col)}
                  title="Koleksiyonu dışa aktar"
                >
                  <FiDownload size={12} />
                </button>
                <button
                  className="collection-delete"
                  onClick={(e) => handleDelete(e, col.id)}
                  title="Koleksiyonu sil"
                >
                  <FiTrash2 size={12} />
                </button>
              </div>

              {expandedIds.has(col.id) && endpointsMap[col.id] && (
                <div className="endpoint-list">
                  {endpointsMap[col.id].map(ep => (
                    <div
                      key={ep.id}
                      className={`endpoint-item ${selectedEndpointId === ep.id ? 'active' : ''}`}
                      onClick={() => onSelectEndpoint(ep)}
                    >
                      <span className={`method-badge ${getMethodClass(ep.method)}`}>
                        {ep.method}
                      </span>
                      <span className="endpoint-name" title={ep.name}>{ep.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
            <span className="user-name">{user?.username}</span>
          </div>
          <button className="sidebar-btn logout-btn" onClick={logout} title="Çıkış">
            <FiLogOut size={14} />
          </button>
        </div>
      </aside>

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onSuccess={handleImportSuccess}
        />
      )}
    </>
  )
}
