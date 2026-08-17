import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = 'https://fhwxxobzeqiypgeazdub.supabase.co'
export const SUPABASE_KEY = 'sb_publishable_m2DfAN9JaegsoNBVDwEsFQ_VIW4XNYL'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { detectSessionInUrl: true, persistSession: true, autoRefreshToken: true, flowType: 'implicit' },
})

// The App Router caches fetch() by default, and supabase-js goes through
// fetch. That is what kept a share card showing a bio edited hours earlier:
// the image was regenerating, but the read behind it was being served from
// Next's data cache. Freshness is decided by the route's own revalidate
// setting, not silently here.
export function serverClient(fresh = false) {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: fresh
      ? { fetch: (input: any, init?: any) => fetch(input, { ...(init || {}), cache: 'no-store' }) }
      : undefined,
  })
}

const EMOJI = ', "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"'

export const FONTS = [
  { id: 'manrope', name: 'Manrope', stack: "'Manrope Variable', Manrope, system-ui, sans-serif" + EMOJI },
  { id: 'fraunces', name: 'Fraunces', stack: "'Fraunces Variable', Fraunces, Georgia, serif" + EMOJI },
  { id: 'space', name: 'Space Grotesk', stack: "'Space Grotesk Variable', 'Space Grotesk', system-ui, sans-serif" + EMOJI },
  { id: 'dm', name: 'DM Sans', stack: "'DM Sans Variable', 'DM Sans', system-ui, sans-serif" + EMOJI },
  { id: 'mono', name: 'Space Mono', stack: "'Space Mono', ui-monospace, monospace" + EMOJI },
  { id: 'playfair', name: 'Playfair', stack: "'Playfair Display Variable', 'Playfair Display', Georgia, serif" + EMOJI },
  { id: 'nunito', name: 'Nunito', stack: "'Nunito Variable', Nunito, ui-rounded, system-ui, sans-serif" + EMOJI },
  { id: 'shantell', name: 'Shantell', stack: "'Shantell Sans Variable', 'Shantell Sans', 'Comic Sans MS', cursive" + EMOJI },
]

export function fontStack(id: string) {
  const f = FONTS.filter((x) => x.id === id)[0]
  return f ? f.stack : FONTS[0].stack
}

export type Theme = {
  id: string; name: string; tier: string; sort_order: number
  bg: string; button_bg: string; button_text: string; button_border: string
  button_shadow: string; button_radius: string; accent_bg: string; accent_text: string
  icon_color: string; name_color: string; bio_color: string
}

export type LinkKind = 'link' | 'heading' | 'divider'

export type Link = {
  id: string; position: number
  // a heading has a title and no url; a divider has neither
  kind: LinkKind
  title: string | null; url: string | null
  is_active: boolean; is_primary: boolean; click_count: number
  favicon_url: string | null; site_title: string | null
  // a Pro thumbnail, which wins over the fetched favicon when present
  image_url: string | null
  // a Pro window; outside it the row is not on the page at all
  starts_at: string | null; ends_at: string | null
  // set on a Pro link that plays inline rather than sending the visitor away
  embed_kind: string | null
  // Bandcamp only: its player id is not in the address, so it is looked up once
  // when the link is added and kept here. Null for every other service, which
  // are worked out again at render from the URL.
  embed_src: string | null; embed_height: number | null
}

export type Social = {
  id: string; page_id: string; platform: string; url: string; position: number
}

export type Page = {
  id: string; username: string; display_name: string; bio: string
  avatar_url: string | null; theme_id: string; is_published: boolean
  // First frame of an animated avatar, shown under prefers-reduced-motion.
  // Null whenever the avatar is a still image.
  avatar_poster_url: string | null
  bg_image_url: string | null; font_family: string
  custom_bg: string | null; custom_button_bg: string | null
  custom_button_text: string | null; custom_accent_bg: string | null
  use_custom: boolean; show_branding: boolean
  seo_title: string | null; seo_desc: string | null
  // the email capture card, all Pro
  capture_on: boolean
  capture_heading: string | null; capture_button: string | null; capture_note: string | null
}

export function resolveLook(page: Page, theme: Theme | undefined) {
  const t: any = theme || {}
  const c = page.use_custom
  const bg = (c && page.custom_bg) || t.bg || '#F6F2FF'
  return {
    bg,
    buttonBg: (c && page.custom_button_bg) || t.button_bg || '#FFFFFF',
    buttonText: (c && page.custom_button_text) || t.button_text || '#1B0D44',
    buttonBorder: t.button_border || 'none',
    buttonShadow: t.button_shadow || 'none',
    buttonRadius: t.button_radius || '14px',
    accentBg: (c && page.custom_accent_bg) || t.accent_bg || '#C6F15C',
    accentText: t.accent_text || '#1B0D44',
    iconColor: t.icon_color || t.name_color || '#1B0D44',
    nameColor: t.name_color || '#1B0D44',
    bioColor: t.bio_color || 'rgba(27,13,68,.7)',
    bgImage: page.bg_image_url || null,
    // Four themes carry a tiled SVG inside their background shorthand. Those
    // tiles are meant to repeat at their own size; forcing cover over them
    // blows one doodle up to fill the screen. A photograph the owner uploaded
    // is the opposite case and does want cover.
    bgTiled: typeof bg === 'string' && bg.indexOf('url(') >= 0,
    font: fontStack(page.font_family || 'manrope'),
  }
}
