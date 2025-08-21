# Clinician Appointment System API

A simple TypeScript + Express REST API that manages clinician appointments using a local SQLite DB (via better-sqlite3).

This README explains the repository structure, the tech stack used, the API endpoints, role-based authorisation (no authentication), and how the system prevents overlapping appointments (concurrency safety).

## Running the project

- Clone the repo `git clone https://github.com/KIAND-glitch/clinician_appt_system.git`
- Install deps: `npm install`
- Dev server: `npm run dev` (uses `ts-node-dev`)
- Build: `npm run build`
- Run tests: `npm test` (Jest + Supertest). Tests use `process.env.DB_PATH = ':memory:'` so they run against an in-memory SQLite instance.
- Start server: `npm start`
- Seed database: `npm run seed`
- API docs (Swagger UI): `GET /docs` when the server is running


## Repo structure

- `package.json`, `tsconfig.json`, `README.md` - project metadata and build config
- `src/`
    - `config/` - database setup initialisation (`db.ts`)
	- `app.ts` - Express app factory and global middleware
	- `server.ts` - Process entry that starts the server
	- `routes/` - Maps API endpoints to controller methods
	- `controllers/` - Handles logic from routes
	- `services/` - Business logic functionality
	- `repositories/` - Data access logic using raw DB queries
	- `entities/` - Domain entities with Zod schemas
	- `middlewares/` - Validation and role-based authorisation
	- `docs/` - swagger spec generator and UI mounting
	- `types/` - small local declaration files
- `tests/` - Jest + Supertest integration tests
- `scripts/` - Data seeding

## Tech stack

- **TypeScript** — Strongly typed JavaScript for safer, maintainable code.
- **Express** — Minimalist web framework for building REST APIs.
- **SQLite (via `better-sqlite3`)** — Embedded, fast, zero-config SQL database.
- **Zod for schema validation** — Ensures request/response data is well-formed.
- **Jest + Supertest for tests** — Automated integration and API endpoint testing.
- **Swagger UI (`/docs`) for API documentation** — Interactive, auto-generated API docs.

## Authorisation

- This project uses role-based authorisation only. There is no authentication.
- The role is provided via the `X-Role` HTTP header (e.g. `X-Role: patient` or `X-Role: admin` or `X-Role: clinician`).
- Routes check the role and return `403 Forbidden` status if the caller lacks privileges.

Roles used in this app:
- `patient` — can create appointments (POST /appointments)
- `clinician` — can list their appointments (GET /clinicians/{id}/appointments)
- `admin` — can create appointments and list all appointments (GET /appointments)

## API Endpoints

All datetimes are ISO 8601 strings (e.g. `2025-08-20T15:30:00.000Z`). Invalid ISO strings are rejected with `400 Bad Request`.

- POST /appointments
	- Allowed roles: `patient`, `admin`
	- Request body (JSON):
		- `clinicianId` (string)
		- `patientId` (string)
		- `start` (ISO datetime)
		- `end` (ISO datetime)
	- Responses:
		- `201 Created` — returns the created appointment JSON on success
		- `409 Conflict` — when the requested slot overlaps an existing appointment for the same clinician
		- `400 Bad Request` — invalid input (missing fields, invalid ISO datetimes, start is not strictly before end, or appointment in the past)
    - Example curl request
    ```bash
        curl -s -X POST http://localhost:3000/appointments \
        -H 'Content-Type: application/json' \
        -H 'X-Role: patient' \
        -d '{
            "clinicianId":"c1",
            "patientId":"p1",
            "start":"2025-10-21T03:00:00.000Z",
            "end":"2025-10-21T03:30:00.000Z"
        }' | jq
    ```

- GET /clinicians/{id}/appointments
	- Allowed roles: `clinician`, `admin`
	- Path param: `id` (clinician id)
	- Optional query params: `from` (ISO datetime), `to` (ISO datetime)
	- Responses:
    -  `200 OK` array of appointments for that clinician (filtered by optional from/to) or an empty array if the clinician has no appointments.
    -  `404 Not Found` if the clinician does not exist.
    -  `400 Bad Request` if the query parameters are invalid.
    - Example curl request
    ```bash
        curl -s -X GET http://localhost:3000/clinicians/c1/appointments \
        -H 'X-Role: clinician' \
        -d '{
            "from":"2025-10-21T00:00:00.000Z",
            "to":"2025-10-21T23:59:59.999Z"
        }' | jq
    ```

- GET /appointments
	- Allowed roles: `admin`
	- Optional query params: `from` (ISO datetime), `to` (ISO datetime)
	- Responses:
		- `200 OK` array of appointments (filtered by optional from/to)
		- `400 Bad Request` if the query parameters are invalid.
    - Example curl request
    ```bash
        curl -s -X GET http://localhost:3000/appointments \
        -H 'X-Role: admin' \
        -d '{
            "from":"2025-10-21T00:00:00.000Z",
            "to":"2025-10-21T23:59:59.999Z"
        }' | jq
    ```

Additional behavior
- Appointments in the past are rejected when creating (400).
- Query filtering semantics: when provided, `from` and `to` narrow the returned appointments to those that fall within the requested bounds (start >= from and end <= to when both provided).
- Zero length or negative duration appointments are rejected (400).

## Concurrency safety and DB-level constraints
  
### How it works 

There are **two layers**:

1. **Optimistic pre-check (service)**
   - Before insert, query for any appointment where  
     `start < other.end && end > other.start`.
   - If found → **409 Conflict**, this gives users a clear error without relying on a DB failure.

