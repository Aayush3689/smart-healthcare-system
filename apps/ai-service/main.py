from fastapi import FastAPI
from api.routes.clinical import router as clinical_router
from api.routes.predict import router as predict_router
from api.routes.ocr import router as ocr_router
from api.routes.speech import router as speech_router

app = FastAPI(
    title="Smart Healthcare AI"
)

app.include_router(predict_router)
app.include_router(ocr_router)
app.include_router(speech_router)
app.include_router(
    clinical_router,
    tags=["Clinical Risk"]
)