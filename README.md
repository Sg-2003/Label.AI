# LabelLoop AI — AI Data Annotation & Crowdsourcing Platform

LabelLoop AI is a full-stack, enterprise-grade data labeling and annotation platform designed for AI and Machine Learning teams. It features concurrent task allocation with atomic locks, majority-voting consensus algorithms, gold standard quality control, and human reviewer escalation queues.

---

## 🏗️ Architecture & Features

### Core Backend Components
- **Task Assignment & Concurrency Lock**: 15-minute lease mechanism preventing duplicate work across annotators while automatically recovering abandoned tasks.
- **Consensus Algorithm**: Real-time evaluation of overlap agreements with majority-voting thresholding. Tasks with disagreements are escalated automatically to the Review Queue.
- **Gold Standard Quality Control**: Secret ground-truth benchmark tasks interleaved into the queue to track annotator accuracy in real-time.
- **Role-Based Access Control (RBAC)**: Secure access tailored for `admin`, `annotator`, and `reviewer` roles.
- **CSV & Batch Importer**: Streamed task creation with metadata mapping.
- **Dataset Exporters**: One-click exports in standard **JSON** and **CSV** formats.

---

## 🚀 Quick Start

### 1. Requirements
- Node.js (v18+)
- MongoDB (Running locally or URI provided in `.env`)

### 2. Setup & Installation
```bash
cd server
npm install
```

### 3. Environment Configuration
The server is preconfigured with [server/.env](file:///d:/GitHub/Label.AI/server/.env). You can customize variables as needed:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/labelloop_ai
JWT_SECRET=supersecret_labelloop_jwt_key_2026_dev
JWT_EXPIRES_IN=7d
TASK_LOCK_TIMEOUT_MINUTES=15
CLIENT_URL=http://localhost:5173
```

### 4. Seed Demo Data
Pre-populates sample admin, annotators, reviewer, a demo sentiment classification project, and sample tasks:
```bash
npm run seed
```

#### Demo Credentials:
| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@labelloop.ai` | `password123` |
| **Annotator** | `alice@labelloop.ai` | `password123` |
| **Annotator** | `bob@labelloop.ai` | `password123` |
| **Annotator** | `charlie@labelloop.ai` | `password123` |
| **Reviewer** | `reviewer@labelloop.ai` | `password123` |

### 5. Run the Application

#### Terminal 1 — Start the Backend (Port 5000)
```bash
cd server
npm run dev
```

#### Terminal 2 — Start the Frontend (Port 5173)
```bash
cd client
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 6. Run Automated API Tests
Executes end-to-end tests across all authentication, task locking, consensus, review, and export endpoints:
```bash
cd server
npm run test:api
```

---

## 📡 REST API Reference

All API routes are prefixed with `/api/v1`.

### 🔐 Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new user | Public |
| `POST` | `/auth/login` | Login and obtain JWT token | Public |
| `GET` | `/auth/me` | Get current user profile and stats | Authenticated |

### 📁 Projects (`/api/v1/projects`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/projects` | Create a new project | Admin |
| `GET` | `/projects` | List projects | Authenticated |
| `GET` | `/projects/:id` | Get project details | Authenticated |
| `PUT` | `/projects/:id` | Update project settings/labels | Admin |
| `DELETE` | `/projects/:id` | Delete project and cascade tasks | Admin |
| `GET` | `/projects/:id/stats` | Get project progress and label counts | Authenticated |

### 📝 Tasks & Annotation Queue (`/api/v1`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/projects/:projectId/tasks` | Batch create tasks (JSON) | Admin |
| `POST` | `/projects/:projectId/tasks/upload` | Import tasks from CSV | Admin |
| `GET` | `/projects/:projectId/tasks/next` | Fetch next task with 15-min atomic lock | Annotator / Admin |
| `POST` | `/tasks/:taskId/skip` | Skip task and return to pool | Annotator / Admin |
| `POST` | `/tasks/:taskId/annotate` | Submit annotation & trigger consensus | Annotator / Admin |
| `GET` | `/tasks/:taskId/annotations` | View all annotations on a task | Authenticated |

### ⚖️ Review Queue & Disagreements (`/api/v1`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/projects/:projectId/tasks/review-queue` | Get tasks needing expert review | Reviewer / Admin |
| `POST` | `/tasks/:taskId/review` | Approve, reject, or override task label | Reviewer / Admin |

### 📤 Data Export (`/api/v1`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/projects/:projectId/export?format=json` | Export dataset in JSON format | Reviewer / Admin |
| `GET` | `/projects/:projectId/export?format=csv` | Export dataset in CSV format | Reviewer / Admin |
