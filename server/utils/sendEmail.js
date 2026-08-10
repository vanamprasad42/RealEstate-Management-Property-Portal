import nodemailer from 'nodemailer';

const firstPresent = (...values) => values.find((value) => value && value.trim());

const isGmailTransport = ({ service, host, user }) => {
  return [service, host, user].some((value) => value?.toLowerCase().includes('gmail'));
};

export const sendEmail = async (options) => {
  const emailUser = firstPresent(process.env.EMAIL_USER, process.env.SMTP_USER, process.env.MAIL_USER);
  const rawEmailPassword = firstPresent(process.env.EMAIL_PASSWORD, process.env.EMAIL_PASS, process.env.SMTP_PASS, process.env.MAIL_PASS);
  const emailService = firstPresent(process.env.EMAIL_SERVICE, process.env.SMTP_SERVICE);
  const emailHost = firstPresent(process.env.EMAIL_HOST, process.env.SMTP_HOST);

  if (!emailUser || !rawEmailPassword) {
    const errorMsg = '[EMAIL ERROR] Missing email credentials. Set EMAIL_USER and EMAIL_PASSWORD on the production server.';
    console.error(errorMsg);
    throw new Error('Email service configuration missing on server.');
  }

  const normalizedEmailUser = emailUser.trim();
  const normalizedEmailService = emailService?.trim();
  const normalizedEmailHost = emailHost?.trim();
  const isGmail = isGmailTransport({
    service: normalizedEmailService,
    host: normalizedEmailHost,
    user: normalizedEmailUser,
  });
  const emailPassword = isGmail ? rawEmailPassword.replace(/\s/g, '') : rawEmailPassword.trim();

  let transportConfig;

  if (normalizedEmailService) {
    // Use named Nodemailer service (e.g., EMAIL_SERVICE=gmail)
    transportConfig = {
      service: normalizedEmailService,
      auth: {
        user: normalizedEmailUser,
        pass: emailPassword,
      },
    };
  } else if (!normalizedEmailHost || normalizedEmailHost.includes('gmail')) {
    // Default Gmail configuration using service: 'gmail' (most reliable for cloud hosts)
    transportConfig = {
      service: 'gmail',
      auth: {
        user: normalizedEmailUser,
        pass: emailPassword,
      },
    };
  } else {
    // Custom SMTP host configuration (e.g. Brevo, SendGrid, Mailgun, Mailtrap)
    const host = normalizedEmailHost;
    const port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 465;
    const secure = process.env.EMAIL_SECURE !== undefined ? process.env.EMAIL_SECURE === 'true' : port === 465;

    transportConfig = {
      host,
      port,
      secure,
      auth: {
        user: normalizedEmailUser,
        pass: emailPassword,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 15000,
    };
  }

  const transporter = nodemailer.createTransport(transportConfig);

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"RealEstate Platform" <${normalizedEmailUser}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  try {
    console.log(`[EMAIL] Sending email to ${options.email} via ${transportConfig.service || `${transportConfig.host}:${transportConfig.port}` || 'SMTP'} as ${normalizedEmailUser}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SUCCESS] Email sent to ${options.email}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed sending email to ${options.email}:`, error.code || error.responseCode || 'NO_CODE', error.message);
    throw error;
  }
};
