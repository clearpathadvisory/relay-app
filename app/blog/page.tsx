import type { Metadata } from 'next'
import { Blob } from '../blob'
import { jsonLdScript } from '../../lib/jsonld'
import { listPosts, categoriesOf, formatDate, coverUrl, BLOG_BASE, Post } from '../../lib/blog'

// Fresh within five minutes of a publish, without a rebuild.
export const revalidate = 300

const DESC =
  'Writing for people trying to sell something online for the first time. What actually works, how long it takes, and what to ignore.'

export const metadata: Metadata = {
  title: 'The Relay blog',
  description: DESC,
  alternates: { canonical: BLOG_BASE + '/blog' },
  openGraph: { type: 'website', title: 'The Relay blog', description: DESC, url: BLOG_BASE + '/blog' },
}

function Card({ post, wide }: { post: Post; wide?: boolean }) {
  return (
    <a className={wide ? 'bcard bcard-wide' : 'bcard'} href={'/blog/' + post.slug}>
      <img className="bcover" src={coverUrl(post)} alt="" loading={wide ? 'eager' : 'lazy'} width={1200} height={630} />
      <div className="bcardbody">
        <p className="bmeta">
          <span className="bchip">{post.category}</span>
          <span>{formatDate(post.published_at)}</span>
        </p>
        <h2>{post.title}</h2>
        {post.dek ? <p className="bdek">{post.dek}</p> : null}
      </div>
    </a>
  )
}

export default async function BlogIndex({ searchParams }: { searchParams?: { category?: string } }) {
  const all = await listPosts()
  const categories = categoriesOf(all)
  const active = (searchParams && searchParams.category) || ''
  const posts = active ? all.filter((p) => p.category === active) : all

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'The Relay blog',
    description: DESC,
    url: BLOG_BASE + '/blog',
    publisher: { '@type': 'Organization', name: 'Relay', url: BLOG_BASE },
    blogPost: all.slice(0, 20).map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: BLOG_BASE + '/blog/' + p.slug,
      datePublished: p.published_at,
      author: { '@type': 'Person', name: p.author_name },
    })),
  }

  return (
    <main style={{ background: 'var(--base)', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <div className="wrap" style={{ paddingTop: 24, paddingBottom: 70 }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <a href="/" style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.03em' }}>Relay</a>
          <a href="/login" className="btn small">Sign in</a>
        </nav>

        <div className="legal" style={{ maxWidth: 760 }}>
          <p className="legalkicker">Blog</p>
          <h1>Selling something, for the first time</h1>
          <p className="legallede">
            Notes for people at the start of it. What works, how long it takes, and which of the
            things being sold to you are worth the money. No income promises, because nobody
            honest can make one.
          </p>
        </div>

        {categories.length > 1 ? (
          <div className="bfilters">
            <a className={active ? 'bfilter' : 'bfilter on'} href="/blog">Everything</a>
            {categories.map((c) => (
              <a key={c} className={active === c ? 'bfilter on' : 'bfilter'} href={'/blog?category=' + encodeURIComponent(c)}>
                {c}
              </a>
            ))}
          </div>
        ) : null}

        {posts.length ? (
          <div className="bgrid">
            {posts.map((p, i) => (
              <Card key={p.slug} post={p} wide={i === 0 && !active} />
            ))}
          </div>
        ) : (
          <div className="legalend" style={{ marginTop: 30 }}>
            <Blob size={84} />
            <p>Nothing here yet. The first pieces are being written.</p>
          </div>
        )}

        <footer className="legalfoot">
          <a href="/">Home</a>
          <a href="/vs-linktree">Compare</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <span>Relay is made by ClearPath Advisory.</span>
        </footer>
      </div>
    </main>
  )
}
