from fastapi import APIRouter
from utils.clinical_risk import calculate_clinical_risk

router = APIRouter()

@router.post("/clinical-risk")
def clinical_risk(patient: dict):

    result = calculate_clinical_risk(patient)

    return result