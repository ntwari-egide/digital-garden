import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { apiFetch } from '../api/client'
import Navbar from '../components/layout/Navbar'
import PostList from '../components/posts/PostList'
import '../styles/feed.css'
import '../styles/post.css'
import '../styles/profile.css'

export default function TagFeedPage() {
  const { tagname } = useParams()
  const [posts, setPosts] = useState([])
  const [likedPostIds, setLikedPostIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    setPosts([])
    apiFetch(`/posts?tag=${encodeURIComponent(tagname)}`)
      .then(data => setPosts(data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [tagname])

  function handleLikeToggle(postId, currentlyLiked) {
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
        <div className="tag-feed-header">
          <h1 className="tag-feed-title">#{tagname}</h1>
        </div>
        {loading && <p className="feed-loading">Gathering notes…</p>}
        {error && <p className="feed-error">{error}</p>}
        {!loading && !error && posts.length === 0 && (
          <p className="profile-empty">No notes found for #{tagname}.</p>
        )}
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
