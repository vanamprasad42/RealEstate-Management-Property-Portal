const hasValue = (value) => Boolean(value && value.trim());

export const getEmailConfigStatus = () => {
  const hasApiKey = hasValue(process.env.RESEND_API_KEY);
  const fromConfigured = hasValue(process.env.EMAIL_FROM);

  return {
    configured: hasApiKey,
    hasApiKey,
    provider: 'resend',
    fromConfigured,
  };
};

export const logEmailConfigStatus = () => {
  const { hasApiKey } = getEmailConfigStatus();

  if (!hasApiKey) {
    console.warn('[EMAIL CONFIG] Missing RESEND_API_KEY. Emails will fail until RESEND_API_KEY is set in production.');
    return;
  }

  console.log('[EMAIL CONFIG] Resend API key loaded.');
};
