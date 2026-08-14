// Writes one blog draft and saves it as a draft. Never publishes.
//
// Runs on GitHub Actions twice a week. No npm install: everything here is
// fetch against two HTTP APIs, because a dependency tree is one more thing
// that can break a job nobody is watching.
//
// The shape of the run:
//   1. take the lowest-numbered queued topic and mark it 'drafting'
//   2. ask the model for a complete draft as JSON
//   3. check the draft against rules that catch the ways this goes wrong
//   4. save it as a draft, or put the topic back and fail loudly
//
// A topic is never marked done on a draft that did not pass. A red run with
// the topic still queued is a better outcome than a bad post in the table.

const SUPABASE_URL = 'https://fhwxxobzeqiypgeazdub.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const MODEL = process.env.BLOG_MODEL || 'claude-opus-5'

if (!SERVICE_KEY || !ANTHROPIC_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or ANTHROPIC_API_KEY.')
  process.exit(1)
}

const HEADERS = {
  apikey: SERVICE_KEY,
  authorization: 'Bearer ' + SERVICE_KEY,
  'content-type': 'application/json',
}

async function db(path, init) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    ...(init || {}),
    headers: { ...HEADERS, ...((init || {}).headers || {}) },
  })
  const text = await res.text()
  if (!res.ok) throw new Error('Supabase ' + res.status + ': ' + text.slice(0, 400))
  return text ? JSON.parse(text) : null
}

// ---------------------------------------------------------------------------
// The rules. Each one exists because it is a way this drifts, not because it
// is a nice idea. A failure hands its own message back to the model on the
// retry, so the second attempt is aimed rather than hopeful.
// ---------------------------------------------------------------------------
const BANNED = [
  'in today', 'let\u2019s dive', "let's dive", 'dive into', 'it is important to note',
  'it\u2019s important to note', "it's important to note", 'in conclusion', 'leverage',
  'seamless', 'unlock', 'empower', 'game-changer', 'game changer', 'landscape',
  'delve', 'tapestry', 'testament to', 'navigate the', 'at the end of the day',
  'when it comes to', 'the truth is', 'here\u2019s the thing', "here's the thing",
  // Words that insist on their own sincerity, which reads as the opposite.
  'genuinely', 'honestly speaking', 'straightforward', 'to be fair,',
]

// Claims of a life the author does not have. The byline is a name on a blog,
// not a person with a career, and inventing one is worse than having none.
const CREDENTIALS = [
  /\b(twenty|ten|fifteen|five|\d{1,2})\+?\s*years?\s+(of\s+|in\s+|working\s+|spent\s+)/i,
  /\bI (have )?(spent|worked|ran|founded|built) (a |an |my |the )?(decade|career|company|agency|business)\b/i,
  /\bas a (former|qualified|certified|licensed|professional)\b/i,
  /\bmy (background|career|clients|agency|consultancy|firm) (in|is|was)\b/i,
  /\b(compliance|financial crime|money laundering|anti-money)\b.{0,40}\b(career|background|work|job|experience)\b/i,
  /\bin my (twenty|ten|\d+) years\b/i,
]

