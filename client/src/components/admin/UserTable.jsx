import UserRow from './UserRow'

export default function UserTable({ users, onRoleChange, onDelete }) {
  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Posts</th>
          <th>Comments</th>
          <th>Role</th>
          <th></th>
        </tr>
      </thead>
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
