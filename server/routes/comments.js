import { Router } from 'express'
import { query } from '../db/postgres.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

// DELETE /comments/:id — user deletes their own comment
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or not yours' })
    }
    res.json({ message: 'Comment deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete comment' })
  }
})

// DELETE /comments/admin/:id — admin deletes any comment
router.delete('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
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
