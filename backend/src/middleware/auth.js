const { sendError } = require('../utils/http');
const { verifyJwt } = require('../utils/security');

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

function requireAuth(store, req, res) {
  const token = getBearerToken(req);
  if (!token) {
    sendError(res, 401, 'Missing bearer token');
    return null;
  }

  try {
    const payload = verifyJwt(token);
    const user = store.findUserById(payload.sub);
    if (!user) {
      sendError(res, 401, 'User no longer exists');
      return null;
    }
    return user;
  } catch (error) {
    sendError(res, error.statusCode || 401, error.message || 'Unauthorized');
    return null;
  }
}

function requireAdmin(user, res) {
  if (!user || user.role !== 'admin') {
    sendError(res, 403, 'Admin access required');
    return false;
  }
  return true;
}

function canAccessTask(user, task) {
  return user.role === 'admin' || task.ownerId === user.id;
}

module.exports = {
  requireAuth,
  requireAdmin,
  canAccessTask
};
