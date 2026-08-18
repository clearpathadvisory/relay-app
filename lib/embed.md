# Embeds

Nine services now play on the page: YouTube, Spotify, SoundCloud, Apple Music,
Bandcamp, and — added in this pass — **TIDAL**, **Deezer**, **Mixcloud** and
**Audiomack**.

---

## The shapes these four take

**TIDAL renames the type on the way across.** `tidal.com/track/64978614` becomes
`embed.tidal.com/tracks/64978614` — plural, not singular. Albums, playlists and
videos do the same. A playlist id is a uuid rather than a number, so the id test
branches on the type instead of being one regex. `listen.tidal.com` and the
`/browse/` prefix the web player adds are both accepted.

**Deezer carries an optional storefront.** `/us/track/123` and `/track/123` are
the same record, so the first segment is skipped when it is two letters. The
widget is asked for `light` explicitly: every theme on a page draws its own
ground, and Deezer's dark player punches a black rectangle through a pale card.

**Mixcloud takes the address, not an id.** The show's own path goes into the
widget as a parameter. The trailing slash is not decoration — without it the
widget returns an empty player. A profile URL on its own is deliberately not
embeddable; it needs at least a user and a show.

**Audiomack reorders the same three pieces.** Public `/artist/song/slug` becomes
`/embed/song/artist/slug`. Older links put the type first and both shapes are
still handed out, so both are read.

None of the four needs a stored value. All are pure functions of the URL, like
everything except Bandcamp.

---

## Copy these, in any order, but deploy together

| File | Destination |
|---|---|
| `FIX-53__lib__embed.ts` | `lib/embed.ts` |
| `FIX-54__next.config.js` | `next.config.js` |
| `FIX-55__app_username__embedcard.tsx` | `app/[username]/embedcard.tsx` |
| `FIX-56__app_dashboard__phone.tsx` | `app/dashboard/phone.tsx` |
| `FIX-57__app_dashboard__page.tsx` | `app/dashboard/page.tsx` |
| `FIX-58__lib__embed.md` | `lib/embed.md` |

`lib/supabase.ts` needs nothing this time — `embed_kind` is typed `string | null`
already. The database side is done: the `link_embed_kind` check constraint has
been widened to the nine values and verified.

---

## Two things fixed on the way past

**`oembedUrl()` used to end in a bare SoundCloud return.** Anything that was not
YouTube, Spotify or Apple Music fell off the end and asked SoundCloud to describe
it — which, the moment a fifth kind existed, would have meant handing SoundCloud
a Deezer address and taking whatever came back. Each kind is now named, and
unknown kinds return null and fall through to the ordinary og:title path.

**The preview kept its own colour table.** `phone.tsx` held a second copy of the
service colours, so a new service would have shipped and shown up orange in the
dashboard preview. There is now one table, `embedColor()` in `lib/embed.ts`, read
by the public card, the dashboard row and the preview alike.

---

## What was guarded

| Input | Result |
|---|---|
| `tidal.com.attacker.io/track/123` | not TIDAL |
| `deezer.com.evil.io/track/123` | not Deezer |
| `evil-audiomack.com/x/song/y` | not Audiomack |
| `tidal.com/track/abc` | no numeric id, ignored |
| `deezer.com/us/track/abc` | no numeric id, ignored |
| `tidal.com/browse/artist/12345` | artist has no embed, ignored |
| `mixcloud.com/someuser/` | a profile, not a show |
| `mixcloud.com/widget/iframe/?feed=x` | the widget itself, refused |
| `audiomack.com/someartist` | a profile, not a release |

YouTube, Spotify, SoundCloud, Apple Music and Bandcamp were re-checked against
the same run and are unchanged.

---

## The CSP has five new entries, not four

`frame-src` gains `embed.tidal.com`, `widget.deezer.com`, `audiomack.com` — and
**both** `www.mixcloud.com` and `player-widget.mixcloud.com`. Mixcloud serves the
widget from `www` and has begun redirecting it to a dedicated host; a redirect is
a fresh frame navigation, so the destination needs listing too or the player goes
blank on the hop with nothing in the console.

---

## After deploying

Add one of each to your own page and play it. TIDAL and Deezer only give a
30-second preview to a visitor who is not signed in to that service, which is the
service's rule and not something the page can change.

Heights are the published or observed figures — a TIDAL track at 128, an album at
400; Deezer 180 and 400; a Mixcloud show at 120; an Audiomack song at 252. If any
player arrives with a scrollbar or a band of dead space, the number to change is
in `detectEmbed()` and nowhere else.

## Still not embeddable

Nothing on the earlier list. Anything added next follows the same six places:
`lib/embed.ts` · the `link_embed_kind` check constraint · `frame-src` in
`next.config.js` · the mark in `app/[username]/embedcard.tsx` · the colour in
`embedColor()` · the copy in `app/dashboard/page.tsx`.
