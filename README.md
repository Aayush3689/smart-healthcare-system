# 🏥 Healthcare AI Platform

An AI-powered rural healthcare platform built to assist ASHA workers, doctors, and healthcare administrators in identifying high-risk patients through early disease prediction and intelligent health assessments.

The platform enables offline-first patient screening, AI-assisted clinical risk analysis, OCR-based prescription extraction, voice-assisted patient data collection, and centralized healthcare dashboards for doctors and public health centers.

---

# 🚀 Live Demo

## 🌐 Web Portal

https://health.aayushkandhwe.com/

---

## 📱 Download Android APK (ASHA Worker App)

https://drive.google.com/file/d/17aCRnbYld5k1sg3-pBndjya89G5_pceI/view?usp=drivesdk

> Download the APK, install it on an Android device, and start using the ASHA Worker application.

---

# 🎯 Problem Statement

Rural healthcare workers often face challenges such as:

- Lack of specialist doctors in remote villages
- Delayed disease detection
- Poor health record management
- Limited internet connectivity
- Manual patient screening processes

Healthcare AI Platform solves these challenges by providing an AI-powered healthcare assistant that works even in low-connectivity environments.

---

# ✨ Key Features

## 👩‍⚕️ ASHA Worker Mobile App

- Patient Registration
- Patient Health Assessment
- Offline Data Collection
- AI Disease Prediction
- Clinical Risk Assessment
- Voice-Based Data Entry
- OCR-Based Prescription Scanning
- Patient History Tracking
- Automatic Sync when Internet is Available

---

## 🤖 AI-Powered Healthcare Intelligence

### Disease Prediction

- Diabetes Risk Prediction
- Heart Disease Risk Prediction
- Hypertension Risk Prediction

### Clinical Risk Engine

- Low Risk Detection
- Moderate Risk Detection
- High Risk Detection
- Critical Patient Identification

### Explainable AI

- Risk Score Generation
- Clinical Findings
- Recommendations
- Triage Action Suggestions

---

## 📄 OCR Prescription Analysis

Upload or capture:

- Prescriptions
- Lab Reports
- Medical Documents

Extract:

- Medicines
- Observations
- Clinical Notes

---

## 🎙 Speech-to-Text Support

Allows ASHA workers to:

- Record patient symptoms
- Capture spoken assessments
- Convert speech into structured text

---

## 👨‍⚕️ Doctor Dashboard

- Patient Review
- AI Risk Insights
- Clinical Recommendations
- Referral Management
- Follow-Up Monitoring

---

## 🏥 PHC / Admin Dashboard

- Population Health Analytics
- Village-Level Insights
- Disease Trends
- Healthcare Worker Monitoring
- Referral Tracking

---

# 🏗 System Architecture

```text
Healthcare AI Platform

├── Mobile Application (ASHA Worker)
│
├── Backend API
│
├── AI Prediction Engine
│
├── OCR Service
│
├── Speech Processing Service
│
├── Doctor Dashboard
│
└── Admin Dashboard
```

---

# 📂 Project Structure

```text
healthcare-ai-platform/

├── apps/
│
│   ├── backend/
│   │
│   ├── ai-service/
│   │
│   ├── mobile-app/
│   │
│   ├── doctor-dashboard/
│   │
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

# 🛠 Technology Stack

## Mobile Application

- React Native
- Expo
- TypeScript

---

## Backend

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- Redis

---

## Artificial Intelligence

- FastAPI
- Scikit-Learn
- XGBoost
- LightGBM
- ONNX Runtime
- SHAP

---

## OCR & Speech

- PaddleOCR
- Whisper

---

## Infrastructure

- Docker
- Docker Compose
- GitHub Actions
- AWS

---

# 🔐 Security Features

- JWT Authentication
- Role-Based Access Control
- Secure API Communication
- Protected Patient Data
- Offline Secure Storage

---

# 🌍 Offline-First Capability

The mobile application is designed for rural environments where internet connectivity may be unreliable.

Features include:

- Local patient storage
- Offline assessments
- Offline AI predictions
- Background synchronization
- Conflict resolution

---

# 📊 AI Workflow

```text
Patient Assessment
        │
        ▼
Collect Symptoms
        │
        ▼
AI Risk Prediction
        │
        ▼
Clinical Risk Analysis
        │
        ▼
Recommendations
        │
        ▼
Doctor Referral (if required)
```

---

# 👥 User Roles

## ASHA Worker

- Register Patients
- Conduct Assessments
- Upload Prescriptions
- Record Symptoms
- Generate AI Predictions

---

## Doctor

- Review Patients
- Analyze AI Reports
- Provide Recommendations
- Manage Referrals

---

## Administrator

- Monitor Healthcare Programs
- View Analytics
- Manage Users
- Track Healthcare Outcomes

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/Aayush3689/smart-healthcare-system.git
```

```bash
cd smart-healthcare-system
```

---

## Install Dependencies

```bash
npm install
```

---

## Run Backend

```bash
cd apps/backend
npm install
npm run dev
```

---

## Run Mobile App

```bash
cd apps/mobile-app
npm install
npm start
```

---

## Run AI Service

```bash
cd apps/ai-service
pip install -r requirements.txt
uvicorn main:app --reload
```

---

# 📈 Future Enhancements

- Multilingual Support
- Telemedicine Integration
- Real-Time Video Consultation
- Wearable Device Integration
- Advanced Population Analytics
- AI-Based Treatment Suggestions
- Government Health Program Integration

---

# 👨‍💻 Contributors

- Aayush Kandhwe
- Sonia
- Healthcare AI Team

---

# 📄 License

This project was developed as part of a healthcare innovation hackathon and may be extended into a production-ready healthcare ecosystem.

---

# ❤️ Vision

Empowering rural healthcare workers with AI-driven tools to identify diseases early, improve patient outcomes, and bridge the healthcare accessibility gap across underserved communities.
