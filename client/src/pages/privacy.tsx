import { Link } from "wouter";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">

        <div className="mb-10">
          <Link href="/" className="text-sm text-[#f0c800] hover:underline mb-6 inline-block">← Back to DinoBane</Link>
          <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-sm text-zinc-500">Last updated: April 2026</p>
        </div>

        <div className="space-y-8 text-zinc-300 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Who We Are</h2>
            <p>DinoBane is an independent UK political commentary and news platform available at <strong className="text-white">dinobane.com</strong> and via the DinoBane Android app. We are operated by the DinoBane team. For any privacy-related enquiries, contact us at <a href="mailto:contact@realdinobane.com" className="text-[#f0c800] hover:underline">contact@realdinobane.com</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. What Data We Collect</h2>
            <p className="mb-3">We collect only what is necessary to provide our service:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-white">Account data:</strong> email address, display name, username, and password (stored as a secure hash) when you register.</li>
              <li><strong className="text-white">Payment data:</strong> subscription payments are processed by Stripe. We do not store your card details. Stripe's privacy policy applies to payment processing.</li>
              <li><strong className="text-white">Profile data:</strong> avatar image and any profile information you choose to provide.</li>
              <li><strong className="text-white">Community content:</strong> posts, replies, and direct messages you send within the members' area.</li>
              <li><strong className="text-white">Session data:</strong> a secure session cookie to keep you logged in for up to 30 days.</li>
              <li><strong className="text-white">Usage data:</strong> basic server logs (IP address, pages visited) for security and performance. These are not sold or shared.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>To provide and maintain your account and membership.</li>
              <li>To process subscription payments via Stripe.</li>
              <li>To send transactional emails (account verification, password reset, membership receipts).</li>
              <li>To send the DinoBane daily intel briefing email (members only — you may unsubscribe at any time).</li>
              <li>To detect and prevent fraud or abuse.</li>
            </ul>
            <p className="mt-3">We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Third-Party Services</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-white">Stripe</strong> — payment processing. <a href="https://stripe.com/privacy" className="text-[#f0c800] hover:underline" target="_blank" rel="noopener noreferrer">Stripe Privacy Policy</a></li>
              <li><strong className="text-white">Resend</strong> — transactional email delivery.</li>
              <li><strong className="text-white">Railway</strong> — cloud hosting infrastructure.</li>
              <li><strong className="text-white">YouTube</strong> — video content is embedded from the DinoBane YouTube channel. YouTube's privacy policy applies when you view videos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Cookies</h2>
            <p>We use a single session cookie to keep you logged in. We do not use tracking cookies, advertising cookies, or any third-party analytics cookies. No cookie consent banner is required as we only use strictly necessary cookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Your Rights</h2>
            <p className="mb-3">Under UK GDPR you have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your account and associated data.</li>
              <li>Cancel your membership subscription at any time from your profile page.</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, email <a href="mailto:contact@realdinobane.com" className="text-[#f0c800] hover:underline">contact@realdinobane.com</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Data Retention</h2>
            <p>We retain your account data for as long as your account is active. If you request deletion, we will remove your personal data within 30 days. Anonymised usage logs may be retained for up to 12 months for security purposes.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Children</h2>
            <p>DinoBane is intended for users aged 18 and over. We do not knowingly collect data from children under 13. If you believe a child has provided us with personal data, contact us at <a href="mailto:contact@realdinobane.com" className="text-[#f0c800] hover:underline">contact@realdinobane.com</a> and we will delete it promptly.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. Changes to This Policy</h2>
            <p>We may update this policy from time to time. Any significant changes will be communicated by email to registered members. Continued use of the platform after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. Contact</h2>
            <p>For any privacy questions or requests: <a href="mailto:contact@realdinobane.com" className="text-[#f0c800] hover:underline">contact@realdinobane.com</a></p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-[#1a1a1a] text-center text-xs text-zinc-600">
          © 2026 DinoBane. All rights reserved.
        </div>
      </div>
    </div>
  );
}
