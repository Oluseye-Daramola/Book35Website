// Email service using Brevo's HTTP API.
// Uses fetch (built into Node 18+), so no extra package is needed.
// Sends over HTTPS, which works on Render's free tier (SMTP ports are blocked there).
//
// Required environment variables:
//   BREVO_API_KEY   - from Brevo: SMTP & API -> API Keys
//   SENDER_EMAIL    - a sender you verified in Brevo (e.g. app@gmail.com)
// Optional:
//   SENDER_NAME     - display name shown to recipients (default: Appointment Booking)
//   APP_TIMEZONE    - timezone for formatting dates in emails (default: Africa/Lagos)

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Generic low-level email sender.
// Everything else builds on this function.
async function sendEmail({ to, subject, html, text }) {
  if (!process.env.BREVO_API_KEY || !process.env.SENDER_EMAIL) {
    console.error('Email sending failed: BREVO_API_KEY or SENDER_EMAIL is not set');
    throw new Error('Failed to send email');
  }

  // Brevo expects recipients as [{ email }]. Accept a string or an array of strings.
  const recipients = (Array.isArray(to) ? to : [to]).map((email) => ({ email }));

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: process.env.SENDER_NAME || 'Appointment Booking',
          email: process.env.SENDER_EMAIL,
        },
        to: recipients,
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Email sending failed:', response.status, data);
      throw new Error('Failed to send email');
    }

    return {
      success: true,
      messageId: data.messageId,
    };
  } catch (error) {
    console.error('Email sending failed:', error.message);
    throw new Error('Failed to send email');
  }
}

// Escapes user-supplied text before it goes into an HTML email body
const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Formats dates in a fixed timezone. Render servers run in UTC,
// so without this, emails would show UTC times instead of local times.
const formatTime = (startTime) =>
  new Date(startTime).toLocaleString('en-GB', {
    timeZone: process.env.APP_TIMEZONE || 'Africa/Lagos',
    dateStyle: 'full',
    timeStyle: 'short',
  });

// Sends a welcome email to a provider after they create their account.
async function sendWelcomeEmail({ toEmail, name, businessName }) {
  const safeName = escapeHtml(name);
  const safeBusinessName = escapeHtml(businessName);

  return sendEmail({
    to: toEmail,
    subject: 'Welcome to Appointment Booking',
    text: `Hi ${name},

Welcome to Appointment Booking!

Your account for ${businessName} has been successfully created.

Next steps:
- Add your availability so clients can see when you're free.
- Share your booking link with your clients.
- Review and confirm booking requests from your dashboard.

Thank you for joining us.`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Welcome to Appointment Booking!</h2>

        <p>Hi ${safeName},</p>

        <p>
          Your account for <strong>${safeBusinessName}</strong>
          has been successfully created.
        </p>

        <p>Next steps:</p>
        <ul>
          <li>Add your availability so clients can see when you're free.</li>
          <li>Share your booking link with your clients.</li>
          <li>Review and confirm booking requests from your dashboard.</li>
        </ul>

        <p>Thank you for joining us.</p>
      </div>
    `,
  });
}

// Sends a booking confirmation email.
// Pass plain values, not model instances.
async function sendBookingConfirmation({
  toEmail,
  customerName,
  providerName,
  startTime,
}) {
  const formattedTime = formatTime(startTime);
  const safeCustomerName = escapeHtml(customerName);
  const safeProviderName = escapeHtml(providerName);

  return sendEmail({
    to: toEmail,
    subject: 'Appointment Confirmed',
    text: `Hi ${customerName},

Your appointment with ${providerName} is confirmed for ${formattedTime}.

If you need to reschedule or cancel, please log in to your account.`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Appointment Confirmed</h2>

        <p>Hi ${safeCustomerName},</p>

        <p>
          Your appointment with
          <strong>${safeProviderName}</strong>
          is confirmed for
          <strong>${formattedTime}</strong>.
        </p>

        <p>
          If you need to reschedule or cancel,
          please log in to your account.
        </p>
      </div>
    `,
  });
}

// Sends an appointment cancellation notice.
async function sendCancellationNotice({
  toEmail,
  customerName,
  startTime,
}) {
  const formattedTime = formatTime(startTime);
  const safeCustomerName = escapeHtml(customerName);

  return sendEmail({
    to: toEmail,
    subject: 'Appointment Cancelled',
    text: `Hi ${customerName},

Your appointment scheduled for ${formattedTime} has been cancelled.`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Appointment Cancelled</h2>

        <p>Hi ${safeCustomerName},</p>

        <p>
          Your appointment scheduled for
          <strong>${formattedTime}</strong>
          has been cancelled.
        </p>
      </div>
    `,
  });
}

// Sends an appointment reminder.
// Can be triggered by a scheduled job.
async function sendReminder({
  toEmail,
  customerName,
  providerName,
  startTime,
}) {
  const formattedTime = formatTime(startTime);
  const safeCustomerName = escapeHtml(customerName);
  const safeProviderName = escapeHtml(providerName);

  return sendEmail({
    to: toEmail,
    subject: 'Appointment Reminder',
    text: `Hi ${customerName},

This is a reminder of your upcoming appointment with ${providerName} on ${formattedTime}.`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Appointment Reminder</h2>

        <p>Hi ${safeCustomerName},</p>

        <p>
          This is a reminder of your upcoming appointment with
          <strong>${safeProviderName}</strong>
          on
          <strong>${formattedTime}</strong>.
        </p>
      </div>
    `,
  });
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendBookingConfirmation,
  sendCancellationNotice,
  sendReminder,
};