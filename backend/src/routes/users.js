const { sendJson } = require('../utils/http');
const { sanitizeUser } = require('../utils/security');

function listUsers(req, res, store) {
  sendJson(res, 200, {
    success: true,
    data: {
      users: store.listUsers().map(sanitizeUser)
    }
  });
}

module.exports = {
  listUsers
};
