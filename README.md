# 🎯 LabelLoop AI & CVAT Studio

> **Real-Time Data Annotation, CVAT Computer Vision Studio & Workforce Telemetry Platform**

LabelLoop AI is a full-stack, enterprise-grade data labeling and workforce intelligence platform. It bridges traditional text classification with CVAT/Roboflow-style Computer Vision annotation, automated Gemini 2.5 Flash pre-labeling, Fleiss' Kappa quality assurance, and real-time operator tracking.

---

## ⚡ Key Highlights & Capabilities

### 1. 🖼️ CVAT & Roboflow-Grade Computer Vision Studio
- **Dynamic Bounding Box & Polygon Labeling**: Precise canvas drawing on high-resolution image datasets (Autonomous Driving, Drone Aerial, Medical X-Ray, Retail).
- **Pro Canvas Controls**: Interactive Zoom (up to 400%), Pan (`Space + Drag`), Coordinate Inspector (`[x, y, w, h]`), and custom class color mapping.
- **AI Auto-Assist (Smart Bounding Boxes)**: Click to trigger Gemini Vision detection to automatically predict labels and bounding rectangles with confidence scores.
- **Export Standards**: One-click export to **COCO JSON**, **Pascal VOC XML**, **YOLO TXT**, and **LabelMe JSON**.

### 2. 📊 Real-Time Workforce Telemetry & Activity Tracker
- **Worker Presence**: Live connection heartbeat, active task state, idle vs. active detection.
- **Telemetry Metrics**: Actions Per Minute (APM), Average Time Per Annotation, Focus/Fatigue index, and Real-time WPM.
- **Live Activity Broadcast**: Real-time event feed via WebSockets displaying task submissions, AI pre-labels, reviews, and quality alarms.
- **Quality Auditing**: Live calculation of inter-annotator agreement (Cohen's Kappa & Fleiss' Multi-Rater Kappa).

### 3. 🤖 AI Pre-Labeling Engine (Gemini 2.5 Flash)
- **Zero-Shot & Few-Shot Label Suggestions**: Accelerates annotation throughput by over 60%.
- **Confidence Scoring & Flagging**: Highlights low-confidence tasks for mandatory senior reviewer triage.
- **Custom System Instructions**: Tailor domain guidelines directly within the Project Settings.

### 4. 👥 Enterprise Role-Based Access Control (RBAC)
- **Admin**: Project lifecycle management, CSV/Image batch ingestion, gold standard question setup, workforce telemetry, dataset export.
- **Annotator**: Focused labeling cockpit with keyboard shortcuts (`1-9` select label, `Enter` submit, `Cmd+Z` undo, `S` skip).
- **Reviewer**: Dispute resolution center with side-by-side consensus inspection, majority voting, and blind agreement validation.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v18+ or v20+
- **npm** or **bun**

### Installation

1. **Clone the repository**:
   ```bash
   git clone <YOUR_GITHUB_REPO_URL>
   cd labelloop-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key (optional for AI pre-labeling features):
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   PORT=3000
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

## 🏗️ Architecture & Tech Stack

```
├── client/ (Vite + React 19 + TypeScript + Tailwind CSS)
│   ├── components/
│   │   ├── admin/         # Projects, Metrics, Task Manager, User Management
│   │   ├── annotator/     # Labeling Studio, History, Shortcuts
│   │   ├── cvat/          # CVAT Canvas, Bounding Box Tools, Smart Detect
│   │   ├── reviewer/      # Dispute Queue, Consensus Resolution
│   │   └── tracker/       # Workforce Telemetry, APM, Focus Index
│   └── services/          # Real-time WebSocket client, REST API client
└── server/ (Node.js + Express + WebSocket ws)
    ├── server.ts          # REST endpoints, WebSocket broadcast hub, Gemini proxy
```

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas 2D API.
- **Backend**: Express.js REST API with integrated WebSocket server (`ws`).
- **AI Integration**: Google GenAI SDK (`@google/genai`) with `gemini-2.5-flash`.
- **Quality Control**: Fleiss' Kappa multi-rater formula and majority vote consensus engine.

---

## 📦 How to Push to Your GitHub Account

1. Create a new repository on GitHub (e.g. `labelloop-ai` or `label-ai`).
2. Run the following commands in this directory:
   ```bash
   git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
   git branch -M main
   git push -u origin main
   ```
   *(Or using GitHub CLI: `gh repo create labelloop-ai --public --source=. --remote=origin --push`)*

---

## 📄 License
Apache-2.0
