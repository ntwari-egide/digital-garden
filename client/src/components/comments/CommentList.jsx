import CommentItem from './CommentItem'

export default function CommentList({ comments, postId, onDelete, onReplyAdded }) {
  // Build tree: separate top-level from replies
  const topLevel = comments.filter(c => !c.parent_id)
  const byParent = {}
  comments.forEach(c => {
    if (c.parent_id) {
      if (!byParent[c.parent_id]) byParent[c.parent_id] = []
      byParent[c.parent_id].push(c)
    }
  })

  if (topLevel.length === 0) {
    return <p className="comment-empty">No comments yet. Be the first to reply.</p>
  }

  return (
    <div className="comment-thread">
      {topLevel.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          postId={postId}
          replies={byParent[comment.id] || []}
          onDelete={onDelete}
          onReplyAdded={onReplyAdded}
          depth={0}
        />
      ))}
    </div>
  )
}
