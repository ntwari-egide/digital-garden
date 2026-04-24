import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../api/client'
import CommentSection from '../comments/CommentSection'

const API_BASE = 'http://localhost:3000'

function formatTime(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function PostCard({ post, liked, onLikeToggle, onDelete, onCommentAdded, onCommentDeleted }) {
  const { user } = useAuth()
  const [commentsOpen, setCommentsOpen] = useState(false)

  const isOwner = user?.id === post.user_id
  const isAdmin = user?.role === 'admin'

  async function handleDelete() {
    if (!window.confirm('Delete this post? This cannot be undone.')) return
    try {
      const endpoint = isAdmin && !isOwner
        ? `/admin/posts/${post.id}`
        : `/posts/${post.id}`
      await apiFetch(endpoint, { method: 'DELETE' })
      onDelete(post.id)
    } catch (err) {
      console.error('Delete failed:', err.message)
    }
  }

  return (
    <article className="post-card">
      <div className="post-meta">
        <div className="post-avatar" aria-hidden="true">{initials(post.full_name)}</div>
        <div className="post-meta-text">
          <span className="post-author">{post.full_name}</span>
          <span className="post-time">{formatTime(post.created_at)}</span>
        </div>
        {(isOwner || isAdmin) && (
          <button className="delete-post-btn" onClick={handleDelete} title="Delete post">✕</button>
        )}
      </div>

      <p className="post-content">{post.content}</p>

      {post.image_url && (
        <div className="post-image-wrap">
          <img src={`${API_BASE}${post.image_url}`} alt="post attachment" className="post-image" />
        </div>
      )}

      <div className="post-actions">
        <button
          className={`like-btn${liked ? ' like-btn--active' : ''}`}
          onClick={() => onLikeToggle(post.id, liked)}
        >
          ♥ {post.like_count}
        </button>

        <button
          className={`comment-toggle-btn${commentsOpen ? ' comment-toggle-btn--active' : ''}`}
          onClick={() => setCommentsOpen(o => !o)}
        >
          💬 {post.comment_count} {commentsOpen ? 'Hide' : 'Comments'}
        </button>
      </div>

      {commentsOpen && (
        <CommentSection
          postId={post.id}
          onCommentAdded={() => onCommentAdded(post.id)}
          onCommentDeleted={() => onCommentDeleted(post.id)}
        />
      )}
    </article>
  )
}
