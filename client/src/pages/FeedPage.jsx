import { useState, useEffect } from 'react'
import { apiFetch } from '../api/client'
import Navbar from '../components/layout/Navbar'
import PostForm from '../components/posts/PostForm'
import PostList from '../components/posts/PostList'
import '../styles/feed.css'
import '../styles/post.css'

export default function FeedPage() {
  const [posts, setPosts] = useState([])
  const [likedPostIds, setLikedPostIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/posts')
      .then(data => setPosts(data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function handlePostCreated(newPost) {
    setPosts(prev => [newPost, ...prev])
  }

  function handleLikeToggle(postId, currentlyLiked) {
    // Optimistic update
    setLikedPostIds(prev => {
      const next = new Set(prev)
      currentlyLiked ? next.delete(postId) : next.add(postId)
      return next
    })
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, like_count: currentlyLiked ? p.like_count - 1 : p.like_count + 1 }
          : p
      )
    )

    apiFetch(`/posts/${postId}/like`, { method: 'POST' }).catch(() => {
      // Roll back on failure
      setLikedPostIds(prev => {
        const next = new Set(prev)
        currentlyLiked ? next.add(postId) : next.delete(postId)
        return next
      })
      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? { ...p, like_count: currentlyLiked ? p.like_count + 1 : p.like_count - 1 }
            : p
        )
      )
    })
  }

  function handleDelete(postId) {
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  function handleCommentAdded(postId) {
    setPosts(prev =>
      prev.map(p => p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p)
    )
  }

  function handleCommentDeleted(postId) {
    setPosts(prev =>
      prev.map(p => p.id === postId ? { ...p, comment_count: p.comment_count - 1 } : p)
    )
  }

  return (
    <div className="feed-page">
      <Navbar />
      <main className="feed-content">
        <PostForm onPostCreated={handlePostCreated} />
        {loading && <p className="feed-loading">Loading posts…</p>}
        {error && <p className="feed-error">{error}</p>}
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
