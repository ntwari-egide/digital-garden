// This component organizes comments into a tree structure
// Top-level comments are shown first, with replies nested under them

import CommentItem from './CommentItem'

export default function CommentList({ comments, postId, onDelete, onReplyAdded }) {
  // Separate the top-level comments (no parent) from the replies
  const topLevel = comments.filter(c => !c.parent_id)

  // Build a lookup table: { parentId: [reply1, reply2, ...] }
  // This lets us quickly find replies for any comment
  const byParent = {}
  comments.forEach(c => {
    if (c.parent_id) {
      // Create the array for this parent if it doesn't exist yet
      if (!byParent[c.parent_id]) byParent[c.parent_id] = []
      byParent[c.parent_id].push(c)
    }
  })

  // If there are no top-level comments, show an empty state
  if (topLevel.length === 0) {
    return <p className="comment-empty">No comments yet. Be the first to reply.</p>
  }

  // Render each top-level comment with its replies
  return (
    <div className="comment-thread">
      {topLevel.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          postId={postId}
          // Pass this comment's replies (or an empty array if it has none)
          replies={byParent[comment.id] || []}
          onDelete={onDelete}
          onReplyAdded={onReplyAdded}
          depth={0}
        />
      ))}
    </div>
  )
}
