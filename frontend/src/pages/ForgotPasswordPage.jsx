import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, KeyRound, AlertCircle, Loader2, CheckCircle2, ArrowRight, RotateCw, ArrowLeft } from 'lucide-react';
import { api } from '../api/apiClient';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP + New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your registered email address.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      const res = await api.forgotPassword({ email: email.trim() });
      if (res.success) {
        setOtp('');
        setStep(2);
        setSuccessMsg(res.message || `A password reset code has been sent to ${email}. Check your email inbox.`);
      }
    } catch (err) {
      setError(err.message || 'Failed to send password reset code. Please verify your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    try {
      setResending(true);
      setError(null);
      setSuccessMsg(null);
      const res = await api.resendOTP({ email: email.trim(), purpose: 'FORGOT_PASSWORD' });
      setSuccessMsg(res.message || `A new password reset code has been sent to ${email}. Check your inbox.`);
      setOtp('');
    } catch (err) {
      setError(err.message || 'Failed to resend reset code.');
    } finally {
      setResending(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      setError('Please enter the 6-digit code from your email and your new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
        confirmPassword
      });

      if (res.success) {
        setSuccessMsg('Your password has been successfully reset! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please verify your 6-digit code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-100 text-red-600 mb-3 shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Reset Your Password</h2>
          <p className="mt-1 text-xs text-slate-500">
            {step === 1 ? 'Enter your registered email to receive a secure reset code' : 'Verify the code sent to your email and choose a new password'}
          </p>
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

          {step === 1 ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    autoFocus
                    className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  A 6-digit verification code will be sent to this email address.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm shadow-sm shadow-red-200 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div>
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <strong>Email Sent:</strong> Verification code was sent to <strong>{email}</strong>. Check your inbox and spam folder.
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      6-Digit Code from Email <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="text-[11px] font-semibold text-red-600 hover:text-red-700 inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      <RotateCw className={`w-2.5 h-2.5 ${resending ? 'animate-spin' : ''}`} />
                      <span>Resend Code</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    required
                    autoFocus
                    className="block w-full text-center py-2.5 tracking-widest font-mono text-xl font-bold border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 outline-none placeholder:text-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-lg shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      minLength={6}
                      className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-lg shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                      minLength={6}
                      className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm shadow-sm shadow-red-200 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Resetting Password...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setOtp(''); setError(null); }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Change email address</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="mt-6 text-center text-xs text-slate-600 border-t border-slate-100 pt-4">
            Remember your credentials?{' '}
            <Link to="/login" className="font-bold text-red-600 hover:text-red-700">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
