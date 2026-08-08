import { Prediction } from '../types';
import { mockPredictions } from '../data/mockPredictions';

export const predictionService = {
  async getAll(): Promise<Prediction[]> {
    await new Promise((res) => setTimeout(res, 300));
    return mockPredictions;
  }
};