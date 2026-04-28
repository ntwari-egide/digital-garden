// This is the admin dashboard page
// Only admins can access this — ProtectedRoute handles that check
// It shows all users and all posts, with options to delete them

import { useState, useEffect } from 'react'
import { apiFetch } from '../api/client'
import Navbar from '../components/layout/Navbar'
import UserTable from '../components/admin/UserTable'
import '../styles/admin.css'
import '../styles/post.css'

// Format a date like "Apr 28, 2026"
function formatTime(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminPage() {
  // List of all users
  const [users, setUsers] = useState([])

  // List of all posts
  const [posts, setPosts] = useState([])

  // True while data is loading
  const [loading, setLoading] = useState(true)

  // Load users and posts when the page first renders
  useEffect(() => {
    // Fetch both at the same time for speed
    Promise.all([
      apiFetch('/admin/users'),
      apiFetch('/posts'),
    ])
      .then(([usersData, postsData]) => {
        setUsers(usersData || [])
        setPosts(postsData || [])
      })
      .catch(err => console.error('Admin load failed:', err.message))
      .finally(() => setLoading(false))
  }, [])

  // Called when an admin changes a user's role from the dropdown
  function handleRoleChange(userId, newRole) {
    // Update the role in the local state so the UI reflects the change
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
  }

  // Called when an admin deletes a user
  function handleDeleteUser(userId) {
    // Remove the user from the list
    setUsers(prev => prev.filter(u => u.id !== userId))
    // Also remove all posts by that user
    setPosts(prev => prev.filter(p => p.user_id !== userId))
  }

  // Called when an admin clicks Delete on a post
  async function handleDeletePost(postId) {
    // Ask for confirmation before deleting
    if (!window.confirm('Delete this post? This cannot be undone.')) return

    try {
      // Send the delete request to the server
      await apiFetch(`/admin/posts/${postId}`, { method: 'DELETE' })
      // Remove the post from the local list
      setPosts(prev => prev.filter(p => p.id !== postId))
    } catch (err) {
      console.error('Delete post failed:', err.message)
    }
  }

  return (
    <div className="admin-page">
      <Navbar />
      <main className="admin-content">
        <h2>Admin Dashboard</h2>

        {/* Show loading or the dashboard content */}
        {loading
          ? <p className="admin-loading">Loading…</p>
          : (
            <>
              {/* Users section */}
              <section className="admin-section">
                <h3>Users ({users.length})</h3>
                <UserTable
                  users={users}
                  onRoleChange={handleRoleChange}
                  onDelete={handleDeleteUser}
                />
              </section>

              {/* Posts section */}
              <section className="admin-section">
                <h3>All Posts ({posts.length})</h3>
                <div className="admin-posts-list">
                  {/* Render each post with a delete button */}
                  {posts.map(post => (
                    <div key={post.id} className="admin-post-row">
                      <div style={{ flex: 1 }}>
                        {/* Show who posted it and when */}
                        <p className="admin-post-meta">{post.full_name} · {formatTime(post.created_at)}</p>
                        <p>{post.content}</p>
                      </div>
                      <button className="btn-danger" onClick={() => handleDeletePost(post.id)}>Delete</button>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )
        }
      </main>
    </div>
  )
}
