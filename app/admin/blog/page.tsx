'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { COVERS } from '../../../lib/blog'
import { readingMinutes } from '../../../lib/markdown'

// Not a tab inside /dashboard. Every other user's dashboard is untouched by
// the blog existing, and none of this code loads on their side of the app.
// The row level policies are the real lock; this page only decides what to
// draw. Someone who forced their way to the URL would see nothing and be able
// to save nothing.

type Post = {
  id: string
  slug: string
  title: string
  dek: string | null
  body_md: string
  category: string
  author_name: string
  meta_title: string | null
  meta_description: string | null
  cover_variant: number
  related_slugs: string[]
  faq: { q: string; a: string }[]
  status: string
  published_at: string | null
  updated_at: string
}

type Topic = {
  id: string; title: string; angle: string | null; category: string
  position: number; status: string
}

const EMPTY: Partial<Post> = {
  slug: '', title: '', dek: '', body_md: '', category: 'Getting started',
  author_name: 'Adam Hollis', meta_title: '', meta_description: '',
  cover_variant: 0, related_slugs: [], faq: [], status: 'draft', published_at: null,
}

// The Action runs Mondays and Fridays, so the queue's order is also a
// calendar. Working that out in your head every time was the alternative.
function draftDates(count: number): Date[] {
  const out: Date[] = []
  const d = new Date()
  d.setHours(7, 0, 0, 0)
  // A run due later today still counts; one that has already gone does not.
  if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1)
  let guard = 0
  while (out.length < count && guard++ < 400) {
    const day = d.getDay()
    if (day === 1 || day === 5) out.push(new Date(d.getTime()))
    d.setDate(d.getDate() + 1)
  }
  return out
}

function slugify(s: string) {
  return s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 80)
}

