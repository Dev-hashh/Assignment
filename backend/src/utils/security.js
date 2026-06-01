const crypto = require('crypto');
const config = require('../config');

function base64Url(input) {
  return Buffer.from(input).toString('base64url');
}

function signJwt(payload, options = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = {
    ...payload,
    iat: now,
    exp: now + (options.expiresInSeconds || config.jwtExpiresInSeconds)
  };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedBody = base64Url(JSON.stringify(body));
  const signature = crypto
    .createHmac('sha256', config.jwtSecret)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest('base64url');
  return `${encodedHeader}.${encodedBody}.${signature}`;
}

function verifyJwt(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw Object.assign(new Error('Invalid token'), { statusCode: 401 });
  const [encodedHeader, encodedBody, signature] = parts;
  const expected = crypto
    .createHmac('sha256', config.jwtSecret)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest('base64url');
  const provided = Buffer.from(signature);
  const calculated = Buffer.from(expected);
  if (provided.length !== calculated.length || !crypto.timingSafeEqual(provided, calculated)) {
    throw Object.assign(new Error('Invalid token signature'), { statusCode: 401 });
  }
  const payload = JSON.parse(Buffer.from(encodedBody, 'base64url').toString('utf8'));
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw Object.assign(new Error('Token expired'), { statusCode: 401 });
  }
  return payload;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const hash = crypto
    .pbkdf2Sync(password, salt, config.pbkdf2Iterations, 64, 'sha512')
    .toString('base64url');
  return `pbkdf2$${config.pbkdf2Iterations}$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
  const [scheme, iterationsRaw, salt, hash] = String(storedHash || '').split('$');
  if (scheme !== 'pbkdf2' || !iterationsRaw || !salt || !hash) return false;
  const iterations = Number(iterationsRaw);
  const candidate = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('base64url');
  const a = Buffer.from(candidate);
  const b = Buffer.from(hash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

module.exports = {
  signJwt,
  verifyJwt,
  hashPassword,
  verifyPassword,
  sanitizeUser
};
