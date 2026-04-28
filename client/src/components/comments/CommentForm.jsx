// This is the form for writing and submitting a comment or reply
// It's used both for new top-level comments and for replies to existing ones

import { useState } from 'react'
import { apiFetch } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

// parentId is null for top-level comments, or the parent comment's id for replies
// placeholder is the text shown inside the textarea
// onCancel is optional — shown as a Cancel button when provided (for reply forms)
export default function CommentForm({ postId, parentId = null, placeholder = 'Add a comment…', onCommentAdded, onCancel }) {
  // The text the user types in the comment box
  const [content, setContent] = useState('')

  // True while the comment is being submitted
  const [loading, setLoading] = useState(false)

  // Get the current user (needed to add their name to the new comment locally)
  const { user } = useAuth()

  // Handle submitting the comment
  async function handleSubmit(e) {
    e.preventDefault()  // don't refresh the page

    // Don't submit if the box is empty
    if (!content.trim()) return

    setLoading(true)
    try {
      // Build the request body
      const body = { content }

      // If this is a reply, include the parent comment's id
      if (parentId) body.parent_id = parentId

      // Send the comment to the server
      const newComment = await apiFetch(`/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify(body),
      })

      // Tell the parent component about the new comment
      // We add full_name here since the server response doesn't include it
      onCommentAdded({ ...newComment, full_name: user.full_name })

      // Clear the text box
      setContent('')

      // Close the reply form if this was a reply
      if (onCancel) onCancel()
    } catch (err) {
      console.error('Comment failed:', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      {/* Comment text area */}
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={placeholder}
        rows={2}
      />

      {/* Submit and cancel buttons stacked vertically */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', alignSelf: 'flex-end' }}>
        {/* Submit button — shows "Reply" for replies, "Post" for new comments */}
        <button type="submit" className="comment-submit-btn" disabled={loading || !content.trim()}>
          {loading ? '…' : parentId ? 'Reply' : 'Post'}
        </button>

        {/* Cancel button only appears on reply forms */}
        {onCancel && (
          <button type="button" onClick={onCancel} className="comment-reply-btn" style={{ textAlign: 'center' }}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
