# React Frontend

React UI for the assignment API. It supports registration, login, protected profile loading, task creation, task status updates, and task deletion.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5174.

The frontend calls `/api/v1` by default and Vite proxies that to `http://localhost:3000`. To change it, create `.env` from `.env.example` and set `VITE_API_BASE_URL`.
