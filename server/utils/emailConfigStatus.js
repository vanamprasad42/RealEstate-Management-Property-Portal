const hasValue = (value) => Boolean(value && value.trim());

export const logEmailConfigStatus = () => {
  const hasUser = hasValue(process.env.EMAIL_USER) || hasValue(process.env.SMTP_USER) || hasValue(process.env.MAIL_USER);
  const hasPassword = hasValue(process.env.EMAIL_PASSWORD) || hasValue(process.env.EMAIL_PASS) || hasValue(process.env.SMTP_PASS) || hasValue(process.env.MAIL_PASS);
  const provider = process.env.EMAIL_SERVICE || process.env.SMTP_SERVICE || process.env.EMAIL_HOST || process.env.SMTP_HOST || 'gmail';

  if (!hasUser || !hasPassword) {
    console.warn('[EMAIL CONFIG] Missing email credentials. OTP emails will fail until EMAIL_USER and EMAIL_PASSWORD are set in production.');
    return;
  }

  console.log(`[EMAIL CONFIG] Email credentials loaded. Provider: ${provider}`);
};
