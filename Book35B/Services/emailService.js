const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Generic low-level email sender.
// Everything else builds on this function.
async function sendEmail({ to, subject, html, text }) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Appointment Booking <onboarding@resend.dev>',
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send email');
    }

    return {
      success: true,
      messageId: data.id,
    };
  } catch (error) {
    console.error('Email sending failed:', error);
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
  const formattedTime = new Date(startTime).toLocaleString();

  return sendEmail({
    to: toEmail,
    subject: 'Appointment Confirmed',
    text: `Hi ${customerName},

Your appointment with ${providerName} is confirmed for ${formattedTime}.

If you need to reschedule or cancel, please log in to your account.`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Appointment Confirmed</h2>

        <p>Hi ${customerName},</p>

        <p>
          Your appointment with
          <strong>${providerName}</strong>
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
  const formattedTime = new Date(startTime).toLocaleString();

  return sendEmail({
    to: toEmail,
    subject: 'Appointment Cancelled',
    text: `Hi ${customerName},

Your appointment scheduled for ${formattedTime} has been cancelled.`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Appointment Cancelled</h2>

        <p>Hi ${customerName},</p>

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
  const formattedTime = new Date(startTime).toLocaleString();

  return sendEmail({
    to: toEmail,
    subject: 'Appointment Reminder',
    text: `Hi ${customerName},

This is a reminder of your upcoming appointment with ${providerName} on ${formattedTime}.`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Appointment Reminder</h2>

        <p>Hi ${customerName},</p>

        <p>
          This is a reminder of your upcoming appointment with
          <strong>${providerName}</strong>
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