import { Assessment } from '../types';
import { mockAssessments } from '../data/mockAssessments';

export const assessmentService = {
  async getAll(): Promise<Assessment[]> {
    await new Promise((res) => setTimeout(res, 300));
    return mockAssessments;
  }
};