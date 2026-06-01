
import { useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const emptyTaskForm = { title: '', description: '', status: 'todo' };

/* ─────────────────────────────────────────────
   AUTH PAGE
───────────────────────────────────────────── */
function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  async function api(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message || 'Request failed');
    return payload.data;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (mode === 'register') {
        await api('/auth/register', { method: 'POST', body: JSON.stringify(authForm) });
        setMode('login');
        setMessage({ text: 'Account created — you can log in now.', type: 'success' });
        return;
      }
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: authForm.email, password: authForm.password }),
      });
      sessionStorage.setItem('token', data.token);
      onLogin(data.token, data.user);
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  }

  return (
    <div className="auth-root">
      {/* Left decorative column */}
      <div className="auth-aside">
        <div className="auth-aside__inner">
          <div className="auth-logo">
            <span className="auth-logo__icon">✦</span>
            <span className="auth-logo__name">TaskAPI</span>
          </div>
          <h2 className="auth-aside__headline">
            Ship tasks,<br />not boilerplate.
          </h2>
          <p className="auth-aside__sub">
            A fully‑featured REST API demo with JWT auth, roles, and live task management.
          </p>
          <div className="auth-aside__chips">
            {['JWT Auth', 'REST API', 'Role‑based', 'Live CRUD'].map(c => (
              <span key={c} className="chip">{c}</span>
            ))}
          </div>
        </div>
        <div className="auth-aside__deco" aria-hidden="true">
          <div className="deco-ring deco-ring--1" />
          <div className="deco-ring deco-ring--2" />
          <div className="deco-ring deco-ring--3" />
        </div>
      </div>

      {/* Right form column */}
      <div className="auth-form-col">
        <div className="auth-card">
          <div className="auth-card__header">
            <h1>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
            <p className="auth-card__sub">
              {mode === 'login'
                ? 'Sign in to access your dashboard.'
                : 'Fill in your details to get started.'}
            </p>
          </div>

          <div className="toggle-row">
            {['login', 'register'].map(m => (
              <button
                key={m}
                type="button"
                className={`toggle-btn ${mode === m ? 'active' : ''}`}
                onClick={() => { setMode(m); setMessage({ text: '', type: '' }); }}
              >
                {m === 'login' ? 'Login' : 'Register'}
              </button>
            ))}
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="field">
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  autoComplete="name"
                  placeholder="Enter Name"
                  value={authForm.name}
                  onChange={e => setAuthForm({ ...authForm, name: e.target.value })}
                />
              </div>
            )}
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={authForm.email}
                placeholder="Enter Email"
                onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="Enter Password"
                value={authForm.password}
                onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
              />
            </div>

            {message.text && (
              <div className={`auth-msg auth-msg--${message.type}`} role="alert">
                {message.text}
              </div>
            )}

            <button type="submit" className="btn-primary">
              {mode === 'login' ? 'Sign in →' : 'Create account →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DASHBOARD PAGE
───────────────────────────────────────────── */
const STATUS_ORDER = ['todo', 'in_progress', 'done'];
const STATUS_NEXT  = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
const STATUS_LABEL = { todo: 'To do', in_progress: 'In progress', done: 'Done' };

function DashboardPage({ token, user: initialUser, onLogout }) {
  const [profile, setProfile] = useState(initialUser);
  const [tasks, setTasks]     = useState([]);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [message, setMessage]  = useState({ text: '', type: '' });
  const [filter, setFilter]    = useState('all');

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  async function api(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...authHeaders, ...(options.headers || {}) },
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message || 'Request failed');
    return payload.data;
  }

  async function loadTasks() {
    try {
      const data = await api('/tasks');
      setTasks(data.tasks);
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  }

  useEffect(() => { loadTasks(); }, []);

  async function handleAddTask(e) {
    e.preventDefault();
    try {
      await api('/tasks', { method: 'POST', body: JSON.stringify(taskForm) });
      setTaskForm(emptyTaskForm);
      setMessage({ text: 'Task added.', type: 'success' });
      await loadTasks();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  }

  async function cycleStatus(task) {
    try {
      await api(`/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: STATUS_NEXT[task.status] }),
      });
      await loadTasks();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  }

  async function deleteTask(id) {
    try {
      await api(`/tasks/${id}`, { method: 'DELETE' });
      setMessage({ text: 'Task deleted.', type: 'success' });
      await loadTasks();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  }

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const counts = useMemo(() => {
    const c = { all: tasks.length, todo: 0, in_progress: 0, done: 0 };
    tasks.forEach(t => c[t.status]++);
    return c;
  }, [tasks]);

  return (
    <div className="dash-root">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar__logo">
          <span className="auth-logo__icon">✦</span>
          <span className="auth-logo__name">TaskAPI</span>
        </div>

        <div className="sidebar__profile">
          <div className="avatar">{(profile?.name || 'U')[0].toUpperCase()}</div>
          <div>
            <p className="sidebar__name">{profile?.name}</p>
            <p className="sidebar__role">{profile?.role}</p>
          </div>
        </div>

        <nav className="sidebar__nav">
          {[['all', 'All tasks'], ...STATUS_ORDER.map(s => [s, STATUS_LABEL[s]])].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`nav-item ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              <span>{label}</span>
              <span className="nav-count">{counts[key] ?? 0}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar__footer">
          <a href="/docs" target="_blank" rel="noreferrer" className="sidebar__link">
            API Docs ↗
          </a>
          <button type="button" className="btn-logout" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="dash-main">
        <div className="dash-top">
          <h1 className="dash-title">My Tasks</h1>
          <p className="dash-sub">{profile?.email}</p>
        </div>

        {/* Add task form */}
        <form className="add-task-bar" onSubmit={handleAddTask}>
          <input
            className="atb-input atb-title"
            placeholder="Task title…"
            value={taskForm.title}
            onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
            required
          />
          <input
            className="atb-input atb-desc"
            placeholder="Description (optional)"
            value={taskForm.description}
            onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
          />
          <select
            className="atb-select"
            value={taskForm.status}
            onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}
          >
            {STATUS_ORDER.map(s => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <button type="submit" className="btn-primary btn-add">+ Add task</button>
        </form>

        {/* Feedback */}
        {message.text && (
          <div className={`dash-msg dash-msg--${message.type}`} role="alert">
            {message.text}
            <button type="button" className="msg-close" onClick={() => setMessage({ text: '', type: '' })}>×</button>
          </div>
        )}

        {/* Task list */}
        <div className="task-list">
          {filtered.length === 0 && (
            <div className="task-empty">
              <span>No tasks here yet.</span>
            </div>
          )}
          {filtered.map(task => (
            <article key={task.id} className={`task-card task-card--${task.status}`}>
              <div className="task-card__body">
                <span className={`status-dot status-dot--${task.status}`} />
                <div>
                  <h3 className="task-card__title">{task.title}</h3>
                  {task.description && <p className="task-card__desc">{task.description}</p>}
                </div>
              </div>
              <div className="task-card__actions">
                <span className={`badge badge--${task.status}`}>{STATUS_LABEL[task.status]}</span>
                <button type="button" className="btn-cycle" title="Advance status" onClick={() => cycleStatus(task)}>
                  Next ↻
                </button>
                <button type="button" className="btn-delete" title="Delete task" onClick={() => deleteTask(task.id)}>
                  ✕
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOT
───────────────────────────────────────────── */
export default function App() {
  const [token, setToken]   = useState(() => sessionStorage.getItem('token') || '');
  const [user, setUser]     = useState(null);

  function handleLogin(tok, userData) {
    setToken(tok);
    setUser(userData);
  }

  function handleLogout() {
    sessionStorage.removeItem('token');
    setToken('');
    setUser(null);
  }

  if (token && user) {
    return <DashboardPage token={token} user={user} onLogout={handleLogout} />;
  }

  return <AuthPage onLogin={handleLogin} />;
}