// Transactional email. Everything here fails quietly: if the key is missing or
// Resend is down, the action the user asked for still succeeds.

const FROM = process.env.RESEND_FROM || 'Relay <hello@relayme.bio>'

export async function sendMail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY
  if (!key || !to) return false
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    })
    return res.ok
  } catch (e) {
    return false
  }
}

// --- shared shell so every message looks like the same company wrote it ---

function shell(heading: string, body: string, footer?: string) {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#FBFAF9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBFAF9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #EFEAF7;border-radius:22px;overflow:hidden;">
        <tr><td style="padding:26px 30px 0;">
          <span style="font:800 21px/1 -apple-system,'Segoe UI',Manrope,Arial,sans-serif;color:#1B0D44;letter-spacing:-0.5px;">Relay</span>
        </td></tr>
        <tr><td style="padding:18px 30px 0;">
          <h1 style="margin:0 0 12px;font:800 24px/1.25 -apple-system,'Segoe UI',Manrope,Arial,sans-serif;color:#1B0D44;letter-spacing:-0.6px;">${heading}</h1>
        </td></tr>
        <tr><td style="padding:0 30px 26px;font:400 15px/1.6 -apple-system,'Segoe UI',Manrope,Arial,sans-serif;color:#3A2B63;">
          ${body}
        </td></tr>
        <tr><td style="padding:18px 30px 24px;border-top:1px solid #F1EDF8;font:400 12.5px/1.6 -apple-system,'Segoe UI',Manrope,Arial,sans-serif;color:#6B5FA8;">
          ${footer || 'Relay is made by ClearPath Advisory. You are getting this because you have a Relay account.'}
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font:400 12px/1.5 -apple-system,'Segoe UI',Manrope,Arial,sans-serif;color:#8A80AE;">relayme.bio</p>
    </td></tr>
  </table>
</body></html>`
}

function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 6px;">
    <tr><td style="background:#1B0D44;border-radius:12px;">
      <a href="${href}" style="display:inline-block;padding:14px 26px;font:600 15px/1 -apple-system,'Segoe UI',Manrope,Arial,sans-serif;color:#ffffff;text-decoration:none;">${label}</a>
    </td></tr>
  </table>`
}

// --- the messages themselves ---

export function accountClosedEmail(username: string) {
  return shell(
    'Your Relay account is closed',
    `<p style="margin:0 0 14px;">Your account has been deleted, and so has everything in it: your page at
      <strong>relayme.bio/${username}</strong>, your links, your photo and your tap history.
      The page now shows as unavailable to anyone who visits it.</p>
     <p style="margin:0 0 14px;">Any subscription you had has been cancelled. You will not be charged again.</p>
     <p style="margin:0 0 14px;">Your username is back in the pool, so somebody else may claim it. If you
      change your mind and it is still free, you can sign up again and take it.</p>
     <p style="margin:0;">Thanks for trying Relay. If something drove you away, we would genuinely like to
      know — just reply to this message.</p>`,
    'This is the last email we will send you. Some records are kept where accounting law requires it, as set out in our privacy policy.'
  )
}

export function subscriptionCancelledEmail(endsOn: string | null) {
  const until = endsOn
    ? `You keep Pro until <strong>${endsOn}</strong>. Nothing changes before then.`
    : 'Your Pro features have now ended.'
  return shell(
    'Your Pro subscription is cancelled',
    `<p style="margin:0 0 14px;">We have cancelled your Relay Pro subscription, so it will not renew.
      ${until}</p>
     <p style="margin:0 0 14px;"><strong>Your page stays online and every link keeps working.</strong>
      Nothing you have published disappears.</p>
     <p style="margin:0 0 14px;">When Pro ends, the styling reverts: a Pro theme returns to the default,
      custom colours switch off, any background image is cleared, and the font goes back to Manrope.
      Your links, photo, bio and social icons are untouched.</p>
     <p style="margin:0;">Changed your mind? You can resubscribe any time and pick your look straight back up.</p>
     ${button('https://relayme.bio/dashboard', 'Open your dashboard')}`
  )
}

export function subscriptionEndedEmail() {
  return shell(
    'Your Pro features have ended',
    `<p style="margin:0 0 14px;">Your Relay Pro period has finished and your account is back on the free plan.</p>
     <p style="margin:0 0 14px;"><strong>Your page is still live</strong> and all your links still work.
      Unlimited links, your photo, your bio, social icons, tap counts and your QR code all stay with you.</p>
     <p style="margin:0;">The Pro styling has reverted to the default theme and font. Resubscribe whenever
      you like and it takes about a minute to set back up.</p>
     ${button('https://relayme.bio/dashboard', 'Back to your page')}`
  )
}

// --- email capture ---

