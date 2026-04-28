// This is the user profile page
// It shows a user's stats (post count, total likes) and all their posts

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
// Sprout and Leaf are icons for the stats section
import { Leaf, Sprout } from 'lucide-react'
import { apiFetch } from '../api/client'
import Navbar from '../components/layout/Navbar'
import PostList from '../components/posts/PostList'
import '../styles/feed.css'
import '../styles/post.css'
import '../styles/profile.css'

export default function ProfilePage() {
  // Get the userId from the URL (e.g. /profile/42 -> userId = "42")
  const { userId } = useParams()

  // The profile data (name, post count, total likes)
  const [profile, setProfile] = useState(null)

  // All posts made by this user
  const [posts, setPosts] = useState([])

  // Liked post IDs for this user's posts
  const [likedPostIds, setLikedPostIds] = useState(new Set())

  // True while data is loading
  const [loading, setLoading] = useState(true)

  // Error message if loading fails
  const [error, setError] = useState('')

  // Fetch profile and posts whenever the userId in the URL changes
  useEffect(() => {
    setLoading(true)
    setError('')

    // Fetch profile stats and posts at the same time
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

  // Handle liking/unliking a post on this profile page
  function handleLikeToggle(postId, currentlyLiked) {
    // Optimistic update — update the UI right away
    const newLikedIds = new Set(likedPostIds)
    if (currentlyLiked) {
      newLikedIds.delete(postId)
    } else {
      newLikedIds.add(postId)
    }
    setLikedPostIds(newLikedIds)

    // Update the like count on the post
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, like_count: currentlyLiked ? p.like_count - 1 : p.like_count + 1 }
          : p
      )
    )

    // Send the request to the server
    apiFetch(`/posts/${postId}/like`, { method: 'POST' }).catch(() => {
      // Roll back on failure
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

  // Handle deleting a post — remove it from the list and update the post count
  function handleDelete(postId) {
    setPosts(prev => prev.filter(p => p.id !== postId))
    // Also decrease the post count shown in the profile header
    if (profile) {
      setProfile(prev => ({ ...prev, post_count: prev.post_count - 1 }))
    }
  }

  // Increment comment count when a new comment is added
  function handleCommentAdded(postId) {
    setPosts(prev =>
      prev.map(p => p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p)
    )
  }

  // Decrement comment count when a comment is deleted
  function handleCommentDeleted(postId) {
    setPosts(prev =>
      prev.map(p => p.id === postId ? { ...p, comment_count: p.comment_count - 1 } : p)
    )
  }

  return (
    <div className="feed-page">
      <Navbar />
      <main className="feed-content">
        {/* Show loading message */}
        {loading && <p className="feed-loading">Tending the garden…</p>}

        {/* Show error if something went wrong */}
        {error && <p className="feed-error">{error}</p>}

        {/* Show the profile once loaded */}
        {!loading && !error && profile && (
          <>
            {/* Profile header — avatar, name, stats */}
            <div className="profile-header">
              {/* Avatar circle with initials */}
              <div className="profile-avatar">
                {profile.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <h1 className="profile-name">{profile.full_name}</h1>

              {/* Stats row */}
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

            {/* Show a message if this user hasn't posted yet */}
            {posts.length === 0 ? (
              <p className="profile-empty">No notes planted yet.</p>
            ) : (
              // Show their posts
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
