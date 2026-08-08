from fastapi import APIRouter

from inference.ai_service import (
    predict_diabetes,
    predict_heart,
    predict_hypertension
)

router = APIRouter()


@router.post("/predict/diabetes")
def diabetes(patient: dict):

    return predict_diabetes(patient)


@router.post("/predict/heart")
def heart(patient: dict):

    return predict_heart(patient)


@router.post("/predict/hypertension")
def hypertension(patient: dict):

    return predict_hypertension(patient)