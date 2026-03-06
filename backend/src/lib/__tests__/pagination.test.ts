import { describe, it, expect } from 'vitest';
import { parsePagination, paginationMeta } from '../../lib/pagination';

describe('Pagination Utilities', () => {
  describe('parsePagination', () => {
    const makeReq = (query: Record<string, string> = {}) => ({ query } as any);

    it('returns defaults when no query params', () => {
      const result = parsePagination(makeReq());
      expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
    });

    it('parses page and limit from query', () => {
      const result = parsePagination(makeReq({ page: '3', limit: '10' }));
      expect(result).toEqual({ page: 3, limit: 10, skip: 20 });
    });

    it('clamps page to minimum 1', () => {
      const result = parsePagination(makeReq({ page: '-5' }));
      expect(result.page).toBe(1);
    });

    it('clamps limit to maxLimit', () => {
      const result = parsePagination(makeReq({ limit: '500' }));
      expect(result.limit).toBe(100);
    });

    it('respects custom defaultLimit and maxLimit', () => {
      const result = parsePagination(makeReq(), { defaultLimit: 50, maxLimit: 200 });
      expect(result.limit).toBe(50);
    });
  });

  describe('paginationMeta', () => {
    it('returns correct metadata', () => {
      const meta = paginationMeta(55, 2, 20);
      expect(meta).toEqual({
        page: 2,
        limit: 20,
        total: 55,
        totalPages: 3,
        hasMore: true,
      });
    });

    it('hasMore is false on last page', () => {
      const meta = paginationMeta(40, 2, 20);
      expect(meta.hasMore).toBe(false);
    });

    it('handles zero total', () => {
      const meta = paginationMeta(0, 1, 20);
      expect(meta.totalPages).toBe(0);
      expect(meta.hasMore).toBe(false);
    });
  });
});
