import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async route handler so that rejected promises are forwarded to
 * the Express error handler automatically — no manual try/catch needed.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
