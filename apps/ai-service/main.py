from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes.clinical import router as clinical_router
from api.routes.predict import router as predict_router
from api.routes.ocr import router as ocr_router
from api.routes.speech import router as speech_router

app = FastAPI(
    title="Smart Healthcare AI",
    version="1.0.0"
)

# ==========================================
# CORS Middleware
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],       # Allow GET, POST, PUT, DELETE, OPTIONS
    allow_headers=["*"],       # Allow all headers
)

# ==========================================
# Routes
# ==========================================
app.include_router(
    predict_router,
    tags=["Predictions"]
)

app.include_router(
    ocr_router,
    tags=["OCR"]
)

app.include_router(
    speech_router,
    tags=["Speech"]
)

app.include_router(
    clinical_router,
    tags=["Clinical Risk"]
)

# ==========================================
# Health Check
# ==========================================
@app.get("/")
def health_check():
    return {
        "status": "running",
        "service": "Smart Healthcare AI",
        "version": "1.0.0"
    }