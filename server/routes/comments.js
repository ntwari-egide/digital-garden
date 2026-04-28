// This file handles deleting comments
// Regular users can delete their own comments
// Admins can delete any comment

import { Router } from 'express'
import { query } from '../db/postgres.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

// DELETE /comments/:id — delete your own comment
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    // Only delete the comment if it belongs to the logged-in user
    // We check both the comment id AND the user id to be safe
    const result = await query(
      'DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    )

    // If nothing was deleted, the comment doesn't exist or belongs to someone else
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or not yours' })
    }

    res.json({ message: 'Comment deleted' })
  } catch (err) {
    console.log('Error deleting comment:', err)
    res.status(500).json({ error: 'Failed to delete comment' })
  }
})

// DELETE /comments/admin/:id — admin can delete any comment
router.delete('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Admin can delete any comment — no user_id check needed
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
