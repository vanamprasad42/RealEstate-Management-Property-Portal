import { Resend } from 'resend';

export const sendEmail = async (options) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    const errorMsg = '[EMAIL ERROR] Missing RESEND_API_KEY. Set RESEND_API_KEY on the server.';
    console.error(errorMsg);
    throw new Error('Email service configuration missing on server.');
  }

  const resend = new Resend(apiKey.trim());
  const from = process.env.EMAIL_FROM || 'Prasad Vanam <onboarding@resend.dev>';


  try {
    console.log(`[EMAIL] Sending email to ${options.email} via Resend...`);
    const { data, error } = await resend.emails.send({
      from,
      to: [options.email],
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error(`[EMAIL ERROR] Resend failed for ${options.email}:`, error.message || error);
      const err = new Error(error.message || 'Failed to send email via Resend');
      err.code = error.name || 'RESEND_ERROR';
      throw err;
    }

    console.log(`[EMAIL SUCCESS] Email sent to ${options.email}. Message ID: ${data?.id}`);
    return data;
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed sending email to ${options.email}:`, error.message);
    throw error;
  }
};
