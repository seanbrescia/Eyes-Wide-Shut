import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 sm:px-6 pt-6 pb-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="glass-card p-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Terms of Service</h1>
        </div>

        <div className="glass-card p-6 sm:p-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
          <p className="text-xs text-muted-foreground">Last updated: February 2026</p>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Eyes Wide Shut application (&quot;Service&quot;), you agree to be bound by these
              Terms of Service. If you do not agree to these terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Eligibility</h2>
            <p>
              You must be at least 18 years old to create an account and use this Service. By using the Service,
              you represent that you meet this age requirement. Some venues and events listed may have additional
              age restrictions (21+).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials. You agree to
              provide accurate information when creating your account and to update it as needed. You are
              responsible for all activity that occurs under your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Ticket Purchases & RSVPs</h2>
            <p>
              Tickets and RSVPs purchased through the Service are subject to the policies of the individual
              venues and event organizers. Refund policies are determined by the event organizer. Eyes Wide Shut
              acts as a platform facilitating transactions and is not the event organizer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. VIP Reservations</h2>
            <p>
              VIP table reservations require a deposit. Minimum spend requirements and cancellation policies
              are set by individual venues. Deposits may be non-refundable depending on the venue&apos;s policy
              and timing of cancellation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Referral & Promoter Program</h2>
            <p>
              Users may earn referral points and commissions through our promoter program. Commission rates
              are determined by tier level and are subject to change. Payouts are processed according to our
              payout schedule. We reserve the right to suspend or terminate promoter accounts that engage in
              fraudulent or abusive referral activity.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">7. Venue Owners</h2>
            <p>
              Venue owners who list on the platform agree to provide accurate venue and event information.
              Venue owners are responsible for honoring tickets, RSVPs, and VIP reservations made through the
              platform. A platform fee applies to transactions processed through the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">8. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>Create fake accounts or provide false information</li>
              <li>Engage in fraudulent referral activity</li>
              <li>Resell tickets in violation of venue policies</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Scrape or collect data from the Service without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">9. Intellectual Property</h2>
            <p>
              All content, branding, and technology on the Service are owned by Eyes Wide Shut or its licensors.
              You may not copy, modify, or distribute our content without permission.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">10. Limitation of Liability</h2>
            <p>
              Eyes Wide Shut is a platform connecting users with venues and events. We are not responsible for
              the quality, safety, or legality of events, venues, or user interactions. The Service is provided
              &quot;as is&quot; without warranties of any kind. Our liability is limited to the amount you paid
              for the specific transaction in question.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">11. Termination</h2>
            <p>
              We may suspend or terminate your account at any time for violation of these terms or for any
              other reason at our discretion. You may delete your account at any time through the app settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">12. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. Continued use of the Service after changes
              constitutes acceptance of the updated terms. We will notify users of material changes via
              email or in-app notification.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">13. Contact</h2>
            <p>
              If you have questions about these terms, contact us at{' '}
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
