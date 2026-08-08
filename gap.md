# API contract gaps and decisions

- Villages had no lifecycle field. `Village.isActive` was added; `DELETE` now soft-deactivates a village so patient and ASHA history remains intact.
- Assessments had no completion marker. `Assessment.completedAt` was added and is set by the complete endpoint.
- OCR execution, speech-to-text, and model prediction require external providers, but no provider URL, credentials, timeout, retry policy, or payload contract was supplied. Document upload and OCR state/extraction correction are implemented. Speech upload returns `503 SPEECH_PROVIDER_UNAVAILABLE` until a provider is configured. Assessment completion does not fabricate predictions.
- Uploaded documents are stored under `apps/backend/storage/uploads`. Production should replace this local disk adapter with object storage and a malware-scanning policy.
- Bidirectional sync changes are reserved by the contract but no server-side change cursor/version model exists. The endpoint currently returns an empty change set and echoes the cursor.
- The FastAPI `/internal/v1` prediction service is a separate application and is not present in this repository, so it was not invented inside the public Node API.
- List endpoints are capped at 100 records where applicable. A cursor contract was not provided; add one before production-scale rollout.
