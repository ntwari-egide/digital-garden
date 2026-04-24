import { useState, useEffect } from 'react'
import { apiFetch } from '../../api/client'
import CommentList from './CommentList'
import CommentForm from './CommentForm'
import '../../styles/comments.css'

export default function CommentSection({ postId, onCommentAdded, onCommentDeleted }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch(`/posts/${postId}/comments`)
      .then(data => setComments(data || []))
      .catch(err => console.error('Load comments failed:', err.message))
      .finally(() => setLoading(false))
  }, [postId])

  function handleCommentAdded(newComment) {
    setComments(prev => [...prev, newComment])
    // Only increment count for top-level comments, not replies
    if (!newComment.parent_id) onCommentAdded()
  }

  function handleCommentDeleted(commentId) {
    const deleted = comments.find(c => c.id === commentId)
    setComments(prev => prev.filter(c => c.id !== commentId && c.parent_id !== commentId))
    if (deleted && !deleted.parent_id) onCommentDeleted()
  }

  return (
    <div className="comment-section">
      <CommentForm postId={postId} onCommentAdded={handleCommentAdded} />
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
