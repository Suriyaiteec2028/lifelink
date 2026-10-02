import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Search,
  MapPin,
  Calendar,
  Clock,
  Phone,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Users,
  Send,
  ShieldAlert,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/apiClient';
import { LocationPicker } from '../components/LocationPicker';
import { StatusBadge } from '../components/StatusBadge';

const RADIUS_PRESETS = [5, 10, 20, 30, 50, 100];
const BLOOD_GROUPS = ['A+', 'A−', 'B+', 'B−', 'O+', 'O−', 'AB+', 'AB−'];

export const RequestBloodPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Blood Request Form State
  const [formData, setFormData] = useState({
    requiredBloodGroup: 'O+',
    unitsRequired: 1,
    requestAddress: '',
    requestLatitude: 13.0827,
    requestLongitude: 80.2707,
    searchRadiusKm: 50,
    requiredDate: '',
    requiredTime: '',
    contactPhone: '',
    additionalInformation: ''
  });

  // Auto-populate user details
  useEffect(() => {
    if (user) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      setFormData((prev) => ({
        ...prev,
        requestAddress: prev.requestAddress || user.locationAddress || 'Ramapuram, Chennai',
        requestLatitude: user.latitude || 13.0315,
        requestLongitude: user.longitude || 80.1818,
        contactPhone: prev.contactPhone || user.phone || '',
        requiredDate: tomorrow.toISOString().split('T')[0],
        requiredTime: '12:00'
      }));
    }
  }, [user]);

  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [selectedDonorIds, setSelectedDonorIds] = useState([]);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleLocationChange = ({ address, latitude, longitude }) => {
    setFormData((prev) => ({
      ...prev,
      requestAddress: address,
      requestLatitude: latitude,
      requestLongitude: longitude
    }));
  };

  const handleSearchDonors = async (e) => {
    e.preventDefault();
    if (!formData.requestAddress) {
      setError('Please provide or detect the request location address.');
      return;
    }

    try {
      setSearching(true);
      setError(null);
      setSearchResults(null);
      setSelectedDonorIds([]);

      const normalizedGroup = formData.requiredBloodGroup.replace('−', '-');

      const res = await api.searchDonors({
        requiredBloodGroup: normalizedGroup,
        requestLatitude: formData.requestLatitude,
        requestLongitude: formData.requestLongitude,
        searchRadiusKm: formData.searchRadiusKm
      });

      if (res.success) {
        setSearchResults(res);
        // Pre-select all matching donors by default
        setSelectedDonorIds(res.donors.map((d) => d.id));
      }
    } catch (err) {
      setError(err.message || 'Failed to search donors.');
    } finally {
      setSearching(false);
    }
  };

  const toggleDonorSelection = (donorId) => {
    setSelectedDonorIds((prev) =>
      prev.includes(donorId) ? prev.filter((id) => id !== donorId) : [...prev, donorId]
    );
  };

  const handleSelectAll = () => {
    if (!searchResults) return;
    if (selectedDonorIds.length === searchResults.donors.length) {
      setSelectedDonorIds([]);
    } else {
      setSelectedDonorIds(searchResults.donors.map((d) => d.id));
    }
  };

  const handleCreateAndSend = async () => {
    if (selectedDonorIds.length === 0) {
      setError('Please select at least one donor to send request invitations to.');
      return;
    }

    try {
      setSubmittingRequest(true);
      setError(null);

      const normalizedGroup = formData.requiredBloodGroup.replace('−', '-');

      // 1. Create request
      const createRes = await api.createRequest({
        ...formData,
        requiredBloodGroup: normalizedGroup
      });

      const requestId = createRes.request._id;

      // 2. Send invitations to selected donors
      const invRes = await api.sendInvitations(requestId, selectedDonorIds);

      setSuccessMsg(`Blood request created and invitations sent to ${invRes.sentCount} donor(s)!`);
      setTimeout(() => {
        navigate('/my-requests');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to submit blood request.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Request Blood & Search Donors</h1>
        <p className="mt-1 text-xs text-slate-500">
          Find matching donors within a custom radius and dispatch urgent blood donation invitations.
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

      {/* Main Request Form */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-slate-200">
        <form onSubmit={handleSearchDonors} className="space-y-6">
          {/* Section: Requester Info Readout */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Requester Profile (Auto-Populated)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Name:</span>
                <p className="font-semibold text-slate-900">{user?.fullName}</p>
              </div>
              <div>
                <span className="text-slate-400">Age:</span>
                <p className="font-semibold text-slate-900">{user?.age} years</p>
              </div>
              <div>
                <span className="text-slate-400">Your Blood Group:</span>
                <p className="font-bold text-red-600">{user?.bloodGroup}</p>
              </div>
            </div>
          </div>

          {/* Section: Blood Needs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Required Blood Group <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.requiredBloodGroup}
                onChange={(e) => setFormData({ ...formData, requiredBloodGroup: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-red-600 bg-white focus:ring-2 focus:ring-red-500 outline-none"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Units Required <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={formData.unitsRequired}
                onChange={(e) => setFormData({ ...formData, unitsRequired: parseInt(e.target.value, 10) || 1 })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>
          </div>

          {/* Section: Request Location with GPS */}
          <LocationPicker
            address={formData.requestAddress}
            latitude={formData.requestLatitude}
            longitude={formData.requestLongitude}
            onChange={handleLocationChange}
            label="Hospital / Delivery Location"
            required={true}
          />

          {/* Section: Custom Search Radius in Kilometres */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Search Radius: <span className="font-black text-red-600">{formData.searchRadiusKm} km</span>
              </label>
              <span className="text-[11px] text-slate-400">Custom Distance Allowed</span>
            </div>

            {/* Radius Preset Pills */}
            <div className="flex flex-wrap gap-2 mb-3">
              {RADIUS_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setFormData({ ...formData, searchRadiusKm: preset })}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${
                    formData.searchRadiusKm === preset
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {preset} km
                </button>
              ))}
            </div>

            {/* Custom Input & Slider */}
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={200}
                value={formData.searchRadiusKm}
                onChange={(e) => setFormData({ ...formData, searchRadiusKm: Number(e.target.value) })}
                className="w-full accent-red-600 cursor-pointer"
              />
              <div className="w-24 shrink-0 flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={formData.searchRadiusKm}
                  onChange={(e) => setFormData({ ...formData, searchRadiusKm: Number(e.target.value) || 1 })}
                  className="w-16 px-2 py-1 text-center font-bold text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-red-500 outline-none"
                />
                <span className="text-xs text-slate-500 font-medium">km</span>
              </div>
            </div>
          </div>

          {/* Section: Date, Time & Contact Number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Required Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={formData.requiredDate}
                onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Required Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.requiredTime}
                onChange={(e) => setFormData({ ...formData, requiredTime: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Mobile <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+91 98401 23456"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>
          </div>

          {/* Section: Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Additional Information (Optional)
            </label>
            <textarea
              rows={2}
              value={formData.additionalInformation}
              onChange={(e) => setFormData({ ...formData, additionalInformation: e.target.value })}
              placeholder="e.g., Surgery scheduled in Room 304, contact Dr. Nathan on arrival..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>

          {/* Search Donors Button */}
          <button
            type="submit"
            disabled={searching}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-md shadow-red-200 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {searching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching Eligible Donors via Haversine Engine...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search Eligible Donors</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Search Results Display */}
      {searchResults && (
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Matching Donors ({searchResults.count})
              </h2>
              <p className="text-xs text-slate-500">
                Filtered by RBC compatibility ({searchResults.searchCriteria.compatibleGroups.join(', ')}) &bull; Within {searchResults.searchCriteria.searchRadiusKm} km
              </p>
            </div>

            {searchResults.count > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  {selectedDonorIds.length === searchResults.donors.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            )}
          </div>

          {/* Privacy Note */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              <strong>Privacy Protection:</strong> Exact addresses and direct mobile numbers of donors are kept private until an invitation is accepted.
            </span>
          </div>

          {/* Empty State */}
          {searchResults.count === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700 text-sm">
                No eligible donors found within your selected radius.
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                You can increase the search distance (e.g. to 50 km or 100 km) or change the request location to broaden the search.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.donors.map((donor) => {
                const isSelected = selectedDonorIds.includes(donor.id);
                return (
                  <div
                    key={donor.id}
                    onClick={() => toggleDonorSelection(donor.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3.5 ${
                      isSelected
                        ? 'bg-red-50/50 border-red-300 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by parent onClick
                      className="mt-1 w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-slate-900 truncate">{donor.fullName}</h4>
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-extrabold text-xs">
                          {donor.bloodGroup}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                        <span>{donor.age} yrs</span>
                        <span>&bull;</span>
                        <span className="font-bold text-slate-700">~{donor.distanceKm} km away</span>
                      </div>

                      <p className="mt-1 text-[11px] text-slate-500 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{donor.approximateArea}</span>
                      </p>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">
                          {donor.totalDonations} previous donation(s)
                        </span>
                        <StatusBadge status="Active" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Bar when Donors found */}
          {searchResults.count > 0 && (
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-600">
                <strong>{selectedDonorIds.length}</strong> donor(s) selected for invitation
              </span>

              <button
                type="button"
                onClick={handleCreateAndSend}
                disabled={submittingRequest || selectedDonorIds.length === 0}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-md shadow-red-200 transition disabled:opacity-50"
              >
                {submittingRequest ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Invitations...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Blood Request to {selectedDonorIds.length} Donor(s)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
