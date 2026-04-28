// This is the form for creating a new post
// It has a title input, content textarea, image upload, and character counter

import { useState, useRef } from 'react'
// Icons for the attach and remove buttons
import { ImagePlus, X } from 'lucide-react'
import { apiFetch } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

// Maximum characters allowed in the post content
const MAX = 2000

export default function PostForm({ onPostCreated }) {
  // The optional post title
  const [title, setTitle] = useState('')

  // The required post content
  const [content, setContent] = useState('')

  // The selected image file (or null if none)
  const [image, setImage] = useState(null)

  // A temporary URL to preview the selected image before uploading
  const [preview, setPreview] = useState(null)

  // True while the form is being submitted
  const [loading, setLoading] = useState(false)

  // Error message to show if something goes wrong
  const [error, setError] = useState('')

  // Reference to the hidden file input — used to open the file picker
  const fileInputRef = useRef(null)

  // Get the current user (needed to attach their name to the new post)
  const { user } = useAuth()

  // Calculate how many characters are left
  const remaining = MAX - content.length

  // Pick a CSS class based on how many characters are left
  let counterClass = 'char-counter'
  if (remaining <= 100 && remaining > 0) counterClass += ' char-counter--warning'  // getting close
  if (remaining <= 0) counterClass += ' char-counter--danger'  // over the limit

  // Called when the user selects an image file
  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    // Save the file and create a preview URL for it
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  // Called when the user clicks the X button on the image preview
  function removeImage() {
    setImage(null)
    setPreview(null)
    // Clear the file input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Called when the form is submitted
  async function handleSubmit(e) {
    e.preventDefault()  // prevent page refresh

    // Don't submit if content is empty or too long
    if (!content.trim() || content.length > MAX) return

    setError('')
    setLoading(true)

    try {
      // Use FormData so we can include the image file in the request
      const form = new FormData()
      form.append('title', title)
      form.append('content', content)
      if (image) form.append('image', image)

      // Send the new post to the server
      const newPost = await apiFetch('/posts', { method: 'POST', body: form })

      // Tell the parent component about the new post
      // We add extra fields since the server response doesn't include them
      onPostCreated({ ...newPost, full_name: user.full_name, like_count: 0, comment_count: 0 })

      // Clear the form
      setTitle('')
      setContent('')
      removeImage()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="post-form" onSubmit={handleSubmit}>
      {/* Optional title input */}
      <input
        type="text"
        className="note-title-input"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Note title (optional)"
        maxLength={255}
      />

      {/* Main content textarea */}
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="What are you thinking about today?"
        maxLength={MAX + 50}
      />

      {/* Image preview — shown after the user selects a file */}
      {preview && (
        <div className="post-form-preview">
          <img src={preview} alt="preview" />
          {/* Button to remove the selected image */}
          <button type="button" className="preview-remove" onClick={removeImage}>
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Error message */}
      {error && <p className="error-msg">{error}</p>}

      {/* Bottom row: attach image button + character counter + submit */}
      <div className="post-form-footer">
        <div className="post-form-left">
          {/* Click this button to open the file picker */}
          <button
            type="button"
            className="attach-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Attach image"
          >
            <ImagePlus size={18} strokeWidth={1.75} />
          </button>

          {/* Hidden file input — triggered by the attach button above */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />

          {/* Character counter — turns red when too long */}
          <span className={counterClass}>{remaining}</span>
        </div>

        {/* Submit button — disabled while loading or if content is invalid */}
        <button
          type="submit"
          className="btn-primary"
          disabled={loading || !content.trim() || content.length > MAX}
        >
          {loading ? 'Planting…' : 'Plant note'}
        </button>
      </div>
    </form>
  )
}
