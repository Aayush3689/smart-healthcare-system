import { Village, ASHAWorker, DashboardStats } from '../types';
import { mockVillages, mockAshaWorkers } from '../data/mockVillages';

export const adminService = {
  async getVillages(): Promise<Village[]> {
    await new Promise((res) => setTimeout(res, 300));
    return mockVillages;
  },

  async getAshaWorkers(): Promise<ASHAWorker[]> {
    await new Promise((res) => setTimeout(res, 300));
    return mockAshaWorkers;
  },

  async getStats(): Promise<DashboardStats> {
    return {
      totalPatients: 2480,
      highRiskPatients: 86,
      urgentCases: 7,
      activeReferrals: 24,
      assessmentsThisMonth: 428,
      totalVillages: 12,
      totalAshaWorkers: 48
    };
  }
};