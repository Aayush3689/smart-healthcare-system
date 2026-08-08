def get_risk_level(probability):

    if probability < 0.30:
        return "LOW"

    elif probability < 0.70:
        return "MEDIUM"

    return "HIGH"


def get_triage_action(risk_level):

    if risk_level == "LOW":
        return "Home Monitoring"

    elif risk_level == "MEDIUM":
        return "Schedule Doctor Consultation"

    return "Immediate Medical Attention"