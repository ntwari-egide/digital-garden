// This page shows all posts that contain a specific hashtag
// The hashtag comes from the URL — e.g. /tag/react shows posts with #react

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { apiFetch } from '../api/client'
import Navbar from '../components/layout/Navbar'
import PostList from '../components/posts/PostList'
import '../styles/feed.css'
import '../styles/post.css'
import '../styles/profile.css'

export default function TagFeedPage() {
  // Get the tag name from the URL (e.g. /tag/coding -> tagname = "coding")
  const { tagname } = useParams()

  // Posts that contain this hashtag
  const [posts, setPosts] = useState([])

  // Liked post IDs
  const [likedPostIds, setLikedPostIds] = useState(new Set())

  // True while posts are loading
  const [loading, setLoading] = useState(true)

  // Error message if loading fails
  const [error, setError] = useState('')

  // Fetch posts whenever the tag in the URL changes
  useEffect(() => {
    setLoading(true)
    setError('')
    setPosts([])  // clear old posts before loading new ones

    apiFetch(`/posts?tag=${encodeURIComponent(tagname)}`)
      .then(data => setPosts(data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [tagname])

  // Handle liking/unliking a post
  function handleLikeToggle(postId, currentlyLiked) {
    // Update the UI right away (optimistic update)
    const newLikedIds = new Set(likedPostIds)
    if (currentlyLiked) {
      newLikedIds.delete(postId)
    } else {
      newLikedIds.add(postId)
    }
    setLikedPostIds(newLikedIds)

    // Update the like count
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, like_count: currentlyLiked ? p.like_count - 1 : p.like_count + 1 }
          : p
      )
    )

    // Send to server, roll back if it fails
    apiFetch(`/posts/${postId}/like`, { method: 'POST' }).catch(() => {
      const rolledBack = new Set(likedPostIds)
      if (currentlyLiked) {
        rolledBack.add(postId)
      } else {
        rolledBack.delete(postId)
      }
      setLikedPostIds(rolledBack)

      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? { ...p, like_count: currentlyLiked ? p.like_count + 1 : p.like_count - 1 }
            : p
        )
      )
    })
  }

  // Remove a deleted post from the list
  function handleDelete(postId) {
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  // Update comment count when a comment is added
  function handleCommentAdded(postId) {
    setPosts(prev =>
      prev.map(p => p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p)
    )
  }

  // Update comment count when a comment is deleted
  function handleCommentDeleted(postId) {
    setPosts(prev =>
      prev.map(p => p.id === postId ? { ...p, comment_count: p.comment_count - 1 } : p)
    )
  }

  return (
    <div className="feed-page">
      <Navbar />
      <main className="feed-content">
        {/* Header showing which hashtag we're browsing */}
        <div className="tag-feed-header">
          <h1 className="tag-feed-title">#{tagname}</h1>
        </div>

        {/* Loading message */}
        {loading && <p className="feed-loading">Gathering notes…</p>}

        {/* Error message */}
        {error && <p className="feed-error">{error}</p>}

        {/* Empty state if no posts have this tag */}
        {!loading && !error && posts.length === 0 && (
          <p className="profile-empty">No notes found for #{tagname}.</p>
        )}

        {/* Show the matching posts */}
        {!loading && !error && posts.length > 0 && (
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
