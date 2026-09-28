import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/database';
import { env } from '../config/env';
import { sendVerificationEmail } from './email.service';

export const register = async (username: string, email: string, password: string) => {
  // Check if email or username already exists
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existing) {
    if (existing.email === email) throw new Error('EMAIL_TAKEN');
    if (existing.username === username) throw new Error('USERNAME_TAKEN');
  }

  const password_hash = await bcrypt.hash(password, 12);
  const verification_token = crypto.randomBytes(32).toString('hex');

  const user = await prisma.user.create({
    data: {
      email,
      username,
      password_hash,
      verification_token,
    },
  });

  await sendVerificationEmail(email, verification_token);

  return { id: user.id, email: user.email, username: user.username };
};

export const verifyEmail = async (token: string) => {
  const user = await prisma.user.findFirst({ where: { verification_token: token } });

  if (!user) throw new Error('INVALID_TOKEN');
  if (user.email_verified) throw new Error('ALREADY_VERIFIED');

  await prisma.user.update({
    where: { id: user.id },
    data: { email_verified: true, verification_token: null },
  });
};

export const resendVerification = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new Error('USER_NOT_FOUND');
  if (user.email_verified) throw new Error('ALREADY_VERIFIED');

  const verification_token = crypto.randomBytes(32).toString('hex');

  await prisma.user.update({
    where: { id: user.id },
    data: { verification_token },
  });

  await sendVerificationEmail(email, verification_token);
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new Error('INVALID_CREDENTIALS');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error('INVALID_CREDENTIALS');

  if (!user.email_verified) throw new Error('EMAIL_NOT_VERIFIED');

  const token = jwt.sign({ id: user.id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });

  const profile = await prisma.playerProfile.findUnique({ where: { user_id: user.id } });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      email_verified: user.email_verified,
      has_profile: !!profile,
    },
  };
};
