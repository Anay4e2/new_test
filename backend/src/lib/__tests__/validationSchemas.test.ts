import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema, changePasswordSchema } from '../../lib/validationSchemas';

describe('Auth Validation Schemas', () => {
  describe('registerSchema', () => {
    it('accepts valid registration data', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password1',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing name', () => {
      const result = registerSchema.safeParse({
        email: 'john@example.com',
        password: 'Password1',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid email', () => {
      const result = registerSchema.safeParse({
        name: 'John',
        email: 'not-an-email',
        password: 'Password1',
      });
      expect(result.success).toBe(false);
    });

    it('rejects weak password (no uppercase)', () => {
      const result = registerSchema.safeParse({
        name: 'John',
        email: 'john@example.com',
        password: 'password1',
      });
      expect(result.success).toBe(false);
    });

    it('rejects weak password (no digit)', () => {
      const result = registerSchema.safeParse({
        name: 'John',
        email: 'john@example.com',
        password: 'Passwordx',
      });
      expect(result.success).toBe(false);
    });

    it('rejects password shorter than 8 chars', () => {
      const result = registerSchema.safeParse({
        name: 'John',
        email: 'john@example.com',
        password: 'Pass1',
      });
      expect(result.success).toBe(false);
    });

    it('trims and lowercases email', () => {
      const result = registerSchema.safeParse({
        name: ' John ',
        email: '  John@Example.COM  ',
        password: 'Password1',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('john@example.com');
        expect(result.data.name).toBe('John');
      }
    });
  });

  describe('loginSchema', () => {
    it('accepts valid login data', () => {
      const result = loginSchema.safeParse({
        email: 'john@example.com',
        password: 'anything',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'john@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('forgotPasswordSchema', () => {
    it('accepts valid email', () => {
      const result = forgotPasswordSchema.safeParse({ email: 'a@b.com' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = forgotPasswordSchema.safeParse({ email: 'abc' });
      expect(result.success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    it('accepts strong password', () => {
      const result = resetPasswordSchema.safeParse({ password: 'NewPass99' });
      expect(result.success).toBe(true);
    });

    it('rejects weak password', () => {
      const result = resetPasswordSchema.safeParse({ password: '1234' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateProfileSchema', () => {
    it('accepts name only', () => {
      const result = updateProfileSchema.safeParse({ name: 'Jane' });
      expect(result.success).toBe(true);
    });

    it('accepts email only', () => {
      const result = updateProfileSchema.safeParse({ email: 'a@b.com' });
      expect(result.success).toBe(true);
    });

    it('rejects empty object', () => {
      const result = updateProfileSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('changePasswordSchema', () => {
    it('accepts valid passwords', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'old',
        newPassword: 'NewPass99',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing currentPassword', () => {
      const result = changePasswordSchema.safeParse({
        newPassword: 'NewPass99',
      });
      expect(result.success).toBe(false);
    });
  });
});
