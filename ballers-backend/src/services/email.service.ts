import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
});

export const sendVerificationEmail = async (to: string, token: string) => {
  const link = `${env.APP_URL}/api/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: 'Verify your Ballers account',
    html: `
      <h2>Welcome to Ballers!</h2>
      <p>Click the link below to verify your email address:</p>
      <a href="${link}">${link}</a>
      <p>This link will not expire until you verify.</p>
    `,
  });
};
