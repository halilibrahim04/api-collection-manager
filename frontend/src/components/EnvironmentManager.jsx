import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { environmentsAPI } from '../services/api';
import KeyValueEditor from './KeyValueEditor';
import './EnvironmentManager.css';

export default function EnvironmentManager({ onEnvironmentChange }) {
  const [environments, setEnvironments] = useState([]);
  const [activeEnvId, setActiveEnvId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalEnv, setModalEnv] = useState(null);
  
  // Variables format for KeyValueEditor array
  const [editVars, setEditVars] = useState([]);

  useEffect(() => {
    fetchEnvironments();
  }, []);

  const fetchEnvironments = async () => {
    try {
      const res = await environmentsAPI.list();
      setEnvironments(res.data.environments || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectEnv = (id) => {
    setActiveEnvId(id);
    if (!id) {
      onEnvironmentChange({});
      return;
    }
    const env = environments.find(e => e.id === parseInt(id));
    if (env) {
      onEnvironmentChange(env.variables || {});
    }
  };

  const openModal = () => {
    setShowModal(true);
    if (environments.length > 0) {
      selectModalEnv(environments[0]);
    } else {
      createNewModalEnv();
    }
  };

  const selectModalEnv = (env) => {
    setModalEnv(env);
    if (!env.variables || Object.keys(env.variables).length === 0) {
      setEditVars([{ key: '', value: '', enabled: true }]);
    } else {
      const arr = Object.keys(env.variables).map(k => ({
        key: k,
        value: env.variables[k],
        enabled: true
      }));
      arr.push({ key: '', value: '', enabled: true });
      setEditVars(arr);
    }
  };

  const createNewModalEnv = () => {
    setModalEnv({ id: 'new', name: 'New Environment', variables: {} });
    setEditVars([{ key: '', value: '', enabled: true }]);
  };

  const handleSaveModal = async () => {
    try {
      // Build variables dict
      const varsDict = {};
      editVars.filter(v => v.key && v.enabled).forEach(v => {
        varsDict[v.key] = v.value;
      });

      if (modalEnv.id === 'new') {
        await environmentsAPI.create({ name: modalEnv.name, variables: varsDict });
        toast.success("Ortam oluşturuldu");
      } else {
        await environmentsAPI.update(modalEnv.id, { name: modalEnv.name, variables: varsDict });
        toast.success("Ortam güncellendi");
        // Update active if it's the one we're editing
        if (activeEnvId == modalEnv.id) {
            onEnvironmentChange(varsDict);
        }
      }
      await fetchEnvironments();
    } catch (err) {
      toast.error(err.response?.data?.error || "Kaydedilemedi");
    }
  };

  const handleDeleteModal = async (id) => {
    if (id === 'new') return;
    try {
      await environmentsAPI.delete(id);
      toast.success("Ortam silindi");
      if (activeEnvId == id) {
        handleSelectEnv('');
      }
      await fetchEnvironments();
      createNewModalEnv();
    } catch (err) {
      toast.error('Silinemedi');
    }
  };

  return (
    <div className="env-manager-wrapper">
      <div className="env-dropdown-container">
        <select 
          className="env-select" 
          value={activeEnvId} 
          onChange={(e) => handleSelectEnv(e.target.value)}
        >
          <option value="">No Environment</option>
          {environments.map(e => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        <button className="env-edit-btn" onClick={openModal} title="Manage Environments">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
          </svg>
        </button>
      </div>

      {showModal && (
        <div className="env-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="env-modal" onClick={e => e.stopPropagation()}>
            <div className="env-modal-header">
              <h2>Manage Environments</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="env-modal-body">
              <div className="env-list-panel">
                <div className="env-list-actions">
                  <button onClick={createNewModalEnv}>+ New Environment</button>
                </div>
                {environments.map(e => (
                  <div 
                    key={e.id} 
                    className={`env-item ${modalEnv?.id === e.id ? 'active' : ''}`}
                    onClick={() => selectModalEnv(e)}
                  >
                    {e.name}
                  </div>
                ))}
              </div>
              <div className="env-edit-panel">
                {modalEnv && (
                  <>
                    <div className="env-edit-header">
                      <input 
                        type="text" 
                        value={modalEnv.name} 
                        onChange={(e) => setModalEnv({...modalEnv, name: e.target.value})}
                        className="env-name-input"
                        placeholder="Environment Name"
                      />
                      <div className="env-edit-buttons">
                        {modalEnv.id !== 'new' && (
                          <button className="env-delete-btn" onClick={() => handleDeleteModal(modalEnv.id)}>Delete</button>
                        )}
                        <button className="env-save-btn" onClick={handleSaveModal}>Save</button>
                      </div>
                    </div>
                    <div className="env-vars-container">
                       <KeyValueEditor 
                          items={editVars} 
                          setItems={setEditVars} 
                          allowFile={false}
                       />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
