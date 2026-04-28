// This component renders a single comment (or reply)
// It also handles showing the reply form and nested replies

import { useState } from 'react'
// Icons for the reply and delete buttons
import { CornerDownRight, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../api/client'
import CommentForm from './CommentForm'

// Format a date like "Apr 28"
function formatTime(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Get the first letters of each word in a name (up to 2)
function initials(name = '') {
  var words = name.split(' ')
  var letters = words.map(w => w[0])
  return letters.join('').slice(0, 2)
}

// depth = 0 means top-level comment, depth = 1 means reply
export default function CommentItem({ comment, postId, replies = [], onDelete, onReplyAdded, depth = 0 }) {
  // Get the current user
  const { user } = useAuth()

  // Whether the reply form is currently open
  const [replyOpen, setReplyOpen] = useState(false)

  // Check if this comment belongs to the logged-in user
  var isOwner = false
  if (user != null && user.id === comment.user_id) {
    isOwner = true
  }

  // Check if the logged-in user is an admin
  var isAdmin = false
  if (user != null && user.role === 'admin') {
    isAdmin = true
  }

  // Handle clicking the Delete button
  async function handleDelete() {
    if (!window.confirm('Delete this comment? This cannot be undone.')) return
    try {
      // Admins use a different endpoint than regular users
      var endpoint
      if (isAdmin && !isOwner) {
        endpoint = `/admin/comments/${comment.id}`
      } else {
        endpoint = `/comments/${comment.id}`
      }

      await apiFetch(endpoint, { method: 'DELETE' })
      // Tell the parent to remove this comment from the list
      onDelete(comment.id)
    } catch (err) {
      console.error('Delete comment failed:', err.message)
    }
  }

  // When a reply is added, pass it up and close the reply form
  function handleReplyAdded(newComment) {
    onReplyAdded(newComment)
    setReplyOpen(false)
  }

  return (
    <div className="comment-block">
      {/* Avatar circle with the commenter's initials */}
      <div className="comment-avatar" aria-hidden="true">
        {initials(comment.full_name)}
      </div>

      <div className="comment-body">
        {/* Author name and timestamp */}
        <div className="comment-meta-row">
          <span className="comment-author">{comment.full_name}</span>
          <span className="comment-time">{formatTime(comment.created_at)}</span>
        </div>

        {/* Comment text */}
        <p className="comment-content">{comment.content}</p>

        {/* Reply and Delete buttons */}
        <div className="comment-actions-row">
          {/* Only show Reply button on top-level comments — no deep nesting */}
          {depth === 0 && (
            <button className="comment-reply-btn" onClick={() => setReplyOpen(o => !o)}>
              <CornerDownRight size={12} strokeWidth={2} />
              {replyOpen ? 'Cancel' : 'Reply'}
            </button>
          )}

          {/* Show Delete button to the owner and to admins */}
          {(isOwner || isAdmin) && (
            <button className="comment-delete-btn" onClick={handleDelete}>
              <Trash2 size={12} strokeWidth={2} />
              Delete
            </button>
          )}
        </div>

        {/* Show the reply form when the Reply button is clicked */}
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

        {/* Show any replies to this comment */}
        {replies.length > 0 && (
          <div className="comment-replies">
            {replies.map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                postId={postId}
                replies={[]}  // replies can't have their own replies
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
