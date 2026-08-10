import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    const errorMsg = '[EMAIL ERROR] Missing EMAIL_USER or EMAIL_PASSWORD environment variables on production server.';
    console.error(errorMsg);
    throw new Error('Email service configuration missing on server (EMAIL_USER or EMAIL_PASSWORD not set).');
  }

  let transportConfig;

  if (process.env.EMAIL_SERVICE) {
    // Use named Nodemailer service (e.g., EMAIL_SERVICE=gmail)
    transportConfig = {
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: { rejectUnauthorized: false },
    };
  } else if (!process.env.EMAIL_HOST || process.env.EMAIL_HOST.includes('gmail')) {
    // Default Gmail configuration using service: 'gmail' (most reliable for cloud hosts)
    transportConfig = {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: { rejectUnauthorized: false },
    };
  } else {
    // Custom SMTP host configuration (e.g. Brevo, SendGrid, Mailgun, Mailtrap)
    const host = process.env.EMAIL_HOST;
    const port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 465;
    const secure = process.env.EMAIL_SECURE !== undefined ? process.env.EMAIL_SECURE === 'true' : port === 465;

    transportConfig = {
      host,
      port,
      secure,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 15000,
    };
  }

  const transporter = nodemailer.createTransport(transportConfig);

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"RealEstate Platform" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  try {
    console.log(`[EMAIL] Attempting to send OTP email to ${options.email} via ${transportConfig.service || transportConfig.host || 'SMTP'}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SUCCESS] Email sent to ${options.email}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed sending email to ${options.email}:`, error.message);
    throw error;
  }
};