function check(post) {
  const fails = []
  const body = String(post.body_md || '')
  const words = body.split(/\s+/).filter(Boolean).length
  const lower = body.toLowerCase()

  if (!post.title || post.title.length > 95) fails.push('title missing, or longer than 95 characters')
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(post.slug || '')) fails.push('slug must be lowercase words joined by hyphens')
  if (!post.dek) fails.push('dek missing')
  if (!post.meta_title || post.meta_title.length > 62) fails.push('meta_title missing or over 62 characters')
  // The site is sentence case throughout. Title Case in a search result is the
  // one place the blog would look like it came from somewhere else.
  if (post.meta_title && (post.meta_title.match(/\s[A-Z][a-z]/g) || []).length >= 3) {
    fails.push('meta_title is in Title Case; write it in sentence case like the rest of the site')
  }
  if (post.title && (post.title.match(/\s[A-Z][a-z]/g) || []).length >= 3) {
    fails.push('title is in Title Case; write it in sentence case')
  }
  if (!post.meta_description || post.meta_description.length > 158) fails.push('meta_description missing or over 158 characters')

  if (words < 1100) fails.push('body is ' + words + ' words, needs at least 1100')
  if (words > 2300) fails.push('body is ' + words + ' words, cut it below 2300')

  const h2 = (body.match(/^##\s+/gm) || []).length
  if (h2 < 3) fails.push('needs at least 3 "## " section headings, found ' + h2)

  const relayLinks = (body.match(/\]\(https:\/\/relayme\.bio/g) || []).length
  if (relayLinks < 2) fails.push('needs at least 2 links to relayme.bio inside the article, found ' + relayLinks)

  const em = (body.match(/\u2014/g) || []).length
  if (em > 0) fails.push('contains ' + em + ' em dashes; use full stops or commas instead')

  // "- **Thing.** explanation" and "**Thing.** explanation" as a paragraph
  // opener are the two shapes that make a piece read as generated.
  if (/^\s*[-*]\s*\*\*/m.test(body)) fails.push('bulleted list items must not begin with bold text')
  if (/^\*\*[^*\n]{2,60}\*\*[.:]?\s/m.test(body)) fails.push('paragraphs must not begin with a bold label')

  BANNED.forEach((p) => { if (lower.indexOf(p) >= 0) fails.push('remove the phrase "' + p + '"') })
  CREDENTIALS.forEach((r) => {
    if (r.test(body)) fails.push('the author has no stated career or credentials; remove any claim of professional experience')
  })

  if (!Array.isArray(post.faq) || post.faq.length < 2 || post.faq.length > 4) {
    fails.push('faq must have between 2 and 4 question and answer pairs')
  } else {
    post.faq.forEach((f, i) => {
      if (!f || !f.q || !f.a) fails.push('faq item ' + (i + 1) + ' is missing a question or an answer')
    })
  }

  return Array.from(new Set(fails))
}

// ---------------------------------------------------------------------------
function buildPrompt(topic, published, sample) {
  const others = published.length
    ? published.map((p) => '- ' + p.title + '  ->  https://relayme.bio/blog/' + p.slug).join('\n')
    : '(none yet)'

  return `You write for the Relay blog. Relay is a link-in-bio page at relayme.bio, made in Warsaw. Readers are new creators and people early in selling online: TikTok and Shopify sellers, people chasing a first sale, people advertising on a small budget. Not people who already run a link page.

WRITE THIS ONE:
Title to work from: ${topic.title}
The argument: ${topic.angle || ''}
Category: ${topic.category}
Search term to serve: ${topic.target_keyword || ''}
${topic.notes ? 'Notes: ' + topic.notes : ''}

VOICE
Plain, dry, quietly funny, never breathless. Say what a thing does and what it costs. Admit what is not known and what the product cannot do. British spelling. Sentences and paragraphs of uneven length: some one line, some six. First person singular is allowed, first person plural for Relay itself.

THE AUTHOR HAS NO BIOGRAPHY. Never claim years of experience, a former career, clients, a company, or credentials of any kind. Arguments stand on specifics and reasoning, not on who is speaking. This is the single easiest way to fail this brief.

HARD RULES
- No em dashes anywhere. Full stops and commas.
- No bulleted list where each item starts with bold text. No paragraph starting with a bold label. Write prose.
- Never these phrases: ${BANNED.join(', ')}.
- Titles and meta titles in sentence case, not Title Case.
- No income promises, no "make $X in Y days", no urgency, no hype.
- Do not accuse or patronise the reader.
- 1300 to 1900 words. At least three "## " headings. Vary the shape of sections; do not make every section the same length or end every one on a neat summary line.

RELAY MUST APPEAR IN 2 OR 3 PARAGRAPHS, WOVEN IN
Not an advert at the end. The pattern that works: a mid-article section where Relay answers a problem the article has just raised; a mention somewhere Relay is honestly part of the problem being described; and a short close. At least two links to https://relayme.bio inside the body using markdown links.
Facts you may state: free plan with no card and no time limit, unlimited links on every plan, own photo and bio, social icons, 5 free themes, headings and dividers, tap and view counts, QR code, story-sized share image. Pro is $30 a year or $4 a month plus VAT and adds all 47 themes, all 8 fonts, custom colours, background image, per-link images, scheduled links, inline players, email capture, and removing the Relay badge. Data is held in the European Union, fonts are self-hosted, there is no advertising and no third-party analytics. Relay has no custom domains and no payments, and says so.
Useful links: https://relayme.bio , https://relayme.bio/vs-linktree (an honest comparison that includes four rows where Linktree wins), https://relayme.bio/login .

OTHER POSTS, link to any that are genuinely relevant:
${others}

A PUBLISHED POST, FOR REGISTER ONLY. Do not reuse its content or structure:
"""
${sample.slice(0, 2600)}
"""

RETURN ONLY JSON, no prose around it, no code fences:
{
  "title": "final title, under 95 characters",
  "slug": "lowercase-words-with-hyphens",
  "dek": "one line under the headline, not a summary, an invitation",
  "meta_title": "under 62 characters",
  "meta_description": "under 158 characters",
  "body_md": "the article in markdown, ## headings, no title at the top",
  "faq": [{"q":"...","a":"..."}, {"q":"...","a":"..."}]
}`
}

async function ask(messages) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 8000, messages }),
  })
  if (!res.ok) throw new Error('Anthropic ' + res.status + ': ' + (await res.text()).slice(0, 400))
  const data = await res.json()
  return (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('')
}

