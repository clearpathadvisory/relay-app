// A deliberately small Markdown renderer.
//
// The alternative was a dependency, and a dependency here would be parsing
// text that arrives from a model on a schedule with nobody watching. Every
// character is escaped before any tag is produced, so the only HTML that can
// reach the page is HTML this file wrote. It supports exactly what the drafts
// use: h2, h3, paragraphs, bold, italic, links, lists and blockquotes.

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// A link is allowed to be relative, https, or mailto. Anything else — most of
// all javascript: — becomes plain text rather than an anchor.
function safeHref(raw: string): string | null {
  const url = raw.trim()
  if (!url) return null
  if (url.charAt(0) === '/' || url.charAt(0) === '#') return url
  if (/^https?:\/\//i.test(url)) return url
  if (/^mailto:[^\s]+@[^\s]+$/i.test(url)) return url
  return null
}

// Runs on already-escaped text, so the tags below are the only ones present.
function inline(text: string): string {
  let out = esc(text)

  out = out.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, function (whole, label, href) {
    // esc() turned & into &amp; inside the URL too; put it back for the href.
    const clean = safeHref(String(href).replace(/&amp;/g, '&'))
    if (!clean) return label
    const external = /^https?:\/\//i.test(clean) && clean.indexOf('relayme.bio') < 0
    const rel = external ? ' rel="noopener nofollow" target="_blank"' : ''
    return '<a href="' + esc(clean) + '"' + rel + '>' + label + '</a>'
  })

  out = out.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  out = out.replace(/`([^`\n]+)`/g, '<code>$1</code>')
  return out
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
}

export type Heading = { level: number; text: string; id: string }

export function renderMarkdown(src: string): { html: string; headings: Heading[] } {
  const lines = (src || '').replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  const headings: Heading[] = []
  let para: string[] = []
  let list: string[] = []
  let quote: string[] = []

  function flushPara() {
    if (!para.length) return
    out.push('<p>' + inline(para.join(' ')) + '</p>')
    para = []
  }
  function flushList() {
    if (!list.length) return
    out.push('<ul>' + list.map((i) => '<li>' + inline(i) + '</li>').join('') + '</ul>')
    list = []
  }
  function flushQuote() {
    if (!quote.length) return
    out.push('<blockquote><p>' + inline(quote.join(' ')) + '</p></blockquote>')
    quote = []
  }
  function flushAll() { flushPara(); flushList(); flushQuote() }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) { flushAll(); continue }

    const h = /^(#{2,4})\s+(.*)$/.exec(trimmed)
    if (h) {
      flushAll()
      const level = h[1].length
      const text = h[2].trim()
      const id = slugifyHeading(text)
      headings.push({ level, text, id })
      out.push('<h' + level + ' id="' + esc(id) + '">' + inline(text) + '</h' + level + '>')
      continue
    }

    if (/^(-{3,}|\*{3,})$/.test(trimmed)) { flushAll(); out.push('<hr />'); continue }

    const li = /^[-*]\s+(.*)$/.exec(trimmed)
    if (li) { flushPara(); flushQuote(); list.push(li[1]); continue }

    const q = /^>\s?(.*)$/.exec(trimmed)
    if (q) { flushPara(); flushList(); quote.push(q[1]); continue }

    flushList(); flushQuote()
    para.push(trimmed)
  }

  flushAll()
  return { html: out.join('\n'), headings }
}

export function readingMinutes(src: string): number {
  const words = (src || '').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}

// The first paragraph, plain, for a card or a meta description fallback.
export function firstParagraph(src: string, max = 180): string {
  const lines = (src || '').replace(/\r\n/g, '\n').split('\n\n')
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()
    if (!t || t.charAt(0) === '#' || t.charAt(0) === '>' || t.charAt(0) === '-') continue
    const plain = t
      .replace(/\[([^\]\n]+)\]\([^)\s]+\)/g, '$1')
      .replace(/[*`]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    return plain.length > max ? plain.slice(0, max - 1).replace(/[\s,.;:]+$/, '') + '\u2026' : plain
  }
  return ''
}
