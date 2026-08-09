import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { toast } from '../../utils/toast';
import { Activity, ShieldAlert, ArrowRight, HeartPulse, Mail, KeyRound, ArrowLeft } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      toast.success(await authService.requestOtp(email));
      setOtpRequested(true);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'We could not send a verification code.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const user = await authService.verifyOtp(email, otp);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'doctor' ? '/doctor' : '/admin', { replace: true });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'The verification code is invalid or expired.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <div className="lg:w-1/2 bg-[#0D47A1] text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#1976D2] flex items-center justify-center shadow-xl"><Activity className="w-7 h-7" /></div>
            <div><h1 className="text-2xl font-bold tracking-tight">HealthAI</h1><p className="text-xs text-blue-200 font-medium">Healthcare Intelligence Platform</p></div>
          </div>
          <div className="mt-16 lg:mt-24 max-w-lg">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-600/50 text-blue-100 border border-blue-400/30 mb-4"><HeartPulse className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />Rural Healthcare Support System</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight">AI-powered decision support for early risk detection.</h2>
            <p className="mt-4 text-blue-100/90 text-sm leading-relaxed">Assisting ASHA workers and PHC doctors in identifying disease risks earlier and expediting life-saving referrals.</p>
            <div className="mt-8 p-4 rounded-xl bg-blue-900/40 border border-blue-400/20 text-xs text-blue-200 flex items-start gap-3"><ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" /><p><strong>Clinical Note:</strong> HealthAI acts purely as an assistive AI decision-support system. Final diagnostic decisions rest with qualified medical professionals.</p></div>
          </div>
        </div>
        <div className="relative z-10 mt-12 pt-6 border-t border-blue-800/60 text-xs text-blue-300">Intelligent Healthcare. Earlier Intervention. © 2026 HealthAI</div>
      </div>

      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-2xl font-bold text-slate-900">{otpRequested ? 'Verify your email' : 'Sign In'}</h3>
          <p className="text-sm text-slate-500 mt-1">{otpRequested ? 'Enter the code we sent to continue.' : 'Access your healthcare dashboard portal.'}</p>
          <div className="mt-6 p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-slate-600 flex gap-2">
            {otpRequested ? <KeyRound className="w-4 h-4 text-[#1976D2] shrink-0" /> : <Mail className="w-4 h-4 text-[#1976D2] shrink-0" />}
            <p>{otpRequested ? `Enter the six-digit code sent to ${email}.` : 'Use your registered email to receive a secure one-time verification code.'}</p>
          </div>
          <form onSubmit={otpRequested ? handleVerifyOtp : handleRequestOtp} className="mt-6 space-y-4">
            <div><label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={otpRequested || loading} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2] outline-none disabled:opacity-70" /></div>
            {otpRequested && <div><label className="block text-xs font-semibold text-slate-700 mb-1">Verification Code</label><input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm tracking-[0.45em] focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2] outline-none" /></div>}
            {otpRequested && <button type="button" onClick={() => { setOtpRequested(false); setOtp(''); }} className="text-xs text-[#1976D2] hover:text-[#0D47A1] font-medium flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" />Use a different email</button>}
            <button type="submit" disabled={loading} className="w-full mt-2 py-3 px-4 bg-[#1976D2] hover:bg-[#0D47A1] text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50">
              {loading ? (otpRequested ? 'Verifying...' : 'Sending code...') : <><span>{otpRequested ? 'Verify & Sign In' : 'Send Verification Code'}</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const response = (error as { response?: { data?: { message?: string } } })?.response;
  return response?.data?.message || (error instanceof Error ? error.message : fallback);
};
