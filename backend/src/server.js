const http = require('http');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const Store = require('./repositories/store');
const { sendJson, sendError, notFound } = require('./utils/http');
const { requireAuth, requireAdmin } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');

const publicDir = path.join(config.rootDir, 'public');
const store = new Store();
store.load();

function contentType(filePath) {
  const ext = path.extname(filePath);
  return {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8'
  }[ext] || 'application/octet-stream';
}

function serveFile(res, filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return notFound(res);
  }
  const body = fs.readFileSync(filePath);
  res.writeHead(200, {
    'Content-Type': contentType(filePath),
    'Content-Length': body.length
  });
  res.end(body);
}

function serveDocs(res) {
  const html = fs.readFileSync(path.join(publicDir, 'docs.html'), 'utf8');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

async function route(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = requestUrl.pathname;
  const method = req.method;

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization'
    });
    return res.end();
  }
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (pathname === '/') {
    return sendJson(res, 200, {
      success: true,
      data: {
        name: 'Backend Intern Assignment API',
        version: 'v1',
        docs: '/docs',
        health: '/api/v1/health'
      }
    });
  }
  if (pathname === '/docs') return serveDocs(res);
  if (pathname === '/openapi.json') return serveFile(res, path.join(config.rootDir, 'openapi.json'));

  if (pathname === '/api/v1/health' && method === 'GET') {
    return sendJson(res, 200, { success: true, data: { status: 'ok', version: 'v1' } });
  }

  if (pathname === '/api/v1/auth/register' && method === 'POST') return authRoutes.register(req, res, store);
  if (pathname === '/api/v1/auth/login' && method === 'POST') return authRoutes.login(req, res, store);

  if (pathname === '/api/v1/auth/me' && method === 'GET') {
    const user = requireAuth(store, req, res);
    if (!user) return;
    return authRoutes.me(req, res, user);
  }

  if (pathname === '/api/v1/users' && method === 'GET') {
    const user = requireAuth(store, req, res);
    if (!user || !requireAdmin(user, res)) return;
    return userRoutes.listUsers(req, res, store);
  }

  if (pathname === '/api/v1/tasks' && method === 'GET') {
    const user = requireAuth(store, req, res);
    if (!user) return;
    return taskRoutes.listTasks(req, res, store, user);
  }

  if (pathname === '/api/v1/tasks' && method === 'POST') {
    const user = requireAuth(store, req, res);
    if (!user) return;
    return taskRoutes.createTask(req, res, store, user);
  }

  const taskMatch = pathname.match(/^\/api\/v1\/tasks\/([a-f0-9-]+)$/i);
  if (taskMatch) {
    const user = requireAuth(store, req, res);
    if (!user) return;
    const id = taskMatch[1];
    if (method === 'GET') return taskRoutes.getTask(req, res, store, user, id);
    if (method === 'PATCH') return taskRoutes.updateTask(req, res, store, user, id);
    if (method === 'DELETE') return taskRoutes.deleteTask(req, res, store, user, id);
  }

  return notFound(res);
}

const server = http.createServer((req, res) => {
  const start = Date.now();
  route(req, res).catch(error => {
    const status = error.statusCode || 500;
    sendError(res, status, status === 500 ? 'Internal server error' : error.message);
  }).finally(() => {
    console.log(`${req.method} ${req.url} ${res.statusCode} ${Date.now() - start}ms`);
  });
});

if (require.main === module) {
  server.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
    console.log(`API docs available at http://localhost:${config.port}/docs`);
  });
}

module.exports = { server, store };
