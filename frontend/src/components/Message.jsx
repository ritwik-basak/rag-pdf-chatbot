import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { ChevronDown, ChevronUp, FileText } from 'lucide-react'

export default function Message({ role, content, sources }) {
  const [showSources, setShowSources] = useState(false)

  return (
    <div className={`message ${role}`}>
      <div className={`avatar ${role}`}>
        {role === 'user' ? '👤' : '✦'}
      </div>

      <div className={`bubble ${role}`}>
        {role === 'assistant' ? (
          <ReactMarkdown>{content}</ReactMarkdown>
        ) : (
          <p>{content}</p>
        )}

        {sources && sources.length > 0 && (
          <div className="sources">
            <button
              className="sources-toggle"
              onClick={() => setShowSources(s => !s)}
            >
              <FileText size={12} />
              {sources.length} source{sources.length > 1 ? 's' : ''} referenced
              {showSources
                ? <ChevronUp size={12} />
                : <ChevronDown size={12} />
              }
            </button>

            {showSources && (
              <div className="sources-list">
                {sources.map((src, i) => (
                  <div key={i} className="source-item">
                    <div className="source-header">
                      <FileText size={10} />
                      {src.file} — page {src.page}
                    </div>
                    <div className="source-snippet">"{src.snippet}"</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
