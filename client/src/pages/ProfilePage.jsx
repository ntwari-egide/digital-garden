import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Leaf, Sprout } from 'lucide-react'
import { apiFetch } from '../api/client'
import Navbar from '../components/layout/Navbar'
import PostList from '../components/posts/PostList'
import '../styles/feed.css'
import '../styles/post.css'
import '../styles/profile.css'

export default function ProfilePage() {
  const { userId } = useParams()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [likedPostIds, setLikedPostIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.all([
      apiFetch(`/users/${userId}`),
      apiFetch(`/users/${userId}/posts`),
    ])
      .then(([profileData, postsData]) => {
        setProfile(profileData)
        setPosts(postsData || [])
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [userId])

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
    if (profile) {
      setProfile(prev => ({ ...prev, post_count: prev.post_count - 1 }))
    }
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
        {loading && <p className="feed-loading">Tending the garden…</p>}
        {error && <p className="feed-error">{error}</p>}
        {!loading && !error && profile && (
          <>
            <div className="profile-header">
              <div className="profile-avatar">{profile.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</div>
              <h1 className="profile-name">{profile.full_name}</h1>
              <div className="profile-stats">
                <div className="profile-stat">
                  <Sprout size={16} strokeWidth={1.75} />
                  <span className="profile-stat-value">{profile.post_count}</span>
                  <span className="profile-stat-label">plants planted</span>
                </div>
                <div className="profile-stat">
                  <Leaf size={16} strokeWidth={1.75} />
                  <span className="profile-stat-value">{profile.total_resonances}</span>
                  <span className="profile-stat-label">resonances received</span>
                </div>
              </div>
            </div>

            {posts.length === 0 ? (
              <p className="profile-empty">No notes planted yet.</p>
            ) : (
              <PostList
                posts={posts}
                likedPostIds={likedPostIds}
                onLikeToggle={handleLikeToggle}
                onDelete={handleDelete}
                onCommentAdded={handleCommentAdded}
                onCommentDeleted={handleCommentDeleted}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
