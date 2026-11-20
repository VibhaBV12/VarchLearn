# VarchLearn — AI Learning Content & Activity Generation Platform (Groq API Powered)

VarchLearn is a production-quality, AI-powered educational platform built around the four VARK learning modalities (**Visual / Picture Explorer**, **Auditory / Sound Explorer**, **Read/Write / Word Explorer**, **Kinesthetic / Action Explorer**) and five original mascots (**Vee**, **Pixie**, **Echo**, **Winky**, **Bouncy**).

It features a modular **Central AI Generation Engine** powered by the **Groq API** (`https://api.groq.com/openai/v1/chat/completions`) that transforms raw extracted textbook PDFs into:
1. **Grounded Conceptual Knowledge Maps** (definitions, key terms, mechanisms, cause-and-effect, sequences, and misconceptions).
2. **Four distinct multimodal representations** (Visual concept schematics, Auditory narration scripts & guided listening, Read/Write textual evidence analysis, and Kinesthetic interactive models & sandboxes).
3. **Engaging, academically rigorous interactive activities** with custom learning inputs and non-childish mechanics.
4. **Diagnostic assessments** across multiple formats (MCQ, multiple-select, assertion-reasoning, sequence ordering, and short-answer rubrics).
5. **Progressive grade & difficulty adaptation** (Easy, Medium, Hard).
6. **Token-optimized SHA-256 caching** to minimize Groq API credit consumption and eliminate redundant generation requests.

---

## Architecture Overview

```text
VarchLearn/
├── backend/                             # Node.js + Express + TypeScript + PostgreSQL + Prisma REST API (Port 4000)
│   ├── prisma/                          # schema.prisma, migrations/, seed.ts
│   ├── src/
│   │   ├── config/                      # env.ts, prisma.ts, swagger.ts (/api/v1/docs)
│   │   ├── controllers/                 # aiController, auth, student, class, textbook, activity, assessment, assignment, analytics
│   │   ├── middleware/                  # JWT auth, role guards, rate limiter, Multer PDF upload, error handler
│   │   ├── routes/                      # /api/v1 routes (including /api/v1/ai/*)
│   │   ├── services/
│   │   │   ├── ai/                      # Central Groq AI Generation Engine
│   │   │   │   ├── aiProvider.service.ts         # Secure Groq OpenAI-compatible client, Bearer auth, timeout & SHA-256 caching
│   │   │   │   ├── conceptExtraction.service.ts  # Grounded knowledge map extraction from textbook text
│   │   │   │   ├── conceptGeneration.service.ts  # Grade-adapted conceptual masterclass explanations
│   │   │   │   ├── modalityGeneration.service.ts # 4-modality synthesis (Visual, Auditory, Read/Write, Kinesthetic)
│   │   │   │   ├── activityGeneration.service.ts # Single & batch activity generation for 24 game types
│   │   │   │   ├── assessmentGeneration.service.ts# 4-modality diagnostic assessments with grading rubrics
│   │   │   │   ├── difficultyAdaptation.service.ts# Intellectual, vocabulary & cognitive depth adaptation
│   │   │   │   ├── qualityValidation.service.ts  # Zod schema validation & auto-repair engine
│   │   │   │   ├── promptTemplates.ts            # Token-efficient concise prompts enforcing pure JSON
│   │   │   │   ├── generationSchemas.ts          # Zod schemas & TypeScript types
│   │   │   │   └── index.ts                      # Clean barrel exports
│   │   │   ├── aiGeneratorService.ts             # Groq-powered backward-compatible wrapper
│   │   │   └── pdfService.ts                     # pdf-parse text extraction & chapter/topic body slicer
│   │   ├── utils/                       # mappers, assessmentScoring, allocation
│   │   └── validators/                  # Zod request validation schemas
│   ├── tests/                           # Unit & integration test suite (aiEngine.test.ts, api.test.ts)
│   ├── uploads/                         # Secure local textbook PDF storage
│   └── .env.example
├── admin-web/                           # React + Vite + Tailwind Mobile-First Admin Dashboard (Port 5173)
│   └── src/
│       ├── pages/TextbookAiGenerationPage.tsx # Upgraded AI Content Studio (Extraction, Modalities, Batch Gen, Assessments)
│       └── services/aiContentService.ts       # Full client for new /api/v1/ai endpoints
├── mobile/student/                      # React Native + Expo SDK 51 Student Application (Port 8081)
│   └── src/components/games/            # Dynamic activity renderers for Visual, Auditory, Read/Write, Kinesthetic
└── shared/                              # Shared TypeScript types, constants, VARK engine, seed data
```

---

## Central AI Engine Endpoints

