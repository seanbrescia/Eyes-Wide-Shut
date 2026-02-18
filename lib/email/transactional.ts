import { resend, FROM_EMAIL } from './resend'
import { emailWrapper, buttonStyle, alertBox } from './templates'

// ============================================
// TICKET / RSVP EMAILS
// ============================================

export async function sendTicketConfirmationEmail(
  email: string,
  name: string,
  eventName: string,
  venueName: string,
  eventDate: string,
  confirmationCode: string,
  quantity: number,
  amountPaid: number
) {
  try {
    const formattedDate = new Date(eventDate + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Ticket Confirmed: ${eventName}`,
      html: emailWrapper(`
        <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 8px;">
          You're in, ${name || 'there'}!
        </h1>
        <p style="color: #a1a1aa; font-size: 16px; margin-bottom: 32px;">
          Your ticket${quantity > 1 ? 's have' : ' has'} been confirmed.
        </p>

        ${alertBox('green', 'Ticket Confirmed', `${quantity}x ticket${quantity > 1 ? 's' : ''} for ${eventName}`)}

        <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 32px;">
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="color: #71717a; padding: 8px 0;">Event</td>
              <td style="color: #ffffff; text-align: right; padding: 8px 0;">${eventName}</td>
            </tr>
            <tr>
              <td style="color: #71717a; padding: 8px 0;">Venue</td>
              <td style="color: #ffffff; text-align: right; padding: 8px 0;">${venueName}</td>
            </tr>
            <tr>
              <td style="color: #71717a; padding: 8px 0;">Date</td>
              <td style="color: #ffffff; text-align: right; padding: 8px 0;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="color: #71717a; padding: 8px 0;">Quantity</td>
              <td style="color: #ffffff; text-align: right; padding: 8px 0;">${quantity}</td>
            </tr>
            <tr>
              <td style="color: #71717a; padding: 8px 0;">Amount Paid</td>
              <td style="color: #ffffff; text-align: right; padding: 8px 0;">$${amountPaid.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="color: #71717a; padding: 8px 0;">Confirmation</td>
              <td style="color: #a855f7; text-align: right; padding: 8px 0; font-weight: 600; letter-spacing: 0.05em;">${confirmationCode}</td>
            </tr>
          </table>
        </div>

        <a href="https://eyeswsapp.com/tickets" style="${buttonStyle()}">
          View Your Tickets
        </a>

        <p style="color: #71717a; font-size: 12px; margin-top: 24px;">
          Show your QR code at the door for entry. You can find it in the app under "My Tickets".
        </p>
      `),
    })
  } catch (error) {
    console.error('[Email] Failed to send ticket confirmation:', error)
  }
}

export async function sendRSVPConfirmationEmail(
  email: string,
  name: string,
  eventName: string,
  venueName: string,
  eventDate: string
) {
  try {
    const formattedDate = new Date(eventDate + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `RSVP Confirmed: ${eventName}`,
      html: emailWrapper(`
        <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 8px;">
          You're on the list, ${name || 'there'}!
        </h1>
        <p style="color: #a1a1aa; font-size: 16px; margin-bottom: 32px;">
          Your RSVP has been confirmed.
        </p>

        ${alertBox('green', 'RSVP Confirmed', eventName)}

        <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 32px;">
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="color: #71717a; padding: 8px 0;">Event</td>
              <td style="color: #ffffff; text-align: right; padding: 8px 0;">${eventName}</td>
            </tr>
            <tr>
              <td style="color: #71717a; padding: 8px 0;">Venue</td>
              <td style="color: #ffffff; text-align: right; padding: 8px 0;">${venueName}</td>
            </tr>
            <tr>
              <td style="color: #71717a; padding: 8px 0;">Date</td>
              <td style="color: #ffffff; text-align: right; padding: 8px 0;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="color: #71717a; padding: 8px 0;">Price</td>
              <td style="color: #4ade80; text-align: right; padding: 8px 0; font-weight: 600;">Free</td>
            </tr>
          </table>
        </div>

        <a href="https://eyeswsapp.com/tickets" style="${buttonStyle()}">
          View Your Tickets
        </a>
      `),
    })
  } catch (error) {
    console.error('[Email] Failed to send RSVP confirmation:', error)
  }
}

// ============================================
// EVENT CANCELLATION EMAILS
// ============================================

export async function sendEventCancelledEmail(
  email: string,
  name: string,
  eventName: string,
  venueName: string,
  eventDate: string,
  wasPaid: boolean,
  amountRefunded: number
) {
  try {
    const formattedDate = new Date(eventDate + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    const refundSection = wasPaid
      ? `
        ${alertBox('green', 'Refund Processed', `$${amountRefunded.toFixed(2)} will be returned to your original payment method within 5-10 business days.`)}
      `
      : ''

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Event Cancelled: ${eventName}`,
      html: emailWrapper(`
        <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 8px;">
          Event Cancelled
        </h1>
        <p style="color: #a1a1aa; font-size: 16px; margin-bottom: 32px;">
          We're sorry, ${name || 'there'}. The following event has been cancelled by the venue.
        </p>

        ${alertBox('red', 'Cancelled', `${eventName} at ${venueName} on ${formattedDate}`)}

        ${refundSection}

        <a href="https://eyeswsapp.com/explore" style="${buttonStyle()}">
          Find Other Events
        </a>
      `),
    })
  } catch (error) {
    console.error('[Email] Failed to send event cancelled email:', error)
  }
}

