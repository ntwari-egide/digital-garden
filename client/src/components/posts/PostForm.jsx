import { useState, useRef } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { apiFetch } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

const MAX = 2000

export default function PostForm({ onPostCreated }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  const { user } = useAuth()

  const remaining = MAX - content.length
  let counterClass = 'char-counter'
  if (remaining <= 100 && remaining > 0) counterClass += ' char-counter--warning'
  if (remaining <= 0) counterClass += ' char-counter--danger'

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  function removeImage() {
    setImage(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim() || content.length > MAX) return
    setError('')
    setLoading(true)
    try {
      const form = new FormData()
      form.append('title', title)
      form.append('content', content)
      if (image) form.append('image', image)

      const newPost = await apiFetch('/posts', { method: 'POST', body: form })
      onPostCreated({ ...newPost, full_name: user.full_name, like_count: 0, comment_count: 0 })
      setTitle('')
      setContent('')
      removeImage()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="post-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="note-title-input"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Note title (optional)"
        maxLength={255}
      />
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="What are you thinking about today?"
        maxLength={MAX + 50}
      />

      {preview && (
        <div className="post-form-preview">
          <img src={preview} alt="preview" />
          <button type="button" className="preview-remove" onClick={removeImage}>
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {error && <p className="error-msg">{error}</p>}

      <div className="post-form-footer">
        <div className="post-form-left">
          <button
            type="button"
            className="attach-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Attach image"
          >
            <ImagePlus size={18} strokeWidth={1.75} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
          <span className={counterClass}>{remaining}</span>
        </div>
        <button
          type="submit"
          className="btn-primary"
          disabled={loading || !content.trim() || content.length > MAX}
        >
          {loading ? 'Planting…' : 'Plant note'}
        </button>
      </div>
    </form>
  )
}
