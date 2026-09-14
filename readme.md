# AI-Powered Distributed Trace Investigator

A full-stack web application for exploring, analyzing, and investigating distributed traces using deterministic telemetry processing and AI-assisted interpretation.

The application provides trace browsing, search and filtering, hierarchy visualization, span inspection, diagnostics, trace comparison, natural-language search, and grounded AI analysis.

---

## 📌 Overview

**AI-Powered Distributed Trace Investigator** helps developers understand distributed trace execution and identify areas that may require further investigation.

The application separates deterministic trace processing from AI interpretation:

- The **backend** retrieves and processes trace data.
- Deterministic logic calculates trace metrics and identifies bottleneck candidates.
- **Groq AI** interprets the available telemetry and generates explanations and investigation recommendations.
- The frontend presents the processed information through dedicated investigation modules.

---

## ✨ Features

- Trace browsing with pagination
- Trace search, filtering, and sorting
- Trace statistics
- Dynamic parent-child span hierarchy
- Timeline and duration visualization
- Span-level inspection
- Error span analysis
- Deterministic bottleneck candidate detection
- AI-powered trace analysis
- AI-powered natural-language trace search
- Trace comparison
- JWT-based authentication
- Responsive user interface
- AWS deployment
- GitHub Actions CI/CD

---

## 🏗️ Architecture

```text
                         ┌──────────────────┐
                         │       User       │
                         │    Web Browser   │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │    CloudFront    │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │    Amazon S3     │
                         │  React/Vite App  │
                         └────────┬─────────┘
                                  │
                         HTTPS REST API
                                  │
                                  ▼
                         ┌──────────────────┐
                         │      Nginx       │
                         │   Reverse Proxy  │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Node.js/Express  │
                         │     Backend      │
                         └───────┬───┬──────┘
                                 │   │
                     ┌───────────┘   └────────────┐
                     ▼                            ▼
              ┌──────────────┐             ┌──────────────┐
              │   MongoDB    │             │   Groq AI    │
              │ Trace Data   │             │ AI Analysis  │
              └──────────────┘             └──────────────┘
```

### Architecture Principles

- Frontend communicates with the backend through REST APIs.
- Backend is responsible for application and data-processing logic.
- MongoDB is accessed only by the backend.
- Groq AI is accessed only by the backend.
- AI credentials are never exposed to the frontend.
- Deterministic calculations are performed by application logic.
- AI is used for interpretation and recommendations.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React.js | User interface |
| Build Tool | Vite | Frontend development and production build |
| Routing | React Router | Frontend navigation |
| Backend | Node.js | Server runtime |
| API Framework | Express.js | REST API |
| Database | MongoDB | Trace and service data |
| ODM | Mongoose | MongoDB data access |
| AI | Groq API | AI-assisted analysis |
| AI SDK | Groq SDK | Backend AI integration |
| Authentication | JWT | API authentication |
| Web Server | Nginx | Reverse proxy |
| Process Manager | PM2 | Backend process management |
| Frontend Hosting | Amazon S3 | Static hosting |
| CDN | CloudFront | Frontend delivery |
| Backend Hosting | AWS EC2 | Backend hosting |
| CI/CD | GitHub Actions | Automated deployment |
| Version Control | Git / GitHub | Source control |

---

## 📁 Project Structure

```text
ai-distributed-trace-investigator/
│
├── .github/
│   └── workflows/
│       ├── backend-deploy.yml
│       └── frontend-deploy.yml
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── .env.example
│   ├── index.js
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── package-lock.json
│
├── README.md
└── .gitignore
```

---

# 🔌 API Design

All trace-related APIs are protected using JWT authentication.

## Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user and generate JWT |

## Trace APIs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/traces` | List traces with filtering, sorting, and pagination |
| `GET` | `/api/traces/:traceId` | Retrieve detailed trace and span information |
| `GET` | `/api/services` | Retrieve available services |
| `GET` | `/api/traces/stats` | Retrieve aggregate trace statistics |
| `POST` | `/api/traces/analyze` | Perform AI-assisted trace analysis |
| `POST` | `/api/traces/ai-search` | Search traces using natural-language queries |
| `POST` | `/api/traces/compare` | Compare two traces |

