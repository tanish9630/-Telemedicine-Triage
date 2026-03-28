# 🏥 CareConnect AI — Telemedicine Triage Platform

> A full-stack, AI-powered telemedicine platform enabling patients to get instant symptom analysis, book video consultations with verified doctors, log daily health vitals, and trigger real-time emergency SOS alerts — all from a single, beautifully designed web application.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Features](#-features)
  - [Patient Features](#-patient-features)
  - [Doctor Features](#-doctor-features)
  - [Shared / General Features](#-shared--general-features)
- [Tech Stack](#-tech-stack)
  - [Frontend](#frontend)
  - [Backend](#backend)
  - [Third-Party Services & APIs](#third-party-services--apis)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
  - [User Collection](#1-user-collection)
  - [Appointment Collection](#2-appointment-collection)
  - [Vital Collection](#3-vital-collection)
  - [Emergency Collection](#4-emergency-collection)
- [API Endpoints](#-api-endpoints)
  - [Auth Routes](#auth-routes-apauth)
  - [Appointment Routes](#appointment-routes-apiappointments)
  - [Vitals Routes](#vitals-routes-apivitals)
  - [Emergency Routes](#emergency-routes-apiemergency)
- [Architecture Overview](#-architecture-overview)
- [Pages & Components](#-pages--components)
- [Real-Time Features](#-real-time-features)
- [Authentication & Security](#-authentication--security)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [Scripts](#-scripts)

---

## 🌐 Project Overview

**CareConnect AI** is a comprehensive telemedicine triage web application built with React + TypeScript on the frontend and Node.js + Express + MongoDB on the backend. It bridges the gap between patients and doctors through:

- **AI-powered symptom assessment** using Groq's Llama 3.3 model
- **Live video consultations** via Agora RTC
- **Real-time emergency SOS dispatch** with geolocation-based doctor routing via Socket.io
- **Daily health vitals tracking** with interactive charts
- **Appointment booking and management**
- **Dark / Light mode** with a premium glassmorphism UI

The platform is designed with two distinct portals — one for **Patients** and one for **Doctors** — each with role-protected routing, dedicated dashboards, and tailored functionality.

---

## ✨ Features

### 🧑‍⚕️ Patient Features

| Feature | Description |
|---|---|
| **Patient Registration & Login** | Secure signup with full name, email, and password. JWT-based session persistence. |
| **Health Intake Form** | First-time onboarding form (age, gender, blood type, height, weight, allergies, existing conditions) served as a global gatekeeper via `PatientLayout`. |
| **Patient Dashboard** | Personalized welcome banner, quick-action cards, profile summary with BMI calculation, and rotating daily health tips. |
| **Daily Vitals Logging** | Modal form to log heart rate (BPM), sleep (hrs), blood sugar (mg/dL), and body temperature (°F) to MongoDB. One log per day; updates if re-submitted. |
| **Vitals Charts** | Area chart for Heart Rate & Sleep trends; Line chart for Blood Sugar & Temperature over the past 7 days, fetched from the real database. |
| **Health Status Progress Bars** | Visual health indicator bars for heart rate, sleep, and blood sugar against healthy ranges. |
| **AI Triage Chat** | Conversational AI chatbot powered by **Groq (Llama 3.3 70B)**. Analyzes patient-described symptoms and returns urgency level (1–5), recommended specialist, and action steps. |
| **Voice Input** | Speech-to-text input in the AI triage chat using the Web Speech API and/or Groq Whisper, enabling hands-free symptom description. |
| **Urgency Level Classification** | AI returns a color-coded triage card: Level 1 (Mild) → Level 5 (Critical Emergency 🚨). |
| **Find Doctors** | Browse all registered, verified doctors by specialization, with profile links and booking buttons. |
| **Doctor Profiles** | Dedicated profile page for each doctor showing their specialization, location, and NMC registration. |
| **Appointment Booking** | Patients can book appointments with any registered doctor by selecting a date, time, and describing the reason. |
| **Patient Calendar** | Full calendar view of all booked appointments, showing status (Pending / Approved / Rejected). |
| **Video Consultation** | One-click join for approved appointments via Agora RTC's real-time video channel. |
| **Emergency SOS** | One-tap SOS button that captures the patient's geolocation and broadcasts a critical alert to all online doctors via WebSocket. |
| **Patient Settings** | Profile customization (name, avatar color, notification preferences). |
| **Dark / Light Mode** | System-wide theme toggle with full dark mode support across all patient pages. |

---

### 👨‍⚕️ Doctor Features

| Feature | Description |
|---|---|
| **Doctor Registration** | Extended signup capturing NMC registration number, medical specialization, and current geolocation (lat/lng/address) for SOS routing. |
| **NMC Verification Flow** | Dedicated multi-step auth form for verifying doctor credentials via registration number. |
| **Doctor Dashboard** | Metrics overview: Total Counseling, Overall Bookings, New Appointments (pending), Today's Schedule — fetched live from the database. |
| **Analytics Charts** | Bar chart for Patient Age Group distribution; Line chart for Consultations by Day of Week. |
| **Triage Requests Panel** | Live list of pending appointment requests with Approve / Reject buttons. Approval auto-generates an Agora video channel name. |
| **Today's Schedule Table** | Tabular view of today's approved appointments with patient name, time, reason, Join Video Call button, and delete option. |
| **Doctor Calendar** | Full week/month calendar view of all assigned appointments with status filtering. |
| **Patient Management** | List of all patients who have booked with the doctor — with names, emails, and appointment history. |
| **SOS Alert Reception** | Doctors subscribed to the `doctors` Socket.io room receive high-priority, audio+visual SOS alerts with patient name and location when an emergency is triggered. |
| **Video Consultation** | Doctors join the same Agora RTC channel as the patient for the live consultation session. |
| **Doctor Profile** | Public profile page accessible to patients, showing specialization and other details. |
| **Doctor Settings** | Account-level settings for profile management. |
| **Dark / Light Mode** | Full dark mode support across the entire Doctor portal. |

---

### 🔗 Shared / General Features

| Feature | Description |
|---|---|
| **Landing Page** | Premium dual-portal landing page with Role Cards for Patient and Doctor access. |
| **Role-Protected Routing** | `RoleProtectedRoute` component validates the user's JWT-confirmed role on every navigation. |
| **Live Video Consultation Room** | Shared Agora RTC room supporting multi-participant HD video, mic mute, camera off, and call end with role-based redirect. |
| **Live Subtitles / Captions** | Web Speech API transcribes speech in real time during a consultation and broadcasts it to the remote participant via BroadcastChannel. |
| **Call Notification** | `useCallNotification` hook broadcasts a call-started event across browser tabs so the other participant gets notified instantly. |
| **Theme Toggle** | Standalone `ThemeToggle` component with sun/moon icon; persists preference via `ThemeContext` and `localStorage`. |
| **Testimonials Section** | Social proof section on the landing page. |
| **Footer** | Shared footer with platform information. |
| **Health Check API** | `GET /api/health` endpoint confirming server status. |

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.x | Core UI library |
| **TypeScript** | 5.9.x | Type-safe development |
| **Vite** | 8.x | Lightning-fast build tool and dev server |
| **React Router DOM** | 7.x | Client-side routing and role-protected navigation |
| **Tailwind CSS** | 3.4.x | Utility-first CSS framework for all styling |
| **Recharts** | 3.x | Composable charting library (AreaChart, LineChart, BarChart) |
| **Lucide React** | 1.x | Icon library |
| **Agora RTC SDK NG** | 4.24.x | Real-time video/audio consultation |
| **Socket.io Client** | 4.8.x | WebSocket client for SOS alerts and real-time events |
| **@supabase/supabase-js** | 2.x | Supabase client (legacy integration layer) |
| **PostCSS + Autoprefixer** | — | CSS processing for Tailwind |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 20+ (LTS) | JavaScript runtime |
| **Express** | 5.x | HTTP server and REST API framework |
| **MongoDB** | Cloud (Atlas) | Primary NoSQL database |
| **Mongoose** | 9.x | MongoDB ODM for schema definition and queries |
| **Socket.io** | 4.8.x | WebSocket server for real-time SOS broadcasts |
| **JSON Web Token (jsonwebtoken)** | 9.x | Stateless authentication tokens |
| **bcryptjs** | 3.x | Password hashing (salt rounds: 10) |
| **dotenv** | 17.x | Environment variable management |
| **CORS** | 2.x | Cross-origin request handling |

### Third-Party Services & APIs

| Service | Purpose |
|---|---|
| **Groq API (Llama 3.3 70B Versatile)** | AI triage chat — symptom analysis, urgency classification, specialist recommendation. Multilingual responses matched to user input language. |
| **Agora.io RTC** | Real-time video and audio for live doctor-patient consultations. Channels are auto-generated on appointment approval. |
| **Web Speech API (Browser Native)** | Voice-to-text input in AI triage + live subtitles/captions during video calls. |
| **MongoDB Atlas** | Cloud-hosted MongoDB database. |
| **BroadcastChannel API (Browser Native)** | Cross-tab communication for call notifications and real-time subtitles. |
| **Geolocation API (Browser Native)** | Captures patient GPS coordinates when an SOS is triggered for proximity-based doctor routing. |

---

## 📁 Project Structure

```
Telemedicine Triage/
├── frontend/                        # React + TypeScript + Vite app
│   ├── public/
│   ├── src/
│   │   ├── assets/                  # Static assets
│   │   ├── components/              # Shared layout & utility components
│   │   │   ├── DoctorLayout.tsx     # Doctor sidebar + nav shell
│   │   │   ├── PatientLayout.tsx    # Patient sidebar + nav + intake gatekeeper
│   │   │   ├── RoleProtectedRoute.tsx # JWT-validated role guard
│   │   │   ├── ThemeToggle.tsx      # Dark/Light mode switch
│   │   │   ├── RoleCard.tsx         # Landing page portal cards
│   │   │   ├── Navbar.tsx           # Top navigation bar
│   │   │   ├── Footer.tsx           # Shared footer
│   │   │   └── Testimonials.tsx     # Social proof section
│   │   ├── context/                 # React Context providers
│   │   │   ├── AuthContext.tsx      # Global auth state + JWT validation
│   │   │   ├── SocketContext.tsx    # Socket.io connection provider
│   │   │   └── ThemeContext.tsx     # Dark/Light mode state
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useCallNotification.ts # BroadcastChannel call alert hook
│   │   │   └── useSpeechRecognition.ts # Voice-to-text hook
│   │   ├── lib/                     # Utility / client instances
│   │   ├── pages/                   # All page-level components
│   │   │   ├── LandingPage.tsx      # Home / entry page
│   │   │   ├── PatientAuth.tsx      # Patient login & signup
│   │   │   ├── DoctorAuth.tsx       # Doctor login & NMC signup
│   │   │   ├── PatientDashboard.tsx # Patient main dashboard
│   │   │   ├── DoctorDashboard.tsx  # Doctor main dashboard + analytics
│   │   │   ├── PatientAITriage.tsx  # Groq-powered AI symptom chat
│   │   │   ├── PatientCalendar.tsx  # Patient appointment calendar
│   │   │   ├── DoctorCalendar.tsx   # Doctor appointment calendar
│   │   │   ├── FindDoctors.tsx      # Doctor discovery & booking
│   │   │   ├── DoctorProfile.tsx    # Public doctor profile
│   │   │   ├── DoctorPatients.tsx   # Doctor's patient management list
│   │   │   ├── PatientSettings.tsx  # Patient account settings
│   │   │   ├── DoctorSettings.tsx   # Doctor account settings
│   │   │   └── VideoConsultation.tsx # Agora RTC live video room
│   │   ├── App.tsx                  # Route definitions
│   │   ├── main.tsx                 # App entry point
│   │   └── index.css                # Global styles
│   ├── .env                         # Frontend environment variables
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── backend/                         # Node.js + Express API server
    ├── config/
    │   └── db.js                    # MongoDB Atlas connection
    ├── middleware/
    │   └── authMiddleware.js        # JWT `protect` middleware
    ├── models/                      # Mongoose schemas
    │   ├── User.js                  # Patient & Doctor model
    │   ├── Appointment.js           # Appointment model
    │   ├── Vital.js                 # Daily health vitals model
    │   └── Emergency.js             # SOS emergency model
    ├── routes/                      # Express route handlers
    │   ├── authRoutes.js            # Signup, login, profile
    │   ├── appointmentRoutes.js     # CRUD + analytics for appointments
    │   ├── vitalRoutes.js           # Log and fetch patient vitals
    │   └── emergencyRoutes.js       # SOS trigger + doctor routing
    ├── utils/
    │   ├── generateToken.js         # JWT token factory
    │   └── socket.js                # Socket.io server init + room logic
    ├── server.js                    # Express app entry point
    ├── .env                         # Backend environment variables
    └── package.json
```

---

## 🗄️ Database Schema

### 1. User Collection

Stores both **patients** and **doctors** in a single collection, differentiated by the `role` field.

```js
{
  fullName:           String   // required
  email:              String   // required, unique, lowercase
  password:           String   // bcrypt-hashed, 10 salt rounds
  role:               String   // enum: ['patient', 'doctor']

  // Doctor-only fields (required when role === 'doctor')
  registrationNumber: String   // NMC registration number
  specialization:     String   // e.g. 'Cardiologist'
  location: {
    lat:     Number            // GPS latitude
    lng:     Number            // GPS longitude
    address: String            // Human-readable address
  }
  isVerified:         Boolean  // default: false

  createdAt:          Date     // auto (timestamps)
  updatedAt:          Date     // auto (timestamps)
}
```

**Methods:**
- `pre('save')` hook — auto-hashes password with bcrypt before saving
- `matchPassword(enteredPassword)` — compares plain text against bcrypt hash

---

### 2. Appointment Collection

Tracks all appointments between patients and doctors.

```js
{
  patient:     ObjectId  // ref: 'User' (patient)
  doctor:      ObjectId  // ref: 'User' (doctor)
  dateTime:    Date      // scheduled date and time
  reason:      String    // patient's stated reason for visit
  status:      String    // enum: ['pending', 'approved', 'rejected'], default: 'pending'
  channelName: String    // Agora RTC channel name (set on approval), default: null
  notes:       String    // optional doctor notes, default: ''

  createdAt:   Date      // auto (timestamps)
  updatedAt:   Date      // auto (timestamps)
}
```

**Key Logic:**
- When a doctor sets status to `'approved'`, a unique Agora channel name is auto-generated (`room-<random8chars>`)
- Both patient and doctor join the same channel to start the video consultation

---

### 3. Vital Collection

Stores one daily health vitals log per patient.

```js
{
  patient:   ObjectId  // ref: 'User' (patient)
  dateLog:   String    // ISO date string e.g. '2024-03-27' (one entry per day)
  day:       String    // Short day name e.g. 'Mon', 'Tue' (for chart labels)
  heartRate: Number    // BPM, required
  sleep:     Number    // Hours of sleep, required
  sugar:     Number    // Blood sugar in mg/dL, required
  temp:      Number    // Body temperature in °F, required

  createdAt: Date      // auto (timestamps)
  updatedAt: Date      // auto (timestamps)
}
```

**Key Logic:**
- If a log already exists for a given `(patient, dateLog)` pair, it is **updated** (upsert behavior)
- The API returns up to the last **7 entries**, sorted chronologically, for charting

---

### 4. Emergency Collection

Tracks real-time SOS emergency events.

```js
{
  patient:         ObjectId  // ref: 'User' (patient who triggered SOS)
  location: {
    lat: Number              // Patient GPS latitude at time of SOS
    lng: Number              // Patient GPS longitude at time of SOS
  }
  status:          String    // enum: ['active', 'resolving', 'resolved'], default: 'active'
  assignedDoctor:  ObjectId  // ref: 'User' (nearest doctor, auto-assigned)

  createdAt:       Date      // auto (timestamps)
  updatedAt:       Date      // auto (timestamps)
}
```

**Key Logic:**
- On SOS trigger, the server calculates **Euclidean distance** between patient coordinates and all registered doctor locations
- The nearest doctor is auto-assigned as `assignedDoctor`
- A `critical_sos_alert` WebSocket event is broadcast to all sockets in the `'doctors'` room

---

## 📡 API Endpoints

### Auth Routes (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Public | Register a new patient or doctor |
| `POST` | `/api/auth/login` | Public | Authenticate and receive JWT token |
| `GET` | `/api/auth/profile` | Private | Get the logged-in user's profile (server-side JWT validation) |

---

### Appointment Routes (`/api/appointments`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/appointments/doctors` | Private | List all registered doctors (for patient booking) |
| `POST` | `/api/appointments` | Private (Patient) | Book a new appointment with a doctor |
| `GET` | `/api/appointments/my` | Private (Patient) | Get the authenticated patient's appointments |
| `GET` | `/api/appointments/doctor` | Private (Doctor) | Get all appointments assigned to the doctor |
| `PATCH` | `/api/appointments/:id/status` | Private (Doctor) | Approve or reject an appointment request |
| `DELETE` | `/api/appointments/:id` | Private (Doctor/Patient) | Delete an appointment |
| `GET` | `/api/appointments/analytics` | Private (Doctor) | Get dashboard metrics (totals, today's schedule, patient list) |

---

### Vitals Routes (`/api/vitals`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/vitals` | Private (Patient) | Log or update today's vitals (heart rate, sleep, sugar, temp) |
| `GET` | `/api/vitals/my` | Private (Patient) | Fetch last 7 days of vitals for chart display |

---

### Emergency Routes (`/api/emergency`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/emergency` | Private (Patient) | Trigger SOS — saves emergency, finds nearest doctor, emits Socket.io alert |

---

### Health Check

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Confirms the API server is running |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│                                                          │
│  React 19 + TypeScript + Vite + Tailwind CSS            │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ AuthContext  │  │SocketContext │  │ ThemeContext   │  │
│  │ (JWT + User) │  │ (Socket.io)  │  │ (Dark/Light)  │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
│                                                          │
│  Pages: Landing | Patient Portal | Doctor Portal | Video │
│  Hooks: useCallNotification | useSpeechRecognition       │
└─────────────────────┬───────────────────────────────────┘
                      │ REST (HTTP/HTTPS)
                      │ WebSocket (Socket.io)
                      │
┌─────────────────────▼───────────────────────────────────┐
│                  BACKEND (Node.js + Express)             │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ authRoutes  │  │ apptRoutes   │  │ vitalRoutes    │  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
│  ┌──────────────┐  ┌──────────────────────────────────┐  │
│  │ emergRoutes  │  │ authMiddleware (JWT protect)      │  │
│  └──────────────┘  └──────────────────────────────────┘  │
│                                                          │
│  Socket.io Server — 'doctors' room for SOS broadcasts   │
└─────────────────────┬───────────────────────────────────┘
                      │ Mongoose ODM
                      │
┌─────────────────────▼───────────────────────────────────┐
│               MongoDB Atlas (Cloud Database)             │
│                                                          │
│  Collections: users | appointments | vitals | emergencies│
└─────────────────────────────────────────────────────────┘
                      
┌─────────────────────────────────────────────────────────┐
│                 External Services                        │
│                                                          │
│  🤖 Groq API (Llama 3.3 70B) — AI Triage Chat           │
│  📹 Agora.io RTC             — Video Consultations       │
│  🎤 Web Speech API (Native)  — Voice input + captions   │
└─────────────────────────────────────────────────────────┘
```

---

## 📄 Pages & Components

### Pages

| Page | Route | Role | Description |
|---|---|---|---|
| `LandingPage` | `/` | Public | Hero + portal selection (Patient/Doctor) |
| `PatientAuth` | `/patient/signup` | Public | Patient login & registration |
| `DoctorAuth` | `/doctor/signup` | Public | Doctor login & NMC registration |
| `PatientDashboard` | `/patient/dashboard` | Patient | Health overview, vitals, appointments |
| `PatientAITriage` | `/patient/ai-triage` | Patient | Groq AI symptom chatbot |
| `PatientCalendar` | `/patient/calendar` | Patient | Appointment calendar |
| `FindDoctors` | `/find-doctors` | Any | Browse & book doctors |
| `DoctorProfile` | `/doctor/profile/:id` | Any | Individual doctor profile |
| `PatientSettings` | `/patient/settings` | Patient | Account settings |
| `DoctorDashboard` | `/doctor/dashboard` | Doctor | Analytics, triage requests, schedule |
| `DoctorCalendar` | `/doctor/calendar` | Doctor | Doctor's appointment calendar |
| `DoctorPatients` | `/doctor/patients` | Doctor | Manage patient list |
| `DoctorSettings` | `/doctor/settings` | Doctor | Doctor account settings |
| `VideoConsultation` | `/consultation/:channelName` | Auth | Live Agora RTC video room |

### Key Components

| Component | Purpose |
|---|---|
| `PatientLayout` | Shell for all patient pages; renders sidebar nav + health intake form gatekeeper |
| `DoctorLayout` | Shell for all doctor pages; renders sidebar nav + SOS alert listener |
| `RoleProtectedRoute` | HOC that validates JWT-confirmed role before rendering protected routes |
| `ThemeToggle` | Sun/moon icon button that switches and persists dark/light mode |
| `RoleCard` | Landing page card component for choosing portal entry |
| `Navbar` | Top navigation bar |
| `Footer` | Site-wide footer |
| `Testimonials` | Patient testimonials section on the landing page |

### Custom Hooks

| Hook | Purpose |
|---|---|
| `useCallNotification` | Emits and listens for call-started events across browser tabs using `BroadcastChannel` |
| `useSpeechRecognition` | Wraps the Web Speech API for voice-to-text input in the AI triage interface |

### Context Providers

| Context | Purpose |
|---|---|
| `AuthContext` | Stores user + JWT token; validates token against `/api/auth/profile` on every page load |
| `SocketContext` | Creates and exposes a persistent `socket.io-client` connection |
| `ThemeContext` | Manages dark/light mode state; persists in `localStorage` |

---

## ⚡ Real-Time Features

### Socket.io Architecture

The backend initializes a `Socket.io` server on the same HTTP server as Express.

```
Patient → POST /api/emergency  
        → Server finds nearest doctor by Euclidean distance  
        → io.to('doctors').emit('critical_sos_alert', payload)  
        → All doctor clients in the 'doctors' room receive the alert
```

- **Doctor room join:** When a doctor logs in and loads `DoctorLayout`, the socket client emits `join_doctor_room`, adding it to the `'doctors'` WebSocket room.
- **SOS alert payload:** `{ emergency, nearestDoctorId, message }` — includes full patient info, coordinates, and the assigned doctor's ID.

### Live Captions (Video Consultation)

During an active video call:
1. The Web Speech API continuously transcribes the local user's speech.
2. The transcript is posted to a `BroadcastChannel('careconnect-subtitles')`.
3. The remote participant's tab listens on the same channel and displays the subtitle overlay.
4. Subtitles fade after 5 seconds of inactivity.

---

## 🔐 Authentication & Security

- **Password Hashing:** All passwords are hashed using `bcryptjs` with 10 salt rounds before being stored in MongoDB. Plaintext passwords are never persisted.
- **JWT Authentication:** On login/signup, a signed JSON Web Token is returned. The token contains the user's MongoDB `_id` and expires based on `JWT_EXPIRES_IN` (configured in `.env`).
- **Server-Side Validation:** On every app load, `AuthContext` silently calls `GET /api/auth/profile` with the stored token. If the server returns 401, the session is cleared. This prevents role spoofing via modified `localStorage`.
- **Protected Middleware:** All private API routes use the `protect` middleware, which extracts the token from the `Authorization: Bearer <token>` header and attaches `req.user` to the request.
- **Role-Protected Routes:** The frontend `RoleProtectedRoute` component checks that the server-confirmed role matches the required role for each route group (`patient` | `doctor` | `any`).

---

## 🔧 Environment Variables

### `frontend/.env`

```env
VITE_API_URL=http://localhost:5001/api
VITE_AGORA_APP_ID=your_agora_app_id
VITE_GROQ_API_KEY=your_groq_api_key
```

### `backend/.env`

```env
PORT=5001
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=30d
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v20+ and npm
- A MongoDB Atlas account (free tier available)
- Agora.io account (for video consultation App ID)
- Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd "Telemedicine Triage"
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `/backend` with the variables listed above, then start the server:

```bash
npm run dev
```

The backend will start at `http://localhost:5001`.

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in `/frontend` with the variables listed above, then start the dev server:

```bash
npm run dev
```

The frontend will start at `http://localhost:5173`.

---

## 📜 Scripts

### Frontend (`frontend/`)

| Command | Description |
|---|---|
| `npm run dev` | Start Vite development server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint checks |

### Backend (`backend/`)

| Command | Description |
|---|---|
| `npm run dev` | Start server with `--watch` flag (auto-restart on changes) |
| `npm start` | Start production server |

---

## 👤 Authors

Built with ❤️ by TANISH CHAUDHARI sas a full-stack telemedicine solution demonstrating real-time WebSocket communication, AI-powered medical triage, and live video consultation — all within a single, production-ready monorepo.

---

*CareConnect AI — Connecting Patients and Doctors, Instantly.*
