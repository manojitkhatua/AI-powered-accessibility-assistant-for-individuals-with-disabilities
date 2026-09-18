# VisionX --- AI-Powered Accessibility Assistant

> Making the information around us more accessible through AI, voice,
> vision, and audio.

VisionX is an AI-powered accessibility assistant designed to help people
who cannot rely on vision or hearing access information from their
surroundings through natural voice interaction, computer vision, spatial
understanding, OCR, and audio assistance.

## 🌍 The Problem

We access a huge amount of information simply by looking and listening.

We can quickly identify objects, read signs and labels, find things
around us, understand where objects are, and notice environmental
sounds.

For someone who cannot rely on vision or hearing, accessing this
information can require additional assistance.

### Our question

> **How can technology help a person access information from their
> surroundings without depending on the sense they cannot rely on?**

## 💡 Our Solution

**VisionX turns environmental information into accessible information.**

A user can interact naturally:

> 🎤 **"What is in front of me?"**

VisionX can combine:

**Speech → Vision → Spatial Understanding → AI Reasoning → Voice**

For example:

> 🔊 **"There is a vase directly in front of you, about 1.6 meters
> away."**

The system attempts to provide useful context:

-   **What?** --- Vase
-   **Where?** --- Directly in front
-   **How far?** --- Approximately 1.6 m

## ✨ Core Features

### 👁️ Vision Assistance

Identifies objects visible through the camera.

### 📍 Spatial Awareness

Maps detected objects to **left, center, or right**, with approximate
distance from monocular depth estimation.

### 📖 OCR --- Read Text

Captures clearly visible text from signs, labels, documents, and other
readable surfaces.

### 🎤 Hands-Free Interaction

Users can communicate naturally using their voice instead of navigating
complicated controls.

### 🔎 Scan Surroundings

Analyzes the current camera view and describes detected objects.

### 🔁 Repeat

Replays the previous assistant response when the user needs to hear it
again.

### 👂 Hearing Assist

Provides an interface for analyzing environmental audio and presenting
detected sounds as understandable information.

### 💾 Memory

Stores relevant user information in Supabase PostgreSQL for retrieval
when needed.

## 🏗️ Architecture

``` text
USER
  │
  ├── Voice + Camera
  ▼
FASTAPI BACKEND ORCHESTRATOR
  │
  ├── Speech Recognition — Gemini
  ├── Computer Vision — YOLO
  ├── OCR — Gemini Vision
  ├── Spatial Reasoning — Left / Center / Right
  ├── Depth Estimation — Depth Anything V2
  └── Sound Classification — Gemini
  │
  ▼
GEMINI REASONING
  │
  ├── Text Response
  └── Audio Response — Gemini TTS
  │
  ▼
USER

Supabase PostgreSQL
        ↕
   Relevant Memory
```

### Example request flow

``` text
“What is in front of me?”
          ↓
   Speech Recognition
          ↓
     Vision / YOLO
          ↓
 Spatial Reasoning + Depth
          ↓
    Gemini Reasoning
          ↓
      Gemini TTS
          ↓
“There is a vase directly in front
 of you, about 1.6 meters away.”
```

The frontend remains simple while the FastAPI backend coordinates the
specialized AI services.

## 🧠 Technology Stack

### Frontend

-   React
-   Vite
-   JavaScript / JSX
-   Browser Camera APIs
-   Browser Microphone APIs

### Backend

-   Python
-   FastAPI
-   REST APIs

### AI

-   **Gemini** --- speech recognition, OCR, reasoning, text-to-speech,
    and sound classification
-   **YOLO** --- object detection
-   **Depth Anything V2 Metric Indoor Small** --- monocular depth
    estimation

### Database

-   **Supabase PostgreSQL** --- user memory

## 🔌 Backend API

  -----------------------------------------------------------------------
  Endpoint                            Purpose
  ----------------------------------- -----------------------------------
  `GET /api/health`                   Backend health check

  `POST /api/assistant/analyze`       Complete voice + camera assistant
                                      pipeline

  `POST /api/vision/detect`           Object detection + spatial
                                      position + depth

  `POST /api/vision/ocr`              Extract visible text

  `POST /api/voice/transcribe`        Speech-to-text

  `POST /api/hearing/analyze`         Environmental sound analysis

  `POST /api/memory`                  Store a memory

  `GET /api/memory`                   Retrieve memories
  -----------------------------------------------------------------------

FastAPI provides interactive API documentation when the backend is
running.

## 📁 Project Structure

``` text
AI-powered-accessibility-assistant-for-individuals-with-disabilities/
├── frontend/
│   └── src/
│       └── pages/
│           ├── HandsFreeAssistPage.jsx
│           ├── VisionAssistPage.jsx
│           └── HearingAssistPage.jsx
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── database/
│   │   ├── models/
│   │   ├── safety/
│   │   └── services/
│   ├── .env
│   └── requirements.txt
│
└── README.md
```

## 🚀 Getting Started

### Backend

``` bash
cd backend
python -m venv .venv
```

Windows:

``` powershell
.\.venv\Scriptsctivate
```

Install dependencies:

``` bash
pip install -r requirements.txt
```

Create `backend/.env`:

``` env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
ENVIRONMENT=development
```

**Never commit `.env` or real API keys.**

Start the backend:

``` bash
uvicorn app.main:app --reload
```

### Frontend

``` bash
cd frontend
npm install
npm run dev
```

If required:

``` env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## 🔐 Privacy Considerations

-   Camera frames are processed temporarily.
-   Camera frames are not continuously stored as user memories.
-   User memories are stored separately in Supabase.
-   API credentials are kept in environment variables.
-   The frontend does not directly handle Supabase service-role
    credentials.

## ⚠️ Current Limitations

VisionX is a hackathon prototype and is not a certified safety-critical
assistive system.

-   Object detection depends on camera quality and model confidence.
-   Depth estimation provides approximate rather than guaranteed
    measurements.
-   OCR depends on text visibility, image quality, lighting, and
    orientation.
-   Speech recognition can be affected by background noise.
-   AI-generated responses can contain errors.
-   Sound classification depends on the quality of recorded audio.
-   External AI services and internet connectivity can affect
    functionality.

For safety-critical navigation, users should continue to use appropriate
established assistive methods and human judgment.

## 🎯 Design Philosophy

> **The technology should be complex so the interaction can remain
> simple.**

The user should not need to understand object detection, depth
estimation, OCR, speech recognition, AI orchestration, or language
models.

They should simply be able to ask:

> **"What is in front of me?"**

and receive useful information.

## 🌍 Our Vision

> **Information can exist without being accessible.**

A sign already contains information. An object is already present. A
sound is already happening.

VisionX adds an AI-powered layer between the physical environment and
the user to help make that information accessible through another
interaction channel.

### Our goal

> **Give people more access to the world around them without taking away
> their independence.**

## 🏆 Built For

**AI-01 --- AI-Powered Accessibility Assistant for Individuals with
Disabilities**

Built as a hackathon project focused on:

-   Accessibility
-   Artificial Intelligence
-   Computer Vision
-   Voice Interaction
-   Assistive Technology
-   Human-centered design

------------------------------------------------------------------------

## VisionX

**See the world. Understand the world. Access the world.**
