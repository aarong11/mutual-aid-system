import { ResourceType, SubmissionStatus, UserRole } from '../types';

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isResourceType(value: unknown): value is ResourceType {
  return typeof value === 'string' && Object.values(ResourceType).includes(value as ResourceType);
}

export function isSubmissionStatus(value: unknown): value is SubmissionStatus {
  return typeof value === 'string' && Object.values(SubmissionStatus).includes(value as SubmissionStatus);
}

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && Object.values(UserRole).includes(value as UserRole);
}

export function isValidZipCode(value: unknown): boolean {
  if (!isString(value)) return false;
  return /^\d{5}(-\d{4})?$/.test(value);
}

export function isValidEmail(value: unknown): boolean {
  if (!isString(value)) return false;
  // RFC 5322 compliant email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(value);
}

export function isValidLatitude(value: unknown): boolean {
  if (!isNumber(value)) return false;
  return value >= -90 && value <= 90;
}

export function isValidLongitude(value: unknown): boolean {
  if (!isNumber(value)) return false;
  return value >= -180 && value <= 180;
}

export function assertNonNullable<T>(value: T, message: string): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}