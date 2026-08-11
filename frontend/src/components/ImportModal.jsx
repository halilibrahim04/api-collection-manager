import { useState, useRef } from 'react'
import { collectionsAPI } from '../services/api'
import toast from 'react-hot-toast'
import { FiUpload, FiX, FiFile } from 'react-icons/fi'
import './ImportModal.css'

export default function ImportModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileSelect = (selectedFile) => {
    const validExts = ['.json']
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase()
    if (!validExts.includes(ext)) {
      toast.error('Sadece .json uzantılı (Postman veya Bruno) dosyaları desteklenir.')
      return
    }
    setFile(selectedFile)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    try {
      await collectionsAPI.import(file)
      toast.success('Collection başarıyla import edildi!')
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import başarısız.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Import Collection</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div
            className={`drop-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {file ? (
              <div className="file-preview">
                <FiFile size={24} />
                <span className="file-name">{file.name}</span>
                <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                <button
                  className="file-remove"
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                >
                  <FiX size={14} />
                </button>
              </div>
            ) : (
              <>
                <FiUpload size={32} className="drop-icon" />
                <p className="drop-text">Dosyayı buraya sürükleyin</p>
                <p className="drop-hint">veya tıklayarak seçin</p>
                <p className="drop-formats">.json (Postman veya Bruno)</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>İptal</button>
          <button
            className="btn-import"
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? 'Yükleniyor...' : 'Import Et'}
          </button>
        </div>
      </div>
    </div>
  )
}
