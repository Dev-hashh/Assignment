const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

module.exports = {
  rootDir,
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || 'local-development-secret-change-me',
  jwtExpiresInSeconds: Number(process.env.JWT_EXPIRES_IN_SECONDS || 86400),
  pbkdf2Iterations: Number(process.env.PBKDF2_ITERATIONS || 120000),
  dbFile: path.join(rootDir, 'data', 'db.json')
};
