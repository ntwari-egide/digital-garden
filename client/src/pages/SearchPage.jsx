import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { apiFetch } from '../api/client'
import Navbar from '../components/layout/Navbar'
import PostList from '../components/posts/PostList'
import '../styles/feed.css'
import '../styles/post.css'
import '../styles/profile.css'
import '../styles/search.css'


function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') || ''

  const [posts, setPosts] = useState([])
  const [users, setUsers] = useState([])
  const [likedPostIds, setLikedPostIds] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!q.trim()) return
    setLoading(true)
    setError('')
    apiFetch(`/search?q=${encodeURIComponent(q)}`)
      .then(data => {
        setPosts(data.posts || [])
        setUsers(data.users || [])
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [q])

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

  const hasResults = posts.length > 0 || users.length > 0
  const searched = q.trim().length > 0

  return (
    <div className="feed-page">
      <Navbar />
      <main className="feed-content">
        {searched && (
          <p className="search-query-label">
            Results for <strong>"{q}"</strong>
          </p>
        )}

        {loading && <p className="feed-loading">Searching the garden…</p>}
        {error && <p className="feed-error">{error}</p>}

        {!loading && !error && searched && !hasResults && (
          <p className="profile-empty">Nothing found for "{q}".</p>
        )}

        {!loading && !error && users.length > 0 && (
          <section className="search-section">
            <h2 className="search-section-title">Gardeners</h2>
            <div className="search-users">
              {users.map(u => (
                <Link key={u.id} to={`/profile/${u.id}`} className="search-user-card">
                  <div className="search-user-avatar">{initials(u.full_name)}</div>
                  <span className="search-user-name">{u.full_name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {!loading && !error && posts.length > 0 && (
          <section className="search-section">
            <h2 className="search-section-title">Notes</h2>
            <PostList
              posts={posts}
              likedPostIds={likedPostIds}
              onLikeToggle={handleLikeToggle}
              onDelete={handleDelete}
              onCommentAdded={handleCommentAdded}
              onCommentDeleted={handleCommentDeleted}
            />
          </section>
        )}
      </main>
    </div>
  )
}
