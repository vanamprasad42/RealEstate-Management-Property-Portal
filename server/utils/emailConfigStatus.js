const hasValue = (value) => Boolean(value && value.trim());

export const getEmailConfigStatus = () => {
  const hasUser = hasValue(process.env.EMAIL_USER);
  const hasPass = hasValue(process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS);
  const isConfigured = hasUser && hasPass;
  const fromConfigured = hasValue(process.env.EMAIL_FROM);

  return {
    configured: isConfigured,
    hasUser,
    hasPass,
    provider: 'nodemailer',
    fromConfigured,
  };
};

export const logEmailConfigStatus = () => {
  const { configured } = getEmailConfigStatus();

  if (!configured) {
    console.warn('[EMAIL CONFIG] Missing EMAIL_USER or EMAIL_PASSWORD. Email sending will fail until SMTP credentials are configured.');
    return;
  }

  console.log('[EMAIL CONFIG] Nodemailer SMTP configuration loaded.');
};

