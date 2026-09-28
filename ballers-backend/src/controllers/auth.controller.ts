import { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const register = async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input');
    return;
  }

  const { username, email, password } = parsed.data;

  try {
    const user = await authService.register(username, email, password);
    sendSuccess(res, { message: 'Registration successful. Please check your email to verify your account.', user }, 201);
  } catch (err: any) {
    if (err.message === 'EMAIL_TAKEN') { sendError(res, 'EMAIL_TAKEN', 'This email is already registered'); return; }
    if (err.message === 'USERNAME_TAKEN') { sendError(res, 'USERNAME_TAKEN', 'This username is already taken'); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    sendError(res, 'MISSING_TOKEN', 'Verification token is required');
    return;
  }

  try {
    await authService.verifyEmail(token);
    sendSuccess(res, { message: 'Email verified successfully. You can now log in.' });
  } catch (err: any) {
    if (err.message === 'INVALID_TOKEN') { sendError(res, 'INVALID_TOKEN', 'Invalid verification token', 400); return; }
    if (err.message === 'ALREADY_VERIFIED') { sendError(res, 'ALREADY_VERIFIED', 'Email is already verified', 400); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const resendVerification = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    sendError(res, 'MISSING_EMAIL', 'Email is required');
    return;
  }

  try {
    await authService.resendVerification(email);
    sendSuccess(res, { message: 'Verification email resent.' });
  } catch (err: any) {
    if (err.message === 'USER_NOT_FOUND') { sendError(res, 'USER_NOT_FOUND', 'No account found with this email', 404); return; }
    if (err.message === 'ALREADY_VERIFIED') { sendError(res, 'ALREADY_VERIFIED', 'Email is already verified', 400); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const login = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input');
    return;
  }

  const { email, password } = parsed.data;

  try {
    const result = await authService.login(email, password);
    sendSuccess(res, result);
  } catch (err: any) {
    if (err.message === 'INVALID_CREDENTIALS') { sendError(res, 'INVALID_CREDENTIALS', 'Invalid email or password', 401); return; }
    if (err.message === 'EMAIL_NOT_VERIFIED') { sendError(res, 'EMAIL_NOT_VERIFIED', 'Please verify your email before logging in', 403); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};
