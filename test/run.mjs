// A dozen assertions over the pure functions with sharp edges. No framework:
// `node test/run.mjs` after a build, or `npm test`.
import assert from 'node:assert/strict'

const { isPrivateAddress } = await import('../.test/lib/net.js')
const { jsonLdScript } = await import('../.test/lib/jsonld.js')
const { socialHref, socialName } = await import('../.test/app/socialicons.js')
const { resolveLook, fontStack } = await import('../.test/lib/supabase.js')
const { scheduleState, scheduleLabel } = await import('../.test/lib/schedule.js')
const { detectEmbed, oembedUrl, tidyTitle } = await import('../.test/lib/embed.js')
const { cardText } = await import('../.test/lib/cardtext.js')
const { renderMarkdown, readingMinutes, firstParagraph } = await import('../.test/lib/markdown.js')

let passed = 0
function it(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name) }
  catch (e) { console.log('  FAIL ' + name + '\n       ' + e.message); process.exitCode = 1 }
}

console.log('\nisPrivateAddress')
it('blocks loopback, private and link-local', () => {
  for (const ip of ['127.0.0.1', '10.0.0.1', '172.16.0.1', '172.31.255.254', '192.168.1.1', '169.254.169.254'])
    assert.equal(isPrivateAddress(ip), true, ip)
})
it('blocks the ranges the old string check missed', () => {
  for (const ip of ['100.64.0.1', '0.0.0.0', '198.18.0.1', '224.0.0.1'])
    assert.equal(isPrivateAddress(ip), true, ip)
})
it('blocks IPv6 loopback, unique-local and mapped IPv4', () => {
  for (const ip of ['::1', 'fd00::1', 'fe80::1', '::ffff:127.0.0.1'])
    assert.equal(isPrivateAddress(ip), true, ip)
})
it('allows real public addresses either side of 172.16/12', () => {
  for (const ip of ['8.8.8.8', '1.1.1.1', '172.15.0.1', '172.32.0.1', '93.184.216.34'])
    assert.equal(isPrivateAddress(ip), false, ip)
})
it('treats anything unparseable as private', () => {
  assert.equal(isPrivateAddress('not.an.ip'), true)
})

console.log('\njsonLdScript')
it('neutralises a closing script tag in user text', () => {
  const out = jsonLdScript({ bio: '</scr' + 'ipt><scr' + 'ipt>alert(1)</scr' + 'ipt>' })
  assert.equal(out.includes('</'), false)
  assert.equal(out.includes('<'), false)
})
it('round-trips to the identical string', () => {
  const bio = 'Songs & <things> — "quoted"'
  assert.equal(JSON.parse(jsonLdScript({ bio })).bio, bio)
})
it('escapes the separators that break inline scripts', () => {
  assert.equal(jsonLdScript({ a: '\u2028\u2029' }).includes('\u2028'), false)
})

console.log('\nsocialHref')
it('builds a handle into a platform URL', () => {
  assert.equal(socialHref('instagram', '@ada'), 'https://instagram.com/ada')
  assert.equal(socialHref('tiktok', 'ada'), 'https://tiktok.com/@ada')
})
it('leaves a full URL alone', () => {
  assert.equal(socialHref('x', 'https://x.com/ada'), 'https://x.com/ada')
})
it('never produces a javascript: URL', () => {
  for (const p of ['website', 'instagram', 'x', 'email']) {
    const href = socialHref(p, 'javascript:alert(1)')
    assert.equal(href.startsWith('javascript:'), false, p + ' -> ' + href)
  }
})
it('turns an address into mailto once, not twice', () => {
  assert.equal(socialHref('email', 'a@b.com'), 'mailto:a@b.com')
  assert.equal(socialHref('email', 'mailto:a@b.com'), 'mailto:a@b.com')
})
it('names an unknown platform after itself rather than throwing', () => {
  assert.equal(socialName('nope'), 'nope')
})