function parse(text) {
  let t = String(text || '').trim()
  t = t.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start < 0 || end < 0) throw new Error('No JSON object in the reply.')
  return JSON.parse(t.slice(start, end + 1))
}

// ---------------------------------------------------------------------------
async function main() {
  const queued = await db('topics?status=eq.queued&order=position.asc&limit=1')
  if (!queued.length) {
    console.log('The queue is empty. Nothing to write.')
    return
  }
  const topic = queued[0]
  console.log('Topic ' + topic.position + ': ' + topic.title)

  // Claimed before the model is called, so two overlapping runs cannot both
  // write the same topic.
  await db('topics?id=eq.' + topic.id, {
    method: 'PATCH', headers: { prefer: 'return=minimal' },
    body: JSON.stringify({ status: 'drafting' }),
  })

  async function release(status) {
    await db('topics?id=eq.' + topic.id, {
      method: 'PATCH', headers: { prefer: 'return=minimal' },
      body: JSON.stringify({ status }),
    })
  }

  try {
    const published = await db('posts?status=eq.published&select=slug,title,category,body_md&order=published_at.desc&limit=8')
    const sample = published.length ? String(published[0].body_md || '') : ''
    const slim = published.map((p) => ({ slug: p.slug, title: p.title, category: p.category }))

    const messages = [{ role: 'user', content: buildPrompt(topic, slim, sample) }]
    let post = null
    let fails = []

    for (let attempt = 1; attempt <= 2; attempt++) {
      const reply = await ask(messages)
      let candidate
      try {
        candidate = parse(reply)
      } catch (e) {
        fails = ['the reply was not valid JSON: ' + e.message]
        messages.push({ role: 'assistant', content: reply })
        messages.push({ role: 'user', content: 'Return only the JSON object, nothing else.' })
        continue
      }
      fails = check(candidate)
      console.log('Attempt ' + attempt + ': ' + (fails.length ? fails.length + ' problems' : 'passed'))
      if (!fails.length) { post = candidate; break }
      fails.forEach((f) => console.log('  - ' + f))
      messages.push({ role: 'assistant', content: reply })
      messages.push({
        role: 'user',
        content: 'That draft failed these checks:\n' + fails.map((f) => '- ' + f).join('\n') +
          '\nRewrite the whole piece fixing every one. Return only the JSON object.',
      })
    }

    if (!post) {
      await release('queued')
      console.error('\nNo draft passed. The topic is back in the queue and nothing was saved.')
      process.exit(1)
    }

    // Covers rotate so an index of twenty posts is not twenty of one card.
    const count = await db('posts?select=id')
    const related = slim.slice(0, 2).map((p) => p.slug)

    const saved = await db('posts', {
      method: 'POST', headers: { prefer: 'return=representation' },
      body: JSON.stringify({
        slug: post.slug,
        title: post.title,
        dek: post.dek,
        body_md: post.body_md,
        category: topic.category,
        meta_title: post.meta_title,
        meta_description: post.meta_description,
        cover_variant: count.length % 6,
        related_slugs: related,
        faq: post.faq,
        status: 'draft',
        published_at: null,
        topic_id: topic.id,
      }),
    })

    await db('topics?id=eq.' + topic.id, {
      method: 'PATCH', headers: { prefer: 'return=minimal' },
      body: JSON.stringify({ status: 'drafted', drafted_post_id: saved[0].id }),
    })

    const words = post.body_md.split(/\s+/).filter(Boolean).length
    console.log('\nSaved as a draft: ' + post.title)
    console.log(words + ' words. Read it at https://relayme.bio/admin/blog')
  } catch (e) {
    await release('queued')
    throw e
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1) })