2. **Authoritative DB-level guard (trigger)**
   - A SQLite `BEFORE INSERT` trigger re-checks the same condition and **aborts** the write if an overlap exists.
   - This protects against the case where multiple requests pass the pre-check concurrently.

> Even if N clients POST the same slot at once and all pass the pre-check, **exactly one** insert will succeed; the rest will be aborted by the trigger. The concurrency test fires many parallel POSTs and asserts one `201` and the rest `409`, and that the DB has **exactly one** row for that slot.

### Why this prevents race conditions

- The **final decision** happens **inside the database** at the moment of insert, under SQLite’s locking rules.  
- The trigger predicate (`NEW.start < a.end AND NEW.end > a.start`) ensures **no overlapping row can be committed** for the same clinician, regardless of timing, process count, or app instances.  

### What isn’t perfectly transactional yet

- `ensurePatient`, `ensureClinician`, and the `INSERT` currently run as separate statements (no explicit transaction).  
- These steps can **interleave** across concurrent requests. The overlap invariant still holds (the trigger blocks conflicting inserts), but the overall “create appointment” operation isn’t a single atomic **unit of work**.

### Future improvement: Unit of Work (transaction)

To make the entire operation atomic and fully race-safe, wrap the related statements in **one transaction**:

#### Benefits:

- The “ensure + insert” steps become all-or-nothing.
- No interleaving between steps across concurrent requests.
- The DB trigger still provides the final overlap check, so correctness is preserved at commit time.


## Design Decisions, Trade-offs & Limits

### Data model
- **appointments** (has schema & rules)
  - Fields: `id (uuid)`, `clinicianId`, `patientId`, `start (ISO)`, `end (ISO)`, `createdAt (ISO)`.
  - Constraints (app/service + DB trigger):
    - `start < end` (zero/negative durations rejected).
    - **No overlaps** per clinician; **touching** endpoints allowed (`end == other.start`).
    - **Past** start times rejected on create.
- **clinicians**, **patients**
  - Just `id TEXT PRIMARY KEY`.  
  - **Auto-created on first use** (when a booking references them).  
  - Intentionally minimal for this challenge scope.

---

### Validation strategy
- **Route layer (Zod)**: structure/shape checks (required fields, parseable ISO datetimes).
- **Service layer (semantics)**:
  - `start < end` (strict).
  - `start > now` (no past).
  - Normalize to **UTC** via `toISOString()` before persistence.
  - **Optimistic pre-check** for overlap (helpful `409` before hitting DB).
- **DB layer (authoritative)**:
  - `BEFORE INSERT/UPDATE` trigger re-checks overlap to close race windows (only one insert wins).

---

### Error semantics (intentional)

- Invalid input (bad ISO, `from > to`, zero or negative durations) still yields **`400`**. Authorization failures yield **`403`** for all endpoints.

---

### Operational considerations
- **Single-process sweet spot**: `better-sqlite3` is synchronous; great for local/dev and small single-node deployments.
- **Race safety**: overlap invariant is enforced at the **database** via trigger; multiple concurrent creates for the same slot → exactly one success, others rejected.
- **Schema bootstrapping**: tables created at startup. .
- **Times**: always stored and returned as **ISO-8601 UTC** strings to keep text comparisons correct and predictable.
- Conversion to local time zones should be handled by the client.
---

### Future work
- **Unit of Work (transaction)**: wrap `ensurePatient`, `ensureClinician`, and `INSERT … appointments` in a single transaction to make create fully **atomic** (removes interleaving; DB trigger still the final guard).
- **Pagination**: add `limit/offset` (or cursor) to `GET /appointments` and clinician lists.
- **Authentication**: real auth (e.g., JWT/OIDC) + RBAC instead of header-simulated roles.
- **Migrations**: introduce a migration tool for schema evolution.
- **Scaling DB**: move to Postgres for multi-instance deployments; consider an **exclusion constraint** on the time range per clinician.
- **Observability**: structured logs, request IDs, and basic metrics.

## Tests (`npm test`)


**Framework:** Jest + Supertest against the real Express app and real SQL (no mocks).  
**DB:** `better-sqlite3` with in-memory SQLite. 

#### What’s covered

##### Create (POST /appointments)
- **201** on valid create  
- **409** on overlaps (same clinician)  
- **201** when endpoints just touch  
- **201** same slot across different clinicians  
- **400** for invalid ISO, zero-length, past, missing fields  
- **Role checks:** **201** for admin; **403** for unknown roles

##### Admin list (GET /appointments)
- **200** all upcoming by default  
- `from`/`to` filtering (bounds validated)  
- **400** invalid ranges/params  
- **403** non-admin

##### Clinician schedule (GET /clinicians/:id/appointments)
- **200** only that clinician’s appointments, ordered by start  
- `from`/`to` filtering  
- **404** unknown clinician; **403** non-clinician/admin  
- **400** invalid params *(controller logs a 404 in this test — expected)*

##### Concurrency
- Same clinician & slot, many concurrent POSTs → exactly **one 201**, rest **409**  
- Same slot across different clinicians → **all 201**

##### Race outcome (determinism)
- 4 patients race the same slot over multiple trials → always **one winner**, and the **winner varies** (normal non-determinism; correctness preserved)

## Notes

- The project intentionally uses a header `X-Role` for role-based checks. In production you would normally combine authentication (who the caller is) and authorization (what they may do).

- My current implementation does solve the critical overlap race via a database trigger, ensuring only one conflicting insert can ever succeed. To make the full “create appointment” flow perfectly transactional, the next step is adopting a small Unit of Work transaction around the ensure + insert statements.
