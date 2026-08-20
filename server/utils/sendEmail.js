import nodemailer from 'nodemailer';
import dns from 'dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

export const sendEmail = async (options) => {
  const rawUser = process.env.EMAIL_USER;
  const rawPass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;
  const host = process.env.EMAIL_HOST;
  const rawPort = process.env.EMAIL_PORT;
  const service = process.env.EMAIL_SERVICE;

  if (!rawUser || !rawUser.trim() || !rawPass || !rawPass.trim()) {
    const errorMsg = '[EMAIL ERROR] Missing EMAIL_USER or EMAIL_PASSWORD environment variables.';
    console.error(errorMsg);
    throw new Error('Email service configuration missing on server (EMAIL_USER / EMAIL_PASSWORD).');
  }

  const cleanUser = rawUser.trim();
  const cleanPass = rawPass.replace(/\s+/g, ''); // Strips spaces from App Passwords

  const parsedPort = rawPort ? parseInt(rawPort, 10) : undefined;
  const isGmail = (service && service.toLowerCase() === 'gmail') || (host && host.includes('gmail')) || (!service && !host);

  // Transporter options optimized for cloud hosting (Render)
  let transporterConfig;

  if (isGmail) {
    // Port 465 SSL is significantly more reliable on cloud hosting (Render) than Port 587
    transporterConfig = {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 15000,
    };
  } else if (host && host.trim()) {
    const port = parsedPort || 587;
    transporterConfig = {
      host: host.trim(),
      port,
      secure: port === 465,
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 15000,
    };
  } else {
    transporterConfig = {
      service: (service && service.trim()) || 'gmail',
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 15000,
    };
  }

  const transporter = nodemailer.createTransport(transporterConfig);
  const from = process.env.EMAIL_FROM || `RealEstate Platform <${cleanUser}>`;

  try {
    console.log(`[EMAIL] Sending email to ${options.email} via Nodemailer (Host: ${transporterConfig.host || transporterConfig.service}, Port: ${transporterConfig.port || 465})...`);
    const info = await transporter.sendMail({
      from,
      to: options.email,
      subject: options.subject,
      html: options.html,
    });

    console.log(`[EMAIL SUCCESS] Email sent to ${options.email}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[EMAIL ERROR] Primary Nodemailer send failed (${error.code || error.message}). Attempting fallback...`);

    try {
      const fallbackTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: cleanUser, pass: cleanPass },
        connectionTimeout: 10000,
      });

      const info = await fallbackTransporter.sendMail({
        from,
        to: options.email,
        subject: options.subject,
        html: options.html,
      });
      console.log(`[EMAIL SUCCESS] Fallback email sent to ${options.email}. Message ID: ${info.messageId}`);
      return info;
    } catch (fallbackErr) {
      console.error(`[EMAIL ERROR] Fallback email failed for ${options.email}:`, fallbackErr.message);
      throw error;
    }
  }
};