## Health Check

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Check backend and database status |

---

# 🖥️ Frontend Modules

The frontend is organized into the following modules.

### Login

Handles user authentication and maintains the authenticated session.

### Trace List

Provides trace browsing with search, filtering, sorting, pagination, statistics, and trace selection.

### Trace Details

Provides detailed investigation through:

- **Timeline** — Hierarchical duration visualization
- **Diagnostics** — Metrics, errors, and bottleneck candidates
- **Spans** — Individual span inspection
- **Raw Data** — Structured trace JSON
- **AI Analysis** — AI-generated trace interpretation

### AI Insights

Provides centralized AI analysis for selected traces.

### AI Search

Allows users to search traces using natural-language queries.

### Compare

Allows users to select two traces and compare their trace characteristics.

---

# ⚙️ Local Setup

## Prerequisites

Install the following:

- Node.js
- npm
- MongoDB
- Git

---

## 1. Clone the Repository

```bash
git clone https://github.com/abishekkrishnamoorthy/ai-distributed-trace-investigator.git

cd ai-distributed-trace-investigator
```

---

## 2. Backend Setup

Navigate to the backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

### Backend Environment Variables

Update `.env` with the required configuration:

```env
PORT=5005

MONGODB_URI=your_mongodb_connection_string

GROQ_API_TOKEN=your_groq_api_token
GROQ_MODEL=openai/gpt-oss-120b

ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin@123

JWT_SECRET=your_strong_jwt_secret
JWT_EXPIRES_IN=1h
```

| Variable | Description |
|---|---|
| `PORT` | Backend server port |
| `MONGODB_URI` | MongoDB connection string |
| `GROQ_API_TOKEN` | Groq API authentication token |
| `GROQ_MODEL` | Groq model used for AI processing |
| `ADMIN_USERNAME` | Application login username |
| `ADMIN_PASSWORD` | Application login password |
| `JWT_SECRET` | Secret used to sign JWT tokens |
| `JWT_EXPIRES_IN` | JWT expiration duration |

**Do not commit `.env` or actual secret values to GitHub.**

### Start Backend

Development:

```bash
npm run dev
```

Normal execution:

```bash
npm start
```

The backend is configured to run on:

```text
http://localhost:5005
```

---

## 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create:

```text
frontend/.env
```

Add:

```env
VITE_API_BASE_URL=http://localhost:5005
```

Start the frontend:

```bash
npm run dev
```

For a production build:

```bash
npm run build
```

---

# 🗄️ Database Setup

The application uses MongoDB for trace and service data.

Configure the MongoDB connection through:

```env
MONGODB_URI=your_mongodb_connection_string
```

Ensure MongoDB is running and the required trace and service dataset is available in the configured database before using the application.

---

# 🤖 AI Integration

AI analysis is performed exclusively through the backend.

```text
User
  ↓
React Frontend
  ↓
POST /api/traces/analyze
  ↓
Node.js / Express
  ↓
Retrieve Trace
  ↓
Deterministic Analysis
  ↓
Prepare AI Context
  ↓
Groq AI
  ↓
Structured JSON Response
  ↓
Backend Validation
  ↓
React Frontend
```

### AI Responsibilities

The AI is used to:

- Summarize traces
- Explain important observations
- Interpret latency and error patterns
- Explain the likely bottleneck candidate
- Suggest reasonable investigation steps

### Deterministic Responsibilities

The backend is responsible for:

- Overall trace duration
- Longest span
- Error span detection
- Parent-child hierarchy
- Bottleneck candidate identification

The AI does not replace these deterministic calculations.

---

# 🧠 AI Grounding

The AI receives relevant telemetry from the selected trace together with deterministic analysis results.

AI findings are separated into:

- **Observed Facts**
- **AI Interpretation**
- **Bottleneck**
- **Recommendations**

Major findings contain span IDs as evidence.

The AI is restricted to the telemetry provided by the application. It should not invent unavailable information such as infrastructure metrics, logs, network conditions, or database performance information.

If the available telemetry is insufficient, the AI is expected to acknowledge the limitation.

---

# 💬 Natural-Language AI Search

The application supports natural-language trace search through:

```text
POST /api/traces/ai-search
```

Example:

