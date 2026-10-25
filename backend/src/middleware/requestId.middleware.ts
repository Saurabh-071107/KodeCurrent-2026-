import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface AppRequest extends Request {
  id?: string;
}

export const requestIdMiddleware = (req: AppRequest, res: Response, next: NextFunction): void => {
  const incomingId = req.headers['x-request-id'] as string;
  const requestId = incomingId || crypto.randomUUID();
  
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};
