const { parseJsonBody, sendJson, sendError } = require('../utils/http');
const { hashPassword, verifyPassword, signJwt, sanitizeUser } = require('../utils/security');
const { validateRegister, validateLogin, hasErrors } = require('../utils/validation');

async function register(req, res, store) {
  const body = await parseJsonBody(req);
  const { value, errors } = validateRegister(body);
  if (hasErrors(errors)) return sendError(res, 400, 'Validation failed', errors);
  if (store.findUserByEmail(value.email)) return sendError(res, 409, 'Email is already registered');

  const user = store.createUser({
    name: value.name,
    email: value.email,
    passwordHash: hashPassword(value.password),
    role: 'user'
  });

  sendJson(res, 201, { success: true, data: { user: sanitizeUser(user) } });
}

async function login(req, res, store) {
  const body = await parseJsonBody(req);
  const { value, errors } = validateLogin(body);
  if (hasErrors(errors)) return sendError(res, 400, 'Validation failed', errors);

  const user = store.findUserByEmail(value.email);
  if (!user || !verifyPassword(value.password, user.passwordHash)) {
    return sendError(res, 401, 'Invalid email or password');
  }

  const token = signJwt({ sub: user.id, role: user.role });
  sendJson(res, 200, {
    success: true,
    data: {
      token,
      user: sanitizeUser(user)
    }
  });
}

function me(req, res, user) {
  sendJson(res, 200, { success: true, data: { user: sanitizeUser(user) } });
}

module.exports = {
  register,
  login,
  me
};
