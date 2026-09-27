import { useState, useEffect } from 'react'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [indexDir, setIndexDir] = useState('')
  const [isIndexing, setIsIndexing] = useState(false)
  const [sources, setSources] = useState([])
  const [chatLog, setChatLog] = useState([{role: 'assistant', text: 'Hello! I am your local AI. Ask me anything about your indexed files.'}])
  const [chatInput, setChatInput] = useState('')

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchSources()
    }
  }, [activeTab])

  const fetchSources = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/sources')
      const data = await res.json()
      setSources(data.sources || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleIndex = async () => {
    if (!indexDir) return
    setIsIndexing(true)
    try {
      await fetch('http://127.0.0.1:8000/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: indexDir }),
      })
      fetchSources()
    } catch (err) {
      console.error(err)
    }
    setIsIndexing(false)
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query) return
    setIsSearching(true)
    try {
      const res = await fetch('http://127.0.0.1:8000/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const data = await res.json()
      setResults(data.results || [])
    } catch (err) {
      console.error(err)
    }
    setIsSearching(false)
  }

  const handleClear = async () => {
    await fetch('http://127.0.0.1:8000/clear', { method: 'POST' })
    fetchSources()
    setResults([])
  }

  const handleChat = async (e) => {
    e.preventDefault()
    if (!chatInput) return
    
    const userMsg = chatInput
    setChatLog(prev => [...prev, {role: 'user', text: userMsg}])
    setChatInput('')

    try {
      const res = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg }),
      })
      const data = await res.json()
      setChatLog(prev => [...prev, {role: 'assistant', text: data.answer}])
    } catch (err) {
      console.error(err)
      setChatLog(prev => [...prev, {role: 'assistant', text: 'Error connecting to AI backend.'}])
    }
  }

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="logo">SnapSearch</div>
        <div className={`nav-item ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
          🔍 Semantic Search
        </div>
        <div className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
          💬 AI Assistant
        </div>
        <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          ⚙️ Database Settings
        </div>
      </div>

      <div className="content">
        {activeTab === 'search' && (
          <>
            <div className="header">
              <h2>Find anything, locally.</h2>
              <p>Search by meaning across all your indexed documents.</p>
            </div>
            
            <form onSubmit={handleSearch} className="input-group">
              <input type="text" placeholder="e.g. 'Project timeline from last week'" value={query} onChange={e => setQuery(e.target.value)} />
              <button type="submit" className="btn" disabled={isSearching}>
                {isSearching ? <span className="spinner" /> : 'Search'}
              </button>
            </form>

            <div className="card">
              {results.length === 0 && !isSearching && <p style={{color: '#64748b', textAlign: 'center'}}>No results to display. Try searching for something.</p>}
              {results.map((r, i) => {
                const fileName = r.source.split('\\').pop() || r.source.split('/').pop() || r.source;
                const folderPath = r.source.substring(0, Math.max(r.source.lastIndexOf('\\'), r.source.lastIndexOf('/'))) || r.source;
                const snippet = r.document.length > 200 ? r.document.substring(0, 200) + '...' : r.document;
                
                return (
                  <div key={i} className="result-item">
                    <div className="result-title" style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#38bdf8', marginBottom: '0.2rem' }}>
                      📄 {fileName}
                    </div>
                    <div className="result-source" style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.8rem' }}>
                      {folderPath}
                    </div>
                    <div className="result-text" style={{ color: '#cbd5e1', lineHeight: '1.5', fontSize: '0.95rem', fontStyle: 'italic' }}>
                      "{snippet}"
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {activeTab === 'chat' && (
          <>
            <div className="header">
              <h2>AI Assistant (RAG)</h2>
              <p>Chat with your documents securely using Snapdragon AI.</p>
            </div>
            <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {chatLog.map((msg, i) => (
                  <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', background: msg.role === 'user' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', maxWidth: '80%' }}>
                    {msg.text}
                  </div>
                ))}
              </div>
              <form onSubmit={handleChat} className="input-group" style={{ marginBottom: 0 }}>
                <input type="text" placeholder="Ask a question..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
                <button type="submit" className="btn">Send</button>
              </form>
            </div>
          </>
        )}

        {activeTab === 'settings' && (
          <>
            <div className="header">
              <h2>Knowledge Base</h2>
              <p>Manage your local vector database.</p>
            </div>

            <div className="card">
              <h3>Index New Folder</h3>
              <div className="input-group">
                <input type="text" placeholder="C:\Users\Documents" value={indexDir} onChange={e => setIndexDir(e.target.value)} />
                <button onClick={handleIndex} className="btn" disabled={isIndexing}>
                  {isIndexing ? 'Indexing...' : 'Index'}
                </button>
              </div>
            </div>

            <div className="card">
              <h3>Indexed Sources ({sources.length})</h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                {sources.length === 0 ? 'No files indexed yet.' : sources.map((s, i) => <div key={i} style={{padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)'}}>{s}</div>)}
              </div>
              <button onClick={handleClear} className="btn danger">Purge Database</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default App
