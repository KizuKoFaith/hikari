import { useState, useEffect, useRef } from 'react';
import InsertSeries from '@/util/InsertSeries'
import './page.css'

// ─── AniList Picker ──────────────────────────────────────────────────────────

interface AniListMedia {
  id: number
  title: { romaji: string; english: string | null; native: string }
  staff: { edges: { role: string; node: { name: { full: string } } }[] }
  studios: { nodes: { name: string }[] }
  genres: string[]
  startDate: { year: number | null; month: number | null; day: number | null }
  description: string | null
  status: string
}

const STATUS_MAP: Record<string, string> = {
  RELEASING: 'Releasing',
  FINISHED: 'Completed',
  HIATUS: 'Hiatus',
  CANCELLED: 'Cancelled',
  NOT_YET_RELEASED: 'Releasing',
}

const QUERY = `
query ($search: String) {
  Page(perPage: 10) {
    media(search: $search, type: MANGA, format: NOVEL) {
      id
      title { romaji english native }
      staff(perPage: 25) {
        edges {
          role
          node { name { full } }
        }
      }
      studios {
        nodes { name }
      }
      genres
      startDate { year month day }
      description(asHtml: false)
      status
    }
  }
}`

async function searchAniList(search: string): Promise<AniListMedia[]> {
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { search } }),
  })
  if (!res.ok) {
    console.error('[AniList] HTTP error', res.status, await res.text())
    return []
  }
  const json = await res.json()
  if (json.errors) {
    console.error('[AniList] GraphQL errors', json.errors)
    return []
  }
  console.log('[AniList] results', json?.data?.Page?.media)
  return json?.data?.Page?.media ?? []
}

function getRole(media: AniListMedia, role: string) {
  return (
    media.staff.edges.find(e =>
      e.role.toLowerCase().includes(role.toLowerCase())
    )?.node.name.full ?? ''
  )
}

interface AniListPickerProps {
  onSelect: (media: AniListMedia) => void
}

function AniListPicker({ onSelect }: AniListPickerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AniListMedia[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return }
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchAniList(query)
        setResults(data)
        setOpen(true)
      } finally {
        setLoading(false)
      }
    }, 400)
  }, [query])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const pick = (media: AniListMedia) => {
    onSelect(media)
    setQuery(media.title.romaji)
    setOpen(false)
  }

  return (
    <div className="picker-wrapper" ref={containerRef}>
      <div className="picker-label">
        <span className="picker-badge">ANILIST</span>
        <span>Search Light Novel to autofill</span>
      </div>
      <div className="picker-input-wrap">
        <svg className="picker-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          className="picker-input"
          type="text"
          placeholder="Search AniList light novels…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {loading && <span className="picker-spinner" />}
      </div>

      {open && results.length > 0 && (
        <ul className="picker-dropdown">
          {results.map(m => (
            <li key={m.id} className="picker-item" onClick={() => pick(m)}>
              <div className="picker-item-main">{m.title.romaji}</div>
              {m.title.english && (
                <div className="picker-item-sub">{m.title.english}</div>
              )}
            </li>
          ))}
        </ul>
      )}
      {open && results.length === 0 && !loading && (
        <div className="picker-empty">No results found</div>
      )}
    </div>
  )
}

// ─── Main Form ────────────────────────────────────────────────────────────────

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleAniListSelect = (media: AniListMedia) => {
    const author = getRole(media, 'Story') || getRole(media, 'Author') || getRole(media, 'Original')
    const artist = getRole(media, 'Art') || getRole(media, 'Character')

    // Build ISO date string (YYYY-MM-DD) only when all parts are present
    let published_at = ''
    const { year, month, day } = media.startDate
    if (year && month && day) {
      published_at = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }

    // Strip HTML tags from description
    const description = media.description
      ? media.description.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').trim()
      : ''

    setForm(prev => ({
      ...prev,
      title_jp: media.title.romaji || media.title.native,
      title_en: media.title.english ?? media.title.romaji,
      status: STATUS_MAP[media.status] ?? 'Releasing',
      type: 'Light Novel',
      author,
      artist,
      publisher: media.studios?.nodes?.[0]?.name ?? '',
      genres: media.genres.join(', '),
      published_at,
      description,
    }))
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

          {/* ── AniList Picker ── */}
          <AniListPicker onSelect={handleAniListSelect} />

          <div className="form-divider">
            <span>or fill manually</span>
          </div>

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
