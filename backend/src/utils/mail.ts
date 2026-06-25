import crypto from 'crypto';
import nodemailer from 'nodemailer';

export const createResetToken = () => crypto.randomBytes(32).toString('hex');

export const buildResetUrl = (baseUrl: string, token: string) => `${baseUrl}/reset-password?token=${token}`;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: (process.env.SMTP_SECURE || 'false') === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendResetEmail = async (to: string, resetUrl: string) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[MAIL] SMTP credentials are not configured. Skipping email delivery.');
    console.log(`[MAIL] To: ${to}`);
    console.log(`[MAIL] Reset URL: ${resetUrl}`);
    return true;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'Reset your Job Tracker Pro password',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Reset your password</h2>
        <p>We received a request to reset your password.</p>
        <p><a href="${resetUrl}" target="_blank" rel="noreferrer">Click here to set a new password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });

  return true;
};
