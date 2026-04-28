// This is the main feed page — the home page when you're logged in
// It shows all posts and lets you create new ones

import { useState, useEffect } from 'react'
import { apiFetch } from '../api/client'
import Navbar from '../components/layout/Navbar'
import PostForm from '../components/posts/PostForm'
import PostList from '../components/posts/PostList'
import '../styles/feed.css'
import '../styles/post.css'

export default function FeedPage() {
  // The list of all posts to display
  const [posts, setPosts] = useState([])

  // A Set of post IDs that the current user has liked
  const [likedPostIds, setLikedPostIds] = useState(new Set())

  // True while posts are being loaded
  const [loading, setLoading] = useState(true)

  // Error message if posts fail to load
  const [error, setError] = useState('')

  // Load all posts when the page first renders
  useEffect(() => {
    apiFetch('/posts')
      .then(data => setPosts(data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  // Called after a new post is created — add it to the top of the feed
  function handlePostCreated(newPost) {
    setPosts(prev => [newPost, ...prev])
  }

  // Called when the user clicks the like button on a post
  // currentlyLiked = whether the post is already liked
  function handleLikeToggle(postId, currentlyLiked) {
    // Update the UI immediately before waiting for the server (optimistic update)
    // This makes the app feel faster
    const newLikedIds = new Set(likedPostIds)
    if (currentlyLiked) {
      newLikedIds.delete(postId)  // remove the like
    } else {
      newLikedIds.add(postId)     // add the like
    }
    setLikedPostIds(newLikedIds)

    // Also update the like count shown on the post card
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, like_count: currentlyLiked ? p.like_count - 1 : p.like_count + 1 }
          : p
      )
    )

    // Tell the server about the like/unlike
    apiFetch(`/posts/${postId}/like`, { method: 'POST' }).catch(() => {
      // If the server request fails, undo the optimistic update
      const rolledBack = new Set(likedPostIds)
      if (currentlyLiked) {
        rolledBack.add(postId)     // put the like back
      } else {
        rolledBack.delete(postId)  // remove the like we added
      }
      setLikedPostIds(rolledBack)

      // Undo the count change too
      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? { ...p, like_count: currentlyLiked ? p.like_count + 1 : p.like_count - 1 }
            : p
        )
      )
    })
  }

  // Called when a post is deleted — remove it from the list
  function handleDelete(postId) {
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  // Called when a new comment is added to a post — increment the comment count
  function handleCommentAdded(postId) {
    setPosts(prev =>
      prev.map(p => p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p)
    )
  }

  // Called when a comment is deleted — decrement the comment count
  function handleCommentDeleted(postId) {
    setPosts(prev =>
      prev.map(p => p.id === postId ? { ...p, comment_count: p.comment_count - 1 } : p)
    )
  }

  return (
    <div className="feed-page">
      <Navbar />
      <main className="feed-content">
        {/* Form to create a new post */}
        <PostForm onPostCreated={handlePostCreated} />

        {/* Show a loading message while posts are being fetched */}
        {loading && <p className="feed-loading">Tending the garden…</p>}

        {/* Show an error if fetching failed */}
        {error && <p className="feed-error">{error}</p>}

        {/* Show the post list once loaded */}
        {!loading && !error && (
          <PostList
            posts={posts}
            likedPostIds={likedPostIds}
            onLikeToggle={handleLikeToggle}
            onDelete={handleDelete}
            onCommentAdded={handleCommentAdded}
            onCommentDeleted={handleCommentDeleted}
          />
        )}
      </main>
    </div>
  )
}