// ============================================
// VIP RESERVATION EMAILS
// ============================================

export async function sendVIPConfirmationEmail(
  email: string,
  name: string,
  venueName: string,
  packageName: string,
  date: string,
  partySize: number,
  depositAmount: number,
  confirmationCode: string
) {
  try {
    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `VIP Reservation Confirmed: ${venueName}`,
      html: emailWrapper(`
        <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 8px;">
          VIP Confirmed
        </h1>
        <p style="color: #a1a1aa; font-size: 16px; margin-bottom: 32px;">
          Your VIP reservation is locked in, ${name || 'there'}.
        </p>

        ${alertBox('purple', 'VIP Reservation', `${packageName} at ${venueName}`)}

        <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 32px;">
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="color: #71717a; padding: 8px 0;">Venue</td>
              <td style="color: #ffffff; text-align: right; padding: 8px 0;">${venueName}</td>
            </tr>
            <tr>
              <td style="color: #71717a; padding: 8px 0;">Package</td>
              <td style="color: #ffffff; text-align: right; padding: 8px 0;">${packageName}</td>
            </tr>
            <tr>
              <td style="color: #71717a; padding: 8px 0;">Date</td>
              <td style="color: #ffffff; text-align: right; padding: 8px 0;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="color: #71717a; padding: 8px 0;">Party Size</td>
              <td style="color: #ffffff; text-align: right; padding: 8px 0;">${partySize} guests</td>
            </tr>
            <tr>
              <td style="color: #71717a; padding: 8px 0;">Deposit Paid</td>
              <td style="color: #ffffff; text-align: right; padding: 8px 0;">$${depositAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="color: #71717a; padding: 8px 0;">Confirmation</td>
              <td style="color: #a855f7; text-align: right; padding: 8px 0; font-weight: 600; letter-spacing: 0.05em;">${confirmationCode}</td>
            </tr>
          </table>
        </div>

        <a href="https://eyeswsapp.com/vip" style="${buttonStyle()}">
          View Reservation
        </a>

        <p style="color: #71717a; font-size: 12px; margin-top: 24px;">
          Please arrive on time. Your table will be held for 30 minutes past your reservation time.
        </p>
      `),
    })
  } catch (error) {
    console.error('[Email] Failed to send VIP confirmation:', error)
  }
}

// ============================================
// WELCOME EMAIL
// ============================================

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Welcome to Eyes Wide Shut',
      html: emailWrapper(`
        <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 8px;">
          Welcome, ${name || 'there'}!
        </h1>
        <p style="color: #a1a1aa; font-size: 16px; margin-bottom: 32px;">
          You're officially part of the scene. Here's what you can do:
        </p>

        <div style="margin-bottom: 32px;">
          <div style="display: flex; margin-bottom: 16px;">
            <div style="color: #a855f7; font-size: 20px; font-weight: bold; margin-right: 16px; min-width: 30px;">1</div>
            <div>
              <p style="color: #ffffff; font-weight: 600; margin: 0 0 4px 0;">Discover Events</p>
              <p style="color: #a1a1aa; margin: 0; font-size: 14px;">Browse tonight's hottest events and venues near you.</p>
            </div>
          </div>
          <div style="display: flex; margin-bottom: 16px;">
            <div style="color: #a855f7; font-size: 20px; font-weight: bold; margin-right: 16px; min-width: 30px;">2</div>
            <div>
              <p style="color: #ffffff; font-weight: 600; margin: 0 0 4px 0;">Get Tickets</p>
              <p style="color: #a1a1aa; margin: 0; font-size: 14px;">RSVP to free events or buy tickets instantly.</p>
            </div>
          </div>
          <div style="display: flex; margin-bottom: 16px;">
            <div style="color: #a855f7; font-size: 20px; font-weight: bold; margin-right: 16px; min-width: 30px;">3</div>
            <div>
              <p style="color: #ffffff; font-weight: 600; margin: 0 0 4px 0;">Earn Rewards</p>
              <p style="color: #a1a1aa; margin: 0; font-size: 14px;">Refer friends and earn points for free perks.</p>
            </div>
          </div>
        </div>

        <a href="https://eyeswsapp.com/explore" style="${buttonStyle()}">
          Start Exploring
        </a>
      `),
    })
  } catch (error) {
    console.error('[Email] Failed to send welcome email:', error)
  }
}
