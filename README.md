# Backend Developer Intern Assignment

This project is split into two folders:

- `backend/` - versioned REST API with JWT auth, role-based access, tasks CRUD, OpenAPI docs, and a Postgres schema.
- `frontend/` - React UI for registration, login, protected dashboard access, and task CRUD.

## Run The Backend

```bash
cd backend
npm start
```

Backend URLs:

- API root: http://localhost:3000
- Health check: http://localhost:3000/api/v1/health
- API docs: http://localhost:3000/docs
- OpenAPI JSON: http://localhost:3000/openapi.json

The backend seeds an admin account on first run:

- Email: `admin@example.com`
- Password: `Admin@12345`

## Run The React Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

- React app: http://localhost:5174

The frontend proxies API calls to the backend at `http://localhost:3000`. To change that, create `frontend/.env` from `frontend/.env.example` and set:

```bash
VITE_API_BASE_URL=/api/v1
```

## Quick Scripts

From the project root:

```bash
npm run backend
npm run backend:test
npm run frontend
```

Run `npm install` inside `frontend/` before starting the React app.

## Backend Features

- User registration and login with PBKDF2 password hashing
- JWT authentication using `Authorization: Bearer <token>`
- Role-based access for `user` and `admin`
- Versioned API under `/api/v1`
- CRUD APIs for tasks
- Request validation and consistent JSON errors
- OpenAPI documentation at `/docs` and `/openapi.json`
- Postgres schema at `backend/db/schema.sql`

## API Summary

All API routes are versioned under `/api/v1`.

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| GET | `/health` | Public | Health check |
| POST | `/auth/register` | Public | Create a user account |
| POST | `/auth/login` | Public | Login and receive a JWT |
| GET | `/auth/me` | Authenticated | Get current user profile |
| GET | `/users` | Admin | List users |
| GET | `/tasks` | Authenticated | List own tasks, or all tasks for admins |
| POST | `/tasks` | Authenticated | Create task |
| GET | `/tasks/:id` | Owner/Admin | Get task |
| PATCH | `/tasks/:id` | Owner/Admin | Update task |
| DELETE | `/tasks/:id` | Owner/Admin | Delete task |

## Example Requests

Register:

```bash
curl -X POST http://localhost:3000/api/v1/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Dev User\",\"email\":\"dev@example.com\",\"password\":\"Password@123\"}"
```

Login:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"dev@example.com\",\"password\":\"Password@123\"}"
```

Create a task:

```bash
curl -X POST http://localhost:3000/api/v1/tasks ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"title\":\"Build API\",\"description\":\"Finish assignment backend\",\"status\":\"todo\"}"
```

## Database Schema

The runnable backend uses a JSON file repository so the assignment works without installing a database server. A production-ready Postgres schema is included at `backend/db/schema.sql`, and the repository layer is isolated in `backend/src/repositories/store.js` so it can be swapped for Postgres, MySQL, or MongoDB without changing route handlers.

## Scalability Note

The backend is organized by modules: config, repositories, middleware, routes, utilities, docs, and tests. For a production deployment:

- Replace the JSON repository with Postgres using the schema in `backend/db/schema.sql`.
- Put the API behind a load balancer and keep instances stateless by storing sessions only as signed JWTs.
- Add Redis for rate limiting, hot task lists, and short-lived token deny-lists.
- Add structured logging and centralized metrics.
- Split modules into services only when traffic or team ownership demands it, for example auth, task management, and notifications.
- Run migrations in CI/CD and deploy the backend and frontend separately.

## Security Notes

- Passwords are never stored directly; they are hashed with PBKDF2 and per-user salts.
- JWTs are signed with HMAC SHA-256 and expiration checks.
- Protected endpoints require a bearer token.
- Admin routes check the authenticated user role.
- Inputs are validated before reaching the repository.
- In production, set a strong `JWT_SECRET`, serve over HTTPS, and consider HTTP-only secure cookies for browser token storage.