// datetime-local wants 'YYYY-MM-DDTHH:mm' in local time; the column is UTC.
function toLocalInput(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
    'T' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

export default function AdminBlog() {
  const [ready, setReady] = useState(false)
  const [allowed, setAllowed] = useState(false)
  const [signedInAs, setSignedInAs] = useState<string | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [editing, setEditing] = useState<Partial<Post> | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [when, setWhen] = useState('')

  useEffect(() => {
    // supabase-js restores the session from storage asynchronously, so a single
    // read on a cold load can come back empty on a browser that is in fact
    // signed in. The dashboard waits the same way.
    async function waitForSession() {
      const { data: first } = await supabase.auth.getSession()
      if (first.session) return first.session
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 200))
        const { data } = await supabase.auth.getSession()
        if (data.session) return data.session
      }
      return null
    }
    ;(async () => {
      const session = await waitForSession()
      if (!session) { setReady(true); return }
      setSignedInAs(session.user.email || '')
      const { data: admin } = await supabase
        .from('blog_admins').select('user_id').eq('user_id', session.user.id).maybeSingle()
      if (!admin) { setReady(true); return }
      setAllowed(true)
      await refresh()
      setReady(true)
    })()
  }, [])

  async function refresh() {
    const { data: p } = await supabase.from('posts').select('*').order('updated_at', { ascending: false })
    setPosts((p || []) as Post[])
    const { data: t } = await supabase.from('topics').select('*').order('position')
    setTopics((t || []) as Topic[])
  }

  async function push(slug: string) {
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session ? data.session.access_token : ''
      await fetch('/api/blog-revalidate', {
        method: 'POST',
        headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
        body: JSON.stringify({ slug }),
      })
    } catch (e) {}
  }

  function flash(text: string) {
    setMsg(text); setErr('')
    setTimeout(() => setMsg(''), 2600)
  }

  async function save(next?: Partial<Post>) {
    const row: any = Object.assign({}, editing, next || {})
    if (!row.title || !row.title.trim()) { setErr('A post needs a title.'); return }
    if (!row.slug) row.slug = slugify(row.title)
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(row.slug) || row.slug.length < 3) {
      setErr('The address can only be lowercase letters, numbers and hyphens.'); return
    }
    if (row.status === 'published' && !row.published_at) row.published_at = new Date().toISOString()

    setBusy(true); setErr('')
    const payload: any = {
      slug: row.slug, title: row.title, dek: row.dek || null, body_md: row.body_md || '',
      category: row.category || 'Getting started', author_name: row.author_name || 'Adam Hollis',
      meta_title: row.meta_title || null, meta_description: row.meta_description || null,
      cover_variant: Number(row.cover_variant) || 0,
      related_slugs: row.related_slugs || [], faq: row.faq || [],
      status: row.status || 'draft', published_at: row.published_at || null,
    }

    const res = row.id
      ? await supabase.from('posts').update(payload).eq('id', row.id).select('*').maybeSingle()
      : await supabase.from('posts').insert(payload).select('*').maybeSingle()

    setBusy(false)
    if (res.error) {
      setErr(res.error.message.indexOf('duplicate') >= 0 ? 'That address is already taken by another post.' : res.error.message)
      return
    }
    setEditing(res.data as any)
    await refresh()
    await push(payload.slug)
    flash('Saved.')
  }

  async function remove(p: Post) {
    if (!window.confirm('Delete "' + p.title + '"? This cannot be undone.')) return
    setBusy(true)
    const { error } = await supabase.from('posts').delete().eq('id', p.id)
    setBusy(false)
    if (error) { setErr(error.message); return }
    setEditing(null)
    await refresh(); await push(p.slug)
    flash('Deleted.')
  }

  if (!ready) return <main className="wrap" style={{ paddingTop: 60 }}><p>Loading…</p></main>

  // Two different problems used to look identical here, which cost an evening.
  // Not signed in is a thing the visitor can fix; signed in as the wrong
  // account is a thing they need told. Neither reveals that the page exists to
  // anyone who was not already signed in to Relay.
  if (!allowed) {
    return (
      <main style={{ background: 'var(--base)', minHeight: '100vh' }}>
        <div className="wrap" style={{ paddingTop: 80 }}>
          <div className="legal">
            {signedInAs ? (
              <>
                <h1>Not this account</h1>
                <p>
                  You are signed in as <strong>{signedInAs}</strong>, which does not have access
                  to the blog. Sign out and sign back in with the account that does.
                </p>
                <p>
                  <button
                    className="btn"
                    onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
                  >
                    Sign out
                  </button>
                </p>
              </>
            ) : (
              <>
                <h1>Sign in first</h1>
                <p>
                  This page needs a signed-in account. <a href="/login">Sign in</a>, then come
                  back to /admin/blog.
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    )
  }

  const drafts = posts.filter((p) => p.status !== 'published')
  const published = posts.filter((p) => p.status === 'published')

  return (
    <main style={{ background: 'var(--base)', minHeight: '100vh' }}>
      <div className="wrap" style={{ paddingTop: 24, paddingBottom: 80 }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
          <a href="/dashboard" style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.03em' }}>Relay</a>
          <div style={{ display: 'flex', gap: 10 }}>
            <a href="/blog" className="btn small ghost">View blog</a>
            <button className="btn small" onClick={() => { setEditing(Object.assign({}, EMPTY)); setErr(''); setWhen('') }}>New post</button>
          </div>
        </nav>

        {msg ? <p className="asave">{msg}</p> : null}
        {err ? <p className="aerr">{err}</p> : null}

        {editing ? (
          <div className="acard">
            <div className="arow">
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>
                {editing.id ? 'Editing' : 'New post'}
              </h2>
              <button className="btn small ghost" onClick={() => setEditing(null)}>Close</button>
            </div>

            <label className="alab">Title</label>
            <input
              className="ainp" value={editing.title || ''}
              onChange={(e) => {
                const t = e.target.value
                setEditing(Object.assign({}, editing, {
                  title: t,
                  slug: editing.id ? editing.slug : slugify(t),
                }))
              }}
            />

            <label className="alab">Address (relayme.bio/blog/…)</label>
            <input className="ainp" value={editing.slug || ''}
              onChange={(e) => setEditing(Object.assign({}, editing, { slug: slugify(e.target.value) }))} />
            {editing.id && editing.status === 'published' ? (
              <p className="ahint">Changing this on a published post breaks any link already shared.</p>
            ) : null}

            <label className="alab">Standfirst, the line under the headline</label>
            <input className="ainp" value={editing.dek || ''}
              onChange={(e) => setEditing(Object.assign({}, editing, { dek: e.target.value }))} />

            <div className="agrid">
              <div>
                <label className="alab">Category</label>
                <input className="ainp" value={editing.category || ''}
                  onChange={(e) => setEditing(Object.assign({}, editing, { category: e.target.value }))} />
              </div>
              <div>
                <label className="alab">Written by</label>
                <input className="ainp" value={editing.author_name || ''}
                  onChange={(e) => setEditing(Object.assign({}, editing, { author_name: e.target.value }))} />
              </div>
            </div>

            <label className="alab">Cover</label>
            <div className="aswatches">
              {COVERS.map((c, i) => (
                <button
                  key={i}
                  className={Number(editing.cover_variant) === i ? 'aswatch on' : 'aswatch'}
                  style={{ background: c.bg }}
                  onClick={() => setEditing(Object.assign({}, editing, { cover_variant: i }))}
                  aria-label={'Cover ' + (i + 1)}
                >
                  <span style={{ background: c.accent }} />
                  <span style={{ background: c.chip }} />
                </button>
              ))}
            </div>
            {editing.slug && editing.id ? (
              <img className="apreview" src={'/blog/' + editing.slug + '/cover'} alt="" width={1200} height={630} />
            ) : (
              <p className="ahint">The cover is drawn once the post is saved.</p>
            )}

            <label className="alab">
              The article, in Markdown. ## for a heading, **bold**, [text](link).
              {editing.body_md ? <span className="acount"> {readingMinutes(editing.body_md)} min read</span> : null}
            </label>
            <textarea className="ainp atext" rows={22} value={editing.body_md || ''}
              onChange={(e) => setEditing(Object.assign({}, editing, { body_md: e.target.value }))} />

            <div className="agrid">
              <div>
                <label className="alab">Search title</label>
                <input className="ainp" value={editing.meta_title || ''}
                  onChange={(e) => setEditing(Object.assign({}, editing, { meta_title: e.target.value }))} />
                <p className="ahint">{(editing.meta_title || '').length} characters. Google cuts around 60.</p>
              </div>
              <div>
                <label className="alab">Search description</label>
                <input className="ainp" value={editing.meta_description || ''}
                  onChange={(e) => setEditing(Object.assign({}, editing, { meta_description: e.target.value }))} />
                <p className="ahint">{(editing.meta_description || '').length} characters. Google cuts around 155.</p>
              </div>
            </div>

            <label className="alab">Questions shown at the foot of the post</label>
            {(editing.faq || []).map((f, i) => (
              <div key={i} className="afaq">
                <input className="ainp" placeholder="Question" value={f.q}
                  onChange={(e) => {
                    const next = (editing.faq || []).slice()
                    next[i] = { q: e.target.value, a: next[i].a }
                    setEditing(Object.assign({}, editing, { faq: next }))
                  }} />
                <textarea className="ainp" rows={2} placeholder="Answer" value={f.a}
                  onChange={(e) => {
                    const next = (editing.faq || []).slice()
                    next[i] = { q: next[i].q, a: e.target.value }
                    setEditing(Object.assign({}, editing, { faq: next }))
                  }} />
                <button className="btn small ghost" onClick={() => {
                  const next = (editing.faq || []).slice(); next.splice(i, 1)
                  setEditing(Object.assign({}, editing, { faq: next }))
                }}>Remove</button>
              </div>
            ))}
            <button className="btn small ghost" onClick={() =>
              setEditing(Object.assign({}, editing, { faq: (editing.faq || []).concat([{ q: '', a: '' }]) }))
            }>Add a question</button>

            <label className="alab" style={{ marginTop: 22 }}>Linked posts, addresses separated by commas</label>
            <input className="ainp" value={(editing.related_slugs || []).join(', ')}
              onChange={(e) => setEditing(Object.assign({}, editing, {
                related_slugs: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
              }))} />

            <div className="aactions">
              <button className="btn" disabled={busy} onClick={() => save()}>Save</button>

              {editing.status === 'published' ? (
                <>
                  <a className="btn small ghost" href={'/blog/' + editing.slug} target="_blank" rel="noopener">Open</a>
                  <button className="btn small ghost" disabled={busy}
                    onClick={() => save({ status: 'draft', published_at: null })}>
                    Take offline
                  </button>
                </>
              ) : (
                <>
                  <button className="btn small" disabled={busy}
                    onClick={() => save({ status: 'published', published_at: new Date().toISOString() })}>
                    Publish now
                  </button>
                  <span className="asched">
                    <input className="ainp" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
                    <button className="btn small ghost" disabled={busy || !when}
                      onClick={() => save({ status: 'published', published_at: new Date(when).toISOString() })}>
                      Publish then
                    </button>
                  </span>
                </>
              )}

              {editing.id ? (
                <button className="btn small ghost adanger" disabled={busy}
                  onClick={() => remove(editing as Post)}>Delete</button>
              ) : null}
            </div>
            <p className="ahint">
              A post set to publish in the future stays hidden until that moment arrives, with no
              job that has to run on time.
            </p>
          </div>
        ) : null}

        <h2 className="ahead">Drafts and scheduled ({drafts.length})</h2>
        {drafts.length ? drafts.map((p) => (
          <button key={p.id} className="arowcard" onClick={() => { setEditing(p); setErr(''); setWhen(toLocalInput(p.published_at)) }}>
            <span className="astat">{p.published_at ? 'Scheduled' : 'Draft'}</span>
            <span className="atitle">{p.title}</span>
            <span className="ameta">
              {p.category}
              {p.published_at ? ' · ' + new Date(p.published_at).toLocaleString('en-GB') : ''}
            </span>
          </button>
        )) : <p className="ahint">Nothing waiting.</p>}

        <h2 className="ahead">Published ({published.length})</h2>
        {published.map((p) => (
          <button key={p.id} className="arowcard" onClick={() => { setEditing(p); setErr(''); setWhen(toLocalInput(p.published_at)) }}>
            <span className="astat on">Live</span>
            <span className="atitle">{p.title}</span>
            <span className="ameta">
              {p.category} · {p.published_at ? new Date(p.published_at).toLocaleDateString('en-GB') : ''}
            </span>
          </button>
        ))}

        <h2 className="ahead">The queue</h2>
        <p className="ahint" style={{ marginTop: -6 }}>
          A draft is written every Monday and Friday morning and lands above, in Drafts,
          for you to read. Lower numbers go first, so changing a number changes the date.
        </p>
        {(() => {
          const waiting = topics.filter((t) => t.status === 'queued')
          const dates = draftDates(waiting.length)
          const due: any = {}
          waiting.forEach((t, i) => { due[t.id] = dates[i] })
          return topics.map((t) => (
          <div key={t.id} className="atopic">
            <input
              className="ainp anum" type="number" defaultValue={t.position}
              onBlur={async (e) => {
                const n = Number(e.target.value)
                if (!isFinite(n) || n === t.position) return
                await supabase.from('topics').update({ position: n }).eq('id', t.id)
                await refresh()
              }}
            />
            <span className="atopictitle">
              {t.title}
              {t.angle ? <em>{t.angle}</em> : null}
            </span>
            <span className="adue">
              {t.status === 'queued' && due[t.id]
                ? due[t.id].toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
                : ''}
            </span>
            <span className={t.status === 'queued' ? 'astat' : 'astat on'}>{t.status}</span>
          </div>
          ))
        })()}
      </div>
    </main>
  )
}
