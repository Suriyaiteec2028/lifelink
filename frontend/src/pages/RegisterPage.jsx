import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  Lock,
  Calendar,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Heart
} from 'lucide-react';
import { LocationPicker } from '../components/LocationPicker';
import { api } from '../api/apiClient';

const BLOOD_GROUPS = ['A+', 'A−', 'B+', 'B−', 'O+', 'O−', 'AB+', 'AB−'];

export const RegisterPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    bloodGroup: 'O+',
    dateOfBirth: '',
    locationAddress: '',
    latitude: 13.0827,
    longitude: 80.2707,
    password: '',
    confirmPassword: ''
  });

  const [ageDisplay, setAgeDisplay] = useState(null);
  const [ageError, setAgeError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate live age on DOB change
  const handleDobChange = (e) => {
    const dobValue = e.target.value;
    setFormData((prev) => ({ ...prev, dateOfBirth: dobValue }));

    if (!dobValue) {
      setAgeDisplay(null);
      setAgeError(null);
      return;
    }

    const birthDate = new Date(dobValue);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    setAgeDisplay(age);

    if (age < 18) {
      setAgeError('You must be at least 18 years old to create an account.');
    } else {
      setAgeError(null);
    }
  };

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
    setError(null);

    // Age validation
    if (ageDisplay !== null && ageDisplay < 18) {
      setError('You must be at least 18 years old to create an account.');
      return;
    }

    // Password match validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }

    if (!formData.locationAddress) {
      setError('Please provide or detect your location address.');
      return;
    }

    try {
      setLoading(true);

      // Normalize blood group hyphen: 'A−' -> 'A-'
      const normalizedGroup = formData.bloodGroup.replace('−', '-');

      const payload = {
        ...formData,
        bloodGroup: normalizedGroup
      };

      const res = await api.sendRegistrationOTP(payload);

      if (res.success) {
        // Navigate to OTP verification page with only the email parameter
        navigate(`/verify-otp?email=${encodeURIComponent(formData.email.trim())}`);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-red-600 text-white font-black text-xl shadow-md shadow-red-200">
              🩸
            </span>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900">
              Blood<span className="text-red-600">Donor</span>
            </span>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Donor & Requester Registration</h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            A single account allows you to donate blood, manage availability, and request blood when needed.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-slate-200">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs sm:text-sm text-rose-800">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Suriya Narayanan"
                    required
                    className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98401 23456"
                    required
                    className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                  required
                  className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                A verification OTP will be sent to this email to activate your account.
              </p>
            </div>

            {/* Blood Group & DOB with Live Age Check */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Blood Group <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 outline-none bg-white font-bold text-red-600"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  {ageDisplay !== null && (
                    <span
                      className={`text-xs font-bold ${
                        ageDisplay >= 18 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      Age: {ageDisplay} yrs {ageDisplay >= 18 ? '✓' : '✗'}
                    </span>
                  )}
                </div>
                <div className="relative rounded-lg shadow-xs">
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleDobChange}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                {ageError && (
                  <p className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{ageError}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Location with GPS and Manual Address */}
            <div className="pt-2 border-t border-slate-100">
              <LocationPicker
                address={formData.locationAddress}
                latitude={formData.latitude}
                longitude={formData.longitude}
                onChange={handleLocationChange}
                label="Home / Base Location Address"
                required={true}
              />
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                    className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Re-enter password"
                    required
                    minLength={6}
                    className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Terms notice */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                By registering, you confirm that you are at least 18 years old and agree to receive email notifications for matching blood requests. Your private mobile number will only be shared when you accept a request.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (ageDisplay !== null && ageDisplay < 18)}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-md shadow-red-200 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Verification Code...</span>
                </>
              ) : (
                <>
                  <span>Continue to Email Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-600">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-red-600 hover:text-red-700">
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
