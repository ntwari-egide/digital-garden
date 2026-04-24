import { useState } from 'react'
import { apiFetch } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

export default function CommentForm({ postId, parentId = null, placeholder = 'Add a comment…', onCommentAdded, onCancel }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    try {
      const body = { content }
      if (parentId) body.parent_id = parentId

      const newComment = await apiFetch(`/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify(body),
      })
      onCommentAdded({ ...newComment, full_name: user.full_name })
      setContent('')
      if (onCancel) onCancel()
    } catch (err) {
      console.error('Comment failed:', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={placeholder}
        rows={2}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', alignSelf: 'flex-end' }}>
        <button type="submit" className="comment-submit-btn" disabled={loading || !content.trim()}>
          {loading ? '…' : parentId ? 'Reply' : 'Post'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="comment-reply-btn" style={{ textAlign: 'center' }}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
