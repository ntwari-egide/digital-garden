// This component loads and manages the comments for a single post
// It fetches comments from the server, then shows the comment form and list

import { useState, useEffect } from 'react'
import { apiFetch } from '../../api/client'
import CommentList from './CommentList'
import CommentForm from './CommentForm'
import '../../styles/comments.css'

export default function CommentSection({ postId, onCommentAdded, onCommentDeleted }) {
  // The list of comments for this post
  const [comments, setComments] = useState([])

  // True while the comments are being fetched
  const [loading, setLoading] = useState(true)

  // Fetch comments when this component loads (or when postId changes)
  useEffect(() => {
    apiFetch(`/posts/${postId}/comments`)
      .then(data => setComments(data || []))
      .catch(err => console.error('Load comments failed:', err.message))
      .finally(() => setLoading(false))
  }, [postId])

  // Called when a new comment or reply is added
  function handleCommentAdded(newComment) {
    // Add the new comment to the local list
    setComments(prev => [...prev, newComment])

    // Only count top-level comments (not replies) in the post's comment count
    if (!newComment.parent_id) onCommentAdded()
  }

  // Called when a comment is deleted
  function handleCommentDeleted(commentId) {
    // Find the comment that was deleted so we can check if it was top-level
    const deleted = comments.find(c => c.id === commentId)

    // Remove the deleted comment AND any replies to it
    setComments(prev => prev.filter(c => c.id !== commentId && c.parent_id !== commentId))

    // Only update the count for top-level comment deletions
    if (deleted && !deleted.parent_id) onCommentDeleted()
  }

  return (
    <div className="comment-section">
      {/* The form to add a new comment */}
      <CommentForm postId={postId} onCommentAdded={handleCommentAdded} />

      {/* Show a loading message or the comment list */}
      {loading
        ? <p className="comment-loading">Loading…</p>
        : <CommentList
            comments={comments}
            postId={postId}
            onDelete={handleCommentDeleted}
            onReplyAdded={handleCommentAdded}
          />
      }
    </div>
  )
}
