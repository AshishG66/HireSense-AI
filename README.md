<div align="center">

<img src="./docs/screenshots/banner.svg" alt="HireSense AI Banner" width="100%" />

# 🚀 HireSense AI

### **Enterprise-grade Automated Candidate Screening, Resume Optimization, and AI-Driven Interviewing Co-pilot**

[![GitHub Stars](https://img.shields.io/github/stars/AshishG66/HireSense-AI?style=for-the-badge&color=00A76F&logo=github)](https://github.com/AshishG66/HireSense-AI/stargazers)
[![License](https://img.shields.io/github/license/AshishG66/HireSense-AI?style=for-the-badge&color=00B8D9)](https://github.com/AshishG66/HireSense-AI/blob/main/LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/AshishG66/HireSense-AI?style=for-the-badge&color=8E33FF)](https://github.com/AshishG66/HireSense-AI/commits/main)

---

**HireSense AI** is a production-ready, multi-tenant automated recruitment, resume analysis, and interactive AI mock interview platform. Built with a clean microservice architecture, it links a high-performance **React Single Page App**, an enterprise **Node.js Express Gateway**, and an asynchronous **Python FastAPI AI Copilot** powered by **Google Gemini LLM**.

[🚀 Live Frontend](https://hire-sense-ai-jrm9-git-main-ashishgdevadiga15-8589s-projects.vercel.app) • [⚙️ Backend API](https://hiresense-backend-eri4.onrender.com) • [🤖 AI Service](https://hiresense-ai-service.onrender.com) • [📚 API Docs](https://hiresense-backend-eri4.onrender.com/api/docs) • [🐳 Docker Hub](https://hub.docker.com/r/ashishg66/hiresense-ai)

</div>

---

## 🛠️ Technology Stack

| Component          | Stack & Technologies                                          | Badge                                                                                                                                                                                                                          |
| :----------------- | :------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**       | React 18, TypeScript, Vite, Tailwind CSS, Monaco Editor       | ![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)               |
| **Backend**        | Node.js, Express, TypeScript, Winston Logger, JWT, Zod        | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) ![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)                |
| **AI Co-pilot**    | Python 3.11+, FastAPI, Uvicorn, Google Gemini API (GenAI SDK) | ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white) ![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)                     |
| **Database**       | PostgreSQL, Prisma ORM (Client, Migrations, Studio)           | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)            |
| **DevOps & CI/CD** | Docker, Docker Compose, GitHub Actions, Nginx Stable          | ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white) ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white) |

---

## 🏗️ System Architecture & Workflows

### 1. High-Level Microservice Overview

```mermaid
graph TD
    Client[Candidate & Recruiter UI - React] -->|HTTPS Port 80/3000| Nginx[Nginx Reverse Proxy]
    Nginx -->|Static Assets| Client
    Nginx -->|Express Core APIs Port 5000| Express[Node.js Express Backend]

    Express -->|Prisma Client| DB[(PostgreSQL Database - Neon)]
    Express -->|In-Memory Event Queue| InMemQueue[Upload & Parse Queue]
    Express -->|Local/S3 Storage| Storage[Storage Service Provider]
    Express -->|REST POST /review /evaluate| FastAPI[Python FastAPI AI-Service]

    FastAPI -->|Google GenAI SDK| Gemini[Gemini Pro LLM Engine]
```

### 2. Live Request Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Client (Web App)
    participant API as Express Backend
    participant DB as PostgreSQL
    participant AI as FastAPI AI Service
    participant LLM as Google Gemini

    User->>API: POST /api/v1/resumes/versions/:id/analyze
    activate API
    API->>DB: Query Resume text & criteria
    DB-->>API: Return file data
    API->>AI: REST POST /api/v1/ai/analyze-resume (data)
    activate AI
    AI->>LLM: Generate Analysis Prompt (Gemini API)
    activate LLM
    LLM-->>AI: Return Structured JSON response
    deactivate LLM
    AI-->>API: Return parsed evaluation summary
    deactivate AI
    API->>DB: Persist ResumeAnalysis record
    API-->>User: Return success (trigger SSE Notification client)
    deactivate API
