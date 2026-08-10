import dotenv from 'dotenv';
import { sendEmail } from '../utils/sendEmail.js';

dotenv.config();

const to = process.argv[2];

if (!to) {
  console.error('Usage: node scripts/testEmail.js recipient@example.com');
  process.exit(1);
}

try {
  await sendEmail({
    email: to,
    subject: 'RealEstate email test',
    html: '<p>Email configuration is working.</p>',
  });
  console.log('Email test sent successfully.');
  process.exit(0);
} catch (error) {
  console.error('Email test failed:', error.code || error.responseCode || 'NO_CODE', error.message);
  process.exit(1);
}
