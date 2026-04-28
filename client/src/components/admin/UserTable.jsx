// This component renders the admin user table
// It shows a list of all users with their stats and action buttons

import UserRow from './UserRow'

export default function UserTable({ users, onRoleChange, onDelete }) {
  return (
    <table className="admin-table">
      {/* Table header row */}
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Posts</th>
          <th>Comments</th>
          <th>Role</th>
          <th></th> {/* Delete button column — no header label */}
        </tr>
      </thead>

      {/* Render one row per user */}
      <tbody>
        {users.map(user => (
          <UserRow
            key={user.id}
            user={user}
            onRoleChange={onRoleChange}
            onDelete={onDelete}
          />
        ))}
      </tbody>
    </table>
  )
}
