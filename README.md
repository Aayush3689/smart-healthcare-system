# 🏥 Healthcare AI Platform

An AI-powered rural healthcare platform designed to assist ASHA workers in identifying high-risk patients through early disease prediction. The platform enables offline-first patient assessments, AI-assisted risk analysis, OCR-based medical report extraction, voice-assisted data entry, and doctor dashboards for better clinical decision-making.

---

## 🚀 Features

- 📱 React Native mobile application for ASHA workers
- 🤖 AI-powered disease risk prediction
- 📄 OCR for laboratory reports and prescriptions
- 🎙 Voice-assisted patient assessment
- 🩺 Doctor dashboard
- 🏥 PHC/Admin dashboard
- 📊 Population analytics
- 🔄 Offline-first architecture with automatic synchronization
- 🔐 Secure authentication and role-based access control

---

## 🏗 Project Structure

```text
healthcare-ai-platform/

├── apps/
│   ├── backend/
│   ├── ai-service/
│   ├── mobile-app/
│   ├── doctor-dashboard/
│   └── admin-dashboard/
│
├── packages/
│
├── infrastructure/
│
├── docs/
│
├── scripts/
│
├── docker-compose.yml
│
└── README.md
```

---

## 🛠 Tech Stack

### Frontend

- React Native (Expo)
- React
- TypeScript

### Backend

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- Redis

### AI Service

- FastAPI
- Scikit-learn
- XGBoost / LightGBM
- SHAP
- PaddleOCR
- Whisper

### Infrastructure

- Docker
- Docker Compose
- GitHub Actions
- AWS

---

## 📁 Branch Strategy

```text
main
develop

feature/backend
feature/mobile
feature/dashboard
feature/ai
```

---

## 👥 Team Workflow

1. Create a feature branch.
2. Implement your assigned feature.
3. Commit changes with meaningful commit messages.
4. Open a Pull Request into `develop`.
5. After review, merge into `develop`.
6. Merge `develop` into `main` when stable.

---

## 📄 License

This project is developed for a hackathon and may be extended into a production-ready healthcare platform.
