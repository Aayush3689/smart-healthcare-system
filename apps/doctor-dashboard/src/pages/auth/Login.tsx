import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { toast } from '../../utils/toast';
import { Role } from '../../types';
import { Activity, Stethoscope, ShieldAlert, ArrowRight, HeartPulse } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('doctor@healthai.com');
  const [password, setPassword] = useState('doctor123');
  const [role, setRole] = useState<Role>('doctor');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { user } = await authService.login(email, role);
      toast.success(`Welcome back, ${user.name}!`);
      if (role === 'doctor') {
        navigate('/doctor');
      } else {
        navigate('/admin');
      }
    } catch (error) {
      toast.error('Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (selectedRole: Role) => {
    if (selectedRole === 'doctor') {
      setEmail('doctor@healthai.com');
      setPassword('doctor123');
      setRole('doctor');
    } else {
      setEmail('admin@healthai.com');
      setPassword('admin123');
      setRole('admin');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <div className="lg:w-1/2 bg-[#0D47A1] text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#1976D2] flex items-center justify-center shadow-xl">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">HealthAI</h1>
              <p className="text-xs text-blue-200 font-medium">Healthcare Intelligence Platform</p>
            </div>
          </div>

          <div className="mt-16 lg:mt-24 max-w-lg">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-600/50 text-blue-100 border border-blue-400/30 mb-4">
              <HeartPulse className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              Rural Healthcare Support System
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight">
              AI-powered decision support for early risk detection.
            </h2>
            <p className="mt-4 text-blue-100/90 text-sm leading-relaxed">
              Assisting ASHA workers and PHC doctors in identifying disease risks earlier and expediting life-saving referrals.
            </p>

            <div className="mt-8 p-4 rounded-xl bg-blue-900/40 border border-blue-400/20 text-xs text-blue-200 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p>
                <strong>Clinical Note:</strong> HealthAI acts purely as an assistive AI decision-support system. Final diagnostic decisions rest with qualified medical professionals.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-12 pt-6 border-t border-blue-800/60 text-xs text-blue-300">
          Intelligent Healthcare. Earlier Intervention. © 2026 HealthAI
        </div>
      </div>

      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Sign In</h3>
            <p className="text-sm text-slate-500 mt-1">Access your healthcare dashboard portal.</p>
          </div>

          <div className="mt-6 p-3 bg-blue-50/70 rounded-xl border border-blue-100">
            <span className="text-xs font-bold text-slate-700 block mb-2">⚡ Quick Demo Login Buttons:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('doctor')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                  role === 'doctor'
                    ? 'bg-[#1976D2] text-white border-[#1976D2] shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Doctor Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                  role === 'admin'
                    ? 'bg-[#0D47A1] text-white border-[#0D47A1] shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Admin Demo
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Portal Role</label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                    role === 'doctor'
                      ? 'border-[#1976D2] bg-blue-50/50 text-[#1976D2]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    checked={role === 'doctor'}
                    onChange={() => setRole('doctor')}
                    className="sr-only"
                  />
                  <Stethoscope className="w-4 h-4" /> Doctor Role
                </label>
                <label
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                    role === 'admin'
                      ? 'border-[#1976D2] bg-blue-50/50 text-[#1976D2]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    checked={role === 'admin'}
                    onChange={() => setRole('admin')}
                    className="sr-only"
                  />
                  <Activity className="w-4 h-4" /> Admin Role
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-[#1976D2] hover:bg-[#0D47A1] text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};