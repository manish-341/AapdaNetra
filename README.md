# 🛡️ AapdaNetra — AI Disaster Intelligence Platform

An end-to-end AI-powered disaster intelligence and emergency management system designed for disaster management authorities (NDMA/SDMA) and citizens across India.

---

## 🌟 Key Features

- **Real-Time Situation Awareness**: Live incident maps, active alert tracking, and multi-hazard monitoring (Flood, Landslide, Wildfire).
- **Vulnerable Habitations Intelligence**: Population risk profiling, infrastructure vulnerability scores, and priority relocation planning.
- **AI Emergency Assistant & Copilot**:
  - **Citizen Assistant**: Multilingual / Hinglish guidance with instant routing to the nearest trauma centers, relief shelters, and helplines.
  - **Responder Copilot**: Operational decision support powered by LLMs synthesizing live database context.
- **Machine Learning Microservice**:
  - **Risk Assessment**: Multi-hazard risk prediction using XGBoost and Random Forest models.
  - **Progression Forecasting**: 24-hour time-series forecasting via GRU neural networks.
  - **Vision Damage Detection**: YOLOv8-powered disaster scene and structural damage analysis.
  - **Report NLP Classifier**: Automatic citizen report triage and severity ranking.
- **Relief & Evacuation Network**: Shelter capacity tracking, available beds, and nearest facility allocation.

---

## 🏗️ Tech Stack

- **Frontend**: React 18, Vite, Material UI (MUI), Leaflet, Lucide Icons, Recharts
- **Backend**: Node.js, Express.js, MongoDB Atlas (Mongoose), JWT, Rate Limiting, Helmet
- **AI / ML Service**: Python 3.10+, FastAPI, PyTorch, YOLOv8, XGBoost, Scikit-learn
- **AI Engine**: OpenAI GPT-4o-mini with deterministic offline fallback

---

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
# Configure .env based on .env.example
node scripts/seed.js       # Seed core demo data
node scripts/seedGBN.js    # Seed district data
node server.js
```

### 2. Frontend Setup
```bash
cd frontend
npm install
# Configure .env based on .env.example
npm run dev
```

### 3. AI ML Microservice (Optional)
```bash
cd ai-services
pip install -r requirement.txt
uvicorn main:app --reload --port 8000
```

---

## 📄 License
This project is licensed under the ISC License.
