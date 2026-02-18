import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 sm:px-6 pt-6 pb-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="glass-card p-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Privacy Policy</h1>
        </div>

        <div className="glass-card p-6 sm:p-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
          <p className="text-xs text-muted-foreground">Last updated: February 2026</p>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Information We Collect</h2>
            <p className="mb-2">We collect information you provide directly:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="text-white">Account information:</span> name, email, date of birth, phone number</li>
              <li><span className="text-white">Profile information:</span> avatar photo, social media handles</li>
              <li><span className="text-white">Transaction data:</span> ticket purchases, VIP reservations, payment information</li>
              <li><span className="text-white">Venue data:</span> venue details, event information (for venue owners)</li>
              <li><span className="text-white">Promoter data:</span> application details, referral activity, commission history</li>
            </ul>
            <p className="mt-3 mb-2">We automatically collect:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="text-white">Device information:</span> browser type, operating system</li>
              <li><span className="text-white">Usage data:</span> pages visited, features used, interaction timestamps</li>
              <li><span className="text-white">Location data:</span> approximate location for nearby venue discovery (with your permission)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide and improve the Service</li>
              <li>Process ticket purchases and VIP reservations</li>
              <li>Track referrals and calculate promoter commissions</li>
              <li>Send transactional emails (ticket confirmations, password resets)</li>
              <li>Show you nearby venues and relevant events</li>
              <li>Send push notifications (with your permission)</li>
              <li>Prevent fraud and ensure platform security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Information Sharing</h2>
            <p className="mb-2">We share your information with:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="text-white">Venue owners:</span> your name and ticket information when you RSVP or purchase tickets</li>
              <li><span className="text-white">Payment processors:</span> Stripe processes all payments; we do not store full card numbers</li>
              <li><span className="text-white">Service providers:</span> hosting (Vercel), database (Supabase), email (Resend)</li>
            </ul>
            <p className="mt-2">We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Data Storage & Security</h2>
            <p>
              Your data is stored securely using Supabase with row-level security policies. Passwords are
              hashed and never stored in plain text. Payment information is handled by Stripe and never
              touches our servers. We use HTTPS for all data transmission.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Your Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="text-white">Access:</span> request a copy of your personal data</li>
              <li><span className="text-white">Correction:</span> update inaccurate information in your profile</li>
              <li><span className="text-white">Deletion:</span> request deletion of your account and associated data</li>
              <li><span className="text-white">Portability:</span> receive your data in a machine-readable format</li>
              <li><span className="text-white">Opt-out:</span> unsubscribe from marketing emails and disable push notifications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Cookies & Local Storage</h2>
            <p>
              We use essential cookies for authentication and session management. We use local storage
              to save referral codes and user preferences. We do not use third-party tracking cookies
              or advertising pixels.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">7. Push Notifications</h2>
            <p>
              You may opt in to push notifications for event updates and venue announcements. You can
              disable notifications at any time through your browser or device settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">8. Age Requirement</h2>
            <p>
              The Service is not intended for users under 18 years of age. We do not knowingly collect
              personal information from anyone under 18. If we learn that we have collected data from
              a minor, we will promptly delete it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">9. Data Retention</h2>
            <p>
              We retain your account data as long as your account is active. Transaction records are
              kept for 7 years for tax and legal purposes. You may request deletion of your account
              at any time, and we will remove your personal data within 30 days, except where
              retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">10. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. We will notify you of material changes via
              email or in-app notification. Continued use of the Service after changes constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">11. Contact</h2>
            <p>
              For privacy-related questions or data requests, contact us at{' '}
              <a href="mailto:contact@eyeswideshut.com" className="text-primary hover:underline">
                contact@eyeswideshut.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
