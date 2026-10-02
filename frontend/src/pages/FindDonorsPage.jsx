import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  Heart,
  Users,
  AlertCircle,
  PlusCircle,
  Loader2,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/apiClient';
import { LocationPicker } from '../components/LocationPicker';
import { StatusBadge } from '../components/StatusBadge';

const BLOOD_GROUPS = ['A+', 'A−', 'B+', 'B−', 'O+', 'O−', 'AB+', 'AB−'];

export const FindDonorsPage = () => {
  const { user } = useAuth();
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [radiusKm, setRadiusKm] = useState(50);
  const [location, setLocation] = useState({
    address: user?.locationAddress || 'Ramapuram, Chennai, Tamil Nadu',
    latitude: user?.latitude || 13.0315,
    longitude: user?.longitude || 80.1818
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const normalizedGroup = bloodGroup.replace('−', '-');
      const res = await api.searchDonors({
        requiredBloodGroup: normalizedGroup,
        requestLatitude: location.latitude,
        requestLongitude: location.longitude,
        searchRadiusKm: radiusKm
      });

      if (res.success) {
        setResults(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to search donors.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Find Blood Donors</h1>
          <p className="mt-1 text-xs text-slate-500">
            Search nearby eligible active donors by RBC blood compatibility and geographical distance.
          </p>
        </div>

        <Link
          to="/request-blood"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Full Request</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Filter Box */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Requested Blood Group
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
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
                Search Radius: <span className="text-red-600 font-bold">{radiusKm} km</span>
              </label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="range"
                  min={5}
                  max={200}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-full accent-red-600"
                />
                <span className="text-xs font-bold text-slate-700 w-12">{radiusKm} km</span>
              </div>
            </div>
          </div>

          <LocationPicker
            address={location.address}
            latitude={location.latitude}
            longitude={location.longitude}
            onChange={(loc) => setLocation(loc)}
            label="Search Origin Location"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-sm shadow-red-200 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching Donors...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search Available Donors</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results */}
      {results && (
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Found {results.count} Donor(s)
              </h2>
              <p className="text-xs text-slate-500">
                Compatible RBC groups: {results.searchCriteria.compatibleGroups.join(', ')}
              </p>
            </div>
          </div>

          {results.count === 0 ? (
            <div className="py-10 text-center text-slate-500">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 text-sm">
                No eligible donors found within your selected radius.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                You can increase the search distance or change the request location.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.donors.map((donor) => (
                <div key={donor.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900">{donor.fullName}</h3>
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-extrabold text-xs">
                      {donor.bloodGroup}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <span>{donor.age} yrs</span>
                    <span>&bull;</span>
                    <span className="font-bold text-slate-700">~{donor.distanceKm} km away</span>
                  </div>

                  <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{donor.approximateArea}</span>
                  </p>

                  <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">{donor.totalDonations} donations</span>
                    <Link
                      to="/request-blood"
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
                    >
                      Invite Donor
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