All endpoints are hosted at `/api/v1/ai` and require Admin JWT authentication:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/ai/concept/extract` | Extracts grounded concept knowledge map from textbook PDF text. |
| `POST` | `/api/v1/ai/concept/generate` | Generates a grade-adapted, structured conceptual explanation. |
| `POST` | `/api/v1/ai/modalities/generate` | Synthesizes all 4 VARK representations (Visual, Auditory, Read/Write, Kinesthetic). |
| `POST` | `/api/v1/ai/activities/generate-batch` | Generates activities for all 4 modalities simultaneously to save Groq tokens. |
| `POST` | `/api/v1/ai/assessments/generate` | Generates a 4-modality diagnostic assessment with rubrics. |
| `POST` | `/api/v1/ai/assessments/save` | Persists generated assessment to PostgreSQL and assigns to classes. |
| `GET` | `/api/v1/ai/stats` | Returns AI cache statistics and active model configuration. |
| `POST` | `/api/v1/activities/generate` | Generates a single modality activity (compatible with legacy callers). |

---

## How to Configure Groq API

1. **Obtain a Groq API Key**:
   - Sign up or log in at [https://console.groq.com](https://console.groq.com).
   - Navigate to **API Keys** and click **Create API Key**.
   - Copy your key (starts with `gsk_...`).

2. **Configure in `VarchLearn/backend/.env`**:
   ```env
   AI_PROVIDER="groq"
   GROQ_API_KEY="gsk_your_actual_groq_api_key_here"
   GROQ_MODEL="llama-3.3-70b-versatile"
   ```

3. **Supported Groq Models**:
   - `llama-3.3-70b-versatile` *(Recommended: 128k context, exceptional JSON compliance and reasoning)*
   - `llama-3.1-8b-instant` *(Ultra-fast, lightweight)*
   - `mixtral-8x7b-32768` *(High-speed MoE)*

---

## Token & Cost Optimization Strategy

1. **Single-Pass Text Extraction**: PDFs are parsed once and stored in PostgreSQL (`Textbook.extractedRawText`).
2. **Excerpts Only**: Only the selected chapter/topic text slice (not the whole book) is sent to Groq.
3. **SHA-256 In-Memory Cache**: Prompts and models are hashed. Repeated generation requests with identical topics and parameters return instantly without calling the Groq API.
4. **Reusable Concept Map**: The extracted Concept Map is used across all 4 modalities rather than repeating extraction calls.
5. **Batch Generation**: The `/ai/activities/generate-batch` endpoint generates all 4 modalities in parallel with optimized prompt lengths.
6. **Deterministic Grounded Fallback**: If `AI_PROVIDER=fallback` or no Groq API key is configured, the engine deterministically synthesizes rich, grounded educational content directly from the textbook text without failing or blocking the user.

---

## Installation & Setup Instructions

### 1. Install Dependencies
```bash
# Backend
cd VarchLearn/backend
npm install

# Admin Web
cd ../admin-web
npm install

# Student Mobile
cd ../mobile/student
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in each project folder:

**`VarchLearn/backend/.env`**:
```env
PORT=4000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/varchlearn_db?schema=public"
JWT_SECRET="varchlearn-production-jwt-secret-2026"
JWT_EXPIRES_IN="7d"
CORS_ORIGINS="http://localhost:5173,http://localhost:5174,http://localhost:8081,http://localhost:19006"

# Groq AI Configuration
AI_PROVIDER="groq"
GROQ_API_KEY="YOUR_GROQ_API_KEY"
GROQ_MODEL="llama-3.3-70b-versatile"

UPLOAD_DIR="./uploads"
MAX_PDF_SIZE_MB=20
```

**`VarchLearn/admin-web/.env`**:
```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_USE_MOCK_API=false
```

**`VarchLearn/mobile/student/.env`**:
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
EXPO_PUBLIC_USE_MOCK_API=false
```

### 3. Database Migration & Seed
```bash
cd VarchLearn/backend
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
```

### 4. Running the Applications
- **Terminal 1 — Backend API Server (Port 4000):**
  ```bash
  cd VarchLearn/backend
  npm run dev
  ```
  API runs on `http://localhost:4000/api/v1`. Swagger docs available at `http://localhost:4000/api/v1/docs`.

- **Terminal 2 — Admin Web Dashboard (Port 5173):**
  ```bash
  cd VarchLearn/admin-web
  npm run dev
  ```
  Dashboard runs on `http://localhost:5173`. Login: `ananya.rao@varchlearn.edu` / `admin123`.

- **Terminal 3 — Student Mobile App (Port 8081):**
  ```bash
  cd VarchLearn/mobile/student
  npx expo start -c
  ```
  Press `w` for Web or scan QR code with Expo Go on Android. Login: `aarav5` / `learn123` (PIN: `1234`).

---

## Running the Automated Test Suite

Run the backend unit and Groq AI engine tests:
```bash
cd VarchLearn/backend
npm test
```
All 16 automated test suites verify Groq prompt construction, schema validation, concept extraction, 4-modality synthesis, batch generation, difficulty adaptation, quality repair, caching, and allocation scoring.
