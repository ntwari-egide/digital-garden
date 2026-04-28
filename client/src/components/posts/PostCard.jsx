// This component displays a single post card
// It shows the post content, author, like button, and comment section toggle

import { useState } from 'react'
import { Link } from 'react-router-dom'
// Icons for the like and comment buttons
import { Leaf, MessageCircle, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../api/client'
import CommentSection from '../comments/CommentSection'

// The base URL for loading images — needs to match where the server runs
const API_BASE = 'http://localhost:3000'

// Format a date string like "April 28, 2026"
function formatTime(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

// Get initials from a full name (e.g. "John Doe" -> "JD")
function initials(name = '') {
  // Split by spaces, take first letter of each word
  var words = name.split(' ')
  var letters = words.map(w => w[0])
  return letters.join('').slice(0, 2).toUpperCase()
}

// Find all hashtags in the post content and return them without the #
// Example: "I love #coding and #react" -> ["coding", "react"]
function parseTags(content = '') {
  const tags = content.match(/#([a-zA-Z0-9_]+)/g) || []
  // Remove duplicates using a Set, and strip the leading #
  return [...new Set(tags.map(t => t.slice(1)))]
}

// Render post content with hashtags as clickable links
function renderContent(content = '') {
  // Split the content at every hashtag, keeping the hashtags as separate pieces
  const parts = content.split(/(#[a-zA-Z0-9_]+)/g)

  // For each piece, if it's a hashtag make it a link, otherwise just return the text
  return parts.map((part, i) => {
    if (/^#[a-zA-Z0-9_]+$/.test(part)) {
      // This piece is a hashtag — wrap it in a link
      const tag = part.slice(1)
      return <Link key={i} to={`/tag/${tag}`} className="content-tag">{part}</Link>
    }
    // Regular text — just return it
    return part
  })
}

export default function PostCard({ post, liked, onLikeToggle, onDelete, onCommentAdded, onCommentDeleted }) {
  // Get the current logged-in user
  const { user } = useAuth()

  // Whether the comment section is visible
  const [commentsOpen, setCommentsOpen] = useState(false)

  // Check if the logged-in user is the post's author
  var isOwner = false
  if (user != null && user.id === post.user_id) {
    isOwner = true
  }

  // Check if the logged-in user is an admin
  var isAdmin = false
  if (user != null && user.role === 'admin') {
    isAdmin = true
  }

  // Get all hashtags from the post content
  const tags = parseTags(post.content)

  // Handle clicking the delete button
  async function handleDelete() {
    // Ask for confirmation before deleting
    if (!window.confirm('Remove this note from the garden? This cannot be undone.')) return

    try {
      // Admins use a different endpoint than regular users
      var endpoint
      if (isAdmin && !isOwner) {
        endpoint = `/admin/posts/${post.id}`
      } else {
        endpoint = `/posts/${post.id}`
      }

      await apiFetch(endpoint, { method: 'DELETE' })
      // Tell the parent component to remove this post from the list
      onDelete(post.id)
    } catch (err) {
      console.error('Delete failed:', err.message)
    }
  }

  return (
    <article className="post-card">
      {/* Show the post title if it has one */}
      {post.title && <h3 className="note-title">{post.title}</h3>}

      {/* Author info row */}
      <div className="post-meta">
        {/* Avatar circle with the author's initials */}
        <div className="post-avatar" aria-hidden="true">{initials(post.full_name)}</div>
        <div className="post-meta-text">
          {/* Author name links to their profile */}
          <Link to={`/profile/${post.user_id}`} className="post-author">{post.full_name}</Link>
          <span className="post-time">{formatTime(post.created_at)}</span>
        </div>
        {/* Show the delete button only to the post owner or an admin */}
        {(isOwner || isAdmin) && (
          <button className="delete-post-btn" onClick={handleDelete} title="Remove note">
            <Trash2 size={14} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Post body — hashtags are rendered as clickable links */}
      <p className="post-content">{renderContent(post.content)}</p>

      {/* Show the attached image if there is one */}
      {post.image_url && (
        <div className="post-image-wrap">
          <img src={`${API_BASE}${post.image_url}`} alt="note attachment" className="post-image" />
        </div>
      )}

      {/* Hashtag pills at the bottom of the post */}
      {tags.length > 0 && (
        <div className="note-tags">
          {tags.map(tag => (
            <Link key={tag} to={`/tag/${tag}`} className="note-tag">#{tag}</Link>
          ))}
        </div>
      )}

      {/* Like and comment buttons */}
      <div className="post-actions">
        {/* Like button — fills in when liked */}
        <button
          className={`like-btn${liked ? ' like-btn--active' : ''}`}
          onClick={() => onLikeToggle(post.id, liked)}
          title="This resonated with me"
        >
          <Leaf size={14} strokeWidth={2} fill={liked ? 'currentColor' : 'none'} />
          {/* Only show the count if it's greater than 0 */}
          {post.like_count > 0 && <span className="like-label">{post.like_count}</span>}
          <span className="like-text">Resonated</span>
        </button>

        {/* Comment toggle button — shows/hides the comment section */}
        <button
          className={`comment-toggle-btn${commentsOpen ? ' comment-toggle-btn--active' : ''}`}
          onClick={() => setCommentsOpen(o => !o)}
        >
          <MessageCircle size={14} strokeWidth={2} />
          {post.comment_count} {commentsOpen ? 'Hide' : 'Responses'}
        </button>
      </div>

      {/* Show the comment section when the button is clicked */}
      {commentsOpen && (
        <CommentSection
          postId={post.id}
          onCommentAdded={() => onCommentAdded(post.id)}
          onCommentDeleted={() => onCommentDeleted(post.id)}
        />
      )}
    </article>
  )
}
