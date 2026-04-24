import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../api/client'
import CommentForm from './CommentForm'

function formatTime(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2)
}

export default function CommentItem({ comment, postId, replies = [], onDelete, onReplyAdded, depth = 0 }) {
  const { user } = useAuth()
  const [replyOpen, setReplyOpen] = useState(false)

  const isOwner = user?.id === comment.user_id
  const isAdmin = user?.role === 'admin'

  async function handleDelete() {
    if (!window.confirm('Delete this comment? This cannot be undone.')) return
    try {
      const endpoint = isAdmin && !isOwner
        ? `/admin/comments/${comment.id}`
        : `/comments/${comment.id}`
      await apiFetch(endpoint, { method: 'DELETE' })
      onDelete(comment.id)
    } catch (err) {
      console.error('Delete comment failed:', err.message)
    }
  }

  function handleReplyAdded(newComment) {
    onReplyAdded(newComment)
    setReplyOpen(false)
  }

  return (
    <div className="comment-block">
      <div className="comment-avatar" aria-hidden="true">
        {initials(comment.full_name)}
      </div>

      <div className="comment-body">
        <div className="comment-meta-row">
          <span className="comment-author">{comment.full_name}</span>
          <span className="comment-time">{formatTime(comment.created_at)}</span>
        </div>

        <p className="comment-content">{comment.content}</p>

        <div className="comment-actions-row">
          {/* Only allow one level of nesting */}
          {depth === 0 && (
            <button className="comment-reply-btn" onClick={() => setReplyOpen(o => !o)}>
              {replyOpen ? 'Cancel' : 'Reply'}
            </button>
          )}
          {(isOwner || isAdmin) && (
            <button className="comment-delete-btn" onClick={handleDelete}>Delete</button>
          )}
        </div>

        {replyOpen && (
          <div className="reply-form-wrap">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              placeholder={`Reply to ${comment.full_name}…`}
              onCommentAdded={handleReplyAdded}
              onCancel={() => setReplyOpen(false)}
            />
          </div>
        )}

        {replies.length > 0 && (
          <div className="comment-replies">
            {replies.map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                postId={postId}
                replies={[]}
                onDelete={onDelete}
                onReplyAdded={onReplyAdded}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
