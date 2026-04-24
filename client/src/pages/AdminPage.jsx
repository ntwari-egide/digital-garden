import { useState, useEffect } from 'react'
import { apiFetch } from '../api/client'
import Navbar from '../components/layout/Navbar'
import UserTable from '../components/admin/UserTable'
import '../styles/admin.css'
import '../styles/post.css'

function formatTime(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminPage() {
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

  function handleRoleChange(userId, newRole) {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
  }

  function handleDeleteUser(userId) {
    setUsers(prev => prev.filter(u => u.id !== userId))
    setPosts(prev => prev.filter(p => p.user_id !== userId))
  }

  async function handleDeletePost(postId) {
    if (!window.confirm('Delete this post? This cannot be undone.')) return
    try {
      await apiFetch(`/admin/posts/${postId}`, { method: 'DELETE' })
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

        {loading
          ? <p className="admin-loading">Loading…</p>
          : (
            <>
              <section className="admin-section">
                <h3>Users ({users.length})</h3>
                <UserTable
                  users={users}
                  onRoleChange={handleRoleChange}
                  onDelete={handleDeleteUser}
                />
              </section>

              <section className="admin-section">
                <h3>All Posts ({posts.length})</h3>
                <div className="admin-posts-list">
                  {posts.map(post => (
                    <div key={post.id} className="admin-post-row">
                      <div style={{ flex: 1 }}>
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
