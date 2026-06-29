# HireSense AI — Enterprise-grade Interview Preparation & Recruitment Platform

Welcome to **HireSense AI**, a production-ready, multi-tenant automated recruitment and AI-driven candidate screening platform. 

This repository implements a robust clean architecture across a multi-stage Node/Express backend, a Python FastAPI AI co-pilot, and an interactive React web application.

---

## 🏗️ System Architecture

```mermaid
graph TD
    UserBrowser[Candidate / Recruiter Web App] -->|HTTPS Port 80/3000| Nginx[Nginx Reverse Proxy]
    Nginx -->|React SPA Client| UserBrowser
    
    UserBrowser -->|Rest HTTP Calls Port 5000| Express[Node.js Express Backend]
    Express -->|Prisma Client| DB[(PostgreSQL Database)]
    Express -->|Background Processing| WorkQueue[In-Memory Queue Service]
    Express -->|Object Storage| LocalStorage[StorageService Provider]
    Express -->|POST /review /evaluate| FastAPI[Python FastAPI AI-Service]
    
    FastAPI -->|Google GenAI SDK| Gemini[Gemini 2.5 LLM Engine]
```

---

## 📊 Database Entity Relationship (ER) Diagram

```mermaid
erDiagram
    User ||--o| CandidateProfile : "1:1 profile details"
    User ||--o| RecruiterProfile : "1:1 tenant settings"
    
    RecruiterProfile ||--o{ Job : "manages postings"
    RecruiterProfile ||--o{ CodingTest : "schedules assessments"
    
    CandidateProfile ||--o{ Resume : "uploads versions"
    CandidateProfile ||--o{ Application : "submits candidates"
    CandidateProfile ||--o{ InterviewSession : "practices interviews"
    CandidateProfile ||--o{ CodingSubmission : "solves challenges"
    
    Resume ||--o{ ResumeVersion : "has historical logs"
    ResumeVersion ||--o| ResumeAnalysis : "AI matched score"
    Application ||--o{ InterviewSession : "conducts screeners"
    
    InterviewSession ||--o{ InterviewQuestion : "comprises questions"
    InterviewQuestion ||--o{ InterviewAnswer : "evaluates responses"
    
    CodingTest ||--o{ CodingTestQuestion : "groups questions"
    CodingQuestion ||--o{ CodingTestQuestion : "groups questions"
    CodingQuestion ||--o{ TestCase : "validates with specs"
    CodingSubmission ||--o{ CodingExecution : "runs test cases"
```

---

## 📁 Repository Folder Structure

```text
.github/
  ├── workflows/
  │     └── ci.yml               # Parallel Lint, Compile, Testing, and Docker CI Pipeline
  ├── ISSUE_TEMPLATE/
  │     ├── bug_report.md        # Bug logging configuration
  │     └── feature_request.md   # Enhancement log
  └── PULL_REQUEST_TEMPLATE.md   # PR validation checklists
ai-service/
  ├── app/                       # FastAPI main router, core, and features (analyzer, interview, assessment)
  ├── Dockerfile                 # Production optimized Python base image
  └── requirements.txt           # Python FastAPI and Google GenAI SDK requirements
backend/
  ├── prisma/
  │     └── schema.prisma        # Database relationships definition
  ├── src/                       # Controllers, Repositories, Services, Routes, and Winston Loggers
  ├── Dockerfile                 # Multi-stage Express runtime build
  └── package.json               # Backend Node dependencies
frontend/
  ├── src/                       # React atomic atoms/molecules layout features
  ├── Dockerfile                 # React compiler mapping asset copies to Nginx Stable-Alpine
  ├── vite.config.ts             # Vite server configuration and Vitest environment configurations
  └── package.json               # Frontend Node dependencies
docker-compose.yml               # Standard compose launcher config
docker-compose.dev.yml           # Development live-reload docker configurations
docker-compose.prod.yml          # Production multi-stage docker orchestration configurations
README.md                        # Project layout documentation manual
```

---

## 🛠️ Technology Stack

| Ecosystem | Technology | Purpose |
| --- | --- | --- |
| **Frontend** | React, TypeScript, Vite, TailwindCSS | User interfaces, state managers |
| **Backend** | Node.js, Express, TypeScript, Prisma | Core business controllers, repository mappings |
| **AI Engine** | Python, FastAPI, Google Gemini API | Automated evaluation prompts, audio reviews |
| **Database** | PostgreSQL | Persistent transactional data layer |
| **Caching/Queue** | MemoryQueue (Redis ready) | Asynchronous background upload tasks |
| **Testing** | Vitest, React Testing Library, Supertest | Unit, Integration, and Mock API tests |
| **Deploy** | Docker, Nginx, GitHub Actions | Production containerization & CI/CD automations |

---

## ⚙️ Environment Variables Config

Create a `.env` configuration file in the respective folders using the following models:

### Backend Configuration (`/backend/.env`)
```ini
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/hiresense?schema=public"
AI_SERVICE_URL="http://localhost:8000"
GEMINI_API_KEY="your-google-gemini-key"
JWT_SECRET="secure-auth-jwt-token-secret-key"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="*"
STORAGE_PROVIDER="local"
QUEUE_PROVIDER="memory"
```

### AI Service Configuration (`/ai-service/.env`)
```ini
PORT=8000
GEMINI_API_KEY="your-google-gemini-key"
BACKEND_URL="http://localhost:5000"
```

### Frontend Configuration (`/frontend/.env`)
```ini
VITE_API_URL="http://localhost:5000"
VITE_AI_SERVICE_URL="http://localhost:8000"
```

---

## 🚀 Deployment Guide

### Local Development (Direct Run)
1. Install project dependencies:
   ```bash
   # Backend
   cd backend && npm install
   # Frontend
   cd ../frontend && npm install
   # AI Service
   cd ../ai-service && pip install -r requirements.txt
   ```
2. Build Prisma bindings:
   ```bash
   cd backend && npx prisma db push
   ```
3. Run tests locally:
   * Backend: `node .\node_modules\vitest\vitest.mjs run`
   * Frontend: `node .\node_modules\vitest\vitest.mjs run`

### Production Docker Container Launch
Deploy the multi-stage optimized production docker instances:
```bash
docker compose -f docker-compose.prod.yml up --build -d
```
* **Vite Web App UI**: Exposes port `80` (rendered via Nginx proxy).
* **Express Backend APIs**: Exposes port `5000`.
* **FastAPI AI Service**: Exposes port `8000`.
* **API Interactive Specs**: Served directly at `http://localhost:5000/api/docs`.

---

## 🔒 Security Features Implemented

* **Rate Limiting**: Integrated `express-rate-limit` restricting excessive requests from single IPs.
* **Helmet Security Headers**: Configured Helmet in Express setting secure HTTP headers.
* **CORS Whitelisting**: Restricted Cross-Origin requests to validated URLs.
* **Secure Cookie Authentication**: Transmits JSON Web Tokens via HTTP-only, secure, SameSite cookies.
* **Prisma Schema Isolation**: Binds prisma execution logic strictly in repositories, protecting database queries against SQL injection.

---

## 🛣️ Future Roadmap

* [ ] Integrate Redis & BullMQ to decouple background parsing jobs from memory locks.
* [ ] Support video capture analysis in the AI Mock Interview system.
* [ ] Deploy Judge0 docker sandboxes to compile candidate codes in isolated execution VMs.
* [ ] Build multi-tenant company recruitment statistics dashboard pipelines.

---

## 📄 License & Contributors

Distributed under the MIT License. See `LICENSE` for more information.
* **Support Contact**: support@hiresense.ai
