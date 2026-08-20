import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : undefined;
  const service = process.env.EMAIL_SERVICE;

  if (!user || !user.trim() || !pass || !pass.trim()) {
    const errorMsg = '[EMAIL ERROR] Missing EMAIL_USER or EMAIL_PASSWORD environment variables.';
    console.error(errorMsg);
    throw new Error('Email service configuration missing on server (EMAIL_USER / EMAIL_PASSWORD).');
  }

  let transporterConfig;
  if (service && service.trim()) {
    transporterConfig = {
      service: service.trim(),
      auth: {
        user: user.trim(),
        pass: pass.trim(),
      },
    };
  } else if (host && host.trim()) {
    transporterConfig = {
      host: host.trim(),
      port: port || 587,
      secure: port === 465,
      auth: {
        user: user.trim(),
        pass: pass.trim(),
      },
    };
  } else {
    // Default to Gmail service if no host/service specified
    transporterConfig = {
      service: 'gmail',
      auth: {
        user: user.trim(),
        pass: pass.trim(),
      },
    };
  }

  const transporter = nodemailer.createTransport(transporterConfig);
  const from = process.env.EMAIL_FROM || `RealEstate Platform <${user.trim()}>`;

  try {
    console.log(`[EMAIL] Sending email to ${options.email} via Nodemailer...`);
    const info = await transporter.sendMail({
      from,
      to: options.email,
      subject: options.subject,
      html: options.html,
    });

    console.log(`[EMAIL SUCCESS] Email sent to ${options.email}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed sending email to ${options.email}:`, error.message);
    throw error;
  }
};

