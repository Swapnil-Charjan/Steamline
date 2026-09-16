# Streamline frontend

React + Vite creator studio for the backend in the parent directory.

## Run locally

1. Copy `.env.example` to `.env` and set `VITE_API_URL` to your backend API base URL.
2. Run `npm run dev` from this directory.

The backend must allow the Vite origin in `CORS_ORIGIN` (normally `http://localhost:5173`).

## Structure

- `src/components` — reusable layout, route guard, and video UI
- `src/context` — authenticated user state
- `src/lib` — Axios instance and global request/error handling
- `src/pages` — route-level screens
- `src/services` — backend endpoint wrappers

Authentication uses the returned access token as a Bearer token and keeps cookies enabled for deployments that use them.
