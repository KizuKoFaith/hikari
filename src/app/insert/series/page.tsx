import { useState } from 'react';
import InsertSeries from '@/util/InsertSeries'
import './page.css'

const SeriesForm = () => {
  const [form, setForm] = useState({
    title_jp: '',
    title_en: '',
    cover_url: '',
    status: 'Releasing',
    type: 'Light Novel',
    author: '',
    artist: '',
    publisher: '',
    genres: '',
    published_at: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    setLoading(true)
    setMessage(null)
    try {
      await InsertSeries({
        title_jp: form.title_jp,
        title_en: form.title_en || undefined,
        cover_url: form.cover_url,
        status: form.status || undefined,
        type: form.type || undefined,
        author: form.author || undefined,
        artist: form.artist || undefined,
        publisher: form.publisher || undefined,
        genres: form.genres ? form.genres.split(',').map(g => g.trim()) : [],
        published_at: form.published_at || undefined,
        description: form.description || undefined,
      })
      setMessage({ text: '✓ Series inserted successfully!', ok: true })
      setForm({
        title_jp: '', title_en: '', cover_url: '', status: 'Releasing',
        type: 'Light Novel', author: '', artist: '', publisher: '',
        genres: '', published_at: '', description: '',
      })
    } catch (err: any) {
      setMessage({ text: err.message, ok: false })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-page">
      <div className="form-card">
        <div className="form-header">
          <span className="form-tag">CATALOG</span>
          <h1 className="form-title">Insert Series</h1>
          <p className="form-subtitle">Add a new series to the database</p>
        </div>

        <div className="form-body">
          <div className="form-row">
            <div className="form-group">
              <label>Title (Japanese) <span className="required">*</span></label>
              <input name="title_jp" type="text" placeholder="日本語タイトル" value={form.title_jp} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Title (English)</label>
              <input name="title_en" type="text" placeholder="English title" value={form.title_en} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Cover URL <span className="required">*</span></label>
            <input name="cover_url" type="text" placeholder="https://..." value={form.cover_url} onChange={handleChange} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                <option>Releasing</option>
                <option>Completed</option>
                <option>Hiatus</option>
                <option>Cancelled</option>
              </select>
            </div>
            <div className="form-group">
              <label>Type</label>
              <select name="type" value={form.type} onChange={handleChange}>
                <option>Light Novel</option>
                <option>Web Novel</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Author</label>
              <input name="author" type="text" placeholder="Author name" value={form.author} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Artist</label>
              <input name="artist" type="text" placeholder="Artist name" value={form.artist} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Publisher</label>
              <input name="publisher" type="text" placeholder="Publisher name" value={form.publisher} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Published Date</label>
              <input name="published_at" type="date" value={form.published_at} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Genres <span className="hint">(comma separated)</span></label>
            <input name="genres" type="text" placeholder="Action, Romance, Fantasy..." value={form.genres} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" placeholder="Series description..." value={form.description} onChange={handleChange} rows={4} />
          </div>

          {message && (
            <div className={`form-message ${message.ok ? 'success' : 'error'}`}>
              {message.text}
            </div>
          )}

          <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Insert Series'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SeriesForm