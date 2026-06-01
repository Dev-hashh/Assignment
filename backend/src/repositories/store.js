const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');
const { hashPassword } = require('../utils/security');

function now() {
  return new Date().toISOString();
}

class Store {
  constructor(filePath = config.dbFile) {
    this.filePath = filePath;
    this.data = { users: [], tasks: [] };
  }

  load() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    if (fs.existsSync(this.filePath)) {
      this.data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
    } else {
      this.seed();
      this.save();
    }
  }

  seed() {
    const timestamp = now();
    this.data.users.push({
      id: crypto.randomUUID(),
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: hashPassword('Admin@12345'),
      role: 'admin',
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  save() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }

  createUser({ name, email, passwordHash, role = 'user' }) {
    const timestamp = now();
    const user = {
      id: crypto.randomUUID(),
      name,
      email,
      passwordHash,
      role,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.data.users.push(user);
    this.save();
    return user;
  }

  findUserByEmail(email) {
    return this.data.users.find(user => user.email === email);
  }

  findUserById(id) {
    return this.data.users.find(user => user.id === id);
  }

  listUsers() {
    return [...this.data.users].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  listTasks(user) {
    const tasks = user.role === 'admin'
      ? this.data.tasks
      : this.data.tasks.filter(task => task.ownerId === user.id);
    return [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  createTask(ownerId, { title, description, status }) {
    const timestamp = now();
    const task = {
      id: crypto.randomUUID(),
      ownerId,
      title,
      description: description || '',
      status,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.data.tasks.push(task);
    this.save();
    return task;
  }

  findTaskById(id) {
    return this.data.tasks.find(task => task.id === id);
  }

  updateTask(id, changes) {
    const task = this.findTaskById(id);
    if (!task) return null;
    Object.assign(task, changes, { updatedAt: now() });
    this.save();
    return task;
  }

  deleteTask(id) {
    const index = this.data.tasks.findIndex(task => task.id === id);
    if (index === -1) return false;
    this.data.tasks.splice(index, 1);
    this.save();
    return true;
  }
}

module.exports = Store;
