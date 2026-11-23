# E-commerce Backend

A backend API for an e-commerce application, built step by step as a 14-week project.
Built with Node.js, Express, TypeScript, PostgreSQL, Prisma and Redis.

## Features so far

- User registration and login with bcrypt password hashing
- JWT access tokens (15 minutes) and refresh tokens (7 days)
- Refresh token rotation with reuse detection
- Logout from one device or from all devices
- Role-based access control (`CUSTOMER`, `ADMIN`)
- Request validation with Zod
- Centralized error handling with custom error classes
- Structured JSON logging with Pino and request IDs

## Tech stack

Node.js, Express, TypeScript, PostgreSQL, Prisma 6, Redis, Zod, Pino, Docker

## Getting started

1. Clone the repo and install packages:

   ```bash
   git clone https://github.com/sameerkumar3497-dotcom/ecommerce-backend.git
   cd ecommerce-backend
   npm install
   ```

2. Create your environment file and fill in the values:

   ```bash
   cp .env.example .env
   ```

   Generate a secret for `JWT_ACCESS_SECRET` with:

   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. Start PostgreSQL and Redis:

   ```bash
   docker compose up -d
   ```

4. Create the database tables and an admin user:

   ```bash
   npx prisma migrate dev
   npm run seed:admin
   ```

5. Start the server:

   ```bash
   npm run dev
   ```

The API runs at `http://localhost:3000`. Check `http://localhost:3000/health`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the server with auto-reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build |
| `npm run lint` | Check code with ESLint |
| `npm run format` | Format code with Prettier |
| `npm run seed:admin` | Create (or promote) the admin from `.env` |
| `npm run smoke` | Run the end-to-end smoke test (server must be running) |

## Environment variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default 3000) |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_ACCESS_SECRET` | Long random secret used to sign access tokens |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Credentials used by `npm run seed:admin` |
| `NODE_ENV` | `development` or `production` |
| `LOG_LEVEL` | `debug`, `info`, `warn` or `error` |

## API

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/health` | Public | Checks the API, PostgreSQL and Redis |
| POST | `/auth/register` | Public | Create an account |
| POST | `/auth/login` | Public | Get an access token and a refresh token |
| POST | `/auth/refresh` | Public | Exchange a refresh token for a new pair |
| POST | `/auth/logout` | Public | Revoke one refresh token |
| GET | `/auth/me` | Logged in | Get the current user |
| POST | `/auth/logout-all` | Logged in | Revoke all refresh tokens of the user |
| GET | `/admin/ping` | Admin | Test route for role-based access |

Protected routes need this header:

```
Authorization: Bearer <access token>
```

### Example: login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"MyPassword123"}'
```

```json
{
  "user": { "id": "...", "name": "Test User", "email": "test@example.com", "role": "CUSTOMER" },
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "9f2a41..."
}
```

### Errors

Every error has the same shape:

```json
{ "error": "Validation failed", "details": [{ "field": "email", "message": "A valid email is required" }] }
```

`details` appears only for validation errors.

| Status | Meaning |
|---|---|
| 400 | Invalid input |
| 401 | Not logged in, bad credentials or expired token |
| 403 | Logged in but not allowed |
| 404 | Route or record not found |
| 409 | Already exists (for example, a duplicate email) |
| 500 | Unexpected server error (details are only in the server logs) |

## Project structure

```
src/
  config/        environment, database, Redis, logger
  controllers/   read the request, call a service, send the response
  middlewares/   authenticate, authorize, validate, error handling
  repositories/  database queries only
  routes/        URL definitions
  schemas/       Zod validation schemas
  scripts/       command-line scripts (create admin)
  services/      business logic
  utils/         password and token helpers, error classes
prisma/          schema and migrations
scripts/         smoke test
```

## Design decisions

- **Layered architecture:** controllers handle HTTP, services hold business logic, repositories talk to the database.
- **Refresh tokens are stored as SHA-256 hashes**, so a database leak does not expose usable tokens.
- **Rotation with reuse detection:** each refresh token works once. Reusing an old one revokes all sessions of that user.
- **Validation at the edge:** Zod schemas clean and check input before it reaches the logic. Unknown fields are removed.
- **Safe errors:** unexpected errors return a generic message to the client and are logged with a request ID.
- **No secrets in logs:** request logs contain only the method, URL and status.

## Roadmap

- [x] Week 1: project setup, Docker, PostgreSQL, Redis
- [x] Week 2: database schema, authentication
- [x] Week 3: roles, validation, error handling, logging
- [ ] Week 4: products and categories
- [ ] Week 5: cart
- [ ] Week 6: orders and concurrency
- [ ] Week 7: payments
- [ ] Week 8: Redis caching and rate limiting
- [ ] Week 9: background jobs