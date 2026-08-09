import { Disease, RiskLevel } from "@prisma/client";
import { AppError } from "../../utils/app-error.js";

export interface AiPredictionResult {
  disease: Disease;
  prediction: boolean;
  probability: number;
  riskLevel: RiskLevel;
  triage: string;
  reasons: string[];
  modelVersion: string;
}

export class AiClient {
  public constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
  ) {}
  public async predict(input: {
    assessmentId: string;
    models: Disease[];
    features: Record<string, unknown>;
  }): Promise<AiPredictionResult[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(`${this.baseUrl}/internal/v1/predictions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`AI service returned ${response.status}`);
      const payload = (await response.json()) as { data?: { predictions?: AiPredictionResult[] } };
      if (!payload.data?.predictions) throw new Error("AI response did not contain predictions");
      return payload.data.predictions;
    } catch (error) {
      throw new AppError(
        error instanceof Error
          ? `Prediction service unavailable: ${error.message}`
          : "Prediction service unavailable.",
        503,
        "AI_SERVICE_UNAVAILABLE",
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
