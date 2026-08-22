import nodemailer from 'nodemailer';
import dns from 'dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

/**
 * Send email using Brevo REST API v3 or Nodemailer SMTP fallback
 */
export const sendEmail = async (options) => {
  const brevoApiKey = process.env.BREVO_API_KEY || process.env.BREVO_API_V3_KEY || process.env.SIB_API_KEY;

  // 1. Primary: Send via Brevo REST API v3 if Brevo API Key is configured
  if (brevoApiKey && brevoApiKey.trim()) {
    try {
      const cleanKey = brevoApiKey.trim();
      const rawFrom = process.env.EMAIL_FROM || 'RealEstate Platform <prasadvanam42@gmail.com>';

      let senderName = 'RealEstate Platform';
      let senderEmail = 'prasadvanam42@gmail.com';

      const match = rawFrom.match(/^(?:"?([^"<]+)"?\s*)?<?([^>]+)>?$/);
      if (match) {
        if (match[1]) senderName = match[1].trim();
        if (match[2]) senderEmail = match[2].trim();
      }

      console.log(`[EMAIL] Sending email to ${options.email} via Brevo API v3...`);

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': cleanKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: options.email }],
          subject: options.subject,
          htmlContent: options.html,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errMessage = data.message || `Brevo API HTTP Error ${response.status}`;

        if (response.status === 401 && errMessage.includes('unrecognised IP')) {
          console.error('[BREVO SECURITY ALERT] Brevo rejected the request due to Authorized IPs (IP Whitelisting) restriction.');
          console.error('To fix this, go to https://app.brevo.com/security/authorised_ips in your Brevo Dashboard and turn off IP Whitelisting / Authorized IPs or add your server IP address.');
          
          const ipError = new Error(`Brevo rejected request from unauthorized IP. Please turn off IP Whitelisting at https://app.brevo.com/security/authorised_ips. (${errMessage})`);
          ipError.code = 'BREVO_UNAUTHORIZED_IP';
          ipError.status = 401;
          throw ipError;
        }

        const apiError = new Error(errMessage);
        apiError.code = data.code || `HTTP_${response.status}`;
        throw apiError;
      }

      console.log(`[EMAIL SUCCESS] Sent via Brevo API v3 to ${options.email}. Message ID: ${data.messageId}`);
      return data;
    } catch (brevoError) {
      console.error(`[BREVO API FAIL] ${brevoError.message}`);

      const rawUser = process.env.EMAIL_USER;
      const rawPass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;
      if (!rawUser || !rawUser.trim() || !rawPass || !rawPass.trim()) {
        throw brevoError;
      }
      console.log('[EMAIL] Attempting fallback to Nodemailer SMTP...');
    }
  }

  // 2. Secondary Fallback: Nodemailer SMTP
  const rawUser = process.env.EMAIL_USER;
  const rawPass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;
  const host = process.env.EMAIL_HOST;
  const rawPort = process.env.EMAIL_PORT;
  const service = process.env.EMAIL_SERVICE;

  if (!rawUser || !rawUser.trim() || !rawPass || !rawPass.trim()) {
    const errorMsg = '[EMAIL ERROR] Missing BREVO_API_KEY or (EMAIL_USER / EMAIL_PASSWORD) environment variables.';
    console.error(errorMsg);
    throw new Error('Email service configuration missing on server (BREVO_API_KEY or EMAIL_USER / EMAIL_PASSWORD).');
  }

  const cleanUser = rawUser.trim();
  const cleanPass = rawPass.replace(/\s+/g, '');
  const parsedPort = rawPort ? parseInt(rawPort, 10) : undefined;
  const isGmail = (service && service.toLowerCase() === 'gmail') || (host && host.includes('gmail')) || (!service && !host);

  let transporterConfig;
  if (isGmail) {
    transporterConfig = {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: cleanUser, pass: cleanPass },
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
      auth: { user: cleanUser, pass: cleanPass },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 15000,
    };
  } else {
    transporterConfig = {
      service: (service && service.trim()) || 'gmail',
      auth: { user: cleanUser, pass: cleanPass },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 15000,
    };
  }

  const transporter = nodemailer.createTransport(transporterConfig);
  const from = process.env.EMAIL_FROM || `RealEstate Platform <${cleanUser}>`;

  try {
    console.log(`[EMAIL] Sending email to ${options.email} via Nodemailer (Host: ${transporterConfig.host || transporterConfig.service})...`);
    const info = await transporter.sendMail({
      from,
      to: options.email,
      subject: options.subject,
      html: options.html,
    });

    console.log(`[EMAIL SUCCESS] Nodemailer sent email to ${options.email}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[EMAIL ERROR] Nodemailer failed to send email to ${options.email}:`, error.message || error);
    throw error;
  }
};



