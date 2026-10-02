import React, { useState, useEffect } from 'react';
import {
  ToggleRight,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';

export const DonorAvailabilityPage = () => {
  const { user, refreshUser } = useAuth();
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const res = await api.getAvailability();
      if (res.success) {
        setAvailability(res.availability);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch availability.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  const handleToggle = async (targetStatus) => {
    try {
      setUpdating(true);
      setError(null);
      setSuccessMsg(null);
      const res = await api.updateAvailability(targetStatus);
      if (res.success) {
        setSuccessMsg(res.message);
        setAvailability(res.availability);
        await refreshUser();
      }
    } catch (err) {
      setError(err.message || 'Failed to update donor availability.');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Donor Availability Management</h1>
        <p className="mt-1 text-xs text-slate-500">
          Control your matching status for emergency blood requests and monitor your clinical cooldown schedule.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs sm:text-sm text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-xs sm:text-sm text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Status Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Current Matching Status
            </span>
            <div className="mt-1 flex items-center gap-3">
              <StatusBadge status={availability?.donorStatus || user?.donorStatus || 'Active'} />
              <span className="text-xs text-slate-500">
                Blood Group: <strong className="text-red-600">{user?.bloodGroup}</strong>
              </span>
            </div>
          </div>

          {/* Toggle Buttons */}
          <div className="flex items-center gap-2">
            <button
              disabled={updating || availability?.inCooldown}
              onClick={() => handleToggle('Active')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                availability?.donorStatus === 'Active'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Active</span>
            </button>

            <button
              disabled={updating}
              onClick={() => handleToggle('Inactive')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                availability?.donorStatus === 'Inactive'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>Inactive</span>
            </button>
          </div>
        </div>

        {/* 6-Month Cooldown Banner (Section 14) */}
        {availability?.inCooldown && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Mandatory 6-Month Donation Cooldown Active</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              You recently accepted or completed a blood donation. To protect your health and allow full erythrocyte restoration, your donor status is locked until{' '}
              <strong className="text-amber-950 font-black">{formatDate(availability?.nextEligibleDate)}</strong>.
            </p>
            <p className="text-[11px] text-amber-700">
              Per portal safety protocols, you cannot activate your donor profile while within this cooldown period.
            </p>
          </div>
        )}

        {/* Status Explanation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>When Active:</span>
            </h4>
            <ul className="text-slate-600 space-y-1 list-disc list-inside">
              <li>Eligible to appear in nearby compatible donor searches</li>
              <li>Receive emergency email and in-app blood invitations</li>
              <li>Your contact number remains private until you accept</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span>When Inactive:</span>
            </h4>
            <ul className="text-slate-600 space-y-1 list-disc list-inside">
              <li>Hidden from new donor search results</li>
              <li>No new blood request invitations sent to you</li>
              <li>You can reactivate at any time when eligible</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
