import { FiPlus, FiTrash2 } from 'react-icons/fi'
import './KeyValueEditor.css'

export default function KeyValueEditor({ pairs, onChange, keyPlaceholder = 'Key', valuePlaceholder = 'Value', allowFile = false }) {
  const handleChange = (index, field, value) => {
    const updated = [...pairs]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const handleFileChange = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1];
      const updated = [...pairs]
      updated[index] = { ...updated[index], value: base64, filename: file.name, _type: 'file' }
      onChange(updated)
    };
    reader.readAsDataURL(file);
  }

  const toggleType = (index) => {
    const updated = [...pairs]
    updated[index] = { ...updated[index], _type: updated[index]._type === 'file' ? 'text' : 'file', value: '', filename: '' }
    onChange(updated)
  }

  const addPair = () => {
    onChange([...pairs, { key: '', value: '', enabled: true, _type: 'text' }])
  }

  const removePair = (index) => {
    onChange(pairs.filter((_, i) => i !== index))
  }

  const toggleEnabled = (index) => {
    const updated = [...pairs]
    updated[index] = { ...updated[index], enabled: !updated[index].enabled }
    onChange(updated)
  }

  return (
    <div className="kv-editor">
      <div className="kv-header-row">
        <div className="kv-cell kv-check"></div>
        <div className="kv-cell kv-key" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{keyPlaceholder}</span>
        </div>
        <div className="kv-cell kv-value">{valuePlaceholder}</div>
        <div className="kv-cell kv-actions"></div>
      </div>
      {pairs.map((pair, i) => (
        <div key={i} className={`kv-row ${!pair.enabled ? 'disabled' : ''}`}>
          <div className="kv-cell kv-check">
            <input
              type="checkbox"
              checked={pair.enabled !== false}
              onChange={() => toggleEnabled(i)}
            />
          </div>
          <div className="kv-cell kv-key" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              value={pair.key}
              onChange={(e) => handleChange(i, 'key', e.target.value)}
              placeholder={keyPlaceholder}
              style={{ width: allowFile ? '75%' : '100%', paddingRight: allowFile ? '4px' : '8px' }}
            />
            {allowFile && (
               <select 
                 value={pair._type || 'text'} 
                 onChange={() => toggleType(i)}
                 style={{ width: '25%', fontSize: '10px', height: '100%', border: 'none', background: 'var(--bg-hover)', color: 'var(--text-tertiary)', cursor: 'pointer' }}
               >
                 <option value="text">Text</option>
                 <option value="file">File</option>
               </select>
            )}
          </div>
          <div className="kv-cell kv-value" style={{ display: 'flex', alignItems: 'center' }}>
            {pair._type === 'file' ? (
              <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="file" 
                  onChange={(e) => handleFileChange(i, e.target.files[0])}
                  style={{ fontSize: '12px' }}
                />
                {pair.filename && <span style={{ fontSize: '11px', color: 'var(--primary)' }}>{pair.filename}</span>}
              </div>
            ) : (
              <input
                type="text"
                value={pair.value || ''}
                onChange={(e) => handleChange(i, 'value', e.target.value)}
                placeholder={valuePlaceholder}
              />
            )}
          </div>
          <div className="kv-cell kv-actions">
            <button className="kv-delete" onClick={() => removePair(i)}>
              <FiTrash2 size={12} />
            </button>
          </div>
        </div>
      ))}
      <button className="kv-add" onClick={addPair}>
        <FiPlus size={13} />
        Ekle
      </button>
    </div>
  )
}
