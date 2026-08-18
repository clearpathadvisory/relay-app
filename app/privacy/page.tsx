import type { Metadata } from 'next'
import { Blob } from '../blob'

export const metadata: Metadata = {
  title: 'Privacy Policy', // layout template appends ' — RelayMe'
  description: 'What RelayMe does with personal data, and what you can ask us to do about it.',
}

export default function Privacy() {
  return (
    <main style={{ background: 'var(--base)', minHeight: '100vh' }}>
      <div className="wrap" style={{ paddingTop: 24, paddingBottom: 70 }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <a href="/" style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.03em' }}>RelayMe</a>
          <a href="/login" className="btn small">Sign in</a>
        </nav>

        <div className="legal">
          <p className="legalkicker">Last updated 15 August 2026</p>
          <h1>Privacy Policy</h1>
          <p className="legallede">
            This explains what RelayMe does with personal data. RelayMe is a link-in-bio service at
            relayme.bio, operated by ClearPath Advisory.
          </p>

          <h2>1. Who is responsible</h2>
          <p>
            <strong>ClearPath Advisory</strong><br />
            ul. Michała Kleofasa Ogińskiego 11 lok. 9, 03-318 Warszawa, Poland<br />
            NIP 9512604332<br />
            <a href="mailto:hello@relayme.bio">hello@relayme.bio</a>
          </p>
          <p>
            We have not appointed a Data Protection Officer, and are not required to, because we do
            not carry out large-scale monitoring or process special category data as a core activity.
            Write to the address above with any question about this policy.
          </p>

          <h2>2. Two kinds of people</h2>
          <p>This policy covers two groups, and they are treated differently:</p>
          <ul>
            <li><strong>Account holders</strong> — people who sign up and build a page.</li>
            <li><strong>Visitors</strong> — people who open somebody&rsquo;s public page at relayme.bio/name.</li>
          </ul>
          <p>Where a section applies to only one group, it says so.</p>

          <h2>3. What we collect from account holders</h2>
          <p>
            <strong>Your email address.</strong> Collected when you sign in. We use passwordless
            sign-in, so we never receive or store a password.
          </p>
          <p>
            <strong>The content of your page.</strong> Your username, display name, bio, links, social
            handles, chosen theme, fonts and colours, and any profile photo or background image you
            upload. All of this is content you choose to publish, and it is public by design once your
            page is live.
          </p>
          <p>
            <strong>Subscription details, if you pay.</strong> We store a Stripe customer reference,
            your plan, its status and its renewal date. <strong>We never see or store your card
            details</strong> — those go directly to Stripe and never touch our servers.
          </p>

          <h2>4. What we collect from visitors</h2>
          <p>When someone taps a link on a public page, we record:</p>
          <ul>
            <li>which link was tapped, and which page it belongs to</li>
            <li>the time of the tap</li>
            <li>whether the browser looks like a phone or a computer</li>
            <li>the referring website address, where the browser supplies one</li>
            <li>
              the country the request came from, as a two-letter code such as <strong>PL</strong> or{' '}
              <strong>US</strong>, supplied by our host. We store the code and nothing narrower — no
              city, no region, and no address. Page owners on a paid plan see a count of visits per
              country for their own page.
            </li>
          </ul>
          <p>
            We do <strong>not</strong> record IP addresses, device identifiers, names, or anything that
            identifies a visitor personally. We do not set cookies on visitors, and we do not build
            profiles, follow people between pages, or share this data with advertisers. Tap counts and
            country counts are shown only to the owner of the page in question, as totals — never as a
            list of individual visits.
          </p>

          <h2>5. Storage in your browser</h2>
          <p>
            RelayMe stores three things in your browser. None are advertising or analytics trackers, and
            all three are necessary for the service to work:
          </p>
          <ul>
            <li><strong>Your sign-in session</strong> — keeps you logged in, until you sign out.</li>
            <li><strong>relay.pending</strong> — holds Pro settings you are trying out, so they survive the trip through checkout. Cleared when applied or discarded.</li>
            <li><strong>relay.invite.seen</strong> — remembers you have dismissed the sign-up prompt, so we do not show it again.</li>
          </ul>
          <p>
            Because these are strictly necessary to provide a service you asked for, they fall within
            the exemption in Article 5(3) of the ePrivacy Directive and do not require consent. We tell
            you about them here rather than interrupting you with a banner. We have not added
            advertising, and we do not intend to. If we ever add anything that tracks you between
            sites or builds a profile, we will ask first.
          </p>

          <h2>6. Analytics on our own marketing pages</h2>
          <p>
            Our own pages — the home page, pricing, the blog, this page and the terms — use Vercel Web
            Analytics so we can see how many people visit and which pages they read. It records the
            page address, the referring site, and coarse device and country information. It sets no
            cookies, stores no identifier on your device, and does not follow you to other websites.
          </p>
          <p>
            Because it is cookieless and does not identify anyone, it does not require consent under
            Article 5(3), which is why you are reading this instead of dismissing a banner.
          </p>
          <p>
            <strong>It does not run on the pages our users publish.</strong> If you arrived here by
            opening someone&rsquo;s <span style={{ whiteSpace: 'nowrap' }}>relayme.bio/name</span>{' '}
            page, no analytics of ours ran on it. That is a deliberate line: creator pages carry our
            own counting and nothing belonging to anyone else.
          </p>

          <h2>7. Exporting and sharing what we hold</h2>
          <p>
            Page owners can download their own statistics — including the country breakdown described
            in section 4 — as a spreadsheet file. The export contains totals per country and nothing
            about individual visitors, because nothing about individual visitors exists to export.
          </p>
          <p>
            We can also export account records for our own administration and for answering the
            requests described in section 9. Those exports stay with us and are not shared with
            anyone else.
          </p>

          <h2>8. Why we are allowed to process this</h2>
          <table className="legaltable">
            <thead><tr><th>Purpose</th><th>Legal basis</th></tr></thead>
            <tbody>
              <tr><td>Running your account and publishing your page</td><td>Contract, Art. 6(1)(b)</td></tr>
              <tr><td>Sending sign-in links</td><td>Contract, Art. 6(1)(b)</td></tr>
              <tr><td>Taking payment and managing subscriptions</td><td>Contract, Art. 6(1)(b)</td></tr>
              <tr><td>Counting taps so page owners can see what works</td><td>Legitimate interests, Art. 6(1)(f)</td></tr>
              <tr><td>Keeping the service secure and preventing abuse</td><td>Legitimate interests, Art. 6(1)(f)</td></tr>
              <tr><td>Meeting accounting and tax obligations</td><td>Legal obligation, Art. 6(1)(c)</td></tr>
            </tbody>
          </table>
          <p>
            Where we rely on legitimate interests we have weighed those interests against your rights.
            Tap counting records no personal identifier, which is what makes that balance come out the
            way it does.
          </p>

          <h2>9. Who else is involved</h2>
          <p>We use a small number of processors, each handling data only on our instructions.</p>
          <table className="legaltable">
            <thead><tr><th>Provider</th><th>What they do</th><th>Where</th></tr></thead>
            <tbody>
              <tr><td>Supabase</td><td>Database, authentication, file storage</td><td>EU (Frankfurt)</td></tr>
              <tr><td>Vercel</td><td>Website hosting and delivery, and cookieless analytics on our own marketing pages only</td><td>US, edge worldwide</td></tr>
              <tr><td>Stripe</td><td>Payment processing</td><td>EU and US</td></tr>
              <tr><td>Resend</td><td>Sending email</td><td>US</td></tr>
            </tbody>
          </table>
          <p>
            Transfers outside the EEA are covered by the European Commission&rsquo;s Standard
            Contractual Clauses, and where applicable the EU–US Data Privacy Framework.
          </p>
          <p>
            <strong>If you give a RelayMe page your email address.</strong> Some pages carry a card
            asking for one. That address belongs to the person whose page it is, not to us &mdash;
            they decide what to send you and they are responsible for it. We store it for them,
            send you one message to check the address is really yours, and store nothing at all
            until you click the link in it. Every message includes a way to leave, and leaving
            deletes the address rather than marking it. RelayMe itself will never email you.
          </p>
          <p>
            <strong>Links that play on a page.</strong> A Pro account can set a YouTube, Spotify or
            SoundCloud link to play where it stands rather than sending you elsewhere. Until you
            press play, nothing is requested from any of them &mdash; the card you see is drawn by
            us, from the page&rsquo;s own colours. Press play and the player loads from that
            company, which is the moment your browser first contacts them and the point at which
            their own terms and cookies apply, not ours. YouTube is loaded through its
            no-cookie domain.
          </p>
          <p>
            <strong>Counting a visit.</strong> When someone opens a RelayMe page or taps a link, we
            record the event so the page&rsquo;s owner can see how it is doing. To avoid counting the
            same person over and over, we take a one-way hash of their IP address, keep only the
            hash, and delete it within a few hours. The address itself is never stored, and the hash
            cannot be turned back into one.
          </p>
          <p>
            <strong>Fonts are served from our own servers,</strong> not from a font network, so
            loading a RelayMe page does not reveal your IP address to any third party for typography.
          </p>
          <p>
            <strong>One exception.</strong> Where a link&rsquo;s own website does not publish an icon,
            we fall back to Google&rsquo;s favicon service for that small image. Your browser fetches
            it directly, so Google receives your IP address for that request. It happens only on pages
            containing such a link, and only for the icon.
          </p>

          <h2>10. How long we keep it</h2>
          <ul>
            <li><strong>Account and page data</strong> — for as long as your account exists.</li>
            <li><strong>After you delete your account</strong> — removed within 30 days, other than anything we must keep for tax or accounting.</li>
            <li><strong>Tap records</strong> — 24 months, then deleted.</li>
            <li><strong>Payment records</strong> — 5 years from the end of the relevant tax year, as Polish accounting law requires.</li>
          </ul>

          <h2>11. Your rights</h2>
          <p>Under the GDPR you may ask us to:</p>
          <ul>
            <li>give you a copy of your data (<strong>access</strong>)</li>
            <li>correct anything wrong (<strong>rectification</strong>)</li>
            <li>delete your data (<strong>erasure</strong>)</li>
            <li>pause processing while a dispute is resolved (<strong>restriction</strong>)</li>
            <li>hand your data to you or another provider (<strong>portability</strong>)</li>
            <li>stop processing based on legitimate interests (<strong>objection</strong>)</li>
          </ul>
          <p>
            Write to <a href="mailto:hello@relayme.bio">hello@relayme.bio</a>. We reply within one
            month, at no charge unless a request is clearly unfounded or repetitive.
          </p>
          <p>
            Most of this you can do yourself. Edit or delete any link, page or image from your
            dashboard, and delete your whole account from the account panel there.
          </p>
          <p>
            <strong>If we get it wrong,</strong> you can complain to the Polish supervisory authority:
            Prezes Urzędu Ochrony Danych Osobowych (UODO), ul. Stawki 2, 00-193 Warszawa,
            uodo.gov.pl. You may also complain to the authority where you live or work.
          </p>

          <h2>12. Security</h2>
          <p>
            Access is enforced at the database level by row-level security, so one account cannot read
            another&rsquo;s private data even if the application layer were to fail. Card details never
            reach our servers. Administrative credentials are used only in server-side code and are
            never exposed to browsers.
          </p>
          <p>
            No system is perfect. If a breach occurs that is likely to risk your rights, we will notify
            the supervisory authority within 72 hours and tell you directly where the risk is high.
          </p>

          <h2>13. Children</h2>
          <p>
            RelayMe is not intended for children under 16 and we do not knowingly create accounts for
            them. If you believe a child has signed up, write to us and we will delete the account.
          </p>

          <h2>14. Changes</h2>
          <p>
            If we change this policy in a way that affects you, we will email account holders before it
            takes effect. The date at the top always shows the current version.
          </p>

          <div className="legalend">
            <Blob size={92} />
            <p>
              Questions about any of this? <a href="mailto:hello@relayme.bio">hello@relayme.bio</a> —
              a person reads it.
            </p>
          </div>
        </div>

        <footer className="legalfoot">
          <a href="/">Home</a>
          <a href="/terms">Terms</a>
          <span>RelayMe is made by ClearPath Advisory.</span>
        </footer>
      </div>
    </main>
  )
}
