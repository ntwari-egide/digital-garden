// This file handles everything related to posts
// Creating posts, deleting posts, liking posts, and loading comments

import { Router } from 'express'
import { query } from '../db/postgres.js'
// requireAuth checks the user is logged in, requireAdmin checks they're an admin
import { requireAuth, requireAdmin } from '../middleware/auth.js'
// multer handles file uploads (images)
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
// fs lets us delete files from the server
import fs from 'fs'

// Get the current directory path (needed in ES modules)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// This is the folder where uploaded images will be saved
const uploadsDir = path.join(__dirname, '..', 'uploads')

// Set up multer storage — this controls where and how files get saved
const storage = multer.diskStorage({
  // Save all uploaded files to the uploads folder
  destination: (req, file, cb) => cb(null, uploadsDir),

  // Give each file a unique name so they don't overwrite each other
  // We use the current time + a random string + the original file extension
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})

// Configure multer with our storage, file size limit, and allowed file types
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5 MB per file
  fileFilter: (req, file, cb) => {
    // Only allow common image formats
    const allowed = /jpeg|jpg|png|gif|webp/
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  },
})

const router = Router()

// GET /posts — get all posts, newest first
// Optional ?tag= query param to filter by hashtag
router.get('/', async (req, res) => {
  try {
    // Get the tag from the URL query string (can be null if not provided)
    const tag = req.query.tag || null

    // This SQL query gets posts with their author, like count, and comment count
    // If a tag is given, we filter posts whose content contains that hashtag
    // The regex pattern checks for word boundaries around the hashtag
    const result = await query(`
      SELECT
        p.id, p.title, p.content, p.image_url, p.created_at,
        u.id   AS user_id,
        u.full_name,
        COUNT(DISTINCT l.id)::int AS like_count,
        COUNT(DISTINCT c.id)::int AS comment_count
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN likes    l ON l.post_id = p.id
      LEFT JOIN comments c ON c.post_id = p.id
      WHERE ($1::text IS NULL OR p.content ~* ('(^|[^a-zA-Z0-9_])#' || $1 || '([^a-zA-Z0-9_]|$)'))
      GROUP BY p.id, u.id
      ORDER BY p.created_at DESC
    `, [tag])

    res.json(result.rows)
  } catch (err) {
    console.log('Error fetching posts:', err)
    res.status(500).json({ error: 'Failed to fetch posts' })
  }
})

// POST /posts — create a new post (must be logged in)
// The image upload is optional — we use multer's single() to handle it
router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  // Get the content and title from the request
  const content = req.body.content || ''
  const title = req.body.title || null

  // Content is required
  if (!content || content.trim().length === 0) {
    // Delete the uploaded image if content is missing
    if (req.file) fs.unlinkSync(req.file.path)
    return res.status(400).json({ error: 'Content is required' })
  }

  // Content can't be longer than 2000 characters
  if (content.length > 2000) {
    if (req.file) fs.unlinkSync(req.file.path)
    return res.status(400).json({ error: 'Content must be 2000 characters or fewer' })
  }

  // If a file was uploaded, build the URL path for it
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null

  try {
    // Insert the new post into the database
    const result = await query(
      `INSERT INTO posts (user_id, title, content, image_url) VALUES ($1, $2, $3, $4)
       RETURNING id, title, content, image_url, created_at, user_id`,
      [req.user.id, title, content.trim(), imageUrl]
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    // If the database save fails, clean up the uploaded file
    if (req.file) fs.unlinkSync(req.file.path)
    console.log('Error creating post:', err)
    res.status(500).json({ error: 'Failed to create post' })
  }
})

// DELETE /posts/:id — delete your own post
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    // Only delete the post if it belongs to the logged-in user
    const result = await query(
      'DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING id, image_url',
      [req.params.id, req.user.id]
    )

    // If nothing was deleted, the post doesn't exist or belongs to someone else
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found or not yours' })
    }

    // If the post had an image, delete it from the server too
    const image_url = result.rows[0].image_url
    if (image_url) {
      const filePath = path.join(__dirname, '..', image_url)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }

    res.json({ message: 'Post deleted' })
  } catch (err) {
    console.log('Error deleting post:', err)
    res.status(500).json({ error: 'Failed to delete post' })
  }
})

// DELETE /posts/admin/:id — admin can delete any post
router.delete('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Delete the post by id — no user_id check since admins can delete any post
    const result = await query(
      'DELETE FROM posts WHERE id = $1 RETURNING id, image_url',
      [req.params.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' })
    }

    // Delete the image file too if there is one
    const image_url = result.rows[0].image_url
    if (image_url) {
      const filePath = path.join(__dirname, '..', image_url)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }

    res.json({ message: 'Post deleted by admin' })
  } catch (err) {
    console.log('Error deleting post as admin:', err)
    res.status(500).json({ error: 'Failed to delete post' })
  }
})

// GET /posts/:id/comments — get all comments for a post
router.get('/:id/comments', async (req, res) => {
  try {
    // Get comments with the author's name, ordered oldest first
    const result = await query(`
      SELECT c.id, c.content, c.created_at, c.parent_id,
             u.id AS user_id, u.full_name
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `, [req.params.id])

    res.json(result.rows)
  } catch (err) {
    console.log('Error fetching comments:', err)
    res.status(500).json({ error: 'Failed to fetch comments' })
  }
})

// POST /posts/:id/comments — add a comment to a post (must be logged in)
// parent_id can be set if this is a reply to another comment
router.post('/:id/comments', requireAuth, async (req, res) => {
  const content = req.body.content
  const parent_id = req.body.parent_id

  // Comment text is required
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Content is required' })
  }

  try {
    // Make sure the post actually exists before adding a comment to it
    const post = await query('SELECT id FROM posts WHERE id = $1', [req.params.id])
    if (post.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' })
    }

    // Insert the comment into the database
    const result = await query(
      `INSERT INTO comments (post_id, user_id, content, parent_id) VALUES ($1, $2, $3, $4)
       RETURNING id, content, created_at, post_id, user_id, parent_id`,
      [req.params.id, req.user.id, content.trim(), parent_id || null]
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.log('Error adding comment:', err)
    res.status(500).json({ error: 'Failed to add comment' })
  }
})

// POST /posts/:id/like — toggle a like on a post (must be logged in)
// If you already liked it, this removes the like. If not, it adds one.
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    // Check if this user already liked this post
    const existing = await query(
      'SELECT id FROM likes WHERE post_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )

    if (existing.rows.length > 0) {
      // User already liked it — remove the like
      await query('DELETE FROM likes WHERE post_id = $1 AND user_id = $2',
        [req.params.id, req.user.id])
      return res.json({ liked: false })
    }

    // User hasn't liked it yet — add the like
    await query('INSERT INTO likes (post_id, user_id) VALUES ($1, $2)',
      [req.params.id, req.user.id])
    res.json({ liked: true })
  } catch (err) {
    console.log('Error toggling like:', err)
    res.status(500).json({ error: 'Failed to toggle like' })
  }
})

// GET /posts/:id/likes — get the like count for a post
router.get('/:id/likes', async (req, res) => {
  try {
    // Count how many likes this post has
    const result = await query(
      'SELECT COUNT(*)::int AS like_count FROM likes WHERE post_id = $1',
      [req.params.id]
    )
    res.json(result.rows[0])
  } catch (err) {
    console.log('Error fetching likes:', err)
    res.status(500).json({ error: 'Failed to fetch likes' })
  }
})

export default router
