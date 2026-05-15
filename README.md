# ⚙️ VokeyFitness Backend Services: Clustered AI Fitness & Database Engine

This is the production-ready Node.js, Express, and MongoDB backend powering the **VokeyFitness AI** SaaS ecosystem. It features robust user authentication, a stateful AI coach powered by Gemini 2.5, dynamic analytics aggregators, real-time Server-Sent Events (SSE) notification brokers, clustered token blacklisting, and a background task worker queue for asynchronous email operations.

---

## 🏗️ Backend System Architecture

```
                                 +-------------------------+
                                 |   Vite React Client     |
                                 +-------------------------+
                                              |
                                              | HTTPS REST / SSE
                                              v
                                 +-------------------------+
                                 |  Express API Gateway    |
                                 +-------------------------+
                                              |
                       +----------------------+----------------------+
                       |                                             |
                       v                                             v
        +----------------------------+                 +----------------------------+
        |   Mongoose Models & DB     |                 |  Controller & Services     |
        |  (User, Workout, Meal)     |                 |  (AI Engine, Auth, Admin)  |
        +----------------------------+                 +----------------------------+
                       |                                             |
                       v                                             v
        +----------------------------+                 +----------------------------+
        |     MongoDB Database       |                 |    Redis Cache & Queue     |
        |   (Text indexes seeded)    |                 |   (TTLs & Worker Threads)  |
        +----------------------------+                 +----------------------------+
```

---

## ⚡ Core Modules & Architectural Features

### 1. 🔑 Security-First Authentication Engine
* **Double-Layer Verification**: Traditional password hashing using `bcryptjs` paired with temporary email OTP (One-Time Password) challenges via NodeMailer.
* **Auto-Expiring OTP Tokens**: Clean MongoDB OTP collection fitted with a 5-minute index-based Time-To-Live (TTL) field ensuring cryptographically safe token lifecycle pruning.
* **Clustered JWT Blacklisting**: Standard token-level invalidations on logout are stored asynchronously inside a Redis Cache with expiration matching the remaining token lifespan. Operates on a seamless in-memory fallback if Redis is disabled.

### 2. 🧠 Stateful AI Fitness & Nutrition RAG
* **Adaptive Prompt Construction**: Queries the MongoDB database to extract user biometrics (height, weight, daily goals) and injects the last 5 completed workout sessions (`WorkoutSession`).
* **Progressive Overload Advisor**: Custom Gemini prompting engine that computes weekly load factor shifts (increasing sets/reps/weight) or flags deload adjustments based on historical compliance rates.
* **Text Normalization Seeding**: Bootstrapped with a migration seeder injecting 185 unique gym exercises complete with difficulty target tags, body part indices, and secondary target listings.

### 3. 📊 Date-Range Analytics Filter Gate
* **Segmented Database Aggregation**: Parses `?range=day|month|year|all` parameters dynamically using MongoDB query pipeline brackets.
* **Dynamic Time Series Chunking**: 
  * `day` - Groups logs in 4-hour blocks to display active hourly traffic.
  * `month` - Groups logs in weekly chunks across the current calendar month.
  * `year` - Groups logs into 12 calendar months of the current year.
  * `all` - Displays standard 7-day workout summaries and 6-month signup curves.

### 4. 🐳 Production Docker Orchestration
* **Multi-Container Composition**: Configured via `docker-compose.yml` bridging Node.js API servers, Nginx React targets, Redis cache layers, and persistent MongoDB clusters.
* **Background Email Workers**: Offloads SMTP transport handshakes out-of-band using Redis list primitives (`LPUSH`/`BLPOP`) or local microtask deferrals (`setImmediate`), cutting registration API latency to sub-50ms.

---

## 🛣️ API Endpoint Reference

### Authentication `/api/auth`
* `POST /signup` - Register a new athlete account.
* `POST /login` - Sign in and get a JWT token.
* `POST /verify-otp` - Verify email OTP token.
* `POST /logout` - Invalidate current session (adds token to Redis blacklist).

### Workouts `/api/workouts`
* `GET /` - Retrieve logged workout sessions for the authenticated user.
* `POST /` - Log a new completed session.
* `DELETE /:id` - Remove a workout session from history.

### Exercises `/api/exercises`
* `GET /` - Search seeded database exercises using text-indices.
* `POST /` - Add a custom exercise (Admin only).
* `PUT /:id` - Update exercise details (Admin only).
* `DELETE /:id` - Delete an exercise from the database (Admin only).

### AI Coach `/api/ai`
* `POST /coach` - Interact with the stateful conversational coach.
* `POST /suggest-plan` - Request a customized, progressive-overload workout split.

### Administration `/api/admin`
* `GET /stats?range=...` - Retrieve platform metrics and chart timelines.
* `GET /active-sessions` - Monitor live athlete sessions on the gym floor.
* `POST /notifications` - Push custom advice/alerts to specific athletes.

---

## 💻 Developer Setup & Running Instructions

Refer to the primary project workspace setup manuals. Ensure you copy `.env.example` into a valid `.env` file before executing:
```bash
# Start the local development server with nodemon
npm run dev

# Run the exercise seeder to boot database mockups
node scripts/migrateExercises.js
```
