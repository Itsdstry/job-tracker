import crypto from 'crypto';
import nodemailer from 'nodemailer';
import logger from './logger';

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
    logger.warn({ to, resetUrl }, 'SMTP not configured — skipping email delivery');
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

interface StaleApplication {
  company: string;
  position: string;
  applicationDate: Date;
}

export const sendReminderEmail = async (
  to: string,
  name: string,
  applications: StaleApplication[],
) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn({ to, count: applications.length }, 'SMTP not configured — skipping reminder');
    return true;
  }

  const rows = applications
    .map(
      (a) =>
        `<tr>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${a.company}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${a.position}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;color:#6b7280">${new Date(a.applicationDate).toLocaleDateString()}</td>
        </tr>`,
    )
    .join('');

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `Follow-up reminder: ${applications.length} application${applications.length > 1 ? 's' : ''} need your attention`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;max-width:600px">
        <h2 style="color:#4f46e5">Time to follow up, ${name}!</h2>
        <p>The following applications have been in <strong>Applied</strong> status for 7+ days without an update:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead>
            <tr style="background:#f3f4f6">
              <th style="padding:8px;text-align:left">Company</th>
              <th style="padding:8px;text-align:left">Position</th>
              <th style="padding:8px;text-align:left">Applied on</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="color:#6b7280;font-size:13px">
          You can disable these reminders in your <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile">profile settings</a>.
        </p>
      </div>
    `,
  });

  return true;
};
