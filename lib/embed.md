# Apple Music and Bandcamp embeds

Five services now play on the page: YouTube, Spotify, SoundCloud, **Apple Music**
and **Bandcamp**.

---

## Why the two were not the same job

**Apple Music is a hostname swap.** `music.apple.com/us/album/thriller/269572838`
becomes `embed.music.apple.com/us/album/thriller/269572838`. Same path, same
query — and the query matters, because `?i=` is what distinguishes one song
inside an album from the whole album. `detectEmbed()` stays a pure function of
the URL.

**Bandcamp is not.** Its player is
`bandcamp.com/EmbeddedPlayer/album=1234567890/…`, and that number **appears
nowhere in the public address**. It lives in the page's own `og:video` tag. So
it has to be looked up once and kept.

That is the whole reason this needed a migration and seven files rather than one.

---

## Copy these, in any order, but deploy together

| File | Destination |
|---|---|
| `FIX-49__lib__embed.ts` | `lib/embed.ts` |
| `FIX-46__lib__supabase.ts` | `lib/supabase.ts` |
| `FIX-52__app_api_linkmeta__route.ts` | `app/api/linkmeta/route.ts` |
| `FIX-43__app_dashboard__page.tsx` | `app/dashboard/page.tsx` |
| `FIX-44__app_dashboard__phone.tsx` | `app/dashboard/phone.tsx` |
| `FIX-50__app_username__embedcard.tsx` | `app/[username]/embedcard.tsx` |
| `FIX-51__app_username__row.tsx` | `app/[username]/row.tsx` |

**`lib/supabase.ts` is not optional.** The `Link` type is hand-written, so
`embed_src` stays invisible to TypeScript until it is listed there and the build
fails — the same trap as `avatar_poster_url` earlier. It also still carries that
field, so this file supersedes the earlier copy.

Database columns `links.embed_src` and `links.embed_height` are already added.

---

## How Bandcamp resolves

1. Someone pastes `artist.bandcamp.com/album/some-record`
2. `/api/linkmeta` already fetches that page for the title and icon. It now also
   reads `og:video` and returns a player URL — **one regex, no extra request**
3. The dashboard stores it on the link as `embed_src`
4. The public page prefers the derived embed and falls back to the stored one

**The player is rebuilt rather than used verbatim.** Bandcamp's default is a
large dark artwork block, and a page of neat rows does not want one dropped into
the middle. It is re-emitted with a white ground, your violet as the link colour,
transparency on, and small artwork — a track at 120px, an album at 470px with its
tracklist.

## What is guarded

`storedEmbed()` re-validates before rendering, so a value that somehow reached
the database still cannot load a frame from anywhere but `bandcamp.com`.

Tested and rejected:

| Input | Result |
|---|---|
| `evil-bandcamp.com.attacker.io/album/x` | not Bandcamp |
| `og:video` pointing at `attacker.io` | no player |
| `og:video` on the right host, wrong path | no player |
| `artist.bandcamp.com/merch/t-shirt` | not a release, ignored |
| `music.apple.com/us/album/thriller` (no id) | no player |
| `music.apple.com/album/x/123` (no storefront) | no player |

---

## After deploying

Add a Bandcamp album to your own page and check it plays. **Links added before
this deploy will not have an `embed_src`** — there is no backfill, because
resolving them means fetching every Bandcamp page already saved. Re-adding the
link is the fix, and it affects nobody yet.

## Still not embeddable

Tidal, Deezer, Mixcloud, Audiomack. Tidal and Deezer are both hostname swaps like
Apple Music and would be small additions if anyone asks for them.
