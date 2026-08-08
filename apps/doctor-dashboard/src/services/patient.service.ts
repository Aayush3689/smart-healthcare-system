import { Patient } from '../types';
import { mockPatients } from '../data/mockPatients';

export const patientService = {
  async getAll(): Promise<Patient[]> {
    await new Promise((res) => setTimeout(res, 300));
    const stored = localStorage.getItem('healthai_patients');
    return stored ? JSON.parse(stored) : mockPatients;
  },

  async getById(id: string): Promise<Patient | undefined> {
    const patients = await this.getAll();
    return patients.find((p) => p.id === id);
  }
};