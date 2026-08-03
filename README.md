<img width="1114" height="744" alt="image" src="https://github.com/user-attachments/assets/378269f6-c337-4b72-97ee-d78e5b6dfb8e" />

# Integrated Dental Record System (IDRS) — Frontend

## 📌 Overview
IDRS is a full-stack clinical information system built for dentists to manage patient records, perform structured dental examinations, and digitize the dental charting process end-to-end. This repository contains the **frontend web application**, a single-page app that dentists and staff use to register patients, run guided examinations, and review results.

This is a senior software engineering project developed for a real clinical workflow, replacing paper-based dental charts with a structured, auditable digital record.

## ✨ Key Features
- **Authentication & session handling** — login/registration flow backed by Supabase Auth, with protected and public route guards so only authenticated staff can reach patient data.
- **Patient management** — patient list, search, new patient intake form, and individual patient profile/detail views.
- **Interactive Odontogram** — a custom-built, click-through digital tooth chart (odontogram) for recording per-tooth conditions (caries, fillings, implants, extractions, periodontal status, etc.), with a guided wizard flow and multi-language labels.
- **Structured clinical forms** — dedicated forms for Medical History, Extraoral Examination, Esthetic Evaluation, Occlusal Analysis, Residual Ridge Assessment, and VDO (vertical dimension) Evaluation — turning traditionally paper-based dental charting into validated digital forms.
- **Facial & esthetic analysis tools** — supporting visual components for facial symmetry, facial profile, and facial muscle charting used during esthetic evaluation.
- **AI Analysis workflow** — a dedicated page for reviewing AI-assisted detection results as part of the diagnostic process.
- **UX polish** — toast notifications, confirmation modals, unsaved-changes guard dialogs, and a shared app layout/navigation shell.

## 🛠️ Tech Stack
| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript, built with Vite |
| Routing | React Router v7 |
| State management | Zustand |
| Styling | Tailwind CSS v4, Radix UI / Base UI primitives, `class-variance-authority` |
| Animation | Framer Motion |
| Auth & Backend client | Supabase JS client, Axios (for the FastAPI backend) |
| Testing | Vitest + React Testing Library |
| Tooling | ESLint, TypeScript project references |

## 🏗️ Architecture (High Level)
```
Browser (React SPA)
   ├── Route Guards (Protected / Public) ── Zustand auth store
   ├── Pages: Landing / Auth / Patients / PatientEntry / PatientProfile / PatientDetail / AIAnalysis / Settings
   ├── Feature Components
   │     ├── Odontogram (interactive tooth chart + wizard)
   │     ├── Clinical Chart Forms (Medical History, Extraoral Exam, Esthetic Evaluation, Occlusal Analysis, etc.)
   │     └── Facial Analysis widgets (symmetry, profile, muscle chart)
   ├── Services layer (Axios) ─────────────► IDRS Backend (FastAPI REST API)
   └── Supabase client ─────────────────────► Supabase Auth (JWT session)
```
The frontend is a pure client-side SPA: it authenticates directly against Supabase, then talks to the FastAPI backend (see the companion **IDRS-Backend** repository) for all patient and clinical-record CRUD operations, sending the Supabase-issued JWT on each request.

## 🔗 Related Repository
- Backend API: `IDRS-Backend` (FastAPI + PostgreSQL + Supabase)

## 📸 Screenshots
<img width="578" height="428" alt="image" src="https://github.com/user-attachments/assets/b63ee62f-9824-48f7-9b45-26b01080d7bc" />
<img width="1400" height="738" alt="image" src="https://github.com/user-attachments/assets/30826d37-9c1c-415a-88c1-f660ce0774e9" />
<img width="914" height="699" alt="image" src="https://github.com/user-attachments/assets/60ca757d-0450-48bc-9fe2-e90b3f979c99" />
<img width="1400" height="737" alt="image" src="https://github.com/user-attachments/assets/84dcb070-49d4-4c71-acbc-7b5fdf6f3de5" />
<img width="1397" height="732" alt="image" src="https://github.com/user-attachments/assets/96a479aa-8b0a-494f-86f7-81a3227ebae2" />
<img width="1392" height="726" alt="image" src="https://github.com/user-attachments/assets/cc0bdd1e-2c7d-47ed-a925-a4fde0772f82" />
<img width="1402" height="742" alt="image" src="https://github.com/user-attachments/assets/b75cf7bb-42d3-41c0-9728-259f3ee4a9fd" />







