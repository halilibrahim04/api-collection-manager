import { useState } from 'react'
import { endpointsAPI, proxyAPI } from '../services/api'
import toast from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import RequestPanel from '../components/RequestPanel'
import ResponsePanel from '../components/ResponsePanel'
import EnvironmentManager from '../components/EnvironmentManager'
import './MainPage.css'

export default function MainPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(null)
  const [response, setResponse] = useState(null)
  const [sending, setSending] = useState(false)
  const [saving, setSaving] = useState(false)

  const [lastRequestMethod, setLastRequestMethod] = useState(null)

  const handleSelectEndpoint = (ep) => {
    setSelectedEndpoint(ep)
    setResponse(null)
    setLastRequestMethod(null)
  }

  const handleSend = async (requestData) => {
    setSending(true)
    setResponse(null)
    setLastRequestMethod(requestData.method.toUpperCase())

    try {
      // ── SANDBOX: PM API POLYFILL ──
      const pm = {
        environment: {
          set: (k, v) => localStorage.setItem(`pm_env_${k}`, v),
          get: (k) => localStorage.getItem(`pm_env_${k}`) || ''
        },
        variables: {
          set: (k, v) => localStorage.setItem(`pm_var_${k}`, v),
          get: (k) => localStorage.getItem(`pm_var_${k}`) || ''
        }
      }

      // Pre-request Execution
      if (requestData.scripts?.prerequest?.trim()) {
        try {
          const fn = new Function('pm', requestData.scripts.prerequest)
          fn(pm)
        } catch (e) {
          toast.error('Pre-request Script Error: ' + e.message)
        }
      }

      const interpolate = (str) => {
        if (!str || typeof str !== 'string') return str;
        return str.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
          return pm.environment.get(key) || pm.variables.get(key) || match;
        })
      }

      let parsedUrl = interpolate(requestData.url)
      
      const headersObj = {}
      requestData.headers.filter(h => h.key && h.enabled).forEach(h => { headersObj[interpolate(h.key)] = interpolate(h.value) })

      const paramsObj = {}
      requestData.params.filter(p => p.key && p.enabled).forEach(p => { paramsObj[interpolate(p.key)] = interpolate(p.value) })

      if (requestData.authConfig) {
        const auth = requestData.authConfig
        if (auth.mode === 'bearer' && auth.token) {
          headersObj['Authorization'] = `Bearer ${interpolate(auth.token)}`
        } else if (auth.mode === 'basic' && auth.username) {
          const b64 = btoa(interpolate(auth.username) + ':' + interpolate(auth.password || ''))
          headersObj['Authorization'] = `Basic ${b64}`
        } else if (auth.mode === 'apikey' && auth.key && auth.value) {
          if (auth.in === 'query') {
            paramsObj[interpolate(auth.key)] = interpolate(auth.value)
          } else {
            headersObj[interpolate(auth.key)] = interpolate(auth.value)
          }
        }
      }

      let parsedBody = null
      if (requestData.bodyConfig && requestData.bodyConfig.mode !== 'none') {
        const config = requestData.bodyConfig
        if (config.mode === 'raw') {
          let injectedRaw = interpolate(config.raw)
          // Automatically set Content-Type if missing
          const hasCT = Object.keys(headersObj).some(k => k.toLowerCase() === 'content-type')
          if (!hasCT) {
            if (config.rawType === 'json') headersObj['Content-Type'] = 'application/json'
            else if (config.rawType === 'xml') headersObj['Content-Type'] = 'application/xml'
            else if (config.rawType === 'html') headersObj['Content-Type'] = 'text/html'
            else headersObj['Content-Type'] = 'text/plain'
          }
          
          if (config.rawType === 'json' && injectedRaw) {
             try { parsedBody = JSON.parse(injectedRaw) } catch (e) { parsedBody = injectedRaw }
          } else {
             parsedBody = injectedRaw
          }
        } else if (config.mode === 'formdata') {
          parsedBody = { _mode: 'formdata', data: {}, files: {} }
          config.formdata.filter(f => f.key && f.enabled).forEach(f => {
            if (f._type === 'file' && f.value) {
              parsedBody.files[interpolate(f.key)] = { filename: f.filename || 'upload.bin', content: f.value }
            } else {
              parsedBody.data[interpolate(f.key)] = interpolate(f.value)
            }
          })
        } else if (config.mode === 'urlencoded') {
          parsedBody = { _mode: 'urlencoded', data: {} }
          config.urlencoded.filter(f => f.key && f.enabled).forEach(f => {
            parsedBody.data[interpolate(f.key)] = interpolate(f.value)
          })
          const hasCT = Object.keys(headersObj).some(k => k.toLowerCase() === 'content-type')
          if (!hasCT) headersObj['Content-Type'] = 'application/x-www-form-urlencoded'
        }
      }

      // Send Request
      let res = await proxyAPI.run({
        method: requestData.method,
        url: parsedUrl,
        headers: headersObj,
        params: paramsObj,
        body: parsedBody
      })

      setResponse(res.data)
      const statusCode = res.data.status_code
      if (statusCode >= 200 && statusCode < 300) {
        toast.success(`${statusCode} - İstek başarılı`)
      } else if (statusCode >= 400) {
        toast.error(`${statusCode} - İstek başarısız`)
      }

      // Tests Execution
      if (requestData.scripts?.tests?.trim()) {
        try {
          // Prepare robust PM API for assertions
          let passed = 0, failed = 0;
          const _tests = [];
          
          pm.response = {
            json: () => (typeof res.data.body === 'string' ? JSON.parse(res.data.body) : res.data.body),
            text: () => (typeof res.data.body === 'string' ? res.data.body : JSON.stringify(res.data.body)),
            code: statusCode
          }

          pm.test = (name, testFn) => {
            try { 
              testFn(); 
              passed++; 
              _tests.push({name, pass: true});
            } catch(e) { 
              failed++; 
              _tests.push({name, pass: false, err: e.message});
              console.error(`Test Faied: ${name}`, e)
            }
          }
          
          pm.expect = (act) => ({
            to: {
              eql: (exp) => { if(act !== exp) throw new Error(`Expected ${exp} but got ${act}`) },
              equal: (exp) => { if(act !== exp) throw new Error(`Expected ${exp} but got ${act}`) }
            }
          })

          const fn = new Function('pm', 'response', requestData.scripts.tests)
          fn(pm, pm.response)

          if (failed > 0) {
            toast.error(`${failed} Test Başarısız!`, { duration: 4000 })
          } else if (passed > 0) {
            toast.success(`Tüm testler geçti (${passed})`, { duration: 4000 })
          }

        } catch (e) {
          toast.error('Test Script Error: ' + e.message)
        }
      }

    } catch (err) {
      toast.error(err.response?.data?.error || 'İstek gönderilemedi.')
      setResponse({
        status_code: err.response?.status || 0,
        body: err.response?.data || { error: 'Bağlantı hatası' },
        headers: {},
        elapsed_time: 0,
      })
    } finally {
      setSending(false)
    }
  }

  const handleSave = async (requestData) => {
    if (!selectedEndpoint) return

    setSaving(true)
    try {
      // Key-value dizilerini objeye çevir
      const headersObj = {}
      requestData.headers.filter(h => h.key && h.enabled).forEach(h => {
        headersObj[h.key] = h.value
      })

      const paramsObj = {}
      requestData.params.filter(p => p.key && p.enabled).forEach(p => {
        paramsObj[p.key] = p.value
      })

      let bodyObj = {}
      if (requestData.body) {
        try { bodyObj = JSON.parse(requestData.body) } catch { bodyObj = {} }
      }

      const updateData = {
        method: requestData.method,
        base_url: '',
        path: requestData.url,
        headers: headersObj,
        query_params: paramsObj,
        body: bodyObj,
        auth: requestData.authToken ? { token: requestData.authToken } : {},
      }

      const res = await endpointsAPI.update(selectedEndpoint.id, updateData)
      setSelectedEndpoint(res.data.endpoint)
      toast.success('Değişiklikler kaydedildi!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Kaydetme başarısız.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="main-layout">
      <Sidebar
        onSelectEndpoint={handleSelectEndpoint}
        selectedEndpointId={selectedEndpoint?.id}
      />
      <div className="main-content">
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
           <EnvironmentManager onEnvironmentChange={setEnvironment} />
        </div>
        <div className="request-section">
          <RequestPanel
            endpoint={selectedEndpoint}
            onSend={handleSend}
            onSave={handleSave}
            sending={sending}
            saving={saving}
          />
        </div>
        <div className="response-section">
          <ResponsePanel
            response={response}
            loading={sending}
            requestMethod={lastRequestMethod}
          />
        </div>
      </div>
    </div>
  )
}
