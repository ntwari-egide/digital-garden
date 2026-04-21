import { Router } from 'express'
import { query } from '../db/postgres.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireAdmin)

// GET /admin/users — list all users
router.get('/users', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        u.id, u.full_name, u.email, u.role, u.created_at,
        COUNT(DISTINCT p.id)::int AS post_count,
        COUNT(DISTINCT c.id)::int AS comment_count
      FROM users u
      LEFT JOIN posts    p ON p.user_id = u.id
      LEFT JOIN comments c ON c.user_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// DELETE /admin/users/:id — delete a user and all their content
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params

  if (Number(id) === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own admin account' })
  }

  try {
    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id, full_name, email',
      [id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json({ message: 'User deleted', user: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

// PATCH /admin/users/:id/role — promote or demote a user
router.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body
  const { id } = req.params

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'role must be "user" or "admin"' })
  }
  if (Number(id) === req.user.id) {
    return res.status(400).json({ error: 'You cannot change your own role' })
  }

  try {
    const result = await query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, full_name, email, role',
      [role, id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role' })
  }
})

// DELETE /admin/posts/:id — delete any post
router.delete('/posts/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM posts WHERE id = $1 RETURNING id',
      [req.params.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' })
    }
    res.json({ message: 'Post deleted by admin' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post' })
  }
})

// DELETE /admin/comments/:id — delete any comment
router.delete('/comments/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM comments WHERE id = $1 RETURNING id',
      [req.params.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' })
    }
    res.json({ message: 'Comment deleted by admin' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete comment' })
  }
})

export default router