export function confirmSubscriptionEmail(pageName: string, pageUrl: string, confirmUrl: string) {
  return shell(
    'Confirm you want ' + pageName + '&rsquo;s emails',
    `<p style="margin:0 0 14px;">Someone entered this address on <a href="${pageUrl}" style="color:#7C5CE6;">${pageUrl}</a>.</p>
     <p style="margin:0 0 20px;">If that was you, confirm below and ${pageName} will be able to email you. If it was not you, ignore this and nothing happens &mdash; we will not store your address.</p>
     <p style="margin:0 0 8px;"><a href="${confirmUrl}" style="display:inline-block;background:#1B0D44;color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:12px;font-weight:600;">Yes, confirm</a></p>`,
    'Relay sent this on behalf of ' + pageName + '. Relay does not email you itself, and you can leave at any time from any message they send.'
  )
}

export function paymentFailedEmail(willRetry: boolean) {
  return shell(
    'Your payment did not go through',
    `<p style="margin:0 0 14px;">Your card was declined, so this month&rsquo;s Relay payment has not gone through.</p>
     <p style="margin:0 0 14px;"><strong>Your page is still live and nothing has changed.</strong> ${
       willRetry
         ? 'We will try the card again over the next few days.'
         : 'This was the last attempt, so your subscription will end shortly and your page will go back to the free look.'
     }</p>
     <p style="margin:0 0 8px;"><a href="https://relayme.bio/dashboard" style="display:inline-block;background:#1B0D44;color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:12px;font-weight:600;">Update my card</a></p>`,
    'Your links, photo, bio and statistics are kept whatever happens to the subscription.'
  )
}

// --- the four moments that had no message ---

export function welcomeEmail(username: string) {
  const url = 'https://relayme.bio/' + username
  return shell(
    'relayme.bio/' + username + ' is yours',
    `<p style="margin:0 0 14px;">That name is claimed and your page is live. Anyone with the address can
      open it right now, so it is worth putting something on it before you hand it out.</p>
     <p style="margin:0 0 6px;"><strong>Three things worth doing first</strong></p>
     <ol style="margin:0 0 14px;padding-left:20px;">
       <li style="margin-bottom:6px;">Add a photo and a line about yourself. The line matters more than
         you think — it is what shows up when somebody sends your link to a friend.</li>
       <li style="margin-bottom:6px;">Add your links. Paste the address and we read the title from the
         site, so you rarely have to type one.</li>
       <li>Star the one that matters most. It becomes the big button.</li>
     </ol>
     ${button(url, 'See my page')}
     <p style="margin:16px 0 0;">There is no trial running and no card on file. The free plan stays free.</p>`,
    'You are getting this because you claimed a name on Relay. Reply to this message if anything is unclear — a person reads it.'
  )
}

export function upgradedEmail(interval: 'month' | 'year', renewsOn: string | null) {
  return shell(
    'You are on Relay Pro',
    `<p style="margin:0 0 14px;">Payment received, and everything is unlocked: all 47 themes, all 8 fonts,
      your own colours and background, images on individual links, scheduled links, players that work on
      the page, email capture, and the Relay badge gone if you want it gone.</p>
     <p style="margin:0 0 14px;">You are paying <strong>${interval === 'month' ? '$4 a month' : '$30 a year'}</strong>
      plus VAT${renewsOn ? ', and it renews on <strong>' + renewsOn + '</strong>' : ''}. Cancel whenever you
      like from Account — your page stays online either way, it just goes back to the free look.</p>
     ${button('https://relayme.bio/dashboard', 'Go and use it')}
     <p style="margin:16px 0 0;">Your invoice is in the billing portal, linked from the Account tab.</p>`,
    'Relay is made by ClearPath Advisory, NIP 9512604332, Warsaw, Poland.'
  )
}

export function pageOfflineEmail(username: string) {
  return shell(
    'Your page is offline',
    `<p style="margin:0 0 14px;"><strong>relayme.bio/${username}</strong> now returns a not-found page to
      anyone who visits, and it has dropped out of our sitemap so search engines will stop showing it.</p>
     <p style="margin:0 0 14px;">Nothing has been deleted. Your links, photo, bio, icons, statistics and
      the name itself are all exactly where you left them, and the username stays yours while the account
      exists.</p>
     <p style="margin:0 0 14px;">Put it back whenever you want — one switch in Account.</p>
     ${button('https://relayme.bio/dashboard', 'Put it back online')}
     <p style="margin:16px 0 0;">If you meant to close the account rather than hide the page, that is a
      different button, and it does delete everything.</p>`,
    'We are sending this so nobody discovers by accident that their page has been down for a fortnight.'
  )
}

export function firstSubscriberEmail(pageName: string) {
  return shell(
    'Somebody joined your list',
    `<p style="margin:0 0 14px;">The first confirmed subscriber on <strong>${pageName}</strong>. They
      entered their address on your page and then clicked the link we emailed them, so they meant it.</p>
     <p style="margin:0 0 14px;">The list is yours. Download it as a CSV whenever you like and take it
      wherever you go — we do not hold it hostage and we never email anyone on it ourselves.</p>
     ${button('https://relayme.bio/dashboard', 'See the list')}
     <p style="margin:16px 0 0;">One thing worth remembering: those are other people&rsquo;s addresses, so
      the law treats you as responsible for them. Send only what they signed up for, put a way out in
      every message, and delete anyone who asks.</p>`,
    'We send this once, for the first one. After that the count lives in your dashboard.'
  )
}
