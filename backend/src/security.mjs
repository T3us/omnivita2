import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { config } from './config.mjs';

const PASSWORD_ROUNDS = 10;

export function normalizeIdentifier(value) {
  return String(value || '').trim().toLowerCase();
}

export async function hashPassword(password) {
  return bcrypt.hash(String(password || ''), PASSWORD_ROUNDS);
}

export async function verifyPassword(password, hash) {
  if (!hash) return false;
  try {
    return await bcrypt.compare(String(password || ''), String(hash || ''));
  } catch (error) {
    console.error(error);
    return false;
  }
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashSessionToken(token) {
  return crypto
    .createHash('sha256')
    .update(`${config.appTokenSecret}:${String(token || '')}`)
    .digest('hex');
}

export function createUuid() {
  return crypto.randomUUID();
}

export function buildSessionExpiry(days = config.tokenTtlDays) {
  const next = new Date();
  next.setDate(next.getDate() + Math.max(1, Number(days || config.tokenTtlDays)));
  return next;
}

export function createTemporaryPassword() {
  return crypto.randomBytes(9).toString('base64url');
}
