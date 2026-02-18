import { resend, FROM_EMAIL } from './resend'

export async function sendPromoterApprovedEmail(email: string, name: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'You\'re Approved as a Promoter! 🎉',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0f; color: #ffffff; padding: 40px 24px; border-radius: 12px;">
          <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 8px;">
            Congratulations, ${name}!
          </h1>
          <p style="color: #a1a1aa; font-size: 16px; margin-bottom: 32px;">
            Your promoter application has been approved.
          </p>

          <div style="background-color: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 24px; margin-bottom: 32px;">
            <p style="color: #4ade80; font-weight: 600; margin: 0 0 8px 0;">You're now an approved promoter</p>
            <p style="color: #a1a1aa; margin: 0; font-size: 14px;">
              Share your referral links and start earning cash commissions on every successful referral.
            </p>
          </div>

          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 16px; text-transform: uppercase; letter-spacing: 0.1em; color: #a1a1aa; margin-bottom: 16px;">Commission Tiers</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;">
                  <div style="color: #a1a1aa; font-size: 12px; text-transform: uppercase;">Bronze</div>
                  <div style="color: #a855f7; font-size: 24px; font-weight: bold;">5%</div>
                </td>
                <td style="padding: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
                  <div style="color: #a1a1aa; font-size: 12px; text-transform: uppercase;">Silver</div>
                  <div style="color: #a855f7; font-size: 24px; font-weight: bold;">7.5%</div>
                </td>
                <td style="padding: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
                  <div style="color: #a1a1aa; font-size: 12px; text-transform: uppercase;">Gold</div>
                  <div style="color: #a855f7; font-size: 24px; font-weight: bold;">10%</div>
                </td>
                <td style="padding: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
                  <div style="color: #a1a1aa; font-size: 12px; text-transform: uppercase;">Platinum</div>
                  <div style="color: #a855f7; font-size: 24px; font-weight: bold;">15%</div>
                </td>
              </tr>
            </table>
          </div>

          <a href="https://eyeswsapp.com/promote" style="display: inline-block; background-color: #a855f7; color: #ffffff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px;">
            View Promoter Dashboard
          </a>

          <p style="color: #52525b; font-size: 12px; margin-top: 40px;">
            Eyes Wide Shut
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('[Email] Failed to send promoter approved email:', error)
  }
}

export async function sendPromoterRejectedEmail(email: string, name: string, reason: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Promoter Application Update',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0f; color: #ffffff; padding: 40px 24px; border-radius: 12px;">
          <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 8px;">
            Hi ${name},
          </h1>
          <p style="color: #a1a1aa; font-size: 16px; margin-bottom: 32px;">
            Thank you for your interest in becoming a promoter with Eyes Wide Shut.
          </p>

          <div style="background-color: rgba(225, 29, 72, 0.1); border: 1px solid rgba(225, 29, 72, 0.3); border-radius: 12px; padding: 24px; margin-bottom: 32px;">
            <p style="color: #fb7185; font-weight: 600; margin: 0 0 8px 0;">Application Not Approved</p>
            <p style="color: #a1a1aa; margin: 0; font-size: 14px;">
              ${reason}
            </p>
          </div>

          <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 32px;">
            You're welcome to re-apply at any time with updated information.
          </p>

          <a href="https://eyeswsapp.com/promote" style="display: inline-block; background-color: #a855f7; color: #ffffff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px;">
            Re-Apply
          </a>

          <p style="color: #52525b; font-size: 12px; margin-top: 40px;">
            Eyes Wide Shut
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('[Email] Failed to send promoter rejected email:', error)
  }
}
