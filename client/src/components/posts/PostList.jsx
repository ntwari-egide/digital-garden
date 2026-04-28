import PostCard from './PostCard'

export default function PostList({ posts, likedPostIds, onLikeToggle, onDelete, onCommentAdded, onCommentDeleted }) {
  if (posts.length === 0) {
    return <p className="post-list-empty">The garden is empty. Plant the first note.</p>
  }

  return (
    <div className="post-list">
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          liked={likedPostIds.has(post.id)}
          onLikeToggle={onLikeToggle}
          onDelete={onDelete}
          onCommentAdded={onCommentAdded}
          onCommentDeleted={onCommentDeleted}
        />
      ))}
    </div>
  )
}
