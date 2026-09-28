import { Response } from 'express';

export const sendSuccess = (res: Response, data: unknown, status = 200) => {
  res.status(status).json({ data });
};

export const sendError = (res: Response, code: string, message: string, status = 400) => {
  res.status(status).json({ error: { code, message } });
};
