from ocr.medicine_ocr import extract_text

text = extract_text(
    "sample_prescription.jpg"
)

print(text)