```

### 3. JWT Authentication & Refresh Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client as User Browser
    participant API as Express Auth
    participant DB as PostgreSQL

    Client->>API: POST /auth/login (email, password)
    activate API
    API->>DB: Find user by email
    DB-->>API: Return User details + passwordHash
    API->>API: Verify Password (bcrypt)
    API->>API: Generate Access Token (15m) & Refresh Token (7d)
    API->>DB: Save RefreshToken entry
    API-->>Client: HttpOnly Cookie (refresh) + Bearer Token (access)
    deactivate API

    Note over Client, API: Access Token Expired (15m later)
    Client->>API: GET /auth/refresh-token (send HttpOnly cookie)
    activate API
    API->>DB: Validate refresh token exists
    DB-->>API: Token is valid
    API->>API: Issue new Access Token (15m)
    API-->>Client: Return new access token JSON
    deactivate API
```

### 4. Interactive Interview & Scoring Flow

```mermaid
graph LR
    Start([1. Start Session]) --> Generate[2. AI Generates Questions]
    Generate --> Display[3. Candidate reads Question]
    Display --> Record[4. Candidate records Voice/Text response]
    Record --> Submit[5. Submit Answer]
    Submit --> Evaluate[6. FastAPI runs speech evaluation]
    Evaluate --> Report[7. Output detailed competency metrics]
    Report --> Status([8. Update Recruiter Pipeline])
```

---

## 🎨 Interactive Live Demo & Buttons

Deployments are active and operational across modern hosting providers. Click the buttons below to interact with the system live:

<div align="center">

