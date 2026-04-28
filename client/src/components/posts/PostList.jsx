// This component renders a list of posts
// It just loops through the posts array and renders a PostCard for each one

import PostCard from './PostCard'

export default function PostList({ posts, likedPostIds, onLikeToggle, onDelete, onCommentAdded, onCommentDeleted }) {
  // If there are no posts, show an empty state message
  if (posts.length === 0) {
    return <p className="post-list-empty">The garden is empty. Plant the first note.</p>
  }

  // Render a PostCard for each post in the array
  return (
    <div className="post-list">
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          // Check if this post is in the liked set
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
