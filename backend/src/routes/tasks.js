const { parseJsonBody, sendJson, sendError } = require('../utils/http');
const { validateTask, hasErrors } = require('../utils/validation');
const { canAccessTask } = require('../middleware/auth');

function listTasks(req, res, store, user) {
  sendJson(res, 200, { success: true, data: { tasks: store.listTasks(user) } });
}

async function createTask(req, res, store, user) {
  const body = await parseJsonBody(req);
  const { value, errors } = validateTask(body);
  if (hasErrors(errors)) return sendError(res, 400, 'Validation failed', errors);
  const task = store.createTask(user.id, value);
  sendJson(res, 201, { success: true, data: { task } });
}

function getTask(req, res, store, user, id) {
  const task = store.findTaskById(id);
  if (!task) return sendError(res, 404, 'Task not found');
  if (!canAccessTask(user, task)) return sendError(res, 403, 'You cannot access this task');
  sendJson(res, 200, { success: true, data: { task } });
}

async function updateTask(req, res, store, user, id) {
  const task = store.findTaskById(id);
  if (!task) return sendError(res, 404, 'Task not found');
  if (!canAccessTask(user, task)) return sendError(res, 403, 'You cannot update this task');

  const body = await parseJsonBody(req);
  const { value, errors } = validateTask(body, true);
  if (hasErrors(errors)) return sendError(res, 400, 'Validation failed', errors);
  if (Object.keys(value).length === 0) return sendError(res, 400, 'No valid fields supplied');

  const updated = store.updateTask(id, value);
  sendJson(res, 200, { success: true, data: { task: updated } });
}

function deleteTask(req, res, store, user, id) {
  const task = store.findTaskById(id);
  if (!task) return sendError(res, 404, 'Task not found');
  if (!canAccessTask(user, task)) return sendError(res, 403, 'You cannot delete this task');
  store.deleteTask(id);
  sendJson(res, 200, { success: true, data: { deleted: true } });
}

module.exports = {
  listTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask
};
