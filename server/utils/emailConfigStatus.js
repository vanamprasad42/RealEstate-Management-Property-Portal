const hasValue = (value) => Boolean(value && value.trim());

export const getEmailConfigStatus = () => {
  const hasBrevoKey = hasValue(process.env.BREVO_API_KEY || process.env.BREVO_API_V3_KEY || process.env.SIB_API_KEY);
  const hasUser = hasValue(process.env.EMAIL_USER);
  const hasPass = hasValue(process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS);
  const isConfigured = hasBrevoKey || (hasUser && hasPass);
  const fromConfigured = hasValue(process.env.EMAIL_FROM);

  return {
    configured: isConfigured,
    provider: hasBrevoKey ? 'brevo_api' : (isConfigured ? 'nodemailer' : 'none'),
    hasBrevoKey,
    hasUser,
    hasPass,
    fromConfigured,
  };
};

export const logEmailConfigStatus = () => {
  const status = getEmailConfigStatus();

  if (!status.configured) {
    console.warn('[EMAIL CONFIG] Missing BREVO_API_KEY or EMAIL_USER/EMAIL_PASSWORD. Email sending will fail until configured.');
    return;
  }

  if (status.hasBrevoKey) {
    console.log('[EMAIL CONFIG] Brevo API v3 configuration loaded.');
  } else {
    console.log('[EMAIL CONFIG] Nodemailer SMTP configuration loaded.');
  }
};


