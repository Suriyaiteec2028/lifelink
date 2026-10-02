import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save
} from 'lucide-react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { LocationPicker } from '../components/LocationPicker';
import { StatusBadge } from '../components/StatusBadge';

const BLOOD_GROUPS = ['A+', 'A−', 'B+', 'B−', 'O+', 'O−', 'AB+', 'AB−'];

export const ProfilePage = () => {
  const { user, refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    bloodGroup: 'O+',
    locationAddress: '',
    latitude: 13.0827,
    longitude: 80.2707
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        email: user.email || '',
        bloodGroup: user.bloodGroup || 'O+',
        locationAddress: user.locationAddress || '',
        latitude: user.latitude || 13.0827,
        longitude: user.longitude || 80.2707
      });
    }
  }, [user]);

  const handleLocationChange = ({ address, latitude, longitude }) => {
    setFormData((prev) => ({
      ...prev,
      locationAddress: address,
      latitude,
      longitude
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const normalizedGroup = formData.bloodGroup.replace('−', '-');

      const res = await api.updateProfile({
        fullName: formData.fullName,
        phone: formData.phone,
        bloodGroup: normalizedGroup,
        locationAddress: formData.locationAddress,
        latitude: formData.latitude,
        longitude: formData.longitude
      });

      if (res.success) {
        setSuccessMsg('Profile updated successfully.');
        await refreshUser();
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Profile</h1>
        <p className="mt-1 text-xs text-slate-500">
          Manage your personal details, blood group, and residential base coordinates.
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

      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Account Status Badge */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-lg shadow-xs">
                {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{user?.fullName}</h3>
                <p className="text-xs text-slate-500">{user?.age} years old &bull; Verified Account</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 block mb-1">Donor Status</span>
              <StatusBadge status={user?.donorStatus || 'Active'} />
            </div>
          </div>

          {/* Full Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Email & Blood Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered Email (Verified)
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="block w-full pl-9 pr-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg text-sm cursor-not-allowed outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-red-600 bg-white focus:ring-2 focus:ring-red-500 outline-none"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location with GPS and Manual Selection */}
          <div className="pt-2 border-t border-slate-100">
            <LocationPicker
              address={formData.locationAddress}
              latitude={formData.latitude}
              longitude={formData.longitude}
              onChange={handleLocationChange}
              label="Saved Home / Base Location"
            />
          </div>

          {/* Save Button */}
          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-sm shadow-red-200 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
