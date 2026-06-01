const allowedStatuses = ['todo', 'in_progress', 'done'];

function cleanString(value) {
  return String(value || '').trim();
}

function validateRegister(body) {
  const errors = {};
  const name = cleanString(body.name);
  const email = cleanString(body.email).toLowerCase();
  const password = String(body.password || '');

  if (name.length < 2 || name.length > 120) errors.name = 'Name must be 2-120 characters.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Valid email is required.';
  if (password.length < 8) errors.password = 'Password must be at least 8 characters.';

  return { value: { name, email, password }, errors };
}

function validateLogin(body) {
  const errors = {};
  const email = cleanString(body.email).toLowerCase();
  const password = String(body.password || '');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Valid email is required.';
  if (!password) errors.password = 'Password is required.';

  return { value: { email, password }, errors };
}

function validateTask(body, partial = false) {
  const errors = {};
  const value = {};

  if (!partial || body.title !== undefined) {
    const title = cleanString(body.title);
    if (title.length < 2 || title.length > 160) errors.title = 'Title must be 2-160 characters.';
    value.title = title;
  }

  if (!partial || body.description !== undefined) {
    const description = cleanString(body.description);
    if (description.length > 2000) errors.description = 'Description must be 2000 characters or fewer.';
    value.description = description;
  }

  if (!partial || body.status !== undefined) {
    const status = cleanString(body.status);
    if (!allowedStatuses.includes(status)) errors.status = `Status must be one of: ${allowedStatuses.join(', ')}.`;
    value.status = status;
  }

  return { value, errors };
}

function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

module.exports = {
  allowedStatuses,
  validateRegister,
  validateLogin,
  validateTask,
  hasErrors
};
