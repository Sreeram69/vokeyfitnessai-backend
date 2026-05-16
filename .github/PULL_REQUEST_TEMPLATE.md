### 📝 Description
Provide a clear summary of the changes introduced by this Pull Request.
- What issue or route endpoint is being addressed?
- Which files, middleware, or Mongoose models were modified?

### 🛠️ Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New endpoint/feature (non-breaking change which adds API functionality)
- [ ] Refactor (clean code structure, no logic changes)
- [ ] Performance tuning (e.g. database indices, BullMQ queues, Redis caching)
- [ ] Documentation update (e.g. README.md, API specs)

### ⚡ Technical Details & Design Decisions
Briefly describe the engineering decisions behind your changes.
- Why was this controller or model design chosen?
- Are there any database migration implications (e.g. seeding, indexing)?

### 🧪 Verification & Testing
How have you verified these changes?
- [ ] Backend syntax check passed cleanly (`node --check`).
- [ ] Standard route integration checks pass (e.g. verify JWT extraction inside headers).
- [ ] Database aggregate changes behave correctly across Day/Month/Year filters.
- [ ] Redis caching fallbacks function properly when Redis is disabled.

### ⚙️ Environment Configuration Changes
- [ ] This change requires adding new `.env` environment variables (specify keys: e.g. `REDIS_URL`, `GEMINI_API_KEY`).
