import { Referral } from '../types';
import { mockReferrals } from '../data/mockReferrals';

export const referralService = {
  async getAll(): Promise<Referral[]> {
    await new Promise((res) => setTimeout(res, 300));
    const stored = localStorage.getItem('healthai_referrals');
    return stored ? JSON.parse(stored) : mockReferrals;
  },

  async create(referralData: Omit<Referral, 'id' | 'createdAt' | 'status'>): Promise<Referral> {
    const referrals = await this.getAll();
    const newReferral: Referral = {
      ...referralData,
      id: `REF-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Pending',
      createdAt: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
    };

    const updated = [newReferral, ...referrals];
    localStorage.setItem('healthai_referrals', JSON.stringify(updated));
    return newReferral;
  }
};