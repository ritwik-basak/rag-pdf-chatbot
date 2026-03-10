import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadPDF } from '../api'
import { FileText, Trash2, CheckCircle, AlertCircle, Upload } from 'lucide-react'

export default function Sidebar({ onClearChat }) {
  const [files, setFiles] = useState([])

  const onDrop = useCallback(async (acceptedFiles) => {
    for (const file of acceptedFiles) {
      // Add to list with uploading state
      const id = Date.now() + Math.random()
      setFiles(prev => [...prev, {
        id, name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        status: 'uploading', chunks: null, error: null,
      }])

      try {
        const result = await uploadPDF(file)
        setFiles(prev => prev.map(f =>
          f.id === id ? { ...f, status: 'success', chunks: result.chunks } : f
        ))
      } catch (err) {
        const msg = err.response?.data?.detail || 'Upload failed'
        setFiles(prev => prev.map(f =>
          f.id === id ? { ...f, status: 'error', error: msg } : f
        ))
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
  })

  const removeFile = (id) => setFiles(prev => prev.filter(f => f.id !== id))

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">📚</div>
          <span className="logo-text">DocChat</span>
        </div>
        <div className="logo-tagline">RAG · Gemini · Pinecone</div>
      </div>

      <div className="sidebar-section">
        <div>
          <div className="section-label">Upload Documents</div>
          <div
            {...getRootProps()}
            className={`dropzone ${isDragActive ? 'drag-active' : ''}`}
          >
            <input {...getInputProps()} />
            <span className="dropzone-icon">
              <Upload size={28} strokeWidth={1.5} color="var(--accent)" />
            </span>
            <div className="dropzone-text">
              <strong>{isDragActive ? 'Drop it here!' : 'Drop PDFs here'}</strong>
              or click to browse
            </div>
          </div>
        </div>

        {files.length > 0 && (
          <div>
            <div className="section-label">Indexed Files</div>
            <div className="file-list">
              {files.map(file => (
                <div key={file.id} className={`file-item ${file.status}`}>
                  <FileText size={16} color={
                    file.status === 'success' ? 'var(--success)' :
                    file.status === 'error'   ? 'var(--error)' :
                    'var(--text-muted)'
                  } />
                  <div className="file-info">
                    <div className="file-name">{file.name}</div>
                    <div className="file-meta">
                      {file.status === 'uploading' && 'Indexing…'}
                      {file.status === 'success'  && `${file.chunks} chunks indexed`}
                      {file.status === 'error'    && file.error}
                    </div>
                  </div>
                  <div className="file-status">
                    {file.status === 'uploading' && <div className="spinner" />}
                    {file.status === 'success'   && <CheckCircle size={14} color="var(--success)" />}
                    {file.status === 'error'     && (
                      <button
                        onClick={() => removeFile(file.id)}
                        style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}
                      >
                        <AlertCircle size={14} color="var(--error)" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <button className="clear-btn" onClick={onClearChat}>
          <Trash2 size={14} />
          Clear Chat
        </button>
      </div>
    </aside>
  )
}
