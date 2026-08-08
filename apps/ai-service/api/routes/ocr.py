from fastapi import APIRouter, UploadFile
from ocr.medicine_ocr import extract_text

router = APIRouter()

@router.post("/ocr")
async def read_prescription(file: UploadFile):

    temp_path = file.filename

    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())

    text = extract_text(temp_path)

    return {
        "text": text
    }