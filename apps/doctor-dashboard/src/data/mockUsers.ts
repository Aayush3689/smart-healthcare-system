import { User } from '../types';

export const mockUsers: User[] = [
  {
    id: 'usr-1',
    name: 'Dr. Tariq Khan',
    email: 'doctor@healthai.com',
    role: 'doctor',
    specialization: 'General Medicine / Rural Public Health',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-2',
    name: 'Ananya Sharma',
    email: 'admin@healthai.com',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  }
];