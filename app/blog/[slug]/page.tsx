import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Blob } from '../../blob'
import { jsonLdScript } from '../../../lib/jsonld'
import { renderMarkdown, readingMinutes, firstParagraph } from '../../../lib/markdown'
import { getPost, getPostsBySlugs, listPosts, formatDate, coverUrl, BLOG_BASE } from '../../../lib/blog'

export const revalidate = 300

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug)
  if (!post) return { title: 'Not found' }

  const url = BLOG_BASE + '/blog/' + post.slug
  const description = post.meta_description || post.dek || firstParagraph(post.body_md)
  const image = coverUrl(post)

  return {
    title: post.meta_title || post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: post.meta_title || post.title,
      description,
      url,
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at,
      authors: [post.author_name],
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title: post.meta_title || post.title, description, images: [image] },
  }
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  if (!post) notFound()

  const { html, headings } = renderMarkdown(post.body_md)
  const minutes = readingMinutes(post.body_md)
  const url = BLOG_BASE + '/blog/' + post.slug
  const description = post.meta_description || post.dek || firstParagraph(post.body_md)

  // Related first, then whatever else is recent, so the foot of a post is never
  // empty on a blog that is still small.
  const picked = await getPostsBySlugs(post.related_slugs || [])
  let related = picked.filter((p) => p.slug !== post.slug)
  if (related.length < 2) {
    const recent = await listPosts(6)
    recent.forEach((p) => {
      if (p.slug !== post.slug && related.filter((r) => r.slug === p.slug).length === 0 && related.length < 3) {
        related = related.concat([p])
      }
    })
  }

  const graph: any[] = [
    {
      '@type': 'BlogPosting',
      headline: post.title,
      description,
      image: [coverUrl(post)],
      datePublished: post.published_at,
      dateModified: post.updated_at,
      author: { '@type': 'Person', name: post.author_name },
      publisher: { '@type': 'Organization', name: 'Relay', url: BLOG_BASE },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      articleSection: post.category,
      wordCount: (post.body_md || '').split(/\s+/).filter(Boolean).length,
      inLanguage: 'en-GB',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Blog', item: BLOG_BASE + '/blog' },
        { '@type': 'ListItem', position: 2, name: post.title, item: url },
      ],
    },
  ]

  // Only emitted when the questions are on the page, because structured data
  // that does not match what a reader sees is a manual action waiting to happen.
  const faqs = Array.isArray(post.faq) ? post.faq.filter((f: any) => f && f.q && f.a) : []
  if (faqs.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    })
  }

  return (
    <main style={{ background: 'var(--base)', minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript({ '@context': 'https://schema.org', '@graph': graph }) }}
      />
      <div className="wrap" style={{ paddingTop: 24, paddingBottom: 70 }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 34 }}>
          <a href="/" style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.03em' }}>Relay</a>
          <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <a href="/blog" style={{ fontWeight: 600, fontSize: 15 }}>Blog</a>
            <a href="/login" className="btn small">Sign in</a>
          </span>
        </nav>

        <div className="legal bpost" style={{ maxWidth: 720 }}>
          <p className="legalkicker">
            <a href={'/blog?category=' + encodeURIComponent(post.category)} className="bkicklink">{post.category}</a>
            <span className="bdot">&middot;</span>
            {formatDate(post.published_at)}
            <span className="bdot">&middot;</span>
            {minutes} min read
          </p>
          <h1>{post.title}</h1>
          {post.dek ? <p className="legallede">{post.dek}</p> : null}
          <p className="bbyline">By {post.author_name}</p>
        </div>

        <img className="bhero" src={coverUrl(post)} alt="" width={1200} height={630} />

        {headings.filter((h) => h.level === 2).length > 2 ? (
          <nav className="btoc" aria-label="On this page">
            <p>On this page</p>
            <ul>
              {headings.filter((h) => h.level === 2).map((h) => (
                <li key={h.id}><a href={'#' + h.id}>{h.text}</a></li>
              ))}
            </ul>
          </nav>
        ) : null}

        <article className="legal bpost" style={{ maxWidth: 720 }} dangerouslySetInnerHTML={{ __html: html }} />

        {faqs.length ? (
          <div className="legal bpost" style={{ maxWidth: 720 }}>
            <h2>Questions people ask</h2>
            {faqs.map((f) => (
              <div key={f.q} className="bfaq">
                <p className="bfaqq">{f.q}</p>
                <p>{f.a}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="legal" style={{ maxWidth: 720 }}>
          <div className="legalend">
            <Blob size={92} />
            <p>
              Relay is a link page with everything you sell on it. Unlimited links on the free plan,
              no card, no time limit.
              <br />
              <a href="/login" className="btn" style={{ marginTop: 14, display: 'inline-block' }}>Grab your name &rarr;</a>
            </p>
          </div>
        </div>

        {related.length ? (
          <div style={{ marginTop: 46 }}>
            <p className="brelhead">More from the blog</p>
            <div className="bgrid">
              {related.map((p) => (
                <a className="bcard" key={p.slug} href={'/blog/' + p.slug}>
                  <img className="bcover" src={coverUrl(p)} alt="" loading="lazy" width={1200} height={630} />
                  <div className="bcardbody">
                    <p className="bmeta"><span className="bchip">{p.category}</span></p>
                    <h2>{p.title}</h2>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <footer className="legalfoot">
          <a href="/blog">Blog</a>
          <a href="/">Home</a>
          <a href="/vs-linktree">Compare</a>
          <a href="/privacy">Privacy</a>
          <span>Relay is made by ClearPath Advisory.</span>
        </footer>
      </div>
    </main>
  )
}
