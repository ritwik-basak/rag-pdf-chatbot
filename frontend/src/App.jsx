import { useState, useRef, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import Message from './components/Message'
import { queryDocuments } from './api'
import { Send, RotateCcw, Search } from 'lucide-react'

const SUGGESTIONS = [
  'Summarize this document',
  'What are the key points?',
  'List the main topics',
  'What conclusions are drawn?',
]

const PARTICLES = Array.from({ length: 35 }, (_, i) => ({
  id: i,
  x: (Math.sin(i * 137.5) * 0.5 + 0.5) * 100,
  y: (Math.cos(i * 137.5) * 0.5 + 0.5) * 100,
  size: `${(i % 3) + 1}px`,
  opacity: 0.08 + (i % 5) * 0.07,
  duration: 4 + (i % 7),
  delay: (i % 4) * 0.8,
}))

export default function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const messagesEndRef           = useRef(null)
  const textareaRef              = useRef(null)
  const cursorGlowRef            = useRef(null)
  const cursorGlow2Ref           = useRef(null)
  const auroraRef                = useRef(null)
  const mouse                    = useRef({ x: 0.5, y: 0.5 })
  const rafRef                   = useRef(null)

  // Track mouse over the FULL window so glow also works over the sidebar
  const onMouseMove = useCallback((e) => {
    mouse.current = {
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight,
    }
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [onMouseMove])

  useEffect(() => {
    let cur = { x: 0.5, y: 0.5 }
    const tick = () => {
      cur.x += (mouse.current.x - cur.x) * 0.07
      cur.y += (mouse.current.y - cur.y) * 0.07

      const px = `${cur.x * 100}vw`
      const py = `${cur.y * 100}vh`

      if (cursorGlowRef.current) {
        cursorGlowRef.current.style.left = px
        cursorGlowRef.current.style.top  = py
      }
      if (cursorGlow2Ref.current) {
        cursorGlow2Ref.current.style.left = px
        cursorGlow2Ref.current.style.top  = py
      }
      if (auroraRef.current) {
        const hx = cur.x * 100
        const hy = cur.y * 100
        auroraRef.current.style.background = `
          radial-gradient(ellipse 75% 55% at ${hx}% ${hy}%, rgba(0,212,170,0.13) 0%, transparent 60%),
          radial-gradient(ellipse 55% 65% at ${100-hx}% ${100-hy}%, rgba(99,102,241,0.10) 0%, transparent 60%)
        `
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (question) => {
    const q = (question || input).trim()
    if (!q || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)
    const history = messages.map(m => ({ role: m.role, content: m.content }))
    try {
      const result = await queryDocuments(q, history)
      setMessages(prev => [...prev, { role: 'assistant', content: result.answer, sources: result.sources }])
    } catch (err) {
      const msg = err.response?.data?.detail || 'Something went wrong. Is the backend running?'
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${msg}`, sources: [] }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'
  }, [input])

  return (
    <div className="app">
      {/* Glow layers are fixed/full-viewport — sit behind everything incl. sidebar */}
      <div ref={auroraRef} className="aurora-layer" />
      <div ref={cursorGlowRef} className="cursor-glow-primary" />
      <div ref={cursorGlow2Ref} className="cursor-glow-secondary" />

      <Sidebar onClearChat={() => setMessages([])} />

      <main className="main">
        {/* Grid */}
        <div className="grid-layer" />

        {/* Particles */}
        <div className="particles-layer">
          {PARTICLES.map(p => (
            <div key={p.id} className="particle" style={{
              left: `${p.x}%`, top: `${p.y}%`,
              width: p.size, height: p.size,
              opacity: p.opacity,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }} />
          ))}
        </div>

        {/* Top bar */}
        <div className="topbar">
          <div className="topbar-title">
            <div className="status-dot" />
            Connected to Gemini 2.5 Flash · Pinecone
          </div>
          <div className="topbar-actions">
            <button className="icon-btn" onClick={() => setMessages([])} title="Clear chat">
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="messages">
          {messages.length === 0 && !loading ? (
            <div className="empty-state">
              <div className="empty-icon-wrap">
                <div className="empty-icon-ring" />
                <div className="empty-icon-ring ring2" />
                <div className="empty-icon">✦</div>
              </div>
              <div className="empty-title">Ask your documents anything</div>
              <div className="empty-sub">
                Upload PDFs on the left, then ask questions here.<br />
                DocChat retrieves the most relevant passages and answers with citations.
              </div>
              <div className="suggestions">
                {SUGGESTIONS.map(s => (
                  <button key={s} className="suggestion-chip" onClick={() => sendMessage(s)}>{s}</button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <Message key={i} role={msg.role} content={msg.content} sources={msg.sources} />
              ))}
              {loading && (
                <div className="message assistant">
                  <div className="avatar assistant">✦</div>
                  <div className="thinking">
                    <div className="thinking-dots"><span /><span /><span /></div>
                    Thinking…
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input pill — collapsed to search icon, expands on hover */}
        <div className="input-area">
          <div className="input-wrapper">
            <span className="search-icon-pill">
              <Search size={18} strokeWidth={2} />
            </span>

            <textarea
              ref={textareaRef}
              className="chat-input"
              placeholder="Ask a question about your documents…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
            />
            <button
              className="send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              <Send size={15} />
            </button>
          </div>
          <div className="input-hint">
            Press <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line
          </div>
        </div>
      </main>
    </div>
  )
}