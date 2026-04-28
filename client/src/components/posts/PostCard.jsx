import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Leaf, MessageCircle, Trash2 } from 'lucide-react'
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

function parseTags(content = '') {
  const tags = content.match(/#([a-zA-Z0-9_]+)/g) || []
  return [...new Set(tags.map(t => t.slice(1)))]
}

function renderContent(content = '') {
  const parts = content.split(/(#[a-zA-Z0-9_]+)/g)
  return parts.map((part, i) => {
    if (/^#[a-zA-Z0-9_]+$/.test(part)) {
      const tag = part.slice(1)
      return <Link key={i} to={`/tag/${tag}`} className="content-tag">{part}</Link>
    }
    return part
  })
}

export default function PostCard({ post, liked, onLikeToggle, onDelete, onCommentAdded, onCommentDeleted }) {
  const { user } = useAuth()
  const [commentsOpen, setCommentsOpen] = useState(false)

  const isOwner = user?.id === post.user_id
  const isAdmin = user?.role === 'admin'

  const tags = parseTags(post.content)

  async function handleDelete() {
    if (!window.confirm('Remove this note from the garden? This cannot be undone.')) return
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
      {post.title && <h3 className="note-title">{post.title}</h3>}

      <div className="post-meta">
        <div className="post-avatar" aria-hidden="true">{initials(post.full_name)}</div>
        <div className="post-meta-text">
          <Link to={`/profile/${post.user_id}`} className="post-author">{post.full_name}</Link>
          <span className="post-time">{formatTime(post.created_at)}</span>
        </div>
        {(isOwner || isAdmin) && (
          <button className="delete-post-btn" onClick={handleDelete} title="Remove note">
            <Trash2 size={14} strokeWidth={2} />
          </button>
        )}
      </div>

      <p className="post-content">{renderContent(post.content)}</p>

      {post.image_url && (
        <div className="post-image-wrap">
          <img src={`${API_BASE}${post.image_url}`} alt="note attachment" className="post-image" />
        </div>
      )}

      {tags.length > 0 && (
        <div className="note-tags">
          {tags.map(tag => (
            <Link key={tag} to={`/tag/${tag}`} className="note-tag">#{tag}</Link>
          ))}
        </div>
      )}

      <div className="post-actions">
        <button
          className={`like-btn${liked ? ' like-btn--active' : ''}`}
          onClick={() => onLikeToggle(post.id, liked)}
          title="This resonated with me"
        >
          <Leaf size={14} strokeWidth={2} fill={liked ? 'currentColor' : 'none'} />
          {post.like_count > 0 && <span className="like-label">{post.like_count}</span>}
          <span className="like-text">Resonated</span>
        </button>

        <button
          className={`comment-toggle-btn${commentsOpen ? ' comment-toggle-btn--active' : ''}`}
          onClick={() => setCommentsOpen(o => !o)}
        >
          <MessageCircle size={14} strokeWidth={2} />
          {post.comment_count} {commentsOpen ? 'Hide' : 'Responses'}
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
