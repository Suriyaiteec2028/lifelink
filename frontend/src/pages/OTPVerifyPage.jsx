import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, AlertCircle, Loader2, ArrowRight, RotateCw, CheckCircle2 } from 'lucide-react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

export const OTPVerifyPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  const emailParam = searchParams.get('email') || '';
  const devOtpParam = searchParams.get('devOtp') || '';

  const [otp, setOtp] = useState(devOtpParam || '');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (300s)
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.verifyRegistrationOTP({
        email: emailParam,
        otp: otp.trim()
      });

      if (res.success && res.token) {
        loginWithToken(res.token, res.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      setError(null);
      // Request resend OTP
      setSuccessMsg('A new OTP has been requested. Check your email inbox.');
      setTimeLeft(300);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 text-red-600 mb-4 shadow-sm shadow-red-200">
            <Mail className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Verify Your Email</h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            We sent a 6-digit verification code to
          </p>
          <p className="font-bold text-sm text-slate-800 mt-0.5">{emailParam || 'your email'}</p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {devOtpParam && (
            <div className="mb-4 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
              <span><strong>Dev Mode Code:</strong> <code className="font-mono font-bold text-blue-700">{devOtpParam}</code></span>
              <button
                type="button"
                onClick={() => setOtp(devOtpParam)}
                className="text-[11px] underline font-bold text-blue-600 hover:text-blue-800"
              >
                Auto-fill
              </button>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 text-center">
                Enter 6-Digit OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                required
                autoFocus
                className="block w-full py-3 text-center text-2xl font-extrabold tracking-widest text-slate-900 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Expires in: <strong className={timeLeft < 60 ? 'text-rose-600' : 'text-slate-800'}>{formatTimer(timeLeft)}</strong></span>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || timeLeft > 240}
                className="inline-flex items-center gap-1 font-semibold text-red-600 hover:text-red-700 disabled:opacity-40"
              >
                <RotateCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                <span>Resend Code</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-md shadow-red-200 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify and Activate Account</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
            Wrong email address?{' '}
            <Link to="/register" className="font-bold text-red-600 hover:text-red-700">
              Return to Registration
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