console.log('\nresolveLook')
const theme = {
  bg: '#111', button_bg: '#222', button_text: '#eee', accent_bg: '#0f0',
  accent_text: '#000', name_color: '#fff', bio_color: '#ccc', button_radius: '20px',
}
const base = {
  use_custom: false, custom_bg: null, custom_button_bg: null, custom_button_text: null,
  custom_accent_bg: null, bg_image_url: null, font_family: 'manrope',
}
it('uses the theme when custom colours are off', () => {
  assert.equal(resolveLook({ ...base }, theme).bg, '#111')
})
it('lets custom colours win only when the switch is on', () => {
  assert.equal(resolveLook({ ...base, custom_bg: '#abc' }, theme).bg, '#111')
  assert.equal(resolveLook({ ...base, use_custom: true, custom_bg: '#abc' }, theme).bg, '#abc')
})
it('falls back to defaults with no theme at all', () => {
  const L = resolveLook({ ...base }, undefined)
  assert.equal(typeof L.bg, 'string')
  assert.equal(L.buttonRadius, '14px')
})
it('falls back to the first font for an unknown id', () => {
  assert.equal(fontStack('nope'), fontStack('manrope'))
})
it('marks a tiled theme so nothing stretches it', () => {
  const doodle = { ...theme, bg: "#F6F3FF url(\"data:image/svg+xml,%3Csvg...\") repeat" }
  assert.equal(resolveLook({ ...base }, doodle).bgTiled, true)
})
it('leaves a flat colour and a gradient free to cover', () => {
  assert.equal(resolveLook({ ...base }, theme).bgTiled, false)
  assert.equal(resolveLook({ ...base }, { ...theme, bg: 'linear-gradient(180deg,#fff,#000)' }).bgTiled, false)
})
it('a custom colour is never treated as a tile', () => {
  const L = resolveLook({ ...base, use_custom: true, custom_bg: '#ABCDEF' }, { ...theme, bg: 'x url(y)' })
  assert.equal(L.bgTiled, false)
})

console.log('\nscheduleState')
const T = (iso) => new Date(iso)
const now = T('2026-08-13T12:00:00Z')
it('an unscheduled link is simply live', () => {
  assert.equal(scheduleState({ starts_at: null, ends_at: null }, now), 'none')
  assert.equal(scheduleLabel({ starts_at: null, ends_at: null }, now), '')
})
it('before its start it is waiting', () => {
  assert.equal(scheduleState({ starts_at: '2026-08-14T12:00:00Z', ends_at: null }, now), 'waiting')
})
it('inside its window it is live', () => {
  assert.equal(scheduleState({ starts_at: '2026-08-12T12:00:00Z', ends_at: '2026-08-14T12:00:00Z' }, now), 'live')
})
it('after its end it has ended', () => {
  assert.equal(scheduleState({ starts_at: null, ends_at: '2026-08-12T12:00:00Z' }, now), 'ended')
})
it('the boundary counts as ended, matching the database filter', () => {
  assert.equal(scheduleState({ starts_at: null, ends_at: '2026-08-13T12:00:00Z' }, now), 'ended')
})
it('a start exactly now counts as live, matching the database filter', () => {
  assert.equal(scheduleState({ starts_at: '2026-08-13T12:00:00Z', ends_at: null }, now), 'live')
})
it('an ended label names the end and a waiting label names the start', () => {
  assert.ok(scheduleLabel({ starts_at: null, ends_at: '2026-08-12T12:00:00Z' }, now).startsWith('Ended'))
  assert.ok(scheduleLabel({ starts_at: '2026-08-14T12:00:00Z', ends_at: null }, now).startsWith('Live from'))
})

