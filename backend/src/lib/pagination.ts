import { Request } from 'express';

export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Extract and sanitize pagination parameters from req.query.
 * Returns { page, limit, skip } ready for Mongoose .skip()/.limit().
 */
export function parsePagination(req: Request, options: PaginationOptions = {}): PaginationResult {
  const { defaultLimit = 20, maxLimit = 100 } = options;

  let page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  let limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit as string, 10) || defaultLimit));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

/**
 * Build a standard pagination metadata object for API responses.
 */
export function paginationMeta(total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
}
