// This file handles the admin dashboard routes
// All routes here require the user to be logged in AND be an admin

import { Router } from 'express'
import { query } from '../db/postgres.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

// Apply auth and admin check to every route in this file
// This means we don't have to add requireAuth and requireAdmin to every single route
router.use(requireAuth, requireAdmin)

// GET /admin/users — get a list of all users with their stats
router.get('/users', async (req, res) => {
  try {
    // Get all users, their roles, and how many posts/comments they've made
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
    console.log('Error fetching users for admin:', err)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// DELETE /admin/users/:id — delete a user and all their content
router.delete('/users/:id', async (req, res) => {
  const id = req.params.id

  // Admins can't delete their own account
  if (Number(id) === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own admin account' })
  }

  try {
    // Delete the user — their posts and comments are removed automatically by the database
    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id, full_name, email',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ message: 'User deleted', user: result.rows[0] })
  } catch (err) {
    console.log('Error deleting user:', err)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

// PATCH /admin/users/:id/role — change a user's role (promote to admin or demote to user)
router.patch('/users/:id/role', async (req, res) => {
  const role = req.body.role
  const id = req.params.id

  // Role must be either "user" or "admin"
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'role must be "user" or "admin"' })
  }

  // Admins can't change their own role
  if (Number(id) === req.user.id) {
    return res.status(400).json({ error: 'You cannot change your own role' })
  }

  try {
    // Update the user's role in the database
    const result = await query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, full_name, email, role',
      [role, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.log('Error updating role:', err)
    res.status(500).json({ error: 'Failed to update role' })
  }
})

// DELETE /admin/posts/:id — admin can delete any post
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
    console.log('Error deleting post as admin:', err)
    res.status(500).json({ error: 'Failed to delete post' })
  }
})

// DELETE /admin/comments/:id — admin can delete any comment
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
    console.log('Error deleting comment as admin:', err)
    res.status(500).json({ error: 'Failed to delete comment' })
  }
})

export default router
