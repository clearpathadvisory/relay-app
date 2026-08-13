import type { Metadata } from 'next'
import { Blob } from '../blob'

export const metadata: Metadata = {
  title: 'Terms of Service — Relay',
  description: 'The terms that govern your use of Relay.',
}

export default function Terms() {
  return (
    <main style={{ background: 'var(--base)', minHeight: '100vh' }}>
      <div className="wrap" style={{ paddingTop: 24, paddingBottom: 70 }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <a href="/" style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.03em' }}>Relay</a>
          <a href="/login" className="btn small">Sign in</a>
        </nav>

        <div className="legal">
          <p className="legalkicker">Last updated 13 August 2026</p>
          <h1>Terms of Service</h1>
          <p className="legallede">
            These terms govern your use of Relay at relayme.bio. By creating an account you agree to
            them. If you do not, please do not use the service.
          </p>
          <p>
            Relay is operated by <strong>ClearPath Advisory</strong>, ul. Michała Kleofasa Ogińskiego
            11 lok. 9, 03-318 Warszawa, Poland, NIP 9512604332.
            Contact <a href="mailto:hello@relayme.bio">hello@relayme.bio</a>.
          </p>

          <h2>1. What Relay is</h2>
          <p>
            Relay gives you a single public page at relayme.bio/yourname holding as many links as you
            like, with your own photo, bio, social icons and choice of styling.
          </p>

          <h2>2. Your account</h2>
          <p>
            You need a working email address. Sign-in is passwordless: we email you a link each time.
            Anyone with access to your inbox can therefore access your account, so keep your email
            secure.
          </p>
          <p>You must be at least 16 years old. One person or organisation, one account. You are responsible for everything done through your account.</p>

          <h2>3. Your username</h2>
          <p>
            Usernames are first come, first served, and some are reserved. We may reclaim a username
            that impersonates somebody, infringes a trademark, or is used to deceive. Where we
            reasonably can, we will contact you first and give you a chance to respond.
          </p>

          <h2>4. Your content</h2>
          <p><strong>You own what you publish.</strong> Your links, text and images remain yours.</p>
          <p>
            You give us the limited permission needed to run the service: to store your content,
            display it on your public page, and show it in previews. This permission ends when you
            delete the content or your account.
          </p>
          <p>
            <strong>You are responsible for what you post.</strong> By publishing, you confirm you have
            the right to do so and that it does not infringe anyone else&rsquo;s rights.
          </p>

          <h2>5. What you may not do</h2>
          <p>Do not use Relay to publish or link to:</p>
          <ul>
            <li>material that is unlawful where you or your audience are</li>
            <li>content that infringes copyright, trademarks or other rights</li>
            <li>malware, phishing, or anything designed to deceive people into giving up credentials, money or personal data</li>
            <li>harassment, threats, or incitement to violence</li>
            <li>sexual content involving minors, or any child sexual abuse material</li>
            <li>fraudulent financial schemes, or impersonation of a person or business</li>
          </ul>
          <p>
            Nor may you attempt to break, overload or circumvent the service&rsquo;s technical limits,
            scrape it at scale, or resell it as your own.
          </p>
          <p>
            <strong>If you break these rules</strong> we may remove content, suspend or close your
            account. For serious cases — particularly anything involving harm to children, fraud or
            malware — we act immediately and without notice, and may report it to the authorities.
          </p>

          <h2>6. Plans and payment</h2>
          <p>
            <strong>Free</strong> costs nothing and needs no card. It includes unlimited links, your own
            photo and bio, a row of social icons, 5 themes, 1 font, automatic link titles and
            icons, tap statistics and a QR code.
          </p>
          <p>
            <strong>Pro</strong> unlocks all 40 themes, all 8 fonts, your own colours and a
            background image. It costs <strong>$30 a year</strong> or <strong>$4 a month</strong>.
          </p>
          <p>
            <strong>Trying Pro before you buy.</strong> Free accounts can switch on any Pro feature and
            see it live in the editor. Those settings are not saved — they are held in your browser
            only, and are lost if you clear your browser data or switch device. If you subscribe, they
            are applied to your page automatically when you return.
          </p>
          <p>
            Payment is handled by Stripe. Subscriptions <strong>renew automatically</strong> at the end
            of each term at the price then in effect, until you cancel. You can cancel at any time from
            the account panel in your dashboard. Cancelling stops the next charge; it does not refund
            the current period, and you keep Pro until the period ends.
          </p>
          <p>
            <strong>If your subscription ends,</strong> your page stays online and every link keeps
            working. Pro styling reverts: a Pro theme returns to the default, custom colours switch
            off, any background image is cleared and the font returns to Manrope. Your links, photo,
            bio and social icons are untouched.
          </p>
          <p>
            Prices are in US dollars and exclude any tax that applies where you live, which is added at
            checkout.
          </p>

          <h2>7. Your right to cancel a new subscription</h2>
          <p>
            If you are a consumer in the EU or UK, you have <strong>14 days</strong> from subscribing to
            withdraw without giving a reason. Email{' '}
            <a href="mailto:hello@relayme.bio">hello@relayme.bio</a> within that period and we will
            refund you.
          </p>
          <p>
            Because the service starts immediately, we may deduct a proportionate amount for the part
            of the period you have already used.
          </p>

          <h2>8. Availability</h2>
          <p>
            We work to keep Relay running but do not promise uninterrupted service. We may carry out
            maintenance, change features, or discontinue parts of the service.
          </p>
          <p>
            If we discontinue Relay entirely, we will give account holders at least{' '}
            <strong>30 days&rsquo; notice</strong>, provide a way to export your links, and refund the
            unused portion of any subscription.
          </p>

          <h2>9. Closing your account</h2>
          <p>
            You may close your account at any time from the account panel in your dashboard. Your page
            comes down and your data is deleted as described in the Privacy Policy.
          </p>
          <p>
            We may close your account for a breach of section 5, for non-payment, or if required by
            law. Except in serious cases we will give notice and, where an unused subscription period
            remains and the closure is not for a serious breach, refund it pro rata.
          </p>

          <h2>10. Liability</h2>
          <p>
            Nothing here limits liability for death or personal injury caused by negligence, for fraud,
            or for anything else that cannot be limited by law. Nothing here affects your statutory
            rights as a consumer.
          </p>
          <p>
            Subject to that: Relay is provided as it is; we are not liable for indirect or
            consequential loss, lost profits, or lost data beyond what we can restore from routine
            backups; and our total liability in any twelve-month period is limited to the greater of
            the amount you paid us in that period, or $50.
          </p>
          <p>We are not responsible for the content of websites your links point to.</p>

          <h2>11. Changes to these terms</h2>
          <p>
            We may update these terms. For material changes we will email account holders at least 14
            days before they take effect. Continuing to use Relay after that means you accept them. If
            you do not, close your account and we will refund any unused subscription period.
          </p>

          <h2>12. Law and disputes</h2>
          <p>
            These terms are governed by Polish law. If you are a consumer, you keep the protection of
            the mandatory laws of the country where you live, and you may bring proceedings there.
          </p>
          <p>
            Consumers may also use the European Commission&rsquo;s online dispute resolution platform,
            or in Poland approach a local consumer ombudsman (miejski rzecznik konsumentów).
          </p>
          <p>
            We would rather sort it out directly.
            Email <a href="mailto:hello@relayme.bio">hello@relayme.bio</a> first.
          </p>

          <div className="legalend">
            <Blob size={92} />
            <p>
              Something here unclear? <a href="mailto:hello@relayme.bio">hello@relayme.bio</a> — we
              would rather explain than argue.
            </p>
          </div>
        </div>

        <footer className="legalfoot">
          <a href="/">Home</a>
          <a href="/privacy">Privacy</a>
          <span>Relay is made by ClearPath Advisory.</span>
        </footer>
      </div>
    </main>
  )
}
