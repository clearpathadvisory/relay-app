// A dozen assertions over the pure functions with sharp edges. No framework:
// `node test/run.mjs` after a build, or `npm test`.
import assert from 'node:assert/strict'

const { isPrivateAddress } = await import('../.test/lib/net.js')
const { jsonLdScript } = await import('../.test/lib/jsonld.js')
const { socialHref, socialName } = await import('../.test/app/socialicons.js')
const { resolveLook, fontStack } = await import('../.test/lib/supabase.js')

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

console.log('\n' + passed + ' assertions passed\n')