```json
{
  "query": "show error traces from payment-service over 1 second",
  "page": 1,
  "limit": 10
}
```

Processing flow:

```text
Natural Language Query
        ↓
Groq AI
        ↓
Structured Search Filters
        ↓
Backend Validation
        ↓
MongoDB Query
        ↓
Filtering / Sorting / Pagination
        ↓
Actual Trace Results
```

The AI interprets the query, while the backend performs the actual database search.

---

# 🔄 Trace Comparison

Trace comparison is available through:

```text
POST /api/traces/compare
```

The API requires exactly two different trace IDs.

Example:

```json
{
  "traceIds": [
    "trace-020",
    "trace-025"
  ]
}
```

The backend retrieves both traces and applies the application's comparison logic before returning the comparison result.

---

# 🔐 Authentication & Security

The application uses JWT-based authentication.

```text
Login
  ↓
POST /api/auth/login
  ↓
JWT Token
  ↓
Protected API Requests
  ↓
JWT Verification
  ↓
API Access
```

Security considerations:

- Protected APIs require authentication.
- JWT tokens have an expiration period.
- Groq credentials remain on the backend.
- Database credentials are stored through environment variables.
- JWT secrets are stored through environment variables.
- AI responses are validated before being returned.
- Sensitive configuration is excluded from source control.

---

# ☁️ Deployment

The application uses separate frontend and backend deployment environments.

## Frontend

```text
React / Vite
      ↓
GitHub Actions
      ↓
Production Build
      ↓
Amazon S3
      ↓
CloudFront
      ↓
User Browser
```

## Backend

```text
GitHub Actions
      ↓
AWS EC2
      ↓
Nginx
      ↓
Node.js / Express
      ↓
PM2
```

The backend communicates with MongoDB and Groq AI.

---

# 🔁 CI/CD

GitHub Actions is used to automate deployments.

## Frontend Pipeline

```text
Checkout Repository
        ↓
Install Dependencies
        ↓
Create Environment Configuration
        ↓
Build React Application
        ↓
Deploy to S3
        ↓
Invalidate CloudFront Cache
```

## Backend Pipeline

```text
Deployment Trigger
        ↓
Connect to EC2
        ↓
Pull Latest Code
        ↓
Install Production Dependencies
        ↓
Restart PM2
        ↓
Health Check
```

---

# 📊 Deployment Status

| Component | Status |
|---|---|
| Frontend | Deployed |
| Backend | Deployed |
| Database | MongoDB |
| AI Integration | Groq API |
| Frontend Hosting | Amazon S3 + CloudFront |
| Backend Hosting | AWS EC2 |
| Reverse Proxy | Nginx |
| Process Manager | PM2 |
| CI/CD | GitHub Actions |

### Live Application

> Add your deployed frontend URL here.

### Backend API

> Add your deployed backend URL here.

---

# ⚠️ Known Limitations & Trade-offs

### Span Timing

The supplied telemetry does not provide reliable span start/end offsets. Therefore, the timeline represents hierarchy and relative duration rather than exact execution overlap.

### Bottleneck Analysis

Bottleneck candidates represent likely latency contributors based on available telemetry. They should not be interpreted as definitive root causes.

### AI Dependency

AI analysis depends on Groq API availability. The backend handles failures, timeouts, empty responses, and malformed AI output.

### Telemetry Availability

The AI can only reason about telemetry available to the application. It cannot determine information that is not present in the supplied dataset.

### Authentication

The application uses lightweight JWT authentication and does not implement enterprise SSO, OAuth, RBAC, or refresh-token rotation.

### Dataset Scope

The application works with the supplied trace dataset and does not require or implement a live OpenTelemetry collector or production tracing infrastructure.

---

# 📄 Documentation

The project includes a separate **Architecture & Technical Design Document** covering:

- System architecture
- Backend architecture
- API processing
- Trace hierarchy and waterfall
- Deterministic trace analysis
- Frontend architecture
- AI architecture
- Authentication and security
- Deployment and CI/CD
- Known limitations and trade-offs

---

# 👤 Author

**Abishek Krishnamoorthy**

**GitHub Repository:**  
https://github.com/abishekkrishnamoorthy/ai-distributed-trace-investigator
