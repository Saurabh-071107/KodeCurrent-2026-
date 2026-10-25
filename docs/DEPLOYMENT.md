# DraftMate AI — Production Deployment & Operations Guide

**Reference Document:** `docs/DEPLOYMENT.md`  
**Target Environments:** Staging / Production  
**Architecture:** Next.js Frontend + Express 5 Node.js Gateway + Python FastAPI AI Engine + MongoDB Atlas

---

## 1. Production Architecture Overview

```
                                  INTERNET
                                     │
                             [ Cloudflare CDN ]
                         (TLS 1.3 Termination, WAF)
                         ┌───────────┴───────────┐
                         ▼                       ▼
               [ Next.js Frontend ]    [ Express API Gateway ]
               (Vercel / Node App)     (Container / Port 5000)
                                                 │
                               ┌─────────────────┴─────────────────┐
                               ▼                                   ▼
                    [ MongoDB Atlas Cluster ]            [ Python AI Engine ]
                     (TLS / Private Peering)             (FastAPI / Internal VPC)
```

---

## 2. Environment Variables Configuration

### 2.1 Backend (`backend/.env`)
All required production configuration keys:

| Variable Name | Required | Default / Format | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | `production` | Enables security optimizations and disables test bypasses |
| `PORT` | Yes | `5000` | Port for the Express server |
| `MONGODB_URI` | Yes | `mongodb+srv://...` | Connection string to MongoDB Atlas replica set |
| `JWT_SECRET` | Yes | `64+ char random hex` | Secret key for signing short-lived access tokens |
| `JWT_REFRESH_SECRET`| Yes | `64+ char random hex` | Distinct secret key for refresh token operations |
| `FRONTEND_URL` | Yes | `https://draftmate.ai` | Exact origin permitted by CORS policy (no wildcards) |
| `AI_SERVICE_URL` | Yes | `http://ai-service:8000` | URL of the internal Python FastAPI microservice |
| `ALLOW_TEST_OTP_BYPASS`| No | `false` | Must NEVER be set to `true` in production |

### 2.2 Frontend (`Frontend/Website/.env.production`)

| Variable Name | Required | Example | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Yes | `https://api.draftmate.ai` | Base URL of the backend API gateway |

### 2.3 Python AI Service (`draftmate-ai/.env`)

| Variable Name | Required | Example | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Yes | `8000` | FastAPI server port |
| `VECTOR_STORE_PATH`| Yes | `/data/chroma_db` | Persistent volume path for Indian legal corpus |
| `MODEL_NAME` | Yes | `sentence-transformers/all-MiniLM-L6-v2` | Embedding model for semantic search |

---

## 3. Step-by-Step Production Deployment

### 3.1 Step 1: Backend Deployment
1. **Container Build:**
   ```dockerfile
   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM node:20-alpine AS runner
   WORKDIR /app
   ENV NODE_ENV=production
   COPY package*.json ./
   RUN npm ci --only=production
   COPY --from=builder /app/dist ./dist
   EXPOSE 5000
   CMD ["node", "dist/server.js"]
   ```
2. **Launch & Verification:**
   Verify startup health check:
   ```bash
   curl -f https://api.draftmate.ai/health
   # Expected output: {"status":"healthy","service":"draftmate-backend"}
   ```

### 3.2 Step 2: Python AI Service Deployment
1. Build container with Python 3.10+ and install `requirements.txt`.
2. Ensure persistent storage volume is mounted to preserve ChromaDB / FAISS indices.
3. Expose port 8000 only within the internal container network (do not expose to public internet).

### 3.3 Step 3: Frontend Deployment
1. Deploy to Vercel or containerized Next.js standalone server.
2. Inject `NEXT_PUBLIC_API_URL=https://api.draftmate.ai`.
3. Verify that browser network requests successfully communicate with the API gateway.

---

## 4. Operational Maintenance & Rollback Procedures

1. **Database Backups:** Ensure continuous cloud backups with point-in-time recovery (PITR) enabled on MongoDB Atlas.
2. **Graceful Shutdown:** Express server traps `SIGTERM` and `SIGINT` signals, closing open socket connections and terminating database pools cleanly before exit.
3. **Rollback Strategy:**
   - If a backend build fails post-deployment, immediately roll back to the previous stable container tag using the container orchestrator (e.g. `docker service update --rollback` or Kubernetes deployment rollback).
   - Database migrations are additive (no destructive column drops without deprecation cycles) to allow zero-downtime rollbacks.
