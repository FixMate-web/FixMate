# FixMate — Local Setup, Infrastructure & Operations Guide

> **Document Status:** Phase 1 Operations Guide

---

## 1. Environment Requirements

| Tool | Recommended Version | Verified Version in Workspace | Notes |
| :--- | :--- | :--- | :--- |
| **OS** | Linux (Ubuntu) / WSL2 | Linux Ubuntu | All scripts use POSIX paths |
| **Node.js** | `>= 20.x` LTS | `v24.21.0` | Required for Angular v22 & NestJS |
| **npm** | `>= 10.x` | `11.19.0` | Respect `package-lock.json` |
| **Docker & Compose** | Docker `>= 24`, Compose `v2+` | Docker `29.8.2`, Compose `v5.5.1` | Runs MongoDB 7 locally |

---

## 2. Database Infrastructure (`compose.yaml`)

### 2.1 Starting & Stopping MongoDB (Phase 1 Default)
From the repository root:
```bash
# Validate compose file syntax
docker compose config

# Start MongoDB in the background
docker compose up -d mongodb

# Check container health status
docker compose ps

# View MongoDB logs
docker compose logs -f mongodb

# Stop containers without deleting volumes
docker compose stop
```

### 2.2 Host vs. Docker Connection Strings
- **Option A — Running NestJS on the Host (Recommended for Phase 1 Development):**
  - NestJS runs directly via `npm run start:dev` on your host machine and connects to the mapped host port `27017`:
    ```env
    MONGODB_URI=mongodb://127.0.0.1:27017/fixmate
    ```
- **Option B — Running NestJS inside the Docker Compose Network (Future Containerized Workflow):**
  - When NestJS runs inside a container on the `fixmate_default` network, use the service hostname `mongodb`:
    ```env
    MONGODB_URI=mongodb://mongodb:27017/fixmate
    ```

### 2.3 Optional Redis Service (Deferred to Phase 4)
Redis is **not required** to run Phase 1. It is included in `compose.yaml` under the `phase4` profile for future caching and BullMQ background queues. To start it explicitly in later phases:
```bash
docker compose --profile phase4 up -d
```

### 2.4 MongoDB Replica Set Requirement for Future Phase 3 Transactions
In Phase 3, accepting a booking (`REQUESTED` → `ACCEPTED`) locks multiple 30-minute documents in `provider_slots` and updates `bookings` + `booking_events`.
- **Single-Document / Unique Index Guarantee (Phase 1 & Standalone MongoDB):** Even on a standalone MongoDB instance, the unique compound index `{ providerProfileId: 1, slotStartUtc: 1 }` on `provider_slots` prevents two overlapping bookings from claiming the same 30-minute slot.
- **Multi-Document ACID Transactions (Phase 3 Booking Acceptance):** Multi-document transactions (`session.withTransaction(...)`) require either **MongoDB Atlas** (which runs a 3-node replica set by default) or a local single-node replica set (`--replSet rs0`).
- **How to Enable & Validate a Single-Node Replica Set Locally Before Phase 3:**
  1. Start MongoDB with `--replSet rs0` and run:
     ```bash
     docker exec -it fixmate-mongodb mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: '127.0.0.1:27017'}]})"
     ```
  2. Verify replica set status:
     ```bash
     docker exec -it fixmate-mongodb mongosh --eval "rs.status().ok"
     ```

---

## 3. Backend Setup & Verification (`backend/`)

### 3.1 Environment Variables
Copy `.env.example` to `.env`:
```bash
cd backend
cp -n .env.example .env
```

Required variables validated at startup by `validateEnvironment` (`src/config/env.validation.ts`):
- `NODE_ENV`: `development` | `test` | `production`
- `PORT`: valid TCP port (`1`–`65535`, default `3000`)
- `MONGODB_URI`: must start with `mongodb://` or `mongodb+srv://`
- `CORS_ORIGINS`: comma-separated list of allowed frontend origins (e.g., `http://localhost:4200`)

If any required variable is missing or malformed, NestJS refuses to boot and prints a clear validation summary without echoing secret values.

### 3.2 Commands
```bash
cd backend
npm install
npm run build
npm run lint
npm test -- --runInBand
npm run start:dev
```

### 3.3 Healthcheck Endpoint
With the backend running:
```bash
curl -i http://localhost:3000/api/v1/health
```
Expected response (`200 OK`):
```json
{
  "status": "ok",
  "service": "fixmate-backend",
  "version": "0.1.0",
  "environment": "development",
  "timestamp": "2026-10-29T12:00:00.000Z",
  "uptimeSeconds": 12,
  "database": {
    "status": "connected"
  }
}
```
If MongoDB is stopped while the backend is running, `GET /api/v1/health` gracefully reports `"status": "degraded"` and `"database": { "status": "disconnected" }` without crashing the process or leaking connection strings.

---

## 4. Frontend Setup & Verification (`frontend/`)

### 4.1 Environment Configuration
- `frontend/src/environments/environment.development.ts`: points `apiBaseUrl` to `http://localhost:3000/api/v1` and enables development tools (`enableDevShowcase: true`).
- `frontend/src/environments/environment.ts`: production configuration template (`enableDevShowcase: false`).

### 4.2 Commands
```bash
cd frontend
npm install
npm run build
npm test -- --watch=false
npm start
```
The dev server listens on `http://localhost:4200`. If the backend API is offline, the frontend banner displays a clear **"API Offline / Degraded"** connection badge rather than failing to render.

---

## 5. Inspecting MongoDB Collections & Indexes Locally

Once the NestJS backend has started in `development` mode against `fixmate-mongodb`, Mongoose automatically builds all declared schema indexes (`autoIndex: true`). You can verify them directly via `mongosh`:

```bash
docker exec fixmate-mongodb mongosh "mongodb://127.0.0.1:27017/fixmate" --quiet --eval "
  const cols = ['users', 'provider_profiles', 'categories', 'services', 'provider_services', 'provider_slots', 'addresses', 'bookings', 'booking_events', 'reviews', 'notifications'];
  for (const c of cols) {
    print('=== ' + c + ' ===');
    printjson(db.getCollection(c).getIndexes());
  }
"
```

---

## 6. Safe Troubleshooting

1. **Port `27017` Already in Use:**
   - Check if a host `mongod` service is already running (`ss -tlnp | grep 27017`). Either use the existing local MongoDB instance (`mongodb://127.0.0.1:27017/fixmate`) or set `MONGODB_HOST_PORT=27018` when starting Docker Compose and update `backend/.env` accordingly.
2. **Port `3000` or `4200` Already in Use:**
   - Update `PORT=3001` in `backend/.env` (and matching `apiBaseUrl` in `frontend/src/environments/environment.development.ts`), or pass `--port 4201` to `ng serve`.
3. **CORS Error in Browser:**
   - Ensure the exact browser origin (e.g., `http://localhost:4200`) is listed in `CORS_ORIGINS` in `backend/.env`.
