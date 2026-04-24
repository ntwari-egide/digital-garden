import { apiFetch } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

export default function UserRow({ user: targetUser, onRoleChange, onDelete }) {
  const { user: currentUser } = useAuth()
  const isSelf = currentUser?.id === targetUser.id

  async function handleRoleChange(e) {
    const newRole = e.target.value
    try {
      await apiFetch(`/admin/users/${targetUser.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      })
      onRoleChange(targetUser.id, newRole)
    } catch (err) {
      console.error('Role change failed:', err.message)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete user "${targetUser.full_name}"? This will remove all their posts and comments.`)) return
    try {
      await apiFetch(`/admin/users/${targetUser.id}`, { method: 'DELETE' })
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
        {isSelf
          ? <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{targetUser.role}</span>
          : (
            <select className="role-select" value={targetUser.role} onChange={handleRoleChange}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          )
        }
      </td>
      <td>
        {!isSelf && (
          <button className="btn-danger" onClick={handleDelete}>Delete</button>
        )}
      </td>
    </tr>
  )
}
