import { User, Role } from '../types';
import { mockUsers } from '../data/mockUsers';

export const authService = {
  async login(email: string, role: Role): Promise<{ user: User; token: string }> {
    await new Promise((res) => setTimeout(res, 400));
    const matchedUser = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    
    const user: User = matchedUser || {
      id: `usr-${Date.now()}`,
      name: role === 'doctor' ? 'Dr. Tariq Khan' : 'Ananya Sharma',
      email,
      role,
      specialization: role === 'doctor' ? 'General Medicine' : undefined
    };

    const token = `mock_jwt_token_${user.id}_${Date.now()}`;
    localStorage.setItem('healthai_user', JSON.stringify(user));
    localStorage.setItem('healthai_auth_token', token);

    return { user, token };
  },

  getCurrentUser(): User | null {
    const raw = localStorage.getItem('healthai_user');
    return raw ? JSON.parse(raw) : null;
  },

  logout(): void {
    localStorage.removeItem('healthai_user');
    localStorage.removeItem('healthai_auth_token');
  }
};