const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const dataFile = path.join(root, 'data', 'db.json');
const port = 3137;

async function request(pathname, options = {}) {
  const response = await fetch(`http://localhost:${port}${pathname}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const payload = await response.json();
  return { response, payload };
}

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      const { response } = await request('/api/v1/health');
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Server did not start');
}

(async () => {
  if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

  const child = spawn(process.execPath, ['src/server.js'], {
    cwd: root,
    env: { ...process.env, PORT: String(port), JWT_SECRET: 'test-secret' },
    stdio: 'ignore'
  });

  try {
    await waitForServer();

    const register = await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test User', email: 'test@example.com', password: 'Password@123' })
    });
    assert.equal(register.response.status, 201);

    const login = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'Password@123' })
    });
    assert.equal(login.response.status, 200);
    const token = login.payload.data.token;
    assert.ok(token);

    const create = await request('/api/v1/tasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'Test task', description: 'Created by test', status: 'todo' })
    });
    assert.equal(create.response.status, 201);
    const taskId = create.payload.data.task.id;

    const update = await request(`/api/v1/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'done' })
    });
    assert.equal(update.response.status, 200);
    assert.equal(update.payload.data.task.status, 'done');

    const adminLogin = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@example.com', password: 'Admin@12345' })
    });
    assert.equal(adminLogin.response.status, 200);

    const users = await request('/api/v1/users', {
      headers: { Authorization: `Bearer ${adminLogin.payload.data.token}` }
    });
    assert.equal(users.response.status, 200);
    assert.ok(users.payload.data.users.length >= 2);

    console.log('API tests passed');
  } finally {
    child.kill();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
