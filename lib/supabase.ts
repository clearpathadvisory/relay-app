import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = 'https://fhwxxobzeqiypgeazdub.supabase.co'
export const SUPABASE_KEY = 'sb_publishable_m2DfAN9JaegsoNBVDwEsFQ_VIW4XNYL'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { detectSessionInUrl: true, persistSession: true, autoRefreshToken: true, flowType: 'implicit' },
})

export function serverClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
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

export type Link = {
  id: string; title: string; url: string; position: number
  is_active: boolean; is_primary: boolean; click_count: number
  favicon_url: string | null; site_title: string | null
}

export type Social = {
  id: string; page_id: string; platform: string; url: string; position: number
}

export type Page = {
  id: string; username: string; display_name: string; bio: string
  avatar_url: string | null; theme_id: string; is_published: boolean
  bg_image_url: string | null; font_family: string
  custom_bg: string | null; custom_button_bg: string | null
  custom_button_text: string | null; custom_accent_bg: string | null
  use_custom: boolean; show_branding: boolean
}

export function resolveLook(page: Page, theme: Theme | undefined) {
  const t: any = theme || {}
  const c = page.use_custom
  return {
    bg: (c && page.custom_bg) || t.bg || '#F6F2FF',
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
    font: fontStack(page.font_family || 'manrope'),
  }
}