| Service                 | Live Endpoint Badge                                                                                                                                                                                 | Status      |
| :---------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------- |
| **Frontend Portal**     | [![Frontend](https://img.shields.io/badge/Frontend-Vercel-00A76F?style=for-the-badge&logo=vercel&logoColor=white)](https://hire-sense-ai-jrm9-git-main-ashishgdevadiga15-8589s-projects.vercel.app) | `ACTIVE`    |
| **Backend API Gateway** | [![Backend](https://img.shields.io/badge/Backend-Render-00B8D9?style=for-the-badge&logo=render&logoColor=white)](https://hiresense-backend-eri4.onrender.com)                                       | `ACTIVE`    |
| **AI Evaluation Core**  | [![AI Service](https://img.shields.io/badge/AI_Service-FastAPI-8E33FF?style=for-the-badge&logo=fastapi&logoColor=white)](https://hiresense-ai-service.onrender.com)                                 | `ACTIVE`    |
| **API Documentation**   | [![Swagger Docs](https://img.shields.io/badge/API_Docs-Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://hiresense-backend-eri4.onrender.com/api/docs)                      | `ACTIVE`    |
| **Container Image**     | [![Docker](https://img.shields.io/badge/Docker_Hub-Registry-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://hub.docker.com/r/ashishg66/hiresense-ai)                               | `PUBLISHED` |

</div>

---

## 📺 Feature-rich Video Walkthrough & GIFs

Experience the core user loops in motion. These animations are captured directly from live browser sessions:

<div align="center">

### Candidate Workflows

|                Resume Upload & Parsing                 |                       AI Resume Builder                        |
| :----------------------------------------------------: | :------------------------------------------------------------: |
| ![Resume Upload](./docs/screenshots/resume_upload.gif) | ![AI Resume Builder](./docs/screenshots/ai_resume_builder.gif) |
|           _Seamless drop & text extraction_            |                _Generating resumes dynamically_                |

|                   AI Mock Voice Interview                    |                    Online Coding Assessment                    |
| :----------------------------------------------------------: | :------------------------------------------------------------: |
| ![Voice Interview](./docs/screenshots/ai_mock_interview.gif) | ![Coding Assessment](./docs/screenshots/coding_assessment.gif) |
|         _Speaks and critiques pronunciation & logic_         |            _Compiling solutions against test cases_            |

### Recruiter & Admin Controls

|                          Recruiter Job Postings                          |                  Admin Platform Analytics                  |
| :----------------------------------------------------------------------: | :--------------------------------------------------------: |
| ![Recruiter Job Postings](./docs/screenshots/recruiter_creating_job.gif) | ![Admin Dashboard](./docs/screenshots/admin_dashboard.gif) |
|               _Publishing dynamic assessment requirements_               |             _System monitoring, logs & audit_              |

</div>

---

## 📸 Interface Dashboard Showcase

Browse screenshots of the actual views implemented in our system across candidate, recruiter, and administrator roles:

### 1. Onboarding & Registration

<div align="center">
<table>
  <tr>
    <td width="33%"><p align="center"><b>Landing Portal</b></p><img src="./docs/screenshots/landing_page.png" alt="Landing Page"/></td>
    <td width="33%"><p align="center"><b>Login Interface</b></p><img src="./docs/screenshots/login_page.png" alt="Login Page"/></td>
    <td width="33%"><p align="center"><b>Register Portal</b></p><img src="./docs/screenshots/register_page.png" alt="Register Page"/></td>
  </tr>
</table>
</div>

### 2. Candidate Dashboard & Co-pilot

<div align="center">
<table>
  <tr>
    <td width="50%"><p align="center"><b>Candidate Main Dashboard</b></p><img src="./docs/screenshots/candidate_dashboard.png" alt="Candidate Dashboard"/></td>
    <td width="50%"><p align="center"><b>Resume Parser Upload</b></p><img src="./docs/screenshots/resume_parser.png" alt="Resume Parser"/></td>
  </tr>
  <tr>
    <td width="50%"><p align="center"><b>AI Resume Analysis Report</b></p><img src="./docs/screenshots/resume_analysis.png" alt="Resume Analysis"/></td>
    <td width="50%"><p align="center"><b>ATS Matching Score Matrix</b></p><img src="./docs/screenshots/ats_score.png" alt="ATS Score"/></td>
  </tr>
  <tr>
    <td width="50%"><p align="center"><b>AI Resume Builder &amp; Exporter</b></p><img src="./docs/screenshots/ai_resume_builder.png" alt="Resume Builder"/></td>
    <td width="50%"><p align="center"><b>AI Resume Optimizer</b></p><img src="./docs/screenshots/ai_resume_optimizer.png" alt="Resume Optimizer"/></td>
  </tr>
  <tr>
    <td width="50%"><p align="center"><b>AI Speech Mock Interview</b></p><img src="./docs/screenshots/mock_interview.png" alt="Mock Interview"/></td>
    <td width="50%"><p align="center"><b>AI Voice Screening Recording</b></p><img src="./docs/screenshots/ai_voice_interview.png" alt="Voice Interview"/></td>
  </tr>
  <tr>
    <td width="50%"><p align="center"><b>Candidate Active Coding Assessments</b></p><img src="./docs/screenshots/coding_assessment.png" alt="Coding Assessment"/></td>
    <td width="50%"><p align="center"><b>Monaco Online Code Editor</b></p><img src="./docs/screenshots/online_code_editor.png" alt="Online Code Editor"/></td>
  </tr>
  <tr>
    <td width="50%"><p align="center"><b>AI Interview Score Report</b></p><img src="./docs/screenshots/interview_report.png" alt="Interview Report"/></td>
    <td width="50%"><p align="center"><b>Candidate Job Board</b></p><img src="./docs/screenshots/job_board.png" alt="Job Board"/></td>
  </tr>
  <tr>
    <td width="50%"><p align="center"><b>Open Roles Feeds</b></p><img src="./docs/screenshots/open_roles.png" alt="Open Roles"/></td>
    <td width="50%"><p align="center"><b>Candidate Applications Log</b></p><img src="./docs/screenshots/candidate_applications.png" alt="Candidate Applications"/></td>
  </tr>
  <tr>
    <td width="50%"><p align="center"><b>Profile Settings</b></p><img src="./docs/screenshots/profile_page.png" alt="Profile Page"/></td>
    <td width="50%"><p align="center"><b>Account Preferences</b></p><img src="./docs/screenshots/settings_page.png" alt="Settings Page"/></td>
  </tr>
</table>
</div>

### 3. Recruiter Dashboard & Controls

<div align="center">
<table>
  <tr>
    <td width="50%"><p align="center"><b>Recruiter Admin Dashboard</b></p><img src="./docs/screenshots/recruiter_dashboard.png" alt="Recruiter Dashboard"/></td>
    <td width="50%"><p align="center"><b>Recruiter Job Management</b></p><img src="./docs/screenshots/recruiter_job_management.png" alt="Recruiter Job Management"/></td>
  </tr>
  <tr>
    <td width="50%"><p align="center"><b>Applicant Applications List</b></p><img src="./docs/screenshots/recruiter_candidates.png" alt="Candidates list"/></td>
    <td width="50%"><p align="center"><b>Recruiter Company Profile</b></p><img src="./docs/screenshots/recruiter_company_profile.png" alt="Recruiter Company Profile"/></td>
  </tr>
  <tr>
    <td colspan="2"><p align="center"><b>Recruiter Analytics Dashboard</b></p><img src="./docs/screenshots/analytics_dashboard.png" alt="Recruiter Analytics"/></td>
  </tr>
</table>
</div>

### 4. Admin Portal & Health Monitoring

<div align="center">
<table>
  <tr>
    <td width="50%"><p align="center"><b>Superadmin Dashboard</b></p><img src="./docs/screenshots/admin_dashboard.png" alt="Admin Dashboard"/></td>
    <td width="50%"><p align="center"><b>Platform Health &amp; Server Metrics</b></p><img src="./docs/screenshots/monitoring_dashboard.png" alt="Monitoring Dashboard"/></td>
  </tr>
  <tr>
    <td width="50%"><p align="center"><b>Admin User Management</b></p><img src="./docs/screenshots/admin_user_management.png" alt="User Management"/></td>
    <td width="50%"><p align="center"><b>Admin Platform Analytics</b></p><img src="./docs/screenshots/admin_platform_analytics.png" alt="Platform Analytics"/></td>
  </tr>
  <tr>
    <td width="50%"><p align="center"><b>Admin AI Usage Analytics</b></p><img src="./docs/screenshots/admin_ai_usage.png" alt="AI Usage"/></td>
    <td width="50%"><p align="center"><b>Admin Audit Logs Registry</b></p><img src="./docs/screenshots/admin_audit_logs.png" alt="Audit Logs"/></td>
  </tr>
</table>
</div>

---

## 🌟 Comprehensive Features List

### 👨‍💻 Candidate Features

- **Resume Parser & Extractor**: High-accuracy local text parsing.
- **AI Resume Builder**: Outfit/Inter font layout builder with PDF exportation.
- **ATS Score Assessor**: Detailed matching score against specific job descriptions.
- **AI Resume Optimizer**: Flags structural improvements and missing keywords.
- **Mock Audio Interview**: Interactive voice-based Q&A with live transcription.
- **Online Code Editor**: Syntax-highlighted workspace utilizing the Monaco editor.
- **Competency Reports**: Provides scores for Problem Solving, Communication, Confidence, and Accuracy.

### 💼 Recruiter Features

- **Tenant Job Postings**: Comprehensive jobs registry with requirements tracking.
- **Applicant Review Center**: Centralized candidate scores, resumes, and code solutions.
- **Assessment Designer**: Custom coding test assembler with language limits.
- **Interview Reports Hub**: Access transcripts and voice scoring reviews.
- **Analytics Engine**: Real-time tracking of funnel pass rates and time-to-hire.

### 🔑 Security & System Integrity

- **Express Rate Limiting**: Protection against DDoS and API abuse.
- **Helmet Headers**: Secure HTTP response headers.
- **HttpOnly JWT Auth**: Cookie transmission to prevent XSS.
- **CORS Protection**: Access verification for client endpoints.
- **Audit Logging**: Traceable record of all admin, candidate, and recruiter actions.

---

## 📁 Repository Structure

```text
HireSense-AI/
├── .github/
│   └── workflows/
│       └── ci.yml               # Automatic parallel build, lint, and docker CI pipeline
├── docs/
│   ├── scripts/
│   │   └── generate_assets.py   # Playwright python automated media capture script
│   └── screenshots/             # Static screenshots and workflow GIFs
├── ai-service/
│   ├── app/
│   │   ├── main.py              # FastAPI router and core initialization
│   │   ├── config.py            # AI environment keys configuration
│   │   ├── core/                # LLM connectors and prompt templates
│   │   └── features/            # Audio transcription, resume evaluation features
│   ├── Dockerfile               # Production optimized multi-stage Python builder
│   └── requirements.txt         # FastAPI, Google Generative AI, PyAudio dependencies
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # Database model definitions
│   ├── src/
│   │   ├── controllers/         # REST API route handlers
│   │   ├── middlewares/         # JWT parsing, Rate-limiting, Error-handlers
│   │   ├── routes/              # Express endpoint routers
│   │   ├── services/            # Database transactions and business logic
│   │   └── server.ts            # Core entry point
│   ├── Dockerfile               # Node builder copy mappings
│   └── package.json             # Core dependency packages
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable Atom/Molecule UI components
│   │   ├── features/            # Feature pages (candidate, recruiter, admin)
│   │   ├── routes/              # Router mapping definitions
│   │   ├── stores/              # Zustand global state managers
│   │   └── main.tsx             # Application wrapper
│   ├── vite.config.ts           # Client bundler configuration
│   └── package.json             # React packages
├── docker-compose.yml           # Multi-container local execution setup
└── render.yaml                  # Render Infrastructure-as-Code definitions
```

---

## ⚙️ Environment Configurations

Create a `.env` file in the following folders:

<details>
<summary>🔑 1. Backend Environment (<code>/backend/.env</code>)</summary>

```ini
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/hiresense?schema=public"
AI_SERVICE_URL="http://localhost:8000"
GEMINI_API_KEY="your-google-gemini-key"
JWT_SECRET="secure-32-character-secret-key-phrase"
JWT_REFRESH_SECRET="secure-32-character-refresh-secret-key-phrase"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="*"
STORAGE_PROVIDER="local"
QUEUE_PROVIDER="memory"
```

</details>

<details>
<summary>🤖 2. AI Service Environment (<code>/ai-service/.env</code>)</summary>

```ini
PORT=8000
GEMINI_API_KEY="your-google-gemini-key"
BACKEND_URL="http://localhost:5000"
```

</details>

<details>
<summary>💻 3. Frontend Environment (<code>/frontend/.env</code>)</summary>

```ini
VITE_API_URL="http://localhost:5000/api/v1"
VITE_AI_SERVICE_URL="http://localhost:8000/api/v1"
```

</details>

---

## 🚀 Setup & Local Installation

### Prerequisites

- **Node.js** v20+
- **Python** v3.11+
- **PostgreSQL** v14+ (or Neon.tech serverless db)
- **Docker & Docker Compose** (Optional)

### Local Dev Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/AshishG66/HireSense-AI.git
   cd HireSense-AI
   ```

2. **Initialize Database and Backend**:

   ```bash
   cd backend
   npm install
   npx prisma db push
   npx prisma generate
   npm run dev
   ```

3. **Start the AI Co-pilot Service**:

   ```bash
   cd ../ai-service
   pip install -r requirements.txt
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

4. **Launch the Frontend Client**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the client.

### Production Docker Launch

You can compile and start all services locally inside isolated environments:

```bash
docker compose -f docker-compose.yml up --build -d
```

---

## 📚 API Reference Table

The Express backend serves standard Swagger documentation at `/api/docs`. Below is a reference of the core endpoint routes:

| Service       | Method | Route                                                        | Description                       | Auth Scope  |
| :------------ | :----- | :----------------------------------------------------------- | :-------------------------------- | :---------- |
| **Auth**      | `POST` | `/api/v1/auth/register`                                      | Register a new user               | Public      |
| **Auth**      | `POST` | `/api/v1/auth/login`                                         | Log in and receive JWT            | Public      |
| **Auth**      | `POST` | `/api/v1/auth/refresh-token`                                 | Renew expired Access Token        | Public      |
| **Jobs**      | `GET`  | `/api/v1/jobs`                                               | Get lists of active jobs          | Public      |
| **Jobs**      | `POST` | `/api/v1/jobs`                                               | Create a new job description      | `RECRUITER` |
| **Resumes**   | `POST` | `/api/v1/resumes`                                            | Upload a new candidate resume PDF | `CANDIDATE` |
| **Resumes**   | `POST` | `/api/v1/resumes/versions/:id/analyze`                       | Run AI ATS Analysis job           | `CANDIDATE` |
| **Interview** | `POST` | `/api/v1/interviews`                                         | Create a mock interview session   | `CANDIDATE` |
| **Interview** | `POST` | `/api/v1/interviews/:sessionId/questions/:questionId/answer` | Submit transcripted answer        | `CANDIDATE` |
| **Assess**    | `POST` | `/api/v1/assessments/tests`                                  | Publish coding assessment test    | `RECRUITER` |
| **Assess**    | `POST` | `/api/v1/assessments/candidate/questions/:id/run`            | Compile code sample               | `CANDIDATE` |
| **Metrics**   | `GET`  | `/api/v1/monitoring/metrics`                                 | View server and database metrics  | `ADMIN`     |

---

## 📄 Database Entity Layout

Prisma ORM handles migrations and clients. Major structural dependencies are mapped below:

- **User**: 1-to-1 link to either `CandidateProfile` or `RecruiterProfile` based on signup Role scope lookup.
- **Company**: Multi-tenant database partitioning. A Company has many recruiters and posts multiple `Job` entries.
- **Application**: Connects a `CandidateProfile` with a `Job` and binds a specific parsed `ResumeVersion`.
- **InterviewSession**: Stores transcripts, recording references, and evaluations for AI Interviews.
- **CodingSubmission**: Tracks Monaco editor entries, compile errors, run times, and correctness outputs.

---

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🔒 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 📬 Contact & Support

- **GitHub**: [@AshishG66](https://github.com/AshishG66)
- **LinkedIn**: [Ashish G. Devadiga](https://www.linkedin.com/in/ashish-g-devadiga)
- **Email**: support@hiresense.ai
- **Portfolio**: [ashishgdevadiga.com](https://ashishgdevadiga.com)

<div align="center">
  <p>Built with ❤️ by the HireSense AI Team</p>
</div>
