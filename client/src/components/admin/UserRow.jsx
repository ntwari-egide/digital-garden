// This component renders a single row in the admin users table
// It shows the user's info and lets admins change their role or delete them

import { apiFetch } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

// targetUser = the user this row is for
// currentUser (from useAuth) = the logged-in admin
export default function UserRow({ user: targetUser, onRoleChange, onDelete }) {
  // Get the currently logged-in admin user
  const { user: currentUser } = useAuth()

  // Check if this row is for the currently logged-in admin
  // Admins can't delete or change the role of their own account
  var isSelf = false
  if (currentUser != null && currentUser.id === targetUser.id) {
    isSelf = true
  }

  // Handle changing a user's role from the dropdown
  async function handleRoleChange(e) {
    const newRole = e.target.value
    try {
      // Send the role change to the server
      await apiFetch(`/admin/users/${targetUser.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      })
      // Tell the parent component to update the role in state
      onRoleChange(targetUser.id, newRole)
    } catch (err) {
      console.error('Role change failed:', err.message)
    }
  }

  // Handle clicking the Delete button
  async function handleDelete() {
    // Ask for confirmation before deleting
    if (!window.confirm(`Delete user "${targetUser.full_name}"? This will remove all their posts and comments.`)) return
    try {
      // Send the delete request to the server
      await apiFetch(`/admin/users/${targetUser.id}`, { method: 'DELETE' })
      // Tell the parent component to remove this user from the list
      onDelete(targetUser.id)
    } catch (err) {
      console.error('Delete user failed:', err.message)
    }
  }

  return (
    <tr>
      <td>{targetUser.full_name}</td>
      <td>{targetUser.email}</td>
      <td>{targetUser.post_count ?? 0}</td>
      <td>{targetUser.comment_count ?? 0}</td>
      <td>
        {/* If this row is the admin themselves, just show the role as text */}
        {isSelf
          ? <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{targetUser.role}</span>
          : (
            // Otherwise show a dropdown to change the role
            <select className="role-select" value={targetUser.role} onChange={handleRoleChange}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          )
        }
      </td>
      <td>
        {/* Only show the Delete button for other users, not for the admin themselves */}
        {!isSelf && (
          <button className="btn-danger" onClick={handleDelete}>Delete</button>
        )}
      </td>
    </tr>
  )
}
