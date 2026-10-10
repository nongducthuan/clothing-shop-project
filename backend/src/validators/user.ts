import { AppError } from '../utils/AppError';

export const PHONE_REGEX = /^[0-9]{10,11}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 6;

export const parseId = (raw: unknown, label: string): number => {
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) {
        throw new AppError(`Invalid ${label} id`, 400);
    }
    return id;
};

/** Chỉ nhận 2 giá trị hợp lệ của enum UserRole, mọi giá trị khác coi như customer. */
export const normalizeRole = (role: unknown): 'admin' | 'customer' => (role === 'admin' ? 'admin' : 'customer');

export const validatePassword = (password: unknown): string => {
    const value = typeof password === 'string' ? password : '';
    if (value.length < MIN_PASSWORD_LENGTH) {
        throw new AppError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`, 400);
    }
    return value;
};

export const validatePhone = (phone: unknown): string | null => {
    const value = typeof phone === 'string' ? phone.trim() : '';
    if (!value) return null;
    if (!PHONE_REGEX.test(value)) {
        throw new AppError('Phone must be 10-11 digits', 400);
    }
    return value;
};
