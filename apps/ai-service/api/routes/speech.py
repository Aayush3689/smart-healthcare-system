from fastapi import APIRouter, UploadFile
from speech.speech_to_text import speech_to_text

router = APIRouter()

@router.post("/speech")
async def transcribe_audio(file: UploadFile):

    temp_path = file.filename

    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())

    text = speech_to_text(temp_path)

    return {
        "text": text
    }