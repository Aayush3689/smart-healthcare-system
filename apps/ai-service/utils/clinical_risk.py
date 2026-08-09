def calculate_clinical_risk(patient):

    score = 0
    reasons = []

    # =====================
    # VITAL SIGNS
    # =====================

    systolic = patient.get("Systolic_BP", 0)
    diastolic = patient.get("Diastolic_BP", 0)
    oxygen = patient.get("Oxygen", 100)
    heart_rate = patient.get("Heart_Rate", 70)
    temperature = patient.get("Temperature", 98.6)

    if systolic >= 180 or diastolic >= 120:
        score += 40
        reasons.append("Severely Elevated Blood Pressure")

    elif systolic >= 140 or diastolic >= 90:
        score += 20
        reasons.append("High Blood Pressure")

    if oxygen < 90:
        score += 40
        reasons.append("Low Oxygen Saturation")

    elif oxygen < 95:
        score += 20
        reasons.append("Reduced Oxygen Saturation")

    if heart_rate > 120:
        score += 20
        reasons.append("High Heart Rate")

    elif heart_rate < 50:
        score += 20
        reasons.append("Low Heart Rate")

    if temperature >= 102:
        score += 20
        reasons.append("High Fever")

    # =====================
    # SYMPTOMS
    # =====================

    symptoms = [
        s.lower()
        for s in patient.get("symptoms", [])
    ]

    HIGH_RISK = [
        "chest pain",
        "shortness of breath",
        "stroke",
        "heart attack",
        "fainting",
        "unconscious"
    ]

    MEDIUM_RISK = [
        "swelling",
        "dizziness",
        "headache",
        "fatigue",
        "persistent cough"
    ]

    for symptom in symptoms:

        if symptom in HIGH_RISK:
            score += 30
            reasons.append(symptom)

        elif symptom in MEDIUM_RISK:
            score += 15
            reasons.append(symptom)

    # =====================
    # MEDICAL HISTORY
    # =====================

    history = [
        h.lower()
        for h in patient.get("medical_history", [])
    ]

    for item in history:

        if item in [
            "heart disease",
            "stroke",
            "kidney disease"
        ]:
            score += 20
            reasons.append(item)

        elif item in [
            "diabetes",
            "hypertension",
            "asthma"
        ]:
            score += 10
            reasons.append(item)

    # =====================
    # CURRENT MEDICATIONS
    # =====================

    medications = patient.get(
        "current_medications",
        []
    )

    if len(medications) > 0:
        score += 10
        reasons.append(
            "Currently Taking Medication"
        )

    # =====================
    # FINAL RISK
    # =====================

    if score >= 80:
        level = "CRITICAL"

    elif score >= 50:
        level = "HIGH"

    elif score >= 25:
        level = "MEDIUM"

    else:
        level = "LOW"

    return {
        "clinical_score": score,
        "clinical_risk": level,
        "clinical_reasons": reasons
    }