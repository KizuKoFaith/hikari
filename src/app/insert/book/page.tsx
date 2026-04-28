import React, { useEffect, useRef, useState } from 'react'
import InsertBook from '@/util/InsertBook'
import supabase from '@/client/SupabaseClient'
import './page.css'

interface Series {
  id: number
  title_en: string
  title_jp: string
  cover_url: string
}

const BookForm = () => {
  const [form, setForm] = useState({
    series_id: '',
    series_label: '',
    title_en: '',
    cover_url: '',
    published_at: '',
    link_url: '',
    synopsis: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [seriesList, setSeriesList] = useState<Series[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [search, setSearch] = useState('')
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchSeries = async () => {
      const { data } = await supabase
        .from('series')
        .select('id, title_en, title_jp, cover_url')
        .order('id')
      if (data) setSeriesList(data)
    }
    fetchSeries()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false)
      }
    }
    if (showPicker) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPicker])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSelectSeries = (series: Series) => {
    setForm({ ...form, series_id: String(series.id), series_label: `#${series.id} — ${series.title_en || series.title_jp}` })
    setShowPicker(false)
    setSearch('')
  }

  const filtered = seriesList.filter(s =>
    (s.title_en + s.title_jp).toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async () => {
    setLoading(true)
    setMessage(null)
    try {
      await InsertBook({
        series_id: Number(form.series_id),
        title_en: form.title_en,
        cover_url: form.cover_url,
        published_at: form.published_at || undefined,
        link_url: form.link_url,
        synopsis: form.synopsis || undefined,
      })
      setMessage({ text: '✓ Book inserted successfully!', ok: true })
      setForm({ series_id: '', series_label: '', title_en: '', cover_url: '', published_at: '', link_url: '', synopsis: '' })
    } catch (err: any) {
      setMessage({ text: `✗ ${err.message}`, ok: false })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-page">
      <div className="form-card">
        <div className="form-header">
          <span className="form-tag">CATALOG</span>
          <h1 className="form-title">Insert Book</h1>
          <p className="form-subtitle">Add a new book volume to the database</p>
        </div>

        <div className="form-body">

          {/* Series Picker */}
          <div className="form-group" ref={pickerRef}>
            <label>Series <span className="required">*</span></label>
            <div
              className={`series-trigger ${showPicker ? 'active' : ''}`}
              onClick={() => setShowPicker(v => !v)}
            >
              {form.series_label || <span className="placeholder">Select a series...</span>}
              <span className="trigger-arrow">▾</span>
            </div>

            {showPicker && (
              <div className="series-picker">
                <div className="picker-search-wrap">
                  <input
                    className="picker-search"
                    type="text"
                    placeholder="Search series..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="picker-list">
                  {filtered.length === 0 && (
                    <div className="picker-empty">No series found</div>
                  )}
                  {filtered.map(s => (
                    <div key={s.id} className="picker-item" onClick={() => handleSelectSeries(s)}>
                      <img
                        className="picker-cover"
                        src={s.cover_url}
                        alt={s.title_en || s.title_jp}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                      <div className="picker-info">
                        <span className="picker-title">{s.title_en || s.title_jp}</span>
                        {s.title_en && s.title_jp && (
                          <span className="picker-sub">{s.title_jp}</span>
                        )}
                      </div>
                      <span className="picker-id">#{s.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Title (English) <span className="required">*</span></label>
            <input name="title_en" type="text" placeholder="Volume title" value={form.title_en} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Cover URL <span className="required">*</span></label>
            <input name="cover_url" type="text" placeholder="https://..." value={form.cover_url} onChange={handleChange} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Published Date</label>
              <input name="published_at" type="date" value={form.published_at} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Link URL <span className="required">*</span></label>
              <input name="link_url" type="text" placeholder="https://..." value={form.link_url} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Synopsis</label>
            <textarea name="synopsis" placeholder="Book synopsis..." value={form.synopsis} onChange={handleChange} rows={4} />
          </div>

          {message && (
            <div className={`form-message ${message.ok ? 'success' : 'error'}`}>
              {message.text}
            </div>
          )}

          <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Insert Book'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookForm