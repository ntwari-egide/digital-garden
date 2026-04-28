// This is the search results page
// It shows matching posts and users based on the search query in the URL

import { useState, useEffect } from 'react'
// useSearchParams reads the ?q= part of the URL
import { useSearchParams, Link } from 'react-router-dom'
import { apiFetch } from '../api/client'
import Navbar from '../components/layout/Navbar'
import PostList from '../components/posts/PostList'
import '../styles/feed.css'
import '../styles/post.css'
import '../styles/profile.css'
import '../styles/search.css'

// Get the first two initials from a name (e.g. "Jane Smith" -> "JS")
function initials(name = '') {
  var words = name.split(' ')
  var letters = words.map(w => w[0])
  return letters.join('').slice(0, 2).toUpperCase()
}

export default function SearchPage() {
  // Read the ?q= query parameter from the URL
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') || ''

  // Search result lists
  const [posts, setPosts] = useState([])
  const [users, setUsers] = useState([])

  // Liked post IDs
  const [likedPostIds, setLikedPostIds] = useState(new Set())

  // True while results are being fetched
  const [loading, setLoading] = useState(false)

  // Error message if search fails
  const [error, setError] = useState('')

  // Re-run the search whenever the query changes
  useEffect(() => {
    // Don't search if the query is empty
    if (!q.trim()) return

    setLoading(true)
    setError('')

    // Fetch search results from the server
    apiFetch(`/search?q=${encodeURIComponent(q)}`)
      .then(data => {
        setPosts(data.posts || [])
        setUsers(data.users || [])
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [q])

  // Handle liking/unliking a post in the search results
  function handleLikeToggle(postId, currentlyLiked) {
    // Optimistic update
    const newLikedIds = new Set(likedPostIds)
    if (currentlyLiked) {
      newLikedIds.delete(postId)
    } else {
      newLikedIds.add(postId)
    }
    setLikedPostIds(newLikedIds)

    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, like_count: currentlyLiked ? p.like_count - 1 : p.like_count + 1 }
          : p
      )
    )

    apiFetch(`/posts/${postId}/like`, { method: 'POST' }).catch(() => {
      // Roll back if the request fails
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

  // Remove a deleted post from the results
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

  // Check if we have any results to show
  const hasResults = posts.length > 0 || users.length > 0

  // True if the user actually searched for something
  const searched = q.trim().length > 0

  return (
    <div className="feed-page">
      <Navbar />
      <main className="feed-content">
        {/* Show what was searched for */}
        {searched && (
          <p className="search-query-label">
            Results for <strong>"{q}"</strong>
          </p>
        )}

        {/* Loading message */}
        {loading && <p className="feed-loading">Searching the garden…</p>}

        {/* Error message */}
        {error && <p className="feed-error">{error}</p>}

        {/* No results message */}
        {!loading && !error && searched && !hasResults && (
          <p className="profile-empty">Nothing found for "{q}".</p>
        )}

        {/* User results section */}
        {!loading && !error && users.length > 0 && (
          <section className="search-section">
            <h2 className="search-section-title">Gardeners</h2>
            <div className="search-users">
              {/* Render a card for each matching user */}
              {users.map(u => (
                <Link key={u.id} to={`/profile/${u.id}`} className="search-user-card">
                  <div className="search-user-avatar">{initials(u.full_name)}</div>
                  <span className="search-user-name">{u.full_name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Post results section */}
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
