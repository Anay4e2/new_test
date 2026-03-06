import { describe, it, expect } from 'vitest';
import { AppError, BadRequestError, ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, TooManyRequestsError, InternalError } from '../../lib/errors';

describe('Error Classes', () => {
  it('AppError has correct status, code, and isOperational', () => {
    const err = new AppError('test', 418, 'TEAPOT');
    expect(err.message).toBe('test');
    expect(err.status).toBe(418);
    expect(err.code).toBe('TEAPOT');
    expect(err.isOperational).toBe(true);
    expect(err instanceof Error).toBe(true);
    expect(err instanceof AppError).toBe(true);
  });

  it('BadRequestError defaults to 400', () => {
    const err = new BadRequestError();
    expect(err.status).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
  });

  it('ValidationError carries details array', () => {
    const err = new ValidationError(['field1 is required', 'field2 is too long']);
    expect(err.status).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.details).toEqual(['field1 is required', 'field2 is too long']);
  });

  it('UnauthorizedError defaults to 401', () => {
    const err = new UnauthorizedError();
    expect(err.status).toBe(401);
  });

  it('ForbiddenError defaults to 403', () => {
    const err = new ForbiddenError();
    expect(err.status).toBe(403);
  });

  it('NotFoundError defaults to 404 with resource name', () => {
    const err = new NotFoundError('Trip');
    expect(err.status).toBe(404);
    expect(err.message).toBe('Trip not found');
  });

  it('ConflictError defaults to 409', () => {
    const err = new ConflictError();
    expect(err.status).toBe(409);
  });

  it('TooManyRequestsError defaults to 429', () => {
    const err = new TooManyRequestsError();
    expect(err.status).toBe(429);
  });

  it('InternalError defaults to 500 and is not operational', () => {
    const err = new InternalError();
    expect(err.status).toBe(500);
    expect(err.isOperational).toBe(false);
  });
});
