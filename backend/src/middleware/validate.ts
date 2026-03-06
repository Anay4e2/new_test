import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Express middleware factory that validates req.body against a Zod schema.
 * On success the parsed (and coerced) value replaces req.body.
 * On failure a 400 response with structured errors is returned.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((e: any) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        errors,
      });
      return;
    }
    // Replace body with parsed (and coerced) data
    req.body = result.data;
    next();
  };
}

/**
 * Validate req.params against a Zod schema.
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.issues.map((e: any) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Invalid URL parameters',
        errors,
      });
      return;
    }
    next();
  };
}

/**
 * Validate req.query against a Zod schema.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.issues.map((e: any) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Invalid query parameters',
        errors,
      });
      return;
    }
    next();
  };
}