console.log('\ndetectEmbed')
it('reads every shape of YouTube link', () => {
  for (const u of [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=30s',
  ]) {
    const e = detectEmbed(u)
    assert.ok(e, u)
    assert.equal(e.kind, 'youtube')
    assert.equal(e.src, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
  }
})
it('always uses the nocookie host', () => {
  assert.equal(detectEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ').src.includes('youtube-nocookie.com'), true)
})
it('reads Spotify tracks, albums and localised links', () => {
  const t = detectEmbed('https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT')
  assert.equal(t.kind, 'spotify')
  assert.equal(t.src, 'https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT')
  assert.equal(t.height, 152)
  const a = detectEmbed('https://open.spotify.com/intl-de/album/4cOdK2wGLETKBW3PvgPWqT')
  assert.equal(a.kind, 'spotify')
  assert.equal(a.height, 352)
})
it('reads a SoundCloud track and encodes the url it passes on', () => {
  const e = detectEmbed('https://soundcloud.com/artist/a-track')
  assert.equal(e.kind, 'soundcloud')
  assert.equal(e.src.includes(encodeURIComponent('https://soundcloud.com/artist/a-track')), true)
})
it('returns nothing for anything else', () => {
  for (const u of [
    'https://example.com', 'https://youtube.com', 'https://open.spotify.com',
    'https://open.spotify.com/track/', 'https://soundcloud.com', null, '', 'not a url',
    'javascript:alert(1)', 'https://notyoutube.com/watch?v=dQw4w9WgXcQ',
  ]) {
    assert.equal(detectEmbed(u), null, String(u))
  }
})
it('refuses a lookalike host', () => {
  assert.equal(detectEmbed('https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ'), null)
  assert.equal(detectEmbed('https://open.spotify.com.evil.example/track/4cOdK2wGLETKBW3PvgPWqT'), null)
})

console.log('\noembedUrl')
it('points each service at its own endpoint', () => {
  assert.ok(oembedUrl('https://youtu.be/dQw4w9WgXcQ').startsWith('https://www.youtube.com/oembed'))
  assert.ok(oembedUrl('https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT').startsWith('https://open.spotify.com/oembed'))
  assert.ok(oembedUrl('https://soundcloud.com/artist/a-track').startsWith('https://soundcloud.com/oembed'))
})
it('returns nothing for a site with no endpoint', () => {
  assert.equal(oembedUrl('https://example.com'), null)
})

console.log('\ntidyTitle')
it('strips the site name a service appends', () => {
  assert.equal(tidyTitle('Never Gonna Give You Up - YouTube', 'youtube.com'), 'Never Gonna Give You Up')
  assert.equal(tidyTitle('A Bar Song (Tipsy) | Spotify', 'open.spotify.com'), 'A Bar Song (Tipsy)')
  assert.equal(tidyTitle('Some Track by Someone | Free Listening on SoundCloud', 'soundcloud.com'), 'Some Track')
})
it('rejects a title that is only the site name', () => {
  assert.equal(tidyTitle('YouTube', 'www.youtube.com'), '')
  assert.equal(tidyTitle('Spotify', 'open.spotify.com'), '')
  assert.equal(tidyTitle('MSN', 'msn.com'), '')
})
it('leaves a real title alone', () => {
  assert.equal(tidyTitle('Nightink — a private diary', 'nightink.app'), 'Nightink — a private diary')
})

console.log('\ncardText')
it('takes emoji out so the renderer has something to draw', () => {
  assert.equal(cardText('\u{1F680}\u{1F680}\u{1F680} Songs'), 'Songs')
  assert.equal(cardText('Songs \u2728 and stories'), 'Songs and stories')
})
it('falls back when emoji were the whole thing', () => {
  assert.equal(cardText('\u{1F680}\u{1F680}\u{1F680}', 'Links from Ada'), 'Links from Ada')
  assert.equal(cardText('', 'Links from Ada'), 'Links from Ada')
  assert.equal(cardText(null, 'Links from Ada'), 'Links from Ada')
})
it('leaves ordinary text and punctuation alone', () => {
  const t = 'Songs, mostly \u2014 somewhere between a lullaby & a "warning" (2026)'
  assert.equal(cardText(t), t)
})
it('does not strip accents or non-latin script', () => {
  assert.equal(cardText('Zażółć gęślą jaźń'), 'Zażółć gęślą jaźń')
  assert.equal(cardText('日本語のテキスト'), '日本語のテキスト')
})

console.log('\nrenderMarkdown')
it('escapes anything that looks like a tag', () => {
  const { html } = renderMarkdown('A <script>alert(1)</script> line')
  assert.equal(html.indexOf('<script') < 0, true)
  assert.equal(html.indexOf('&lt;script&gt;') >= 0, true)
})
it('refuses a javascript: link and keeps the words', () => {
  const { html } = renderMarkdown('Read [this](javascript:alert(1)) now')
  assert.equal(html.indexOf('javascript:') < 0, true)
  assert.equal(html.indexOf('this') >= 0, true)
})
it('allows https, relative and mailto', () => {
  assert.equal(renderMarkdown('[a](https://relayme.bio)').html.indexOf('href="https://relayme.bio"') >= 0, true)
  assert.equal(renderMarkdown('[a](/login)').html.indexOf('href="/login"') >= 0, true)
  assert.equal(renderMarkdown('[a](mailto:hello@relayme.bio)').html.indexOf('mailto:') >= 0, true)
})
it('marks an outbound link nofollow but not our own', () => {
  assert.equal(renderMarkdown('[a](https://example.com)').html.indexOf('nofollow') >= 0, true)
  assert.equal(renderMarkdown('[a](https://relayme.bio/login)').html.indexOf('nofollow') < 0, true)
})
it('gives every h2 an id the table of contents can reach', () => {
  const { html, headings } = renderMarkdown('## The things that work\n\ntext')
  assert.equal(headings[0].id, 'the-things-that-work')
  assert.equal(html.indexOf('id="the-things-that-work"') >= 0, true)
})
it('builds lists, bold and blockquotes', () => {
  assert.equal(renderMarkdown('- one\n- two').html, '<ul><li>one</li><li>two</li></ul>')
  assert.equal(renderMarkdown('a **b** c').html, '<p>a <strong>b</strong> c</p>')
  assert.equal(renderMarkdown('> quoted').html.indexOf('<blockquote>') >= 0, true)
})
it('joins wrapped lines into one paragraph', () => {
  assert.equal(renderMarkdown('one\ntwo\n\nthree').html, '<p>one two</p>\n<p>three</p>')
})

console.log('\nreadingMinutes and firstParagraph')
it('never reports zero minutes', () => {
  assert.equal(readingMinutes(''), 1)
  assert.equal(readingMinutes(new Array(441).join('word ')), 2)
})
it('skips headings and strips link syntax for the excerpt', () => {
  const s = '## Heading\n\nA line with [a link](https://relayme.bio) in it.'
  assert.equal(firstParagraph(s), 'A line with a link in it.')
})

console.log('\n' + passed + ' assertions passed\n')
