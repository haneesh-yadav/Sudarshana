# Sudarshana

A full-stack email security platform that uses cryptographic hash chains, NLP-based threat detection, and email authentication analysis (SPF/DKIM/DMARC) to detect tampering, phishing, and social engineering attacks in email threads.

## Features

- **Cryptographic Hash Chains** — SHA-256 chain linking each message, making conversations tamper-evident
- **NLP Social Engineering Detection** — Heuristic scoring for urgency pressure, financial anomalies, and authority exploitation
- **Email Authentication Guard** — SPF/DKIM/DMARC header validation with return-path mismatch detection
- **Link Sandbox** — Phishing URL reputation analysis with DNS/IP/SSL inspection
- **Attachment Sandbox** — APK malicious permission and C&C callout detection
- **Thread Hijack Simulator** — Red-team scenarios demonstrating real-time chain break detection
- **Full Audit Trail** — Complete analyst action logging with timestamped records
- **Dashboard & Reports** — Trust gauges, trend charts, donut charts, and PDF/CSV/XLSX export

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, React Router 7 |
| Backend | Java 17, Spring Boot 3.4.1, Spring Security |
| Database | H2 (dev), PostgreSQL (prod) |
| Build | Maven (backend), npm (frontend) |
| Auth | JWT + Google OAuth2 |
| Email | Spring Mail (SMTP/IMAP) |

## Getting Started

### Prerequisites

- Java 17+
- Node.js 20+
- Maven 3.8+

### Backend

```bash
cd server
mvn spring-boot:run
```

The backend starts on `http://localhost:8080`.

### Frontend

```bash
npm install
npm run dev
```

The frontend starts on `http://localhost:5000` and proxies API calls to the backend.

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
VITE_OAUTH_REDIRECT_URI=http://localhost:5000/oauth/callback
SEED_DEMO_DATA=true
```

## Project Structure

```
threadguard-sudarshana/
  src/                    # React frontend
    auth/                 # Authentication context & guards
    components/           # UI components (Sidebar, Topbar, Settings, Toast)
    pages/                # Dashboard pages (Home, Threads, Reports, AuditLogs, SecurityPosture)
    utils/                # Shared utilities
  server/                 # Spring Boot backend
    src/main/java/com/sudarshana/server/
      config/             # Security, CORS, JWT filter
      controller/         # REST API endpoints
      model/              # JPA entities
      repository/         # Spring Data repositories
      service/            # Business logic (crypto, NLP, email sync)
    src/main/resources/
      application.yml     # Configuration profiles
  .github/workflows/      # CI/CD (GitHub Actions)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/google` | Google OAuth2 login |
| POST | `/api/auth/change-password` | Change password |
| GET | `/api/threads` | List all thread reports |
| GET | `/api/threads/{id}` | Get thread detail |
| POST | `/api/threads/{id}/messages` | Add message to thread |
| POST | `/api/threads/{id}/hijack` | Simulate hijack attack |
| GET | `/api/audit-logs` | List audit logs |
| GET | `/api/settings` | Get app settings |

## Docker

```bash
docker-compose up
```

This starts the full stack: frontend (port 5000), backend (port 8080), and PostgreSQL (port 5432).

## License

MIT
