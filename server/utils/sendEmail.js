import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('[EMAIL] EMAIL_USER or EMAIL_PASSWORD not set. Skipping email dispatch.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    connectionTimeout: 5000, // 5 seconds max connection timeout
    greetingTimeout: 5000,
    socketTimeout: 5000,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"RealEstate Platform" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};
